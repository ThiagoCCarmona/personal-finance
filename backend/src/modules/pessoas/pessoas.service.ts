import { query } from '../../config/database.js';
import { CriarPessoaInput } from './pessoas.schema.js';

export interface Pessoa {
  id: string;
  nome: string;
  apelido?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  total_a_receber: number;
  criado_em: string;
}

export class PessoasService {
  async listar(userId: string): Promise<Pessoa[]> {
    const res = await query<Pessoa>(`
      SELECT 
        p.*,
        COALESCE(SUM(
          CASE 
            WHEN d.status IN ('pendente', 'parcial') 
            THEN (d.valor_total - d.valor_pago - d.valor_perdoado) 
            ELSE 0 
          END
        ), 0) AS total_a_receber
      FROM pessoa p
      LEFT JOIN divida d ON d.pessoa_id = p.id AND d.usuario_id = $1
      WHERE p.usuario_id = $1 AND p.ativo = TRUE
      GROUP BY p.id
      ORDER BY p.nome ASC
    `, [userId]);
    return res.rows.map(r => ({
      ...r,
      total_a_receber: parseFloat(r.total_a_receber as any || '0')
    }));
  }

  async criar(userId: string, dados: CriarPessoaInput): Promise<Pessoa> {
    const res = await query<Pessoa>(`
      INSERT INTO pessoa (usuario_id, nome, apelido, telefone, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *, 0 AS total_a_receber
    `, [userId, dados.nome, dados.apelido || null, dados.telefone || null, dados.email || null]);
    return res.rows[0];
  }

  async atualizar(id: string, userId: string, dados: import('./pessoas.schema.js').AtualizarPessoaInput): Promise<Pessoa | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (dados.nome !== undefined) {
      fields.push(`nome = $${idx++}`);
      values.push(dados.nome.trim());
    }
    if (dados.apelido !== undefined) {
      fields.push(`apelido = $${idx++}`);
      values.push(dados.apelido ? dados.apelido.trim() : null);
    }
    if (dados.telefone !== undefined) {
      fields.push(`telefone = $${idx++}`);
      values.push(dados.telefone ? dados.telefone.trim() : null);
    }
    if (dados.email !== undefined) {
      fields.push(`email = $${idx++}`);
      values.push(dados.email ? dados.email.trim() : null);
    }

    if (fields.length === 0) {
      const p = await this.listar(userId);
      return p.find(item => item.id === id) || null;
    }

    fields.push(`atualizado_em = NOW()`);
    values.push(id);
    const idIdx = idx++;
    values.push(userId);
    const userIdx = idx++;

    await query(`UPDATE pessoa SET ${fields.join(', ')} WHERE id = $${idIdx} AND usuario_id = $${userIdx}`, values);
    const p = await this.listar(userId);
    return p.find(item => item.id === id) || null;
  }

  async excluir(id: string, userId: string): Promise<void> {
    await query('UPDATE pessoa SET ativo = FALSE WHERE id = $1 AND usuario_id = $2', [id, userId]);
  }
}

export const pessoasService = new PessoasService();
