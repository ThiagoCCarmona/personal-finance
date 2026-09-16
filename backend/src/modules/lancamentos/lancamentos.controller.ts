import { FastifyReply, FastifyRequest } from 'fastify';
import { lancamentosService } from './lancamentos.service.js';
import { filterLancamentoSchema, lancamentoSchema } from './lancamentos.schemas.js';

export class LancamentosController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const filters = filterLancamentoSchema.parse(req.query);
    const result = await lancamentosService.listAll(filters);
    return reply.send(result);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await lancamentosService.getById(req.params.id);
    if (!item) return reply.status(404).send({ error: 'Lançamento não encontrado' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const body = lancamentoSchema.parse(req.body);
    const item = await lancamentosService.create(body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const body = lancamentoSchema.parse(req.body);
    const item = await lancamentosService.update(req.params.id, body);
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const success = await lancamentosService.delete(req.params.id);
    if (!success) return reply.status(404).send({ error: 'Lançamento não encontrado' });
    return reply.send({ message: 'Lançamento excluído com sucesso' });
  }
}

export const lancamentosController = new LancamentosController();
