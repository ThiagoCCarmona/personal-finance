import { FastifyInstance } from 'fastify';
import { pessoasController } from './pessoas.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function pessoasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', (req, rep) => pessoasController.listar(req, rep));
  app.post('/', (req, rep) => pessoasController.criar(req, rep));
  app.put('/:id', (req: any, rep) => pessoasController.atualizar(req, rep));
  app.delete('/:id', (req: any, rep) => pessoasController.excluir(req, rep));
}
