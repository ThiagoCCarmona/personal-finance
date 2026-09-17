-- Migração 0009: Inserir PYG (Guarani Paraguaio), favoritar ARS e suportar múltiplos links e histórico de preços na wishlist

-- 1. Inserir PYG se não existir e marcar como favorita
INSERT INTO moeda (codigo, nome, simbolo, favorita, ativo)
VALUES ('PYG', 'Guarani Paraguaio', '₲', TRUE, TRUE)
ON CONFLICT (codigo) DO UPDATE 
SET favorita = TRUE, ativo = TRUE;

-- 2. Atualizar ARS para favorita
UPDATE moeda SET favorita = TRUE WHERE codigo = 'ARS';

-- 3. Adicionar colunas de múltiplos links e histórico de preços na tabela lista_desejo
ALTER TABLE lista_desejo 
ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS historico_precos JSONB DEFAULT '[]'::jsonb;

-- 4. Migrar link existente e preco_estimado para links e historico_precos onde estiver vazio
UPDATE lista_desejo
SET links = jsonb_build_array(jsonb_build_object('url', link, 'loja', 'Loja Principal'))
WHERE (links IS NULL OR links = '[]'::jsonb) AND link IS NOT NULL AND link != '';

UPDATE lista_desejo
SET historico_precos = jsonb_build_array(jsonb_build_object('data', TO_CHAR(criado_em, 'YYYY-MM-DD'), 'preco', preco_estimado, 'observacao', 'Preço inicial cadastrado'))
WHERE (historico_precos IS NULL OR historico_precos = '[]'::jsonb) AND preco_estimado > 0;
