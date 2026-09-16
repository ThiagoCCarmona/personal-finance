import { FastifyReply, FastifyRequest } from 'fastify';
import { categoriasService } from './categorias.service.js';
import { categoriaSchema } from './categorias.schemas.js';

export class CategoriasController {
  async list(req: FastifyRequest<{ Querystring: { tipo?: string } }>, reply: FastifyReply) {
    const data = await categoriasService.listAll(req.query.tipo);
    return reply.send(data);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await categoriasService.getById(req.params.id);
    if (!item) return reply.status(404).send({ error: 'Categoria não encontrada' });
    return reply.send(item);
  }

  async create(req: FastifyRequest, reply: FastifyReply) {
    const body = categoriaSchema.parse(req.body);
    const item = await categoriasService.create(body);
    return reply.status(201).send(item);
  }

  async update(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const body = categoriaSchema.partial().parse(req.body);
    const item = await categoriasService.update(req.params.id, body);
    if (!item) return reply.status(404).send({ error: 'Categoria não encontrada' });
    return reply.send(item);
  }

  async delete(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const success = await categoriasService.delete(req.params.id);
    if (!success) return reply.status(404).send({ error: 'Categoria não encontrada' });
    return reply.send({ message: 'Categoria removida com sucesso' });
  }
}

export const categoriasController = new CategoriasController();
