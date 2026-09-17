import { FastifyRequest, FastifyReply } from 'fastify';
import { relatoriosService } from './relatorios.service.js';

export class RelatoriosController {
  async exportarLancamentosCsv(request: FastifyRequest<{ Querystring: { data_inicio?: string; data_fim?: string; conta_id?: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { data_inicio, data_fim, conta_id } = request.query;
    const csv = await relatoriosService.exportarLancamentosCsv(userId, data_inicio, data_fim, conta_id);

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="lancamentos_${Date.now()}.csv"`)
      .send(csv);
  }

  async obterDashboard(request: FastifyRequest<{ Querystring: { data_inicio?: string; data_fim?: string; conta_id?: string } }>, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const { data_inicio, data_fim, conta_id } = request.query;
    const dashboard = await relatoriosService.obterDashboard(userId, data_inicio, data_fim, conta_id);
    return reply.send(dashboard);
  }

  async exportarPatrimonioCsv(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).user.id;
    const csv = await relatoriosService.exportarPatrimonioCsv(userId);

    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="patrimonio_${Date.now()}.csv"`)
      .send(csv);
  }
}

export const relatoriosController = new RelatoriosController();
