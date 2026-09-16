import { z } from 'zod';

export const contaSchema = z.object({
  instituicao_id: z.string().uuid('ID de instituição inválido'),
  moeda_id: z.string().uuid('ID de moeda inválido').optional(),
  tipo: z.enum(['corrente', 'poupanca', 'carteira_digital', 'dinheiro']),
  apelido: z.string().min(1, 'Apelido é obrigatório').max(100),
  saldo_inicial: z.number().default(0),
  ativo: z.boolean().optional().default(true),
});

export type ContaInput = z.infer<typeof contaSchema>;
