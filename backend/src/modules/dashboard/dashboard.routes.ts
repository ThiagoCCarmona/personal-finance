import { FastifyInstance } from 'fastify';
import { dashboardController } from './dashboard.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function dashboardRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/resumo', dashboardController.resumo);
  app.get('/por-categoria', dashboardController.porCategoria);
  app.get('/evolucao', dashboardController.evolucao);
  app.get('/contas-a-pagar', dashboardController.contasAPagar);
}
