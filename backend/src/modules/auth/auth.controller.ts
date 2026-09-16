import { FastifyReply, FastifyRequest } from 'fastify';
import { authService } from './auth.service.js';
import { loginSchema, setupSchema } from './auth.schemas.js';

export class AuthController {
  async status(req: FastifyRequest, reply: FastifyReply) {
    const status = await authService.getStatus();
    const token = req.cookies.sessionId;
    let authenticated = false;
    let user = null;

    if (token) {
      user = await authService.validateSession(token);
      authenticated = !!user;
    }

    return reply.send({
      ...status,
      authenticated,
      user: user ? { id: user.id, login: user.login } : null,
    });
  }

  async setup(req: FastifyRequest, reply: FastifyReply) {
    const body = setupSchema.parse(req.body);
    const result = await authService.setup(body);

    reply.setCookie('sessionId', result.sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // Não define maxAge longo permanente para expirar com o navegador se não houver rolling
    });

    return reply.status(201).send({
      message: 'Setup concluído com sucesso!',
      user: result.user,
    });
  }

  async login(req: FastifyRequest, reply: FastifyReply) {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);

    reply.setCookie('sessionId', result.sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return reply.send({
      message: 'Login realizado com sucesso!',
      user: result.user,
    });
  }

  async logout(req: FastifyRequest, reply: FastifyReply) {
    const token = req.cookies.sessionId;
    if (token) {
      await authService.destroySession(token);
    }

    reply.clearCookie('sessionId', { path: '/' });
    return reply.send({ message: 'Sessão encerrada com sucesso.' });
  }

  async me(req: FastifyRequest, reply: FastifyReply) {
    // req.user é preenchido pelo middleware de autenticação
    const user = (req as any).user;
    return reply.send({ user });
  }
}

export const authController = new AuthController();
