-- Migração 0014: Natureza das Recorrências (Fixo vs Variável) e Grupos 50-30-20 nas Categorias

-- 1. Natureza das Recorrências (Fixo vs Variável com média estimada)
ALTER TABLE recorrencia ADD COLUMN IF NOT EXISTS natureza VARCHAR(20) NOT NULL DEFAULT 'fixo' CHECK (natureza IN ('fixo', 'variavel'));

-- 2. Grupo 50-30-20 nas Categorias
ALTER TABLE categoria ADD COLUMN IF NOT EXISTS grupo_50_30_20 VARCHAR(20) DEFAULT 'essencial' CHECK (grupo_50_30_20 IN ('essencial', 'estilo_vida', 'investimento', 'receita'));

-- 3. Classificar categorias de receita
UPDATE categoria 
SET grupo_50_30_20 = 'receita' 
WHERE tipo = 'receita';

-- 4. Classificar categorias de investimento / reserva
UPDATE categoria 
SET grupo_50_30_20 = 'investimento' 
WHERE tipo = 'despesa' AND (
    LOWER(nome) LIKE '%invest%' 
    OR LOWER(nome) LIKE '%reserva%' 
    OR LOWER(nome) LIKE '%dívida%' 
    OR LOWER(nome) LIKE '%divida%'
    OR LOWER(nome) LIKE '%amortiza%'
);

-- 5. Classificar categorias de estilo de vida / desejos (30%)
UPDATE categoria 
SET grupo_50_30_20 = 'estilo_vida' 
WHERE tipo = 'despesa' AND (
    LOWER(nome) LIKE '%lazer%'
    OR LOWER(nome) LIKE '%cultura%'
    OR LOWER(nome) LIKE '%restaurante%'
    OR LOWER(nome) LIKE '%bar%'
    OR LOWER(nome) LIKE '%delivery%'
    OR LOWER(nome) LIKE '%ifood%'
    OR LOWER(nome) LIKE '%lanche%'
    OR LOWER(nome) LIKE '%cinema%'
    OR LOWER(nome) LIKE '%show%'
    OR LOWER(nome) LIKE '%viag%'
    OR LOWER(nome) LIKE '%vestuário%'
    OR LOWER(nome) LIKE '%vestuario%'
    OR LOWER(nome) LIKE '%roupa%'
    OR LOWER(nome) LIKE '%assinatura%'
    OR LOWER(nome) LIKE '%streaming%'
    OR LOWER(nome) LIKE '%hobby%'
    OR LOWER(nome) LIKE '%hobbies%'
    OR LOWER(nome) LIKE '%jogos%'
    OR LOWER(nome) LIKE '%game%'
    OR LOWER(nome) LIKE '%cuidados%'
    OR LOWER(nome) LIKE '%salão%'
    OR LOWER(nome) LIKE '%salao%'
    OR LOWER(nome) LIKE '%barbearia%'
);

-- 6. Garantir que despesas essenciais fiquem como 'essencial' (50%)
UPDATE categoria 
SET grupo_50_30_20 = 'essencial' 
WHERE tipo = 'despesa' AND (
    LOWER(nome) LIKE '%aliment%'
    OR LOWER(nome) LIKE '%supermercado%'
    OR LOWER(nome) LIKE '%feira%'
    OR LOWER(nome) LIKE '%moradia%'
    OR LOWER(nome) LIKE '%aluguel%'
    OR LOWER(nome) LIKE '%condom%'
    OR LOWER(nome) LIKE '%conta%'
    OR LOWER(nome) LIKE '%luz%'
    OR LOWER(nome) LIKE '%energia%'
    OR LOWER(nome) LIKE '%água%'
    OR LOWER(nome) LIKE '%agua%'
    OR LOWER(nome) LIKE '%gás%'
    OR LOWER(nome) LIKE '%gas%'
    OR LOWER(nome) LIKE '%internet%'
    OR LOWER(nome) LIKE '%transporte%'
    OR LOWER(nome) LIKE '%combustível%'
    OR LOWER(nome) LIKE '%combustivel%'
    OR LOWER(nome) LIKE '%saúde%'
    OR LOWER(nome) LIKE '%saude%'
    OR LOWER(nome) LIKE '%farmácia%'
    OR LOWER(nome) LIKE '%farmacia%'
    OR LOWER(nome) LIKE '%remédio%'
    OR LOWER(nome) LIKE '%remedio%'
    OR LOWER(nome) LIKE '%médic%'
    OR LOWER(nome) LIKE '%medic%'
    OR LOWER(nome) LIKE '%educa%'
);

-- 7. Propagar grupo 50-30-20 dos pais para as subcategorias
UPDATE categoria c
SET grupo_50_30_20 = p.grupo_50_30_20
FROM categoria p
WHERE c.categoria_pai_id = p.id AND p.grupo_50_30_20 IS NOT NULL;

-- 8. Índices para otimização de consultas analíticas
CREATE INDEX IF NOT EXISTS idx_recorrencia_natureza ON recorrencia(natureza);
CREATE INDEX IF NOT EXISTS idx_categoria_grupo_50_30_20 ON categoria(grupo_50_30_20);
CREATE INDEX IF NOT EXISTS idx_categoria_pai ON categoria(categoria_pai_id);
