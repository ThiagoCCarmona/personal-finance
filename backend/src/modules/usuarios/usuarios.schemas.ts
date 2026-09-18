import { z } from 'zod';

export const criarUsuarioSchema = z.object({
  login: z.string().min(3, 'Login deve ter no mínimo 3 caracteres').max(50),
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  senha: z.string().min(6, 'Senha temporária deve ter no mínimo 6 caracteres'),
  role: z.enum(['user', 'admin']).default('user'),
});

export const atualizarUsuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
  role: z.enum(['user', 'admin']).default('user'),
  ativo: z.boolean().default(true),
});

export const resetarSenhaUsuarioSchema = z.object({
  novaSenha: z.string().min(6, 'A nova senha temporária deve ter no mínimo 6 caracteres'),
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
export type ResetarSenhaUsuarioInput = z.infer<typeof resetarSenhaUsuarioSchema>;
