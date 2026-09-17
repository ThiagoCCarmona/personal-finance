import { z } from 'zod';

export const SimularGastoSchema = z.object({
  descricao: z.string().min(1, 'Descrição obrigatória'),
  valor_original: z.number().positive('Valor deve ser maior que zero'),
  moeda_codigo: z.string().default('BRL'),
  cotacao_personalizada: z.preprocess(val => (val === '' || val === null ? undefined : Number(val)), z.number().positive().optional()),
  forma_pagamento: z.enum(['a_vista', 'cartao_parcelado']),
  conta_id: z.preprocess(val => (val === '' || val === null ? undefined : val), z.string().uuid().optional()),
  cartao_id: z.preprocess(val => (val === '' || val === null ? undefined : val), z.string().uuid().optional()),
  categoria_id: z.preprocess(val => (val === '' || val === null ? undefined : val), z.string().uuid().optional()),
  num_parcelas: z.preprocess(val => (val === '' || val === null || val === undefined ? 1 : Number(val)), z.number().int().min(1).max(36).default(1)),
  data_prevista: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export type SimularGastoInput = z.infer<typeof SimularGastoSchema>;
