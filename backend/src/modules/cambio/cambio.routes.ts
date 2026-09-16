import { FastifyInstance } from 'fastify';
import { CambioController } from './cambio.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const controller = new CambioController();

export async function cambioRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get('/ultima/:moeda', controller.getUltima.bind(controller));
  app.get('/historico', controller.getHistorico.bind(controller));
  app.post('/sincronizar', controller.sincronizar.bind(controller));
  app.post('/calcular-ganho', controller.calcularGanho.bind(controller));
  app.post('/cotacao-manual', controller.registrarManual.bind(controller));
}
