import { z } from 'zod';

export const historicoPrecoItemSchema = z.object({
  id: z.string().optional(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato AAAA-MM-DD').default(() => new Date().toISOString().split('T')[0]),
  preco: z.number().positive('Preço deve ser positivo'),
  loja: z.string().optional().default(''),
  observacao: z.string().optional().default(''),
});

export const linkItemSchema = z.object({
  id: z.string().optional(),
  url: z.string().url('URL inválida').or(z.string().min(1)),
  loja: z.string().optional().default(''),
  preco_atual: z.number().optional(),
  historico_precos: z.array(historicoPrecoItemSchema).optional().default([]),
});

export const criarItemDesejoSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do item').max(255),
  link: z.string().optional().nullable().or(z.literal('')),
  links: z.array(linkItemSchema).optional().default([]),
  preco_estimado: z.number().positive('Preço deve ser maior que zero'),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
  categoria_id: z.string().uuid().optional().nullable().or(z.literal('')),
  tipo_gasto: z.enum(['essencial', 'pessoal', 'desejo', 'investimento_pessoal', 'eletronico', 'casa']).default('pessoal'),
  status: z.enum(['planejado', 'comprado', 'descartado']).default('planejado'),
  observacoes: z.string().optional().nullable(),
  data_alvo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data alvo inválida (AAAA-MM-DD)').optional().nullable().or(z.literal('')),
  historico_precos: z.array(historicoPrecoItemSchema).optional().default([]),
});

export const atualizarItemDesejoSchema = criarItemDesejoSchema.partial();

export const adicionarPrecoSchema = z.object({
  link_id: z.string().optional(),
  link_url: z.string().optional(),
  loja: z.string().optional().default(''),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data no formato AAAA-MM-DD').default(() => new Date().toISOString().split('T')[0]),
  preco: z.number().positive('Preço deve ser positivo'),
  observacao: z.string().optional().default(''),
});

export const comprarItemDesejoSchema = z.object({
  conta_id: z.string().uuid().optional().nullable(),
  cartao_id: z.string().uuid().optional().nullable(),
  categoria_id: z.string().uuid().optional().nullable(),
  valor_pago: z.number().positive().optional(),
  data_compra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  forma_pagamento: z.enum(['dinheiro', 'pix_debito', 'debito', 'transferencia', 'credito', 'outros']).default('pix_debito'),
});

export type CriarItemDesejoInput = z.infer<typeof criarItemDesejoSchema>;
export type AtualizarItemDesejoInput = z.infer<typeof atualizarItemDesejoSchema>;
export type ComprarItemDesejoInput = z.infer<typeof comprarItemDesejoSchema>;
export type AdicionarPrecoInput = z.infer<typeof adicionarPrecoSchema>;
