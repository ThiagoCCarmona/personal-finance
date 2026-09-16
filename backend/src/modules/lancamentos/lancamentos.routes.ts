import { FastifyInstance } from 'fastify';
import { lancamentosController } from './lancamentos.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function lancamentosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', lancamentosController.list);
  app.get('/:id', lancamentosController.getById);
  app.post('/', lancamentosController.create);
  app.put('/:id', lancamentosController.update);
  app.delete('/:id', lancamentosController.delete);
}
