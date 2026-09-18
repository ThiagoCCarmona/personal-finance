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

  // Pagamento e Estorno de Fatura
  app.post('/:id/faturas/:anoMes/pagar', cartoesController.pagarFatura);
  app.post('/:id/fatura/pagar', cartoesController.pagarFatura);
  app.delete('/:id/faturas/:anoMes/pagar', cartoesController.estornarPagamentoFatura);
  app.delete('/:id/fatura/pagar', cartoesController.estornarPagamentoFatura);
}
