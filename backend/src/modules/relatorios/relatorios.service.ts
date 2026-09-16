import { query } from '../../config/database.js';

export class RelatoriosService {
  // Exporta extrato completo em CSV formatado para Excel (delimitador ';' e UTF-8 com BOM)
  async exportarLancamentosCsv(dataInicio?: string, dataFim?: string, contaId?: string): Promise<string> {
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
      WHERE 1=1
    `;
    const params: any[] = [];

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

    // Header CSV com ponto e vírgula
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

    // UTF-8 BOM para garantir acentos corretos no Excel brasileiro
    const BOM = '\uFEFF';
    return BOM + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
  }

  // Exporta balanço patrimonial consolidado (contas, investimentos e contas a receber)
  async exportarPatrimonioCsv(): Promise<string> {
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
      WHERE c.ativo = TRUE
    `);
    contasRes.rows.forEach(c => {
      lines.push(`"${c.apelido}";"${c.instituicao}";${c.moeda};${Number(c.saldo_atual).toFixed(2).replace('.', ',')}`);
    });

    lines.push('');
    // 2. Investimentos
    lines.push('=== CARTEIRA DE INVESTIMENTOS ===');
    lines.push('Ativo;Tipo;Ticker;Instituição;Quantidade;Preço Médio (BRL);Total Aplicado (BRL)');
    const invRes = await query(`
      SELECT i.nome, i.tipo, i.ticker, i.instituicao, i.quantidade_total, i.preco_medio, (i.quantidade_total * i.preco_medio) AS total
      FROM investimento i
      WHERE i.ativo = TRUE
    `);
    invRes.rows.forEach(i => {
      lines.push(`"${i.nome}";${i.tipo};"${i.ticker || ''}";"${i.instituicao || ''}";${Number(i.quantidade_total).toFixed(4).replace('.', ',')};${Number(i.preco_medio).toFixed(2).replace('.', ',')};${Number(i.total).toFixed(2).replace('.', ',')}`);
    });

    lines.push('');
    // 3. Contas a Receber (Social)
    lines.push('=== CRÉDITOS E CONTAS A RECEBER (SOCIAL) ===');
    lines.push('Devedor;Motivo;Data;Valor Total (BRL);Valor Pago (BRL);Saldo Devedor (BRL);Status');
    const divRes = await query(`
      SELECT p.nome AS devedor, d.motivo, d.data, d.valor_total, d.valor_pago, (d.valor_total - d.valor_pago - d.valor_perdoado) AS saldo, d.status
      FROM divida d
      JOIN pessoa p ON p.id = d.pessoa_id
      WHERE d.status IN ('pendente', 'parcial')
    `);
    divRes.rows.forEach(d => {
      lines.push(`"${d.devedor}";"${d.motivo}";${d.data};${Number(d.valor_total).toFixed(2).replace('.', ',')};${Number(d.valor_pago).toFixed(2).replace('.', ',')};${Number(d.saldo).toFixed(2).replace('.', ',')};${d.status}`);
    });

    return BOM + lines.join('\r\n');
  }
}

export const relatoriosService = new RelatoriosService();
