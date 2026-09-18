import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  LayoutDashboard, 
  Coins, 
  Users, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  QrCode, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ShoppingCart,
  Heart
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

interface AppMockupPreviewProps {
  onOpenDemo: () => void;
  loadingDemo?: boolean;
}

export const AppMockupPreview: React.FC<AppMockupPreviewProps> = ({ onOpenDemo, loadingDemo }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cambio' | 'social' | 'cartoes' | 'wishlist' | 'simulador'>('dashboard');
  const [privacyMode, setPrivacyMode] = useState(false);

  const formatMoney = (value: number, currency: string = 'BRL') => {
    if (privacyMode) return '••••••••';
    if (currency === 'USD') return `$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (currency === 'ARS') return `$ARS ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const chartData = [
    { mes: 'Jan', receitas: 18500, despesas: 8200 },
    { mes: 'Fev', receitas: 19200, despesas: 9100 },
    { mes: 'Mar', receitas: 22400, despesas: 11400 },
    { mes: 'Abr', receitas: 20100, despesas: 8700 },
    { mes: 'Mai', receitas: 24800, despesas: 10200 },
    { mes: 'Jun', receitas: 26500, despesas: 9800 },
  ];

  return (
    <div id="mockup" className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      
      {/* Glow Effect Behind Window */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-72 bg-emerald-500/15 blur-[120px] pointer-events-none rounded-full" />

      {/* Header Info */}
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Interface Real em Ação</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Explore o Sistema por Dentro
        </h2>
        <p className="text-slate-400 text-sm sm:text-base">
          Uma plataforma limpa, ultra veloz e projetada para quem precisa de controle patrimonial rigoroso, multimoedas e divisão de despesas sem estresse.
        </p>
      </div>

      {/* Mockup Window Container */}
      <div className="relative rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl overflow-hidden transition-all">
        
        {/* Window Top Bar (macOS style) */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Traffic Light Dots */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline-block">
              https://app.finansmart.pro/{activeTab}
            </span>
          </div>

          {/* Controls: Privacy Toggle + Demo Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                privacyMode 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Clique para testar o Modo Privacidade instantâneo"
            >
              {privacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden xs:inline">Modo Privacidade:</span>
              <span className="font-bold">{privacyMode ? 'ATIVO' : 'DESATIVADO'}</span>
            </button>

            <button
              onClick={onOpenDemo}
              disabled={loadingDemo}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <span>{loadingDemo ? 'Entrando...' : 'Entrar no Sistema'}</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900/40 border-b border-slate-800/80 px-4 sm:px-6 flex overflow-x-auto scrollbar-none gap-2 py-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <LayoutDashboard size={16} />
            <span>1. Dashboard & Patrimônio</span>
          </button>

          <button
            onClick={() => setActiveTab('cambio')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'cambio'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Coins size={16} />
            <span>2. Câmbio PTAX & Fronteira</span>
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'social'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users size={16} />
            <span>3. Rachar Conta & PIX BR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('cartoes')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'cartoes'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CreditCard size={16} />
            <span>4. Cartões & Faturas</span>
          </button>

          <button
            onClick={() => setActiveTab('simulador')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'simulador'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShoppingCart size={16} />
            <span>5. Simulador de Gastos & Juros</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === 'wishlist'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Heart size={16} />
            <span>6. Wishlist & Preços</span>
          </button>
        </div>

        {/* Tab Content Display Area */}
        <div className="p-4 sm:p-8 min-h-[440px] bg-slate-950">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 font-medium">Patrimônio Líquido</span>
                    <div className="text-2xl font-bold text-white mt-1">
                      {formatMoney(381840.50)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-400 mt-2">
                      <TrendingUp size={14} />
                      <span>+14.2% no acumulado</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 font-medium">Saldo em Contas</span>
                    <div className="text-2xl font-bold text-emerald-400 mt-1">
                      {formatMoney(171840.50)}
                    </div>
                    <span className="text-xs text-slate-500 mt-2 block">Itaú, BTG & Dinheiro</span>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 font-medium">Carteira de Investimentos</span>
                    <div className="text-2xl font-bold text-indigo-400 mt-1">
                      {formatMoney(210000.00)}
                    </div>
                    <span className="text-xs text-slate-500 mt-2 block">Renda Fixa, Ações & FIIs</span>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400 font-medium">Faturas em Aberto</span>
                    <div className="text-2xl font-bold text-rose-400 mt-1">
                      {formatMoney(6480.20)}
                    </div>
                    <span className="text-xs text-slate-500 mt-2 block">3 cartões ativos</span>
                  </div>
                </div>

                {/* Evolution Chart + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Chart */}
                  <div className="lg:col-span-2 p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">Evolução Mensal (Receitas vs Despesas)</h4>
                        <span className="text-xs text-slate-500">Fluxo de caixa consolidado do semestre</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Receitas
                        </span>
                        <span className="flex items-center gap-1 text-rose-400">
                          <span className="w-2 h-2 rounded-full bg-rose-400" /> Despesas
                        </span>
                      </div>
                    </div>
                    
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="mes" stroke="#64748b" fontSize={12} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                            formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']}
                          />
                          <Area type="monotone" dataKey="receitas" stroke="#10b981" fillOpacity={1} fill="url(#gradReceitas)" strokeWidth={2} />
                          <Area type="monotone" dataKey="despesas" stroke="#f43f5e" fillOpacity={1} fill="url(#gradDespesas)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Accounts List */}
                  <div className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-3">
                    <h4 className="text-sm font-semibold text-white">Contas e Carteiras</h4>
                    <div className="space-y-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                            ITAU
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Itaú Personnalité</div>
                            <div className="text-[10px] text-slate-500">Conta Corrente</div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">{formatMoney(84320.00)}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                            BTG
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">BTG Pactual</div>
                            <div className="text-[10px] text-slate-500">Investimento & Reserva</div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">{formatMoney(75400.00)}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                            USD
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">Dólar Espécie (Viagem)</div>
                            <div className="text-[10px] text-slate-500">Carteira Física</div>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-teal-300">{formatMoney(2200.00, 'USD')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: CÂMBIO PTAX */}
            {activeTab === 'cambio' && (
              <motion.div
                key="cambio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900/80 border border-emerald-500/30 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Dólar Comercial (USD)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">BACEN PTAX</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-2">
                      R$ 5,6840
                    </div>
                    <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <ArrowUpRight size={14} /> +0.35% hoje
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2 block">Referência oficial para compras no Paraguai (CDE)</span>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-cyan-500/30 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Peso Argentino (ARS)</span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[10px]">BACEN PTAX</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-2">
                      R$ 0,0058
                    </div>
                    <div className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <ArrowDownRight size={14} /> -0.12% hoje
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2 block">Referência para Puerto Iguazú (Jantares e Combustível)</span>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-indigo-500/30 rounded-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Euro (EUR)</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[10px]">BACEN PTAX</span>
                    </div>
                    <div className="text-2xl font-bold text-white mt-2">
                      R$ 6,2190
                    </div>
                    <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <ArrowUpRight size={14} /> +0.18% hoje
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2 block">Média Móvel MM7: R$ 6,2040</span>
                  </div>
                </div>

                {/* Border Calculator Simulator */}
                <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Coins className="text-emerald-400" size={20} />
                      <h4 className="text-sm font-bold text-white">
                        Simulador de Compra na Fronteira & Ganho Cambial
                      </h4>
                    </div>
                    <span className="text-xs text-slate-400">
                      Simulação real: Câmbio Oficial BACEN vs Spread do Cartão
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">Item Adquirido em CDE</span>
                      <div className="text-sm font-semibold text-white mt-1">iPhone 16 Pro 256GB</div>
                      <span className="text-xs text-teal-400 font-mono">$ 1.099,00 USD</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">No Dinheiro / PTAX BACEN</span>
                      <div className="text-sm font-semibold text-emerald-400 mt-1">
                        {formatMoney(6246.71)}
                      </div>
                      <span className="text-[10px] text-slate-500">Cotação R$ 5,6840 s/ IOF bancário</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-xs text-slate-400">Economia Apurada no App</span>
                      <div className="text-sm font-semibold text-emerald-300 mt-1">
                        {formatMoney(812.40)} economizados
                      </div>
                      <span className="text-[10px] text-emerald-400">Vs cartão de crédito com spread 5.5% + IOF</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: SOCIAL & PIX BR CODE */}
            {activeTab === 'social' && (
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Expense Breakdown */}
                  <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white">Despesa Coletiva: Jantar Puerto Iguazú</h4>
                        <span className="text-xs text-slate-400">Restaurante El Quincho del Tío Querido (Argentina)</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                        4 Pessoas
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Valor Total Pago por Você (no cartão):</span>
                      <span className="text-base font-bold text-white">{formatMoney(840.00)}</span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cotas Individuais dos Amigos:</span>
                      
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">Lucas Mendes</div>
                          <div className="text-[10px] text-slate-500">Cota 1/4 (Jantar + Vinho Malbec)</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-400">{formatMoney(210.00)}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Pendente</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">Mariana Costa</div>
                          <div className="text-[10px] text-slate-500">Cota 1/4 (Jantar + Vinho Malbec)</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-400">{formatMoney(210.00)}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Quitado via PIX
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PIX EMVCo QR Code Box */}
                  <div className="p-5 bg-slate-900/80 border border-emerald-500/30 rounded-2xl flex flex-col items-center text-center justify-between">
                    <div>
                      <div className="inline-flex p-2 rounded-xl bg-emerald-500/10 text-emerald-400 mb-2">
                        <QrCode size={24} />
                      </div>
                      <h4 className="text-sm font-bold text-white">Cobrança PIX Direta</h4>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Padrão oficial EMVCo / BR Code do Banco Central. Sem taxas nem intermediários.
                      </p>
                    </div>

                    <div className="my-3 p-3 bg-white rounded-2xl shadow-lg shadow-emerald-500/10">
                      {/* Simulated QR Code Pattern */}
                      <div className="w-28 h-28 bg-slate-900 rounded-lg flex items-center justify-center p-1 relative overflow-hidden">
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-0.5 p-1">
                          {Array.from({ length: 36 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`rounded-xs ${i % 2 === 0 || i % 5 === 0 ? 'bg-white' : 'bg-slate-900'}`} 
                            />
                          ))}
                        </div>
                        <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center text-white font-bold text-[10px] z-10 shadow">
                          PIX
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => alert('Chave PIX Copia-e-Cola copiada com sucesso!')}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors"
                    >
                      Copiar Código Copia-e-Cola
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 4: CARTÕES & FATURAS */}
            {activeTab === 'cartoes' && (
              <motion.div
                key="cartoes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Card Visual 1 */}
                  <div className="p-6 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border border-slate-700 shadow-xl relative overflow-hidden space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400">Itaú Personnalité</span>
                        <h4 className="text-lg font-bold text-white">Mastercard Black</h4>
                      </div>
                      <div className="w-10 h-6 rounded bg-amber-400/80 flex items-center justify-center font-bold text-[10px] text-slate-950">
                        BLACK
                      </div>
                    </div>

                    <div className="font-mono text-sm tracking-widest text-slate-300">
                      •••• •••• •••• 8842
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fatura Atual (Vence 10/10)</span>
                        <span className="font-bold text-rose-400 text-sm">{formatMoney(4290.50)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Limite Disponível</span>
                        <span className="font-bold text-emerald-400 text-sm">{formatMoney(35709.50)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Visual 2 */}
                  <div className="p-6 rounded-3xl bg-gradient-to-tr from-purple-950 via-slate-900 to-slate-900 border border-purple-800/50 shadow-xl relative overflow-hidden space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] tracking-widest uppercase font-bold text-purple-300">Nubank</span>
                        <h4 className="text-lg font-bold text-white">Ultravioleta Metal</h4>
                      </div>
                      <div className="w-10 h-6 rounded bg-purple-500/30 border border-purple-400/40 flex items-center justify-center font-bold text-[10px] text-purple-200">
                        UV
                      </div>
                    </div>

                    <div className="font-mono text-sm tracking-widest text-slate-300">
                      •••• •••• •••• 3190
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-purple-900/60 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Fatura Atual (Vence 25/10)</span>
                        <span className="font-bold text-rose-400 text-sm">{formatMoney(2189.70)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Melhor Dia de Compra</span>
                        <span className="font-bold text-emerald-300 text-sm">Dia 18 (Hoje!)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Installments Table */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                    Parcelamentos e Comprometimento Futuro
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Notebook Gamer (CDE)</span>
                      <div className="font-bold text-white mt-1">Parcela 03/10</div>
                      <span className="text-slate-500 text-[10px]">R$ 450,00/mês até Dez</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Seguro Automotivo</span>
                      <div className="font-bold text-white mt-1">Parcela 05/06</div>
                      <span className="text-slate-500 text-[10px]">R$ 380,00/mês até Nov</span>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-slate-400">Passagens Buenos Aires</span>
                      <div className="font-bold text-white mt-1">Parcela 02/08</div>
                      <span className="text-slate-500 text-[10px]">R$ 290,00/mês até Fev</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 5: SIMULADOR DE GASTOS & JUROS */}
            {activeTab === 'simulador' && (
              <motion.div
                key="simulador"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900/80 border border-emerald-500/30 rounded-2xl">
                    <span className="text-xs text-slate-400">Simulação: TV 65" 4K OLED</span>
                    <div className="text-xl font-bold text-white mt-1">{formatMoney(4500.00)}</div>
                    <span className="text-[11px] text-emerald-400 mt-2 block">10x de R$ 498,20 (com juros Price)</span>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
                    <span className="text-xs text-slate-400">Saldo Livre Mês Seguinte</span>
                    <div className="text-xl font-bold text-emerald-400 mt-1">{formatMoney(8402.10)}</div>
                    <span className="text-[11px] text-slate-500 mt-2 block">Aguenta a parcela com folga</span>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-amber-500/30 rounded-2xl">
                    <span className="text-xs text-slate-400">Custo Total dos Juros</span>
                    <div className="text-xl font-bold text-amber-300 mt-1">{formatMoney(482.00)}</div>
                    <span className="text-[11px] text-slate-500 mt-2 block">Economize pagando à vista com desconto</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <span>Simula faturas futuras em moeda nacional ou moeda estrangeira com PTAX do Banco Central.</span>
                  <span className="text-emerald-400 font-semibold">Testar na Conta Demo</span>
                </div>
              </motion.div>
            )}

            {/* TAB 6: WISHLIST & PREÇOS */}
            {activeTab === 'wishlist' && (
              <motion.div
                key="wishlist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase">Prioridade Alta</span>
                        <h5 className="font-bold text-white text-sm mt-1">PlayStation 5 Pro</h5>
                        <span className="text-xs text-slate-500">Categoria: Lazer & Desejos (30%)</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">{formatMoney(5899.00)}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                      <span>Amazon: R$ 6.299 • Mercado Livre: R$ 5.899</span>
                      <span className="text-emerald-400 font-semibold">Menor Preço Detectado</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase">Prioridade Média</span>
                        <h5 className="font-bold text-white text-sm mt-1">Monitor Dell UltraSharp 32" 4K</h5>
                        <span className="text-xs text-slate-500">Categoria: Trabalho & Setup (30%)</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">{formatMoney(4100.00)}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 flex justify-between">
                      <span>Loja Dell Oficial: R$ 4.499 • Kabum: R$ 4.100</span>
                      <span className="text-emerald-400 font-semibold">Histórico de Queda -8%</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                  <span>Ao clicar em "Comprar", o sistema debita do saldo da conta ou lança na fatura do cartão automaticamente.</span>
                  <span className="font-bold">Zero Retrabalho</span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Mockup Bottom Banner */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h5 className="text-sm font-bold text-white">
                Gostou do sistema? Você pode testar tudo isso agora mesmo!
              </h5>
              <p className="text-xs text-slate-400">
                Acesse a conta de demonstração com R$ 380.000,00 de patrimônio simulado e teste cada recurso.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenDemo}
            disabled={loadingDemo}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 shrink-0"
          >
            <Sparkles size={15} />
            <span>{loadingDemo ? 'Carregando Demo...' : 'Acessar Conta de Teste Grátis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
