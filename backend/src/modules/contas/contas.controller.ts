import { FastifyReply, FastifyRequest } from 'fastify';
import { contasService } from './contas.service.js';
import { contaSchema } from './contas.schemas.js';

export class ContasController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const list = await contasService.listAll(userId);
    return reply.send(list);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const item = await contasService.getById(req.params.id, userId);
    if (!item) return reply.status(404).send({ error: 'Conta não encontrada' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = contaSchema.parse(req.body);
    const item = await contasService.create(userId, body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = contaSchema.partial().parse(req.body);
    const item = await contasService.update(req.params.id, userId, body);
    if (!item) return reply.status(404).send({ error: 'Conta não encontrada' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const success = await contasService.delete(req.params.id, userId);
    if (!success) return reply.status(404).send({ error: 'Conta não encontrada' });
    return reply.send({ message: 'Conta removida com sucesso' });
  }

  async getSaldoConsolidado(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const result = await contasService.getSaldoConsolidado(userId);
    return reply.send(result);
  }
}

export const contasController = new ContasController();
