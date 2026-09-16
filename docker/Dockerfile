# Multi-stage Dockerfile para Sistema Financeiro Pessoal

# ------------------------------------------------------------------------------
# 1. Build do Frontend
# ------------------------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# 2. Build do Backend
# ------------------------------------------------------------------------------
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# 3. Runner de Produção
# ------------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Copia dependências de produção do backend
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copia os artefatos compilados
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/src/db/migrations ./dist/db/migrations
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Script de entrada para aplicar migrações antes de iniciar
COPY docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server.js"]
