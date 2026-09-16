import { FastifyInstance } from 'fastify';
import { despesasCompartilhadasController } from './despesas_compartilhadas.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function despesasCompartilhadasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', (req, rep) => despesasCompartilhadasController.listar(req, rep));
  app.post('/', (req, rep) => despesasCompartilhadasController.criar(req, rep));
}
