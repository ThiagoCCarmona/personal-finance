import { z } from 'zod';

export const criarUsuarioSchema = z.object({
  login: z.string().min(3, 'Login deve ter no mínimo 3 caracteres').max(50),
  nome: z.string().max(100).optional().nullable(),
  senha: z.string().min(6, 'Senha temporária deve ter no mínimo 6 caracteres').optional(),
  senha_inicial: z.string().min(6, 'Senha temporária deve ter no mínimo 6 caracteres').optional(),
  role: z.enum(['user', 'usuario', 'admin']).default('usuario'),
}).refine(data => Boolean(data.senha || data.senha_inicial), {
  message: 'Informe a senha inicial provisória do usuário (mínimo 6 caracteres)',
});

export const atualizarUsuarioSchema = z.object({
  nome: z.string().max(100).optional().nullable(),
  role: z.enum(['user', 'usuario', 'admin']).optional(),
  ativo: z.boolean().optional(),
});

export const resetarSenhaUsuarioSchema = z.object({
  novaSenha: z.string().min(6, 'A nova senha temporária deve ter no mínimo 6 caracteres').optional(),
  nova_senha_temporaria: z.string().min(6, 'A nova senha temporária deve ter no mínimo 6 caracteres').optional(),
}).refine(data => Boolean(data.novaSenha || data.nova_senha_temporaria), {
  message: 'Informe a nova senha temporária (mínimo 6 caracteres)',
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type AtualizarUsuarioInput = z.infer<typeof atualizarUsuarioSchema>;
export type ResetarSenhaUsuarioInput = z.infer<typeof resetarSenhaUsuarioSchema>;
