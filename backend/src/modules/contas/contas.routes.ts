import { FastifyInstance } from 'fastify';
import { contasController } from './contas.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function contasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', contasController.list);
  app.get('/saldo-consolidado', contasController.getSaldoConsolidado);
  app.get('/:id', contasController.getById);
  app.post('/', contasController.create);
  app.put('/:id', contasController.update);
  app.delete('/:id', contasController.delete);
}
