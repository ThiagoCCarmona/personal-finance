import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
  app.get('/status', authController.status);
  app.post('/setup', authController.setup);
  app.post('/login', authController.login);
  app.post('/logout', authController.logout);

  // Rotas autenticadas
  app.get('/me', { preHandler: [authMiddleware] }, authController.me);
  app.post('/register', { preHandler: [authMiddleware] }, authController.register);
  app.post('/trocar-senha-primeiro-acesso', { preHandler: [authMiddleware] }, authController.trocarSenhaPrimeiroAcesso);
  app.patch('/perfil', { preHandler: [authMiddleware] }, authController.atualizarPerfil);
}
