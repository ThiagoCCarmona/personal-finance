import { FastifyInstance } from 'fastify';
import { InvestimentosController } from './investimentos.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const controller = new InvestimentosController();

export async function investimentosRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', controller.listar.bind(controller));
  app.get('/resumo', controller.resumo.bind(controller));
  app.post('/', controller.criar.bind(controller));
  app.put('/:id', controller.atualizar.bind(controller));
  app.delete('/:id', controller.remover.bind(controller));

  // Movimentações
  app.get('/movimentacoes', controller.listarMovimentacoes.bind(controller));
  app.post('/movimentacoes', controller.registrarMovimentacao.bind(controller));
  app.delete('/movimentacoes/:id', controller.removerMovimentacao.bind(controller));
}
