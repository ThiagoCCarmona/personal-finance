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
    const cod = moedaCodigo.toUpperCase();

    // Garante histórico atualizado da AwesomeAPI para o período
    await this.ptaxClient.buscarHistoricoDiarioAwesome(cod, Math.min(365, Math.max(dias, 30)));

    const sql = [
      'SELECT c.data::text, c.valor_ptax::float as valor',
      'FROM cotacao_cambio c',
      'JOIN moeda m ON m.id = c.moeda_id',
      'WHERE m.codigo = $1',
      'ORDER BY c.data DESC',
      'LIMIT $2'
    ].join(' ');
    const { rows } = await query(sql, [cod, dias + 30]);

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
      moeda: cod,
      pontos: pontosFiltrados,
      volatilidade_30d: volatilidade,
      ultima_cotacao: ultima,
      variacao_periodo_pct: variacaoPeriodo,
    };
  }

  async listarMoedasComCotacao() {
    const { rows: moedas } = await query(`
      SELECT 
        m.id, 
        m.codigo, 
        m.nome, 
        m.simbolo, 
        m.ativo, 
        COALESCE(m.favorita, FALSE) AS favorita,
        (
          SELECT c.valor_ptax::float 
          FROM cotacao_cambio c 
          WHERE c.moeda_id = m.id 
          ORDER BY c.data DESC 
          LIMIT 1
        ) as ultima_cotacao_brl
      FROM moeda m
      WHERE m.ativo = TRUE
      ORDER BY m.favorita DESC, m.codigo ASC
    `);
    return moedas;
  }

  async toggleFavorita(codigo: string) {
    const cod = codigo.toUpperCase();
    const res = await query(
      `UPDATE moeda SET favorita = NOT COALESCE(favorita, FALSE) WHERE codigo = $1 RETURNING id, codigo, favorita`,
      [cod]
    );
    return res.rows[0] || null;
  }

  async converterMoeda(de: string, para: string, valor: number) {
    const orig = de.toUpperCase();
    const dest = para.toUpperCase();
    const v = Math.max(0, valor || 0);

    if (orig === dest) {
      return { de: orig, para: dest, valor_origem: v, cotacao: 1, valor_convertido: v };
    }

    // 1. Tenta cotação direta
    let cotacao = await this.ptaxClient.buscarCotacaoAtual(orig, dest);

    // 2. Se não achou e envolve BRL como ponte
    if (!cotacao) {
      if (orig === 'BRL') {
        const cotDest = await this.ptaxClient.buscarCotacaoAtual(dest, 'BRL');
        if (cotDest && cotDest > 0) cotacao = 1 / cotDest;
      } else if (dest === 'BRL') {
        cotacao = await this.ptaxClient.buscarCotacaoAtual(orig, 'BRL');
      } else {
        const cotOrigBRL = await this.ptaxClient.buscarCotacaoAtual(orig, 'BRL');
        const cotDestBRL = await this.ptaxClient.buscarCotacaoAtual(dest, 'BRL');
        if (cotOrigBRL && cotDestBRL && cotDestBRL > 0) {
          cotacao = cotOrigBRL / cotDestBRL;
        }
      }
    }

    const taxaFinal = cotacao || 1;
    const valorConvertido = Math.round(v * taxaFinal * 10000) / 10000;

    return {
      de: orig,
      para: dest,
      valor_origem: v,
      cotacao: Number(taxaFinal.toFixed(4)),
      valor_convertido: valorConvertido
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
