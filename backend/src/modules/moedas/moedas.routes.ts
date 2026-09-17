import { FastifyInstance } from 'fastify';
import { moedasService } from './moedas.service.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export async function moedasRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/', async (_request, reply) => {
    const moedas = await moedasService.listar();
    return reply.send(moedas);
  });
}
