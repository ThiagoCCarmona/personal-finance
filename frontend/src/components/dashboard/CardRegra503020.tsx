import React from 'react';
import { ShieldCheck, Heart, PiggyBank, AlertTriangle, CheckCircle } from 'lucide-react';
import { Regra503020 } from '../../types/index.js';
import { PrivacyValue } from '../common/PrivacyValue.js';

interface CardRegra503020Props {
  regra?: Regra503020;
}

export const CardRegra503020: React.FC<CardRegra503020Props> = ({ regra }) => {
  if (!regra || regra.baseReceitas <= 0) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Divisão Salarial 50-30-20
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre suas receitas fixas recorrentes para ativar a distribuição recomendada de gastos.
            </p>
          </div>
          <span className="text-xs px-3 py-1 bg-slate-800 text-slate-400 rounded-full font-medium">
            Aguardando receitas
          </span>
        </div>
      </div>
    );
  }

  const { essenciais, estiloVida, investimentos, baseReceitas } = regra;

  const grupos = [
    {
      nome: '50% Gastos Essenciais',
      subtitulo: 'Moradia, alimentação, contas de consumo, saúde, transporte',
      icone: ShieldCheck,
      corBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      corBarra: essenciais.estourado
        ? 'bg-rose-500'
        : essenciais.percentualDisponivel < 20
        ? 'bg-amber-500'
        : 'bg-blue-500',
      corFundoBarra: 'bg-blue-950/40',
      corTexto: 'text-blue-400',
      dados: essenciais,
    },
    {
      nome: '30% Estilo de Vida',
      subtitulo: 'Lazer, restaurantes, assinaturas, compras pessoais, passeios',
      icone: Heart,
      corBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      corBarra: estiloVida.estourado
        ? 'bg-rose-500'
        : estiloVida.percentualDisponivel < 20
        ? 'bg-amber-500'
        : 'bg-purple-500',
      corFundoBarra: 'bg-purple-950/40',
      corTexto: 'text-purple-400',
      dados: estiloVida,
    },
    {
      nome: '20% Investimentos & Metas',
      subtitulo: 'Reserva de emergência, aportes, previdência e futuro',
      icone: PiggyBank,
      corBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      corBarra: investimentos.estourado
        ? 'bg-rose-500'
        : investimentos.percentualDisponivel < 20
        ? 'bg-amber-500'
        : 'bg-emerald-500',
      corFundoBarra: 'bg-emerald-950/40',
      corTexto: 'text-emerald-400',
      dados: investimentos,
    },
  ];

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>Metodologia 50-30-20</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              Educação Financeira
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Distribuição ideal com base na sua receita de{' '}
            <span className="font-semibold text-slate-200">
              <PrivacyValue value={baseReceitas} />
            </span>
            . A barra diminui conforme você realiza despesas.
          </p>
        </div>

        <div className="text-left sm:text-right bg-slate-950/60 px-3.5 py-2 rounded-2xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-medium block">Base Salarial / Receita</span>
          <span className="text-sm font-bold text-emerald-400">
            <PrivacyValue value={baseReceitas} />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {grupos.map((g) => {
          const Icone = g.icone;
          const { dados } = g;

          return (
            <div
              key={g.nome}
              className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl border ${g.corBadge}`}>
                      <Icone size={16} />
                    </div>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                      {g.nome}
                    </span>
                  </div>
                  {dados.estourado ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <AlertTriangle size={11} /> Estourado
                    </span>
                  ) : dados.percentualDisponivel <= 15 ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Atenção
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle size={11} /> Sob controle
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {g.subtitulo}
                </p>
              </div>

              {/* Valores: Teto, Gasto e Disponível */}
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Teto do Mês:</span>
                  <span className="font-bold text-slate-200">
                    <PrivacyValue value={dados.teto} />
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Já Gasto:</span>
                  <span className={`font-semibold ${dados.estourado ? 'text-rose-400' : 'text-slate-300'}`}>
                    <PrivacyValue value={dados.gasto} />
                  </span>
                </div>

                {/* Barra de Progresso Decrescente */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Saldo Disponível:</span>
                    <span className={`font-bold ${dados.estourado ? 'text-rose-400' : g.corTexto}`}>
                      <PrivacyValue value={dados.restante} /> ({dados.percentualDisponivel}%)
                    </span>
                  </div>

                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${g.corFundoBarra}`}>
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${g.corBarra}`}
                      style={{ width: `${dados.estourado ? 100 : dados.percentualDisponivel}%` }}
                      title={`${dados.percentualDisponivel}% disponível`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
