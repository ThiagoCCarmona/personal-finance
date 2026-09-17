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
  conta_id?: string;
  conta_nome?: string;
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
  async listarChaves(userId: string): Promise<ChavePix[]> {
    const res = await query<ChavePix>(`
      SELECT 
        cp.*,
        c.apelido AS conta_nome
      FROM chave_pix cp
      LEFT JOIN conta c ON c.id = cp.conta_id
      WHERE cp.usuario_id = $1 AND cp.ativo = TRUE 
      ORDER BY cp.criado_em ASC
    `, [userId]);
    return res.rows;
  }

  async criarChave(userId: string, dados: CriarChavePixInput): Promise<ChavePix> {
    const res = await query<ChavePix>(`
      INSERT INTO chave_pix (usuario_id, tipo, valor_chave, nome_recebedor, cidade_recebedor, apelido, conta_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, dados.tipo, dados.valor_chave.trim(), dados.nome_recebedor.trim(), dados.cidade_recebedor.trim(), dados.apelido || null, dados.conta_id || null]);
    return res.rows[0];
  }

  async excluirChave(id: string, userId: string): Promise<void> {
    await query('UPDATE chave_pix SET ativo = FALSE WHERE id = $1 AND usuario_id = $2', [id, userId]);
  }

  async listarCobrancas(userId: string): Promise<CobrancaPixItem[]> {
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
      WHERE c.usuario_id = $1
      ORDER BY c.data_criacao DESC
    `, [userId]);
    return res.rows.map(r => ({
      ...r,
      valor: parseFloat(r.valor)
    }));
  }

  async criarCobranca(userId: string, dados: CriarCobrancaPixInput): Promise<CobrancaPixItem> {
    const chRes = await query<ChavePix>(
      'SELECT * FROM chave_pix WHERE id = $1 AND usuario_id = $2 AND ativo = TRUE',
      [dados.chave_pix_id, userId]
    );
    if (chRes.rows.length === 0) {
      throw new Error('Chave PIX não encontrada ou não autorizada');
    }
    const chave = chRes.rows[0];

    const txid = dados.txid || ('PIX' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()).substring(0, 25);

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
        usuario_id, chave_pix_id, valor, mensagem, txid, payload_emv, status, divida_id, lancamento_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'aguardando_confirmacao', $7, $8)
      RETURNING *
    `, [
      userId,
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

  async confirmarRecebimento(cobrancaId: string, userId: string, dados: ConfirmarCobrancaPixInput): Promise<void> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const cobRes = await client.query(
        'SELECT * FROM cobranca_pix WHERE id = $1 AND usuario_id = $2 FOR UPDATE',
        [cobrancaId, userId]
      );
      if (cobRes.rows.length === 0) {
        throw new Error('Cobrança PIX não encontrada ou não autorizada');
      }
      const cob = cobRes.rows[0];
      if (cob.status === 'recebida') {
        throw new Error('Esta cobrança já foi confirmada anteriormente');
      }

      let contaDestinoId = dados.conta_destino_id;
      if (!contaDestinoId) {
        const cpRes = await client.query(
          'SELECT conta_id FROM chave_pix WHERE id = $1 AND usuario_id = $2',
          [cob.chave_pix_id, userId]
        );
        if (cpRes.rows.length > 0 && cpRes.rows[0].conta_id) {
          contaDestinoId = cpRes.rows[0].conta_id;
        } else {
          const cFirst = await client.query(
            'SELECT id FROM conta WHERE usuario_id = $1 AND ativo = TRUE ORDER BY criado_em ASC LIMIT 1',
            [userId]
          );
          if (cFirst.rows.length > 0) contaDestinoId = cFirst.rows[0].id;
        }
      }
      if (!contaDestinoId) {
        throw new Error('Nenhuma conta bancária encontrada para receber o PIX');
      }

      // 1. Marca cobrança como recebida
      await client.query(`
        UPDATE cobranca_pix 
        SET status = 'recebida', data_confirmacao = NOW()
        WHERE id = $1 AND usuario_id = $2
      `, [cobrancaId, userId]);

      // 2. Se estiver vinculada a uma dívida, executa a baixa da dívida com o userId correto
      if (cob.divida_id) {
        await dividasService.darBaixa(cob.divida_id, userId, {
          valor: parseFloat(cob.valor),
          conta_destino_id: contaDestinoId,
          forma_pagamento: 'pix'
        });
      } else {
        const contaRes = await client.query(
          'SELECT moeda_id FROM conta WHERE id = $1 AND usuario_id = $2',
          [contaDestinoId, userId]
        );
        if (contaRes.rows.length > 0) {
          const moedaId = contaRes.rows[0].moeda_id;
          let catRes = await client.query(
            "SELECT id FROM categoria WHERE nome = 'Outras Receitas' AND usuario_id = $1 LIMIT 1",
            [userId]
          );
          let categoriaId: string;
          if (catRes.rows.length > 0) {
            categoriaId = catRes.rows[0].id;
          } else {
            const cNova = await client.query(`
              INSERT INTO categoria (usuario_id, nome, tipo, icone, cor) 
              VALUES ($1, 'Outras Receitas', 'receita', 'ArrowDownLeft', '#10B981') 
              RETURNING id
            `, [userId]);
            categoriaId = cNova.rows[0].id;
          }

          await client.query(`
            INSERT INTO lancamento (
              usuario_id, tipo, valor, moeda_id, data_compra, forma_pagamento, 
              conta_id, categoria_id, descricao, status
            )
            VALUES ($1, 'receita', $2, $3, CURRENT_DATE, 'pix_debito', $4, $5, $6, 'efetivado')
          `, [
            userId,
            cob.valor,
            moedaId,
            contaDestinoId,
            categoriaId,
            `Recebimento PIX: ${cob.mensagem || 'Cobrança confirmada'}`
          ]);

          await client.query(`
            UPDATE conta 
            SET saldo_atual = saldo_atual + $1, atualizado_em = NOW() 
            WHERE id = $2 AND usuario_id = $3
          `, [cob.valor, contaDestinoId, userId]);
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async excluirCobranca(id: string, userId: string): Promise<boolean> {
    const { rowCount } = await query('DELETE FROM cobranca_pix WHERE id = $1 AND usuario_id = $2', [id, userId]);
    return (rowCount ?? 0) > 0;
  }
}

export const pixService = new PixService();
