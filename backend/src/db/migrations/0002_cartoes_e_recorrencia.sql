-- Migração 0002: Cartões de Crédito, Compras Parceladas e Recorrências

-- 1. Cartões de Crédito
CREATE TABLE IF NOT EXISTS cartao_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instituicao_id UUID NOT NULL REFERENCES instituicao(id) ON DELETE RESTRICT,
    apelido VARCHAR(100) NOT NULL,
    limite NUMERIC(15, 2) NOT NULL CHECK (limite > 0),
    dia_fechamento INTEGER NOT NULL CHECK (dia_fechamento BETWEEN 1 AND 31),
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cartao_instituicao ON cartao_credito(instituicao_id);

-- 2. Compras Parceladas
CREATE TABLE IF NOT EXISTS compra_parcelada (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao VARCHAR(255) NOT NULL,
    valor_total NUMERIC(15, 2) NOT NULL CHECK (valor_total > 0),
    num_parcelas INTEGER NOT NULL CHECK (num_parcelas >= 1),
    cartao_id UUID NOT NULL REFERENCES cartao_credito(id) ON DELETE RESTRICT,
    categoria_id UUID NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    subcategoria_id UUID REFERENCES categoria(id) ON DELETE SET NULL,
    data_compra DATE NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_compra_parcelada_cartao ON compra_parcelada(cartao_id);

-- 3. Recorrências (Despesas e Receitas Fixas)
CREATE TABLE IF NOT EXISTS recorrencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('despesa', 'receita')),
    descricao VARCHAR(255) NOT NULL,
    valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
    categoria_id UUID NOT NULL REFERENCES categoria(id) ON DELETE RESTRICT,
    forma_pagamento VARCHAR(30) NOT NULL CHECK (forma_pagamento IN ('dinheiro', 'pix_debito', 'debito', 'transferencia', 'credito', 'outros')),
    conta_id UUID REFERENCES conta(id) ON DELETE SET NULL,
    cartao_id UUID REFERENCES cartao_credito(id) ON DELETE SET NULL,
    frequencia VARCHAR(20) NOT NULL DEFAULT 'mensal' CHECK (frequencia IN ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual')),
    dia_referencia INTEGER NOT NULL CHECK (dia_referencia BETWEEN 1 AND 31),
    dia_estimado_na_fatura INTEGER CHECK (dia_estimado_na_fatura BETWEEN 1 AND 31),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Ajustes na tabela de lançamentos para cartões e parcelas
ALTER TABLE lancamento ALTER COLUMN conta_id DROP NOT NULL;
ALTER TABLE lancamento ADD COLUMN IF NOT EXISTS numero_parcela INTEGER;
ALTER TABLE lancamento ADD COLUMN IF NOT EXISTS total_parcelas INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lancamento_cartao') THEN
        ALTER TABLE lancamento ADD CONSTRAINT fk_lancamento_cartao 
        FOREIGN KEY (cartao_id) REFERENCES cartao_credito(id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lancamento_recorrencia') THEN
        ALTER TABLE lancamento ADD CONSTRAINT fk_lancamento_recorrencia 
        FOREIGN KEY (recorrencia_id) REFERENCES recorrencia(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_lancamento_compra_parcelada') THEN
        ALTER TABLE lancamento ADD CONSTRAINT fk_lancamento_compra_parcelada 
        FOREIGN KEY (compra_parcelada_id) REFERENCES compra_parcelada(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lancamento_cartao ON lancamento(cartao_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_competencia ON lancamento(data_competencia_fatura);
