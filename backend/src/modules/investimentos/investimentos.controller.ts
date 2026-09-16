import { FastifyRequest, FastifyReply } from 'fastify';
import { InvestimentosService } from './investimentos.service.js';
import {
  criarInvestimentoSchema,
  atualizarInvestimentoSchema,
  criarMovimentacaoSchema,
} from './investimentos.schemas.js';

const service = new InvestimentosService();

export class InvestimentosController {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const ativos = await service.listar();
    return reply.send(ativos);
  }

  async resumo(request: FastifyRequest, reply: FastifyReply) {
    const resumo = await service.getResumoCarteira();
    return reply.send(resumo);
  }

  async criar(request: FastifyRequest, reply: FastifyReply) {
    const data = criarInvestimentoSchema.parse(request.body);
    const item = await service.criar(data);
    return reply.status(201).send(item);
  }

  async atualizar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const data = atualizarInvestimentoSchema.parse(request.body);
    const atualizado = await service.atualizar(request.params.id, data);
    if (!atualizado) return reply.status(404).send({ error: 'Investimento não encontrado' });
    return reply.send(atualizado);
  }

  async remover(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const ok = await service.remover(request.params.id);
    if (!ok) return reply.status(404).send({ error: 'Investimento não encontrado' });
    return reply.status(204).send();
  }

  async listarMovimentacoes(request: FastifyRequest<{ Querystring: { investimento_id?: string } }>, reply: FastifyReply) {
    const { investimento_id } = request.query;
    const movimentacoes = await service.listarMovimentacoes(investimento_id);
    return reply.send(movimentacoes);
  }

  async registrarMovimentacao(request: FastifyRequest, reply: FastifyReply) {
    const data = criarMovimentacaoSchema.parse(request.body);
    const mov = await service.registrarMovimentacao(data);
    return reply.status(201).send(mov);
  }

  async removerMovimentacao(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const ok = await service.removerMovimentacao(request.params.id);
    if (!ok) return reply.status(404).send({ error: 'Movimentação não encontrada' });
    return reply.status(204).send();
  }
}
