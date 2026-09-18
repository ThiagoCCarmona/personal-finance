import { FastifyReply, FastifyRequest } from 'fastify';
import { cartoesService } from './cartoes.service.js';
import { cartaoSchema, pagarFaturaSchema } from './cartoes.schemas.js';

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

  async pagarFatura(req: FastifyRequest<{ Params: { id: string; anoMes?: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const rawBody: any = req.body || {};
    // Se anoMes vier no params ou no body, unifica
    const anoMes = req.params.anoMes || rawBody.anoMes;
    const body = pagarFaturaSchema.parse({
      ...rawBody,
      anoMes,
    });
    const res = await cartoesService.pagarFatura(req.params.id, userId, body);
    return reply.send(res);
  }

  async estornarPagamentoFatura(req: FastifyRequest<{ Params: { id: string; anoMes?: string }; Querystring: { anoMes?: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const anoMes = req.params.anoMes || req.query.anoMes;
    if (!anoMes) {
      return reply.status(400).send({ error: 'Informe a competência da fatura (anoMes) no formato YYYY-MM' });
    }
    const res = await cartoesService.estornarPagamentoFatura(req.params.id, userId, anoMes);
    return reply.send(res);
  }
}

export const cartoesController = new CartoesController();
