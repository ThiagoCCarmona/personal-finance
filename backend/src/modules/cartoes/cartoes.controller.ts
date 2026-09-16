import { FastifyReply, FastifyRequest } from 'fastify';
import { cartoesService } from './cartoes.service.js';
import { cartaoSchema } from './cartoes.schemas.js';

export class CartoesController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const list = await cartoesService.listAll();
    return reply.send(list);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await cartoesService.getById(req.params.id);
    if (!item) return reply.status(404).send({ error: 'Cartão não encontrado' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const body = cartaoSchema.parse(req.body);
    const item = await cartoesService.create(body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const body = cartaoSchema.partial().parse(req.body);
    const item = await cartoesService.update(req.params.id, body);
    if (!item) return reply.status(404).send({ error: 'Cartão não encontrado' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const success = await cartoesService.delete(req.params.id);
    if (!success) return reply.status(404).send({ error: 'Cartão não encontrado' });
    return reply.send({ message: 'Cartão removido com sucesso' });
  }

  async getFatura(req: FastifyRequest<{ Params: { id: string }; Querystring: { anoMes?: string } }>, reply: FastifyReply) {
    const fatura = await cartoesService.getFatura(req.params.id, req.query.anoMes);
    return reply.send(fatura);
  }
}

export const cartoesController = new CartoesController();
