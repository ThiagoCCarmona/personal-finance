import { FastifyReply, FastifyRequest } from 'fastify';
import { contasService } from './contas.service.js';
import { contaSchema } from './contas.schemas.js';

export class ContasController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const list = await contasService.listAll();
    return reply.send(list);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await contasService.getById(req.params.id);
    if (!item) return reply.status(404).send({ error: 'Conta não encontrada' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const body = contaSchema.parse(req.body);
    const item = await contasService.create(body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const body = contaSchema.partial().parse(req.body);
    const item = await contasService.update(req.params.id, body);
    if (!item) return reply.status(404).send({ error: 'Conta não encontrada' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const success = await contasService.delete(req.params.id);
    if (!success) return reply.status(404).send({ error: 'Conta não encontrada' });
    return reply.send({ message: 'Conta removida com sucesso' });
  }

  async getSaldoConsolidado(req: FastifyRequest, reply: FastifyReply) {
    const result = await contasService.getSaldoConsolidado();
    return reply.send(result);
  }
}

export const contasController = new ContasController();
