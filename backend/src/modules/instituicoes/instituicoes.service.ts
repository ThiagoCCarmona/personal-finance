import { query } from '../../config/database.js';
import { InstituicaoInput } from './instituicoes.schemas.js';

export class InstituicoesService {
  async listAll() {
    const { rows } = await query(
      `SELECT i.*, 
        COUNT(c.id) as total_contas,
        COALESCE(SUM(c.saldo_atual), 0) as saldo_total
       FROM instituicao i
       LEFT JOIN conta c ON c.instituicao_id = i.id AND c.ativo = TRUE
       GROUP BY i.id
       ORDER BY i.nome ASC`
    );
    return rows;
  }

  async getById(id: string) {
    const { rows } = await query('SELECT * FROM instituicao WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async create(input: InstituicaoInput) {
    const { rows } = await query(
      `INSERT INTO instituicao (nome, tipo, icone, cor, ativo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [input.nome.trim(), input.tipo, input.icone, input.cor, input.ativo ?? true]
    );
    return rows[0];
  }

  async update(id: string, input: Partial<InstituicaoInput>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.nome !== undefined) {
      fields.push(`nome = $${idx++}`);
      values.push(input.nome.trim());
    }
    if (input.tipo !== undefined) {
      fields.push(`tipo = $${idx++}`);
      values.push(input.tipo);
    }
    if (input.icone !== undefined) {
      fields.push(`icone = $${idx++}`);
      values.push(input.icone);
    }
    if (input.cor !== undefined) {
      fields.push(`cor = $${idx++}`);
      values.push(input.cor);
    }
    if (input.ativo !== undefined) {
      fields.push(`ativo = $${idx++}`);
      values.push(input.ativo);
    }

    if (fields.length === 0) return this.getById(id);

    fields.push(`atualizado_em = NOW()`);
    values.push(id);

    const { rows } = await query(
      `UPDATE instituicao SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id: string) {
    // Verifica se possui contas atreladas
    const { rows: contas } = await query('SELECT COUNT(*) as count FROM conta WHERE instituicao_id = $1', [id]);
    if (parseInt(contas[0].count, 10) > 0) {
      throw new Error('Não é possível excluir uma instituição que possui contas vinculadas. Desative-a ou exclua as contas primeiro.');
    }

    const { rowCount } = await query('DELETE FROM instituicao WHERE id = $1', [id]);
    return rowCount ? rowCount > 0 : false;
  }
}

export const instituicoesService = new InstituicoesService();
