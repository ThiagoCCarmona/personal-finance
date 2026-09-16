import { FastifyReply, FastifyRequest } from 'fastify';
import { recorrenciasService } from './recorrencias.service.js';
import { recorrenciaSchema } from './recorrencias.schemas.js';

export class RecorrenciasController {
  async list(req: FastifyRequest<{ Querystring: { anoMes?: string } }>, reply: FastifyReply) {
    const list = await recorrenciasService.listAll(req.query.anoMes);
    return reply.send(list);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await recorrenciasService.getById(req.params.id);
    if (!item) return reply.status(404).send({ error: 'Recorrência não encontrada' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const body = recorrenciaSchema.parse(req.body);
    const item = await recorrenciasService.create(body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const body = recorrenciaSchema.partial().parse(req.body);
    const item = await recorrenciasService.update(req.params.id, body);
    if (!item) return reply.status(404).send({ error: 'Recorrência não encontrada' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const success = await recorrenciasService.delete(req.params.id);
    if (!success) return reply.status(404).send({ error: 'Recorrência não encontrada' });
    return reply.send({ message: 'Recorrência removida com sucesso' });
  }

  async lancar(req: FastifyRequest<{ Params: { id: string }; Body: { anoMes?: string } }>, reply: FastifyReply) {
    const anoMes = (req.body as any)?.anoMes;
    const lancamento = await recorrenciasService.lancarNaCompetencia(req.params.id, anoMes);
    return reply.status(201).send({
      message: 'Lançamento efetivado com sucesso a partir da recorrência!',
      lancamento,
    });
  }
}

export const recorrenciasController = new RecorrenciasController();
