import { z } from 'zod';

export const CriarChavePixSchema = z.object({
  tipo: z.enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria']),
  valor_chave: z.string().min(3, 'Chave PIX inválida'),
  nome_recebedor: z.string().min(2, 'Nome do recebedor deve ter pelo menos 2 caracteres'),
  cidade_recebedor: z.string().min(2, 'Cidade do recebedor deve ter pelo menos 2 caracteres'),
  apelido: z.string().optional()
});

export const CriarCobrancaPixSchema = z.object({
  chave_pix_id: z.string().uuid('Selecione uma chave PIX'),
  valor: z.number().min(0, 'Valor não pode ser negativo'),
  mensagem: z.string().max(140).optional(),
  txid: z.string().max(35).optional(),
  divida_id: z.string().uuid().optional(),
  lancamento_id: z.string().uuid().optional()
});

export const ConfirmarCobrancaPixSchema = z.object({
  conta_destino_id: z.string().uuid('Selecione a conta bancária para crédito')
});

export type CriarChavePixInput = z.infer<typeof CriarChavePixSchema>;
export type CriarCobrancaPixInput = z.infer<typeof CriarCobrancaPixSchema>;
export type ConfirmarCobrancaPixInput = z.infer<typeof ConfirmarCobrancaPixSchema>;
