import { z } from 'zod';

export const tipoInvestimentoEnum = z.enum([
  'renda_fixa',
  'acao',
  'fii',
  'cripto',
  'moeda_estrangeira'
]);

export const tipoMovimentacaoEnum = z.enum([
  'aporte',
  'resgate',
  'rendimento'
]);

export const criarInvestimentoSchema = z.object({
  tipo: tipoInvestimentoEnum,
  nome: z.string().min(2).max(100),
  ticker: z.string().max(20).optional().nullable(),
  moeda_id: z.string().uuid().optional().nullable(),
  instituicao: z.string().max(100).optional().nullable(),
  indexador: z.string().max(50).optional().nullable(),
  taxa_anual: z.number().nonnegative().optional().nullable(),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const atualizarInvestimentoSchema = criarInvestimentoSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export const criarMovimentacaoSchema = z.object({
  investimento_id: z.string().uuid(),
  tipo: tipoMovimentacaoEnum,
  valor: z.number().positive(),
  quantidade: z.number().positive(),
  cotacao_praticada: z.number().positive().optional().nullable(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observacao: z.string().max(255).optional().nullable(),
});

export type CriarInvestimentoInput = z.infer<typeof criarInvestimentoSchema>;
export type AtualizarInvestimentoInput = z.infer<typeof atualizarInvestimentoSchema>;
export type CriarMovimentacaoInput = z.infer<typeof criarMovimentacaoSchema>;
