import { query, withTransaction } from '../../config/database.js';
import { LancamentoFilter, LancamentoInput } from './lancamentos.schemas.js';
import { calcularCompetenciaFatura } from '../../utils/fatura.utils.js';

export class LancamentosService {
  async listAll(filters: LancamentoFilter) {
    let whereClauses: string[] = ['1=1'];
    const params: any[] = [];

    if (filters.dataInicio) {
      params.push(filters.dataInicio);
      whereClauses.push(`l.data_compra >= $${params.length}`);
    }

    if (filters.dataFim) {
      params.push(filters.dataFim);
      whereClauses.push(`l.data_compra <= $${params.length}`);
    }

    if (filters.mesFatura) {
      params.push(filters.mesFatura);
      whereClauses.push(`TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $${params.length}`);
    }

    if (filters.categoriaId) {
      params.push(filters.categoriaId);
      whereClauses.push(`(l.categoria_id = $${params.length} OR l.subcategoria_id = $${params.length})`);
    }

    if (filters.contaId) {
      params.push(filters.contaId);
      whereClauses.push(`l.conta_id = $${params.length}`);
    }

    if (filters.cartaoId) {
      params.push(filters.cartaoId);
      whereClauses.push(`l.cartao_id = $${params.length}`);
    }

    if (filters.tipo) {
      params.push(filters.tipo);
      whereClauses.push(`l.tipo = $${params.length}`);
    }

    if (filters.formaPagamento) {
      params.push(filters.formaPagamento);
      whereClauses.push(`l.forma_pagamento = $${params.length}`);
    }

    if (filters.busca) {
      params.push(`%${filters.busca}%`);
      whereClauses.push(`l.descricao ILIKE $${params.length}`);
    }

    const whereSql = whereClauses.join(' AND ');

    // Contagem total para paginação
    const countQuery = `SELECT COUNT(*) as total FROM lancamento l WHERE ${whereSql}`;
    const { rows: countRows } = await query(countQuery, params);
    const total = parseInt(countRows[0].total, 10);

    const offset = (filters.page - 1) * filters.limit;
    params.push(filters.limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataQuery = `
      SELECT 
        l.*,
        c.apelido as conta_apelido,
        card.apelido as cartao_apelido,
        cat.nome as categoria_nome, cat.icone as categoria_icone, cat.cor as categoria_cor,
        subcat.nome as subcategoria_nome,
        m.codigo as moeda_codigo, m.simbolo as moeda_simbolo
      FROM lancamento l
      LEFT JOIN conta c ON c.id = l.conta_id
      LEFT JOIN cartao_credito card ON card.id = l.cartao_id
      JOIN categoria cat ON cat.id = l.categoria_id
      LEFT JOIN categoria subcat ON subcat.id = l.subcategoria_id
      JOIN moeda m ON m.id = l.moeda_id
      WHERE ${whereSql}
      ORDER BY l.data_compra DESC, l.criado_em DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const { rows } = await query(dataQuery, params);

    return {
      data: rows,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getById(id: string) {
    const { rows } = await query(
      `SELECT 
        l.*,
        c.apelido as conta_apelido,
        card.apelido as cartao_apelido,
        cat.nome as categoria_nome, cat.icone as categoria_icone, cat.cor as categoria_cor,
        subcat.nome as subcategoria_nome,
        m.codigo as moeda_codigo, m.simbolo as moeda_simbolo
      FROM lancamento l
      LEFT JOIN conta c ON c.id = l.conta_id
      LEFT JOIN cartao_credito card ON card.id = l.cartao_id
      JOIN categoria cat ON cat.id = l.categoria_id
      LEFT JOIN categoria subcat ON subcat.id = l.subcategoria_id
      JOIN moeda m ON m.id = l.moeda_id
      WHERE l.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async create(input: LancamentoInput) {
    return withTransaction(async (client) => {
      // 1. Validar forma de pagamento e moeda
      let moedaId = input.moeda_id;
      if (!moedaId) {
        if (input.conta_id) {
          const { rows: contaRows } = await client.query('SELECT moeda_id FROM conta WHERE id = $1', [input.conta_id]);
          moedaId = contaRows[0]?.moeda_id;
        }
        if (!moedaId) {
          const { rows: brlRows } = await client.query("SELECT id FROM moeda WHERE codigo = 'BRL' LIMIT 1");
          moedaId = brlRows[0]?.id;
        }
      }

      // 2. Se for compra no crédito e não informou a competência da fatura, calcula pelo fechamento do cartão
      let dataCompetenciaFatura = input.data_competencia_fatura || null;
      if (input.forma_pagamento === 'credito' && input.cartao_id && !dataCompetenciaFatura) {
        const { rows: cartaoRows } = await client.query(
          'SELECT dia_fechamento, dia_vencimento FROM cartao_credito WHERE id = $1',
          [input.cartao_id]
        );
        if (cartaoRows.length > 0) {
          const c = cartaoRows[0];
          const ciclo = calcularCompetenciaFatura(input.data_compra, c.dia_fechamento, c.dia_vencimento);
          dataCompetenciaFatura = ciclo.dataCompetenciaFatura;
        }
      }

      // 3. Inserir o lançamento
      const { rows } = await client.query(
        `INSERT INTO lancamento (
          tipo, valor, moeda_id, data_compra, data_competencia_fatura,
          forma_pagamento, conta_id, cartao_id, categoria_id, subcategoria_id,
          descricao, anexo_url, recorrencia_id, compra_parcelada_id,
          numero_parcela, total_parcelas, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *`,
        [
          input.tipo,
          input.valor,
          moedaId,
          input.data_compra,
          dataCompetenciaFatura,
          input.forma_pagamento,
          input.conta_id || null,
          input.cartao_id || null,
          input.categoria_id,
          input.subcategoria_id || null,
          input.descricao.trim(),
          input.anexo_url || null,
          input.recorrencia_id || null,
          input.compra_parcelada_id || null,
          input.numero_parcela || null,
          input.total_parcelas || null,
          input.status || 'efetivado',
        ]
      );

      const novoLancamento = rows[0];

      // 4. Atualizar saldo da conta apenas se houver conta_id vinculada e status efetivado
      if (input.status === 'efetivado' && input.conta_id) {
        const delta = input.tipo === 'receita' ? input.valor : -input.valor;
        await client.query(
          'UPDATE conta SET saldo_atual = saldo_atual + $1, atualizado_em = NOW() WHERE id = $2',
          [delta, input.conta_id]
        );
      }

      // 5. Atualizar agregador resumo_mensal
      if (input.status === 'efetivado') {
        const anoMes = (dataCompetenciaFatura || input.data_compra).substring(0, 7);
        const despesaDelta = input.tipo === 'despesa' ? input.valor : 0;
        const receitaDelta = input.tipo === 'receita' ? input.valor : 0;

        // Se tiver conta_id, agrega por conta; se for apenas cartão, usa a agregação de categoria
        if (input.conta_id) {
          await client.query(
            `INSERT INTO resumo_mensal (ano_mes, categoria_id, conta_id, total_despesas, total_receitas)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (ano_mes, categoria_id, conta_id)
             DO UPDATE SET 
               total_despesas = resumo_mensal.total_despesas + EXCLUDED.total_despesas,
               total_receitas = resumo_mensal.total_receitas + EXCLUDED.total_receitas,
               atualizado_em = NOW()`,
            [anoMes, input.categoria_id, input.conta_id, despesaDelta, receitaDelta]
          );
        }
      }

      return novoLancamento;
    });
  }

  async update(id: string, input: LancamentoInput) {
    return withTransaction(async (client) => {
      // 1. Obter registro atual com lock
      const { rows: currentRows } = await client.query(
        'SELECT * FROM lancamento WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (currentRows.length === 0) throw new Error('Lançamento não encontrado');
      const antigo = currentRows[0];

      // 2. Reverter saldo da conta anterior se havia conta_id e estava efetivado
      if (antigo.status === 'efetivado' && antigo.conta_id) {
        const revertDelta = antigo.tipo === 'receita' ? -parseFloat(antigo.valor) : parseFloat(antigo.valor);
        await client.query(
          'UPDATE conta SET saldo_atual = saldo_atual + $1 WHERE id = $2',
          [revertDelta, antigo.conta_id]
        );

        const anoMesAntigo = (antigo.data_competencia_fatura || antigo.data_compra).toISOString ? (antigo.data_competencia_fatura || antigo.data_compra).toISOString().substring(0, 7) : String(antigo.data_competencia_fatura || antigo.data_compra).substring(0, 7);
        const revertDespesa = antigo.tipo === 'despesa' ? parseFloat(antigo.valor) : 0;
        const revertReceita = antigo.tipo === 'receita' ? parseFloat(antigo.valor) : 0;

        await client.query(
          `UPDATE resumo_mensal 
           SET total_despesas = GREATEST(0, total_despesas - $1),
               total_receitas = GREATEST(0, total_receitas - $2),
               atualizado_em = NOW()
           WHERE ano_mes = $3 AND categoria_id = $4 AND conta_id = $5`,
          [revertDespesa, revertReceita, anoMesAntigo, antigo.categoria_id, antigo.conta_id]
        );
      }

      // 3. Determinar competência de fatura se for cartão
      let dataCompetenciaFatura = input.data_competencia_fatura || null;
      if (input.forma_pagamento === 'credito' && input.cartao_id && !dataCompetenciaFatura) {
        const { rows: cartaoRows } = await client.query(
          'SELECT dia_fechamento, dia_vencimento FROM cartao_credito WHERE id = $1',
          [input.cartao_id]
        );
        if (cartaoRows.length > 0) {
          const c = cartaoRows[0];
          const ciclo = calcularCompetenciaFatura(input.data_compra, c.dia_fechamento, c.dia_vencimento);
          dataCompetenciaFatura = ciclo.dataCompetenciaFatura;
        }
      }

      // 4. Atualizar o lançamento
      const { rows: updatedRows } = await client.query(
        `UPDATE lancamento SET
          tipo = $1, valor = $2, data_compra = $3, data_competencia_fatura = $4,
          forma_pagamento = $5, conta_id = $6, cartao_id = $7, categoria_id = $8, subcategoria_id = $9,
          descricao = $10, anexo_url = $11, status = $12, atualizado_em = NOW()
        WHERE id = $13
        RETURNING *`,
        [
          input.tipo,
          input.valor,
          input.data_compra,
          dataCompetenciaFatura,
          input.forma_pagamento,
          input.conta_id || null,
          input.cartao_id || null,
          input.categoria_id,
          input.subcategoria_id || null,
          input.descricao.trim(),
          input.anexo_url || null,
          input.status || 'efetivado',
          id,
        ]
      );

      const novo = updatedRows[0];

      // 5. Aplicar novos saldos se houver conta e estiver efetivado
      if (novo.status === 'efetivado' && novo.conta_id) {
        const novoDelta = novo.tipo === 'receita' ? parseFloat(novo.valor) : -parseFloat(novo.valor);
        await client.query(
          'UPDATE conta SET saldo_atual = saldo_atual + $1 WHERE id = $2',
          [novoDelta, novo.conta_id]
        );

        const anoMesNovo = (dataCompetenciaFatura || input.data_compra).substring(0, 7);
        const novaDespesa = novo.tipo === 'despesa' ? parseFloat(novo.valor) : 0;
        const novaReceita = novo.tipo === 'receita' ? parseFloat(novo.valor) : 0;

        await client.query(
          `INSERT INTO resumo_mensal (ano_mes, categoria_id, conta_id, total_despesas, total_receitas)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (ano_mes, categoria_id, conta_id)
           DO UPDATE SET 
             total_despesas = resumo_mensal.total_despesas + EXCLUDED.total_despesas,
             total_receitas = resumo_mensal.total_receitas + EXCLUDED.total_receitas,
             atualizado_em = NOW()`,
          [anoMesNovo, novo.categoria_id, novo.conta_id, novaDespesa, novaReceita]
        );
      }

      return novo;
    });
  }

  async delete(id: string) {
    return withTransaction(async (client) => {
      const { rows } = await client.query('SELECT * FROM lancamento WHERE id = $1 FOR UPDATE', [id]);
      if (rows.length === 0) return false;

      const lancamento = rows[0];

      if (lancamento.status === 'efetivado' && lancamento.conta_id) {
        const revertDelta = lancamento.tipo === 'receita' ? -parseFloat(lancamento.valor) : parseFloat(lancamento.valor);
        await client.query(
          'UPDATE conta SET saldo_atual = saldo_atual + $1 WHERE id = $2',
          [revertDelta, lancamento.conta_id]
        );

        const anoMes = (lancamento.data_competencia_fatura || lancamento.data_compra).toISOString ? (lancamento.data_competencia_fatura || lancamento.data_compra).toISOString().substring(0, 7) : String(lancamento.data_competencia_fatura || lancamento.data_compra).substring(0, 7);
        const revertDespesa = lancamento.tipo === 'despesa' ? parseFloat(lancamento.valor) : 0;
        const revertReceita = lancamento.tipo === 'receita' ? parseFloat(lancamento.valor) : 0;

        await client.query(
          `UPDATE resumo_mensal 
           SET total_despesas = GREATEST(0, total_despesas - $1),
               total_receitas = GREATEST(0, total_receitas - $2),
               atualizado_em = NOW()
           WHERE ano_mes = $3 AND categoria_id = $4 AND conta_id = $5`,
          [revertDespesa, revertReceita, anoMes, lancamento.categoria_id, lancamento.conta_id]
        );
      }

      await client.query('DELETE FROM lancamento WHERE id = $1', [id]);
      return true;
    });
  }
}

export const lancamentosService = new LancamentosService();
