import React, { useState } from 'react';
import { 
  Calculator, 
  Calendar, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';

export const PredictabilitySection: React.FC = () => {
  const [valorCompra, setValorCompra] = useState(3500);
  const [parcelas, setParcelas] = useState(10);
  const [taxaJuros, setTaxaJuros] = useState(1.99); // 1.99% ao mês típica de parcelamento/empréstimo

  // Cálculo Tabela Price: PMT = PV * (i * (1 + i)^n) / ((1 + i)^n - 1)
  const i = taxaJuros / 100;
  const pmtPrice = i > 0 
    ? (valorCompra * (i * Math.pow(1 + i, parcelas))) / (Math.pow(1 + i, parcelas) - 1)
    : valorCompra / parcelas;
  const totalPagoPrice = pmtPrice * parcelas;
  const jurosTotal = totalPagoPrice - valorCompra;

  // Projeção do Mês Seguinte Simulada
  const saldoAtual = 14200;
  const receitasPrevistas = 9500;
  const faturasCartoesFuturas = 3200 + pmtPrice;
  const contasFixas = 4100;
  const saldoProjetado = saldoAtual + receitasPrevistas - (faturasCartoesFuturas + contasFixas);

  return (
    <section id="previsibilidade" className="py-20 bg-slate-900/60 border-t border-slate-800 relative overflow-hidden">
      
      {/* Background Accent */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-cyan-500/10 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Calendar size={14} />
            <span>Previsibilidade em Tempo Real</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Saiba quanto vai sobrar no mês que vem <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              antes de tomar qualquer decisão hoje
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Antes de passar o cartão em 10x ou comprar à vista, veja exatamente o impacto nas faturas futuras e descubra se o seu saldo bancário aguentará o tranco.
          </p>
        </div>

        {/* 2-Column Grid: Projected Balance + Price Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Box 1: Saldo Projetado no Mês Seguinte */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Cálculo Automático
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-mono font-bold">
                  PROJEÇÃO ATIVA
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Saldo Projetado no Mês Seguinte</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Considera saldos atuais + receitas recorrentes - parcelas e faturas futuras já contratadas.
                </p>
              </div>

              {/* Big Projected Number */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400 font-medium">Saldo Livre Estimado em 30 dias</span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                  R$ {saldoProjetado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <span className="text-[11px] text-slate-500 block pt-1">
                  Saldo saudável para absorver a nova compra simulada
                </span>
              </div>

              {/* Breakdown Rows */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 flex justify-between">
                  <span className="text-slate-400">Receitas Previstas (Salário + Rendas):</span>
                  <span className="font-semibold text-emerald-400">+ R$ {receitasPrevistas.toLocaleString('pt-BR')},00</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 flex justify-between">
                  <span className="text-slate-400">Contas Fixas e Assinaturas:</span>
                  <span className="font-semibold text-rose-400">- R$ {contasFixas.toLocaleString('pt-BR')},00</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 flex justify-between">
                  <span className="text-slate-400">Faturas de Cartão (com nova parcela):</span>
                  <span className="font-semibold text-rose-400">- R$ {Math.round(faturasCartoesFuturas).toLocaleString('pt-BR')},00</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900 flex items-center gap-2 text-xs text-slate-400">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>Evite o efeito "bola de neve" antes de comprometer seu limite.</span>
            </div>
          </div>

          {/* Box 2: Simulador com Tabela Price vs. Juros Simples */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  <Calculator size={20} className="text-cyan-400" />
                  <span>Simulador de Gastos com Juros (Tabela Price)</span>
                </div>
                <span className="text-xs text-slate-400">Simulador Nativo</span>
              </div>

              {/* Inputs Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1">Valor da Compra</label>
                  <div className="flex items-center text-sm font-bold text-white">
                    <span className="text-slate-500 mr-1">R$</span>
                    <input 
                      type="number"
                      value={valorCompra}
                      onChange={(e) => setValorCompra(Math.max(100, Number(e.target.value)))}
                      className="w-full bg-transparent outline-none font-bold text-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1">Qtd. de Parcelas</label>
                  <select
                    value={parcelas}
                    onChange={(e) => setParcelas(Number(e.target.value))}
                    className="w-full bg-transparent outline-none font-bold text-white text-sm cursor-pointer"
                  >
                    {[1, 2, 3, 6, 10, 12, 18, 24, 36].map((n) => (
                      <option key={n} value={n} className="bg-slate-900 text-white">
                        {n}x parcelas
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1">Juros ao Mês (%)</label>
                  <div className="flex items-center text-sm font-bold text-white">
                    <input 
                      type="number"
                      step="0.1"
                      value={taxaJuros}
                      onChange={(e) => setTaxaJuros(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-transparent outline-none font-bold text-white"
                    />
                    <span className="text-slate-500 ml-1">%</span>
                  </div>
                </div>
              </div>

              {/* Simulation Result Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                  <span className="text-xs text-slate-400">Valor da Parcela Fixa</span>
                  <div className="text-xl font-bold text-cyan-400 mt-1">
                    R$ {pmtPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-500">por mês na Tabela Price</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">Total Pago ao Final</span>
                  <div className="text-xl font-bold text-white mt-1">
                    R$ {totalPagoPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-500">{parcelas}x prestações</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30">
                  <span className="text-xs text-slate-400">Custo dos Juros</span>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    R$ {jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-rose-300">dinheiro "queimado" em juros</span>
                </div>
              </div>

              {/* Callout on decision */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                <AlertCircle size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Dica do Sistema:</strong> Se pagar à vista conseguir um desconto superior a <strong>R$ {Math.round(jurosTotal)}</strong>, a compra à vista é matematicamente superior ao parcelamento. O simulador já faz essa conta para você antes de ir ao caixa!
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-between items-center text-xs text-slate-500">
              <span>Amortização francesa (Tabela Price) nativa</span>
              <span className="text-cyan-400 font-semibold">100% Automático</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
