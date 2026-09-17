-- Migração 0007: Vincular Chave PIX a uma Conta Bancária

ALTER TABLE chave_pix ADD COLUMN IF NOT EXISTS conta_id UUID REFERENCES conta(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_chave_pix_conta ON chave_pix(conta_id);
