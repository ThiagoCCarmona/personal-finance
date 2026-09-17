import { FastifyInstance } from 'fastify';
import { listaDesejoController } from './lista_desejo.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function listaDesejoRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', listaDesejoController.listar.bind(listaDesejoController));
  app.get('/:id', listaDesejoController.getById.bind(listaDesejoController));
  app.post('/', listaDesejoController.criar.bind(listaDesejoController));
  app.put('/:id', listaDesejoController.atualizar.bind(listaDesejoController));
  app.delete('/:id', listaDesejoController.excluir.bind(listaDesejoController));
  app.post('/:id/comprar', listaDesejoController.comprar.bind(listaDesejoController));
  app.post('/:id/precos', listaDesejoController.adicionarPreco.bind(listaDesejoController));
}
