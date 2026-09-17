import { z } from 'zod';

export const CriarEmprestimoSchema = z.object({
  pessoa_id: z.string().uuid(),
  valor_total: z.number().positive('Valor deve ser positivo'),
  motivo: z.string().min(2, 'Motivo deve ter pelo menos 2 caracteres'),
  conta_origem_id: z.string().uuid('Selecione a conta bancária de origem'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD').optional(),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Vencimento deve ser YYYY-MM-DD').optional()
});

export const BaixaDividaSchema = z.object({
  valor: z.number().positive('Valor da baixa deve ser positivo'),
  conta_destino_id: z.string().uuid('Selecione a conta onde o valor foi recebido').optional(),
  forma_pagamento: z.enum(['dinheiro', 'pix', 'transferencia', 'outro']).default('pix'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

export const PerdoarDividaSchema = z.object({
  motivo_perdao: z.string().optional()
});

export const AtualizarDividaSchema = z.object({
  motivo: z.string().min(2).optional(),
  valor_total: z.number().positive().optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(''))
});

export type CriarEmprestimoInput = z.infer<typeof CriarEmprestimoSchema>;
export type BaixaDividaInput = z.infer<typeof BaixaDividaSchema>;
export type PerdoarDividaInput = z.infer<typeof PerdoarDividaSchema>;
export type AtualizarDividaInput = z.infer<typeof AtualizarDividaSchema>;
