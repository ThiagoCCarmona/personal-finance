import { FastifyInstance } from 'fastify';
import { SimuladoresController } from './simuladores.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const controller = new SimuladoresController();

export async function simuladoresRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.post('/investimentos', controller.simular.bind(controller));
  app.get('/cenarios-padrao', controller.getCenariosPadrao.bind(controller));
  app.post('/gastos', controller.simularGastos.bind(controller));
}
