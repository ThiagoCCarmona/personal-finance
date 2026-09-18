import { query } from '../../config/database.js';

export class DashboardService {
  async getResumoMes(userId: string, anoMes?: string) {
    const hoje = new Date();
    const targetAnoMes = anoMes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const [anoStr, mesStr] = targetAnoMes.split('-');
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10);
    const mesAnteriorDate = new Date(ano, mes - 2, 1);
    const mesAnteriorAnoMes = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, '0')}`;

    // Gastos no mês atual
    // Cartão de crédito entra pela data_competencia_fatura.
    // Despesas sem cartão entram pela data_compra (ignorando pagamento de fatura para não duplicar).
    const { rows: rowsAtual } = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as total_despesas,
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as total_receitas
       FROM lancamento
       WHERE usuario_id = $1
         AND status = 'efetivado'
         AND (
           (cartao_id IS NOT NULL AND TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $2)
           OR
           (cartao_id IS NULL AND TO_CHAR(data_compra, 'YYYY-MM') = $2 AND NOT (descricao ILIKE 'Pagamento de Fatura%'))
         )`,
      [userId, targetAnoMes]
    );

    // Gastos no mês anterior
    const { rows: rowsAnterior } = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as total_despesas,
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as total_receitas
       FROM lancamento
       WHERE usuario_id = $1
         AND status = 'efetivado'
         AND (
           (cartao_id IS NOT NULL AND TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $2)
           OR
           (cartao_id IS NULL AND TO_CHAR(data_compra, 'YYYY-MM') = $2 AND NOT (descricao ILIKE 'Pagamento de Fatura%'))
         )`,
      [userId, mesAnteriorAnoMes]
    );

    // Saldo Consolidado disponível
    const { rows: rowsSaldo } = await query(
      `SELECT COALESCE(SUM(saldo_atual), 0) as saldo_consolidado 
       FROM conta 
       WHERE usuario_id = $1 AND ativo = TRUE`,
      [userId]
    );

    const despesasAtual = parseFloat(rowsAtual[0]?.total_despesas || '0');
    const receitasAtual = parseFloat(rowsAtual[0]?.total_receitas || '0');
    const despesasAnterior = parseFloat(rowsAnterior[0]?.total_despesas || '0');
    const receitasAnterior = parseFloat(rowsAnterior[0]?.total_receitas || '0');
    const saldoConsolidado = parseFloat(rowsSaldo[0]?.saldo_consolidado || '0');

    // Receitas recorrentes fixas ativas
    const { rows: rowsRecReceitasFixas } = await query(
      `SELECT COALESCE(SUM(valor), 0) as total_receitas_fixas
       FROM recorrencia
       WHERE usuario_id = $1 AND ativo = TRUE AND tipo = 'receita' AND (natureza = 'fixo' OR natureza IS NULL)`,
      [userId]
    );

    const { rows: rowsRecReceitasTotal } = await query(
      `SELECT COALESCE(SUM(valor), 0) as total_receitas_recorrentes
       FROM recorrencia
       WHERE usuario_id = $1 AND ativo = TRUE AND tipo = 'receita'`,
      [userId]
    );

    const totalReceitasFixas = parseFloat(rowsRecReceitasFixas[0]?.total_receitas_fixas || '0');
    const totalReceitasRecorrentes = parseFloat(rowsRecReceitasTotal[0]?.total_receitas_recorrentes || '0');

    // Base salarial para a regra 50-30-20: prioriza receitas fixas recorrentes; se não houver, usa receitas do mês
    const baseReceitas503020 = totalReceitasFixas > 0 ? totalReceitasFixas : receitasAtual;

    // Faturas de cartões de crédito abertas vigentes para o mês consultado
    const { rows: cartoesAtivos } = await query(
      `SELECT c.id, c.dia_fechamento, c.dia_vencimento
       FROM cartao_credito c
       WHERE c.usuario_id = $1 AND c.ativo = TRUE`,
      [userId]
    );

    let totalFaturasMes = 0;

    for (const cartao of cartoesAtivos) {
      // Verifica se a fatura da competência consultada já foi paga
      const { rows: fatPagaComp } = await query(
        `SELECT 1 FROM fatura_paga WHERE cartao_id = $1 AND usuario_id = $2 AND ano_mes = $3`,
        [cartao.id, userId, targetAnoMes]
      );

      if (fatPagaComp.length === 0) {
        const { rows: fatRows } = await query(
          `SELECT COALESCE(SUM(l.valor), 0) as total
           FROM lancamento l
           WHERE l.cartao_id = $1
             AND l.usuario_id = $2
             AND l.tipo = 'despesa'
             AND TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $3`,
          [cartao.id, userId, targetAnoMes]
        );
        totalFaturasMes += parseFloat(fatRows[0]?.total || '0');
      }
    }

    totalFaturasMes = Math.round(totalFaturasMes * 100) / 100;

    // Despesas recorrentes fixas debitadas em conta (não cartão)
    const { rows: rowsRecDespesas } = await query(
      `SELECT COALESCE(SUM(valor), 0) as total_despesas_recorrentes_conta
       FROM recorrencia
       WHERE usuario_id = $1 
         AND ativo = TRUE 
         AND tipo = 'despesa'
         AND (cartao_id IS NULL OR forma_pagamento != 'credito')`,
      [userId]
    );

    const totalDespesasRecorrentesConta = parseFloat(rowsRecDespesas[0]?.total_despesas_recorrentes_conta || '0');

    // Saldo projetado no próximo ciclo: Saldo atual + Receitas Recorrentes - Faturas Abertas - Despesas Fixas em Conta
    const saldoProjetadoMesSeguinte = Math.round((saldoConsolidado + totalReceitasRecorrentes - totalFaturasMes - totalDespesasRecorrentesConta) * 100) / 100;

    let variacaoDespesas = 0;
    if (despesasAnterior > 0) {
      variacaoDespesas = ((despesasAtual - despesasAnterior) / despesasAnterior) * 100;
    }

    // Cálculo da Regra 50-30-20 (Essenciais 50%, Estilo de Vida 30%, Investimentos 20%)
    const { rows: rowsGastosGrupo } = await query(
      `SELECT 
        COALESCE(c.grupo_50_30_20, 'essencial') as grupo,
        COALESCE(SUM(l.valor), 0) as total
       FROM lancamento l
       JOIN categoria c ON c.id = l.categoria_id
       WHERE l.usuario_id = $1
         AND l.tipo = 'despesa'
         AND l.status = 'efetivado'
         AND (
           (l.cartao_id IS NOT NULL AND TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $2)
           OR
           (l.cartao_id IS NULL AND TO_CHAR(l.data_compra, 'YYYY-MM') = $2 AND NOT (l.descricao ILIKE 'Pagamento de Fatura%'))
         )
       GROUP BY COALESCE(c.grupo_50_30_20, 'essencial')`,
      [userId, targetAnoMes]
    );

    let gastoEssencial = 0;
    let gastoEstiloVida = 0;
    let gastoInvestimento = 0;

    for (const r of rowsGastosGrupo) {
      const val = parseFloat(r.total || '0');
      if (r.grupo === 'estilo_vida') {
        gastoEstiloVida += val;
      } else if (r.grupo === 'investimento') {
        gastoInvestimento += val;
      } else {
        // 'essencial' ou qualquer outro
        gastoEssencial += val;
      }
    }

    const tetoEssencial = Math.round(baseReceitas503020 * 0.50 * 100) / 100;
    const tetoEstiloVida = Math.round(baseReceitas503020 * 0.30 * 100) / 100;
    const tetoInvestimento = Math.round(baseReceitas503020 * 0.20 * 100) / 100;

    const calcGrupo = (teto: number, gasto: number) => {
      const restante = Math.round((teto - gasto) * 100) / 100;
      const pctRestante = teto > 0 ? Math.max(0, Math.min(100, Math.round((restante / teto) * 100))) : 0;
      const pctGasto = teto > 0 ? Math.min(100, Math.round((gasto / teto) * 100)) : 0;
      return {
        teto,
        gasto,
        restante,
        percentualDisponivel: pctRestante,
        percentualGasto: pctGasto,
        estourado: gasto > teto,
      };
    };

    const regra503020 = {
      baseReceitas: baseReceitas503020,
      essenciais: calcGrupo(tetoEssencial, gastoEssencial),
      estiloVida: calcGrupo(tetoEstiloVida, gastoEstiloVida),
      investimentos: calcGrupo(tetoInvestimento, gastoInvestimento),
    };

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
      saldoProjetadoMesSeguinte,
      totalReceitasRecorrentes,
      totalReceitasFixas,
      totalFaturasMes,
      totalDespesasRecorrentesConta,
      regra503020,
    };
  }

  async getGastosPorCategoria(userId: string, anoMes?: string) {
    const hoje = new Date();
    const targetAnoMes = anoMes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    const { rows } = await query(
      `SELECT 
        c.id, c.nome, c.icone, c.cor,
        SUM(l.valor) as total
       FROM lancamento l
       JOIN categoria c ON c.id = l.categoria_id
       WHERE l.usuario_id = $1
         AND l.tipo = 'despesa'
         AND l.status = 'efetivado'
         AND (
           (l.cartao_id IS NOT NULL AND TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $2)
           OR
           (l.cartao_id IS NULL AND TO_CHAR(l.data_compra, 'YYYY-MM') = $2 AND NOT (l.descricao ILIKE 'Pagamento de Fatura%'))
         )
       GROUP BY c.id, c.nome, c.icone, c.cor
       ORDER BY total DESC`,
      [userId, targetAnoMes]
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

  async getEvolucaoMensal(userId: string, numMeses: number = 6) {
    const { rows } = await query(
      `SELECT 
        ano_mes,
        SUM(total_despesas) as total_despesas,
        SUM(total_receitas) as total_receitas
       FROM resumo_mensal
       WHERE usuario_id = $1
       GROUP BY ano_mes
       ORDER BY ano_mes DESC
       LIMIT $2`,
      [userId, numMeses]
    );

    return rows.reverse().map(r => ({
      anoMes: r.ano_mes,
      despesas: parseFloat(r.total_despesas),
      receitas: parseFloat(r.total_receitas),
      resultado: parseFloat(r.total_receitas) - parseFloat(r.total_despesas),
    }));
  }

  async getContasAPagarDoMes(userId: string, anoOuAnoMes?: string | number, mesParam?: number) {
    const hoje = new Date();
    let targetAnoMes = '';
    if (typeof anoOuAnoMes === 'number' && typeof mesParam === 'number') {
      targetAnoMes = `${anoOuAnoMes}-${String(mesParam).padStart(2, '0')}`;
    } else if (typeof anoOuAnoMes === 'string' && /^\d{4}-\d{2}$/.test(anoOuAnoMes)) {
      targetAnoMes = anoOuAnoMes;
    } else {
      targetAnoMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    }

    // 1. Faturas de cada cartão de crédito para a competência do mês consultado
    const { rows: cartoes } = await query(
      `SELECT c.id, c.apelido, c.limite, c.dia_fechamento, c.dia_vencimento,
        inst.nome as instituicao_nome, inst.cor as instituicao_cor
       FROM cartao_credito c
       JOIN instituicao inst ON inst.id = c.instituicao_id
       WHERE c.usuario_id = $1 AND c.ativo = TRUE`,
      [userId]
    );

    const faturas = await Promise.all(
      cartoes.map(async (cartao) => {
        const { rows: faturaRows } = await query(
          `SELECT 
            COALESCE(SUM(valor), 0) as total_fatura, 
            COUNT(id) as total_itens,
            EXISTS (
              SELECT 1 FROM fatura_paga fp 
              WHERE fp.cartao_id = $1 
                AND fp.usuario_id = $2 
                AND fp.ano_mes = $3
            ) as fatura_paga
           FROM lancamento
           WHERE cartao_id = $1 
             AND usuario_id = $2
             AND tipo = 'despesa'
             AND TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $3`,
          [cartao.id, userId, targetAnoMes]
        );

        const totalFatura = parseFloat(faturaRows[0]?.total_fatura || '0');
        const totalItens = parseInt(faturaRows[0]?.total_itens || '0', 10);
        const faturaPaga = Boolean(faturaRows[0]?.fatura_paga);

        return {
          cartao_id: cartao.id,
          cartao_apelido: cartao.apelido,
          instituicao_nome: cartao.instituicao_nome,
          instituicao_cor: cartao.instituicao_cor,
          dia_vencimento: cartao.dia_vencimento,
          ano_mes: targetAnoMes,
          data_vencimento: `${targetAnoMes}-${String(cartao.dia_vencimento).padStart(2, '0')}`,
          total_fatura: totalFatura,
          total_itens: totalItens,
          paga: faturaPaga,
        };
      })
    );

    // 2. Recorrências do mês
    const { rows: recorrencias } = await query(
      `SELECT r.*,
        cat.nome as categoria_nome, cat.icone as categoria_icone, cat.cor as categoria_cor,
        c.apelido as conta_apelido, card.apelido as cartao_apelido
       FROM recorrencia r
       JOIN categoria cat ON cat.id = r.categoria_id
       LEFT JOIN conta c ON c.id = r.conta_id
       LEFT JOIN cartao_credito card ON card.id = r.cartao_id
       WHERE r.usuario_id = $1 AND r.ativo = TRUE
       ORDER BY r.dia_referencia ASC`,
      [userId]
    );

    const recorrenciasStatus = await Promise.all(
      recorrencias.map(async (rec) => {
        const { rows: lancRows } = await query(
          `SELECT id, valor, status FROM lancamento
           WHERE recorrencia_id = $1 
             AND usuario_id = $2
             AND (
               TO_CHAR(data_compra, 'YYYY-MM') = $3
               OR TO_CHAR(data_competencia_fatura, 'YYYY-MM') = $3
             )
           LIMIT 1`,
          [rec.id, userId, targetAnoMes]
        );

        const jaLancado = lancRows.length > 0;
        return {
          id: rec.id,
          descricao: rec.descricao,
          tipo: rec.tipo,
          natureza: rec.natureza || 'fixo',
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

    // 3. Comprometimento Futuro
    const { rows: comprometimentoRows } = await query(
      `SELECT COALESCE(SUM(l.valor), 0) as total_comprometido,
        COUNT(l.id) as total_parcelas_futuras
       FROM lancamento l
       WHERE l.usuario_id = $1
         AND l.compra_parcelada_id IS NOT NULL 
         AND l.tipo = 'despesa'
         AND l.data_competencia_fatura > $2`,
      [userId, `${targetAnoMes}-01`]
    );

    const totalComprometimentoFuturo = parseFloat(comprometimentoRows[0]?.total_comprometido || '0');
    const parcelasFuturasCount = parseInt(comprometimentoRows[0]?.total_parcelas_futuras || '0', 10);

    const totalFaturasMes = faturas
      .filter(f => !f.paga)
      .reduce((acc, f) => acc + f.total_fatura, 0);
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
