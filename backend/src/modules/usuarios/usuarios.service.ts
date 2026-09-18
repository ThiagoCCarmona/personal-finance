import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../../config/database.js';
import { seedUserDefaultCategories } from '../../db/seeds/user_categories_seed.js';
import { CriarUsuarioInput, AtualizarUsuarioInput } from './usuarios.schemas.js';

export class UsuariosService {
  async listar() {
    const { rows } = await query(`
      SELECT 
        u.id, 
        u.login, 
        u.nome, 
        u.role, 
        COALESCE(u.ativo, TRUE) as ativo,
        COALESCE(u.precisa_trocar_senha, FALSE) as precisa_trocar_senha,
        u.criado_em,
        u.atualizado_em,
        (SELECT MAX(s.ultimo_acesso) FROM sessao s WHERE s.usuario_id = u.id) as ultimo_acesso,
        (SELECT COUNT(*) FROM lancamento l WHERE l.usuario_id = u.id) as total_lancamentos,
        (SELECT COUNT(*) FROM conta c WHERE c.usuario_id = u.id) as total_contas
      FROM usuario u
      ORDER BY u.criado_em ASC
    `);
    return rows;
  }

  async buscarPorId(id: string) {
    const { rows } = await query(`
      SELECT id, login, nome, role, COALESCE(ativo, TRUE) as ativo, COALESCE(precisa_trocar_senha, FALSE) as precisa_trocar_senha, criado_em
      FROM usuario
      WHERE id = $1
    `, [id]);
    return rows[0] || null;
  }

  async criar(dados: CriarUsuarioInput) {
    const loginClean = dados.login.trim();
    const nomeClean = dados.nome.trim();

    const { rows: exist } = await query(
      `SELECT id FROM usuario WHERE LOWER(login) = LOWER($1)`,
      [loginClean]
    );
    if (exist.length > 0) {
      throw new Error(`Já existe um usuário com o login "${loginClean}".`);
    }

    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash(dados.senha, salt);

    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO usuario (login, nome, senha_hash, role, precisa_trocar_senha, ativo)
         VALUES ($1, $2, $3, $4, TRUE, TRUE)
         RETURNING id, login, nome, role, precisa_trocar_senha, ativo, criado_em`,
        [loginClean, nomeClean, senhaHash, dados.role || 'user']
      );

      const novoUsuario = rows[0];

      // Popula categorias padrão para o usuário novo
      await seedUserDefaultCategories(novoUsuario.id, client);

      return novoUsuario;
    });
  }

  async atualizar(id: string, dados: AtualizarUsuarioInput, operadorId: string) {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    // Se o operador estiver desativando a própria conta ou rebaixando o próprio perfil
    if (id === operadorId) {
      if (dados.ativo === false) {
        throw new Error('Você não pode desativar seu próprio usuário.');
      }
      if (dados.role !== 'admin') {
        throw new Error('Você não pode remover seu próprio papel de administrador.');
      }
    }

    const { rows } = await query(
      `UPDATE usuario
       SET nome = $1, role = $2, ativo = $3, atualizado_em = NOW()
       WHERE id = $4
       RETURNING id, login, nome, role, ativo, precisa_trocar_senha, atualizado_em`,
      [dados.nome.trim(), dados.role, dados.ativo, id]
    );

    return rows[0];
  }

  async resetarSenha(id: string, novaSenhaTemp: string) {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash(novaSenhaTemp, salt);

    await query(
      `UPDATE usuario
       SET senha_hash = $1, precisa_trocar_senha = TRUE, atualizado_em = NOW()
       WHERE id = $2`,
      [senhaHash, id]
    );

    // Encerra sessões ativas do usuário para forçá-lo a logar com a nova senha
    await query(`DELETE FROM sessao WHERE usuario_id = $1`, [id]);

    return { success: true, message: 'Senha resetada com sucesso. O usuário precisará definir uma nova senha no próximo acesso.' };
  }

  async excluir(id: string, operadorId: string) {
    if (id === operadorId) {
      throw new Error('Você não pode excluir sua própria conta de administrador.');
    }

    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    // Exclusão física com CASCADE garantido pela migração 0011
    await query(`DELETE FROM usuario WHERE id = $1`, [id]);
    return { success: true, message: `Usuário ${usuario.login} excluído com sucesso.` };
  }
}

export const usuariosService = new UsuariosService();
