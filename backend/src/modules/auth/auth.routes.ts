import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
  app.get('/status', authController.status);
  app.post('/setup', authController.setup);
  app.post('/login', authController.login);
  app.post('/logout', authController.logout);

  // Rota autenticada para validar dados do usuário atual
  app.get('/me', { preHandler: [authMiddleware] }, authController.me);
}
