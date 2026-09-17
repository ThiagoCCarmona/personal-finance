import { FastifyRequest, FastifyReply } from 'fastify';
import { investimentosService } from './investimentos.service.js';
import {
  criarInvestimentoSchema,
  atualizarInvestimentoSchema,
  criarMovimentacaoSchema,
} from './investimentos.schemas.js';

export class InvestimentosController {
  async listar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const ativos = await investimentosService.listar(userId);
    return reply.send(ativos);
  }

  async resumo(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const resumo = await investimentosService.getResumoCarteira(userId);
    return reply.send(resumo);
  }

  async criar(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const data = criarInvestimentoSchema.parse(request.body);
    const item = await investimentosService.criar(userId, data);
    return reply.status(201).send(item);
  }

  async atualizar(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const data = atualizarInvestimentoSchema.parse(request.body);
    const atualizado = await investimentosService.atualizar(request.params.id, userId, data);
    if (!atualizado) return reply.status(404).send({ error: 'Investimento não encontrado' });
    return reply.send(atualizado);
  }

  async remover(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const ok = await investimentosService.remover(request.params.id, userId);
    if (!ok) return reply.status(404).send({ error: 'Investimento não encontrado' });
    return reply.status(204).send();
  }

  async listarMovimentacoes(request: FastifyRequest<{ Querystring: { investimento_id?: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { investimento_id } = request.query;
    const movimentacoes = await investimentosService.listarMovimentacoes(userId, investimento_id);
    return reply.send(movimentacoes);
  }

  async registrarMovimentacao(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const data = criarMovimentacaoSchema.parse(request.body);
    const mov = await investimentosService.registrarMovimentacao(userId, data);
    return reply.status(201).send(mov);
  }

  async removerMovimentacao(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const ok = await investimentosService.removerMovimentacao(request.params.id, userId);
    if (!ok) return reply.status(404).send({ error: 'Movimentação não encontrada' });
    return reply.status(204).send();
  }
}

export const investimentosController = new InvestimentosController();
