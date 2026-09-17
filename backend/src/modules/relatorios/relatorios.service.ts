import { query } from '../../config/database.js';

export class RelatoriosService {
  // Exporta extrato completo em CSV formatado para Excel (delimitador ';' e UTF-8 com BOM)
  async exportarLancamentosCsv(userId: string, dataInicio?: string, dataFim?: string, contaId?: string): Promise<string> {
    let sql = `
      SELECT 
        l.data_compra,
        l.data_competencia_fatura,
        l.descricao,
        l.tipo,
        l.valor,
        m.codigo AS moeda,
        c.apelido AS conta,
        cc.apelido AS cartao,
        cat.nome AS categoria,
        l.forma_pagamento,
        l.status
      FROM lancamento l
      LEFT JOIN moeda m ON m.id = l.moeda_id
      LEFT JOIN conta c ON c.id = l.conta_id
      LEFT JOIN cartao_credito cc ON cc.id = l.cartao_id
      LEFT JOIN categoria cat ON cat.id = l.categoria_id
      WHERE l.usuario_id = $1
    `;
    const params: any[] = [userId];

    if (dataInicio) {
      params.push(dataInicio);
      sql += ` AND l.data_compra >= $${params.length}`;
    }
    if (dataFim) {
      params.push(dataFim);
      sql += ` AND l.data_compra <= $${params.length}`;
    }
    if (contaId) {
      params.push(contaId);
      sql += ` AND l.conta_id = $${params.length}`;
    }

    sql += ' ORDER BY l.data_compra DESC';

    const res = await query(sql, params);

    const headers = ['Data Compra', 'Competência Fatura', 'Descrição', 'Tipo', 'Valor (BRL)', 'Moeda', 'Conta', 'Cartão', 'Categoria', 'Forma Pagamento', 'Status'];
    const rows = res.rows.map(r => [
      r.data_compra,
      r.data_competencia_fatura || '',
      `"${(r.descricao || '').replace(/"/g, '""')}"`,
      r.tipo,
      Number(r.valor).toFixed(2).replace('.', ','),
      r.moeda || 'BRL',
      `"${(r.conta || '').replace(/"/g, '""')}"`,
      `"${(r.cartao || '').replace(/"/g, '""')}"`,
      `"${(r.categoria || '').replace(/"/g, '""')}"`,
      r.forma_pagamento || '',
      r.status || ''
    ]);

    const BOM = '\uFEFF';
    return BOM + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
  }

  // Exporta balanço patrimonial consolidado (contas, investimentos e contas a receber)
  async exportarPatrimonioCsv(userId: string): Promise<string> {
    const BOM = '\uFEFF';
    const lines: string[] = [];

    // 1. Contas
    lines.push('=== CONTAS BANCÁRIAS E CARTEIRAS ===');
    lines.push('Conta;Instituição;Moeda;Saldo Atual (BRL)');
    const contasRes = await query(`
      SELECT c.apelido, i.nome AS instituicao, m.codigo AS moeda, c.saldo_atual 
      FROM conta c
      JOIN instituicao i ON i.id = c.instituicao_id
      JOIN moeda m ON m.id = c.moeda_id
      WHERE c.usuario_id = $1 AND c.ativo = TRUE
    `, [userId]);
    contasRes.rows.forEach(c => {
      lines.push(`"${c.apelido}";"${c.instituicao}";${c.moeda};${Number(c.saldo_atual).toFixed(2).replace('.', ',')}`);
    });

    lines.push('');
    // 2. Investimentos
    lines.push('=== CARTEIRA DE INVESTIMENTOS ===');
    lines.push('Ativo;Tipo;Ticker;Instituição;Quantidade;Preço Médio (BRL);Total Aplicado (BRL)');
    const invRes = await query(`
      SELECT i.nome, i.tipo, i.ticker, i.instituicao,
        COALESCE(SUM(CASE WHEN m.tipo = 'aporte' THEN m.quantidade WHEN m.tipo = 'resgate' THEN -m.quantidade ELSE 0 END), 0) as quantidade_total,
        COALESCE(SUM(CASE WHEN m.tipo = 'aporte' THEN m.valor WHEN m.tipo = 'resgate' THEN -m.valor ELSE 0 END), 0) as total
      FROM investimento i
      LEFT JOIN movimentacao_investimento m ON m.investimento_id = i.id
      WHERE i.usuario_id = $1 AND i.ativo = TRUE
      GROUP BY i.id
    `, [userId]);
    invRes.rows.forEach(i => {
      const qtd = parseFloat(i.quantidade_total || '0');
      const tot = parseFloat(i.total || '0');
      const pm = qtd > 0 ? tot / qtd : 0;
      lines.push(`"${i.nome}";${i.tipo};"${i.ticker || ''}";"${i.instituicao || ''}";${Number(qtd).toFixed(4).replace('.', ',')};${Number(pm).toFixed(2).replace('.', ',')};${Number(tot).toFixed(2).replace('.', ',')}`);
    });

    lines.push('');
    // 3. Contas a Receber (Social)
    lines.push('=== CRÉDITOS E CONTAS A RECEBER (SOCIAL) ===');
    lines.push('Devedor;Motivo;Data;Valor Total (BRL);Valor Pago (BRL);Saldo Devedor (BRL);Status');
    const divRes = await query(`
      SELECT p.nome AS devedor, d.motivo, d.data, d.valor_total, d.valor_pago, (d.valor_total - d.valor_pago - d.valor_perdoado) AS saldo, d.status
      FROM divida d
      JOIN pessoa p ON p.id = d.pessoa_id
      WHERE d.usuario_id = $1 AND d.status IN ('pendente', 'parcial')
    `, [userId]);
    divRes.rows.forEach(d => {
      lines.push(`"${d.devedor}";"${d.motivo}";${d.data};${Number(d.valor_total).toFixed(2).replace('.', ',')};${Number(d.valor_pago).toFixed(2).replace('.', ',')};${Number(d.saldo).toFixed(2).replace('.', ',')};${d.status}`);
    });

    return BOM + lines.join('\r\n');
  }

  async obterDashboard(userId: string, dataInicio?: string, dataFim?: string, contaId?: string) {
    let whereClause = "WHERE l.status = 'efetivado' AND l.usuario_id = $1";
    const params: any[] = [userId];

    if (dataInicio) {
      params.push(dataInicio);
      whereClause += ` AND l.data_compra >= $${params.length}`;
    }
    if (dataFim) {
      params.push(dataFim);
      whereClause += ` AND l.data_compra <= $${params.length}`;
    }
    if (contaId) {
      params.push(contaId);
      whereClause += ` AND l.conta_id = $${params.length}`;
    }

    // 1. Totais do período
    const totaisRes = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN l.tipo = 'receita' THEN l.valor ELSE 0 END), 0) AS total_receitas,
        COALESCE(SUM(CASE WHEN l.tipo = 'despesa' THEN l.valor ELSE 0 END), 0) AS total_despesas
      FROM lancamento l
      ${whereClause}
    `, params);

    const totalReceitas = parseFloat(totaisRes.rows[0]?.total_receitas || '0');
    const totalDespesas = parseFloat(totaisRes.rows[0]?.total_despesas || '0');
    const saldoPeriodo = Math.round((totalReceitas - totalDespesas) * 100) / 100;
    const taxaPoupanca = totalReceitas > 0 ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 1000) / 10 : 0;

    // 2. Gastos por Categoria
    const catRes = await query(`
      SELECT 
        c.nome,
        c.cor,
        c.icone,
        COALESCE(SUM(l.valor), 0) AS valor
      FROM lancamento l
      JOIN categoria c ON c.id = l.categoria_id
      ${whereClause} AND l.tipo = 'despesa'
      GROUP BY c.id, c.nome, c.cor, c.icone
      ORDER BY valor DESC
    `, params);

    const despesasPorCategoria = catRes.rows.map(r => {
      const v = parseFloat(r.valor);
      return {
        nome: r.nome,
        cor: r.cor || '#3b82f6',
        icone: r.icone || 'Tag',
        valor: v,
        percentual: totalDespesas > 0 ? Math.round((v / totalDespesas) * 1000) / 10 : 0
      };
    });

    // 3. Evolução Mensal (últimos 6 meses)
    const evolucaoRes = await query(`
      SELECT 
        TO_CHAR(data_compra, 'YYYY-MM') AS mes_ano,
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) AS receitas,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) AS despesas
      FROM lancamento
      WHERE status = 'efetivado'
        AND usuario_id = $1
        AND data_compra >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(data_compra, 'YYYY-MM')
      ORDER BY mes_ano ASC
    `, [userId]);

    const evolucaoMensal = evolucaoRes.rows.map(r => ({
      mes_ano: r.mes_ano,
      receitas: parseFloat(r.receitas),
      despesas: parseFloat(r.despesas),
      saldo: Math.round((parseFloat(r.receitas) - parseFloat(r.despesas)) * 100) / 100
    }));

    // 4. Maiores Despesas do Período
    const maioresRes = await query(`
      SELECT 
        l.id,
        l.descricao,
        l.valor,
        l.data_compra,
        c.nome AS categoria_nome,
        c.cor AS categoria_cor,
        l.forma_pagamento
      FROM lancamento l
      JOIN categoria c ON c.id = l.categoria_id
      ${whereClause} AND l.tipo = 'despesa'
      ORDER BY l.valor DESC
      LIMIT 5
    `, params);

    const maioresDespesas = maioresRes.rows.map(r => ({
      id: r.id,
      descricao: r.descricao,
      valor: parseFloat(r.valor),
      data: r.data_compra,
      categoria: r.categoria_nome,
      categoriaCor: r.categoria_cor,
      formaPagamento: r.forma_pagamento
    }));

    return {
      total_receitas: totalReceitas,
      total_despesas: totalDespesas,
      saldo_periodo: saldoPeriodo,
      taxa_poupanca_pct: taxaPoupanca,
      despesas_por_categoria: despesasPorCategoria,
      evolucao_mensal: evolucaoMensal,
      maiores_despesas: maioresDespesas
    };
  }
}

export const relatoriosService = new RelatoriosService();
