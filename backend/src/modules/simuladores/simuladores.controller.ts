import { FastifyRequest, FastifyReply } from 'fastify';
import { SimuladoresService } from './simuladores.service.js';
import { simulacaoInvestimentoSchema } from './simuladores.schemas.js';

const service = new SimuladoresService();

export class SimuladoresController {
  async simular(request: FastifyRequest, reply: FastifyReply) {
    const data = simulacaoInvestimentoSchema.parse(request.body);
    const resultado = service.simularInvestimentos(data);
    return reply.send(resultado);
  }

  async getCenariosPadrao(request: FastifyRequest, reply: FastifyReply) {
    const cenarios = service.getCenariosPadrao();
    return reply.send(cenarios);
  }

  async simularGastos(request: FastifyRequest, reply: FastifyReply) {
    const { SimularGastoSchema } = await import('./simulador_gastos.schema.js');
    const { simuladorGastosService } = await import('./simulador_gastos.service.js');
    const dados = SimularGastoSchema.parse(request.body);
    const resultado = await simuladorGastosService.simular(dados);
    return reply.send({ data: resultado });
  }
}
