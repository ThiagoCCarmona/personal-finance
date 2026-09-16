import { FastifyInstance } from 'fastify';
import { recorrenciasController } from './recorrencias.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function recorrenciasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', recorrenciasController.list);
  app.get('/:id', recorrenciasController.getById);
  app.post('/', recorrenciasController.create);
  app.put('/:id', recorrenciasController.update);
  app.delete('/:id', recorrenciasController.delete);
  app.post('/:id/lancar', recorrenciasController.lancar);
}
