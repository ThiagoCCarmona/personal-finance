-- Migração 0006: Seeds Essenciais (Moedas, Instituições Brasileiras e Categorias Padrão)

-- 1. Moedas Padrão
INSERT INTO moeda (codigo, nome, simbolo, ativo)
VALUES 
    ('BRL', 'Real Brasileiro', 'R$', TRUE),
    ('USD', 'Dólar Americano', 'US$', TRUE),
    ('EUR', 'Euro', '€', TRUE)
ON CONFLICT (codigo) DO UPDATE 
SET nome = EXCLUDED.nome, simbolo = EXCLUDED.simbolo, ativo = TRUE;

-- 2. Instituições Financeiras Populares Brasileiras
INSERT INTO instituicao (nome, tipo, icone, cor, ativo)
SELECT nome, tipo, icone, cor, TRUE
FROM (VALUES
    ('Nubank', 'carteira_digital', 'Smartphone', '#8A05BE'),
    ('Banco Inter', 'banco', 'Landmark', '#FF7A00'),
    ('Itaú', 'banco', 'Landmark', '#EC7000'),
    ('Bradesco', 'banco', 'Landmark', '#CC092F'),
    ('Banco do Brasil', 'banco', 'Landmark', '#FEEF36'),
    ('Santander', 'banco', 'Landmark', '#EC0000'),
    ('Caixa Econômica', 'banco', 'Landmark', '#0066B3'),
    ('C6 Bank', 'banco', 'Landmark', '#242424'),
    ('XP Investimentos', 'carteira_digital', 'TrendingUp', '#000000'),
    ('BTG Pactual', 'banco', 'Landmark', '#172554'),
    ('Mercado Pago', 'carteira_digital', 'Smartphone', '#009EE3'),
    ('Dinheiro em Espécie', 'dinheiro', 'Wallet', '#10B981')
) AS v(nome, tipo, icone, cor)
WHERE NOT EXISTS (
    SELECT 1 FROM instituicao WHERE instituicao.nome = v.nome
);

-- 3. Categorias Principais de Despesa e Receita
INSERT INTO categoria (nome, tipo, icone, cor)
SELECT nome, tipo, icone, cor
FROM (VALUES
    ('Alimentação', 'despesa', 'Utensils', '#EF4444'),
    ('Moradia', 'despesa', 'Home', '#3B82F6'),
    ('Transporte', 'despesa', 'Car', '#F59E0B'),
    ('Saúde & Farmácia', 'despesa', 'HeartPulse', '#EC4899'),
    ('Lazer & Entretenimento', 'despesa', 'Gamepad2', '#8B5CF6'),
    ('Educação', 'despesa', 'GraduationCap', '#10B981'),
    ('Assinaturas & Serviços', 'despesa', 'Film', '#6366F1'),
    ('Vestuário & Compras', 'despesa', 'Shirt', '#14B8A6'),
    ('Impostos & Taxas', 'despesa', 'FileText', '#64748B'),
    ('Outros Gastos', 'despesa', 'MoreHorizontal', '#6B7280'),
    ('Salário & Remuneração', 'receita', 'Briefcase', '#10B981'),
    ('Investimentos & Dividendos', 'receita', 'TrendingUp', '#059669'),
    ('Vendas & Serviços Extras', 'receita', 'PlusCircle', '#34D399'),
    ('Outras Receitas', 'receita', 'DollarSign', '#22C55E')
) AS c(nome, tipo, icone, cor)
WHERE NOT EXISTS (
    SELECT 1 FROM categoria WHERE categoria.nome = c.nome AND categoria.tipo = c.tipo
);
