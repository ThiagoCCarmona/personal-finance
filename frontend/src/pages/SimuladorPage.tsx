import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles
} from 'lucide-react';
import { api } from '../services/api.js';
import { ResultadoSimulacao, CenarioSimulacao } from '../types/index.js';
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
  const [valorInicial, setValorInicial] = useState<string>('5000');
  const [aporteMensal, setAporteMensal] = useState<string>('500');
  const [prazoMeses, setPrazoMeses] = useState<string>('60'); // 5 anos
  const [cenarios, setCenarios] = useState<CenarioSimulacao[]>([]);
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarCenarios = async () => {
      try {
        const padrao = await api.getCenariosPadraoSimulacao();
        setCenarios(padrao);
      } catch (err) {
        console.error('Erro ao carregar cenários:', err);
      }
    };
    carregarCenarios();
  }, []);

  const handleSimular = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (cenarios.length === 0) return;
    try {
      setLoading(true);
      const res = await api.simularInvestimento({
        valor_inicial: Number(valorInicial) || 0,
        aporte_mensal: Number(aporteMensal) || 0,
        prazo_meses: Number(prazoMeses) || 12,
        cenarios: cenarios,
      });
      setResultado(res);
    } catch (err) {
      alert('Erro ao calcular simulação de investimentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cenarios.length > 0) {
      handleSimular();
    }
  }, [cenarios]);

  const CORES_GRAFICO = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="text-blue-500" />
          Simulador de Investimentos
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Projeção de juros compostos com aportes mensais e comparação de múltiplos cenários
        </p>
      </div>

      {/* Formulário de Parâmetros */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <form onSubmit={handleSimular} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Valor Inicial (R$)
            </label>
            <input
              type="number"
              step="100"
              required
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Aporte Mensal (R$)
            </label>
            <input
              type="number"
              step="50"
              required
              value={aporteMensal}
              onChange={(e) => setAporteMensal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Prazo (Meses)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="600"
                required
                value={prazoMeses}
                onChange={(e) => setPrazoMeses(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <span className="self-center text-xs text-slate-400 shrink-0">
                ({(Number(prazoMeses) / 12).toFixed(1)} anos)
              </span>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? 'Calculando...' : 'Recalcular Projeção'}
            </button>
          </div>
        </form>

        {/* Atalhos de prazo */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <span className="text-xs text-slate-500">Prazo rápido:</span>
          {[12, 24, 60, 120, 240, 360].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setPrazoMeses(String(m));
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                Number(prazoMeses) === m
                  ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {m / 12 >= 1 ? `${m / 12} anos` : `${m} meses`}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Comparativos de Cenários */}
      {resultado && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resultado.cenarios.map((cenario, idx) => (
            <div 
              key={cenario.nome}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between"
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: CORES_GRAFICO[idx % CORES_GRAFICO.length] }}
              />
              <div>
                <span className="text-xs font-semibold text-slate-300 block truncate">
                  {cenario.nome}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Taxa: {cenario.taxa_anual_pct}% a.a. ({cenario.taxa_mensal_pct}% a.m.)
                </span>

                <div className="mt-4">
                  <span className="text-xs text-slate-500 block">Total Bruto Final</span>
                  <div className="text-xl font-bold text-slate-100 mt-0.5">
                    <PrivacyValue value={cenario.valor_final_bruto} />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Aportado:</span>
                  <span className="font-medium text-slate-300">
                    <PrivacyValue value={cenario.total_investido} />
                  </span>
                </div>
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Juros Ganhos:</span>
                  <span>
                    +<PrivacyValue value={cenario.total_juros_ganhos} />
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Rentabilidade:</span>
                  <span className="font-semibold text-slate-200">
                    +{cenario.rentabilidade_pct}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico da Evolução Acumulada */}
      {resultado && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-400" />
              Curva de Acúmulo e Poder dos Juros Compostos
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evolução mês a mês do patrimônio em cada cenário versus o total desembolsado do próprio bolso
            </p>
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resultado.evolucao_mensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  dataKey="mes" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(val) => val === 0 ? 'Início' : `Mês ${val}`}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(val: any) => [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val))
                  ]}
                  labelFormatter={(lbl) => lbl === 0 ? 'Mês Inicial (0)' : `Mês ${lbl} (${(Number(lbl)/12).toFixed(1)} anos)`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="total_investido" 
                  name="Total Aportado (Do Bolso)" 
                  stroke="#64748b" 
                  fill="#64748b" 
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                {resultado.cenarios.map((c, idx) => (
                  <Area
                    key={c.nome}
                    type="monotone"
                    dataKey={c.nome}
                    name={c.nome}
                    stroke={CORES_GRAFICO[idx % CORES_GRAFICO.length]}
                    fill={CORES_GRAFICO[idx % CORES_GRAFICO.length]}
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
