import { FastifyRequest, FastifyReply } from 'fastify';
import { sistemaService } from './sistema.service.js';

export class SistemaController {
  async obterMetricas(request: FastifyRequest, reply: FastifyReply) {
    const metricas = await sistemaService.obterMetricas();
    return reply.send({ data: metricas });
  }

  async baixarBackup(request: FastifyRequest, reply: FastifyReply) {
    const sql = await sistemaService.exportarDumpSql();
    return reply
      .header('Content-Type', 'application/sql; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="backup_financeiro_${Date.now()}.sql"`)
      .send(sql);
  }
}

export const sistemaController = new SistemaController();
