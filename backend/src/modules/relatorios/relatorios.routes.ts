import { FastifyInstance } from 'fastify';
import { relatoriosController } from './relatorios.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function relatoriosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/dashboard', (req: any, rep) => relatoriosController.obterDashboard(req, rep));
  app.get('/lancamentos/csv', (req: any, rep) => relatoriosController.exportarLancamentosCsv(req, rep));
  app.get('/patrimonio/csv', (req, rep) => relatoriosController.exportarPatrimonioCsv(req, rep));
}
