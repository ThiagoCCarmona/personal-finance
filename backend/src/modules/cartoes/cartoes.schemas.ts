import { z } from 'zod';

export const cartaoSchema = z.object({
  instituicao_id: z.string().uuid('ID de instituição inválido'),
  apelido: z.string().min(1, 'Apelido do cartão é obrigatório').max(100),
  limite: z.number().positive('O limite deve ser maior que zero'),
  dia_fechamento: z.number().int().min(1).max(31, 'Dia de fechamento inválido'),
  dia_vencimento: z.number().int().min(1).max(31, 'Dia de vencimento inválido'),
  ativo: z.boolean().optional().default(true),
});

export const pagarFaturaSchema = z.object({
  anoMes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mês inválido (YYYY-MM)'),
  dataPagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de data inválido (YYYY-MM-DD)').optional(),
  contaId: z.string().uuid('ID de conta inválido').optional().nullable(),
});

export type CartaoInput = z.infer<typeof cartaoSchema>;
export type PagarFaturaInput = z.infer<typeof pagarFaturaSchema>;
