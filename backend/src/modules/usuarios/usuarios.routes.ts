import { FastifyInstance } from 'fastify';
import { usuariosController } from './usuarios.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function usuariosRoutes(app: FastifyInstance) {
  // Todas as rotas de usuários são autenticadas e restritas ao admin
  app.addHook('preHandler', authMiddleware);

  app.get('/', usuariosController.listar.bind(usuariosController));
  app.post('/', usuariosController.criar.bind(usuariosController));
  app.put('/:id', usuariosController.atualizar.bind(usuariosController));
  app.post('/:id/reset-senha', usuariosController.resetarSenha.bind(usuariosController));
  app.delete('/:id', usuariosController.excluir.bind(usuariosController));
}
