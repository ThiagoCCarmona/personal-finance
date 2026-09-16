import { z } from 'zod';

export const setupSchema = z.object({
  login: z.string().min(3, 'Login deve ter no mínimo 3 caracteres').max(50),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  inactivityTimeoutMinutes: z.number().int().positive().optional().default(720),
});

export const loginSchema = z.object({
  login: z.string().min(1, 'Informe o login'),
  senha: z.string().min(1, 'Informe a senha'),
});

export type SetupInput = z.infer<typeof setupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
