-- Migração 0005: Extras e Refinamento de Performance (Fase 5)

-- Índices otimizados para relatórios e pesquisas rápidas
CREATE INDEX IF NOT EXISTS idx_lancamento_competencia_status 
  ON lancamento(data_competencia_fatura, status);

CREATE INDEX IF NOT EXISTS idx_lancamento_busca 
  ON lancamento(data_compra DESC, conta_id, categoria_id);

CREATE INDEX IF NOT EXISTS idx_resumo_mensal_busca 
  ON resumo_mensal(ano_mes, conta_id, categoria_id);

CREATE INDEX IF NOT EXISTS idx_cotacao_moeda_data 
  ON cotacao_cambio(moeda_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_divida_busca 
  ON divida(pessoa_id, status, data DESC);
