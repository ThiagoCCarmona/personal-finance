import React, { useState } from 'react';
import { 
  PieChart, 
  ShieldCheck, 
  TrendingUp, 
  Compass, 
  Sliders
} from 'lucide-react';

export const Methodology503020Section: React.FC = () => {
  const [salarioBase, setSalarioBase] = useState(6000);

  const essenciais = salarioBase * 0.50;
  const estiloVida = salarioBase * 0.30;
  const investimentos = salarioBase * 0.20;

  // Gastos simulados no meio do mês
  const gastoEssenciais = essenciais * 0.65;
  const gastoEstiloVida = estiloVida * 0.55;
  const saldoEstiloVidaRestante = estiloVida - gastoEstiloVida;
  
  // Teto diário considerando 12 dias restantes no mês
  const diasRestantes = 12;
  const tetoDiario = Math.max(0, Math.round(saldoEstiloVidaRestante / diasRestantes));

  return (
    <section id="metodologia" className="py-20 bg-slate-950 border-t border-slate-800/80 relative overflow-hidden">
      
      {/* Background Accent */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[150px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <PieChart size={14} />
            <span>Engenharia Orçamentária</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Metodologia 50-30-20 Automatizada: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Gaste sem culpa com teto diário seguro
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            <strong className="text-slate-200">A maioria dos aplicativos só avisa onde você já gastou depois que o dinheiro acabou.</strong> O FinanSmart Pro inverte a lógica: nós calculamos exatamente quanto você ainda tem de margem segura para viver hoje sem comprometer suas metas de amanhã.
          </p>
        </div>

        {/* 1. Barra Unificada 50-30-20 no Topo (Segmented Bar Horizontal) */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 mb-8 space-y-4 shadow-xl">
          
          {/* Slider de Renda no Topo */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Sliders size={20} />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">Simulador de Renda Mensal</span>
                <div className="text-xl sm:text-2xl font-black text-white">
                  R$ {salarioBase.toLocaleString('pt-BR')},00
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Ajustar Renda:</span>
              <input
                type="range"
                min={3000}
                max={25000}
                step={500}
                value={salarioBase}
                onChange={(e) => setSalarioBase(Number(e.target.value))}
                className="w-full sm:w-64 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Barra Segmentada Contínua Horizontal */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span className="text-blue-400">50% Essenciais (R$ {essenciais.toLocaleString('pt-BR')})</span>
              <span className="text-emerald-400">30% Estilo de Vida (R$ {estiloVida.toLocaleString('pt-BR')})</span>
              <span className="text-indigo-400">20% Investimentos (R$ {investimentos.toLocaleString('pt-BR')})</span>
            </div>

            <div className="w-full h-4 rounded-full overflow-hidden flex p-0.5 bg-slate-950 border border-slate-800 gap-0.5">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-l-full transition-all duration-300" 
                style={{ width: '50%' }}
                title="50% Essenciais"
              />
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300" 
                style={{ width: '30%' }}
                title="30% Estilo de Vida"
              />
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-r-full transition-all duration-300" 
                style={{ width: '20%' }}
                title="20% Investimentos"
              />
            </div>
          </div>
        </div>

        {/* 2. Grid de 3 Colunas Lado a Lado (50% | 30% | 20%) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: 50% Essenciais */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold font-mono">
                  50%
                </span>
                <span className="text-xs text-slate-500">Gastos Essenciais</span>
              </div>
              
              <h3 className="text-lg font-bold text-white">Moradia, Mercado & Contas</h3>
              <div className="text-2xl font-black text-blue-400">
                R$ {essenciais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: '65%' }} />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>R$ {gastoEssenciais.toLocaleString('pt-BR')} consumidos</span>
                <span className="text-blue-300 font-semibold">R$ {(essenciais - gastoEssenciais).toLocaleString('pt-BR')} restantes</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
              Teto obrigatório para despesas que você não pode cortar sem mudar de padrão.
            </p>
          </div>

          {/* Card 2: 30% Estilo de Vida (Destaque) */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-emerald-500/60 shadow-xl shadow-emerald-500/10 space-y-3 flex flex-col justify-between relative">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                  30%
                </span>
                <span className="text-xs text-emerald-400 font-semibold">Estilo de Vida & Lazer</span>
              </div>

              <h3 className="text-lg font-bold text-white">Restaurantes, Saídas & Lazer</h3>
              <div className="text-2xl font-black text-emerald-400">
                R$ {estiloVida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '55%' }} />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>R$ {gastoEstiloVida.toLocaleString('pt-BR')} gastos</span>
                <span className="text-emerald-300 font-bold">R$ {saldoEstiloVidaRestante.toLocaleString('pt-BR')} livres</span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-300/80 border-t border-slate-800/80 pt-3">
              Gaste livremente aqui sem culpa, sabendo que as contas fixas e o futuro já estão pagos.
            </p>
          </div>

          {/* Card 3: 20% Investimentos & Metas */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold font-mono">
                  20%
                </span>
                <span className="text-xs text-slate-500">Futuro & Metas</span>
              </div>

              <h3 className="text-lg font-bold text-white">Investimentos & Reserva</h3>
              <div className="text-2xl font-black text-indigo-400">
                R$ {investimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span className="text-indigo-300 font-medium">100% Aportado</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <TrendingUp size={12} /> Protegido
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
              Pago no primeiro dia do mês antes de qualquer outro gasto supérfluo.
            </p>
          </div>

        </div>

        {/* 3. Teto Seguro Diário (Banner Horizontal Elegante) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/50 border border-emerald-500/40 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Compass size={28} />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Cálculo em Tempo Real
              </span>
              <h4 className="text-lg sm:text-xl font-extrabold text-white">
                Seu Teto de Gasto Seguro Hoje: <span className="text-emerald-400">R$ {tetoDiario},00 / dia</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Considerando os {diasRestantes} dias restantes do mês, você pode gastar até R$ {tetoDiario},00 hoje sem comprometer suas contas essenciais e investimentos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 font-semibold">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Orçamento 100% Blindado</span>
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
