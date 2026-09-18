import { FastifyReply, FastifyRequest } from 'fastify';
import { recorrenciasService } from './recorrencias.service.js';
import { recorrenciaSchema } from './recorrencias.schemas.js';

export class RecorrenciasController {
  async list(req: FastifyRequest<{ Querystring: { anoMes?: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const list = await recorrenciasService.listAll(userId, req.query.anoMes);
    return reply.send(list);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const item = await recorrenciasService.getById(req.params.id, userId);
    if (!item) return reply.status(404).send({ error: 'Recorrência não encontrada' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = recorrenciaSchema.parse(req.body);
    const item = await recorrenciasService.create(userId, body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = recorrenciaSchema.partial().parse(req.body);
    const item = await recorrenciasService.update(req.params.id, userId, body);
    if (!item) return reply.status(404).send({ error: 'Recorrência não encontrada' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const success = await recorrenciasService.delete(req.params.id, userId);
    if (!success) return reply.status(404).send({ error: 'Recorrência não encontrada' });
    return reply.send({ message: 'Recorrência removida com sucesso' });
  }

  async lancar(req: FastifyRequest<{ Params: { id: string }; Body: { anoMes?: string; valor?: number } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const { anoMes, valor } = (req.body as any) || {};
    const lancamento = await recorrenciasService.lancarNaCompetencia(
      req.params.id, 
      userId, 
      anoMes, 
      valor ? Number(valor) : undefined
    );
    return reply.status(201).send({
      message: 'Lançamento efetivado com sucesso a partir da recorrência!',
      lancamento,
    });
  }
}

export const recorrenciasController = new RecorrenciasController();
