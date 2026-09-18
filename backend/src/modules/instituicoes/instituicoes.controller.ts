import { FastifyReply, FastifyRequest } from 'fastify';
import { instituicoesService } from './instituicoes.service.js';
import { instituicaoSchema } from './instituicoes.schemas.js';

export class InstituicoesController {
  async list(req: FastifyRequest<{ Querystring: { todas?: string } }>, reply: FastifyReply) {
    const userId = (req as any).user?.id;
    const includeInactive = req.query.todas === 'true';
    const list = await instituicoesService.listAll(userId, includeInactive);
    return reply.send(list);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user?.id;
    const item = await instituicoesService.getById(req.params.id, userId);
    if (!item) return reply.status(404).send({ error: 'Instituição não encontrada' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user?.id;
    const body = instituicaoSchema.parse(req.body);
    const item = await instituicoesService.create(body, userId);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user?.id;
    const body = instituicaoSchema.partial().parse(req.body);
    const item = await instituicoesService.update(req.params.id, body, userId);
    if (!item) return reply.status(404).send({ error: 'Instituição não encontrada' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user?.id;
    const success = await instituicoesService.delete(req.params.id, userId);
    if (!success) return reply.status(404).send({ error: 'Instituição não encontrada' });
    return reply.send({ message: 'Instituição removida com sucesso' });
  }
}

export const instituicoesController = new InstituicoesController();
