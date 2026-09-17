import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { instituicoesRoutes } from './modules/instituicoes/instituicoes.routes.js';
import { contasRoutes } from './modules/contas/contas.routes.js';
import { categoriasRoutes } from './modules/categorias/categorias.routes.js';
import { lancamentosRoutes } from './modules/lancamentos/lancamentos.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { cartoesRoutes } from './modules/cartoes/cartoes.routes.js';
import { parcelamentosRoutes } from './modules/parcelamentos/parcelamentos.routes.js';
import { recorrenciasRoutes } from './modules/recorrencias/recorrencias.routes.js';
import { investimentosRoutes } from './modules/investimentos/investimentos.routes.js';
import { cambioRoutes } from './modules/cambio/cambio.routes.js';
import { simuladoresRoutes } from './modules/simuladores/simuladores.routes.js';
import { pessoasRoutes } from './modules/pessoas/pessoas.routes.js';
import { dividasRoutes } from './modules/dividas/dividas.routes.js';
import { despesasCompartilhadasRoutes } from './modules/despesas_compartilhadas/despesas_compartilhadas.routes.js';
import { pixRoutes } from './modules/pix/pix.routes.js';
import { relatoriosRoutes } from './modules/relatorios/relatorios.routes.js';
import { sistemaRoutes } from './modules/sistema/sistema.routes.js';
import { moedasRoutes } from './modules/moedas/moedas.routes.js';
import { listaDesejoRoutes } from './modules/lista_desejo/lista_desejo.routes.js';
import { PtaxClient } from './modules/cambio/ptax-client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    } : true,
  });

  // CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    credentials: true,
  });

  // Cookie de sessão
  await app.register(cookie, {
    secret: env.SESSION_SECRET,
  });

  // Tratamento de erros customizado
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Rotas de API
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(instituicoesRoutes, { prefix: '/api/instituicoes' });
  await app.register(contasRoutes, { prefix: '/api/contas' });
  await app.register(cartoesRoutes, { prefix: '/api/cartoes' });
  await app.register(parcelamentosRoutes, { prefix: '/api/parcelamentos' });
  await app.register(recorrenciasRoutes, { prefix: '/api/recorrencias' });
  await app.register(categoriasRoutes, { prefix: '/api/categorias' });
  await app.register(lancamentosRoutes, { prefix: '/api/lancamentos' });
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(investimentosRoutes, { prefix: '/api/investimentos' });
  await app.register(cambioRoutes, { prefix: '/api/cambio' });
  await app.register(simuladoresRoutes, { prefix: '/api/simuladores' });
  await app.register(pessoasRoutes, { prefix: '/api/pessoas' });
  await app.register(dividasRoutes, { prefix: '/api/dividas' });
  await app.register(despesasCompartilhadasRoutes, { prefix: '/api/despesas-compartilhadas' });
  await app.register(pixRoutes, { prefix: '/api/pix' });
  await app.register(relatoriosRoutes, { prefix: '/api/relatorios' });
  await app.register(sistemaRoutes, { prefix: '/api/sistema' });
  await app.register(moedasRoutes, { prefix: '/api/moedas' });
  await app.register(listaDesejoRoutes, { prefix: '/api/lista-desejo' });

  // Servir frontend compilado estaticamente em produção se existir
  const candidatePaths = [
    path.resolve(__dirname, '../frontend/dist'),     // Docker / produção compilada (dist/server.js -> frontend/dist)
    path.resolve(__dirname, '../../frontend/dist'),    // Desenvolvimento TS (src/server.ts -> frontend/dist)
    path.resolve(process.cwd(), 'frontend/dist'),     // Raiz do projeto
    '/app/frontend/dist',                             // Path absoluto dentro do container
  ];
  const clientDistPath = candidatePaths.find((p) => fs.existsSync(p));

  if (clientDistPath) {
    await app.register(fastifyStatic, {
      root: clientDistPath,
      prefix: '/',
      index: 'index.html',   // serve index.html para GET /
      wildcard: false,        // desabilita wildcard interno; usamos catch-all manual
    });

    // Catch-all: redireciona rotas SPA (não-API) para index.html
    app.get('/*', (_req, reply) => {
      reply.sendFile('index.html');
    });

    // Handler de 404 para rotas de API inexistentes
    app.setNotFoundHandler((req, reply) => {
      if (req.raw.url && req.raw.url.startsWith('/api')) {
        reply.status(404).send({ error: 'Endpoint da API não encontrado' });
      } else {
        reply.sendFile('index.html');
      }
    });
  }

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`\n🚀 Servidor backend rodando em http://${env.HOST}:${env.PORT}`);

    // Sincronização periódica de cotações via AwesomeAPI (hora em hora)
    const ptaxClient = new PtaxClient();
    ptaxClient.sincronizarCotacoesRecentes().catch(err => console.error('Erro na sincronização inicial de câmbio:', err));
    setInterval(() => {
      console.log('🔄 Sincronizando cotações horárias com AwesomeAPI...');
      ptaxClient.sincronizarCotacoesRecentes().catch(err => console.error('Erro na sincronização periódica de câmbio:', err));
    }, 60 * 60 * 1000);
  } catch (err) {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
  }
}

if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  start();
}
