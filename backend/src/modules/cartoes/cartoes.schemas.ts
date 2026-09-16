import { z } from 'zod';

export const cartaoSchema = z.object({
  instituicao_id: z.string().uuid('ID de instituição inválido'),
  apelido: z.string().min(1, 'Apelido do cartão é obrigatório').max(100),
  limite: z.number().positive('O limite deve ser maior que zero'),
  dia_fechamento: z.number().int().min(1).max(31, 'Dia de fechamento inválido'),
  dia_vencimento: z.number().int().min(1).max(31, 'Dia de vencimento inválido'),
  ativo: z.boolean().optional().default(true),
});

export type CartaoInput = z.infer<typeof cartaoSchema>;
