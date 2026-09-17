import { FastifyReply, FastifyRequest } from 'fastify';
import { instituicoesService } from './instituicoes.service.js';
import { instituicaoSchema } from './instituicoes.schemas.js';

export class InstituicoesController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user?.id;
    const list = await instituicoesService.listAll(userId);
    return reply.send(list);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await instituicoesService.getById(req.params.id);
    if (!item) return reply.status(404).send({ error: 'Instituição não encontrada' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const body = instituicaoSchema.parse(req.body);
    const item = await instituicoesService.create(body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const body = instituicaoSchema.partial().parse(req.body);
    const item = await instituicoesService.update(req.params.id, body);
    if (!item) return reply.status(404).send({ error: 'Instituição não encontrada' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const success = await instituicoesService.delete(req.params.id);
    if (!success) return reply.status(404).send({ error: 'Instituição não encontrada' });
    return reply.send({ message: 'Instituição removida com sucesso' });
  }
}

export const instituicoesController = new InstituicoesController();
