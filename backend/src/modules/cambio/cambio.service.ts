import { query } from '../../config/database.js';
import { PtaxClient } from './ptax-client.js';
import {
  RegistrarCotacaoManualInput,
  CalcularGanhoCambialInput,
} from './cambio.schemas.js';

export interface CotacaoPonto {
  data: string;
  valor: number;
  mm7?: number | null;
  mm30?: number | null;
}

export class CambioService {
  private ptaxClient = new PtaxClient();

  async sincronizar() {
    await this.ptaxClient.sincronizarCotacoesRecentes();
  }

  async getUltimaCotacao(moedaCodigo: string): Promise<{
    moeda: string;
    data: string;
    valor: number;
    fonte: string;
  } | null> {
    const sql = ['SELECT c.data::text, c.valor_ptax::float as valor, c.fonte, m.codigo as moeda', 'FROM cotacao_cambio c', 'JOIN moeda m ON m.id = c.moeda_id', 'WHERE m.codigo = $1', 'ORDER BY c.data DESC', 'LIMIT 1'].join(' ');
    const { rows } = await query(sql, [moedaCodigo.toUpperCase()]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  async getHistoricoComIndicadores(moedaCodigo: string, dias: number = 30): Promise<{
    moeda: string;
    pontos: CotacaoPonto[];
    volatilidade_30d: number;
    ultima_cotacao: number;
    variacao_periodo_pct: number;
  }> {
    const sql = ['SELECT c.data::text, c.valor_ptax::float as valor', 'FROM cotacao_cambio c', 'JOIN moeda m ON m.id = c.moeda_id', 'WHERE m.codigo = $1', 'ORDER BY c.data DESC', 'LIMIT $2'].join(' ');
    const { rows } = await query(sql, [moedaCodigo.toUpperCase(), dias + 30]);

    const cronologico = rows.reverse();

    const pontos: CotacaoPonto[] = [];
    for (let i = 0; i < cronologico.length; i++) {
      const item = cronologico[i];
      let mm7: number | null = null;
      if (i >= 6) {
        const sub = cronologico.slice(i - 6, i + 1);
        const soma = sub.reduce((acc: number, cur: any) => acc + cur.valor, 0);
        mm7 = Number((soma / 7).toFixed(4));
      }

      let mm30: number | null = null;
      if (i >= 29) {
        const sub = cronologico.slice(i - 29, i + 1);
        const soma = sub.reduce((acc: number, cur: any) => acc + cur.valor, 0);
        mm30 = Number((soma / 30).toFixed(4));
      }

      pontos.push({
        data: item.data,
        valor: item.valor,
        mm7,
        mm30,
      });
    }

    const pontosFiltrados = pontos.slice(-dias);

    let volatilidade = 0;
    if (pontosFiltrados.length > 1) {
      const variacoes: number[] = [];
      for (let i = 1; i < pontosFiltrados.length; i++) {
        const vAnt = pontosFiltrados[i - 1].valor;
        const vAtual = pontosFiltrados[i].valor;
        if (vAnt > 0) {
          variacoes.push((vAtual - vAnt) / vAnt);
        }
      }
      if (variacoes.length > 0) {
        const mediaVar = variacoes.reduce((acc, cur) => acc + cur, 0) / variacoes.length;
        const variancia = variacoes.reduce((acc, cur) => acc + Math.pow(cur - mediaVar, 2), 0) / variacoes.length;
        volatilidade = Number((Math.sqrt(variancia) * 100).toFixed(2));
      }
    }

    const ultima = pontosFiltrados.length > 0 ? pontosFiltrados[pontosFiltrados.length - 1].valor : 0;
    const primeira = pontosFiltrados.length > 0 ? pontosFiltrados[0].valor : 0;
    const variacaoPeriodo = primeira > 0 ? Number((((ultima - primeira) / primeira) * 100).toFixed(2)) : 0;

    return {
      moeda: moedaCodigo.toUpperCase(),
      pontos: pontosFiltrados,
      volatilidade_30d: volatilidade,
      ultima_cotacao: ultima,
      variacao_periodo_pct: variacaoPeriodo,
    };
  }

  async calcularGanhoCambial(input: CalcularGanhoCambialInput) {
    const ultima = await this.getUltimaCotacao(input.moeda_codigo);
    const cotacaoAtual = ultima ? ultima.valor : input.cotacao_aquisicao;

    const valorInvestidoBRL = Number((input.quantidade * input.cotacao_aquisicao).toFixed(2));
    const valorAtualBRL = Number((input.quantidade * cotacaoAtual).toFixed(2));
    const ganhoPerdaBRL = Number((valorAtualBRL - valorInvestidoBRL).toFixed(2));
    const rentabilidadePct = valorInvestidoBRL > 0
      ? Number(((ganhoPerdaBRL / valorInvestidoBRL) * 100).toFixed(2))
      : 0;

    return {
      moeda: input.moeda_codigo.toUpperCase(),
      quantidade: input.quantidade,
      cotacao_aquisicao: input.cotacao_aquisicao,
      cotacao_atual: cotacaoAtual,
      data_cotacao_atual: ultima?.data || null,
      valor_investido_brl: valorInvestidoBRL,
      valor_atual_brl: valorAtualBRL,
      ganho_perda_brl: ganhoPerdaBRL,
      rentabilidade_pct: rentabilidadePct,
    };
  }

  async registrarCotacaoManual(input: RegistrarCotacaoManualInput) {
    const { rows: moedaRows } = await query(
      'SELECT id FROM moeda WHERE codigo = $1',
      [input.moeda_codigo.toUpperCase()]
    );
    if (moedaRows.length === 0) {
      throw new Error('Moeda ' + input.moeda_codigo + ' nao cadastrada');
    }
    const moedaId = moedaRows[0].id;

    const sql = [
      'INSERT INTO cotacao_cambio (moeda_id, data, valor_ptax, fonte)',
      'VALUES ($1, $2, $3, $4)',
      'ON CONFLICT (moeda_id, data) DO UPDATE SET valor_ptax = EXCLUDED.valor_ptax',
      'RETURNING *'
    ].join(' ');

    const { rows } = await query(sql, [
      moedaId,
      input.data,
      input.valor_ptax,
      input.fonte || 'Manual',
    ]);
    return rows[0];
  }
}
