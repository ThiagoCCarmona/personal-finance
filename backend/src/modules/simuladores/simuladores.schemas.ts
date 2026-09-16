import { z } from 'zod';

export const cenarioSimulacaoSchema = z.object({
  nome: z.string().min(1).max(50),
  taxa_anual_pct: z.number().min(0).max(1000), // Ex: 10.5 para 10.5% ao ano
});

export const simulacaoInvestimentoSchema = z.object({
  valor_inicial: z.number().nonnegative(),
  aporte_mensal: z.number().nonnegative(),
  prazo_meses: z.number().int().positive().max(600), // até 50 anos
  cenarios: z.array(cenarioSimulacaoSchema).min(1).max(5),
});

export type CenarioSimulacao = z.infer<typeof cenarioSimulacaoSchema>;
export type SimulacaoInvestimentoInput = z.infer<typeof simulacaoInvestimentoSchema>;
