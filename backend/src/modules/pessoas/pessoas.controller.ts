import { FastifyRequest, FastifyReply } from 'fastify';
import { pessoasService } from './pessoas.service.js';
import { CriarPessoaSchema, AtualizarPessoaSchema } from './pessoas.schema.js';

export class PessoasController {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const pessoas = await pessoasService.listar(userId);
    return reply.send(pessoas);
  }

  async criar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const parse = CriarPessoaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const pessoa = await pessoasService.criar(userId, parse.data);
    return reply.status(201).send(pessoa);
  }

  async atualizar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const parse = AtualizarPessoaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const pessoa = await pessoasService.atualizar(request.params.id, userId, parse.data);
    if (!pessoa) {
      return reply.status(404).send({ error: 'Contato não encontrado' });
    }
    return reply.send(pessoa);
  }

  async excluir(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { id } = request.params;
    await pessoasService.excluir(id, userId);
    return reply.send({ success: true });
  }
}

export const pessoasController = new PessoasController();
