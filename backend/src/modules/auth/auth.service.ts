import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../../config/database.js';
import { runInitialSeed } from '../../db/seeds/initial_seed.js';
import { seedUserDefaultCategories } from '../../db/seeds/user_categories_seed.js';
import { SetupInput, LoginInput, RegisterInput } from './auth.schemas.js';

export class AuthService {
  async getStatus() {
    const { rows } = await query('SELECT COUNT(*) as count FROM usuario');
    const hasUser = parseInt(rows[0].count, 10) > 0;
    return {
      setupRequired: !hasUser,
      allowRegistration: false, // Apenas o admin cria cadastros!
    };
  }

  async setup(input: SetupInput) {
    const { setupRequired } = await this.getStatus();
    if (!setupRequired) {
      throw new Error('O sistema já foi configurado com um usuário principal.');
    }

    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash(input.senha, salt);

    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO usuario (login, nome, senha_hash, role, inactivity_timeout_minutes, precisa_trocar_senha, ativo)
         VALUES ($1, $2, $3, 'admin', $4, FALSE, TRUE)
         RETURNING id, login, nome, role, inactivity_timeout_minutes, precisa_trocar_senha`,
        [input.login.trim(), input.nome?.trim() || 'Administrador', senhaHash, input.inactivityTimeoutMinutes || 720]
      );

      const user = rows[0];

      // Executa o seed inicial automático no setup
      try {
        await runInitialSeed();
      } catch (err) {
        console.error('Aviso: falha ao rodar seed automático:', err);
      }

      const sessionToken = await this.createSession(user.id, user.inactivity_timeout_minutes);

      return {
        user: { 
          id: user.id, 
          login: user.login, 
          nome: user.nome, 
          role: user.role,
          precisa_trocar_senha: false
        },
        sessionToken,
      };
    });
  }

  async register(input: RegisterInput, operadorRole?: string) {
    // Apenas o Administrador pode criar usuários!
    if (operadorRole !== 'admin') {
      throw new Error('Apenas o Administrador pode cadastrar novos usuários no sistema.');
    }

    const loginClean = input.login.trim();

    const { rows: existing } = await query(
      'SELECT id FROM usuario WHERE LOWER(login) = LOWER($1)',
      [loginClean]
    );

    if (existing.length > 0) {
      throw new Error('Já existe um usuário cadastrado com este login.');
    }

    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash(input.senha, salt);

    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO usuario (login, nome, senha_hash, role, inactivity_timeout_minutes, precisa_trocar_senha, ativo)
         VALUES ($1, $2, $3, 'user', $4, TRUE, TRUE)
         RETURNING id, login, nome, role, inactivity_timeout_minutes, precisa_trocar_senha`,
        [loginClean, input.nome?.trim() || loginClean, senhaHash, input.inactivityTimeoutMinutes || 720]
      );

      const user = rows[0];

      // Gera automaticamente a árvore padrão de categorias exclusiva deste novo usuário
      await seedUserDefaultCategories(user.id, client);

      return {
        user: { 
          id: user.id, 
          login: user.login, 
          nome: user.nome, 
          role: user.role,
          precisa_trocar_senha: true
        }
      };
    });
  }

  async login(input: LoginInput) {
    const { rows } = await query(
      `SELECT id, login, nome, role, senha_hash, inactivity_timeout_minutes, 
              COALESCE(precisa_trocar_senha, FALSE) as precisa_trocar_senha,
              COALESCE(ativo, TRUE) as ativo 
       FROM usuario 
       WHERE LOWER(login) = LOWER($1)`,
      [input.login.trim()]
    );

    if (rows.length === 0) {
      throw new Error('Credenciais inválidas.');
    }

    const user = rows[0];

    if (!user.ativo) {
      throw new Error('Este usuário está inativo. Entre em contato com o administrador.');
    }

    const passwordMatch = await bcrypt.compare(input.senha, user.senha_hash);
    if (!passwordMatch) {
      throw new Error('Credenciais inválidas.');
    }

    const sessionToken = await this.createSession(user.id, user.inactivity_timeout_minutes);

    return {
      user: {
        id: user.id,
        login: user.login,
        nome: user.nome,
        role: user.role,
        precisa_trocar_senha: Boolean(user.precisa_trocar_senha),
      },
      sessionToken,
    };
  }

  async trocarSenhaPrimeiroAcesso(usuarioId: string, novaSenha: string) {
    const salt = await bcrypt.genSalt(12);
    const senhaHash = await bcrypt.hash(novaSenha, salt);

    await query(
      `UPDATE usuario 
       SET senha_hash = $1, precisa_trocar_senha = FALSE 
       WHERE id = $2`,
      [senhaHash, usuarioId]
    );

    const { rows } = await query(
      `SELECT id, login, nome, role FROM usuario WHERE id = $1`,
      [usuarioId]
    );

    return {
      success: true,
      user: {
        ...rows[0],
        precisa_trocar_senha: false,
      }
    };
  }

  async atualizarPerfil(usuarioId: string, nome: string) {
    const nomeClean = nome.trim();
    if (!nomeClean || nomeClean.length < 2) {
      throw new Error('Informe um nome válido com pelo menos 2 caracteres.');
    }

    const { rows } = await query(
      `UPDATE usuario 
       SET nome = $1 
       WHERE id = $2 
       RETURNING id, login, nome, role, precisa_trocar_senha`,
      [nomeClean, usuarioId]
    );

    return rows[0];
  }

  async createSession(usuarioId: string, timeoutMinutes: number): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiraEm = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    await query(
      `INSERT INTO sessao (usuario_id, token_hash, expira_em, ultimo_acesso)
       VALUES ($1, $2, $3, NOW())`,
      [usuarioId, tokenHash, expiraEm]
    );

    return rawToken;
  }

  async validateSession(rawToken: string) {
    if (!rawToken) return null;

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const { rows } = await query(
      `SELECT s.id as sessao_id, s.expira_em, s.ultimo_acesso, 
              u.id as usuario_id, u.login, u.nome, u.role, u.inactivity_timeout_minutes,
              COALESCE(u.precisa_trocar_senha, FALSE) as precisa_trocar_senha,
              COALESCE(u.ativo, TRUE) as ativo
       FROM sessao s
       JOIN usuario u ON u.id = s.usuario_id
       WHERE s.token_hash = $1`,
      [tokenHash]
    );

    if (rows.length === 0) return null;

    const sessao = rows[0];
    if (!sessao.ativo) return null;

    const agora = new Date();

    if (new Date(sessao.expira_em) < agora) {
      await this.destroySession(rawToken);
      return null;
    }

    const novoExpiraEm = new Date(agora.getTime() + sessao.inactivity_timeout_minutes * 60 * 1000);
    await query(
      'UPDATE sessao SET ultimo_acesso = NOW(), expira_em = $1 WHERE id = $2',
      [novoExpiraEm, sessao.sessao_id]
    );

    return {
      id: sessao.usuario_id,
      login: sessao.login,
      nome: sessao.nome,
      role: sessao.role,
      precisa_trocar_senha: Boolean(sessao.precisa_trocar_senha),
      inactivityTimeoutMinutes: sessao.inactivity_timeout_minutes,
    };
  }

  async destroySession(rawToken: string) {
    if (!rawToken) return;
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await query('DELETE FROM sessao WHERE token_hash = $1', [tokenHash]);
  }
}

export const authService = new AuthService();
