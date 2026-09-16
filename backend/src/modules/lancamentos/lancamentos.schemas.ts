import { z } from 'zod';

export const lancamentoSchema = z.object({
  tipo: z.enum(['despesa', 'receita']),
  valor: z.number().positive('O valor deve ser maior que zero'),
  moeda_id: z.string().uuid().optional(),
  data_compra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  data_competencia_fatura: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  forma_pagamento: z.enum(['dinheiro', 'pix_debito', 'debito', 'transferencia', 'credito', 'outros']),
  conta_id: z.string().uuid('ID de conta inválido').optional().nullable(),
  cartao_id: z.string().uuid('ID do cartão inválido').optional().nullable(),
  categoria_id: z.string().uuid('ID de categoria inválido'),
  subcategoria_id: z.string().uuid().optional().nullable(),
  descricao: z.string().min(1, 'Descrição é obrigatória').max(255),
  anexo_url: z.string().max(500).optional().nullable(),
  recorrencia_id: z.string().uuid().optional().nullable(),
  compra_parcelada_id: z.string().uuid().optional().nullable(),
  numero_parcela: z.number().int().optional().nullable(),
  total_parcelas: z.number().int().optional().nullable(),
  status: z.enum(['efetivado', 'pendente']).default('efetivado'),
});

export const filterLancamentoSchema = z.object({
  dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mesFatura: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  categoriaId: z.string().uuid().optional(),
  contaId: z.string().uuid().optional(),
  cartaoId: z.string().uuid().optional(),
  tipo: z.enum(['despesa', 'receita']).optional(),
  formaPagamento: z.string().optional(),
  busca: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type LancamentoInput = z.infer<typeof lancamentoSchema>;
export type LancamentoFilter = z.infer<typeof filterLancamentoSchema>;
