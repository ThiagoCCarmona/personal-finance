import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  PiggyBank, 
  DollarSign, 
  PieChart as PieIcon, 
  BarChart3, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';
import { api } from '../services/api.js';
import { PrivacyValue } from '../components/common/PrivacyValue.js';
import { DateInput } from '../components/common/DateInput.js';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export const RelatoriosPage: React.FC = () => {
  const [periodoAtalho, setPeriodoAtalho] = useState<'mes_atual' | 'ultimos_3' | 'ano_atual' | 'custom'>('mes_atual');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [contaId, setContaId] = useState('');
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado do Dashboard
  const [dashboard, setDashboard] = useState<{
    total_receitas: number;
    total_despesas: number;
    saldo_periodo: number;
    taxa_poupanca_pct: number;
    despesas_por_categoria: Array<{ nome: string; cor: string; icone: string; valor: number; percentual: number }>;
    evolucao_mensal: Array<{ mes_ano: string; receitas: number; despesas: number; saldo: number }>;
    maiores_despesas: Array<{ id: string; descricao: string; valor: number; data: string; categoria: string; categoriaCor: string; formaPagamento: string }>;
  } | null>(null);

  // Define datas com base no atalho
  const aplicarAtalho = (atalho: 'mes_atual' | 'ultimos_3' | 'ano_atual' | 'custom') => {
    setPeriodoAtalho(atalho);
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    if (atalho === 'mes_atual') {
      const primeiroDia = new Date(ano, mes, 1).toISOString().split('T')[0];
      const ultimoDia = new Date(ano, mes + 1, 0).toISOString().split('T')[0];
      setDataInicio(primeiroDia);
      setDataFim(ultimoDia);
    } else if (atalho === 'ultimos_3') {
      const inicio = new Date(ano, mes - 2, 1).toISOString().split('T')[0];
      const fim = new Date(ano, mes + 1, 0).toISOString().split('T')[0];
      setDataInicio(inicio);
      setDataFim(fim);
    } else if (atalho === 'ano_atual') {
      const inicio = `${ano}-01-01`;
      const fim = `${ano}-12-31`;
      setDataInicio(inicio);
      setDataFim(fim);
    }
  };

  useEffect(() => {
    aplicarAtalho('mes_atual');
    api.getContas().then(res => setContas(Array.isArray(res) ? res : [])).catch(() => {});
  }, []);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardRelatorios({
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        contaId: contaId || undefined
      });
      setDashboard(res);
    } catch (err) {
      console.error('Erro ao carregar dashboard de relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataInicio && dataFim) {
      carregarDashboard();
    }
  }, [dataInicio, dataFim, contaId]);

  const [baixando, setBaixando] = useState<'lancamentos' | 'patrimonio' | null>(null);

  const baixarArquivo = async (url: string, nomeArquivo: string, tipo: 'lancamentos' | 'patrimonio') => {
    try {
      setBaixando(tipo);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Erro na exportação (status ${res.status})`);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = nomeArquivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error('Erro ao baixar arquivo CSV:', err);
      alert('Não foi possível realizar o download do arquivo CSV. Verifique a sua conexão ou tente novamente.');
    } finally {
      setBaixando(null);
    }
  };

  const handleDownloadLancamentos = () => {
    const url = api.getUrlCsvLancamentos(dataInicio || undefined, dataFim || undefined, contaId || undefined);
    const nome = `lancamentos_${dataInicio || 'inicio'}_a_${dataFim || 'fim'}.csv`;
    baixarArquivo(url, nome, 'lancamentos');
  };

  const handleDownloadPatrimonio = () => {
    const url = api.getUrlCsvPatrimonio();
    const nome = `balanco_patrimonial_${new Date().toISOString().slice(0, 10)}.csv`;
    baixarArquivo(url, nome, 'patrimonio');
  };

  const handleImprimir = () => {
    window.print();
  };

  const contaSelecionada = contas.find(c => c.id === contaId);
  const CORES_DONUT = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  return (
    <div className="space-y-6 print-container">
      {/* Estilos dedicados para impressão limpa A4 */}
      <style>{`
        @media print {
          /* Ocultar elementos desnecessários na folha */
          nav, aside, header, .no-print, button, select, input {
            display: none !important;
          }
          /* Reset de corpo e fundo para máxima nitidez */
          body, html, #root, main, .print-container {
            background-color: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-only {
            display: block !important;
          }
          /* Estilização dos cards de métricas no papel */
          .print-card {
            background-color: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            border-radius: 8px !important;
            padding: 12px !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-text-muted {
            color: #475569 !important;
          }
          /* Tabela de impressão */
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 11px !important;
          }
          .print-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px !important;
            font-weight: 700 !important;
          }
          .print-table td {
            border: 1px solid #e2e8f0 !important;
            padding: 5px 8px !important;
            color: #1e293b !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>

      {/* Cabeçalho Oficial para Impressão */}
      <div className="print-only border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              FINAN PRO &bull; Demonstrativo Financeiro
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Relatório Consolidado de Receitas, Despesas e Análise Orçamentária
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-600">
            <div><strong>Emissão:</strong> {new Date().toLocaleString('pt-BR')}</div>
            <div><strong>Período:</strong> {dataInicio ? `${dataInicio} até ${dataFim}` : 'Geral'}</div>
            <div><strong>Conta:</strong> {contaSelecionada ? contaSelecionada.apelido : 'Todas as Contas'}</div>
          </div>
        </div>
      </div>

      {/* Topo / Header em Tela */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-500 w-7 h-7" />
            Relatórios & Análise Financeira
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Visualização dinâmica de métricas, gráficos analíticos e exportação em formato compatível com Excel.
          </p>
        </div>

        {/* Botões de Ação Rápida / Exportação */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadLancamentos}
            disabled={baixando === 'lancamentos'}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 hover:text-white transition shadow-sm disabled:opacity-50"
            title="Exportar lançamentos filtrados em CSV para Excel"
          >
            <Download className="w-3.5 h-3.5" />
            {baixando === 'lancamentos' ? 'Gerando CSV...' : 'CSV Lançamentos'}
          </button>
          <button
            onClick={handleDownloadPatrimonio}
            disabled={baixando === 'patrimonio'}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-blue-400 hover:text-white transition shadow-sm disabled:opacity-50"
            title="Exportar balanço patrimonial completo em CSV"
          >
            <Download className="w-3.5 h-3.5" />
            {baixando === 'patrimonio' ? 'Gerando CSV...' : 'CSV Patrimônio'}
          </button>
          <button
            onClick={handleImprimir}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            PDF / Imprimir
          </button>
        </div>
      </div>

      {/* Barra de Filtros Interativos (Oculta na impressão) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Atalhos Rápidos */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => aplicarAtalho('mes_atual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                periodoAtalho === 'mes_atual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mês Atual
            </button>
            <button
              onClick={() => aplicarAtalho('ultimos_3')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                periodoAtalho === 'ultimos_3' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Últimos 3 Meses
            </button>
            <button
              onClick={() => aplicarAtalho('ano_atual')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                periodoAtalho === 'ano_atual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ano Atual
            </button>
            <button
              onClick={() => setPeriodoAtalho('custom')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                periodoAtalho === 'custom' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Personalizado
            </button>
          </div>

          {/* Seletores de Data e Conta */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-slate-400">De:</span>
              <DateInput
                value={dataInicio}
                onChange={val => {
                  setDataInicio(val);
                  setPeriodoAtalho('custom');
                }}
                className="w-36"
              />
              <span className="font-semibold text-slate-400">Até:</span>
              <DateInput
                value={dataFim}
                onChange={val => {
                  setDataFim(val);
                  setPeriodoAtalho('custom');
                }}
                className="w-36"
              />
            </div>

            {/* Filtro por Conta */}
            <select
              value={contaId}
              onChange={e => setContaId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas as Contas</option>
              {contas.map(c => (
                <option key={c.id} value={c.id}>{c.apelido}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading ou Cards de KPIs Principais */}
      {loading && (
        <div className="py-8 text-center text-xs text-slate-400">
          Carregando dados do relatório...
        </div>
      )}

      {!loading && dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
          {/* Receitas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between print-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase print-text-muted">Total de Receitas</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center print:border print:border-emerald-600">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 print:text-emerald-700 mt-2">
              <PrivacyValue value={dashboard.total_receitas} />
            </div>
            <span className="text-[11px] text-slate-500 print-text-muted mt-1">Entradas no período</span>
          </div>

          {/* Despesas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between print-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase print-text-muted">Total de Despesas</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center print:border print:border-rose-600">
                <ArrowDownRight size={18} />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-400 print:text-rose-700 mt-2">
              <PrivacyValue value={dashboard.total_despesas} />
            </div>
            <span className="text-[11px] text-slate-500 print-text-muted mt-1">Saídas e contas no período</span>
          </div>

          {/* Saldo Líquido */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between print-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase print-text-muted">Saldo Líquido</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                dashboard.saldo_periodo >= 0 ? 'bg-blue-500/10 text-blue-400 print:border print:border-blue-600' : 'bg-rose-500/10 text-rose-400 print:border print:border-rose-600'
              }`}>
                <DollarSign size={18} />
              </div>
            </div>
            <div className={`text-2xl font-bold mt-2 ${
              dashboard.saldo_periodo >= 0 ? 'text-blue-400 print:text-blue-700' : 'text-rose-400 print:text-rose-700'
            }`}>
              <PrivacyValue value={dashboard.saldo_periodo} />
            </div>
            <span className="text-[11px] text-slate-500 print-text-muted mt-1">Resultado financeiro do período</span>
          </div>

          {/* Taxa de Poupança */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between print-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase print-text-muted">Taxa de Poupança</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center print:border print:border-purple-600">
                <PiggyBank size={18} />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-400 print:text-purple-700 mt-2">
              {dashboard.taxa_poupanca_pct}%
            </div>
            <span className="text-[11px] text-slate-500 print-text-muted mt-1">Percentual guardado da receita</span>
          </div>
        </div>
      )}

      {/* Gráficos Dinâmicos */}
      {dashboard && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico 1: Comparativo Receitas vs Despesas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-400" />
                  Evolução Mensal (Receitas vs Despesas)
                </h3>
                <span className="text-xs text-slate-400">Histórico recente de fluxo de caixa</span>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.evolucao_mensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="mes_ano" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
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
                  <Legend />
                  <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Despesas por Categoria (Donut) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <PieIcon size={18} className="text-purple-400" />
                  Distribuição por Categorias
                </h3>
                <span className="text-xs text-slate-400">Onde o dinheiro foi gasto no período</span>
              </div>
            </div>

            {dashboard.despesas_por_categoria.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                Nenhuma despesa registrada no período selecionado.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboard.despesas_por_categoria}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="valor"
                      >
                        {dashboard.despesas_por_categoria.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.cor || CORES_DONUT[index % CORES_DONUT.length]} 
                          />
                        ))}
                      </Pie>
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
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legenda compacta com percentuais */}
                <div className="space-y-2 overflow-y-auto max-h-56 pr-2 scrollbar-thin">
                  {dashboard.despesas_por_categoria.map((cat, idx) => (
                    <div key={cat.nome} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: cat.cor || CORES_DONUT[idx % CORES_DONUT.length] }} 
                        />
                        <span className="text-slate-300 truncate">{cat.nome}</span>
                      </div>
                      <div className="text-right shrink-0 font-medium">
                        <span className="text-slate-200">R$ {cat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">({cat.percentual}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabela de Maiores Despesas do Período */}
      {dashboard && dashboard.maiores_despesas.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 print-card">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 print-text-dark">
            <Layers size={18} className="text-amber-400 no-print" />
            Top 5 Maiores Despesas do Período
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-none">
            <table className="w-full text-left text-xs text-slate-300 print-table">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Forma</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {dashboard.maiores_despesas.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-medium text-slate-200 print-text-dark">{item.descricao}</td>
                    <td className="py-2.5 px-4">
                      <span 
                        className="px-2 py-0.5 rounded-md text-[11px] font-medium border print:border-none print:p-0 print:font-semibold"
                        style={{ 
                          backgroundColor: `${item.categoriaCor || '#3b82f6'}15`,
                          borderColor: `${item.categoriaCor || '#3b82f6'}30`,
                          color: item.categoriaCor || '#3b82f6'
                        }}
                      >
                        {item.categoria}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 print-text-muted">{item.data}</td>
                    <td className="py-2.5 px-4 text-slate-400 capitalize print-text-muted">{item.formaPagamento.replace('_', ' ')}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400 print:text-rose-700">
                      -R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
