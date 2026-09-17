import { z } from 'zod';

export const criarItemDesejoSchema = z.object({
  nome: z.string().min(1, 'Informe o nome do item').max(255),
  link: z.string().url('Link inválido').optional().nullable().or(z.literal('')),
  preco_estimado: z.number().positive('Preço deve ser maior que zero'),
  prioridade: z.enum(['baixa', 'media', 'alta', 'urgente']).default('media'),
  categoria_id: z.string().uuid().optional().nullable().or(z.literal('')),
  tipo_gasto: z.enum(['essencial', 'pessoal', 'desejo', 'investimento_pessoal', 'eletronico', 'casa']).default('pessoal'),
  status: z.enum(['planejado', 'comprado', 'descartado']).default('planejado'),
  observacoes: z.string().optional().nullable(),
  data_alvo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data alvo inválida (AAAA-MM-DD)').optional().nullable().or(z.literal('')),
});

export const atualizarItemDesejoSchema = criarItemDesejoSchema.partial();

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
