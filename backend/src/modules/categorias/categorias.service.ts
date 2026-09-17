import { query } from '../../config/database.js';
import { CategoriaInput } from './categorias.schemas.js';

export class CategoriasService {
  async listAll(userId: string, tipo?: string) {
    let sql = `
      SELECT c.*, p.nome as categoria_pai_nome
      FROM categoria c
      LEFT JOIN categoria p ON p.id = c.categoria_pai_id
      WHERE c.usuario_id = $1
    `;
    const params: any[] = [userId];

    if (tipo) {
      params.push(tipo);
      sql += ` AND c.tipo = $${params.length}`;
    }

    sql += ` ORDER BY c.tipo ASC, c.categoria_pai_id NULLS FIRST, c.nome ASC`;

    const { rows } = await query(sql, params);

    // Organiza em árvore para a UI
    const parents = rows.filter(r => !r.categoria_pai_id);
    const children = rows.filter(r => !!r.categoria_pai_id);

    const tree = parents.map(parent => ({
      ...parent,
      subcategorias: children.filter(child => child.categoria_pai_id === parent.id),
    }));

    return {
      flat: rows,
      tree,
    };
  }

  async getById(id: string, userId: string) {
    const { rows } = await query(
      `SELECT c.*, p.nome as categoria_pai_nome
       FROM categoria c
       LEFT JOIN categoria p ON p.id = c.categoria_pai_id
       WHERE c.id = $1 AND c.usuario_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  }

  async create(userId: string, input: CategoriaInput) {
    const { rows } = await query(
      `INSERT INTO categoria (usuario_id, nome, tipo, icone, cor, categoria_pai_id, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        input.nome.trim(),
        input.tipo,
        input.icone || 'Tag',
        input.cor || '#6B7280',
        input.categoria_pai_id || null,
        input.ativo ?? true,
      ]
    );
    return rows[0];
  }

  async update(id: string, userId: string, input: Partial<CategoriaInput>) {
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
    if (input.categoria_pai_id !== undefined) {
      fields.push(`categoria_pai_id = $${idx++}`);
      values.push(input.categoria_pai_id);
    }
    if (input.ativo !== undefined) {
      fields.push(`ativo = $${idx++}`);
      values.push(input.ativo);
    }

    if (fields.length === 0) return this.getById(id, userId);

    fields.push(`atualizado_em = NOW()`);
    values.push(id);
    const idIdx = idx++;
    values.push(userId);
    const userIdx = idx++;

    const { rows } = await query(
      `UPDATE categoria SET ${fields.join(', ')} WHERE id = $${idIdx} AND usuario_id = $${userIdx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id: string, userId: string) {
    const { rows: lanc } = await query(
      'SELECT COUNT(*) as count FROM lancamento WHERE (categoria_id = $1 OR subcategoria_id = $1) AND usuario_id = $2',
      [id, userId]
    );
    if (parseInt(lanc[0].count, 10) > 0) {
      throw new Error('Esta categoria possui lançamentos associados. Desative-a em vez de excluí-la.');
    }

    const { rowCount } = await query('DELETE FROM categoria WHERE id = $1 AND usuario_id = $2', [id, userId]);
    return rowCount ? rowCount > 0 : false;
  }
}

export const categoriasService = new CategoriasService();
