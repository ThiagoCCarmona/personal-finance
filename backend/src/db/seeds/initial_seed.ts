import { pool } from '../../config/database.js';
import { runAdminDemoSeed } from './admin_demo_seed.js';

export async function runInitialSeed() {
  console.log('Iniciando seed padrão do sistema...');
  await runAdminDemoSeed();
}

// Permite execução direta via CLI
if (process.argv[1]?.endsWith('initial_seed.ts') || process.argv[1]?.endsWith('initial_seed.js')) {
  runInitialSeed()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Erro no seed:', err);
      pool.end();
      process.exit(1);
    });
}
