import { query, withTransaction } from '../../config/database.js';
import { ContaInput } from './contas.schemas.js';

export class ContasService {
  async listAll() {
    const { rows } = await query(
      `SELECT c.*, 
        i.nome as instituicao_nome, i.tipo as instituicao_tipo, i.icone as instituicao_icone, i.cor as instituicao_cor,
        m.codigo as moeda_codigo, m.simbolo as moeda_simbolo
       FROM conta c
       JOIN instituicao i ON i.id = c.instituicao_id
       JOIN moeda m ON m.id = c.moeda_id
       ORDER BY c.ativo DESC, c.apelido ASC`
    );
    return rows;
  }

  async getById(id: string) {
    const { rows } = await query(
      `SELECT c.*, 
        i.nome as instituicao_nome, i.tipo as instituicao_tipo, i.icone as instituicao_icone, i.cor as instituicao_cor,
        m.codigo as moeda_codigo, m.simbolo as moeda_simbolo
       FROM conta c
       JOIN instituicao i ON i.id = c.instituicao_id
       JOIN moeda m ON m.id = c.moeda_id
       WHERE c.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async create(input: ContaInput) {
    return withTransaction(async (client) => {
      // Se não enviou moeda, busca ou cria o ID da moeda BRL padrão
      let moedaId = input.moeda_id;
      if (!moedaId) {
        const { rows: brl } = await client.query("SELECT id FROM moeda WHERE codigo = 'BRL' LIMIT 1");
        if (brl.length > 0) {
          moedaId = brl[0].id;
        } else {
          const { rows: novoBrl } = await client.query(
            "INSERT INTO moeda (codigo, nome, simbolo, ativo) VALUES ('BRL', 'Real Brasileiro', 'R$', TRUE) RETURNING id"
          );
          moedaId = novoBrl[0].id;
        }
      }

      const saldoInicial = input.saldo_inicial ?? 0;
      const { rows } = await client.query(
        `INSERT INTO conta (instituicao_id, moeda_id, tipo, apelido, saldo_inicial, saldo_atual, ativo)
         VALUES ($1, $2, $3, $4, $5, $5, $6)
         RETURNING *`,
        [input.instituicao_id, moedaId, input.tipo, input.apelido.trim(), saldoInicial, input.ativo ?? true]
      );
      return rows[0];
    });
  }

  async update(id: string, input: Partial<ContaInput>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.instituicao_id !== undefined) {
      fields.push(`instituicao_id = $${idx++}`);
      values.push(input.instituicao_id);
    }
    if (input.moeda_id !== undefined) {
      fields.push(`moeda_id = $${idx++}`);
      values.push(input.moeda_id);
    }
    if (input.tipo !== undefined) {
      fields.push(`tipo = $${idx++}`);
      values.push(input.tipo);
    }
    if (input.apelido !== undefined) {
      fields.push(`apelido = $${idx++}`);
      values.push(input.apelido.trim());
    }
    if (input.ativo !== undefined) {
      fields.push(`ativo = $${idx++}`);
      values.push(input.ativo);
    }

    if (fields.length === 0) return this.getById(id);

    fields.push(`atualizado_em = NOW()`);
    values.push(id);

    const { rows } = await query(
      `UPDATE conta SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id: string) {
    const { rows: lanc } = await query('SELECT COUNT(*) as count FROM lancamento WHERE conta_id = $1', [id]);
    if (parseInt(lanc[0].count, 10) > 0) {
      throw new Error('Esta conta possui lançamentos associados. Arquive-a desmarcando o status "ativo" em vez de excluí-la.');
    }

    const { rowCount } = await query('DELETE FROM conta WHERE id = $1', [id]);
    return rowCount ? rowCount > 0 : false;
  }

  async getSaldoConsolidado() {
    const { rows } = await query(
      `SELECT 
        COALESCE(SUM(saldo_atual), 0) as total_saldo_brl,
        COUNT(id) as total_contas
       FROM conta
       WHERE ativo = TRUE`
    );
    return {
      totalSaldoBrl: parseFloat(rows[0].total_saldo_brl),
      totalContas: parseInt(rows[0].total_contas, 10),
    };
  }
}

export const contasService = new ContasService();
