import { FastifyRequest, FastifyReply } from 'fastify';
import { dividasService } from './dividas.service.js';
import { CriarEmprestimoSchema, BaixaDividaSchema } from './dividas.schema.js';

export class DividasController {
  async listar(request: FastifyRequest<{ Querystring: { status?: string; pessoa_id?: string } }>, reply: FastifyReply) {
    const { status, pessoa_id } = request.query;
    const dividas = await dividasService.listar(status, pessoa_id);
    return reply.send(dividas);
  }

  async obterResumo(request: FastifyRequest, reply: FastifyReply) {
    const resumo = await dividasService.obterResumo();
    return reply.send(resumo);
  }

  async criarEmprestimo(request: FastifyRequest, reply: FastifyReply) {
    const parse = CriarEmprestimoSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const divida = await dividasService.criarEmprestimo(parse.data);
    return reply.status(201).send(divida);
  }

  async darBaixa(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parse = BaixaDividaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const divida = await dividasService.darBaixa(request.params.id, parse.data);
    return reply.send(divida);
  }

  async perdoar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const divida = await dividasService.perdoar(request.params.id);
    return reply.send(divida);
  }

  async atualizar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { AtualizarDividaSchema } = await import('./dividas.schema.js');
    const parse = AtualizarDividaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const item = await dividasService.atualizar(request.params.id, parse.data);
    if (!item) return reply.status(404).send({ error: 'Dívida não encontrada' });
    return reply.send(item);
  }

  async excluir(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const ok = await dividasService.excluir(request.params.id);
    if (!ok) return reply.status(404).send({ error: 'Dívida não encontrada' });
    return reply.send({ success: true });
  }
}

export const dividasController = new DividasController();
