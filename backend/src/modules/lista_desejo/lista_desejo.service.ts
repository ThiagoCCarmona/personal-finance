import { query, getClient } from '../../config/database.js';
import { CriarItemDesejoInput, AtualizarItemDesejoInput, ComprarItemDesejoInput } from './lista_desejo.schema.js';

export interface ItemDesejo {
  id: string;
  nome: string;
  link: string | null;
  preco_estimado: number;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  categoria_id: string | null;
  categoria_nome?: string | null;
  categoria_cor?: string | null;
  tipo_gasto: string;
  status: 'planejado' | 'comprado' | 'descartado';
  observacoes: string | null;
  data_alvo: string | null;
  comprado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}

export class ListaDesejoService {
  async listar(filtros?: { status?: string; prioridade?: string; busca?: string }): Promise<ItemDesejo[]> {
    let sql = `
      SELECT 
        ld.*,
        c.nome AS categoria_nome,
        c.cor AS categoria_cor
      FROM lista_desejo ld
      LEFT JOIN categoria c ON c.id = ld.categoria_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (filtros?.status) {
      sql += ` AND ld.status = $${idx++}`;
      params.push(filtros.status);
    }
    if (filtros?.prioridade) {
      sql += ` AND ld.prioridade = $${idx++}`;
      params.push(filtros.prioridade);
    }
    if (filtros?.busca) {
      sql += ` AND (ld.nome ILIKE $${idx} OR ld.observacoes ILIKE $${idx})`;
      params.push(`%${filtros.busca}%`);
      idx++;
    }

    sql += ` ORDER BY 
      CASE ld.status WHEN 'planejado' THEN 1 WHEN 'comprado' THEN 2 ELSE 3 END,
      CASE ld.prioridade WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END,
      ld.criado_em DESC
    `;

    const { rows } = await query(sql, params);
    return rows.map(r => ({
      ...r,
      preco_estimado: parseFloat(r.preco_estimado)
    }));
  }

  async getById(id: string): Promise<ItemDesejo | null> {
    const { rows } = await query(`
      SELECT ld.*, c.nome as categoria_nome, c.cor as categoria_cor
      FROM lista_desejo ld
      LEFT JOIN categoria c ON c.id = ld.categoria_id
      WHERE ld.id = $1
    `, [id]);
    if (rows.length === 0) return null;
    return {
      ...rows[0],
      preco_estimado: parseFloat(rows[0].preco_estimado)
    };
  }

  async criar(dados: CriarItemDesejoInput): Promise<ItemDesejo> {
    const { rows } = await query(`
      INSERT INTO lista_desejo (
        nome, link, preco_estimado, prioridade, categoria_id, tipo_gasto, status, observacoes, data_alvo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      dados.nome.trim(),
      dados.link || null,
      dados.preco_estimado,
      dados.prioridade || 'media',
      dados.categoria_id || null,
      dados.tipo_gasto || 'pessoal',
      dados.status || 'planejado',
      dados.observacoes || null,
      dados.data_alvo || null
    ]);
    return this.getById(rows[0].id) as Promise<ItemDesejo>;
  }

  async atualizar(id: string, dados: AtualizarItemDesejoInput): Promise<ItemDesejo | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    Object.entries(dados).forEach(([key, val]) => {
      if (val !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(val === '' ? null : val);
      }
    });

    if (fields.length === 0) return this.getById(id);

    fields.push(`atualizado_em = NOW()`);
    values.push(id);

    const sql = `UPDATE lista_desejo SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const { rows } = await query(sql, values);
    if (rows.length === 0) return null;
    return this.getById(id);
  }

  async excluir(id: string): Promise<boolean> {
    const { rowCount } = await query('DELETE FROM lista_desejo WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  async marcarComoComprado(id: string, dados?: ComprarItemDesejoInput): Promise<ItemDesejo> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const itemRes = await client.query('SELECT * FROM lista_desejo WHERE id = $1 FOR UPDATE', [id]);
      if (itemRes.rows.length === 0) throw new Error('Item da lista de desejos não encontrado');
      const item = itemRes.rows[0];

      await client.query(`
        UPDATE lista_desejo 
        SET status = 'comprado', comprado_em = NOW(), atualizado_em = NOW()
        WHERE id = $1
      `, [id]);

      // Se passou conta ou cartão, gera o lançamento contábil
      if (dados && (dados.conta_id || dados.cartao_id)) {
        const valorFinal = dados.valor_pago || parseFloat(item.preco_estimado);
        const catId = dados.categoria_id || item.categoria_id;

        // Pega moeda padrão BRL
        const { rows: brl } = await client.query("SELECT id FROM moeda WHERE codigo = 'BRL' LIMIT 1");
        const moedaId = brl[0]?.id;

        let categoriaId = catId;
        if (!categoriaId) {
          const { rows: cat } = await client.query("SELECT id FROM categoria WHERE tipo = 'despesa' LIMIT 1");
          categoriaId = cat[0]?.id;
        }

        await client.query(`
          INSERT INTO lancamento (
            tipo, valor, moeda_id, data_compra, forma_pagamento, 
            conta_id, cartao_id, categoria_id, descricao, status
          )
          VALUES ('despesa', $1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, $7, 'efetivado')
        `, [
          valorFinal,
          moedaId,
          dados.data_compra || null,
          dados.forma_pagamento || (dados.cartao_id ? 'credito' : 'pix_debito'),
          dados.conta_id || null,
          dados.cartao_id || null,
          categoriaId,
          `Compra de Desejo: ${item.nome}`
        ]);

        if (dados.conta_id) {
          await client.query(`UPDATE conta SET saldo_atual = saldo_atual - $1, atualizado_em = NOW() WHERE id = $2`, [valorFinal, dados.conta_id]);
        }
      }

      await client.query('COMMIT');
      return this.getById(id) as Promise<ItemDesejo>;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const listaDesejoService = new ListaDesejoService();
