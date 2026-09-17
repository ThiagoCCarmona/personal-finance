import { query } from '../../config/database.js';

export interface Moeda {
  id: string;
  codigo: string;
  nome: string;
  simbolo: string;
  ativo: boolean;
}

export class MoedasService {
  async listar(): Promise<Moeda[]> {
    const { rows } = await query(
      'SELECT id, codigo, nome, simbolo, ativo FROM moeda WHERE ativo = TRUE ORDER BY codigo ASC'
    );
    return rows;
  }

  async obterOuCriarBrl(): Promise<string> {
    const { rows } = await query("SELECT id FROM moeda WHERE codigo = 'BRL' LIMIT 1");
    if (rows.length > 0) return rows[0].id;

    const { rows: inserted } = await query(
      "INSERT INTO moeda (codigo, nome, simbolo, ativo) VALUES ('BRL', 'Real Brasileiro', 'R$', TRUE) ON CONFLICT (codigo) DO UPDATE SET ativo = TRUE RETURNING id"
    );
    return inserted[0].id;
  }
}

export const moedasService = new MoedasService();
