import { FastifyRequest, FastifyReply } from 'fastify';
import { pessoasService } from './pessoas.service.js';
import { CriarPessoaSchema } from './pessoas.schema.js';

export class PessoasController {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const pessoas = await pessoasService.listar();
    return reply.send({ data: pessoas });
  }

  async criar(request: FastifyRequest, reply: FastifyReply) {
    const parse = CriarPessoaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const pessoa = await pessoasService.criar(parse.data);
    return reply.status(201).send({ data: pessoa });
  }

  async excluir(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    await pessoasService.excluir(id);
    return reply.send({ success: true });
  }
}

export const pessoasController = new PessoasController();
