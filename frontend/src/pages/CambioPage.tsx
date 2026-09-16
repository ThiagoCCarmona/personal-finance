import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Activity, 
  Calendar, 
  Calculator 
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

export const CambioPage: React.FC = () => {
  const [moeda, setMoeda] = useState<'USD' | 'EUR'>('USD');
  const [dias, setDias] = useState<number>(30);
  const [historico, setHistorico] = useState<HistoricoCambio | null>(null);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);

  const [calcQtd, setCalcQtd] = useState<string>('1000');
  const [calcCotacao, setCalcCotacao] = useState<string>('5.00');
  const [resultadoGanho, setResultadoGanho] = useState<GanhoCambialResultado | null>(null);

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

  useEffect(() => {
    carregarHistorico();
  }, [moeda, dias]);

  const handleSincronizar = async () => {
    try {
      setSincronizando(true);
      await api.sincronizarCambio();
      await carregarHistorico();
    } catch (err) {
      alert('Erro ao sincronizar com BACEN.');
    } finally {
      setSincronizando(false);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <DollarSign className="text-emerald-400" />
            Câmbio Oficial & PTAX
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cotações oficiais do Banco Central, médias móveis e ganho cambial
          </p>
        </div>
        <button
          onClick={handleSincronizar}
          disabled={sincronizando}
          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={sincronizando ? 'animate-spin text-blue-400' : ''} />
          <span>{sincronizando ? 'Sincronizando...' : 'Sincronizar BACEN'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Moeda Selecionada</span>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setMoeda('USD')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition border ${
                moeda === 'USD'
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              USD / BRL
            </button>
            <button
              onClick={() => setMoeda('EUR')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition border ${
                moeda === 'EUR'
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              EUR / BRL
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Última Cotação PTAX</span>
          <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">
            {historico?.ultima_cotacao ? `R$ ${historico.ultima_cotacao.toFixed(4)}` : 'R$ ---'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Fonte: Banco Central do Brasil</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Variação no Período</span>
          <div className={`text-2xl font-bold mt-2 flex items-center gap-1 ${
            (historico?.variacao_periodo_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {(historico?.variacao_periodo_pct ?? 0) >= 0 ? <TrendingUp size={22} /> : <TrendingDown size={22} />}
            <span>{(historico?.variacao_periodo_pct ?? 0) > 0 ? '+' : ''}{historico?.variacao_periodo_pct ?? 0}%</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Janela de {dias} dias</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Volatilidade (30d)</span>
          <div className="text-2xl font-bold text-amber-400 mt-2 flex items-center gap-2">
            <Activity size={22} />
            <span>{historico?.volatilidade_30d ?? 0}%</span>
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Desvio padrão diário</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Calendar size={18} className="text-blue-400" />
              Histórico PTAX & Médias Móveis (MM7 e MM30)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Indicadores objetivos e dados históricos (estritamente sem previsões especulativas)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[15, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                  dias === d
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {d} dias
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Carregando gráfico...
            </div>
          ) : !historico || historico.pontos.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Nenhuma cotação registrada. Clique em 'Sincronizar BACEN'.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico.pontos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="data" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(val) => {
                    const parts = val.split('-');
                    return `${parts[2]}/${parts[1]}`;
                  }}
                />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={11} tickFormatter={(val) => `R$ ${val.toFixed(2)}`} />
                <Tooltip 
                  formatter={(val: any) => [`R$ ${Number(val).toFixed(4)}`]}
                  labelFormatter={(lbl) => `Data: ${lbl}`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem' }}
                />
                <Legend />
                <Line type="monotone" dataKey="valor" name="Cotação PTAX" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="mm7" name="MM 7 dias" stroke="#a855f7" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="mm30" name="MM 30 dias" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Calculator size={18} className="text-emerald-400" />
          Calculadora de Ganho / Perda Cambial
        </h2>
        <p className="text-xs text-slate-400">
          Descubra o resultado financeiro atual de uma compra passada em relação à PTAX de hoje
        </p>

        <form onSubmit={handleCalcularGanho} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Quantidade Comprada ({moeda})
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={calcQtd}
              onChange={(e) => setCalcQtd(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Cotação de Aquisição (R$)
            </label>
            <input
              type="number"
              step="0.0001"
              required
              value={calcCotacao}
              onChange={(e) => setCalcCotacao(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-emerald-600/20"
            >
              Calcular Resultado
            </button>
          </div>
        </form>

        {resultadoGanho && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80 mt-4">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block">Custo de Aquisição</span>
              <span className="text-base font-bold text-slate-200">
                <PrivacyValue value={resultadoGanho.valor_investido_brl} />
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block">Valor Atual PTAX</span>
              <span className="text-base font-bold text-slate-200">
                <PrivacyValue value={resultadoGanho.valor_atual_brl} />
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block">Ganho / Perda Bruta</span>
              <span className={`text-base font-bold ${
                resultadoGanho.ganho_perda_brl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <PrivacyValue value={resultadoGanho.ganho_perda_brl} />
              </span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 block">Rentabilidade</span>
              <span className={`text-base font-bold ${
                resultadoGanho.rentabilidade_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {resultadoGanho.rentabilidade_pct > 0 ? '+' : ''}{resultadoGanho.rentabilidade_pct}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
