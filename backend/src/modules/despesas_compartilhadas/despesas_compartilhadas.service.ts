import { query, getClient } from '../../config/database.js';
import { CriarDespesaCompartilhadaInput } from './despesas_compartilhadas.schema.js';

export class DespesasCompartilhadasService {
  async listar() {
    const res = await query(`
      SELECT 
        dc.*,
        c.apelido AS conta_nome,
        cc.apelido AS cartao_nome,
        cat.nome AS categoria_nome,
        (SELECT COUNT(*) FROM divida d WHERE d.despesa_compartilhada_id = dc.id) AS total_participantes,
        (SELECT COALESCE(SUM(d.valor_total), 0) FROM divida d WHERE d.despesa_compartilhada_id = dc.id) AS valor_a_receber_total,
        (SELECT COALESCE(SUM(d.valor_pago), 0) FROM divida d WHERE d.despesa_compartilhada_id = dc.id) AS valor_recebido_total
      FROM despesa_compartilhada dc
      LEFT JOIN conta c ON c.id = dc.conta_origem_id
      LEFT JOIN cartao_credito cc ON cc.id = dc.cartao_id
      LEFT JOIN categoria cat ON cat.id = dc.categoria_id
      ORDER BY dc.data DESC, dc.criado_em DESC
    `);
    return res.rows;
  }

  async criar(dados: CriarDespesaCompartilhadaInput) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Cria a despesa compartilhada
      const dcRes = await client.query(`
        INSERT INTO despesa_compartilhada (
          descricao, valor_total, data, conta_origem_id, cartao_id, categoria_id
        )
        VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6)
        RETURNING *
      `, [
        dados.descricao,
        dados.valor_total,
        dados.data || null,
        dados.conta_origem_id || null,
        dados.cartao_id || null,
        dados.categoria_id || null
      ]);
      const despesa = dcRes.rows[0];

      // 2. Se foi paga por conta, debita o valor total da conta de origem
      if (dados.conta_origem_id) {
        const cRes = await client.query('SELECT moeda_id FROM conta WHERE id = $1', [dados.conta_origem_id]);
        if (cRes.rows.length > 0) {
          const moedaId = cRes.rows[0].moeda_id;
          let categoriaId = dados.categoria_id;
          if (!categoriaId) {
            const catRes = await client.query("SELECT id FROM categoria WHERE tipo = 'despesa' ORDER BY criado_em ASC LIMIT 1");
            if (catRes.rows.length > 0) {
              categoriaId = catRes.rows[0].id;
            } else {
              const novaCat = await client.query("INSERT INTO categoria (nome, tipo, icone, cor) VALUES ('Outros Gastos', 'despesa', 'MoreHorizontal', '#6B7280') RETURNING id");
              categoriaId = novaCat.rows[0].id;
            }
          }

          await client.query(`
            INSERT INTO lancamento (
              tipo, valor, moeda_id, data_compra, forma_pagamento, 
              conta_id, categoria_id, descricao, status
            )
            VALUES ('despesa', $1, $2, COALESCE($3, CURRENT_DATE), 'pix_debito', $4, $5, $6, 'efetivado')
          `, [
            dados.valor_total,
            moedaId,
            dados.data || null,
            dados.conta_origem_id,
            categoriaId,
            `Despesa compartilhada: ${dados.descricao}`
          ]);

          await client.query(`
            UPDATE conta 
            SET saldo_atual = saldo_atual - $1, atualizado_em = NOW() 
            WHERE id = $2
          `, [dados.valor_total, dados.conta_origem_id]);
        }
      }

      // 3. Gera uma dívida individual para cada participante
      for (const p of dados.participantes) {
        await client.query(`
          INSERT INTO divida (
            pessoa_id, valor_total, valor_pago, valor_perdoado, motivo, 
            conta_origem_id, despesa_compartilhada_id, status, data
          )
          VALUES ($1, $2, 0.00, 0.00, $3, $4, $5, 'pendente', COALESCE($6, CURRENT_DATE))
        `, [
          p.pessoa_id,
          p.valor,
          `Cota da despesa: ${dados.descricao}`,
          dados.conta_origem_id || null,
          despesa.id,
          dados.data || null
        ]);
      }

      await client.query('COMMIT');
      return despesa;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async excluir(id: string): Promise<boolean> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const dcRes = await client.query('SELECT * FROM despesa_compartilhada WHERE id = $1 FOR UPDATE', [id]);
      if (dcRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }
      const despesa = dcRes.rows[0];

      // 1. Se foi paga por conta bancária, estorna o valor total debitado
      if (despesa.conta_origem_id) {
        await client.query('UPDATE conta SET saldo_atual = saldo_atual + $1, atualizado_em = NOW() WHERE id = $2', [
          despesa.valor_total,
          despesa.conta_origem_id
        ]);
        // Remove lançamento de despesa associado
        await client.query(`DELETE FROM lancamento WHERE conta_id = $1 AND descricao LIKE $2 AND tipo = 'despesa'`, [
          despesa.conta_origem_id,
          `%${despesa.descricao}%`
        ]);
      }

      // 2. Remove cobranças PIX associadas às dívidas desta divisão
      await client.query(`
        DELETE FROM cobranca_pix 
        WHERE divida_id IN (SELECT id FROM divida WHERE despesa_compartilhada_id = $1)
      `, [id]);

      // 3. Remove dívidas filhas geradas
      await client.query('DELETE FROM divida WHERE despesa_compartilhada_id = $1', [id]);

      // 4. Remove a despesa compartilhada
      await client.query('DELETE FROM despesa_compartilhada WHERE id = $1', [id]);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const despesasCompartilhadasService = new DespesasCompartilhadasService();
