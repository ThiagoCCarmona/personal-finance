import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { Recorrencia, Conta, CartaoCredito, Categoria } from '../../types/index.js';

interface RecorrenciaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Recorrencia | null;
  contas: Conta[];
  cartoes: CartaoCredito[];
  categorias: Categoria[];
}

export const RecorrenciaFormModal: React.FC<RecorrenciaFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  contas,
  cartoes,
  categorias,
}) => {
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<string>('pix_debito');
  const [contaId, setContaId] = useState<string>('');
  const [cartaoId, setCartaoId] = useState<string>('');
  const [frequencia, setFrequencia] = useState<'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'>('mensal');
  const [diaReferencia, setDiaReferencia] = useState('5');
  const [diaEstimadoFatura, setDiaEstimadoFatura] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTipo(initialData.tipo);
      setDescricao(initialData.descricao);
      setValor(String(initialData.valor));
      setCategoriaId(initialData.categoria_id);
      setFormaPagamento(initialData.forma_pagamento);
      setContaId(initialData.conta_id || '');
      setCartaoId(initialData.cartao_id || '');
      setFrequencia(initialData.frequencia);
      setDiaReferencia(String(initialData.dia_referencia));
      setDiaEstimadoFatura(initialData.dia_estimado_na_fatura ? String(initialData.dia_estimado_na_fatura) : '');
      setDataInicio(initialData.data_inicio.split('T')[0]);
    } else {
      setTipo('despesa');
      setDescricao('');
      setValor('');
      setCategoriaId(categorias[0]?.id || '');
      setFormaPagamento('pix_debito');
      setContaId(contas[0]?.id || '');
      setCartaoId('');
      setFrequencia('mensal');
      setDiaReferencia('5');
      setDiaEstimadoFatura('');
      setDataInicio(new Date().toISOString().split('T')[0]);
    }
    setError(null);
  }, [initialData, isOpen, contas, cartoes, categorias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const valNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valNum) || valNum <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }
    if (!descricao.trim()) {
      setError('Informe a descrição da recorrência.');
      return;
    }
    if (!categoriaId) {
      setError('Selecione uma categoria.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        tipo,
        descricao: descricao.trim(),
        valor: valNum,
        categoria_id: categoriaId,
        forma_pagamento: formaPagamento,
        conta_id: formaPagamento !== 'credito' ? contaId || null : null,
        cartao_id: formaPagamento === 'credito' ? cartaoId || null : null,
        frequencia,
        dia_referencia: parseInt(diaReferencia, 10),
        dia_estimado_na_fatura: diaEstimadoFatura ? parseInt(diaEstimadoFatura, 10) : null,
        data_inicio: dataInicio,
      };

      if (initialData) {
        await api.updateRecorrencia(initialData.id, payload);
      } else {
        await api.createRecorrencia(payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar recorrência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Recorrência' : 'Nova Despesa / Receita Recorrente'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
            {error}
          </div>
        )}

        {/* Tipo: Despesa vs Receita */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTipo('despesa')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              tipo === 'despesa'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Despesa Fixa
          </button>
          <button
            type="button"
            onClick={() => setTipo('receita')}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              tipo === 'receita'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Receita Fixa
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Descrição *</label>
          <input
            type="text"
            required
            placeholder="Ex: Aluguel, Netflix, Salário, Internet..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Valor (R$) *</label>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Frequência *</label>
            <select
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mensal">Mensal</option>
              <option value="bimestral">Bimestral</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Forma de Pagamento *</label>
          <select
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pix_debito">PIX</option>
            <option value="debito">Débito em Conta</option>
            <option value="credito">Cartão de Crédito</option>
            <option value="transferencia">Transferência / TED</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        {/* Seletor condicional: Cartão vs Conta */}
        {formaPagamento === 'credito' ? (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Cartão de Crédito *</label>
            <select
              value={cartaoId}
              onChange={(e) => setCartaoId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione o Cartão</option>
              {cartoes.map((card) => (
                <option key={card.id} value={card.id}>{card.apelido}</option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Conta Bancária / Carteira</label>
            <select
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhuma (ou manual)</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>{c.apelido} ({c.instituicao_nome})</option>
              ))}
            </select>
          </div>
        )}

        {/* Categoria */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Categoria *</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nome} ({cat.tipo})</option>
            ))}
          </select>
        </div>

        {/* Dias de Referência e Estimado na Fatura */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Dia de Referência *</label>
            <input
              type="number"
              min={1}
              max={31}
              required
              value={diaReferencia}
              onChange={(e) => setDiaReferencia(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Dia do mês que ocorre</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Dia Estimado na Fatura</label>
            <input
              type="number"
              min={1}
              max={31}
              placeholder="Opcional"
              value={diaEstimadoFatura}
              onChange={(e) => setDiaEstimadoFatura(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Quando bate no cartão</span>
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
            {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Recorrência'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
