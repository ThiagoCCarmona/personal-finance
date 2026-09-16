import { FastifyInstance } from 'fastify';
import { cartoesController } from './cartoes.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function cartoesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', cartoesController.list);
  app.get('/:id', cartoesController.getById);
  app.get('/:id/fatura', cartoesController.getFatura);
  app.post('/', cartoesController.create);
  app.put('/:id', cartoesController.update);
  app.delete('/:id', cartoesController.delete);
}
