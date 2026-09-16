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
    return reply.send({ message: 'Sincronização PTAX executada com sucesso' });
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
