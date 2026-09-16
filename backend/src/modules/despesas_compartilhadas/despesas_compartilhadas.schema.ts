import { z } from 'zod';

export const ParticipanteRateioSchema = z.object({
  pessoa_id: z.string().uuid(),
  valor: z.number().positive('Cota do participante deve ser maior que zero')
});

export const CriarDespesaCompartilhadaSchema = z.object({
  descricao: z.string().min(2, 'Descrição obrigatória'),
  valor_total: z.number().positive('Valor total deve ser positivo'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  conta_origem_id: z.string().uuid().optional(),
  cartao_id: z.string().uuid().optional(),
  categoria_id: z.string().uuid().optional(),
  incluir_usuario: z.boolean().default(true),
  participantes: z.array(ParticipanteRateioSchema).min(1, 'Adicione pelo menos 1 participante para dividir')
});

export type CriarDespesaCompartilhadaInput = z.infer<typeof CriarDespesaCompartilhadaSchema>;
