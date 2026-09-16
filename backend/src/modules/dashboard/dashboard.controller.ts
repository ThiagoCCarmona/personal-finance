import { FastifyReply, FastifyRequest } from 'fastify';
import { dashboardService } from './dashboard.service.js';

export class DashboardController {
  async resumo(req: FastifyRequest<{ Querystring: { anoMes?: string } }>, reply: FastifyReply) {
    const data = await dashboardService.getResumoMes(req.query.anoMes);
    return reply.send(data);
  }

  async porCategoria(req: FastifyRequest<{ Querystring: { anoMes?: string } }>, reply: FastifyReply) {
    const data = await dashboardService.getGastosPorCategoria(req.query.anoMes);
    return reply.send(data);
  }

  async evolucao(req: FastifyRequest<{ Querystring: { meses?: string } }>, reply: FastifyReply) {
    const meses = req.query.meses ? parseInt(req.query.meses, 10) : 6;
    const data = await dashboardService.getEvolucaoMensal(meses);
    return reply.send(data);
  }

  async contasAPagar(req: FastifyRequest<{ Querystring: { anoMes?: string } }>, reply: FastifyReply) {
    const data = await dashboardService.getContasAPagarDoMes(req.query.anoMes);
    return reply.send(data);
  }
}

export const dashboardController = new DashboardController();
