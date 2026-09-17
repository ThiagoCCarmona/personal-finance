import { FastifyRequest, FastifyReply } from 'fastify';
import { sistemaService } from './sistema.service.js';

export class SistemaController {
  async obterMetricas(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    const metricas = await sistemaService.obterMetricas(user.id, user.role === 'admin');
    return reply.send({ data: metricas });
  }

  async baixarBackup(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    if (user.role !== 'admin') {
      return reply.status(403).send({ error: 'Acesso negado. Apenas o administrador tem permissão para descarregar o backup global do sistema.' });
    }

    const sql = await sistemaService.exportarDumpSql();
    return reply
      .header('Content-Type', 'application/sql; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="backup_financeiro_global_${Date.now()}.sql"`)
      .send(sql);
  }
}

export const sistemaController = new SistemaController();
