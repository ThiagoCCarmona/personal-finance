import React, { useState, useMemo } from 'react';
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
  ArrowRight,
  Calculator,
  Table as TableIcon,
  BarChart3,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
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

  // --- Estados do Simulador de Juros Compostos (MOTOR COMPLETO IDÊNTICO À PRODUÇÃO) ---
  const saldoUnificadoSimuladoJuros = 18450.00;
  const [jurosValorInicial, setJurosValorInicial] = useState<string>('10000');
  const [jurosAporteMensal, setJurosAporteMensal] = useState<string>('1000');
  const [jurosTaxa, setJurosTaxa] = useState<string>('11.75');
  const [jurosTipoTaxa, setJurosTipoTaxa] = useState<'anual' | 'mensal'>('anual');
  const [jurosPrazo, setJurosPrazo] = useState<string>('5');
  const [jurosTipoPrazo, setJurosTipoPrazo] = useState<'anos' | 'meses'>('anos');
  const [jurosInflacaoAnual, setJurosInflacaoAnual] = useState<string>('4.5');
  const [jurosTipoTributacao, setJurosTipoTributacao] = useState<'regressivo' | 'isento' | 'fixo'>('regressivo');
  const [jurosAliquotaFixa, setJurosAliquotaFixa] = useState<string>('15');
  const [jurosVisualizacaoTabela, setJurosVisualizacaoTabela] = useState<'ano' | 'mes'>('ano');

  // Predefinições de Mercado
  const aplicarPredefinicaoJuros = (_nome: string, taxa: string, tipo: 'anual' | 'mensal', trib: 'regressivo' | 'isento') => {
    setJurosTaxa(taxa);
    setJurosTipoTaxa(tipo);
    setJurosTipoTributacao(trib);
  };

  // Cálculo Dinâmico em Memória (100% fiel ao SimuladorPage.tsx)
  const calculoJuros = useMemo(() => {
    const vInicial = Math.max(0, parseFloat(jurosValorInicial) || 0);
    const vMensal = Math.max(0, parseFloat(jurosAporteMensal) || 0);
    const pAnos = jurosTipoPrazo === 'anos' ? (parseFloat(jurosPrazo) || 0) : (parseFloat(jurosPrazo) || 0) / 12;
    const totalMeses = Math.max(1, Math.round(pAnos * 12));

    // Converte taxa para taxa mensal efetiva
    const tJurosNum = (parseFloat(jurosTaxa) || 0) / 100;
    let taxaMensal = 0;
    if (jurosTipoTaxa === 'anual') {
      taxaMensal = Math.pow(1 + tJurosNum, 1 / 12) - 1;
    } else {
      taxaMensal = tJurosNum;
    }

    // Inflação mensal
    const infAnualNum = (parseFloat(jurosInflacaoAnual) || 0) / 100;
    const inflacaoMensal = Math.pow(1 + infAnualNum, 1 / 12) - 1;

    let saldoAcumulado = vInicial;
    let totalInvestido = vInicial;
    let fatorInflacao = 1;

    const serieMensal: Array<{
      mes: number;
      ano: number;
      label: string;
      investido: number;
      jurosMes: number;
      jurosAcumulados: number;
      saldoBruto: number;
      saldoReal: number;
    }> = [];

    for (let m = 1; m <= totalMeses; m++) {
      const jurosDoMes = saldoAcumulado * taxaMensal;
      saldoAcumulado = saldoAcumulado + jurosDoMes + vMensal;
      totalInvestido += vMensal;
      fatorInflacao *= (1 + inflacaoMensal);

      const jurosTotaisAteAgora = Math.max(0, saldoAcumulado - totalInvestido);
      const saldoAjustadoInflacao = saldoAcumulado / fatorInflacao;

      serieMensal.push({
        mes: m,
        ano: Math.ceil(m / 12),
        label: m % 12 === 0 ? `Ano ${m / 12}` : `Mês ${m}`,
        investido: Math.round(totalInvestido * 100) / 100,
        jurosMes: Math.round(jurosDoMes * 100) / 100,
        jurosAcumulados: Math.round(jurosTotaisAteAgora * 100) / 100,
        saldoBruto: Math.round(saldoAcumulado * 100) / 100,
        saldoReal: Math.round(saldoAjustadoInflacao * 100) / 100,
      });
    }

    const valorFinalBruto = saldoAcumulado;
    const totalJurosGanhos = Math.max(0, valorFinalBruto - totalInvestido);

    // Cálculo do Imposto de Renda
    let aliquotaIr = 0;
    if (jurosTipoTributacao === 'isento') {
      aliquotaIr = 0;
    } else if (jurosTipoTributacao === 'fixo') {
      aliquotaIr = (parseFloat(jurosAliquotaFixa) || 0) / 100;
    } else {
      // Regressivo por tempo em dias (~30 dias por mês)
      const dias = totalMeses * 30;
      if (dias <= 180) aliquotaIr = 0.225;
      else if (dias <= 360) aliquotaIr = 0.20;
      else if (dias <= 720) aliquotaIr = 0.175;
      else aliquotaIr = 0.15;
    }

    const irEstimado = totalJurosGanhos * aliquotaIr;
    const valorLiquido = valorFinalBruto - irEstimado;
    const valorRealLiquido = valorLiquido / fatorInflacao;

    // Renda passiva mensal estimada no final mantendo o principal
    const rendaMensalPassiva = valorLiquido * taxaMensal;

    // Série resumida anual para gráfico e tabela
    const serieAnual = serieMensal.filter(item => item.mes % 12 === 0 || item.mes === totalMeses);

    const lucroLiquidoNovo = Math.round(Math.max(0, valorLiquido - vInicial) * 100) / 100;
    const crescimentoSobreInicial = vInicial > 0 ? ((lucroLiquidoNovo / vInicial) * 100).toFixed(1) : '100';

    return {
      totalMeses,
      taxaMensalPct: (taxaMensal * 100).toFixed(2),
      taxaAnualPct: ((Math.pow(1 + taxaMensal, 12) - 1) * 100).toFixed(2),
      totalInvestido: Math.round(totalInvestido * 100) / 100,
      totalJurosGanhos: Math.round(totalJurosGanhos * 100) / 100,
      valorFinalBruto: Math.round(valorFinalBruto * 100) / 100,
      aliquotaIrPct: (aliquotaIr * 100).toFixed(1),
      irEstimado: Math.round(irEstimado * 100) / 100,
      valorLiquido: Math.round(valorLiquido * 100) / 100,
      valorRealLiquido: Math.round(valorRealLiquido * 100) / 100,
      rendaMensalPassiva: Math.round(rendaMensalPassiva * 100) / 100,
      lucroLiquidoNovo,
      crescimentoSobreInicial,
      rentabilidadeTotalPct: totalInvestido > 0 ? ((totalJurosGanhos / totalInvestido) * 100).toFixed(1) : '0',
      serieMensal,
      serieAnual
    };
  }, [jurosValorInicial, jurosAporteMensal, jurosTaxa, jurosTipoTaxa, jurosPrazo, jurosTipoPrazo, jurosInflacaoAnual, jurosTipoTributacao, jurosAliquotaFixa]);

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
            {/* FEATURE 2: SIMULADOR DE JUROS COMPOSTOS & PROJEÇÃO PATRIMONIAL */}
            {/* ========================================================================= */}
            {activeFeature === 'juros' && (
              <motion.div
                key="juros"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Header Idêntico ao Sistema Real */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                      <Calculator className="text-emerald-400 w-6 h-6" />
                      <span>Simulador Completo de Juros Compostos</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Planeje seus objetivos financeiros com controle total de taxas, aportes, inflação e imposto de renda.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                      <Sparkles size={12} /> Cálculo Realtime
                    </span>
                    <a
                      href="/login?demo=true"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-slate-300 text-xs font-semibold transition"
                    >
                      <span>Abrir na Demo</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {/* Sugestões Rápidas de Mercado */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <span className="text-xs font-semibold uppercase text-slate-400 shrink-0 flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-400" />
                    Cenários rápidos:
                  </span>
                  <button
                    type="button"
                    onClick={() => aplicarPredefinicaoJuros('100% CDI', '10.50', 'anual', 'regressivo')}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap"
                  >
                    100% CDI (10,5% a.a.)
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPredefinicaoJuros('CDB 110%', '11.55', 'anual', 'regressivo')}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap"
                  >
                    CDB 110% CDI (11,55% a.a.)
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPredefinicaoJuros('LCI/LCA', '9.25', 'anual', 'isento')}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-xs font-medium text-emerald-400 hover:text-white transition whitespace-nowrap"
                  >
                    LCI/LCA Isento (9,25% a.a.)
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPredefinicaoJuros('FIIs / Dividendos', '0.85', 'mensal', 'isento')}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-xs font-medium text-purple-400 hover:text-white transition whitespace-nowrap"
                  >
                    FIIs / Ações (0,85% a.m. isento)
                  </button>
                  <button
                    type="button"
                    onClick={() => aplicarPredefinicaoJuros('Poupança', '6.17', 'anual', 'isento')}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-white transition whitespace-nowrap"
                  >
                    Poupança (6,17% a.a.)
                  </button>
                </div>

                {/* Formulário de Configuração dos Parâmetros */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <TrendingUp size={15} className="text-emerald-400" />
                    Configuração Personalizada dos Parâmetros
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {/* Aporte Inicial */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">
                          Aporte Inicial (R$)
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono" title="Saldo somado demonstrativo">
                          Saldo: R$ {saldoUnificadoSimuladoJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        value={jurosValorInicial}
                        onChange={e => setJurosValorInicial(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5">
                          <Wallet size={10} /> Saldo:
                        </span>
                        {[
                          { label: '10%', val: 0.10 },
                          { label: '25%', val: 0.25 },
                          { label: '50%', val: 0.50 },
                          { label: '75%', val: 0.75 },
                          { label: '100%', val: 1.00 }
                        ].map(item => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setJurosValorInicial((saldoUnificadoSimuladoJuros * item.val).toFixed(2))}
                            className="px-1.5 py-0.5 text-[10px] rounded bg-slate-850 hover:bg-emerald-600 hover:text-white text-slate-300 font-semibold transition border border-slate-800"
                            title={`Preencher com ${item.label} do saldo (${(saldoUnificadoSimuladoJuros * item.val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Aporte Mensal */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Aporte Mensal (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={jurosAporteMensal}
                        onChange={e => setJurosAporteMensal(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Taxa de Juros */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Taxa de Rendimento
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          step="0.05"
                          value={jurosTaxa}
                          onChange={e => setJurosTaxa(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                        />
                        <select
                          value={jurosTipoTaxa}
                          onChange={e => setJurosTipoTaxa(e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 shrink-0"
                        >
                          <option value="anual">% a.a.</option>
                          <option value="mensal">% a.m.</option>
                        </select>
                      </div>
                    </div>

                    {/* Prazo */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Período / Tempo
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="600"
                          value={jurosPrazo}
                          onChange={e => setJurosPrazo(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                        />
                        <select
                          value={jurosTipoPrazo}
                          onChange={e => setJurosTipoPrazo(e.target.value as any)}
                          className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 shrink-0"
                        >
                          <option value="anos">Anos</option>
                          <option value="meses">Meses</option>
                        </select>
                      </div>
                    </div>

                    {/* Inflação Estimada */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Inflação Anual (IPCA %)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={jurosInflacaoAnual}
                        onChange={e => setJurosInflacaoAnual(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-emerald-500"
                        placeholder="Ex: 4.5"
                      />
                    </div>

                    {/* Tributação / IR */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Imposto de Renda
                      </label>
                      <select
                        value={jurosTipoTributacao}
                        onChange={e => setJurosTipoTributacao(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="regressivo">Tabela Regressiva (CDB/Tesouro)</option>
                        <option value="isento">Isento de IR (LCI/LCA/FII)</option>
                        <option value="fixo">Alíquota Fixa Personalizada</option>
                      </select>
                      {jurosTipoTributacao === 'fixo' && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={jurosAliquotaFixa}
                            onChange={e => setJurosAliquotaFixa(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                            placeholder="% IR"
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cards de Métricas Principais (6 Cards Exatos) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  {/* Total Bruto */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Total Bruto Final</span>
                    <div className="text-xl font-bold text-slate-100 mt-2 font-mono">
                      R$ {calculoJuros.valorFinalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Rentabilidade: +{calculoJuros.rentabilidadeTotalPct}%
                    </span>
                  </div>

                  {/* Total Investido */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Total do Bolso</span>
                    <div className="text-xl font-bold text-blue-400 mt-2 font-mono">
                      R$ {calculoJuros.totalInvestido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {calculoJuros.totalMeses} aportes realizados
                    </span>
                  </div>

                  {/* Juros Ganhos */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Juros Compostos</span>
                    <div className="text-xl font-bold text-emerald-400 mt-2 font-mono">
                      +R$ {calculoJuros.totalJurosGanhos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] text-emerald-500/80 mt-1">
                      Dinheiro que trabalhou por você
                    </span>
                  </div>

                  {/* Imposto de Renda */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-xs text-slate-400 font-semibold uppercase">IR Estimado ({calculoJuros.aliquotaIrPct}%)</span>
                    <div className="text-xl font-bold text-rose-400 mt-2 font-mono">
                      -R$ {calculoJuros.irEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1">
                      {jurosTipoTributacao === 'isento' ? 'Isenção legal aplicada' : 'Retido no resgate'}
                    </span>
                  </div>

                  {/* Valor Líquido Final */}
                  <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-between bg-blue-950/20">
                    <span className="text-xs text-blue-400 font-semibold uppercase">Valor Líquido Real</span>
                    <div className="text-xl font-bold text-slate-100 mt-2 font-mono">
                      R$ {calculoJuros.valorLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Após desconto de IR
                    </span>
                  </div>

                  {/* Renda Passiva Mensal */}
                  <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between bg-purple-950/20">
                    <span className="text-xs text-purple-400 font-semibold uppercase">Renda Passiva Mensal</span>
                    <div className="text-xl font-bold text-purple-400 mt-2 font-mono">
                      R$ {calculoJuros.rendaMensalPassiva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      <span className="text-xs font-normal text-slate-400">/mês</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">
                      Sem consumir o patrimônio
                    </span>
                  </div>
                </div>

                {/* Destaque: Patrimônio Líquido Novo Gerado (Abatendo Aporte Inicial) */}
                <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-blue-950/50 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <ArrowUpRight size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Patrimônio Novo Criado (Abatendo Aporte Inicial)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                          +{calculoJuros.crescimentoSobreInicial}% sobre o início
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Valor líquido que você terá a mais em comparação ao que tem hoje (rendimento líquido + aportes mensais).
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right sm:border-l sm:border-slate-800 sm:pl-6">
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      +R$ {calculoJuros.lucroLiquidoNovo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Crescimento patrimonial puro
                    </span>
                  </div>
                </div>

                {/* Gráfico da Evolução Temporal Acumulada */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-500" />
                        <span>Evolução Temporal do Patrimônio</span>
                      </h4>
                      <span className="text-xs text-slate-400">
                        Acompanhe a curva exponencial dos juros compostos superando o total aportado
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <span className="w-3 h-3 rounded-full bg-blue-500" />
                        Capital Aportado
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        Juros Acumulados
                      </span>
                    </div>
                  </div>

                  <div className="h-80 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={calculoJuros.totalMeses > 60 ? calculoJuros.serieAnual : calculoJuros.serieMensal}>
                        <defs>
                          <linearGradient id="corInvestidoLanding" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="corJurosLanding" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={11} 
                          tickLine={false} 
                          tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#334155', 
                            borderRadius: '12px',
                            color: '#f8fafc',
                            fontSize: '12px'
                          }}
                          formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="investido" 
                          name="Total Aportado" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#corInvestidoLanding)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="saldoBruto" 
                          name="Total com Juros" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#corJurosLanding)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela de Evolução Período a Período (Idêntica à Tela Real) */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <TableIcon size={18} className="text-emerald-500" />
                        <span>Detalhamento da Evolução Período a Período</span>
                      </h4>
                      <span className="text-xs text-slate-400">
                        Visualize exatamente quanto rende cada período
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => setJurosVisualizacaoTabela('ano')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          jurosVisualizacaoTabela === 'ano'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Ano a Ano
                      </button>
                      <button
                        onClick={() => setJurosVisualizacaoTabela('mes')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                          jurosVisualizacaoTabela === 'mes'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Mês a Mês
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-80 rounded-xl border border-slate-800 scrollbar-thin">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/90 sticky top-0 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800 backdrop-blur">
                        <tr>
                          <th className="py-3 px-4">Período</th>
                          <th className="py-3 px-4">Total Aportado</th>
                          <th className="py-3 px-4">Juros no Período</th>
                          <th className="py-3 px-4">Juros Acumulados</th>
                          <th className="py-3 px-4">Saldo Bruto</th>
                          <th className="py-3 px-4">Poder de Compra Real</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {(jurosVisualizacaoTabela === 'ano' ? calculoJuros.serieAnual : calculoJuros.serieMensal).map((item) => (
                          <tr key={item.mes} className="hover:bg-slate-900/60 transition">
                            <td className="py-2.5 px-4 font-sans font-medium text-slate-200">{item.label}</td>
                            <td className="py-2.5 px-4 text-blue-400">R$ {item.investido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-4 text-emerald-400">+R$ {item.jurosMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-4 text-emerald-300">R$ {item.jurosAcumulados.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-100">R$ {item.saldoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-4 text-purple-400">R$ {item.saldoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Card Educativo / Diferenciais FinanSmart (A Mais que o Sistema) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Cálculo Tributário Oficial
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      FinanSmart aplica automaticamente as faixas regressivas de 22,5% a 15% conforme a Lei 11.033/2004 para que você saiba exatamente o valor líquido de resgate.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                    <span className="text-purple-400 font-bold flex items-center gap-1.5">
                      <Zap size={14} /> Desconto de Inflação IPCA
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      A coluna <strong className="text-slate-200">Poder de Compra Real</strong> desconta o IPCA projetado para garantir que você não seja enganado por ilusão monetária ao longo dos anos.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
                    <span className="text-blue-400 font-bold flex items-center gap-1.5">
                      <Wallet size={14} /> Integração com Saldo Unificado
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      No sistema FinanSmart autenticado, os botões de 10% a 100% leem o saldo real somado de todas as suas contas bancárias para simulações instantâneas.
                    </p>
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
