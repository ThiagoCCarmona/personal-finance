import { FastifyRequest, FastifyReply } from 'fastify';
import { CambioService } from './cambio.service.js';
import {
  historicoQuerySchema,
  registrarCotacaoManualSchema,
  calcularGanhoCambialSchema,
} from './cambio.schemas.js';

const service = new CambioService();

export class CambioController {
  async getUltima(request: FastifyRequest<{ Params: { moeda: string } }>, reply: FastifyReply) {
    const cotacao = await service.getUltimaCotacao(request.params.moeda);
    if (!cotacao) {
      return reply.status(404).send({ error: 'Nenhuma cotação encontrada para esta moeda' });
    }
    return reply.send(cotacao);
  }

  async getHistorico(request: FastifyRequest<{ Querystring: { moeda?: string; dias?: string } }>, reply: FastifyReply) {
    const query = historicoQuerySchema.parse(request.query);
    const resultado = await service.getHistoricoComIndicadores(query.moeda, query.dias);
    return reply.send(resultado);
  }

  async sincronizar(request: FastifyRequest, reply: FastifyReply) {
    await service.sincronizar();
    return reply.send({ message: 'Sincronização de Câmbio executada com sucesso' });
  }

  async listarMoedas(request: FastifyRequest, reply: FastifyReply) {
    const moedas = await service.listarMoedasComCotacao();
    return reply.send(moedas);
  }

  async toggleFavorita(request: FastifyRequest<{ Params: { codigo: string } }>, reply: FastifyReply) {
    const res = await service.toggleFavorita(request.params.codigo);
    if (!res) {
      return reply.status(404).send({ error: 'Moeda não encontrada' });
    }
    return reply.send(res);
  }

  async converter(request: FastifyRequest<{ Querystring: { de?: string; para?: string; valor?: string } }>, reply: FastifyReply) {
    const de = request.query.de || 'USD';
    const para = request.query.para || 'BRL';
    const valor = parseFloat(request.query.valor || '1');
    const resultado = await service.converterMoeda(de, para, valor);
    return reply.send(resultado);
  }

  async calcularGanho(request: FastifyRequest, reply: FastifyReply) {
    const data = calcularGanhoCambialSchema.parse(request.body);
    const res = await service.calcularGanhoCambial(data);
    return reply.send(res);
  }

  async registrarManual(request: FastifyRequest, reply: FastifyReply) {
    const data = registrarCotacaoManualSchema.parse(request.body);
    const item = await service.registrarCotacaoManual(data);
    return reply.status(201).send(item);
  }
}
