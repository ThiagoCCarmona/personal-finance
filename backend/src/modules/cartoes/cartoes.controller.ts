import { FastifyReply, FastifyRequest } from 'fastify';
import { cartoesService } from './cartoes.service.js';
import { cartaoSchema } from './cartoes.schemas.js';

export class CartoesController {
  async list(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const list = await cartoesService.listAll(userId);
    return reply.send(list);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const item = await cartoesService.getById(req.params.id, userId);
    if (!item) return reply.status(404).send({ error: 'Cartão não encontrado' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = cartaoSchema.parse(req.body);
    const item = await cartoesService.create(userId, body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = cartaoSchema.partial().parse(req.body);
    const item = await cartoesService.update(req.params.id, userId, body);
    if (!item) return reply.status(404).send({ error: 'Cartão não encontrado' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const success = await cartoesService.delete(req.params.id, userId);
    if (!success) return reply.status(404).send({ error: 'Cartão não encontrado' });
    return reply.send({ message: 'Cartão removido com sucesso' });
  }

  async getFatura(req: FastifyRequest<{ Params: { id: string }; Querystring: { anoMes?: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const fatura = await cartoesService.getFatura(req.params.id, userId, req.query.anoMes);
    return reply.send(fatura);
  }
}

export const cartoesController = new CartoesController();
