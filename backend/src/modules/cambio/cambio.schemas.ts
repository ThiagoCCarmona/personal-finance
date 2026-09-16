import { z } from 'zod';

export const historicoQuerySchema = z.object({
  moeda: z.string().default('USD'),
  dias: z.coerce.number().min(7).max(365).default(30),
});

export const registrarCotacaoManualSchema = z.object({
  moeda_codigo: z.string().min(3).max(3),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valor_ptax: z.number().positive(),
  fonte: z.string().optional(),
});

export const calcularGanhoCambialSchema = z.object({
  moeda_codigo: z.string().min(3).max(3),
  quantidade: z.number().positive(),
  cotacao_aquisicao: z.number().positive(),
});

export type HistoricoQuery = z.infer<typeof historicoQuerySchema>;
export type RegistrarCotacaoManualInput = z.infer<typeof registrarCotacaoManualSchema>;
export type CalcularGanhoCambialInput = z.infer<typeof calcularGanhoCambialSchema>;
