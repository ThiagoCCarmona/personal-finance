import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/financeiro',
  SESSION_SECRET: process.env.SESSION_SECRET || 'chave-secreta-para-assinatura-de-sessao-financeira-self-hosted-32b',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
