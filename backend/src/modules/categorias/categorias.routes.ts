import { FastifyInstance } from 'fastify';
import { categoriasController } from './categorias.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function categoriasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', categoriasController.list);
  app.get('/:id', categoriasController.getById);
  app.post('/', categoriasController.create);
  app.put('/:id', categoriasController.update);
  app.delete('/:id', categoriasController.delete);
}
