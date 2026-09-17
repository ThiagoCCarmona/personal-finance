-- Migração 0010: Inserir Moeda Chinesa (CNY) e estruturar histórico de preços por link na Lista de Desejos

-- 1. Inserir CNY (Yuan Chinês) se ainda não existir
INSERT INTO moeda (codigo, nome, simbolo, ativo, favorita)
VALUES ('CNY', 'Yuan Chinês', '¥', TRUE, FALSE)
ON CONFLICT (codigo) DO UPDATE 
SET ativo = TRUE, simbolo = '¥', nome = 'Yuan Chinês';

-- 2. Atualizar itens existentes da lista_desejo para garantir id e historico_precos em cada link
UPDATE lista_desejo
SET links = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', COALESCE(elem->>'id', gen_random_uuid()::text),
        'url', elem->>'url',
        'loja', COALESCE(elem->>'loja', ''),
        'historico_precos', COALESCE(elem->'historico_precos', '[]'::jsonb)
      )
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(
    CASE 
      WHEN jsonb_typeof(links) = 'array' AND jsonb_array_length(links) > 0 THEN links
      WHEN link IS NOT NULL AND link <> '' THEN jsonb_build_array(jsonb_build_object('url', link, 'loja', 'Principal'))
      ELSE '[]'::jsonb
    END
  ) AS elem
)
WHERE links IS NULL OR jsonb_typeof(links) <> 'array' OR jsonb_array_length(links) = 0;
