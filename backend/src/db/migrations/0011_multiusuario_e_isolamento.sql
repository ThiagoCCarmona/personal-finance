-- Migração 0011: Transformação em Multiusuário e Isolamento Estrito de Dados

-- 1. Expansão da tabela de Usuários com Perfil e Papel (Role-Based Access Control)
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS nome VARCHAR(100);

-- Garantir que o primeiro usuário cadastrado (ou com login admin) seja admin
UPDATE usuario SET role = 'admin' WHERE login = 'admin' OR id = (SELECT id FROM usuario ORDER BY criado_em ASC LIMIT 1);

-- 2. Adição de usuario_id nas tabelas privadas de negócio
ALTER TABLE conta ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE cartao_credito ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE compra_parcelada ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE recorrencia ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE categoria ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE lancamento ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE resumo_mensal ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE investimento ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE movimentacao_investimento ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE pessoa ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE despesa_compartilhada ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE divida ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE chave_pix ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE cobranca_pix ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;
ALTER TABLE lista_desejo ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuario(id) ON DELETE CASCADE;

-- 3. Migração de dados legados existentes (caso já haja dados antes desta migração)
DO $$
DECLARE
    primeiro_usuario_id UUID;
BEGIN
    SELECT id INTO primeiro_usuario_id FROM usuario ORDER BY criado_em ASC LIMIT 1;
    IF primeiro_usuario_id IS NOT NULL THEN
        UPDATE conta SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE cartao_credito SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE compra_parcelada SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE recorrencia SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE categoria SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE lancamento SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE resumo_mensal SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE investimento SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE movimentacao_investimento SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE pessoa SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE despesa_compartilhada SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE divida SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE chave_pix SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE cobranca_pix SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
        UPDATE lista_desejo SET usuario_id = primeiro_usuario_id WHERE usuario_id IS NULL;
    END IF;
END $$;

-- 4. Criação de índices para máxima performance nas consultas por usuário
CREATE INDEX IF NOT EXISTS idx_conta_usuario ON conta(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cartao_usuario ON cartao_credito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_compra_parcelada_usuario ON compra_parcelada(usuario_id);
CREATE INDEX IF NOT EXISTS idx_recorrencia_usuario ON recorrencia(usuario_id);
CREATE INDEX IF NOT EXISTS idx_categoria_usuario ON categoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_usuario ON lancamento(usuario_id, data_compra DESC);
CREATE INDEX IF NOT EXISTS idx_resumo_mensal_usuario ON resumo_mensal(usuario_id, ano_mes);
CREATE INDEX IF NOT EXISTS idx_investimento_usuario ON investimento(usuario_id);
CREATE INDEX IF NOT EXISTS idx_mov_investimento_usuario ON movimentacao_investimento(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pessoa_usuario ON pessoa(usuario_id);
CREATE INDEX IF NOT EXISTS idx_despesa_compartilhada_usuario ON despesa_compartilhada(usuario_id);
CREATE INDEX IF NOT EXISTS idx_divida_usuario ON divida(usuario_id);
CREATE INDEX IF NOT EXISTS idx_chave_pix_usuario ON chave_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cobranca_pix_usuario ON cobranca_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_lista_desejo_usuario ON lista_desejo(usuario_id);
