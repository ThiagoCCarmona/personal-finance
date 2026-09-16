import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('Iniciando migrações de banco de dados...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Tabela para controle de versão de migrações
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDir = path.resolve(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('Diretório de migrações não encontrado.');
      await client.query('COMMIT');
      return;
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    const { rows: appliedRows } = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedRows.map((r: { version: string }) => r.version));

    for (const file of files) {
      if (!appliedVersions.has(file)) {
        console.log(`Aplicando migração: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        console.log(`Migração ${file} aplicada com sucesso.`);
      }
    }

    await client.query('COMMIT');
    console.log('Todas as migrações foram verificadas e aplicadas.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao executar migrações:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
