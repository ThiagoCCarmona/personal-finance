import { query } from '../../config/database.js';

export class DashboardService {
  async getResumoMes(anoMes?: string) {
    const hoje = new Date();
    const targetAnoMes = anoMes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const [anoStr, mesStr] = targetAnoMes.split('-');
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10);
    const mesAnteriorDate = new Date(ano, mes - 2, 1);
    const mesAnteriorAnoMes = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, '0')}`;

    // Gastos no mês atual (considerando competência contábil real ou mês da fatura)
    const { rows: rowsAtual } = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as total_despesas,
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as total_receitas
       FROM lancamento
       WHERE (
         TO_CHAR(data_compra, 'YYYY-MM') = $1
         OR TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $1
       ) AND status = 'efetivado'`,
      [targetAnoMes]
    );

    // Gastos no mês anterior
    const { rows: rowsAnterior } = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as total_despesas,
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as total_receitas
       FROM lancamento
       WHERE (
         TO_CHAR(data_compra, 'YYYY-MM') = $1
         OR TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $1
       ) AND status = 'efetivado'`,
      [mesAnteriorAnoMes]
    );

    // Saldo Consolidado disponível
    const { rows: rowsSaldo } = await query(
      `SELECT COALESCE(SUM(saldo_atual), 0) as saldo_consolidado FROM conta WHERE ativo = TRUE`
    );

    const despesasAtual = parseFloat(rowsAtual[0]?.total_despesas || '0');
    const receitasAtual = parseFloat(rowsAtual[0]?.total_receitas || '0');
    const despesasAnterior = parseFloat(rowsAnterior[0]?.total_despesas || '0');
    const receitasAnterior = parseFloat(rowsAnterior[0]?.total_receitas || '0');
    const saldoConsolidado = parseFloat(rowsSaldo[0]?.saldo_consolidado || '0');

    let variacaoDespesas = 0;
    if (despesasAnterior > 0) {
      variacaoDespesas = ((despesasAtual - despesasAnterior) / despesasAnterior) * 100;
    }

    return {
      periodo: targetAnoMes,
      mesAnterior: mesAnteriorAnoMes,
      saldoConsolidado,
      totalDespesas: despesasAtual,
      totalReceitas: receitasAtual,
      saldoMes: receitasAtual - despesasAtual,
      despesasMesAnterior: despesasAnterior,
      receitasMesAnterior: receitasAnterior,
      variacaoDespesasPercentual: parseFloat(variacaoDespesas.toFixed(1)),
    };
  }

  async getGastosPorCategoria(anoMes?: string) {
    const hoje = new Date();
    const targetAnoMes = anoMes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const { rows } = await query(
      `SELECT 
        c.id, c.nome, c.icone, c.cor,
        SUM(l.valor) as total
       FROM lancamento l
       JOIN categoria c ON c.id = l.categoria_id
       WHERE (
         TO_CHAR(l.data_compra, 'YYYY-MM') = $1 
         OR TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $1
       )
         AND l.tipo = 'despesa'
         AND l.status = 'efetivado'
       GROUP BY c.id, c.nome, c.icone, c.cor
       ORDER BY total DESC`,
      [targetAnoMes]
    );

    const totalGeral = rows.reduce((acc, r) => acc + parseFloat(r.total), 0);

    return rows.map(r => ({
      id: r.id,
      nome: r.nome,
      icone: r.icone,
      cor: r.cor,
      total: parseFloat(r.total),
      percentual: totalGeral > 0 ? parseFloat(((parseFloat(r.total) / totalGeral) * 100).toFixed(1)) : 0,
    }));
  }

  async getEvolucaoMensal(numMeses: number = 6) {
    const { rows } = await query(
      `SELECT 
        ano_mes,
        SUM(total_despesas) as total_despesas,
        SUM(total_receitas) as total_receitas
       FROM resumo_mensal
       GROUP BY ano_mes
       ORDER BY ano_mes DESC
       LIMIT $1`,
      [numMeses]
    );

    return rows.reverse().map(r => ({
      anoMes: r.ano_mes,
      despesas: parseFloat(r.total_despesas),
      receitas: parseFloat(r.total_receitas),
      resultado: parseFloat(r.total_receitas) - parseFloat(r.total_despesas),
    }));
  }

  /**
   * Contas e Faturas a Pagar do Mês + Comprometimento Futuro
   */
  async getContasAPagarDoMes(anoOuAnoMes?: string | number, mesParam?: number) {
    const hoje = new Date();
    let targetAnoMes = '';
    if (typeof anoOuAnoMes === 'number' && typeof mesParam === 'number') {
      targetAnoMes = `${anoOuAnoMes}-${String(mesParam).padStart(2, '0')}`;
    } else if (typeof anoOuAnoMes === 'string' && /^\d{4}-\d{2}$/.test(anoOuAnoMes)) {
      targetAnoMes = anoOuAnoMes;
    } else {
      targetAnoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    }

    // 1. Faturas de cada cartão de crédito para o mês
    const { rows: cartoes } = await query(
      `SELECT c.id, c.apelido, c.limite, c.dia_fechamento, c.dia_vencimento,
        inst.nome as instituicao_nome, inst.cor as instituicao_cor
       FROM cartao_credito c
       JOIN instituicao inst ON inst.id = c.instituicao_id
       WHERE c.ativo = TRUE`
    );

    const faturas = await Promise.all(
      cartoes.map(async (cartao) => {
        const { rows: faturaRows } = await query(
          `SELECT COALESCE(SUM(valor), 0) as total_fatura, COUNT(id) as total_itens
           FROM lancamento
           WHERE cartao_id = $1 
             AND tipo = 'despesa'
             AND TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $2`,
          [cartao.id, targetAnoMes]
        );

        const totalFatura = parseFloat(faturaRows[0]?.total_fatura || '0');
        const totalItens = parseInt(faturaRows[0]?.total_itens || '0', 10);

        return {
          cartao_id: cartao.id,
          cartao_apelido: cartao.apelido,
          instituicao_nome: cartao.instituicao_nome,
          instituicao_cor: cartao.instituicao_cor,
          dia_vencimento: cartao.dia_vencimento,
          data_vencimento: `${targetAnoMes}-${String(cartao.dia_vencimento).padStart(2, '0')}`,
          total_fatura: totalFatura,
          total_itens: totalItens,
        };
      })
    );

    // 2. Recorrências do mês com distinção "já lançado" vs "previsto, ainda não lançado"
    const { rows: recorrencias } = await query(
      `SELECT r.*,
        cat.nome as categoria_nome, cat.icone as categoria_icone, cat.cor as categoria_cor,
        c.apelido as conta_apelido, card.apelido as cartao_apelido
       FROM recorrencia r
       JOIN categoria cat ON cat.id = r.categoria_id
       LEFT JOIN conta c ON c.id = r.conta_id
       LEFT JOIN cartao_credito card ON card.id = r.cartao_id
       WHERE r.ativo = TRUE
       ORDER BY r.dia_referencia ASC`
    );

    const recorrenciasStatus = await Promise.all(
      recorrencias.map(async (rec) => {
        const { rows: lancRows } = await query(
          `SELECT id, valor, status FROM lancamento
           WHERE recorrencia_id = $1 
             AND (
               TO_CHAR(data_compra, 'YYYY-MM') = $2
               OR TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $2
             )
           LIMIT 1`,
          [rec.id, targetAnoMes]
        );

        const jaLancado = lancRows.length > 0;
        return {
          id: rec.id,
          descricao: rec.descricao,
          tipo: rec.tipo,
          valor: parseFloat(rec.valor),
          dia_referencia: rec.dia_referencia,
          data_vencimento: `${targetAnoMes}-${String(Math.min(rec.dia_referencia, 28)).padStart(2, '0')}`,
          categoria_nome: rec.categoria_nome,
          categoria_cor: rec.categoria_cor,
          forma_pagamento: rec.forma_pagamento,
          conta_apelido: rec.conta_apelido,
          cartao_apelido: rec.cartao_apelido,
          ja_lancado: jaLancado,
          lancamento_id: lancRows[0]?.id || null,
        };
      })
    );

    // 3. Comprometimento Futuro (soma de todas as parcelas com fatura posterior ao mês atual)
    const { rows: comprometimentoRows } = await query(
      `SELECT COALESCE(SUM(l.valor), 0) as total_comprometido,
        COUNT(l.id) as total_parcelas_futuras
       FROM lancamento l
       WHERE l.compra_parcelada_id IS NOT NULL 
         AND l.tipo = 'despesa'
         AND l.data_competencia_fatura > $1`,
      [`${targetAnoMes}-01`]
    );

    const totalComprometimentoFuturo = parseFloat(comprometimentoRows[0]?.total_comprometido || '0');
    const parcelasFuturasCount = parseInt(comprometimentoRows[0]?.total_parcelas_futuras || '0', 10);

    // Total de contas e faturas a pagar no mês (apenas despesas)
    const totalFaturasMes = faturas.reduce((acc, f) => acc + f.total_fatura, 0);
    const totalRecorrenciasNaoLancadas = recorrenciasStatus
      .filter(r => !r.ja_lancado && r.tipo === 'despesa')
      .reduce((acc, r) => acc + r.valor, 0);

    const totalPrevistoMes = totalFaturasMes + totalRecorrenciasNaoLancadas;

    return {
      periodo: targetAnoMes,
      totalPrevistoMes,
      totalFaturasMes,
      totalComprometimentoFuturo,
      parcelasFuturasCount,
      faturas,
      recorrencias: recorrenciasStatus,
    };
  }
}

export const dashboardService = new DashboardService();
