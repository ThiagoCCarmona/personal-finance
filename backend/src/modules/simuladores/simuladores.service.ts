import { SimulacaoInvestimentoInput, CenarioSimulacao } from './simuladores.schemas.js';

export interface PontoEvolucaoMensal {
  mes: number;
  total_investido: number;
  [key: string]: number; // valores de cada cenário no mês correspondente
}

export interface ResultadoCenario {
  nome: string;
  taxa_anual_pct: number;
  taxa_mensal_pct: number;
  valor_final_bruto: number;
  total_investido: number;
  total_juros_ganhos: number;
  rentabilidade_pct: number;
}

export interface ResultadoSimulacao {
  parametros: {
    valor_inicial: number;
    aporte_mensal: number;
    prazo_meses: number;
  };
  cenarios: ResultadoCenario[];
  evolucao_mensal: PontoEvolucaoMensal[];
}

export class SimuladoresService {
  /**
   * Calcula simulação de juros compostos com aportes periódicos para múltiplos cenários comparativos
   */
  simularInvestimentos(input: SimulacaoInvestimentoInput): ResultadoSimulacao {
    const { valor_inicial, aporte_mensal, prazo_meses, cenarios } = input;

    // Calcular taxas mensais equivalentes: (1 + i_ano)^(1/12) - 1
    const cenariosConfig = cenarios.map((c: CenarioSimulacao) => {
      const taxaAnualDec = c.taxa_anual_pct / 100;
      const taxaMensalDec = Math.pow(1 + taxaAnualDec, 1 / 12) - 1;
      return {
        nome: c.nome,
        taxa_anual_pct: c.taxa_anual_pct,
        taxa_mensal_dec: taxaMensalDec,
        taxa_mensal_pct: Number((taxaMensalDec * 100).toFixed(4)),
        saldo_atual: valor_inicial,
      };
    });

    const evolucao: PontoEvolucaoMensal[] = [];

    // Mês 0
    const pontoZero: PontoEvolucaoMensal = {
      mes: 0,
      total_investido: valor_inicial,
    };
    cenariosConfig.forEach((c) => {
      pontoZero[c.nome] = valor_inicial;
    });
    evolucao.push(pontoZero);

    // Iteração mês a mês
    for (let mes = 1; mes <= prazo_meses; mes++) {
      const totalInvestidoAteAgora = Number((valor_inicial + aporte_mensal * mes).toFixed(2));
      const pontoMes: PontoEvolucaoMensal = {
        mes,
        total_investido: totalInvestidoAteAgora,
      };

      cenariosConfig.forEach((c) => {
        // Juros do mês sobre o saldo anterior + novo aporte
        const rendimento = c.saldo_atual * c.taxa_mensal_dec;
        c.saldo_atual = c.saldo_atual + rendimento + aporte_mensal;
        pontoMes[c.nome] = Number(c.saldo_atual.toFixed(2));
      });

      evolucao.push(pontoMes);
    }

    const totalInvestidoFinal = Number((valor_inicial + aporte_mensal * prazo_meses).toFixed(2));

    const resultadosCenarios: ResultadoCenario[] = cenariosConfig.map((c) => {
      const valorFinal = Number(c.saldo_atual.toFixed(2));
      const jurosGanhos = Number((valorFinal - totalInvestidoFinal).toFixed(2));
      const rentabilidadePct = totalInvestidoFinal > 0
        ? Number(((jurosGanhos / totalInvestidoFinal) * 100).toFixed(2))
        : 0;

      return {
        nome: c.nome,
        taxa_anual_pct: c.taxa_anual_pct,
        taxa_mensal_pct: c.taxa_mensal_pct,
        valor_final_bruto: valorFinal,
        total_investido: totalInvestidoFinal,
        total_juros_ganhos: jurosGanhos,
        rentabilidade_pct: rentabilidadePct,
      };
    });

    return {
      parametros: {
        valor_inicial,
        aporte_mensal,
        prazo_meses,
      },
      cenarios: resultadosCenarios,
      evolucao_mensal: evolucao,
    };
  }

  /**
   * Retorna cenários sugeridos padrão da economia brasileira
   */
  getCenariosPadrao() {
    return [
      { nome: 'Poupança (~6.5% a.a.)', taxa_anual_pct: 6.5 },
      { nome: 'Tesouro Selic / CDI 100% (~10.5% a.a.)', taxa_anual_pct: 10.5 },
      { nome: 'CDB 120% CDI (~12.6% a.a.)', taxa_anual_pct: 12.6 },
      { nome: 'Tesouro IPCA+ (~11.0% a.a.)', taxa_anual_pct: 11.0 },
    ];
  }
}
