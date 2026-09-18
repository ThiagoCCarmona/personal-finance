import { z } from 'zod';

export const recorrenciaSchema = z.object({
  tipo: z.enum(['despesa', 'receita']),
  descricao: z.string().min(1, 'Descrição é obrigatória').max(255),
  valor: z.number().positive('O valor deve ser maior que zero'),
  categoria_id: z.string().uuid('ID de categoria inválido'),
  forma_pagamento: z.enum(['dinheiro', 'pix_debito', 'debito', 'transferencia', 'credito', 'outros']),
  conta_id: z.string().uuid().optional().nullable(),
  cartao_id: z.string().uuid().optional().nullable(),
  frequencia: z.enum(['mensal', 'bimestral', 'trimestral', 'semestral', 'anual']).default('mensal'),
  dia_referencia: z.number().int().min(1).max(31, 'Dia de referência inválido'),
  dia_estimado_na_fatura: z.number().int().min(1).max(31).optional().nullable(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve ser YYYY-MM-DD'),
  data_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  natureza: z.enum(['fixo', 'variavel']).optional().default('fixo'),
  ativo: z.boolean().optional().default(true),
});

export const lancarRecorrenciaSchema = z.object({
  anoMes: z.string().regex(/^\d{4}-\d{2}$/, 'Formato deve ser YYYY-MM').optional(),
  valor: z.number().positive('Valor deve ser positivo').optional(),
});

export type RecorrenciaInput = z.infer<typeof recorrenciaSchema>;
export type LancarRecorrenciaInput = z.infer<typeof lancarRecorrenciaSchema>;
