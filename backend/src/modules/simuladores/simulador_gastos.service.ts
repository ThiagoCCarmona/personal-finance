import { query } from '../../config/database.js';
import { SimularGastoInput } from './simulador_gastos.schema.js';
import { calcularCompetenciaFatura, determinarFaturaAtual } from '../../utils/fatura.utils.js';

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
  valor_a_vista_brl: number;
  forma_pagamento: 'a_vista' | 'cartao_parcelado';
  num_parcelas: number;
  valor_parcela_brl: number;
  com_juros: boolean;
  taxa_juros_mensal: number;
  tipo_juros: 'price' | 'simples';
  total_juros_brl: number;
  percentual_acrescimo_juros: number;
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
  projecao_mes_seguinte?: {
    saldo_atual: number;
    receitas_recorrentes: number;
    faturas_e_despesas_fixas: number;
    saldo_projetado_sem_compra: number;
    saldo_projetado_com_compra: number;
    impacto_compra: number;
  };
}

export class SimuladorGastosService {
  async simular(dados: SimularGastoInput, userId?: string): Promise<ResultadoSimulacaoGasto> {
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
          cotacao = moedaUpper === 'USD' ? 5.75 : moedaUpper === 'EUR' ? 6.25 : 1.0;
        }
      }
    }

    const valorOriginalBrl = Math.round((dados.valor_original * cotacao) * 100) / 100;
    const numParcelas = dados.forma_pagamento === 'cartao_parcelado' ? (dados.num_parcelas || 1) : 1;

    let valorTotalBrl = valorOriginalBrl;
    let valorParcelaBrl = Math.round((valorOriginalBrl / numParcelas) * 100) / 100;
    let totalJurosPago = 0;
    let percentualAcrescimo = 0;

    const temJuros = Boolean(dados.com_juros && dados.taxa_juros_mensal && dados.taxa_juros_mensal > 0 && numParcelas > 1);

    if (temJuros && dados.forma_pagamento === 'cartao_parcelado') {
      const i = dados.taxa_juros_mensal / 100;
      const n = numParcelas;

      if (dados.tipo_juros === 'price') {
        const fator = Math.pow(1 + i, n);
        const pmt = valorOriginalBrl * (i * fator) / (fator - 1);
        valorParcelaBrl = Math.round(pmt * 100) / 100;
        valorTotalBrl = Math.round((valorParcelaBrl * n) * 100) / 100;
      } else {
        const jurosSimples = valorOriginalBrl * i * n;
        valorTotalBrl = Math.round((valorOriginalBrl + jurosSimples) * 100) / 100;
        valorParcelaBrl = Math.round((valorTotalBrl / n) * 100) / 100;
      }

      totalJurosPago = Math.round((valorTotalBrl - valorOriginalBrl) * 100) / 100;
      percentualAcrescimo = Math.round(((totalJurosPago / valorOriginalBrl) * 100) * 100) / 100;
    }

    const dataCompra = dados.data_prevista || new Date().toISOString().split('T')[0];
    const hojeAnoMes = dataCompra.slice(0, 7);

    // Métricas para Projeção do Próximo Mês (Receitas Recorrentes Fixas, Faturas e Saldo Consolidado)
    let totalReceitasRecorrentes = 0;
    let totalFaturasMes = 0;
    let totalDespesasRecorrentesConta = 0;
    let saldoTotalUsuario = 0;

    if (userId) {
      const { rows: rowsRecRec } = await query(
        `SELECT COALESCE(SUM(valor), 0) as total
         FROM recorrencia
         WHERE usuario_id = $1 AND ativo = TRUE AND tipo = 'receita'`,
        [userId]
      );
      totalReceitasRecorrentes = parseFloat(rowsRecRec[0]?.total || '0');

      // Faturas de cartões de crédito abertas vigentes
      const { rows: cartoesAtivos } = await query(
        `SELECT c.id, c.dia_fechamento, c.dia_vencimento
         FROM cartao_credito c
         WHERE c.usuario_id = $1 AND c.ativo = TRUE`,
        [userId]
      );

      const refDate = new Date();
      for (const cartao of cartoesAtivos) {
        // Verifica se a fatura do mês civil já foi paga
        const { rows: fatPagaCivil } = await query(
          `SELECT 1 FROM fatura_paga WHERE cartao_id = $1 AND usuario_id = $2 AND ano_mes = $3`,
          [cartao.id, userId, hojeAnoMes]
        );
        const faturaCivilPaga = fatPagaCivil.length > 0;

        const mesCompetenciaCartao = determinarFaturaAtual(
          cartao.dia_fechamento,
          cartao.dia_vencimento,
          refDate,
          faturaCivilPaga
        );

        // Verifica se a fatura da competência ativa já foi paga
        const { rows: fatPagaComp } = await query(
          `SELECT 1 FROM fatura_paga WHERE cartao_id = $1 AND usuario_id = $2 AND ano_mes = $3`,
          [cartao.id, userId, mesCompetenciaCartao]
        );

        if (fatPagaComp.length === 0) {
          const { rows: rowsFat } = await query(
            `SELECT COALESCE(SUM(l.valor), 0) as total
             FROM lancamento l
             WHERE l.usuario_id = $1
               AND l.cartao_id = $2
               AND l.tipo = 'despesa'
               AND TO_CHAR(l.data_competencia_fatura, 'YYYY-MM') = $3`,
            [userId, cartao.id, mesCompetenciaCartao]
          );
          totalFaturasMes += parseFloat(rowsFat[0]?.total || '0');
        }
      }
      totalFaturasMes = Math.round(totalFaturasMes * 100) / 100;

      const { rows: rowsRecDesp } = await query(
        `SELECT COALESCE(SUM(valor), 0) as total
         FROM recorrencia
         WHERE usuario_id = $1 
           AND ativo = TRUE 
           AND tipo = 'despesa'
           AND (cartao_id IS NULL OR forma_pagamento != 'credito')`,
        [userId]
      );
      totalDespesasRecorrentesConta = parseFloat(rowsRecDesp[0]?.total || '0');

      const { rows: rowsSaldoTotal } = await query(
        `SELECT COALESCE(SUM(saldo_atual), 0) as total
         FROM conta
         WHERE usuario_id = $1 AND ativo = TRUE`,
        [userId]
      );
      saldoTotalUsuario = parseFloat(rowsSaldoTotal[0]?.total || '0');
    }

    const faturasEFixas = Math.round((totalFaturasMes + totalDespesasRecorrentesConta) * 100) / 100;

    // Se for à vista:
    if (dados.forma_pagamento === 'a_vista') {
      let contaNome = 'Conta Corrente';
      let saldoAtual = 0;

      if (dados.conta_id && dados.conta_id !== 'unificado') {
        const cRes = userId 
          ? await query('SELECT apelido, saldo_atual FROM conta WHERE id = $1 AND usuario_id = $2', [dados.conta_id, userId])
          : await query('SELECT apelido, saldo_atual FROM conta WHERE id = $1', [dados.conta_id]);
        if (cRes.rows.length > 0) {
          contaNome = cRes.rows[0].apelido;
          saldoAtual = parseFloat(cRes.rows[0].saldo_atual);
        }
      } else {
        saldoAtual = saldoTotalUsuario;
        if (!userId) {
          const sRes = await query('SELECT COALESCE(SUM(saldo_atual), 0) AS saldo_total FROM conta WHERE ativo = TRUE');
          saldoAtual = parseFloat(sRes.rows[0]?.saldo_total || '0');
        }
        contaNome = 'Saldo Consolidado (Todas as Contas)';
      }

      const saldoBaseProj = saldoAtual > 0 ? saldoAtual : saldoTotalUsuario;
      const saldoProjSemCompra = Math.round((saldoBaseProj + totalReceitasRecorrentes - faturasEFixas) * 100) / 100;
      const saldoProjComCompra = Math.round((saldoProjSemCompra - valorTotalBrl) * 100) / 100;

      return {
        descricao: dados.descricao,
        moeda_codigo: moedaUpper,
        valor_original: dados.valor_original,
        cotacao_utilizada: cotacao,
        valor_total_brl: valorTotalBrl,
        valor_a_vista_brl: valorTotalBrl,
        forma_pagamento: 'a_vista',
        num_parcelas: 1,
        valor_parcela_brl: valorTotalBrl,
        com_juros: false,
        taxa_juros_mensal: 0,
        tipo_juros: 'price',
        total_juros_brl: 0,
        percentual_acrescimo_juros: 0,
        impacto_a_vista: {
          conta_nome: contaNome,
          saldo_atual: saldoAtual,
          saldo_apos_compra: Math.round((saldoAtual - valorTotalBrl) * 100) / 100
        },
        projecao_mes_seguinte: {
          saldo_atual: saldoBaseProj,
          receitas_recorrentes: totalReceitasRecorrentes,
          faturas_e_despesas_fixas: faturasEFixas,
          saldo_projetado_sem_compra: saldoProjSemCompra,
          saldo_projetado_com_compra: saldoProjComCompra,
          impacto_compra: valorTotalBrl
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
      valor_a_vista_brl: valorOriginalBrl,
      forma_pagamento: 'cartao_parcelado',
      num_parcelas: numParcelas,
      valor_parcela_brl: valorParcelaBrl,
      com_juros: temJuros,
      taxa_juros_mensal: dados.taxa_juros_mensal || 0,
      tipo_juros: (dados.tipo_juros || 'price') as any,
      total_juros_brl: totalJurosPago,
      percentual_acrescimo_juros: percentualAcrescimo,
      impacto_cartao: {
        cartao_nome: cartaoNome,
        limite_total: limiteTotal,
        limite_disponivel_atual: limiteDisponivelAtual,
        limite_disponivel_projetado: limiteDisponivelProjetado,
        projecoes_faturas: projecoes
      },
      projecao_mes_seguinte: {
        saldo_atual: saldoTotalUsuario,
        receitas_recorrentes: totalReceitasRecorrentes,
        faturas_e_despesas_fixas: faturasEFixas,
        saldo_projetado_sem_compra: Math.round((saldoTotalUsuario + totalReceitasRecorrentes - faturasEFixas) * 100) / 100,
        saldo_projetado_com_compra: Math.round((saldoTotalUsuario + totalReceitasRecorrentes - faturasEFixas - valorParcelaBrl) * 100) / 100,
        impacto_compra: valorParcelaBrl
      }
    };
  }
}

export const simuladorGastosService = new SimuladorGastosService();
