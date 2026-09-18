import { FastifyReply, FastifyRequest } from 'fastify';
import { authService } from './auth.service.js';
import { 
  loginSchema, 
  registerSchema, 
  setupSchema,
  trocarSenhaPrimeiroAcessoSchema,
  atualizarPerfilSchema
} from './auth.schemas.js';

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
      user: user
        ? {
            id: user.id,
            login: user.login,
            nome: user.nome,
            role: user.role,
            precisa_trocar_senha: user.precisa_trocar_senha,
          }
        : null,
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
    });

    return reply.status(201).send({
      message: 'Setup concluído com sucesso!',
      user: result.user,
    });
  }

  async register(req: FastifyRequest, reply: FastifyReply) {
    const operador = (req as any).user;
    if (!operador || operador.role !== 'admin') {
      return reply.status(403).send({
        error: 'Apenas administradores podem cadastrar novos usuários.',
      });
    }

    const body = registerSchema.parse(req.body);
    const result = await authService.register(body, operador.role);

    return reply.status(201).send({
      message: 'Usuário cadastrado com sucesso!',
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

  async trocarSenhaPrimeiroAcesso(req: FastifyRequest, reply: FastifyReply) {
    const usuario = (req as any).user;
    if (!usuario) {
      return reply.status(401).send({ error: 'Não autenticado' });
    }

    const body = trocarSenhaPrimeiroAcessoSchema.parse(req.body);
    const senhaFinal = (body.novaSenha || body.nova_senha)!;
    const result = await authService.trocarSenhaPrimeiroAcesso(usuario.id, senhaFinal);

    return reply.send({
      message: 'Senha atualizada com sucesso!',
      user: result.user,
    });
  }

  async atualizarPerfil(req: FastifyRequest, reply: FastifyReply) {
    const usuario = (req as any).user;
    if (!usuario) {
      return reply.status(401).send({ error: 'Não autenticado' });
    }

    const body = atualizarPerfilSchema.parse(req.body);
    const userAtualizado = await authService.atualizarPerfil(usuario.id, body.nome);

    return reply.send({
      message: 'Perfil atualizado com sucesso!',
      user: userAtualizado,
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
    const user = (req as any).user;
    return reply.send({ user });
  }
}

export const authController = new AuthController();
