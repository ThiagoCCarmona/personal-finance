import { FastifyRequest, FastifyReply } from 'fastify';
import { despesasCompartilhadasService } from './despesas_compartilhadas.service.js';
import { CriarDespesaCompartilhadaSchema } from './despesas_compartilhadas.schema.js';

export class DespesasCompartilhadasController {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const list = await despesasCompartilhadasService.listar();
    return reply.send(list);
  }

  async criar(request: FastifyRequest, reply: FastifyReply) {
    const parse = CriarDespesaCompartilhadaSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const item = await despesasCompartilhadasService.criar(parse.data);
    return reply.status(201).send(item);
  }

  async excluir(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const ok = await despesasCompartilhadasService.excluir(request.params.id);
    if (!ok) return reply.status(404).send({ error: 'Despesa compartilhada não encontrada' });
    return reply.send({ success: true });
  }
}

export const despesasCompartilhadasController = new DespesasCompartilhadasController();
