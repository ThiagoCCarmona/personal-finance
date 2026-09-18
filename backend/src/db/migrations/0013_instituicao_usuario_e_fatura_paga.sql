-- Migração 0013: Isolamento de Instituições por Usuário e Registro de Faturas Pagas

-- 1. Instituições por Usuário
ALTER TABLE instituicao ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;

-- Atualizar instituicao com base nas contas existentes
UPDATE instituicao i
SET usuario_id = c.usuario_id
FROM conta c
WHERE c.instituicao_id = i.id AND i.usuario_id IS NULL;

-- Atualizar instituicao com base nos cartões existentes (se ainda não vinculada)
UPDATE instituicao i
SET usuario_id = cc.usuario_id
FROM cartao_credito cc
WHERE cc.instituicao_id = i.id AND i.usuario_id IS NULL;

-- Para instituições órfãs (não usadas em conta nem em cartão): desativar para não poluir
UPDATE instituicao
SET ativo = FALSE
WHERE usuario_id IS NULL AND NOT EXISTS (
    SELECT 1 FROM conta WHERE conta.instituicao_id = instituicao.id
) AND NOT EXISTS (
    SELECT 1 FROM cartao_credito WHERE cartao_credito.instituicao_id = instituicao.id
);

-- Atribuir instituições restantes ao usuário administrador inicial
UPDATE instituicao
SET usuario_id = (SELECT id FROM usuario WHERE role = 'admin' ORDER BY criado_em ASC LIMIT 1)
WHERE usuario_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_instituicao_usuario ON instituicao(usuario_id);

-- 2. Tabela de Faturas Pagas
CREATE TABLE IF NOT EXISTS fatura_paga (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    cartao_id UUID NOT NULL REFERENCES cartao_credito(id) ON DELETE CASCADE,
    ano_mes VARCHAR(7) NOT NULL, -- Formato 'YYYY-MM'
    valor_pago NUMERIC(15, 2) NOT NULL,
    data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
    conta_id UUID REFERENCES conta(id) ON DELETE SET NULL,
    lancamento_id UUID REFERENCES lancamento(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cartao_id, ano_mes)
);

CREATE INDEX IF NOT EXISTS idx_fatura_paga_usuario ON fatura_paga(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fatura_paga_cartao_mes ON fatura_paga(cartao_id, ano_mes);
