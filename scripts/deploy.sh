#!/bin/bash
set -e

echo "=================================================================="
echo "🚀 Deploy de Produção — FinanSmart Pro (finansmart.tccodes.com.br)"
echo "=================================================================="

# 1. Verifica presença do arquivo .env
if [ ! -f .env ]; then
  echo "❌ Erro: Arquivo .env não encontrado no diretório raiz!"
  echo "👉 Crie o arquivo .env copiando o modelo: cp .env.example .env"
  echo "👉 Configure as senhas de produção antes de prosseguir."
  exit 1
fi

# 2. Garante que a rede externa do Traefik ('proxy') existe
if ! docker network inspect proxy >/dev/null 2>&1; then
  echo "🌐 Criando rede docker externa 'proxy' para o Traefik..."
  docker network create proxy
else
  echo "✅ Rede docker 'proxy' já está ativa."
fi

# 3. Pull das imagens base e build do container de produção
echo "📦 Compilando e subindo serviços com Docker Compose..."
docker compose -f docker-compose.prod.yml up -d --build

# 4. Aguarda inicialização dos contêineres
echo "⏳ Aguardando healthcheck dos serviços..."
sleep 5

docker compose -f docker-compose.prod.yml ps

echo "=================================================================="
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesso: https://finansmart.tccodes.com.br"
echo "📜 Logs: docker compose -f docker-compose.prod.yml logs -f"
echo "=================================================================="
