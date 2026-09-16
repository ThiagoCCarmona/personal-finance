-- Migração 0004: Social e Cobranças PIX (Fase 4)

-- 1. Pessoas / Contatos
CREATE TABLE IF NOT EXISTS pessoa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(150) NOT NULL,
    apelido VARCHAR(50),
    telefone VARCHAR(30),
    email VARCHAR(150),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pessoa_ativo ON pessoa(ativo);

-- 2. Despesa Compartilhada (Divisão em Grupo)
CREATE TABLE IF NOT EXISTS despesa_compartilhada (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descricao VARCHAR(255) NOT NULL,
    valor_total NUMERIC(15, 2) NOT NULL CHECK (valor_total > 0),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    conta_origem_id UUID REFERENCES conta(id) ON DELETE RESTRICT,
    cartao_id UUID REFERENCES cartao_credito(id) ON DELETE RESTRICT,
    categoria_id UUID REFERENCES categoria(id) ON DELETE RESTRICT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Dívida / Contas a Receber (Empréstimo ou Cota de Despesa Compartilhada)
CREATE TABLE IF NOT EXISTS divida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoa(id) ON DELETE RESTRICT,
    valor_total NUMERIC(15, 2) NOT NULL CHECK (valor_total > 0),
    valor_pago NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (valor_pago >= 0),
    valor_perdoado NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (valor_perdoado >= 0),
    motivo VARCHAR(255) NOT NULL,
    conta_origem_id UUID REFERENCES conta(id) ON DELETE RESTRICT,
    despesa_compartilhada_id UUID REFERENCES despesa_compartilhada(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente' 
        CHECK (status IN ('pendente', 'parcial', 'quitada', 'perdoada')),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    vencimento DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_divida_valores CHECK (valor_pago + valor_perdoado <= valor_total)
);
CREATE INDEX IF NOT EXISTS idx_divida_pessoa ON divida(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_divida_status ON divida(status);

-- 4. Chave PIX própria
CREATE TABLE IF NOT EXISTS chave_pix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('cpf', 'cnpj', 'email', 'telefone', 'aleatoria')),
    valor_chave VARCHAR(100) NOT NULL,
    nome_recebedor VARCHAR(100) NOT NULL,
    cidade_recebedor VARCHAR(100) NOT NULL,
    apelido VARCHAR(50),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Cobrança PIX
CREATE TABLE IF NOT EXISTS cobranca_pix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave_pix_id UUID NOT NULL REFERENCES chave_pix(id) ON DELETE RESTRICT,
    valor NUMERIC(15, 2) NOT NULL CHECK (valor >= 0),
    mensagem VARCHAR(140),
    txid VARCHAR(35) NOT NULL,
    payload_emv TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'aguardando_confirmacao'
        CHECK (status IN ('aguardando_confirmacao', 'recebida', 'cancelada')),
    lancamento_id UUID REFERENCES lancamento(id) ON DELETE SET NULL,
    divida_id UUID REFERENCES divida(id) ON DELETE SET NULL,
    data_criacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_confirmacao TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_cobranca_pix_divida ON cobranca_pix(divida_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_pix_status ON cobranca_pix(status);
