import { query } from '../../config/database.js';
import { SimularGastoInput } from './simulador_gastos.schema.js';
import { calcularCompetenciaFatura } from '../../utils/fatura.utils.js';

export interface ProjecaoFaturaMes {
  mes_ano: string;
  fatura_atual_estimada: number;
  adicional_simulado: number;
  fatura_projetada_total: number;
}

export interface ResultadoSimulacaoGasto {
  descricao: string;
  moeda_codigo: string;
  valor_original: number;
  cotacao_utilizada: number;
  valor_total_brl: number;
  forma_pagamento: 'a_vista' | 'cartao_parcelado';
  num_parcelas: number;
  valor_parcela_brl: number;
  impacto_a_vista?: {
    conta_nome: string;
    saldo_atual: number;
    saldo_apos_compra: number;
  };
  impacto_cartao?: {
    cartao_nome: string;
    limite_total: number;
    limite_disponivel_atual: number;
    limite_disponivel_projetado: number;
    projecoes_faturas: ProjecaoFaturaMes[];
  };
}

export class SimuladorGastosService {
  async simular(dados: SimularGastoInput): Promise<ResultadoSimulacaoGasto> {
    // 1. Determina a cotação a ser utilizada
    let cotacao = 1.0;
    const moedaUpper = (dados.moeda_codigo || 'BRL').toUpperCase();

    if (moedaUpper !== 'BRL') {
      if (dados.cotacao_personalizada && dados.cotacao_personalizada > 0) {
        cotacao = dados.cotacao_personalizada;
      } else {
        // Busca a cotação mais recente no banco
        const cotRes = await query(`
          SELECT c.valor_ptax 
          FROM cotacao_cambio c
          JOIN moeda m ON m.id = c.moeda_id
          WHERE m.codigo = $1
          ORDER BY c.data DESC, c.criado_em DESC
          LIMIT 1
        `, [moedaUpper]);

        if (cotRes.rows.length > 0) {
          cotacao = parseFloat(cotRes.rows[0].valor_ptax);
        } else {
          // Valores de referência razoáveis caso não haja cotação sincronizada
          cotacao = moedaUpper === 'USD' ? 5.75 : moedaUpper === 'EUR' ? 6.25 : 1.0;
        }
      }
    }

    const valorTotalBrl = Math.round((dados.valor_original * cotacao) * 100) / 100;
    const numParcelas = dados.forma_pagamento === 'cartao_parcelado' ? (dados.num_parcelas || 1) : 1;
    const valorParcelaBrl = Math.round((valorTotalBrl / numParcelas) * 100) / 100;

    const dataCompra = dados.data_prevista || new Date().toISOString().split('T')[0];

    // Se for à vista:
    if (dados.forma_pagamento === 'a_vista') {
      let contaNome = 'Conta Corrente';
      let saldoAtual = 0;

      if (dados.conta_id && dados.conta_id !== 'unificado') {
        const cRes = await query('SELECT apelido, saldo_atual FROM conta WHERE id = $1', [dados.conta_id]);
        if (cRes.rows.length > 0) {
          contaNome = cRes.rows[0].apelido;
          saldoAtual = parseFloat(cRes.rows[0].saldo_atual);
        }
      } else {
        // Saldo Consolidado Unificado (Todas as contas ativas)
        const sRes = await query('SELECT COALESCE(SUM(saldo_atual), 0) AS saldo_total FROM conta WHERE ativo = TRUE');
        saldoAtual = parseFloat(sRes.rows[0]?.saldo_total || '0');
        contaNome = 'Saldo Consolidado (Todas as Contas)';
      }

      return {
        descricao: dados.descricao,
        moeda_codigo: moedaUpper,
        valor_original: dados.valor_original,
        cotacao_utilizada: cotacao,
        valor_total_brl: valorTotalBrl,
        forma_pagamento: 'a_vista',
        num_parcelas: 1,
        valor_parcela_brl: valorTotalBrl,
        impacto_a_vista: {
          conta_nome: contaNome,
          saldo_atual: saldoAtual,
          saldo_apos_compra: Math.round((saldoAtual - valorTotalBrl) * 100) / 100
        }
      };
    }

    // Se for Cartão Parcelado:
    let cartaoId = dados.cartao_id;
    let cartaoNome = 'Cartão de Crédito';
    let limiteTotal = 5000;
    let diaFechamento = 10;
    let diaVencimento = 20;

    if (cartaoId) {
      const cardRes = await query('SELECT id, apelido, limite, dia_fechamento, dia_vencimento FROM cartao_credito WHERE id = $1', [cartaoId]);
      if (cardRes.rows.length > 0) {
        cartaoNome = cardRes.rows[0].apelido;
        limiteTotal = parseFloat(cardRes.rows[0].limite);
        diaFechamento = cardRes.rows[0].dia_fechamento;
        diaVencimento = cardRes.rows[0].dia_vencimento;
      }
    } else {
      const cardRes = await query('SELECT id, apelido, limite, dia_fechamento, dia_vencimento FROM cartao_credito WHERE ativo = TRUE ORDER BY criado_em ASC LIMIT 1');
      if (cardRes.rows.length > 0) {
        cartaoId = cardRes.rows[0].id;
        cartaoNome = cardRes.rows[0].apelido;
        limiteTotal = parseFloat(cardRes.rows[0].limite);
        diaFechamento = cardRes.rows[0].dia_fechamento;
        diaVencimento = cardRes.rows[0].dia_vencimento;
      }
    }

    // Calcula limite utilizado atual
    let limiteUtilizadoAtual = 0;
    if (cartaoId) {
      const utilRes = await query(`
        SELECT COALESCE(SUM(l.valor), 0) AS total_utilizado
        FROM lancamento l
        WHERE l.cartao_id = $1 AND l.status = 'efetivado'
      `, [cartaoId]);
      limiteUtilizadoAtual = parseFloat(utilRes.rows[0]?.total_utilizado || '0');
    }
    const limiteDisponivelAtual = Math.max(0, limiteTotal - limiteUtilizadoAtual);
    const limiteDisponivelProjetado = Math.round((limiteDisponivelAtual - valorTotalBrl) * 100) / 100;

    // Calcula projeções para os próximos N meses de fatura
    const projecoes: ProjecaoFaturaMes[] = [];
    const cicloBase = calcularCompetenciaFatura(dataCompra, diaFechamento, diaVencimento);
    const [anoBase, mesBase] = cicloBase.anoMesCompetencia.split('-').map(Number);

    for (let i = 0; i < numParcelas; i++) {
      const dt = new Date(Date.UTC(anoBase, mesBase - 1 + i, 1));
      const compStr = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;

      // Busca faturas existentes já agendadas para esse mês
      const fatRes = await query(`
        SELECT COALESCE(SUM(l.valor), 0) AS total_mes
        FROM lancamento l
        WHERE l.cartao_id = $1 
          AND (
            TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $2 
            OR l.data_competencia_fatura = $3
          )
          AND l.status = 'efetivado'
      `, [dados.cartao_id, compStr, `${compStr}-01`]);

      const faturaAtual = parseFloat(fatRes.rows[0]?.total_mes || '0');
      projecoes.push({
        mes_ano: compStr,
        fatura_atual_estimada: faturaAtual,
        adicional_simulado: valorParcelaBrl,
        fatura_projetada_total: Math.round((faturaAtual + valorParcelaBrl) * 100) / 100
      });
    }

    return {
      descricao: dados.descricao,
      moeda_codigo: moedaUpper,
      valor_original: dados.valor_original,
      cotacao_utilizada: cotacao,
      valor_total_brl: valorTotalBrl,
      forma_pagamento: 'cartao_parcelado',
      num_parcelas: numParcelas,
      valor_parcela_brl: valorParcelaBrl,
      impacto_cartao: {
        cartao_nome: cartaoNome,
        limite_total: limiteTotal,
        limite_disponivel_atual: limiteDisponivelAtual,
        limite_disponivel_projetado: limiteDisponivelProjetado,
        projecoes_faturas: projecoes
      }
    };
  }
}

export const simuladorGastosService = new SimuladorGastosService();
