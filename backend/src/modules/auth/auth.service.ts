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
      allowRegistration: true,
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
        `INSERT INTO usuario (login, nome, senha_hash, role, inactivity_timeout_minutes)
         VALUES ($1, $2, $3, 'admin', $4)
         RETURNING id, login, nome, role, inactivity_timeout_minutes`,
        [input.login.trim(), input.nome?.trim() || 'Administrador', senhaHash, input.inactivityTimeoutMinutes || 720]
      );

      const user = rows[0];

      // Executa o seed inicial automático no setup
      try {
        await runInitialSeed();
      } catch (err) {
        console.error('Aviso: falha ao rodar seed automático:', err);
      }

      // Cria a primeira sessão para login imediato
      const sessionToken = await this.createSession(user.id, user.inactivity_timeout_minutes);

      return {
        user: { id: user.id, login: user.login, nome: user.nome, role: user.role },
        sessionToken,
      };
    });
  }

  async register(input: RegisterInput) {
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
      // Verifica se é o primeiro usuário do sistema (caso seja, ganha role admin)
      const { rows: countRows } = await client.query('SELECT COUNT(*) as count FROM usuario');
      const isFirst = parseInt(countRows[0].count, 10) === 0;
      const role = isFirst ? 'admin' : 'user';

      const { rows } = await client.query(
        `INSERT INTO usuario (login, nome, senha_hash, role, inactivity_timeout_minutes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, login, nome, role, inactivity_timeout_minutes`,
        [loginClean, input.nome?.trim() || loginClean, senhaHash, role, input.inactivityTimeoutMinutes || 720]
      );

      const user = rows[0];

      // Gera automaticamente a árvore padrão de categorias exclusiva deste novo usuário
      await seedUserDefaultCategories(user.id, client);

      // Cria sessão para autenticação imediata
      const sessionToken = await this.createSession(user.id, user.inactivity_timeout_minutes);

      return {
        user: { id: user.id, login: user.login, nome: user.nome, role: user.role },
        sessionToken,
      };
    });
  }

  async login(input: LoginInput) {
    const { rows } = await query(
      'SELECT id, login, nome, role, senha_hash, inactivity_timeout_minutes FROM usuario WHERE LOWER(login) = LOWER($1)',
      [input.login.trim()]
    );

    if (rows.length === 0) {
      throw new Error('Credenciais inválidas.');
    }

    const user = rows[0];
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
      },
      sessionToken,
    };
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
      `SELECT s.id as sessao_id, s.expira_em, s.ultimo_acesso, u.id as usuario_id, u.login, u.nome, u.role, u.inactivity_timeout_minutes
       FROM sessao s
       JOIN usuario u ON u.id = s.usuario_id
       WHERE s.token_hash = $1`,
      [tokenHash]
    );

    if (rows.length === 0) return null;

    const sessao = rows[0];
    const agora = new Date();

    // Verifica se expirou por inatividade
    if (new Date(sessao.expira_em) < agora) {
      await this.destroySession(rawToken);
      return null;
    }

    // Atualiza o tempo de inatividade (rolling timeout)
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
