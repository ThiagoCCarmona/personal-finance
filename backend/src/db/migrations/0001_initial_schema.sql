-- Migração Inicial 0001: Schema Fase 1 (MVP)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Usuário (Single-User restrito)
CREATE TABLE IF NOT EXISTS usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    login VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    inactivity_timeout_minutes INTEGER NOT NULL DEFAULT 720,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Sessão por usuário
CREATE TABLE IF NOT EXISTS sessao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    ultimo_acesso TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessao_token ON sessao(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessao_expira ON sessao(expira_em);

-- 3. Moeda
CREATE TABLE IF NOT EXISTS moeda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(3) NOT NULL UNIQUE,
    nome VARCHAR(50) NOT NULL,
    simbolo VARCHAR(10) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Instituição / Banco
CREATE TABLE IF NOT EXISTS instituicao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('banco', 'carteira_digital', 'dinheiro')),
    icone VARCHAR(50) DEFAULT 'Landmark',
    cor VARCHAR(20) DEFAULT '#3B82F6',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Conta
CREATE TABLE IF NOT EXISTS conta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instituicao_id UUID NOT NULL REFERENCES instituicao(id) ON DELETE RESTRICT,
    moeda_id UUID NOT NULL REFERENCES moeda(id) ON DELETE RESTRICT,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'carteira_digital', 'dinheiro')),
    apelido VARCHAR(100) NOT NULL,
    saldo_inicial NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    saldo_atual NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conta_instituicao ON conta(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_conta_moeda ON conta(moeda_id);

-- 6. Categoria e Subcategoria
CREATE TABLE IF NOT EXISTS categoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('despesa', 'receita')),
    icone VARCHAR(50) DEFAULT 'Tag',
    cor VARCHAR(20) DEFAULT '#6B7280',
    categoria_pai_id UUID REFERENCES categoria(id) ON DELETE CASCADE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categoria_pai ON categoria(categoria_pai_id);
CREATE INDEX IF NOT EXISTS idx_categoria_tipo ON categoria(tipo);

-- 7. Lançamento
CREATE TABLE IF NOT EXISTS lancamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('despesa', 'receita')),
    valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
    moeda_id UUID NOT NULL REFERENCES moeda(id) ON DELETE RESTRICT,
    data_compra DATE NOT NULL,
    data_competencia_fatura DATE,
    forma_pagamento VARCHAR(30) NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix_debito', 'debito', 'transferencia', 'credito', 'outros')),
    conta_id UUID NOT NULL REFERENCES conta(id) ON DELETE RESTRICT,
    cartao_id UUID,
    categoria_id UUID NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    subcategoria_id UUID REFERENCES categoria(id) ON DELETE SET NULL,
    descricao VARCHAR(255) NOT NULL,
    anexo_url VARCHAR(500),
    recorrencia_id UUID,
    compra_parcelada_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'efetivado' CHECK (status IN ('efetivado', 'pendente')),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lancamento_data ON lancamento(data_compra);
CREATE INDEX IF NOT EXISTS idx_lancamento_conta ON lancamento(conta_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_categoria ON lancamento(categoria_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_status ON lancamento(status);

-- 8. Tabela de Agregação: Resumo Mensal
CREATE TABLE IF NOT EXISTS resumo_mensal (
    ano_mes VARCHAR(7) NOT NULL, -- Formato: 'YYYY-MM'
    categoria_id UUID NOT NULL REFERENCES categoria(id) ON DELETE CASCADE,
    conta_id UUID NOT NULL REFERENCES conta(id) ON DELETE CASCADE,
    total_despesas NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_receitas NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (ano_mes, categoria_id, conta_id)
);
CREATE INDEX IF NOT EXISTS idx_resumo_mensal_periodo ON resumo_mensal(ano_mes);
