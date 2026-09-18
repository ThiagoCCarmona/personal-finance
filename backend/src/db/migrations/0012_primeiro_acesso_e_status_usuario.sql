-- Migração 0012: Primeiro Acesso (Troca Obrigatória de Senha) e Status de Ativação do Usuário

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS precisa_trocar_senha BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

-- Garantir que o usuário admin atual (se estiver com senha inicial demo admin123) precise trocar senha
UPDATE usuario SET precisa_trocar_senha = TRUE WHERE login = 'admin';
