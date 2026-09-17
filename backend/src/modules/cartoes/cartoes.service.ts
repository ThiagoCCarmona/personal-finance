import { query } from '../../config/database.js';
import { CartaoInput } from './cartoes.schemas.js';

export class CartoesService {
  async listAll(userId: string) {
    const hoje = new Date();
    const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    // Busca os cartões do usuário com dados da instituição
    const { rows: cartoes } = await query(
      `SELECT c.*,
        i.nome as instituicao_nome, i.icone as instituicao_icone, i.cor as instituicao_cor
       FROM cartao_credito c
       JOIN instituicao i ON i.id = c.instituicao_id
       WHERE c.usuario_id = $1
       ORDER BY c.ativo DESC, c.apelido ASC`,
      [userId]
    );

    // Para cada cartão, calcula o limite utilizado total e o valor da fatura do mês atual
    const result = await Promise.all(
      cartoes.map(async (cartao) => {
        // Soma das faturas abertas / futuras a partir do mês atual
        const { rows: gastoTotalRows } = await query(
          `SELECT COALESCE(SUM(valor), 0) as total_utilizado
           FROM lancamento
           WHERE cartao_id = $1 
             AND usuario_id = $2
             AND tipo = 'despesa'
             AND (data_competencia_fatura >= $3 OR data_competencia_fatura IS NULL)`,
          [cartao.id, userId, `${anoMesAtual}-01`]
        );

        // Soma dos gastos específicos da fatura do mês atual
        const { rows: faturaAtualRows } = await query(
          `SELECT COALESCE(SUM(valor), 0) as total_fatura
           FROM lancamento
           WHERE cartao_id = $1 
             AND usuario_id = $2
             AND tipo = 'despesa'
             AND TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $3`,
          [cartao.id, userId, anoMesAtual]
        );

        const limite = parseFloat(cartao.limite);
        const limiteUtilizado = parseFloat(gastoTotalRows[0]?.total_utilizado || '0');
        const faturaAtual = parseFloat(faturaAtualRows[0]?.total_fatura || '0');
        const limiteDisponivel = Math.max(0, limite - limiteUtilizado);

        return {
          ...cartao,
          limite: limite,
          limite_utilizado: limiteUtilizado,
          limite_disponivel: limiteDisponivel,
          fatura_atual: faturaAtual,
          percentual_utilizado: limite > 0 ? parseFloat(((limiteUtilizado / limite) * 100).toFixed(1)) : 0,
        };
      })
    );

    return result;
  }

  async getById(id: string, userId: string) {
    const { rows } = await query(
      `SELECT c.*,
        i.nome as instituicao_nome, i.icone as instituicao_icone, i.cor as instituicao_cor
       FROM cartao_credito c
       JOIN instituicao i ON i.id = c.instituicao_id
       WHERE c.id = $1 AND c.usuario_id = $2`,
      [id, userId]
    );
    return rows[0] || null;
  }

  async create(userId: string, input: CartaoInput) {
    const { rows } = await query(
      `INSERT INTO cartao_credito (usuario_id, instituicao_id, apelido, limite, dia_fechamento, dia_vencimento, ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        input.instituicao_id,
        input.apelido.trim(),
        input.limite,
        input.dia_fechamento,
        input.dia_vencimento,
        input.ativo ?? true,
      ]
    );
    return rows[0];
  }

  async update(id: string, userId: string, input: Partial<CartaoInput>) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (input.instituicao_id !== undefined) {
      fields.push(`instituicao_id = $${idx++}`);
      values.push(input.instituicao_id);
    }
    if (input.apelido !== undefined) {
      fields.push(`apelido = $${idx++}`);
      values.push(input.apelido.trim());
    }
    if (input.limite !== undefined) {
      fields.push(`limite = $${idx++}`);
      values.push(input.limite);
    }
    if (input.dia_fechamento !== undefined) {
      fields.push(`dia_fechamento = $${idx++}`);
      values.push(input.dia_fechamento);
    }
    if (input.dia_vencimento !== undefined) {
      fields.push(`dia_vencimento = $${idx++}`);
      values.push(input.dia_vencimento);
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
      `UPDATE cartao_credito SET ${fields.join(', ')} WHERE id = $${idIdx} AND usuario_id = $${userIdx} RETURNING *`,
      values
    );
    return rows[0] || null;
  }

  async delete(id: string, userId: string) {
    const { rows } = await query(
      'SELECT COUNT(*) as count FROM lancamento WHERE cartao_id = $1 AND usuario_id = $2',
      [id, userId]
    );
    if (parseInt(rows[0].count, 10) > 0) {
      throw new Error('Este cartão possui lançamentos vinculados. Desative-o em vez de excluí-lo.');
    }

    const { rowCount } = await query('DELETE FROM cartao_credito WHERE id = $1 AND usuario_id = $2', [id, userId]);
    return rowCount ? rowCount > 0 : false;
  }

  async getFatura(cartaoId: string, userId: string, anoMesParam?: string) {
    const hoje = new Date();
    const anoMes = anoMesParam || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const cartao = await this.getById(cartaoId, userId);
    if (!cartao) throw new Error('Cartão não encontrado.');

    // Busca todos os lançamentos pertencentes a este ciclo de fatura deste usuário
    const { rows: itens } = await query(
      `SELECT l.*,
        cat.nome as categoria_nome, cat.icone as categoria_icone, cat.cor as categoria_cor,
        subcat.nome as subcategoria_nome,
        cp.descricao as compra_parcelada_descricao
       FROM lancamento l
       JOIN categoria cat ON cat.id = l.categoria_id
       LEFT JOIN categoria subcat ON subcat.id = l.subcategoria_id
       LEFT JOIN compra_parcelada cp ON cp.id = l.compra_parcelada_id
       WHERE l.cartao_id = $1 
         AND l.usuario_id = $2
         AND TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $3
       ORDER BY l.data_compra ASC`,
      [cartaoId, userId, anoMes]
    );

    const totalFatura = itens.reduce((acc, item) => acc + parseFloat(item.valor), 0);

    return {
      cartao,
      anoMes,
      totalFatura,
      quantidadeItens: itens.length,
      itens,
    };
  }
}

export const cartoesService = new CartoesService();
