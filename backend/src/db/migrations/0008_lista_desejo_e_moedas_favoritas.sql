-- Migração 0008: Lista de Desejos e Moedas Favoritas

-- 1. Coluna favorita na tabela moeda
ALTER TABLE moeda ADD COLUMN IF NOT EXISTS favorita BOOLEAN DEFAULT FALSE;

-- Marcar USD e EUR como favoritas por padrão
UPDATE moeda SET favorita = TRUE WHERE codigo IN ('USD', 'EUR');

-- Inserir moedas adicionais populares se ainda não existirem
INSERT INTO moeda (codigo, nome, simbolo, ativo, favorita)
VALUES 
  ('GBP', 'Libra Esterlina', '£', TRUE, FALSE),
  ('CAD', 'Dólar Canadense', 'C$', TRUE, FALSE),
  ('CHF', 'Franco Suíço', 'CHF', TRUE, FALSE),
  ('JPY', 'Iene Japonês', '¥', TRUE, FALSE),
  ('BTC', 'Bitcoin', '₿', TRUE, FALSE),
  ('ARS', 'Peso Argentino', '$', TRUE, FALSE)
ON CONFLICT (codigo) DO UPDATE SET ativo = TRUE;

-- 2. Tabela lista_desejo (Wishlist)
CREATE TABLE IF NOT EXISTS lista_desejo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  link TEXT,
  preco_estimado NUMERIC(15, 2) NOT NULL,
  prioridade VARCHAR(20) NOT NULL DEFAULT 'media', -- 'baixa', 'media', 'alta', 'urgente'
  categoria_id UUID REFERENCES categoria(id) ON DELETE SET NULL,
  tipo_gasto VARCHAR(30) DEFAULT 'pessoal', -- 'essencial', 'pessoal', 'desejo', 'investimento_pessoal', 'eletronico', 'casa'
  status VARCHAR(20) NOT NULL DEFAULT 'planejado', -- 'planejado', 'comprado', 'descartado'
  observacoes TEXT,
  data_alvo DATE,
  comprado_em TIMESTAMP,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lista_desejo_status ON lista_desejo(status);
CREATE INDEX IF NOT EXISTS idx_lista_desejo_prioridade ON lista_desejo(prioridade);
