import { FastifyReply, FastifyRequest } from 'fastify';
import { categoriasService } from './categorias.service.js';
import { categoriaSchema } from './categorias.schemas.js';

export class CategoriasController {
  async list(req: FastifyRequest<{ Querystring: { tipo?: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const data = await categoriasService.listAll(userId, req.query.tipo);
    return reply.send(data);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const item = await categoriasService.getById(req.params.id, userId);
    if (!item) return reply.status(404).send({ error: 'Categoria não encontrada' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = categoriaSchema.parse(req.body);
    const item = await categoriasService.create(userId, body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = categoriaSchema.partial().parse(req.body);
    const item = await categoriasService.update(req.params.id, userId, body);
    if (!item) return reply.status(404).send({ error: 'Categoria não encontrada' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const success = await categoriasService.delete(req.params.id, userId);
    if (!success) return reply.status(404).send({ error: 'Categoria não encontrada' });
    return reply.send({ message: 'Categoria removida com sucesso' });
  }
}

export const categoriasController = new CategoriasController();
