import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingDown, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, 
  ChevronLeft, ChevronRight, CreditCard, Clock, CheckCircle2, Play, Sparkles 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell 
} from 'recharts';
import { api } from '../services/api.js';
import { DashboardResumo, GastoCategoria, EvolucaoItem, Lancamento, ContasAPagarResumo } from '../types/index.js';
import { PrivacyValue } from '../components/common/PrivacyValue.js';
import { usePrivacy } from '../contexts/PrivacyContext.js';
import { CardRegra503020 } from '../components/dashboard/CardRegra503020.js';
import { ModalConfirmarLancamentoRecorrencia } from '../components/recorrencias/ModalConfirmarLancamentoRecorrencia.js';

export const DashboardPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [gastosCategoria, setGastosCategoria] = useState<GastoCategoria[]>([]);
  const [evolucao, setEvolucao] = useState<EvolucaoItem[]>([]);
  const [recentes, setRecentes] = useState<Lancamento[]>([]);
  const [contasAPagar, setContasAPagar] = useState<ContasAPagarResumo | null>(null);

  const [recorrenciaParaLancar, setRecorrenciaParaLancar] = useState<any | null>(null);
  const [isConfirmarLancarOpen, setIsConfirmarLancarOpen] = useState(false);

  const { isPrivate } = usePrivacy();

  const anoMes = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const loadDashboardData = useCallback(async () => {
    try {
      const [resumoData, catData, evolucaoData, lancData, aPagarData] = await Promise.all([
        api.getDashboardResumo(anoMes),
        api.getGastosPorCategoria(anoMes),
        api.getEvolucaoMensal(6),
        api.getLancamentos({ limit: 5 }),
        api.getContasAPagar(anoMes),
      ]);

      setResumo(resumoData);
      setGastosCategoria(catData);
      setEvolucao(evolucaoData);
      setRecentes(lancData.data);
      setContasAPagar(aPagarData);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    }
  }, [anoMes]);

  useEffect(() => {
    loadDashboardData();

    const handleRefresh = () => loadDashboardData();
    window.addEventListener('financeiro:refresh', handleRefresh);
    return () => window.removeEventListener('financeiro:refresh', handleRefresh);
  }, [loadDashboardData]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleAbrirConfirmarLancar = (rec: any) => {
    setRecorrenciaParaLancar(rec);
    setIsConfirmarLancarOpen(true);
  };

  const handleConfirmarLancar = async (id: string, anoMesParam: string, valorCustomizado: number) => {
    await api.lancarRecorrencia(id, anoMesParam, valorCustomizado);
    loadDashboardData();
  };

  const mesFormatado = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Barra de controle de mês */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Visão Geral</h1>
          <p className="text-sm text-slate-400">Resumo financeiro, contas a pagar e comprometimento</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
            title="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-3 text-xs sm:text-sm font-semibold capitalize text-slate-200 min-w-[120px] text-center">
            {mesFormatado}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
            title="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Banner Projeção Saldo Mês Seguinte */}
      <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 flex-shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Saldo Projetado no Mês Que Vem
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                Previsão com Recorrências
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Saldo em conta (<PrivacyValue value={resumo?.saldoConsolidado ?? 0} />) + receitas fixas (<PrivacyValue value={resumo?.totalReceitasRecorrentes ?? 0} />) - faturas e fixas previstas (<PrivacyValue value={(resumo?.totalFaturasMes ?? 0) + (resumo?.totalDespesasRecorrentesConta ?? 0)} />)
            </p>
          </div>
        </div>

        <div className="text-left md:text-right md:border-l md:border-slate-800 md:pl-6 flex-shrink-0">
          <span className="text-xs font-semibold text-slate-400 block">Estimativa no Próximo Mês</span>
          <div className={`text-2xl font-black ${(resumo?.saldoProjetadoMesSeguinte ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            <PrivacyValue value={resumo?.saldoProjetadoMesSeguinte ?? 0} />
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais (5 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Saldo Consolidado */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Saldo Consolidado</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
              <Wallet size={17} />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-100">
              <PrivacyValue value={resumo?.saldoConsolidado ?? 0} />
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Disponível em contas</span>
          </div>
        </div>

        {/* Despesas do Mês */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Despesas do Mês</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <TrendingDown size={17} />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-rose-400">
              <PrivacyValue value={resumo?.totalDespesas ?? 0} />
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {resumo && resumo.variacaoDespesasPercentual !== 0 && (
                <span className={`text-[11px] font-medium flex items-center ${
                  resumo.variacaoDespesasPercentual > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {resumo.variacaoDespesasPercentual > 0 ? (
                    <ArrowUpRight size={13} className="mr-0.5" />
                  ) : (
                    <ArrowDownRight size={13} className="mr-0.5" />
                  )}
                  {Math.abs(resumo.variacaoDespesasPercentual)}%
                </span>
              )}
              <span className="text-[11px] text-slate-500">vs. mês anterior</span>
            </div>
          </div>
        </div>

        {/* Receitas do Mês */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Receitas do Mês</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <TrendingUp size={17} />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-400">
              <PrivacyValue value={resumo?.totalReceitas ?? 0} />
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Entradas confirmadas</span>
          </div>
        </div>

        {/* Contas a Pagar do Mês */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contas a Pagar</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <Clock size={17} />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-300">
              <PrivacyValue value={contasAPagar?.totalPrevistoMes ?? 0} />
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Faturas + fixas no mês</span>
          </div>
        </div>

        {/* Comprometimento Futuro */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Comprometimento</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
              <CreditCard size={17} />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-400">
              <PrivacyValue value={contasAPagar?.totalComprometimentoFuturo ?? 0} />
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {contasAPagar?.parcelasFuturasCount ?? 0} parcelas futuras
            </span>
          </div>
        </div>
      </div>

      {/* Card Regra 50-30-20: Distribuição Salarial com barras decrescentes */}
      <CardRegra503020 regra={resumo?.regra503020} />

      {/* BLOCO NOVO FASE 2: Faturas e Contas a Pagar do Mês (com Previsto vs Já Lançado) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              <span>Faturas e Contas a Pagar deste Mês ({mesFormatado})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Acompanhamento de vencimentos e diferenciação entre itens já lançados e previsões pendentes
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Previsto:</span>
            <div className="text-lg font-black text-amber-300">
              <PrivacyValue value={contasAPagar?.totalPrevistoMes ?? 0} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Coluna 1: Faturas de Cartão de Crédito */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard size={15} />
              <span>Faturas de Cartão</span>
            </h3>

            {!contasAPagar || contasAPagar.faturas.length === 0 ? (
              <div className="p-4 bg-slate-950/50 rounded-2xl text-xs text-slate-500 text-center">
                Nenhum cartão cadastrado.
              </div>
            ) : (
              <div className="space-y-2.5">
                {contasAPagar.faturas.map((fat) => (
                  <div 
                    key={fat.cartao_id}
                    className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: fat.instituicao_cor || '#3b82f6' }}
                      >
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-200">{fat.cartao_apelido}</div>
                        <span className="text-[11px] text-slate-400">
                          Vencimento: dia {fat.dia_vencimento} • {fat.total_itens} itens
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-bold ${fat.paga ? 'text-emerald-400' : 'text-rose-400'}`}>
                        <PrivacyValue value={fat.total_fatura} />
                      </div>
                      <span className={`text-[10px] uppercase font-medium ${fat.paga ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {fat.paga ? '✓ Fatura Paga' : 'Fatura Aberta'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coluna 2: Recorrências Previstas vs Já Lançadas */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock size={15} />
              <span>Contas Fixas & Recorrências</span>
            </h3>

            {!contasAPagar || contasAPagar.recorrencias.length === 0 ? (
              <div className="p-4 bg-slate-950/50 rounded-2xl text-xs text-slate-500 text-center">
                Nenhuma recorrência cadastrada.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {contasAPagar.recorrencias.map((rec) => (
                  <div 
                    key={rec.id}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{rec.descricao}</span>
                        <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded ${
                          rec.tipo === 'receita' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' 
                            : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                        }`}>
                          {rec.tipo === 'receita' ? 'Receita' : 'Despesa'}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          rec.natureza === 'variavel'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                            : 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                        }`}>
                          {rec.natureza === 'variavel' ? 'Variável' : 'Fixo'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Dia {rec.dia_referencia} • {rec.categoria_nome}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-bold">
                        <PrivacyValue 
                          value={rec.valor} 
                          colored 
                          type={rec.tipo}
                          prefix={rec.tipo === 'despesa' ? '- ' : '+ '}
                        />
                      </div>

                      {rec.ja_lancado ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-[11px] font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          <span>Lançado</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAbrirConfirmarLancar(rec)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Efetivar lançamento no mês"
                        >
                          <Play size={11} />
                          <span>Lançar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos de Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evolução Histórica de Gastos (Linha) */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Evolução Mensal (Últimos 6 Meses)</h3>
            <span className="text-xs text-slate-500 font-mono">Agregação pré-calculada</span>
          </div>

          <div className="h-64 w-full">
            {evolucao.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500">
                Sem dados históricos suficientes para exibir evolução.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="despesasGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="receitasGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="anoMes" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => isPrivate ? '••••' : `R$ ${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(val: any) => [isPrivate ? 'R$ ••••' : `R$ ${Number(val).toFixed(2)}`, '']}
                  />
                  <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#receitasGrad)" />
                  <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#despesasGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Despesas por Categoria (Rosca / Pizza) */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Gastos por Categoria</h3>
          <div className="h-48 w-full flex items-center justify-center">
            {gastosCategoria.length === 0 ? (
              <span className="text-xs text-slate-500">Nenhum gasto registrado neste mês</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gastosCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {gastosCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor || '#3b82f6'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    formatter={(val: any) => [isPrivate ? 'R$ ••••' : `R$ ${Number(val).toFixed(2)}`, 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legenda das Categorias */}
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {gastosCategoria.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.cor }} />
                  <span className="text-slate-300 font-medium">{cat.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono">{cat.percentual}%</span>
                  <PrivacyValue value={cat.total} className="text-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lançamentos Recentes */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Últimos Lançamentos</h3>
          <a href="/lancamentos" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Ver todos &rarr;
          </a>
        </div>

        <div className="divide-y divide-slate-800/80">
          {recentes.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Nenhum lançamento recente encontrado. Use o botão (+) para adicionar.
            </div>
          ) : (
            recentes.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: `${item.categoria_cor}25`, color: item.categoria_cor }}
                  >
                    {item.tipo === 'despesa' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-200 leading-tight">{item.descricao}</h4>
                    <span className="text-xs text-slate-400 mt-0.5 inline-block">
                      {item.categoria_nome} {item.subcategoria_nome && `• ${item.subcategoria_nome}`} • {item.cartao_apelido || item.conta_apelido || item.forma_pagamento}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <PrivacyValue
                    value={item.valor}
                    colored
                    prefix={item.tipo === 'despesa' ? '- ' : '+ '}
                    className="text-sm font-bold"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    {new Date(item.data_compra).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ModalConfirmarLancamentoRecorrencia
        isOpen={isConfirmarLancarOpen}
        onClose={() => setIsConfirmarLancarOpen(false)}
        onConfirm={handleConfirmarLancar}
        recorrencia={recorrenciaParaLancar}
        anoMes={anoMes}
      />
    </div>
  );
};
