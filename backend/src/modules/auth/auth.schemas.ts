import { z } from 'zod';

export const setupSchema = z.object({
  login: z.string().min(3, 'Login deve ter no mínimo 3 caracteres').max(50),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  nome: z.string().min(2).max(100).optional(),
  inactivityTimeoutMinutes: z.number().int().positive().optional().default(720),
});

export const registerSchema = z.object({
  login: z.string().min(3, 'Login deve ter no mínimo 3 caracteres').max(50),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  nome: z.string().min(2, 'Informe seu nome').max(100).optional(),
  inactivityTimeoutMinutes: z.number().int().positive().optional().default(720),
});

export const loginSchema = z.object({
  login: z.string().min(1, 'Informe o login'),
  senha: z.string().min(1, 'Informe a senha'),
});

export const trocarSenhaPrimeiroAcessoSchema = z.object({
  novaSenha: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres').max(100),
});

export const atualizarPerfilSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100),
});

export type SetupInput = z.infer<typeof setupSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TrocarSenhaPrimeiroAcessoInput = z.infer<typeof trocarSenhaPrimeiroAcessoSchema>;
export type AtualizarPerfilInput = z.infer<typeof atualizarPerfilSchema>;
