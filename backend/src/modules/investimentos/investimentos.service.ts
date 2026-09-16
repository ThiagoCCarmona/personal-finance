import { query } from '../../config/database.js';
import {
  CriarInvestimentoInput,
  AtualizarInvestimentoInput,
  CriarMovimentacaoInput,
} from './investimentos.schemas.js';

export interface PosicaoAtivo {
  id: string;
  tipo: string;
  nome: string;
  ticker: string | null;
  moeda_codigo: string;
  instituicao: string | null;
  indexador: string | null;
  taxa_anual: number | null;
  data_vencimento: string | null;
  ativo: boolean;
  quantidade_total: number;
  total_aportado: number;
  total_resgatado: number;
  total_rendimentos: number;
  saldo_aplicado: number;
  preco_medio: number;
}

export class InvestimentosService {
  async listar(): Promise<PosicaoAtivo[]> {
    const sql = [
      'SELECT',
      '  i.id,',
      '  i.tipo,',
      '  i.nome,',
      '  i.ticker,',
      '  m.codigo as moeda_codigo,',
      '  i.instituicao,',
      '  i.indexador,',
      '  i.taxa_anual::float,',
      '  i.data_vencimento::text,',
      '  i.ativo,',
      '  COALESCE(SUM(CASE WHEN m_inv.tipo = \'aporte\' THEN m_inv.quantidade WHEN m_inv.tipo = \'resgate\' THEN -m_inv.quantidade ELSE 0 END), 0)::float as quantidade_total,',
      '  COALESCE(SUM(CASE WHEN m_inv.tipo = \'aporte\' THEN m_inv.valor ELSE 0 END), 0)::float as total_aportado,',
      '  COALESCE(SUM(CASE WHEN m_inv.tipo = \'resgate\' THEN m_inv.valor ELSE 0 END), 0)::float as total_resgatado,',
      '  COALESCE(SUM(CASE WHEN m_inv.tipo = \'rendimento\' THEN m_inv.valor ELSE 0 END), 0)::float as total_rendimentos',
      'FROM investimento i',
      'JOIN moeda m ON m.id = i.moeda_id',
      'LEFT JOIN movimentacao_investimento m_inv ON m_inv.investimento_id = i.id',
      'GROUP BY i.id, m.codigo',
      'ORDER BY i.tipo, i.nome'
    ].join('\n');

    const { rows } = await query(sql);

    return rows.map((row: any) => {
      const saldoAplicado = Number((row.total_aportado - row.total_resgatado).toFixed(2));
      const quantidadeTotal = Number(row.quantidade_total.toFixed(8));
      const precoMedio = quantidadeTotal > 0 && saldoAplicado > 0
        ? Number((saldoAplicado / quantidadeTotal).toFixed(4))
        : 0;

      return {
        id: row.id,
        tipo: row.tipo,
        nome: row.nome,
        ticker: row.ticker,
        moeda_codigo: row.moeda_codigo,
        instituicao: row.instituicao,
        indexador: row.indexador,
        taxa_anual: row.taxa_anual,
        data_vencimento: row.data_vencimento,
        ativo: row.ativo,
        quantidade_total: quantidadeTotal,
        total_aportado: Number(row.total_aportado.toFixed(2)),
        total_resgatado: Number(row.total_resgatado.toFixed(2)),
        total_rendimentos: Number(row.total_rendimentos.toFixed(2)),
        saldo_aplicado: saldoAplicado,
        preco_medio: precoMedio,
      };
    });
  }

  async criar(data: CriarInvestimentoInput) {
    const sql = 'INSERT INTO investimento (tipo, nome, ticker, moeda_id, instituicao, indexador, taxa_anual, data_vencimento) VALUES (, , , , , , , ) RETURNING *';
    const { rows } = await query(sql, [
      data.tipo,
      data.nome,
      data.ticker || null,
      data.moeda_id,
      data.instituicao || null,
      data.indexador || null,
      data.taxa_anual || null,
      data.data_vencimento || null,
    ]);
    return rows[0];
  }

  async atualizar(id: string, data: AtualizarInvestimentoInput) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    Object.entries(data).forEach(([key, val]) => {
      if (val !== undefined) {
        fields.push(key + ' = $' + idx);
        values.push(val);
        idx++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const sql = 'UPDATE investimento SET ' + fields.join(', ') + ', atualizado_em = NOW() WHERE id = $' + idx + ' RETURNING *';
    const { rows } = await query(sql, values);
    return rows[0] || null;
  }

  async remover(id: string) {
    const { rowCount } = await query('DELETE FROM investimento WHERE id = ', [id]);
    return (rowCount ?? 0) > 0;
  }

  async listarMovimentacoes(investimentoId?: string) {
    let sql = 'SELECT m.*, i.nome as investimento_nome, i.ticker as investimento_ticker, i.tipo as investimento_tipo FROM movimentacao_investimento m JOIN investimento i ON i.id = m.investimento_id';
    const values: any[] = [];
    if (investimentoId) {
      sql += ' WHERE m.investimento_id = ';
      values.push(investimentoId);
    }
    sql += ' ORDER BY m.data DESC, m.criado_em DESC';

    const { rows } = await query(sql, values);
    return rows;
  }

  async registrarMovimentacao(data: CriarMovimentacaoInput) {
    const cotacao = data.cotacao_praticada || (data.valor / data.quantidade);
    const sql = 'INSERT INTO movimentacao_investimento (investimento_id, tipo, valor, quantidade, cotacao_praticada, data, observacao) VALUES (, , , , , , ) RETURNING *';
    const { rows } = await query(sql, [
      data.investimento_id,
      data.tipo,
      data.valor,
      data.quantidade,
      cotacao,
      data.data,
      data.observacao || null,
    ]);
    return rows[0];
  }

  async removerMovimentacao(movimentacaoId: string) {
    const { rowCount } = await query('DELETE FROM movimentacao_investimento WHERE id = ', [movimentacaoId]);
    return (rowCount ?? 0) > 0;
  }

  async getResumoCarteira() {
    const posicoes = await this.listar();
    let totalPatrimonio = 0;
    let totalRendimentos = 0;
    let totalAportado = 0;

    const porTipo: Record<string, number> = {
      renda_fixa: 0,
      acao: 0,
      fii: 0,
      cripto: 0,
      moeda_estrangeira: 0,
    };

    posicoes.forEach((p) => {
      const saldo = p.saldo_aplicado > 0 ? p.saldo_aplicado : 0;
      totalPatrimonio += saldo;
      totalAportado += p.total_aportado;
      totalRendimentos += p.total_rendimentos;
      if (porTipo[p.tipo] !== undefined) {
        porTipo[p.tipo] += saldo;
      }
    });

    return {
      total_patrimonio: Number(totalPatrimonio.toFixed(2)),
      total_aportado: Number(totalAportado.toFixed(2)),
      total_rendimentos: Number(totalRendimentos.toFixed(2)),
      alocacao_por_tipo: Object.entries(porTipo).map(([tipo, valor]) => ({
        tipo,
        valor: Number(valor.toFixed(2)),
        percentual: totalPatrimonio > 0 ? Number(((valor / totalPatrimonio) * 100).toFixed(2)) : 0,
      })),
      quantidade_ativos: posicoes.length,
    };
  }
}
