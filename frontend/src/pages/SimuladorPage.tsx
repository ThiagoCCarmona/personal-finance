import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle,
  Calendar,
  Table as TableIcon,
  BarChart3
} from 'lucide-react';
import { PrivacyValue } from '../components/common/PrivacyValue.js';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export const SimuladorPage: React.FC = () => {
  // Parâmetros de Entrada
  const [valorInicial, setValorInicial] = useState<string>('10000');
  const [aporteMensal, setAporteMensal] = useState<string>('1000');
  const [taxaJuros, setTaxaJuros] = useState<string>('11.75');
  const [tipoTaxa, setTipoTaxa] = useState<'anual' | 'mensal'>('anual');
  const [prazo, setPrazo] = useState<string>('5');
  const [tipoPrazo, setTipoPrazo] = useState<'anos' | 'meses'>('anos');
  const [inflacaoAnual, setInflacaoAnual] = useState<string>('4.5');
  const [tipoTributacao, setTipoTributacao] = useState<'regressivo' | 'isento' | 'fixo'>('regressivo');
  const [aliquotaFixa, setAliquotaFixa] = useState<string>('15');
  const [visualizacaoTabela, setVisualizacaoTabela] = useState<'ano' | 'mes'>('ano');

  // Cálculo Dinâmico em Memória (tempo real, super rápido e reativo)
  const calculo = useMemo(() => {
    const vInicial = Math.max(0, parseFloat(valorInicial) || 0);
    const vMensal = Math.max(0, parseFloat(aporteMensal) || 0);
    const pAnos = tipoPrazo === 'anos' ? (parseFloat(prazo) || 0) : (parseFloat(prazo) || 0) / 12;
    const totalMeses = Math.max(1, Math.round(pAnos * 12));

    // Converte taxa para taxa mensal efetiva
    const tJurosNum = (parseFloat(taxaJuros) || 0) / 100;
    let taxaMensal = 0;
    if (tipoTaxa === 'anual') {
      taxaMensal = Math.pow(1 + tJurosNum, 1 / 12) - 1;
    } else {
      taxaMensal = tJurosNum;
    }

    // Inflação mensal
    const infAnualNum = (parseFloat(inflacaoAnual) || 0) / 100;
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
    if (tipoTributacao === 'isento') {
      aliquotaIr = 0;
    } else if (tipoTributacao === 'fixo') {
      aliquotaIr = (parseFloat(aliquotaFixa) || 0) / 100;
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
      rentabilidadeTotalPct: totalInvestido > 0 ? ((totalJurosGanhos / totalInvestido) * 100).toFixed(1) : '0',
      serieMensal,
      serieAnual
    };
  }, [valorInicial, aporteMensal, taxaJuros, tipoTaxa, prazo, tipoPrazo, inflacaoAnual, tipoTributacao, aliquotaFixa]);

  // Predefinições de Mercado
  const aplicarPredefinicao = (nome: string, taxa: string, tipo: 'anual' | 'mensal', trib: 'regressivo' | 'isento') => {
    setTaxaJuros(taxa);
    setTipoTaxa(tipo);
    setTipoTributacao(trib);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Calculator className="text-blue-500 w-7 h-7" />
          Simulador Completo de Juros Compostos
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Planeje seus objetivos financeiros com controle total de taxas, aportes, inflação e imposto de renda.
        </p>
      </div>

      {/* Sugestões Rápidas de Mercado */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-semibold uppercase text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles size={13} className="text-amber-400" />
          Cenários rápidos:
        </span>
        <button
          type="button"
          onClick={() => aplicarPredefinicao('100% CDI', '10.50', 'anual', 'regressivo')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap"
        >
          100% CDI (10,5% a.a.)
        </button>
        <button
          type="button"
          onClick={() => aplicarPredefinicao('CDB 110%', '11.55', 'anual', 'regressivo')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-xs font-medium text-slate-300 hover:text-white transition whitespace-nowrap"
        >
          CDB 110% CDI (11,55% a.a.)
        </button>
        <button
          type="button"
          onClick={() => aplicarPredefinicao('LCI/LCA', '9.25', 'anual', 'isento')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs font-medium text-emerald-400 hover:text-white transition whitespace-nowrap"
        >
          LCI/LCA Isento (9,25% a.a.)
        </button>
        <button
          type="button"
          onClick={() => aplicarPredefinicao('FIIs / Dividendos', '0.85', 'mensal', 'isento')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-xs font-medium text-purple-400 hover:text-white transition whitespace-nowrap"
        >
          FIIs / Ações (0,85% a.m. isento)
        </button>
        <button
          type="button"
          onClick={() => aplicarPredefinicao('Poupança', '6.17', 'anual', 'isento')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-400 hover:text-white transition whitespace-nowrap"
        >
          Poupança (6,17% a.a.)
        </button>
      </div>

      {/* Formulário de Configuração do Simulador */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-400" />
          Configuração Personalizada dos Parâmetros
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Valor Inicial */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Aporte Inicial (R$)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={valorInicial}
              onChange={e => setValorInicial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500"
            />
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
              value={aporteMensal}
              onChange={e => setAporteMensal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500"
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
                value={taxaJuros}
                onChange={e => setTaxaJuros(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500"
              />
              <select
                value={tipoTaxa}
                onChange={e => setTipoTaxa(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 shrink-0"
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
                value={prazo}
                onChange={e => setPrazo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500"
              />
              <select
                value={tipoPrazo}
                onChange={e => setTipoPrazo(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 shrink-0"
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
              value={inflacaoAnual}
              onChange={e => setInflacaoAnual(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500"
              placeholder="Ex: 4.5"
            />
          </div>

          {/* Tributação / IR */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Imposto de Renda
            </label>
            <select
              value={tipoTributacao}
              onChange={e => setTipoTributacao(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="regressivo">Tabela Regressiva (CDB/Tesouro)</option>
              <option value="isento">Isento de IR (LCI/LCA/FII)</option>
              <option value="fixo">Alíquota Fixa (15%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Bruto */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Bruto Final</span>
          <div className="text-xl font-bold text-slate-100 mt-2">
            <PrivacyValue value={calculo.valorFinalBruto} />
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            Rentabilidade: +{calculo.rentabilidadeTotalPct}%
          </span>
        </div>

        {/* Total Investido */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total do Bolso</span>
          <div className="text-xl font-bold text-blue-400 mt-2">
            <PrivacyValue value={calculo.totalInvestido} />
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            {calculo.totalMeses} aportes realizados
          </span>
        </div>

        {/* Juros Ganhos */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase">Juros Compostos</span>
          <div className="text-xl font-bold text-emerald-400 mt-2">
            +<PrivacyValue value={calculo.totalJurosGanhos} />
          </div>
          <span className="text-[11px] text-emerald-500/80 mt-1">
            Dinheiro que trabalhou por você
          </span>
        </div>

        {/* Imposto de Renda */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-semibold uppercase">IR Estimado ({calculo.aliquotaIrPct}%)</span>
          <div className="text-xl font-bold text-rose-400 mt-2">
            -<PrivacyValue value={calculo.irEstimado} />
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            {tipoTributacao === 'isento' ? 'Isenção legal aplicada' : 'Retido no resgate'}
          </span>
        </div>

        {/* Valor Líquido Final */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-between bg-blue-950/10">
          <span className="text-xs text-blue-400 font-semibold uppercase">Valor Líquido Real</span>
          <div className="text-xl font-bold text-slate-100 mt-2">
            <PrivacyValue value={calculo.valorLiquido} />
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Após desconto de IR
          </span>
        </div>

        {/* Renda Passiva Mensal */}
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between bg-purple-950/10">
          <span className="text-xs text-purple-400 font-semibold uppercase">Renda Passiva Mensal</span>
          <div className="text-xl font-bold text-purple-400 mt-2">
            <PrivacyValue value={calculo.rendaMensalPassiva} />
            <span className="text-xs font-normal text-slate-400">/mês</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            Sem consumir o patrimônio
          </span>
        </div>
      </div>

      {/* Gráfico da Evolução Acumulada */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" />
              Evolução Temporal do Patrimônio
            </h3>
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
            <AreaChart data={calculo.totalMeses > 60 ? calculo.serieAnual : calculo.serieMensal}>
              <defs>
                <linearGradient id="corInvestido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="corJuros" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#corInvestido)" 
              />
              <Area 
                type="monotone" 
                dataKey="saldoBruto" 
                name="Total com Juros" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#corJuros)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Evolução Período a Período */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TableIcon size={18} className="text-emerald-500" />
              Detalhamento da Evolução Período a Período
            </h3>
            <span className="text-xs text-slate-400">
              Visualize exatamente quanto rende cada período
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setVisualizacaoTabela('ano')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                visualizacaoTabela === 'ano'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ano a Ano
            </button>
            <button
              onClick={() => setVisualizacaoTabela('mes')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                visualizacaoTabela === 'mes'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mês a Mês
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
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
              {(visualizacaoTabela === 'ano' ? calculo.serieAnual : calculo.serieMensal).map((item) => (
                <tr key={item.mes} className="hover:bg-slate-800/40 transition">
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
    </div>
  );
};
