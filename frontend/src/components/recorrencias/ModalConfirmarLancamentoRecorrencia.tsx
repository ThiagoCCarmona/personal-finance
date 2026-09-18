import React, { useState } from 'react';
import { X, Check, ArrowDown, ArrowUp, DollarSign } from 'lucide-react';

interface ModalConfirmarLancamentoRecorrenciaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, anoMes: string, valor: number) => Promise<void>;
  recorrencia: {
    id: string;
    descricao: string;
    valor: number;
    natureza?: 'fixo' | 'variavel';
    tipo?: 'despesa' | 'receita';
  } | null;
  anoMes: string;
}

export const ModalConfirmarLancamentoRecorrencia: React.FC<ModalConfirmarLancamentoRecorrenciaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recorrencia,
  anoMes,
}) => {
  if (!isOpen || !recorrencia) return null;

  const [valor, setValor] = useState<number>(recorrencia.valor || 0);
  const [loading, setLoading] = useState(false);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<'mesmo' | 'menor' | 'maior'>('mesmo');

  const handleSelectOpcao = (opcao: 'mesmo' | 'menor' | 'maior') => {
    setOpcaoSelecionada(opcao);
    if (opcao === 'mesmo') {
      setValor(recorrencia.valor);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valor <= 0) {
      alert('Informe um valor válido maior que zero.');
      return;
    }
    try {
      setLoading(true);
      await onConfirm(recorrencia.id, anoMes, valor);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao lançar recorrência.');
    } finally {
      setLoading(false);
    }
  };

  const isVariavel = recorrencia.natureza === 'variavel';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Confirmar Valor do Lançamento
            </h3>
            <span className="text-xs text-slate-400">
              Competência: <strong className="text-slate-200">{anoMes}</strong>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">{recorrencia.descricao}</span>
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
              isVariavel 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {isVariavel ? 'Gasto Variável' : 'Gasto Fixo'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Valor de referência cadastrado:{' '}
            <strong className="text-slate-300">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(recorrencia.valor)}
            </strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              O valor deste mês foi:
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectOpcao('mesmo')}
                className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                  opcaoSelecionada === 'mesmo'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <DollarSign size={14} />
                <span>O mesmo</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOpcao('menor')}
                className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                  opcaoSelecionada === 'menor'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ArrowDown size={14} className="text-emerald-400" />
                <span>Menor</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOpcao('maior')}
                className={`p-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                  opcaoSelecionada === 'maior'
                    ? 'bg-rose-600/20 border-rose-500 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ArrowUp size={14} className="text-rose-400" />
                <span>Maior</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Valor Real a Lançar (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={valor || ''}
                onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-slate-100 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="0,00"
                autoFocus={opcaoSelecionada !== 'mesmo'}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Check size={14} />
              <span>{loading ? 'Lançando...' : 'Confirmar e Lançar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
