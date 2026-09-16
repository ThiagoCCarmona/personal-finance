import { FastifyReply, FastifyRequest } from 'fastify';
import { authService } from '../modules/auth/auth.service.js';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const token = req.cookies.sessionId;

  if (!token) {
    return reply.status(401).send({ error: 'Não autorizado. Faça login para continuar.' });
  }

  const user = await authService.validateSession(token);
  if (!user) {
    reply.clearCookie('sessionId', { path: '/' });
    return reply.status(401).send({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
  }

  (req as any).user = user;
}
