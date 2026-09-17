const BASE_URL = '/api';

class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || 'Ocorreu um erro na requisição', response.status, data.details);
  }

  // Se o backend tiver retornado { data: [...] } ou { data: { ... } } de forma envelopada
  if (data && typeof data === 'object' && 'data' in data && Object.keys(data).length === 1) {
    return data.data as T;
  }

  return data as T;
}

export const api = {
  // Moedas
  getMoedas: () => request<Array<{ id: string; codigo: string; nome: string; simbolo: string }>>('/moedas'),

  // Auth
  getStatus: () => request<import('../types/index.js').AuthStatus>('/auth/status'),
  setup: (body: { login: string; senha: string }) => request<any>('/auth/setup', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { login: string; senha: string }) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Instituições
  getInstituicoes: () => request<import('../types/index.js').Instituicao[]>('/instituicoes'),
  createInstituicao: (body: any) => request<import('../types/index.js').Instituicao>('/instituicoes', { method: 'POST', body: JSON.stringify(body) }),
  updateInstituicao: (id: string, body: any) => request<import('../types/index.js').Instituicao>(`/instituicoes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteInstituicao: (id: string) => request<any>(`/instituicoes/${id}`, { method: 'DELETE' }),

  // Contas
  getContas: () => request<import('../types/index.js').Conta[]>('/contas'),
  getSaldoConsolidado: () => request<{ totalSaldoBrl: number; totalContas: number }>('/contas/saldo-consolidado'),
  createConta: (body: any) => request<import('../types/index.js').Conta>('/contas', { method: 'POST', body: JSON.stringify(body) }),
  updateConta: (id: string, body: any) => request<import('../types/index.js').Conta>(`/contas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteConta: (id: string) => request<any>(`/contas/${id}`, { method: 'DELETE' }),

  // Cartões de Crédito
  getCartoes: () => request<import('../types/index.js').CartaoCredito[]>('/cartoes'),
  createCartao: (body: any) => request<import('../types/index.js').CartaoCredito>('/cartoes', { method: 'POST', body: JSON.stringify(body) }),
  updateCartao: (id: string, body: any) => request<import('../types/index.js').CartaoCredito>(`/cartoes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCartao: (id: string) => request<any>(`/cartoes/${id}`, { method: 'DELETE' }),
  getCartaoFatura: (id: string, anoMes?: string) => request<import('../types/index.js').FaturaDetalhe>(`/cartoes/${id}/fatura${anoMes ? `?anoMes=${anoMes}` : ''}`),

  // Compras Parceladas
  getParcelamentos: () => request<import('../types/index.js').CompraParcelada[]>('/parcelamentos'),
  createParcelamento: (body: any) => request<import('../types/index.js').CompraParcelada>('/parcelamentos', { method: 'POST', body: JSON.stringify(body) }),
  deleteParcelamento: (id: string) => request<any>(`/parcelamentos/${id}`, { method: 'DELETE' }),

  // Recorrências (despesas e receitas fixas)
  getRecorrencias: (anoMes?: string) => request<import('../types/index.js').Recorrencia[]>(`/recorrencias${anoMes ? `?anoMes=${anoMes}` : ''}`),
  createRecorrencia: (body: any) => request<import('../types/index.js').Recorrencia>('/recorrencias', { method: 'POST', body: JSON.stringify(body) }),
  updateRecorrencia: (id: string, body: any) => request<import('../types/index.js').Recorrencia>(`/recorrencias/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteRecorrencia: (id: string) => request<any>(`/recorrencias/${id}`, { method: 'DELETE' }),
  lancarRecorrencia: (id: string, anoMes?: string) => request<any>(`/recorrencias/${id}/lancar`, { method: 'POST', body: JSON.stringify({ anoMes }) }),

  // Categorias
  getCategorias: (tipo?: string) => request<{ flat: import('../types/index.js').Categoria[]; tree: import('../types/index.js').Categoria[] }>(`/categorias${tipo ? `?tipo=${tipo}` : ''}`),
  createCategoria: (body: any) => request<import('../types/index.js').Categoria>('/categorias', { method: 'POST', body: JSON.stringify(body) }),
  updateCategoria: (id: string, body: any) => request<import('../types/index.js').Categoria>(`/categorias/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategoria: (id: string) => request<any>(`/categorias/${id}`, { method: 'DELETE' }),

  // Lançamentos
  getLancamentos: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const qs = query.toString();
    return request<{ data: import('../types/index.js').Lancamento[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(`/lancamentos${qs ? `?${qs}` : ''}`);
  },
  createLancamento: (body: any) => request<import('../types/index.js').Lancamento>('/lancamentos', { method: 'POST', body: JSON.stringify(body) }),
  updateLancamento: (id: string, body: any) => request<import('../types/index.js').Lancamento>(`/lancamentos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLancamento: (id: string) => request<any>(`/lancamentos/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardResumo: (anoMes?: string) => request<import('../types/index.js').DashboardResumo>(`/dashboard/resumo${anoMes ? `?anoMes=${anoMes}` : ''}`),
  getGastosPorCategoria: (anoMes?: string) => request<import('../types/index.js').GastoCategoria[]>(`/dashboard/por-categoria${anoMes ? `?anoMes=${anoMes}` : ''}`),
  getEvolucaoMensal: (meses?: number) => request<import('../types/index.js').EvolucaoItem[]>(`/dashboard/evolucao${meses ? `?meses=${meses}` : ''}`),
  getContasAPagar: (anoMes?: string) => request<import('../types/index.js').ContasAPagarResumo>(`/dashboard/contas-a-pagar${anoMes ? `?anoMes=${anoMes}` : ''}`),

  // Fase 3: Investimentos
  getInvestimentos: () => request<import('../types/index.js').PosicaoAtivo[]>('/investimentos'),
  getResumoCarteira: () => request<import('../types/index.js').ResumoCarteira>('/investimentos/resumo'),
  createInvestimento: (body: any) => request<any>('/investimentos', { method: 'POST', body: JSON.stringify(body) }),
  updateInvestimento: (id: string, body: any) => request<any>(`/investimentos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteInvestimento: (id: string) => request<any>(`/investimentos/${id}`, { method: 'DELETE' }),

  getMovimentacoesInvestimento: (investimento_id?: string) => 
    request<import('../types/index.js').MovimentacaoInvestimento[]>(`/investimentos/movimentacoes${investimento_id ? `?investimento_id=${investimento_id}` : ''}`),
  createMovimentacaoInvestimento: (body: any) => request<any>('/investimentos/movimentacoes', { method: 'POST', body: JSON.stringify(body) }),
  deleteMovimentacaoInvestimento: (id: string) => request<any>(`/investimentos/movimentacoes/${id}`, { method: 'DELETE' }),

  // Fase 3: Câmbio
  getUltimaCotacao: (moeda: string) => request<{ moeda: string; data: string; valor: number; fonte: string }>(`/cambio/ultima/${moeda}`),
  getHistoricoCambio: (moeda: string = 'USD', dias: number = 30) => 
    request<import('../types/index.js').HistoricoCambio>(`/cambio/historico?moeda=${moeda}&dias=${dias}`),
  sincronizarCambio: () => request<{ message: string }>('/cambio/sincronizar', { method: 'POST' }),
  calcularGanhoCambial: (body: { moeda_codigo: string; quantidade: number; cotacao_aquisicao: number }) => 
    request<import('../types/index.js').GanhoCambialResultado>('/cambio/calcular-ganho', { method: 'POST', body: JSON.stringify(body) }),

  // Fase 3: Simuladores
  simularInvestimento: (body: { valor_inicial: number; aporte_mensal: number; prazo_meses: number; cenarios: Array<{ nome: string; taxa_anual_pct: number }> }) =>
    request<import('../types/index.js').ResultadoSimulacao>('/simuladores/investimentos', { method: 'POST', body: JSON.stringify(body) }),
  getCenariosPadraoSimulacao: () => request<Array<{ nome: string; taxa_anual_pct: number }>>('/simuladores/cenarios-padrao'),

  // Fase 4: Pessoas / Contatos
  getPessoas: () => request<import('../types/index.js').Pessoa[]>('/pessoas'),
  createPessoa: (body: any) => request<import('../types/index.js').Pessoa>('/pessoas', { method: 'POST', body: JSON.stringify(body) }),
  updatePessoa: (id: string, body: any) => request<import('../types/index.js').Pessoa>(`/pessoas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePessoa: (id: string) => request<any>(`/pessoas/${id}`, { method: 'DELETE' }),

  // Fase 4: Dívidas & Empréstimos
  getDividas: (status?: string, pessoa_id?: string) => {
    const q = new URLSearchParams();
    if (status) q.append('status', status);
    if (pessoa_id) q.append('pessoa_id', pessoa_id);
    const qs = q.toString();
    return request<import('../types/index.js').Divida[]>(`/dividas${qs ? `?${qs}` : ''}`);
  },
  getResumoDividas: () => request<import('../types/index.js').ResumoDividas>('/dividas/resumo'),
  createEmprestimo: (body: any) => request<import('../types/index.js').Divida>('/dividas/emprestimo', { method: 'POST', body: JSON.stringify(body) }),
  updateDivida: (id: string, body: any) => request<import('../types/index.js').Divida>(`/dividas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDivida: (id: string) => request<any>(`/dividas/${id}`, { method: 'DELETE' }),
  darBaixaDivida: (id: string, body: any) => request<import('../types/index.js').Divida>(`/dividas/${id}/baixa`, { method: 'POST', body: JSON.stringify(body) }),
  perdoarDivida: (id: string) => request<import('../types/index.js').Divida>(`/dividas/${id}/perdoar`, { method: 'POST' }),

  // Fase 4: Despesas Compartilhadas
  getDespesasCompartilhadas: () => request<import('../types/index.js').DespesaCompartilhada[]>('/despesas-compartilhadas'),
  createDespesaCompartilhada: (body: any) => request<any>('/despesas-compartilhadas', { method: 'POST', body: JSON.stringify(body) }),
  deleteDespesaCompartilhada: (id: string) => request<any>(`/despesas-compartilhadas/${id}`, { method: 'DELETE' }),

  // Fase 4: PIX
  getChavesPix: () => request<import('../types/index.js').ChavePix[]>('/pix/chaves'),
  createChavePix: (body: any) => request<import('../types/index.js').ChavePix>('/pix/chaves', { method: 'POST', body: JSON.stringify(body) }),
  deleteChavePix: (id: string) => request<any>(`/pix/chaves/${id}`, { method: 'DELETE' }),
  getCobrancasPix: () => request<import('../types/index.js').CobrancaPix[]>('/pix/cobrancas'),
  createCobrancaPix: (body: any) => request<import('../types/index.js').CobrancaPix>('/pix/cobrancas', { method: 'POST', body: JSON.stringify(body) }),
  confirmarCobrancaPix: (id: string, body: { conta_destino_id: string }) => request<any>(`/pix/cobrancas/${id}/confirmar`, { method: 'POST', body: JSON.stringify(body) }),
  deleteCobrancaPix: (id: string) => request<any>(`/pix/cobrancas/${id}`, { method: 'DELETE' }),

  // Fase 5: Simulador de Gastos Multi-Moeda
  simularGastos: (body: any) => request<{ data: import('../types/index.js').ResultadoSimulacaoGasto }>('/simuladores/gastos', { method: 'POST', body: JSON.stringify(body) }),

  // Fase 5: Sistema & Backup
  getMetricasSistema: () => request<{ data: import('../types/index.js').MetricasSistema }>('/sistema/stats'),
  baixarBackupSqlUrl: () => `${BASE_URL}/sistema/backup`,

  // Fase 5: Relatórios & Dashboard Dinâmico
  getDashboardRelatorios: (params?: { dataInicio?: string; dataFim?: string; contaId?: string }) => {
    const q = new URLSearchParams();
    if (params?.dataInicio) q.append('data_inicio', params.dataInicio);
    if (params?.dataFim) q.append('data_fim', params.dataFim);
    if (params?.contaId) q.append('conta_id', params.contaId);
    const qs = q.toString();
    return request<any>(`/relatorios/dashboard${qs ? `?${qs}` : ''}`);
  },
  getUrlCsvLancamentos: (dataInicio?: string, dataFim?: string, contaId?: string) => {
    const q = new URLSearchParams();
    if (dataInicio) q.append('data_inicio', dataInicio);
    if (dataFim) q.append('data_fim', dataFim);
    if (contaId) q.append('conta_id', contaId);
    const qs = q.toString();
    return `${BASE_URL}/relatorios/lancamentos/csv${qs ? `?${qs}` : ''}`;
  },
  getUrlCsvPatrimonio: () => `${BASE_URL}/relatorios/patrimonio/csv`,

  // Câmbio AwesomeAPI & Conversor
  getMoedasCambio: () => request<Array<{ id: string; codigo: string; nome: string; simbolo: string; favorita: boolean; ultima_cotacao_brl?: number }>>('/cambio/moedas'),
  toggleFavoritaCambio: (codigo: string) => request<any>(`/cambio/moedas/${codigo}/favorita`, { method: 'PUT' }),
  converterMoeda: (de: string, para: string, valor: number) => 
    request<{ de: string; para: string; valor_origem: number; cotacao: number; valor_convertido: number }>(`/cambio/converter?de=${de}&para=${para}&valor=${valor}`),

  // Lista de Desejos (Wishlist)
  getItensDesejo: (params?: { status?: string; prioridade?: string; busca?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.prioridade) q.append('prioridade', params.prioridade);
    if (params?.busca) q.append('busca', params.busca);
    const qs = q.toString();
    return request<import('../types/index.js').ItemDesejo[]>(`/lista-desejo${qs ? `?${qs}` : ''}`);
  },
  createItemDesejo: (body: any) => request<import('../types/index.js').ItemDesejo>('/lista-desejo', { method: 'POST', body: JSON.stringify(body) }),
  updateItemDesejo: (id: string, body: any) => request<import('../types/index.js').ItemDesejo>(`/lista-desejo/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteItemDesejo: (id: string) => request<any>(`/lista-desejo/${id}`, { method: 'DELETE' }),
  comprarItemDesejo: (id: string, body?: any) => request<import('../types/index.js').ItemDesejo>(`/lista-desejo/${id}/comprar`, { method: 'POST', body: JSON.stringify(body || {}) }),
  adicionarPrecoItemDesejo: (id: string, body: { data?: string; preco: number; loja?: string; observacao?: string }) => request<import('../types/index.js').ItemDesejo>(`/lista-desejo/${id}/precos`, { method: 'POST', body: JSON.stringify(body) }),
};


