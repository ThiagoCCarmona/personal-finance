import React, { useState } from 'react';
import { 
  ShoppingCart, 
  TrendingUp, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  CreditCard, 
  Store, 
  History, 
  Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

export const SimulatorsAndWishlistSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<'gastos' | 'juros' | 'wishlist'>('gastos');

  // --- Estados do Simulador de Gastos ---
  const [gastoValor, setGastoValor] = useState(2400);
  const [gastoForma, setGastoForma] = useState<'a_vista' | 'parcelado'>('parcelado');
  const [gastoParcelas, setGastoParcelas] = useState(6);
  const [gastoTaxa] = useState(2.2); // % a.m.
  const [gastoComJuros, setGastoComJuros] = useState(true);

  // Cálculos do simulador de gastos
  const saldoAtualSimulado = 12450.00;
  const saldoProjetadoBase = 8900.00;

  const taxaMensalGasto = gastoComJuros ? gastoTaxa / 100 : 0;
  const parcelaGasto = gastoForma === 'a_vista' 
    ? gastoValor 
    : (taxaMensalGasto > 0 
        ? (gastoValor * (taxaMensalGasto * Math.pow(1 + taxaMensalGasto, gastoParcelas))) / (Math.pow(1 + taxaMensalGasto, gastoParcelas) - 1)
        : gastoValor / gastoParcelas);
  
  const totalPagoGasto = gastoForma === 'a_vista' ? gastoValor : parcelaGasto * gastoParcelas;
  const jurosPagosGasto = Math.max(0, totalPagoGasto - gastoValor);

  const saldoAposGastoHoje = gastoForma === 'a_vista' ? saldoAtualSimulado - gastoValor : saldoAtualSimulado;
  const saldoProjetadoComGasto = gastoForma === 'a_vista' 
    ? saldoProjetadoBase - gastoValor 
    : saldoProjetadoBase - parcelaGasto;

  // --- Estados do Simulador de Juros Compostos ---
  const [jurosInicial, setJurosInicial] = useState(15000);
  const [jurosAporte, setJurosAporte] = useState(1200);
  const [jurosAnos, setJurosAnos] = useState(5);
  const [jurosTaxaAnual, setJurosTaxaAnual] = useState(12.0); // % a.a.

  // Série para gráfico de juros compostos
  const dadosGraficoJuros = React.useMemo(() => {
    const totalMeses = jurosAnos * 12;
    const taxaMensal = Math.pow(1 + jurosTaxaAnual / 100, 1 / 12) - 1;

    let saldo = jurosInicial;
    let investido = jurosInicial;
    const pontos = [];

    for (let m = 0; m <= totalMeses; m++) {
      if (m % 12 === 0 || m === totalMeses) {
        pontos.push({
          ano: `Ano ${m / 12}`,
          totalAcumulado: Math.round(saldo),
          totalInvestido: Math.round(investido),
          lucroJuros: Math.max(0, Math.round(saldo - investido))
        });
      }
      saldo = saldo * (1 + taxaMensal) + jurosAporte;
      investido += jurosAporte;
    }
    return pontos;
  }, [jurosInicial, jurosAporte, jurosAnos, jurosTaxaAnual]);

  const valorFinalAcumulado = dadosGraficoJuros[dadosGraficoJuros.length - 1]?.totalAcumulado || 0;
  const totalProprioInvestido = dadosGraficoJuros[dadosGraficoJuros.length - 1]?.totalInvestido || 0;
  const lucroJurosCompostos = Math.max(0, valorFinalAcumulado - totalProprioInvestido);

  // --- Estados da Wishlist ---
  const [wishlistItens] = useState([
    {
      id: '1',
      nome: 'MacBook Air M3 16GB',
      prioridade: 'alta',
      precoAtual: 7890.00,
      precoMenor: 7499.00,
      lojas: [
        { nome: 'Amazon BR', preco: 7890.00, menor: false },
        { nome: 'Mercado Livre', preco: 7499.00, menor: true },
        { nome: 'Apple Store CDE', preco: 6950.00, menor: false, obs: 'Cotação PTAX $1.220' }
      ],
      categoria: 'Equipamentos (30%)',
      planejadoPara: 'Novembro / Black Friday'
    },
    {
      id: '2',
      nome: 'Cadeira Ergonômica Herman Miller',
      prioridade: 'media',
      precoAtual: 5200.00,
      precoMenor: 4890.00,
      lojas: [
        { nome: 'Graphetic Office', preco: 5200.00, menor: false },
        { nome: 'Representante Curitiba', preco: 4890.00, menor: true }
      ],
      categoria: 'Conforto & Saúde (30%)',
      planejadoPara: 'Janeiro / Bônus Anual'
    }
  ]);

  return (
    <section id="simuladores-desejos" className="py-24 bg-slate-950 border-t border-slate-800/80 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-500/10 blur-[170px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Zap size={14} />
            <span>Decisões Inteligentes Antes de Gastar</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Simuladores Avançados & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Wishlist com Débito Automático
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Nunca mais compre no impulso. Teste o impacto da compra nas contas futuras, compare o custo real dos juros e gerencie seus desejos com histórico de preços em múltiplas lojas.
          </p>
        </div>

        {/* Feature Nav Tabs */}
        <div className="flex justify-center mb-10">
          <div className="p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-center gap-2 shadow-xl">
            <button
              onClick={() => setActiveFeature('gastos')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeFeature === 'gastos'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShoppingCart size={16} />
              <span>1. Simulador de Gastos Futuros</span>
            </button>

            <button
              onClick={() => setActiveFeature('juros')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeFeature === 'juros'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp size={16} />
              <span>2. Simulador de Juros & Tabela Price</span>
            </button>

            <button
              onClick={() => setActiveFeature('wishlist')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeFeature === 'wishlist'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Heart size={16} />
              <span>3. Wishlist & Histórico Multi-Loja</span>
            </button>
          </div>
        </div>

        {/* Content Showcase Window */}
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/70 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <AnimatePresence mode="wait">
            
            {/* ========================================================================= */}
            {/* FEATURE 1: SIMULADOR DE GASTOS & IMPACTO NO SALDO FUTURO */}
            {/* ========================================================================= */}
            {activeFeature === 'gastos' && (
              <motion.div
                key="gastos"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
              >
                {/* Controles da Simulação */}
                <div className="lg:col-span-6 space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2">
                      <ShoppingCart size={14} />
                      <span>Antecipação de Caixa</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      O que acontece se eu comprar isso hoje?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      O sistema analisa seu saldo em conta e suas faturas futuras para dizer se você pode comprar sem comprometer as reservas.
                    </p>
                  </div>

                  {/* Parâmetros */}
                  <div className="space-y-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-400 block mb-1">
                          Valor da Compra (R$)
                        </label>
                        <div className="flex items-center px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold">
                          <span className="text-slate-500 text-xs mr-1">R$</span>
                          <input
                            type="number"
                            value={gastoValor}
                            onChange={(e) => setGastoValor(Math.max(50, Number(e.target.value)))}
                            className="w-full bg-transparent outline-none text-sm font-bold text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-400 block mb-1">
                          Forma de Pagamento
                        </label>
                        <select
                          value={gastoForma}
                          onChange={(e) => setGastoForma(e.target.value as any)}
                          className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-white outline-none cursor-pointer"
                        >
                          <option value="parcelado">Cartão de Crédito Parcelado</option>
                          <option value="a_vista">À Vista (PIX / Conta Corrente)</option>
                        </select>
                      </div>
                    </div>

                    {gastoForma === 'parcelado' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                        <div>
                          <label className="text-xs font-medium text-slate-400 block mb-1">
                            Número de Parcelas
                          </label>
                          <select
                            value={gastoParcelas}
                            onChange={(e) => setGastoParcelas(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none cursor-pointer"
                          >
                            {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map(n => (
                              <option key={n} value={n}>{n}x de R$ {Math.round(gastoValor / n).toLocaleString('pt-BR')}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-400 block mb-1">
                            Possui Juros do Emissor?
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setGastoComJuros(!gastoComJuros)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                gastoComJuros 
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {gastoComJuros ? 'Sim (Com Juros)' : 'Sem Juros'}
                            </button>
                            {gastoComJuros && (
                              <span className="text-xs text-slate-400">{gastoTaxa}% a.m.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Painel de Impacto Imediato */}
                <div className="lg:col-span-6 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Diagnóstico do Impacto Financeiro
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                        Margem Positiva
                      </span>
                    </div>

                    {/* Cards de Comparativo Antes e Depois */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-xs text-slate-400 block">Saldo em Conta Hoje</span>
                        <div className="text-xl font-bold text-white mt-1">
                          R$ {saldoAposGastoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {gastoForma === 'a_vista' ? `Redução de R$ ${gastoValor}` : 'Preservado (parcelado no cartão)'}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                        <span className="text-xs text-slate-400 block">Saldo no Mês Que Vem</span>
                        <div className={`text-xl font-bold mt-1 ${saldoProjetadoComGasto >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          R$ {saldoProjetadoComGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {gastoForma === 'parcelado' ? `Absorve parcela de R$ ${Math.round(parcelaGasto)}` : 'Já debitado à vista'}
                        </span>
                      </div>
                    </div>

                    {/* Alerta de Inteligência */}
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Compra Aprovada pelo seu Orçamento:</strong> Seu saldo do mês que vem continuará positivo com folga suficiente para cobrir despesas fixas. 
                        {gastoComJuros && jurosPagosGasto > 0 && (
                          <span className="block mt-1 text-amber-300">
                            Atenção: Você pagará R$ {Math.round(jurosPagosGasto)} em juros. Se tiver reserva em CDI, considere pagar à vista!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-900 text-xs text-slate-500 flex items-center justify-between">
                    <span>Recurso exclusivo nativo do FinanSmart Pro</span>
                    <span className="text-emerald-400 font-semibold">Zero Surpresas na Fatura</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* FEATURE 2: SIMULADOR DE JUROS COMPOSTOS & TABELA PRICE */}
            {/* ========================================================================= */}
            {activeFeature === 'juros' && (
              <motion.div
                key="juros"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  
                  {/* Controles de Investimento e Juros */}
                  <div className="lg:col-span-5 space-y-5">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-2">
                        <TrendingUp size={14} />
                        <span>Poder dos Juros Compostos</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white">
                        Construção de Patrimônio & Metas
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-1">
                        Veja quanto seu dinheiro rende ao longo do tempo com aportes regulares e juros trabalhando a seu favor.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Aporte Inicial (R$)</label>
                        <input
                          type="number"
                          value={jurosInicial}
                          onChange={(e) => setJurosInicial(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold text-sm outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Aporte Mensal (R$)</label>
                        <input
                          type="number"
                          value={jurosAporte}
                          onChange={(e) => setJurosAporte(Math.max(0, Number(e.target.value)))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold text-sm outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Prazo (Anos)</label>
                          <select
                            value={jurosAnos}
                            onChange={(e) => setJurosAnos(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white outline-none cursor-pointer"
                          >
                            {[1, 2, 3, 5, 10, 15, 20].map(a => (
                              <option key={a} value={a}>{a} anos</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Rentabilidade Anual</label>
                          <div className="flex items-center px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400">
                            <input
                              type="number"
                              step="0.5"
                              value={jurosTaxaAnual}
                              onChange={(e) => setJurosTaxaAnual(Math.max(1, Number(e.target.value)))}
                              className="w-full bg-transparent outline-none text-emerald-400 font-bold"
                            />
                            <span>% a.a.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resumo dos Números */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block">Total Investido por Você</span>
                        <div className="text-base font-bold text-white mt-1">
                          R$ {totalProprioInvestido.toLocaleString('pt-BR')}
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                        <span className="text-[11px] text-emerald-400 block">Ganho em Juros</span>
                        <div className="text-base font-bold text-emerald-400 mt-1">
                          + R$ {lucroJurosCompostos.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de Evolução Patrimonial */}
                  <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Evolução do Patrimônio Acumulado</h4>
                        <span className="text-xs text-slate-400">Projeção ano a ano com aportes reinvestidos</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Patrimônio Estimado</span>
                        <span className="text-xl font-extrabold text-emerald-400">
                          R$ {valorFinalAcumulado.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dadosGraficoJuros}>
                          <defs>
                            <linearGradient id="corPatrimonio" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="ano" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                            formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                          />
                          <Area type="monotone" dataKey="totalAcumulado" stroke="#10b981" strokeWidth={2} fill="url(#corPatrimonio)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                      <span>Rentabilidade composta real com aportes mensais</span>
                      <span className="text-indigo-400 font-semibold">Simulador 100% Gratuito na Demo</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* FEATURE 3: WISHLIST (LISTA DE DESEJOS) COM HISTÓRICO & DÉBITO DIRETO */}
            {/* ========================================================================= */}
            {activeFeature === 'wishlist' && (
              <motion.div
                key="wishlist"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-semibold mb-1.5">
                      <Heart size={14} />
                      <span>Compras Conscientes & Desejos</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      Lista de Desejos com Histórico de Preços por Loja
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Evite comprar por impulso. Cadastre o que você quer comprar, monitore preços em múltiplos sites e, quando for a hora certa, compre com débito automático no financeiro!
                    </p>
                  </div>
                </div>

                {/* Grid de Cards de Desejos Reais Simulados */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {wishlistItens.map((item) => (
                    <div 
                      key={item.id}
                      className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300">
                              Prioridade {item.prioridade}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              Meta: {item.planejadoPara}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-white mt-1.5">{item.nome}</h4>
                          <span className="text-xs text-emerald-400 font-semibold">{item.categoria}</span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Melhor Preço</span>
                          <span className="text-xl font-black text-white">
                            R$ {item.precoMenor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Tabela de Lojas Monitoradas */}
                      <div className="space-y-2 pt-2 border-t border-slate-850">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Comparação de Preços por Loja:
                        </span>
                        
                        {item.lojas.map((loja, idx) => (
                          <div 
                            key={idx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                              loja.menor 
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' 
                                : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Store size={14} className={loja.menor ? 'text-emerald-400' : 'text-slate-500'} />
                              <span className="font-semibold">{loja.nome}</span>
                              {loja.obs && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {loja.obs}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-bold">
                                R$ {loja.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {loja.menor && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-bold">
                                  Menor Preço
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Botão de Débito Automático no Sistema */}
                      <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <History size={13} />
                          <span>Histórico de preços salvo</span>
                        </div>

                        <div className="px-4 py-2 rounded-xl bg-emerald-600/90 text-white text-xs font-semibold shadow-md flex items-center gap-1.5">
                          <CreditCard size={14} />
                          <span>Comprar & Debitar no Sistema</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rodapé da Wishlist */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-400 shrink-0" />
                    <span>
                      Integrado à regra 50-30-20: ao comprar um desejo, ele debita da sua cota de <strong>30% (Estilo de Vida)</strong> automaticamente!
                    </span>
                  </div>
                  <span className="text-emerald-400 font-semibold shrink-0">
                    Disponível na Demonstração Grátis
                  </span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
