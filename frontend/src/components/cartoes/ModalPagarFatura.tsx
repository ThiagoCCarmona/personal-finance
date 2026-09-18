import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { DateInput } from '../common/DateInput.js';
import { PrivacyValue } from '../common/PrivacyValue.js';
import { api } from '../../services/api.js';
import { FaturaDetalhe, Conta } from '../../types/index.js';
import { CreditCard, Landmark, CheckCircle2, AlertCircle } from 'lucide-react';

interface ModalPagarFaturaProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  faturaDetalhe: FaturaDetalhe;
  contas: Conta[];
}

export const ModalPagarFatura: React.FC<ModalPagarFaturaProps> = ({
  isOpen,
  onClose,
  onSuccess,
  faturaDetalhe,
  contas,
}) => {
  const [metodo, setMetodo] = useState<'conta' | 'avulso'>('conta');
  const [contaId, setContaId] = useState<string>(contas[0]?.id || '');
  const [dataPagamento, setDataPagamento] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ano, mes] = (faturaDetalhe.anoMes || '').split('-');
  const mesFormatado = `${mes}/${ano}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (metodo === 'conta' && !contaId) {
      setError('Selecione a conta bancária para debitar o valor da fatura.');
      return;
    }

    try {
      setLoading(true);
      await api.pagarFaturaCartao(faturaDetalhe.cartao.id, {
        anoMes: faturaDetalhe.anoMes,
        dataPagamento,
        contaId: metodo === 'conta' ? contaId : null,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pagamento da fatura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pagar Fatura do Cartão"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5">
            <AlertCircle size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Resumo da Fatura a ser Liquidada */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CreditCard size={15} className="text-blue-400" />
              <span className="font-semibold text-slate-200">{faturaDetalhe.cartao.apelido}</span>
            </div>
            <span className="font-mono text-slate-400">Competência: {mesFormatado}</span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Valor Total da Fatura</span>
            <div className="text-2xl font-black text-rose-400">
              <PrivacyValue value={faturaDetalhe.totalFatura} />
            </div>
          </div>
        </div>

        {/* Escolha do Método de Pagamento */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Forma de Pagamento
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            {/* Opção 1: Debitar de conta */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                metodo === 'conta'
                  ? 'bg-blue-600/10 border-blue-500/80 text-slate-100 ring-1 ring-blue-500/40'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="metodo"
                value="conta"
                checked={metodo === 'conta'}
                onChange={() => setMetodo('conta')}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div className="space-y-1 text-xs flex-1">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Landmark size={14} className="text-blue-400" />
                  <span>Debitar de uma Conta Bancária Cadastrada</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Gera uma despesa de saída na conta escolhida e abate automaticamente o saldo dela.
                </p>
              </div>
            </label>

            {/* Opção 2: Apenas marcar como paga */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                metodo === 'avulso'
                  ? 'bg-emerald-600/10 border-emerald-500/80 text-slate-100 ring-1 ring-emerald-500/40'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="radio"
                name="metodo"
                value="avulso"
                checked={metodo === 'avulso'}
                onChange={() => setMetodo('avulso')}
                className="mt-1 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="space-y-1 text-xs flex-1">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>Apenas marcar fatura como paga</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Mata a fatura e libera o limite do cartão sem alterar o saldo de nenhuma conta do sistema.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Seleção da Conta Bancária (se escolheu debitar de conta) */}
        {metodo === 'conta' && (
          <div className="space-y-1.5 animate-fadeIn">
            <label className="block text-xs font-medium text-slate-400">
              Conta para Débito *
            </label>
            {contas.length === 0 ? (
              <p className="text-xs text-rose-400">Nenhuma conta bancária ativa cadastrada.</p>
            ) : (
              <select
                value={contaId}
                onChange={(e) => setContaId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.apelido} ({c.instituicao_nome || 'Banco'}) — Saldo: R$ {Number(c.saldo_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Data do Pagamento */}
        <div>
          <DateInput
            label="Data do Pagamento *"
            value={dataPagamento}
            onChange={setDataPagamento}
            required
          />
        </div>

        {/* Ações */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            <span>{loading ? 'Liquidando...' : 'Confirmar Pagamento'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
