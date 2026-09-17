import { FastifyRequest, FastifyReply } from 'fastify';
import { pixService } from './pix.service.js';
import { CriarChavePixSchema, CriarCobrancaPixSchema, ConfirmarCobrancaPixSchema } from './pix.schema.js';

export class PixController {
  async listarChaves(request: FastifyRequest, reply: FastifyReply) {
    const chaves = await pixService.listarChaves();
    return reply.send(chaves);
  }

  async criarChave(request: FastifyRequest, reply: FastifyReply) {
    const parse = CriarChavePixSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const chave = await pixService.criarChave(parse.data);
    return reply.status(201).send(chave);
  }

  async excluirChave(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    await pixService.excluirChave(request.params.id);
    return reply.send({ success: true });
  }

  async listarCobrancas(request: FastifyRequest, reply: FastifyReply) {
    const cobrancas = await pixService.listarCobrancas();
    return reply.send(cobrancas);
  }

  async criarCobranca(request: FastifyRequest, reply: FastifyReply) {
    const parse = CriarCobrancaPixSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const cobranca = await pixService.criarCobranca(parse.data);
    return reply.status(201).send(cobranca);
  }

  async confirmarRecebimento(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parse = ConfirmarCobrancaPixSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    await pixService.confirmarRecebimento(request.params.id, parse.data);
    return reply.send({ success: true });
  }

  async excluirCobranca(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const ok = await pixService.excluirCobranca(request.params.id);
    if (!ok) return reply.status(404).send({ error: 'Cobrança não encontrada' });
    return reply.send({ success: true });
  }
}

export const pixController = new PixController();
