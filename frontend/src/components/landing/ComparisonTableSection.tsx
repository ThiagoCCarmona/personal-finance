import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Scale, 
  Sparkles
} from 'lucide-react';

export const ComparisonTableSection: React.FC = () => {
  const comparisonData = [
    {
      feature: 'Metodologia 50-30-20 Automática',
      desc: 'Com barras decrescentes e teto diário seguro de gastos',
      finan: { status: 'check', text: 'Sim (Nativo com barra decrescente)' },
      excel: { status: 'cross', text: 'Complexo de manter e atualizar' },
      apps: { status: 'cross', text: 'Não tem' },
    },
    {
      feature: 'Projeção de Saldo do Mês Seguinte',
      desc: 'Sabe exatamente quanto vai sobrar em 30 dias',
      finan: { status: 'check', text: 'Em tempo real automático' },
      excel: { status: 'warn', text: 'Risco frequente de fórmulas quebradas' },
      apps: { status: 'cross', text: 'Apenas mostra o passado' },
    },
    {
      feature: 'Simulador de Gastos & Faturas Futuras',
      desc: 'Testa compra à vista vs parcelada antes de passar o cartão',
      finan: { status: 'check', text: 'Simula impacto no saldo do próximo mês' },
      excel: { status: 'cross', text: 'Difícil de modelar' },
      apps: { status: 'cross', text: 'Não tem' },
    },
    {
      feature: 'Wishlist (Lista de Desejos) Integrada',
      desc: 'Histórico de preços por loja e débito automático ao comprar',
      finan: { status: 'check', text: 'Nativo com categorização 50-30-20' },
      excel: { status: 'cross', text: 'Planilha estática sem links' },
      apps: { status: 'cross', text: 'Não tem' },
    },
    {
      feature: 'Simulador com Tabela Price & Juros',
      desc: 'Compara parcelamento com juros vs. desconto à vista',
      finan: { status: 'check', text: 'Nativo em 1 clique' },
      excel: { status: 'cross', text: 'Exige fórmulas financeiras avançadas' },
      apps: { status: 'cross', text: 'Não tem' },
    },
    {
      feature: 'Privacidade Total (Anti-Fintech)',
      desc: 'Zero anúncios, zero venda de dados a bancos e birôs',
      finan: { status: 'check', text: '100% Seguro e Isolado' },
      excel: { status: 'check', text: 'Seguro (armazenamento local)' },
      apps: { status: 'cross', text: 'Vendem dados e empurram crédito' },
    },
    {
      feature: 'Divisão de Gastos & Cobrança PIX',
      desc: 'Racha a conta em viagens e gera QR Code oficial BACEN',
      finan: { status: 'check', text: 'Integrado com padrão BR Code' },
      excel: { status: 'cross', text: '100% manual e sem PIX' },
      apps: { status: 'cross', text: 'Não tem' },
    },
    {
      feature: 'Câmbio Oficial PTAX do Banco Central',
      desc: 'Cotação diária do Dólar, Peso Argentino e Euro',
      finan: { status: 'check', text: 'Integrado à API Olinda BACEN' },
      excel: { status: 'cross', text: 'Manual e defasado' },
      apps: { status: 'cross', text: 'Não suporta multimoedas' },
    },
    {
      feature: 'Acesso PWA no Celular sem App Store',
      desc: 'Instale na tela inicial sem ocupar espaço de memória',
      finan: { status: 'check', text: 'Fluido, leve e responsivo' },
      excel: { status: 'cross', text: 'Terrível de usar no celular' },
      apps: { status: 'warn', text: 'Pesado, bateria drena, cheio de ads' },
    },
  ];

  const renderBadge = (item: { status: string; text: string }, isFinan: boolean = false) => {
    if (item.status === 'check') {
      return (
        <div className={`flex items-center gap-2 ${isFinan ? 'text-emerald-400 font-semibold' : 'text-slate-300'}`}>
          <CheckCircle2 size={18} className={isFinan ? 'text-emerald-400 shrink-0' : 'text-slate-400 shrink-0'} />
          <span className="text-xs sm:text-sm">{item.text}</span>
        </div>
      );
    }
    if (item.status === 'warn') {
      return (
        <div className="flex items-center gap-2 text-amber-400/90">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="text-xs sm:text-sm">{item.text}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <XCircle size={18} className="text-rose-500/70 shrink-0" />
        <span className="text-xs sm:text-sm">{item.text}</span>
      </div>
    );
  };

  return (
    <section id="comparativo" className="py-20 bg-slate-950 border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider">
            <Scale size={14} className="text-emerald-400" />
            <span>Comparativo Transparente</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Por que trocar planilhas e apps comuns pelo <span className="text-emerald-400">FinanSmart Pro</span>?
          </h2>

          <p className="text-slate-400 text-sm sm:text-base">
            Compare lado a lado e veja por que nossa metodologia e arquitetura superam as alternativas tradicionais do mercado.
          </p>
        </div>

        {/* Table Container */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl shadow-emerald-950/20">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left border-collapse min-w-[700px]">
              
              {/* Table Head */}
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90">
                  <th className="py-5 px-6 text-sm font-bold text-white w-2/5">
                    Recurso / Vantagem
                  </th>
                  <th className="py-5 px-6 text-sm font-extrabold text-emerald-400 bg-emerald-950/30 border-x border-emerald-500/30 w-1/4">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={16} />
                      <span>FinanSmart Pro</span>
                    </div>
                  </th>
                  <th className="py-5 px-6 text-sm font-bold text-slate-400 w-1/5">
                    Planilha Excel
                  </th>
                  <th className="py-5 px-6 text-sm font-bold text-slate-400 w-1/5">
                    Apps Tradicionais
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800/60">
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-800/30 transition-colors">
                    
                    {/* Feature Name & Description */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm text-white">{row.feature}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{row.desc}</div>
                    </td>

                    {/* FinanSmart Pro (Highlighted) */}
                    <td className="py-4 px-6 bg-emerald-950/20 border-x border-emerald-500/20">
                      {renderBadge(row.finan, true)}
                    </td>

                    {/* Excel */}
                    <td className="py-4 px-6">
                      {renderBadge(row.excel)}
                    </td>

                    {/* Other Apps */}
                    <td className="py-4 px-6">
                      {renderBadge(row.apps)}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};
