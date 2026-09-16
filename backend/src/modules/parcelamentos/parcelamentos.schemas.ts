import { z } from 'zod';

export const parcelamentoSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória').max(255),
  valor_total: z.number().positive('O valor total deve ser maior que zero'),
  num_parcelas: z.number().int().min(2, 'O parcelamento deve ter pelo menos 2 parcelas').max(96),
  cartao_id: z.string().uuid('ID do cartão inválido'),
  categoria_id: z.string().uuid('ID da categoria inválido'),
  subcategoria_id: z.string().uuid().optional().nullable(),
  data_compra: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
});

export type ParcelamentoInput = z.infer<typeof parcelamentoSchema>;
