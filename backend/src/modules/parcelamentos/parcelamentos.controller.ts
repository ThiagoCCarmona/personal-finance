import { FastifyReply, FastifyRequest } from 'fastify';
import { parcelamentosService } from './parcelamentos.service.js';
import { parcelamentoSchema } from './parcelamentos.schemas.js';

export class ParcelamentosController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const list = await parcelamentosService.listAll();
    return reply.send(list);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await parcelamentosService.getById(req.params.id);
    if (!item) return reply.status(404).send({ error: 'Compra parcelada não encontrada' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const body = parcelamentoSchema.parse(req.body);
    const item = await parcelamentosService.create(body);
    return reply.status(201).send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const success = await parcelamentosService.delete(req.params.id);
    if (!success) return reply.status(404).send({ error: 'Compra parcelada não encontrada' });
    return reply.send({ message: 'Compra parcelada e parcelas removidas com sucesso' });
  }
}

export const parcelamentosController = new ParcelamentosController();
