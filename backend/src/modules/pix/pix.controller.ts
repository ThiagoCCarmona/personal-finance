import { FastifyRequest, FastifyReply } from 'fastify';
import { pixService } from './pix.service.js';
import { CriarChavePixSchema, CriarCobrancaPixSchema, ConfirmarCobrancaPixSchema } from './pix.schema.js';

export class PixController {
  async listarChaves(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const chaves = await pixService.listarChaves(userId);
    return reply.send(chaves);
  }

  async criarChave(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const parse = CriarChavePixSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const chave = await pixService.criarChave(userId, parse.data);
    return reply.status(201).send(chave);
  }

  async excluirChave(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    await pixService.excluirChave(request.params.id, userId);
    return reply.send({ success: true });
  }

  async listarCobrancas(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const cobrancas = await pixService.listarCobrancas(userId);
    return reply.send(cobrancas);
  }

  async criarCobranca(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const parse = CriarCobrancaPixSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const cobranca = await pixService.criarCobranca(userId, parse.data);
    return reply.status(201).send(cobranca);
  }

  async confirmarRecebimento(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const parse = ConfirmarCobrancaPixSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    await pixService.confirmarRecebimento(request.params.id, userId, parse.data);
    return reply.send({ success: true });
  }

  async excluirCobranca(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const ok = await pixService.excluirCobranca(request.params.id, userId);
    if (!ok) return reply.status(404).send({ error: 'Cobrança não encontrada' });
    return reply.send({ success: true });
  }
}

export const pixController = new PixController();
