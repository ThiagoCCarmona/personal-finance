import { FastifyRequest, FastifyReply } from 'fastify';
import { dividasService } from './dividas.service.js';
import { CriarEmprestimoSchema, BaixaDividaSchema } from './dividas.schema.js';

export class DividasController {
  async listar(request: FastifyRequest<{ Querystring: { status?: string; pessoa_id?: string } }>, reply: FastifyReply) {
    const { status, pessoa_id } = request.query;
    const dividas = await dividasService.listar(status, pessoa_id);
    return reply.send({ data: dividas });
  }

  async obterResumo(request: FastifyRequest, reply: FastifyReply) {
    const resumo = await dividasService.obterResumo();
    return reply.send({ data: resumo });
  }

  async criarEmprestimo(request: FastifyRequest, reply: FastifyReply) {
    const parse = CriarEmprestimoSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const divida = await dividasService.criarEmprestimo(parse.data);
    return reply.status(201).send({ data: divida });
  }

  async darBaixa(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parse = BaixaDividaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const divida = await dividasService.darBaixa(request.params.id, parse.data);
    return reply.send({ data: divida });
  }

  async perdoar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const divida = await dividasService.perdoar(request.params.id);
    return reply.send({ data: divida });
  }
}

export const dividasController = new DividasController();
