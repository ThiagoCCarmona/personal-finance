import { FastifyInstance } from 'fastify';
import { pixController } from './pix.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function pixRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/chaves', (req, rep) => pixController.listarChaves(req, rep));
  app.post('/chaves', (req, rep) => pixController.criarChave(req, rep));
  app.delete('/chaves/:id', (req: any, rep) => pixController.excluirChave(req, rep));

  app.get('/cobrancas', (req, rep) => pixController.listarCobrancas(req, rep));
  app.post('/cobrancas', (req, rep) => pixController.criarCobranca(req, rep));
  app.post('/cobrancas/:id/confirmar', (req: any, rep) => pixController.confirmarRecebimento(req, rep));
}
