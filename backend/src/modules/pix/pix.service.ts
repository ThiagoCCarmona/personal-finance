import { query, getClient } from '../../config/database.js';
import { gerarPayloadPix } from './pix.emv.js';
import { CriarChavePixInput, CriarCobrancaPixInput, ConfirmarCobrancaPixInput } from './pix.schema.js';
import { dividasService } from '../dividas/dividas.service.js';

export interface ChavePix {
  id: string;
  tipo: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  valor_chave: string;
  nome_recebedor: string;
  cidade_recebedor: string;
  apelido?: string;
  ativo: boolean;
  criado_em: string;
}

export interface CobrancaPixItem {
  id: string;
  chave_pix_id: string;
  tipo_chave: string;
  valor_chave: string;
  nome_recebedor: string;
  valor: number;
  mensagem?: string;
  txid: string;
  payload_emv: string;
  status: 'aguardando_confirmacao' | 'recebida' | 'cancelada';
  divida_id?: string;
  divida_motivo?: string;
  pessoa_nome?: string;
  data_criacao: string;
  data_confirmacao?: string;
}

export class PixService {
  async listarChaves(): Promise<ChavePix[]> {
    const res = await query<ChavePix>('SELECT * FROM chave_pix WHERE ativo = TRUE ORDER BY criado_em ASC');
    return res.rows;
  }

  async criarChave(dados: CriarChavePixInput): Promise<ChavePix> {
    const res = await query<ChavePix>(`
      INSERT INTO chave_pix (tipo, valor_chave, nome_recebedor, cidade_recebedor, apelido)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [dados.tipo, dados.valor_chave.trim(), dados.nome_recebedor.trim(), dados.cidade_recebedor.trim(), dados.apelido || null]);
    return res.rows[0];
  }

  async excluirChave(id: string): Promise<void> {
    await query('UPDATE chave_pix SET ativo = FALSE WHERE id = $1', [id]);
  }

  async listarCobrancas(): Promise<CobrancaPixItem[]> {
    const res = await query<any>(`
      SELECT 
        c.*,
        cp.tipo AS tipo_chave,
        cp.valor_chave,
        cp.nome_recebedor,
        d.motivo AS divida_motivo,
        p.nome AS pessoa_nome
      FROM cobranca_pix c
      JOIN chave_pix cp ON cp.id = c.chave_pix_id
      LEFT JOIN divida d ON d.id = c.divida_id
      LEFT JOIN pessoa p ON p.id = d.pessoa_id
      ORDER BY c.data_criacao DESC
    `);
    return res.rows.map(r => ({
      ...r,
      valor: parseFloat(r.valor)
    }));
  }

  async criarCobranca(dados: CriarCobrancaPixInput): Promise<CobrancaPixItem> {
    const chRes = await query<ChavePix>('SELECT * FROM chave_pix WHERE id = $1 AND ativo = TRUE', [dados.chave_pix_id]);
    if (chRes.rows.length === 0) {
      throw new Error('Chave PIX não encontrada ou inativa');
    }
    const chave = chRes.rows[0];

    // Gera TXID aleatório se não fornecido
    const txid = dados.txid || ('PIX' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()).substring(0, 25);

    // Gera payload oficial EMV Bacen
    const payloadEmv = gerarPayloadPix({
      chave: chave.valor_chave,
      nomeRecebedor: chave.nome_recebedor,
      cidadeRecebedor: chave.cidade_recebedor,
      valor: dados.valor,
      mensagem: dados.mensagem,
      txid
    });

    const res = await query<any>(`
      INSERT INTO cobranca_pix (
        chave_pix_id, valor, mensagem, txid, payload_emv, status, divida_id, lancamento_id
      )
      VALUES ($1, $2, $3, $4, $5, 'aguardando_confirmacao', $6, $7)
      RETURNING *
    `, [
      dados.chave_pix_id,
      dados.valor,
      dados.mensagem || null,
      txid,
      payloadEmv,
      dados.divida_id || null,
      dados.lancamento_id || null
    ]);

    const cob = res.rows[0];
    return {
      ...cob,
      tipo_chave: chave.tipo,
      valor_chave: chave.valor_chave,
      nome_recebedor: chave.nome_recebedor,
      valor: parseFloat(cob.valor)
    };
  }

  // Confirmação manual de cobrança PIX: Quita dívida se vinculada e credita na conta
  async confirmarRecebimento(cobrancaId: string, dados: ConfirmarCobrancaPixInput): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const cobRes = await client.query('SELECT * FROM cobranca_pix WHERE id = $1 FOR UPDATE', [cobrancaId]);
      if (cobRes.rows.length === 0) {
        throw new Error('Cobrança PIX não encontrada');
      }
      const cob = cobRes.rows[0];
      if (cob.status === 'recebida') {
        throw new Error('Esta cobrança já foi confirmada anteriormente');
      }

      // 1. Marca cobrança como recebida
      await client.query(`
        UPDATE cobranca_pix 
        SET status = 'recebida', data_confirmacao = NOW()
        WHERE id = $1
      `, [cobrancaId]);

      // 2. Se estiver vinculada a uma dívida, executa a baixa da dívida
      if (cob.divida_id) {
        await dividasService.darBaixa(cob.divida_id, {
          valor: parseFloat(cob.valor),
          conta_destino_id: dados.conta_destino_id,
          forma_pagamento: 'pix'
        });
      } else {
        // Se cobrança avulsa, gera receita na conta destino
        const contaRes = await client.query('SELECT moeda_id FROM conta WHERE id = $1', [dados.conta_destino_id]);
        if (contaRes.rows.length > 0) {
          const moedaId = contaRes.rows[0].moeda_id;
          let catRes = await client.query("SELECT id FROM categoria WHERE nome = 'Outras Receitas' LIMIT 1");
          let categoriaId: string;
          if (catRes.rows.length > 0) {
            categoriaId = catRes.rows[0].id;
          } else {
            const cNova = await client.query("INSERT INTO categoria (nome, tipo, icone, cor) VALUES ('Outras Receitas', 'receita', 'ArrowDownLeft', '#10B981') RETURNING id");
            categoriaId = cNova.rows[0].id;
          }

          await client.query(`
            INSERT INTO lancamento (
              tipo, valor, moeda_id, data_compra, forma_pagamento, 
              conta_id, categoria_id, descricao, status
            )
            VALUES ('receita', $1, $2, CURRENT_DATE, 'pix', $3, $4, $5, 'confirmado')
          `, [
            cob.valor,
            moedaId,
            dados.conta_destino_id,
            categoriaId,
            `Recebimento PIX: ${cob.mensagem || 'Cobrança confirmada'}`
          ]);

          await client.query(`
            UPDATE conta SET saldo_atual = saldo_atual + $1, atualizado_em = NOW() WHERE id = $2
          `, [cob.valor, dados.conta_destino_id]);
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  async excluirCobranca(id: string): Promise<boolean> {
    const { rowCount } = await query('DELETE FROM cobranca_pix WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
}

export const pixService = new PixService();
