import { FastifyInstance } from 'fastify';
import { instituicoesController } from './instituicoes.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function instituicoesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', instituicoesController.list);
  app.get('/:id', instituicoesController.getById);
  app.post('/', instituicoesController.create);
  app.put('/:id', instituicoesController.update);
  app.delete('/:id', instituicoesController.delete);
}
