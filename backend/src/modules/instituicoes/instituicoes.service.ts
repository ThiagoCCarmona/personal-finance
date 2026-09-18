import { query } from '../../config/database.js';
import { InstituicaoInput } from './instituicoes.schemas.js';

export class InstituicoesService {
  async listAll(userId?: string, includeInactive = false) {
    const params: any[] = [];
    const whereClauses: string[] = [];
    let joinConta = 'LEFT JOIN conta c ON c.instituicao_id = i.id AND c.ativo = TRUE';

    if (userId) {
      params.push(userId);
      joinConta += ` AND c.usuario_id = $${params.length}`;
      params.push(userId);
      whereClauses.push(`(i.usuario_id = $${params.length} OR i.usuario_id IS NULL)`);
    }

    if (!includeInactive) {
      whereClauses.push(`i.ativo = TRUE`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT i.*, 
        COUNT(c.id) as total_contas,
        COALESCE(SUM(c.saldo_atual), 0) as saldo_total
       FROM instituicao i
       ${joinConta}
       ${whereSql}
       GROUP BY i.id
       ORDER BY i.nome ASC`,
      params
    );
    return rows;
  }

  async getById(id: string, userId?: string) {
    let sql = 'SELECT * FROM instituicao WHERE id = $1';
    const params: any[] = [id];
    if (userId) {
      sql += ' AND (usuario_id = $2 OR usuario_id IS NULL)';
      params.push(userId);
    }
    const { rows } = await query(sql, params);
    return rows[0] || null;
  }

  async create(input: InstituicaoInput, userId?: string) {
    const { rows } = await query(
      `INSERT INTO instituicao (usuario_id, nome, tipo, icone, cor, ativo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId || null, input.nome.trim(), input.tipo, input.icone, input.cor, input.ativo ?? true]
    );
    return rows[0];
  }

  async update(id: string, input: Partial<InstituicaoInput>, userId?: string) {
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

    if (fields.length === 0) return this.getById(id, userId);

    fields.push(`atualizado_em = NOW()`);
    values.push(id);
    const idIdx = idx++;

    let whereSql = `WHERE id = $${idIdx}`;
    if (userId) {
      values.push(userId);
      whereSql += ` AND (usuario_id = $${idx++} OR usuario_id IS NULL)`;
    }

    const { rows } = await query(
      `UPDATE instituicao SET ${fields.join(', ')} ${whereSql} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id: string, userId?: string) {
    // 1. Verifica vínculos ativos de contas
    const { rows: contas } = await query(
      'SELECT COUNT(*) as count FROM conta WHERE instituicao_id = $1 AND ativo = TRUE',
      [id]
    );
    if (parseInt(contas[0]?.count || '0', 10) > 0) {
      throw new Error('Esta instituição possui contas bancárias ativas vinculadas. Exclua ou reatribua as contas primeiro.');
    }

    // 2. Verifica vínculos de cartões de crédito
    const { rows: cartoes } = await query(
      'SELECT COUNT(*) as count FROM cartao_credito WHERE instituicao_id = $1 AND ativo = TRUE',
      [id]
    );
    if (parseInt(cartoes[0]?.count || '0', 10) > 0) {
      throw new Error('Esta instituição possui cartões de crédito ativos vinculados. Exclua ou reatribua os cartões primeiro.');
    }

    // 3. Se houver registros históricos (contas inativas ou cartões inativos), realiza soft-delete
    const { rows: histContas } = await query('SELECT COUNT(*) as count FROM conta WHERE instituicao_id = $1', [id]);
    const { rows: histCartoes } = await query('SELECT COUNT(*) as count FROM cartao_credito WHERE instituicao_id = $1', [id]);
    const totalVinculos = parseInt(histContas[0]?.count || '0', 10) + parseInt(histCartoes[0]?.count || '0', 10);

    if (totalVinculos > 0) {
      // Soft-delete para não quebrar integridade referencial histórica
      await query(
        `UPDATE instituicao SET ativo = FALSE, atualizado_em = NOW() WHERE id = $1`,
        [id]
      );
      return true;
    }

    // 4. Sem nenhum vínculo histórico, exclui fisicamente
    try {
      const { rowCount } = await query('DELETE FROM instituicao WHERE id = $1', [id]);
      return rowCount ? rowCount > 0 : false;
    } catch {
      // Fallback para soft-delete seguro caso haja restrição
      await query('UPDATE instituicao SET ativo = FALSE, atualizado_em = NOW() WHERE id = $1', [id]);
      return true;
    }
  }
}

export const instituicoesService = new InstituicoesService();
