import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Activity, 
  Calendar, 
  Calculator,
  Star,
  ArrowRightLeft,
  Coins
} from 'lucide-react';
import { api } from '../services/api.js';
import { HistoricoCambio, GanhoCambialResultado } from '../types/index.js';
import { PrivacyValue } from '../components/common/PrivacyValue.js';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

interface MoedaInfo {
  id: string;
  codigo: string;
  nome: string;
  simbolo: string;
  favorita: boolean;
  ultima_cotacao_brl?: number;
}

export const CambioPage: React.FC = () => {
  const [moedas, setMoedas] = useState<MoedaInfo[]>([]);
  const [moeda, setMoeda] = useState<string>('USD');
  const [dias, setDias] = useState<number>(30);
  const [historico, setHistorico] = useState<HistoricoCambio | null>(null);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  // Calculadora de Câmbio
  const [calcDe, setCalcDe] = useState<string>('USD');
  const [calcPara, setCalcPara] = useState<string>('BRL');
  const [calcQtdConv, setCalcQtdConv] = useState<string>('1');
  const [resultadoConv, setResultadoConv] = useState<{ cotacao: number; valor_convertido: number } | null>(null);
  const [loadingConv, setLoadingConv] = useState(false);

  // Calculador de Ganho Cambial
  const [calcQtd, setCalcQtd] = useState<string>('1000');
  const [calcCotacao, setCalcCotacao] = useState<string>('5.00');
  const [resultadoGanho, setResultadoGanho] = useState<GanhoCambialResultado | null>(null);

  const carregarMoedas = async () => {
    try {
      const data = await api.getMoedasCambio();
      setMoedas(data);
    } catch (err) {
      console.error('Erro ao carregar moedas:', err);
    }
  };

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const data = await api.getHistoricoCambio(moeda, dias);
      setHistorico(data);
    } catch (err) {
      console.error('Erro cambio:', err);
    } finally {
      setLoading(false);
    }
  };

  const executarConversao = async (de: string, para: string, valorStr: string) => {
    const val = parseFloat(valorStr);
    if (isNaN(val) || val <= 0) {
      setResultadoConv(null);
      return;
    }
    try {
      setLoadingConv(true);
      const res = await api.converterMoeda(de, para, val);
      setResultadoConv({ cotacao: res.cotacao, valor_convertido: res.valor_convertido });
    } catch (err) {
      console.error('Erro conversor:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    carregarMoedas();
  }, []);

  useEffect(() => {
    carregarHistorico();
  }, [moeda, dias]);

  useEffect(() => {
    executarConversao(calcDe, calcPara, calcQtdConv);
  }, [calcDe, calcPara, calcQtdConv]);

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      await api.sincronizarCambio();
      await Promise.all([carregarMoedas(), carregarHistorico()]);
      await executarConversao(calcDe, calcPara, calcQtdConv);
    } catch (err) {
      alert('Erro ao sincronizar com AwesomeAPI.');
    } finally {
      setSincronizando(false);
    }
  };

  const handleToggleFavorita = async (codigo: string) => {
    try {
      await api.toggleFavoritaCambio(codigo);
      carregarMoedas();
    } catch (err) {
      console.error('Erro ao favoritar:', err);
    }
  };

  const handleInverterMoedas = () => {
    const antigoDe = calcDe;
    const antigoPara = calcPara;
    setCalcDe(antigoPara);
    setCalcPara(antigoDe);
  };

  const handleCalcularGanho = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.calcularGanhoCambial({
        moeda_codigo: moeda,
        quantidade: Number(calcQtd),
        cotacao_aquisicao: Number(calcCotacao),
      });
      setResultadoGanho(res);
    } catch (err) {
      alert('Erro ao calcular ganho cambial.');
    }
  };

  const moedaAtualInfo = moedas.find(m => m.codigo === moeda);
  const moedasFavoritas = moedas.filter(m => m.favorita && m.codigo !== 'BRL');
  const moedasNaoFavoritas = moedas.filter(m => !m.favorita && m.codigo !== 'BRL');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="text-emerald-400" />
            <span>Câmbio Comercial & Mercado em Tempo Real</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cotações em tempo real via AwesomeAPI, histórico diário real e conversor de moedas
          </p>
        </div>
        <button
          onClick={handleSincronizar}
          disabled={sincronizando}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={16} className={sincronizando ? 'animate-spin text-blue-400' : ''} />
          <span>{sincronizando ? 'Atualizando Mercado...' : 'Atualizar Cotações'}</span>
        </button>
      </div>

      {/* CALCULADORA DE CÂMBIO INSTANTÂNEA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Coins className="text-amber-400" size={18} />
            <span>Calculadora & Conversor de Moedas</span>
          </h3>
          <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Tempo Real AwesomeAPI
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Valor de Entrada */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Quantidade</label>
            <input
              type="number"
              step="any"
              value={calcQtdConv}
              onChange={e => setCalcQtdConv(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-blue-500"
              placeholder="1"
            />
          </div>

          {/* Moeda Origem */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">De (Moeda Origem)</label>
            <select
              value={calcDe}
              onChange={e => setCalcDe(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              <option value="USD">USD — Dólar Americano</option>
              <option value="EUR">EUR — Euro</option>
              <option value="BRL">BRL — Real Brasileiro</option>
              <option value="GBP">GBP — Libra Esterlina</option>
              <option value="CAD">CAD — Dólar Canadense</option>
              <option value="CHF">CHF — Franco Suíço</option>
              <option value="JPY">JPY — Iene Japonês</option>
              <option value="BTC">BTC — Bitcoin</option>
              <option value="ARS">ARS — Peso Argentino</option>
            </select>
          </div>

          {/* Botão de Inversão */}
          <div className="sm:col-span-1 flex items-center justify-center pt-5">
            <button
              type="button"
              onClick={handleInverterMoedas}
              title="Inverter Moedas"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            >
              <ArrowRightLeft size={16} />
            </button>
          </div>

          {/* Moeda Destino */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Para (Moeda Destino)</label>
            <select
              value={calcPara}
              onChange={e => setCalcPara(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
            >
              <option value="BRL">BRL — Real Brasileiro</option>
              <option value="USD">USD — Dólar Americano</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — Libra Esterlina</option>
              <option value="CAD">CAD — Dólar Canadense</option>
              <option value="CHF">CHF — Franco Suíço</option>
              <option value="JPY">JPY — Iene Japonês</option>
              <option value="BTC">BTC — Bitcoin</option>
              <option value="ARS">ARS — Peso Argentino</option>
            </select>
          </div>

          {/* Resultado da Conversão */}
          <div className="sm:col-span-2 text-right sm:text-right pt-2 sm:pt-0">
            <span className="text-[11px] text-slate-400 block">Total Convertido</span>
            <div className="text-lg font-black text-emerald-400">
              {loadingConv ? (
                <span className="text-xs text-slate-500">Calculando...</span>
              ) : resultadoConv ? (
                <span>
                  {resultadoConv.valor_convertido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {calcPara}
                </span>
              ) : (
                '—'
              )}
            </div>
            {resultadoConv && (
              <span className="text-[10px] text-slate-500 block">
                1 {calcDe} = {resultadoConv.cotacao.toFixed(4)} {calcPara}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Seleção de Moedas e Favoritas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Moedas em Consulta no Gráfico
          </span>
          <span className="text-xs text-slate-500">
            Clique na estrela para favoritar as moedas que deseja manter na barra rápida
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {moedasFavoritas.map(m => (
            <div
              key={m.codigo}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                moeda === m.codigo
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <button
                onClick={() => setMoeda(m.codigo)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <span>{m.codigo} / BRL</span>
                {m.ultima_cotacao_brl && (
                  <span className="font-mono text-slate-400 font-normal">
                    (R$ {Number(m.ultima_cotacao_brl).toFixed(2)})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleToggleFavorita(m.codigo)}
                title="Desfavoritar"
                className="text-amber-400 hover:text-amber-300 ml-1"
              >
                <Star size={13} fill="currentColor" />
              </button>
            </div>
          ))}

          {/* Seletor com outras moedas */}
          <div className="flex items-center gap-1.5">
            <select
              value={moeda}
              onChange={e => setMoeda(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
            >
              <option value="" disabled>Outras moedas...</option>
              {moedasNaoFavoritas.map(m => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo} — {m.nome}
                </option>
              ))}
            </select>
            {moedaAtualInfo && !moedaAtualInfo.favorita && (
              <button
                type="button"
                onClick={() => handleToggleFavorita(moeda)}
                title="Favoritar esta moeda"
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-amber-400 transition"
              >
                <Star size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Resumo da Moeda Ativa */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Cotação Atual</span>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-100">
              R$ {historico?.ultima_cotacao ? historico.ultima_cotacao.toFixed(4) : '—'}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">
              1 {moeda} em Reais
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Variação no Período</span>
          <div className="mt-2">
            <div className={`text-2xl font-bold flex items-center gap-1 ${
              (historico?.variacao_periodo_pct || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {(historico?.variacao_periodo_pct || 0) >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              <span>{(historico?.variacao_periodo_pct || 0) > 0 ? '+' : ''}{historico?.variacao_periodo_pct || 0}%</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Últimos {dias} dias</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Volatilidade (30D)</span>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-400 flex items-center gap-1">
              <Activity size={20} />
              <span>{historico?.volatilidade_30d || 0}%</span>
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Desvio-padrão diário</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Janela do Gráfico</span>
          <div className="flex flex-wrap gap-1 mt-2">
            {[7, 30, 60, 90, 180, 365].map(d => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  dias === d
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {d < 365 ? `${d}D` : '1 ANO'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico Histórico Diário Real */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span>Histórico Diário — {moeda} / BRL ({dias} dias)</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Fonte: AwesomeAPI Diária</span>
        </div>

        <div className="h-72 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Carregando histórico diário do mercado...
            </div>
          ) : !historico || historico.pontos.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-500">
              Nenhuma cotação histórica disponível para o período selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico.pontos} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="data" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickFormatter={val => {
                    const parts = val.split('-');
                    return `${parts[2]}/${parts[1]}`;
                  }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  domain={['auto', 'auto']}
                  tickFormatter={val => Number(val).toFixed(2)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(val: any) => [`R$ ${Number(val).toFixed(4)}`, '']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  name="Cotação Diária" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={historico.pontos.length < 35} 
                />
                <Line 
                  type="monotone" 
                  dataKey="mm7" 
                  name="Média Móvel 7D" 
                  stroke="#10b981" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4" 
                  dot={false} 
                />
                <Line 
                  type="monotone" 
                  dataKey="mm30" 
                  name="Média Móvel 30D" 
                  stroke="#f59e0b" 
                  strokeWidth={1.5} 
                  strokeDasharray="2 2" 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Simulador de Ganho Cambial */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Calculator size={16} className="text-slate-400" />
          <span>Simulador de Lucro / Prejuízo em Operação Cambial Real</span>
        </h3>

        <form onSubmit={handleCalcularGanho} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Quantidade de {moeda} Adquirida
            </label>
            <input
              type="number"
              step="any"
              required
              value={calcQtd}
              onChange={e => setCalcQtd(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Cotação Paga na Compra (R$)
            </label>
            <input
              type="number"
              step="any"
              required
              value={calcCotacao}
              onChange={e => setCalcCotacao(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
            >
              Simular Rendimento
            </button>
          </div>
        </form>

        {resultadoGanho && (
          <div className="mt-4 p-4 bg-slate-950 border border-slate-800/80 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-slate-500 block">Investido na Compra</span>
              <span className="text-sm font-bold text-slate-200">
                <PrivacyValue value={resultadoGanho.valor_investido_brl} />
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Valor Hoje a Mercado</span>
              <span className="text-sm font-bold text-slate-200">
                <PrivacyValue value={resultadoGanho.valor_atual_brl} />
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Lucro / Prejuízo</span>
              <span className={`text-sm font-bold ${
                resultadoGanho.ganho_perda_brl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <PrivacyValue 
                  value={resultadoGanho.ganho_perda_brl} 
                  colored 
                  type={resultadoGanho.ganho_perda_brl >= 0 ? 'receita' : 'despesa'} 
                />
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Retorno Percentual</span>
              <span className={`text-sm font-bold ${
                resultadoGanho.rentabilidade_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {resultadoGanho.rentabilidade_pct >= 0 ? '+' : ''}{resultadoGanho.rentabilidade_pct}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
