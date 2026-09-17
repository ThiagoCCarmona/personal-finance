import { FastifyRequest, FastifyReply } from 'fastify';
import { listaDesejoService } from './lista_desejo.service.js';
import { criarItemDesejoSchema, atualizarItemDesejoSchema, comprarItemDesejoSchema } from './lista_desejo.schema.js';

export class ListaDesejoController {
  async listar(req: FastifyRequest<{ Querystring: { status?: string; prioridade?: string; busca?: string } }>, reply: FastifyReply) {
    const itens = await listaDesejoService.listar(req.query);
    return reply.send(itens);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const item = await listaDesejoService.getById(req.params.id);
    if (!item) return reply.status(404).send({ error: 'Item não encontrado' });
    return reply.send(item);
  }

  async criar(req: FastifyRequest, reply: FastifyReply) {
    const body = criarItemDesejoSchema.parse(req.body);
    const novo = await listaDesejoService.criar(body);
    return reply.status(201).send(novo);
  }

  async atualizar(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const body = atualizarItemDesejoSchema.parse(req.body);
    const atualizado = await listaDesejoService.atualizar(req.params.id, body);
    if (!atualizado) return reply.status(404).send({ error: 'Item não encontrado' });
    return reply.send(atualizado);
  }

  async excluir(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const ok = await listaDesejoService.excluir(req.params.id);
    if (!ok) return reply.status(404).send({ error: 'Item não encontrado' });
    return reply.send({ success: true });
  }

  async comprar(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const body = comprarItemDesejoSchema.optional().parse(req.body || {});
    const item = await listaDesejoService.marcarComoComprado(req.params.id, body);
    return reply.send(item);
  }
}

export const listaDesejoController = new ListaDesejoController();
