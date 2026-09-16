import { query } from '../../config/database.js';
import { CategoriaInput } from './categorias.schemas.js';

export class CategoriasService {
  async listAll(tipo?: string) {
    let sql = `
      SELECT c.*, p.nome as categoria_pai_nome
      FROM categoria c
      LEFT JOIN categoria p ON p.id = c.categoria_pai_id
      WHERE 1=1
    `;
    const params: any[] = [];

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

  async getById(id: string) {
    const { rows } = await query(
      `SELECT c.*, p.nome as categoria_pai_nome
       FROM categoria c
       LEFT JOIN categoria p ON p.id = c.categoria_pai_id
       WHERE c.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async create(input: CategoriaInput) {
    const { rows } = await query(
      `INSERT INTO categoria (nome, tipo, icone, cor, categoria_pai_id, ativo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
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

  async update(id: string, input: Partial<CategoriaInput>) {
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

    if (fields.length === 0) return this.getById(id);

    fields.push(`atualizado_em = NOW()`);
    values.push(id);

    const { rows } = await query(
      `UPDATE categoria SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id: string) {
    // Verifica se possui lançamentos vinculados
    const { rows: lanc } = await query(
      'SELECT COUNT(*) as count FROM lancamento WHERE categoria_id = $1 OR subcategoria_id = $1',
      [id]
    );
    if (parseInt(lanc[0].count, 10) > 0) {
      throw new Error('Esta categoria possui lançamentos associados. Desative-a em vez de excluí-la.');
    }

    const { rowCount } = await query('DELETE FROM categoria WHERE id = $1', [id]);
    return rowCount ? rowCount > 0 : false;
  }
}

export const categoriasService = new CategoriasService();
