import { FastifyRequest, FastifyReply } from 'fastify';
import { listaDesejoService } from './lista_desejo.service.js';
import { criarItemDesejoSchema, atualizarItemDesejoSchema, comprarItemDesejoSchema, adicionarPrecoSchema } from './lista_desejo.schema.js';

export class ListaDesejoController {
  async listar(req: FastifyRequest<{ Querystring: { status?: string; prioridade?: string; busca?: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const itens = await listaDesejoService.listar(userId, req.query);
    return reply.send(itens);
  }

  async getById(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const item = await listaDesejoService.getById(req.params.id, userId);
    if (!item) return reply.status(404).send({ error: 'Item não encontrado' });
    return reply.send(item);
  }

  async criar(req: FastifyRequest, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = criarItemDesejoSchema.parse(req.body);
    const novo = await listaDesejoService.criar(userId, body);
    return reply.status(201).send(novo);
  }

  async atualizar(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = atualizarItemDesejoSchema.parse(req.body);
    const atualizado = await listaDesejoService.atualizar(req.params.id, userId, body);
    if (!atualizado) return reply.status(404).send({ error: 'Item não encontrado' });
    return reply.send(atualizado);
  }

  async excluir(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const ok = await listaDesejoService.excluir(req.params.id, userId);
    if (!ok) return reply.status(404).send({ error: 'Item não encontrado' });
    return reply.send({ success: true });
  }

  async comprar(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = comprarItemDesejoSchema.optional().parse(req.body || {});
    const item = await listaDesejoService.marcarComoComprado(req.params.id, userId, body);
    return reply.send(item);
  }

  async adicionarPreco(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (req as any).user.id;
    const body = adicionarPrecoSchema.parse(req.body);
    const item = await listaDesejoService.adicionarPrecoHistorico(req.params.id, userId, body);
    return reply.send(item);
  }
}

export const listaDesejoController = new ListaDesejoController();
