import { FastifyRequest, FastifyReply } from 'fastify';
import { dividasService } from './dividas.service.js';
import { CriarEmprestimoSchema, BaixaDividaSchema, AtualizarDividaSchema } from './dividas.schema.js';

export class DividasController {
  async listar(request: FastifyRequest<{ Querystring: { status?: string; pessoa_id?: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { status, pessoa_id } = request.query;
    const dividas = await dividasService.listar(userId, status, pessoa_id);
    return reply.send(dividas);
  }

  async obterResumo(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const resumo = await dividasService.obterResumo(userId);
    return reply.send(resumo);
  }

  async criarEmprestimo(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const parse = CriarEmprestimoSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const divida = await dividasService.criarEmprestimo(userId, parse.data);
    return reply.status(201).send(divida);
  }

  async darBaixa(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const parse = BaixaDividaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const divida = await dividasService.darBaixa(request.params.id, userId, parse.data);
    return reply.send(divida);
  }

  async perdoar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const divida = await dividasService.perdoar(request.params.id, userId);
    return reply.send(divida);
  }

  async atualizar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const parse = AtualizarDividaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const item = await dividasService.atualizar(request.params.id, userId, parse.data);
    if (!item) return reply.status(404).send({ error: 'Dívida não encontrada' });
    return reply.send(item);
  }

  async excluir(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const ok = await dividasService.excluir(request.params.id, userId);
    if (!ok) return reply.status(404).send({ error: 'Dívida não encontrada' });
    return reply.send({ success: true });
  }
}

export const dividasController = new DividasController();
