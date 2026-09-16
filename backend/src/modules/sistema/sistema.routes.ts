import { FastifyInstance } from 'fastify';
import { sistemaController } from './sistema.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function sistemaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/stats', (req, rep) => sistemaController.obterMetricas(req, rep));
  app.get('/backup', (req, rep) => sistemaController.baixarBackup(req, rep));
}
