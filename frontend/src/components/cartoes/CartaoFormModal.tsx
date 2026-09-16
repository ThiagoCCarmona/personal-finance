import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { CartaoCredito, Instituicao } from '../../types/index.js';

interface CartaoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: CartaoCredito | null;
  instituicoes: Instituicao[];
}

export const CartaoFormModal: React.FC<CartaoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  instituicoes,
}) => {
  const [apelido, setApelido] = useState('');
  const [instituicaoId, setInstituicaoId] = useState('');
  const [limite, setLimite] = useState('');
  const [diaFechamento, setDiaFechamento] = useState('15');
  const [diaVencimento, setDiaVencimento] = useState('25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setApelido(initialData.apelido);
      setInstituicaoId(initialData.instituicao_id);
      setLimite(String(initialData.limite));
      setDiaFechamento(String(initialData.dia_fechamento));
      setDiaVencimento(String(initialData.dia_vencimento));
    } else {
      setApelido('');
      setInstituicaoId(instituicoes[0]?.id || '');
      setLimite('');
      setDiaFechamento('15');
      setDiaVencimento('25');
    }
    setError(null);
  }, [initialData, isOpen, instituicoes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const limNum = parseFloat(limite.replace(',', '.'));
    if (isNaN(limNum) || limNum <= 0) {
      setError('Informe um limite válido maior que zero.');
      return;
    }
    const fechamento = parseInt(diaFechamento, 10);
    const vencimento = parseInt(diaVencimento, 10);
    if (fechamento < 1 || fechamento > 31 || vencimento < 1 || vencimento > 31) {
      setError('Os dias de fechamento e vencimento devem estar entre 1 e 31.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        apelido: apelido.trim(),
        instituicao_id: instituicaoId,
        limite: limNum,
        dia_fechamento: fechamento,
        dia_vencimento: vencimento,
      };

      if (initialData) {
        await api.updateCartao(initialData.id, payload);
      } else {
        await api.createCartao(payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar cartão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Cartão de Crédito' : 'Novo Cartão de Crédito'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Apelido do Cartão *</label>
          <input
            type="text"
            required
            placeholder="Ex: Nubank Mastercard Black, XP Infinite..."
            value={apelido}
            onChange={(e) => setApelido(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Instituição Bancária *</label>
          <select
            value={instituicaoId}
            onChange={(e) => setInstituicaoId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {instituicoes.map((inst) => (
              <option key={inst.id} value={inst.id}>{inst.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Limite Total (R$) *</label>
          <input
            type="text"
            inputMode="decimal"
            required
            placeholder="5000,00"
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Dia do Fechamento *</label>
            <input
              type="number"
              min={1}
              max={31}
              required
              value={diaFechamento}
              onChange={(e) => setDiaFechamento(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Melhor dia para compras</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Dia do Vencimento *</label>
            <input
              type="number"
              min={1}
              max={31}
              required
              value={diaVencimento}
              onChange={(e) => setDiaVencimento(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Data de débito da fatura</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-600/30"
          >
            {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Cartão'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
