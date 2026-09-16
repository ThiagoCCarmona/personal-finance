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
  async listar(): Promise<Pessoa[]> {
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
      LEFT JOIN divida d ON d.pessoa_id = p.id
      WHERE p.ativo = TRUE
      GROUP BY p.id
      ORDER BY p.nome ASC
    `);
    return res.rows.map(r => ({
      ...r,
      total_a_receber: parseFloat(r.total_a_receber as any || '0')
    }));
  }

  async criar(dados: CriarPessoaInput): Promise<Pessoa> {
    const res = await query<Pessoa>(`
      INSERT INTO pessoa (nome, apelido, telefone, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *, 0 AS total_a_receber
    `, [dados.nome, dados.apelido || null, dados.telefone || null, dados.email || null]);
    return res.rows[0];
  }

  async excluir(id: string): Promise<void> {
    // Soft delete para não violar integridade de dívidas
    await query('UPDATE pessoa SET ativo = FALSE WHERE id = $1', [id]);
  }
}

export const pessoasService = new PessoasService();
