-- Migração 0003: Patrimônio e Câmbio (Fase 3)

-- 1. Tabela de Investimentos
CREATE TABLE IF NOT EXISTS investimento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('renda_fixa', 'acao', 'fii', 'cripto', 'moeda_estrangeira')),
    nome VARCHAR(100) NOT NULL,
    ticker VARCHAR(20), -- Ex: PETR4, HGLG11, BTC, USD
    moeda_id UUID NOT NULL REFERENCES moeda(id) ON DELETE RESTRICT,
    instituicao VARCHAR(100), -- Ex: XP, Nubank, Binance, Cofre Físico
    indexador VARCHAR(50), -- Ex: "100% CDI", "IPCA + 6%", "Pré 12%"
    taxa_anual NUMERIC(8, 4),
    data_vencimento DATE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investimento_tipo ON investimento(tipo);
CREATE INDEX IF NOT EXISTS idx_investimento_moeda ON investimento(moeda_id);

-- 2. Movimentações de Investimento (Aportes, Resgates, Rendimentos)
CREATE TABLE IF NOT EXISTS movimentacao_investimento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investimento_id UUID NOT NULL REFERENCES investimento(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('aporte', 'resgate', 'rendimento')),
    valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0), -- Valor financeiro em BRL
    quantidade NUMERIC(18, 8) NOT NULL CHECK (quantidade > 0), -- Quantidade de cotas/ações/moeda
    cotacao_praticada NUMERIC(15, 6), -- Preço unitário pago / cotação de aquisição
    data DATE NOT NULL,
    observacao VARCHAR(255),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mov_investimento_id ON movimentacao_investimento(investimento_id);
CREATE INDEX IF NOT EXISTS idx_mov_investimento_data ON movimentacao_investimento(data);

-- 3. Cotações de Câmbio Históricas (PTAX Banco Central)
CREATE TABLE IF NOT EXISTS cotacao_cambio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moeda_id UUID NOT NULL REFERENCES moeda(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    valor_ptax NUMERIC(15, 6) NOT NULL CHECK (valor_ptax > 0),
    fonte VARCHAR(50) DEFAULT 'Banco Central do Brasil / PTAX',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_cotacao_moeda_data UNIQUE (moeda_id, data)
);

CREATE INDEX IF NOT EXISTS idx_cotacao_moeda_data ON cotacao_cambio(moeda_id, data DESC);
