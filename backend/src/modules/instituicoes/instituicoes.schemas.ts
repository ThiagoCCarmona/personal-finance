import { z } from 'zod';

export const instituicaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  tipo: z.enum(['banco', 'carteira_digital', 'dinheiro']),
  icone: z.string().optional().default('Landmark'),
  cor: z.string().optional().default('#3B82F6'),
  ativo: z.boolean().optional().default(true),
});

export type InstituicaoInput = z.infer<typeof instituicaoSchema>;
