import React from 'react';
import { CreditCard, Calendar, ArrowRight, Edit2, Trash2 } from 'lucide-react';
import { CartaoCredito } from '../../types/index.js';
import { PrivacyValue } from '../common/PrivacyValue.js';

interface CartaoCardProps {
  cartao: CartaoCredito;
  onEdit: (cartao: CartaoCredito) => void;
  onDelete: (id: string) => void;
  onVerFatura: (cartao: CartaoCredito) => void;
}

export const CartaoCard: React.FC<CartaoCardProps> = ({
  cartao,
  onEdit,
  onDelete,
  onVerFatura,
}) => {
  const percentual = Math.min(100, cartao.percentual_utilizado || 0);

  return (
    <div className="relative p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between space-y-5">
      {/* Topo do Cartão: Instituição, Apelido e Ações */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: cartao.instituicao_cor || '#3b82f6' }}
          >
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">{cartao.apelido}</h3>
            <span className="text-xs text-slate-400 font-medium">
              {cartao.instituicao_nome}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(cartao)}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Editar cartão"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(cartao.id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Excluir cartão"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Fatura Atual e Limite Disponível */}
      <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-800/80">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Fatura Atual</span>
            {cartao.fatura_atual_paga && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 rounded-md">
                Paga
              </span>
            )}
          </div>
          <div className={`text-xl font-black mt-0.5 ${cartao.fatura_atual_paga ? 'text-emerald-400' : 'text-rose-400'}`}>
            <PrivacyValue value={cartao.fatura_atual ?? 0} />
          </div>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Limite Disponível</span>
          <div className="text-xl font-black text-emerald-400 mt-0.5">
            <PrivacyValue value={cartao.limite_disponivel ?? cartao.limite} />
          </div>
        </div>
      </div>

      {/* Barra de Progresso do Limite */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-400 font-medium">
          <span>Utilizado: {percentual}%</span>
          <span>Limite: <PrivacyValue value={cartao.limite} /></span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              percentual > 85 ? 'bg-rose-500' : percentual > 60 ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${percentual}%` }}
          />
        </div>
      </div>

      {/* Rodapé: Datas de Fechamento / Vencimento e Botão Ver Fatura */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-slate-500" />
            <span>Fecha dia <strong>{cartao.dia_fechamento}</strong></span>
          </div>
          <span>•</span>
          <div>
            <span>Vence dia <strong>{cartao.dia_vencimento}</strong></span>
          </div>
        </div>

        <button
          onClick={() => onVerFatura(cartao)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          <span>Fatura</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
