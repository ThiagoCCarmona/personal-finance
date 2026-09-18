export interface User {
  id: string;
  login: string;
  nome?: string;
  role?: 'admin' | 'user';
  precisa_trocar_senha?: boolean;
  ativo?: boolean;
}

export interface AuthStatus {
  setupRequired: boolean;
  allowRegistration?: boolean;
  authenticated: boolean;
  user: User | null;
}

export interface Instituicao {
  id: string;
  nome: string;
  tipo: 'banco' | 'carteira_digital' | 'dinheiro';
  icone: string;
  cor: string;
  ativo: boolean;
  total_contas?: number;
  saldo_total?: number;
}

export interface Conta {
  id: string;
  instituicao_id: string;
  moeda_id: string;
  tipo: 'corrente' | 'poupanca' | 'carteira_digital' | 'dinheiro';
  apelido: string;
  saldo_inicial: number;
  saldo_atual: number;
  ativo: boolean;
  instituicao_nome?: string;
  instituicao_tipo?: string;
  instituicao_icone?: string;
  instituicao_cor?: string;
  moeda_codigo?: string;
  moeda_simbolo?: string;
}

export interface CartaoCredito {
  id: string;
  instituicao_id: string;
  apelido: string;
  limite: number;
  dia_fechamento: number;
  dia_vencimento: number;
  ativo: boolean;
  instituicao_nome?: string;
  instituicao_icone?: string;
  instituicao_cor?: string;
  limite_utilizado?: number;
  limite_disponivel?: number;
  fatura_atual?: number;
  fatura_atual_paga?: boolean;
  mes_fatura_atual?: string;
  percentual_utilizado?: number;
}

export interface FaturaDetalhe {
  cartao: CartaoCredito;
  anoMes: string;
  totalFatura: number;
  quantidadeItens: number;
  paga?: boolean;
  pagamento?: {
    id: string;
    valor_pago: number;
    data_pagamento: string;
    conta_id?: string | null;
    conta_apelido?: string | null;
    lancamento_id?: string | null;
  } | null;
  itens: Lancamento[];
}

export interface CompraParcelada {
  id: string;
  descricao: string;
  valor_total: number;
  num_parcelas: number;
  cartao_id: string;
  categoria_id: string;
  subcategoria_id?: string | null;
  data_compra: string;
  cartao_apelido?: string;
  categoria_nome?: string;
  categoria_cor?: string;
  parcelas_pagas: number;
  parcelas_restantes: number;
  saldo_devedor_remanescente: number;
}

export interface Recorrencia {
  id: string;
  tipo: 'despesa' | 'receita';
  descricao: string;
  valor: number;
  categoria_id: string;
  forma_pagamento: 'dinheiro' | 'pix_debito' | 'debito' | 'transferencia' | 'credito' | 'outros';
  conta_id?: string | null;
  cartao_id?: string | null;
  frequencia: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';
  dia_referencia: number;
  dia_estimado_na_fatura?: number | null;
  data_inicio: string;
  data_fim?: string | null;
  ativo: boolean;
  categoria_nome?: string;
  categoria_icone?: string;
  categoria_cor?: string;
  conta_apelido?: string;
  cartao_apelido?: string;
  ja_lancado?: boolean;
  lancamento_id?: string | null;
  lancamento_status?: string | null;
}

export interface Categoria {
  id: string;
  nome: string;
  tipo: 'despesa' | 'receita';
  icone: string;
  cor: string;
  categoria_pai_id?: string | null;
  categoria_pai_nome?: string | null;
  ativo: boolean;
  subcategorias?: Categoria[];
}

export interface Lancamento {
  id: string;
  tipo: 'despesa' | 'receita';
  valor: number;
  moeda_id: string;
  data_compra: string;
  data_competencia_fatura?: string | null;
  forma_pagamento: 'dinheiro' | 'pix_debito' | 'debito' | 'transferencia' | 'credito' | 'outros';
  conta_id?: string | null;
  cartao_id?: string | null;
  categoria_id: string;
  subcategoria_id?: string | null;
  descricao: string;
  anexo_url?: string | null;
  recorrencia_id?: string | null;
  compra_parcelada_id?: string | null;
  numero_parcela?: number | null;
  total_parcelas?: number | null;
  status: 'efetivado' | 'pendente';
  conta_apelido?: string;
  cartao_apelido?: string;
  categoria_nome?: string;
  categoria_icone?: string;
  categoria_cor?: string;
  subcategoria_nome?: string;
  moeda_codigo?: string;
  moeda_simbolo?: string;
  criado_em: string;
}

export interface DashboardResumo {
  periodo: string;
  mesAnterior: string;
  saldoConsolidado: number;
  totalDespesas: number;
  totalReceitas: number;
  saldoMes: number;
  despesasMesAnterior: number;
  receitasMesAnterior: number;
  variacaoDespesasPercentual: number;
  saldoProjetadoMesSeguinte?: number;
  totalReceitasRecorrentes?: number;
  totalFaturasMes?: number;
  totalDespesasRecorrentesConta?: number;
}

export interface ContasAPagarResumo {
  periodo: string;
  totalPrevistoMes: number;
  totalFaturasMes: number;
  totalComprometimentoFuturo: number;
  parcelasFuturasCount: number;
  faturas: Array<{
    cartao_id: string;
    cartao_apelido: string;
    instituicao_nome: string;
    instituicao_cor: string;
    dia_vencimento: number;
    data_vencimento: string;
    total_fatura: number;
    total_itens: number;
  }>;
  recorrencias: Array<{
    id: string;
    descricao: string;
    tipo?: 'despesa' | 'receita';
    valor: number;
    dia_referencia: number;
    data_vencimento: string;
    categoria_nome: string;
    categoria_cor: string;
    forma_pagamento: string;
    conta_apelido?: string;
    cartao_apelido?: string;
    ja_lancado: boolean;
    lancamento_id: string | null;
  }>;
}

export interface GastoCategoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  total: number;
  percentual: number;
}

export interface EvolucaoItem {
  anoMes: string;
  despesas: number;
  receitas: number;
  resultado: number;
}

// --- FASE 3: PATRIMÔNIO E CÂMBIO ---

export type TipoInvestimento = 'renda_fixa' | 'acao' | 'fii' | 'cripto' | 'moeda_estrangeira';
export type TipoMovimentacao = 'aporte' | 'resgate' | 'rendimento';

export interface PosicaoAtivo {
  id: string;
  tipo: TipoInvestimento;
  nome: string;
  ticker: string | null;
  moeda_codigo: string;
  instituicao: string | null;
  indexador: string | null;
  taxa_anual: number | null;
  data_vencimento: string | null;
  ativo: boolean;
  quantidade_total: number;
  total_aportado: number;
  total_resgatado: number;
  total_rendimentos: number;
  saldo_aplicado: number;
  preco_medio: number;
}

export interface MovimentacaoInvestimento {
  id: string;
  investimento_id: string;
  tipo: TipoMovimentacao;
  valor: number;
  quantidade: number;
  cotacao_praticada: number;
  data: string;
  observacao?: string | null;
  investimento_nome?: string;
  investimento_ticker?: string;
  investimento_tipo?: string;
}

export interface ResumoCarteira {
  total_patrimonio: number;
  total_aportado: number;
  total_rendimentos: number;
  alocacao_por_tipo: Array<{
    tipo: string;
    valor: number;
    percentual: number;
  }>;
  quantidade_ativos: number;
}

export interface CotacaoPonto {
  data: string;
  valor: number;
  mm7?: number | null;
  mm30?: number | null;
}

export interface HistoricoCambio {
  moeda: string;
  pontos: CotacaoPonto[];
  volatilidade_30d: number;
  ultima_cotacao: number;
  variacao_periodo_pct: number;
}

export interface GanhoCambialResultado {
  moeda: string;
  quantidade: number;
  cotacao_aquisicao: number;
  cotacao_atual: number;
  data_cotacao_atual: string | null;
  valor_investido_brl: number;
  valor_atual_brl: number;
  ganho_perda_brl: number;
  rentabilidade_pct: number;
}

export interface CenarioSimulacao {
  nome: string;
  taxa_anual_pct: number;
}

export interface ResultadoCenario {
  nome: string;
  taxa_anual_pct: number;
  taxa_mensal_pct: number;
  valor_final_bruto: number;
  total_investido: number;
  total_juros_ganhos: number;
  rentabilidade_pct: number;
}

export interface ResultadoSimulacao {
  parametros: {
    valor_inicial: number;
    aporte_mensal: number;
    prazo_meses: number;
  };
  cenarios: ResultadoCenario[];
  evolucao_mensal: Array<{
    mes: number;
    total_investido: number;
    [key: string]: number;
  }>;
}

// --- FASE 4: SOCIAL E COBRANÇAS PIX ---

export interface Pessoa {
  id: string;
  nome: string;
  apelido?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  total_a_receber: number;
  criado_em: string;
}

export type StatusDivida = 'pendente' | 'parcial' | 'quitada' | 'perdoada';

export interface Divida {
  id: string;
  pessoa_id: string;
  pessoa_nome: string;
  pessoa_apelido?: string;
  valor_total: number;
  valor_pago: number;
  valor_perdoado: number;
  saldo_devedor: number;
  motivo: string;
  conta_origem_id?: string;
  conta_origem_nome?: string;
  despesa_compartilhada_id?: string;
  status: StatusDivida;
  data: string;
  vencimento?: string;
}

export interface ResumoDividas {
  totalReceber: number;
  totalRecebido: number;
  totalPerdoado: number;
  qtdPendentes: number;
}

export interface DespesaCompartilhada {
  id: string;
  descricao: string;
  valor_total: number;
  data: string;
  conta_origem_id?: string;
  conta_nome?: string;
  cartao_id?: string;
  cartao_nome?: string;
  categoria_id?: string;
  categoria_nome?: string;
  total_participantes: number;
  valor_a_receber_total: number;
  valor_recebido_total: number;
}

export type TipoChavePix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';

export interface ChavePix {
  id: string;
  tipo: TipoChavePix;
  valor_chave: string;
  nome_recebedor: string;
  cidade_recebedor: string;
  apelido?: string;
  conta_id?: string;
  conta_nome?: string;
  ativo: boolean;
  criado_em: string;
}

export type StatusCobrancaPix = 'aguardando_confirmacao' | 'recebida' | 'cancelada';

export interface CobrancaPix {
  id: string;
  chave_pix_id: string;
  tipo_chave: string;
  valor_chave: string;
  nome_recebedor: string;
  valor: number;
  mensagem?: string;
  txid: string;
  payload_emv: string;
  status: StatusCobrancaPix;
  divida_id?: string;
  divida_motivo?: string;
  pessoa_nome?: string;
  data_criacao: string;
  data_confirmacao?: string;
}

// --- FASE 5: EXTRAS, SIMULADOR DE GASTOS E SISTEMA ---

export interface ProjecaoFaturaMes {
  mes_ano: string;
  fatura_atual_estimada: number;
  adicional_simulado: number;
  fatura_projetada_total: number;
}

export interface ResultadoSimulacaoGasto {
  descricao: string;
  moeda_codigo: string;
  valor_original: number;
  cotacao_utilizada: number;
  valor_total_brl: number;
  valor_a_vista_brl?: number;
  forma_pagamento: 'a_vista' | 'cartao_parcelado';
  num_parcelas: number;
  valor_parcela_brl: number;
  com_juros?: boolean;
  taxa_juros_mensal?: number;
  tipo_juros?: 'price' | 'simples';
  total_juros_brl?: number;
  percentual_acrescimo_juros?: number;
  impacto_a_vista?: {
    conta_nome: string;
    saldo_atual: number;
    saldo_apos_compra: number;
  };
  impacto_cartao?: {
    cartao_nome: string;
    limite_total: number;
    limite_disponivel_atual: number;
    limite_disponivel_projetado: number;
    projecoes_faturas: ProjecaoFaturaMes[];
  };
  projecao_mes_seguinte?: {
    saldo_atual: number;
    receitas_recorrentes: number;
    faturas_e_despesas_fixas: number;
    saldo_projetado_sem_compra: number;
    saldo_projetado_com_compra: number;
    impacto_compra: number;
  };
}

export interface UsuarioAdmin {
  id: string;
  login: string;
  nome: string;
  role: 'admin' | 'usuario';
  ativo: boolean;
  precisa_trocar_senha: boolean;
  criado_em: string;
  atualizado_em?: string;
  ultimo_acesso?: string | null;
  total_lancamentos?: number;
  total_contas?: number;
}

export interface MetricasSistema {
  tamanho_banco: string;
  total_lancamentos: number;
  total_investimentos: number;
  total_dividas: number;
  versao_banco: string;
  data_hora_servidor: string;
}

export interface ItemDesejoHistoricoPreco {
  id?: string;
  link_id?: string;
  link_url?: string;
  data: string;
  preco: number;
  loja?: string;
  observacao?: string;
}

export interface ItemDesejoLink {
  id?: string;
  url: string;
  loja?: string;
  preco_atual?: number;
  historico_precos?: ItemDesejoHistoricoPreco[];
}

export interface ItemDesejo {
  id: string;
  nome: string;
  link: string | null;
  links?: ItemDesejoLink[];
  preco_estimado: number;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  categoria_id: string | null;
  categoria_nome?: string | null;
  categoria_cor?: string | null;
  tipo_gasto: 'essencial' | 'pessoal' | 'desejo' | 'investimento_pessoal' | 'eletronico' | 'casa';
  status: 'planejado' | 'comprado' | 'descartado';
  observacoes: string | null;
  data_alvo: string | null;
  historico_precos?: ItemDesejoHistoricoPreco[];
  comprado_em: string | null;
  criado_em: string;
  atualizado_em: string;
}



