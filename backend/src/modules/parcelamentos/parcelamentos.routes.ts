import { FastifyInstance } from 'fastify';
import { parcelamentosController } from './parcelamentos.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function parcelamentosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', parcelamentosController.list);
  app.get('/:id', parcelamentosController.getById);
  app.post('/', parcelamentosController.create);
  app.delete('/:id', parcelamentosController.delete);
}
