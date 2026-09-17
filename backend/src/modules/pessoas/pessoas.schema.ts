import { z } from 'zod';

export const CriarPessoaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  apelido: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal(''))
});

export const AtualizarPessoaSchema = CriarPessoaSchema.partial();

export type CriarPessoaInput = z.infer<typeof CriarPessoaSchema>;
export type AtualizarPessoaInput = z.infer<typeof AtualizarPessoaSchema>;
