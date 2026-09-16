import { z } from 'zod';

export const categoriaSchema = z.object({
  nome: z.string().min(1, 'Nome da categoria é obrigatório').max(100),
  tipo: z.enum(['despesa', 'receita']),
  icone: z.string().optional().default('Tag'),
  cor: z.string().optional().default('#6B7280'),
  categoria_pai_id: z.string().uuid().nullable().optional(),
  ativo: z.boolean().optional().default(true),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
