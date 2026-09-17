import { FastifyInstance } from 'fastify';
import { dividasController } from './dividas.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function dividasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', (req: any, rep) => dividasController.listar(req, rep));
  app.get('/resumo', (req, rep) => dividasController.obterResumo(req, rep));
  app.post('/emprestimo', (req, rep) => dividasController.criarEmprestimo(req, rep));
  app.put('/:id', (req: any, rep) => dividasController.atualizar(req, rep));
  app.delete('/:id', (req: any, rep) => dividasController.excluir(req, rep));
  app.post('/:id/baixa', (req: any, rep) => dividasController.darBaixa(req, rep));
  app.post('/:id/perdoar', (req: any, rep) => dividasController.perdoar(req, rep));
}
