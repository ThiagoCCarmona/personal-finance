import { FastifyReply, FastifyRequest } from 'fastify';
import { usuariosService } from './usuarios.service.js';
import { 
  criarUsuarioSchema, 
  atualizarUsuarioSchema, 
  resetarSenhaUsuarioSchema 
} from './usuarios.schemas.js';

export class UsuariosController {
  private checkAdmin(req: FastifyRequest) {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      const err: any = new Error('Acesso negado. Apenas administradores podem gerenciar usuários.');
      err.statusCode = 403;
      throw err;
    }
    return user;
  }

  async listar(req: FastifyRequest, reply: FastifyReply) {
    this.checkAdmin(req);
    const usuarios = await usuariosService.listar();
    return reply.send(usuarios);
  }

  async criar(req: FastifyRequest, reply: FastifyReply) {
    this.checkAdmin(req);
    const body = criarUsuarioSchema.parse(req.body);
    const senhaFinal = (body.senha || body.senha_inicial)!;
    const roleFinal = body.role === 'admin' ? 'admin' : 'user';
    const novoUsuario = await usuariosService.criar({ 
      login: body.login, 
      nome: body.nome || body.login, 
      senha: senhaFinal, 
      role: roleFinal as any 
    });
    return reply.status(201).send(novoUsuario);
  }

  async atualizar(req: FastifyRequest, reply: FastifyReply) {
    const admin = this.checkAdmin(req);
    const { id } = req.params as { id: string };
    const body = atualizarUsuarioSchema.parse(req.body);
    const roleFinal = body.role ? (body.role === 'admin' ? 'admin' : 'user') : undefined;
    const atualizado = await usuariosService.atualizar(id, { 
      nome: body.nome ?? undefined, 
      role: roleFinal as any, 
      ativo: body.ativo 
    }, admin.id);
    return reply.send(atualizado);
  }

  async resetarSenha(req: FastifyRequest, reply: FastifyReply) {
    this.checkAdmin(req);
    const { id } = req.params as { id: string };
    const body = resetarSenhaUsuarioSchema.parse(req.body);
    const senhaFinal = (body.novaSenha || body.nova_senha_temporaria)!;
    const res = await usuariosService.resetarSenha(id, senhaFinal);
    return reply.send(res);
  }

  async excluir(req: FastifyRequest, reply: FastifyReply) {
    const admin = this.checkAdmin(req);
    const { id } = req.params as { id: string };
    const res = await usuariosService.excluir(id, admin.id);
    return reply.send(res);
  }
}

export const usuariosController = new UsuariosController();
