import React, { useState } from 'react';
import { 
  ShoppingCart, 
  TrendingUp, 
  Heart, 
  Sparkles, 
  CreditCard, 
  Store, 
  History, 
  Zap,
  Wallet,
  Calendar,
  AlertTriangle,
  Percent,
  ArrowRight
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

  // --- Estados do Simulador de Gastos (IDÊNTICO À PÁGINA DE PRODUÇÃO) ---
  const [formDescricao, setFormDescricao] = useState('Notebook ou Viagem');
  const [formValor, setFormValor] = useState('1200');
  const [formMoeda, setFormMoeda] = useState('BRL');
  const [formDataPrevista, setFormDataPrevista] = useState('18/09/2026');
  const [formFormaPagamento, setFormFormaPagamento] = useState<'a_vista' | 'cartao_parcelado'>('a_vista');
  const [formContaOrigem, setFormContaOrigem] = useState('unificado');
  const [formCartao, setFormCartao] = useState('inter');
  const [formNumParcelas, setFormNumParcelas] = useState(6);
  const [formComJuros, setFormComJuros] = useState(false);
  const [formTaxaJuros, setFormTaxaJuros] = useState('2.5');
  const [formTipoJuros, setFormTipoJuros] = useState<'price' | 'simples'>('price');

  // Valores base simulados
  const saldoUnificadoBase = 4212.81;
  const saldoProjetadoBase = 5820.40;
  const limiteCartaoBase = 2900.00;

  // Cálculos matemáticos de simulação em tempo real
  const cotacaoUtilizada = formMoeda === 'USD' ? 5.6840 : formMoeda === 'EUR' ? 6.2190 : 1;
  const valorOriginalNum = Math.max(0, parseFloat(formValor) || 0);
  const valorBrlTotal = valorOriginalNum * cotacaoUtilizada;

  // Cálculo de parcelamento e juros
  const taxaJurosMensalDecimal = formComJuros ? (parseFloat(formTaxaJuros) || 0) / 100 : 0;
  let valorParcelaBrl = valorBrlTotal / formNumParcelas;
  let valorFinalComJurosBrl = valorBrlTotal;

  if (formFormaPagamento === 'cartao_parcelado' && formComJuros && taxaJurosMensalDecimal > 0) {
    if (formTipoJuros === 'price') {
      valorParcelaBrl = (valorBrlTotal * (taxaJurosMensalDecimal * Math.pow(1 + taxaJurosMensalDecimal, formNumParcelas))) / 
        (Math.pow(1 + taxaJurosMensalDecimal, formNumParcelas) - 1);
      valorFinalComJurosBrl = valorParcelaBrl * formNumParcelas;
    } else {
      // Juros simples
      valorFinalComJurosBrl = valorBrlTotal * (1 + taxaJurosMensalDecimal * formNumParcelas);
      valorParcelaBrl = valorFinalComJurosBrl / formNumParcelas;
    }
  }

  const totalJurosBrl = Math.max(0, valorFinalComJurosBrl - valorBrlTotal);
  const percentualJuros = valorBrlTotal > 0 ? (totalJurosBrl / valorBrlTotal) * 100 : 0;

  // Impactos nos saldos
  const saldoAposCompraHoje = formFormaPagamento === 'a_vista' ? saldoUnificadoBase - valorBrlTotal : saldoUnificadoBase;
  const impactoProximoMes = formFormaPagamento === 'a_vista' ? valorBrlTotal : valorParcelaBrl;
  const saldoProjetadoFinal = saldoProjetadoBase - impactoProximoMes;
  const limiteDisponivelAposCompra = limiteCartaoBase - valorBrlTotal;

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
            {/* FEATURE 1: SIMULADOR DE GASTOS & IMPACTO FUTURO (IDÊNTICO À PRODUÇÃO) */}
            {/* ========================================================================= */}
            {activeFeature === 'gastos' && (
              <motion.div
                key="gastos"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header idêntico ao de produção */}
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-emerald-400" />
                    <span>Simulador de Gastos & Impacto Futuro</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Simule compras à vista ou parceladas com juros e veja o impacto imediato no seu saldo atual e no saldo do mês que vem.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Formulário - Coluna da Esquerda (Idêntico ao print 1 e 2) */}
                  <div className="lg:col-span-5 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
                    <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
                      Parâmetros da Compra
                    </h4>

                    <div className="space-y-3.5 text-xs">
                      {/* O QUE VOCÊ PLANEJA COMPRAR? */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          O que você planeja comprar? *
                        </label>
                        <input
                          type="text"
                          value={formDescricao}
                          onChange={e => setFormDescricao(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Notebook ou Viagem"
                        />
                      </div>

                      {/* VALOR * | MOEDA */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                            Valor *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formValor}
                            onChange={e => setFormValor(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                            Moeda
                          </label>
                          <select
                            value={formMoeda}
                            onChange={e => setFormMoeda(e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                          >
                            <option value="BRL">BRL (R$)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>
                      </div>

                      {/* DATA PREVISTA DA COMPRA */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                          Data Prevista da Compra
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formDataPrevista}
                            onChange={e => setFormDataPrevista(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <Calendar size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        </div>
                      </div>

                      {/* FORMA DE PAGAMENTO */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1.5">
                          Forma de Pagamento
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormFormaPagamento('a_vista')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                              formFormaPagamento === 'a_vista'
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>À Vista</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormFormaPagamento('cartao_parcelado')}
                            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                              formFormaPagamento === 'cartao_parcelado'
                                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Cartão Parcelado</span>
                          </button>
                        </div>
                      </div>

                      {/* CONDICIONAL: SE À VISTA -> ORIGEM DO PAGAMENTO */}
                      {formFormaPagamento === 'a_vista' ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                            Origem do Pagamento
                          </label>
                          <select
                            value={formContaOrigem}
                            onChange={e => setFormContaOrigem(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/60 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                          >
                            <option value="unificado">🌐 Saldo Unificado (Todas as Contas — R$ 4212.81)</option>
                            <option value="itau">Itaú Personnalité (Saldo: R$ 2850.00)</option>
                            <option value="btg">BTG Pactual (Saldo: R$ 1362.81)</option>
                          </select>
                        </div>
                      ) : (
                        /* CONDICIONAL: SE CARTÃO PARCELADO (Conforme Print 2) */
                        <div className="space-y-3 pt-1">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                              Cartão de Crédito
                            </label>
                            <select
                              value={formCartao}
                              onChange={e => setFormCartao(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                            >
                              <option value="inter">Cartão de Crédito Inter (Limite: R$ 2900.00)</option>
                              <option value="master">Mastercard Black (Limite: R$ 35000.00)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                              Número de Parcelas
                            </label>
                            <select
                              value={formNumParcelas}
                              onChange={e => setFormNumParcelas(parseInt(e.target.value, 10))}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-bold"
                            >
                              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map(n => (
                                <option key={n} value={n}>{n}x</option>
                              ))}
                            </select>
                          </div>

                          {/* SIMULAR COM JUROS NO PARCELAMENTO (Estilo Print 2) */}
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between">
                              <label htmlFor="chkComJurosPrint" className="text-xs font-semibold text-slate-200 cursor-pointer flex items-center gap-1.5">
                                <Percent size={13} className="text-amber-400" />
                                <span>Simular com Juros no Parcelamento</span>
                              </label>
                              <input
                                type="checkbox"
                                id="chkComJurosPrint"
                                checked={formComJuros}
                                onChange={e => setFormComJuros(e.target.checked)}
                                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                              />
                            </div>

                            {formComJuros && (
                              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-1">Taxa Mensal (% a.m.)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={formTaxaJuros}
                                    onChange={e => setFormTaxaJuros(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 font-bold outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400 mb-1">Amortização</label>
                                  <select
                                    value={formTipoJuros}
                                    onChange={e => setFormTipoJuros(e.target.value as any)}
                                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-100 font-semibold outline-none cursor-pointer"
                                  >
                                    <option value="price">Tabela Price</option>
                                    <option value="simples">Juros Simples</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* BOTÃO SIMULAR IMPACTO -> */}
                      <button
                        type="button"
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all text-xs sm:text-sm mt-2"
                      >
                        <span>Simular Impacto</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Painel de Resultados - Coluna da Direita (Idêntico aos cards de produção) */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    {/* Card 1: Custo Total Projetado */}
                    <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Custo Total Projetado
                        </span>
                        {formComJuros && totalJurosBrl > 0 && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                            +{percentualJuros.toFixed(1)}% de juros
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-100">
                          R$ {valorFinalComJurosBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {formMoeda !== 'BRL' && (
                          <span className="text-xs text-slate-400">
                            ({formMoeda} {valorOriginalNum.toFixed(2)} @ R$ {cotacaoUtilizada.toFixed(4)})
                          </span>
                        )}
                      </div>

                      {formFormaPagamento === 'cartao_parcelado' && (
                        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="font-semibold text-emerald-400">
                            {formNumParcelas}x de R$ {valorParcelaBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {formComJuros && totalJurosBrl > 0 ? (
                            <div className="text-slate-400">
                              Total em juros: <span className="text-amber-400 font-semibold">R$ {totalJurosBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> (À vista: R$ {valorBrlTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Card 2: Previsão de Saldo no Mês Que Vem */}
                    <div className="p-5 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-emerald-400" size={17} />
                        <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                          Previsão de Saldo no Mês Que Vem
                        </h4>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Projeção considerando saldo em conta, receitas fixas recorrentes e as faturas/despesas previstas.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs">
                          <span className="text-[10px] text-slate-400 block">Saldo Sem Esta Compra</span>
                          <div className="text-sm font-bold text-slate-200 mt-0.5">
                            R$ {saldoProjetadoBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            (+) Recorrências: R$ 3.450,00
                          </span>
                        </div>

                        <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs">
                          <span className="text-[10px] text-slate-400 block">Impacto no Mês Que Vem</span>
                          <div className="text-sm font-bold text-rose-400 mt-0.5">
                            - R$ {impactoProximoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {formFormaPagamento === 'a_vista' ? 'Debitado do saldo' : 'Parcela na fatura'}
                          </span>
                        </div>

                        <div className={`p-3 rounded-xl border text-xs ${
                          saldoProjetadoFinal < 0
                            ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                            : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                        }`}>
                          <span className="text-[10px] block font-semibold">Saldo Final Estimado</span>
                          <div className="text-sm font-black mt-0.5">
                            R$ {saldoProjetadoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <span className="text-[10px] opacity-80">No próximo mês</span>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Impacto Imediato no Saldo (se à vista) OU Limite de Cartão (se parcelado) */}
                    {formFormaPagamento === 'a_vista' ? (
                      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
                        <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-emerald-500" />
                          <span>Impacto Imediato no Saldo: Saldo Unificado (Todas as Contas)</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-slate-400">Saldo Atual</span>
                            <div className="text-base font-bold text-slate-100 mt-0.5">
                              R$ {saldoUnificadoBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>

                          <div className={`p-3 rounded-xl border ${
                            saldoAposCompraHoje < 0 
                              ? 'bg-rose-950/40 border-rose-800 text-rose-300' 
                              : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                          }`}>
                            <span className="font-semibold">Saldo Após a Compra</span>
                            <div className="text-base font-bold mt-0.5">
                              R$ {saldoAposCompraHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        {saldoAposCompraHoje < 0 && (
                          <div className="flex items-center gap-2 text-xs text-rose-400 font-medium pt-1">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Atenção: essa compra deixará a conta no vermelho / cheque especial!</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
                        <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-500" />
                          <span>Projeção de Faturas: Cartão de Crédito Inter</span>
                        </h4>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-slate-400">Limite Disponível Atual:</span>
                            <div className="font-bold text-slate-100 mt-0.5 text-sm">
                              R$ {limiteCartaoBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-slate-400">Limite Restante após Compra:</span>
                            <div className={`font-bold mt-0.5 text-sm ${limiteDisponivelAposCompra < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              R$ {limiteDisponivelAposCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Fatura Atual Estimada: R$ 420,00</span>
                          <span className="text-emerald-400 font-bold">+ Parcela: R$ {valorParcelaBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          <span className="text-white font-bold">Fatura Projetada: R$ {(420 + valorParcelaBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}

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
