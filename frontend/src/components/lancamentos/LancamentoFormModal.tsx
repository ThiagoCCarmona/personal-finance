import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.js';
import { api } from '../../services/api.js';
import { Conta, CartaoCredito, Categoria, Lancamento } from '../../types/index.js';

interface LancamentoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Lancamento | null;
}

export const LancamentoFormModal: React.FC<LancamentoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [tipo, setTipo] = useState<'despesa' | 'receita'>('despesa');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [formaPagamento, setFormaPagamento] = useState<string>('pix_debito');
  const [contaId, setContaId] = useState('');
  const [cartaoId, setCartaoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [subcategoriaId, setSubcategoriaId] = useState('');
  const [status, setStatus] = useState<'efetivado' | 'pendente'>('efetivado');

  // Modo Parcelado
  const [isParcelado, setIsParcelado] = useState(false);
  const [numParcelas, setNumParcelas] = useState('3');

  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [categoriasTree, setCategoriasTree] = useState<Categoria[]>([]);
  const [subcategoriasDisponiveis, setSubcategoriasDisponiveis] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      api.getContas().then((res) => {
        setContas(res);
        if (res.length > 0 && !contaId && !initialData) {
          setContaId(res[0].id);
        }
      }).catch(console.error);

      api.getCartoes().then((res) => {
        setCartoes(res);
        if (res.length > 0 && !cartaoId && !initialData) {
          setCartaoId(res[0].id);
        }
      }).catch(console.error);

      api.getCategorias(tipo).then((res) => {
        setCategoriasTree(res.tree);
        if (res.tree.length > 0 && !categoriaId && !initialData) {
          setCategoriaId(res.tree[0].id);
        }
      }).catch(console.error);
    }
  }, [isOpen, tipo]);

  useEffect(() => {
    if (categoriaId) {
      const selected = categoriasTree.find(c => c.id === categoriaId);
      setSubcategoriasDisponiveis(selected?.subcategorias || []);
      if (!initialData) {
        setSubcategoriaId('');
      }
    } else {
      setSubcategoriasDisponiveis([]);
    }
  }, [categoriaId, categoriasTree]);

  useEffect(() => {
    if (initialData) {
      setTipo(initialData.tipo);
      setValor(String(initialData.valor));
      setDescricao(initialData.descricao);
      setDataCompra(initialData.data_compra.split('T')[0]);
      setFormaPagamento(initialData.forma_pagamento);
      setContaId(initialData.conta_id || '');
      setCartaoId(initialData.cartao_id || '');
      setCategoriaId(initialData.categoria_id);
      setSubcategoriaId(initialData.subcategoria_id || '');
      setStatus(initialData.status);
      setIsParcelado(false);
    } else {
      setTipo('despesa');
      setValor('');
      setDescricao('');
      setDataCompra(new Date().toISOString().split('T')[0]);
      setFormaPagamento('pix_debito');
      setStatus('efetivado');
      setSubcategoriaId('');
      setIsParcelado(false);
      setNumParcelas('3');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const valNum = parseFloat(valor.replace(',', '.'));
    if (isNaN(valNum) || valNum <= 0) {
      setError('Informe um valor válido maior que zero.');
      return;
    }
    if (!descricao.trim()) {
      setError('Informe a descrição do lançamento.');
      return;
    }
    if (formaPagamento !== 'credito' && !contaId) {
      setError('Selecione a conta de origem/destino.');
      return;
    }
    if (formaPagamento === 'credito' && !cartaoId) {
      setError('Selecione o cartão de crédito.');
      return;
    }
    if (!categoriaId) {
      setError('Selecione a categoria.');
      return;
    }

    try {
      setLoading(true);

      // Se for compra parcelada no crédito
      if (formaPagamento === 'credito' && isParcelado && !initialData) {
        const n = parseInt(numParcelas, 10);
        if (n < 2) {
          setError('O parcelamento deve ser de no mínimo 2 parcelas.');
          setLoading(false);
          return;
        }

        await api.createParcelamento({
          descricao: descricao.trim(),
          valor_total: valNum,
          num_parcelas: n,
          cartao_id: cartaoId,
          categoria_id: categoriaId,
          subcategoria_id: subcategoriaId || null,
          data_compra: dataCompra,
        });
      } else {
        // Lançamento normal à vista
        const payload = {
          tipo,
          valor: valNum,
          descricao: descricao.trim(),
          data_compra: dataCompra,
          forma_pagamento: formaPagamento,
          conta_id: formaPagamento !== 'credito' ? contaId || null : null,
          cartao_id: formaPagamento === 'credito' ? cartaoId || null : null,
          categoria_id: categoriaId,
          subcategoria_id: subcategoriaId || null,
          status,
        };

        if (initialData) {
          await api.updateLancamento(initialData.id, payload);
        } else {
          await api.createLancamento(payload);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao salvar lançamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Lançamento' : 'Novo Lançamento Rápido'}
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
            onClick={() => { setTipo('despesa'); }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              tipo === 'despesa'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Despesa
          </button>
          <button
            type="button"
            onClick={() => { setTipo('receita'); setIsParcelado(false); }}
            className={`py-2 text-sm font-semibold rounded-lg transition-all ${
              tipo === 'receita'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Receita
          </button>
        </div>

        {/* Valor e Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {isParcelado ? 'Valor Total da Compra (R$) *' : 'Valor (R$) *'}
            </label>
            <input
              type="text"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-lg font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Data da Compra *
            </label>
            <input
              type="date"
              required
              value={dataCompra}
              onChange={(e) => setDataCompra(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Descrição *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Mercado, Assinatura, Restaurante..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Forma de Pagamento */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Forma de Pagamento *
          </label>
          <select
            value={formaPagamento}
            onChange={(e) => {
              setFormaPagamento(e.target.value);
              if (e.target.value !== 'credito') setIsParcelado(false);
            }}
            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pix_debito">PIX</option>
            <option value="credito">Cartão de Crédito</option>
            <option value="debito">Cartão de Débito</option>
            <option value="dinheiro">Dinheiro em Espécie</option>
            <option value="transferencia">Transferência / TED</option>
            <option value="outros">Outros</option>
          </select>
        </div>

        {/* Conta ou Cartão de Crédito */}
        {formaPagamento === 'credito' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Cartão de Crédito *
              </label>
              <select
                value={cartaoId}
                onChange={(e) => setCartaoId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cartoes.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.apelido} (Fecha dia {card.dia_fechamento} / Vence dia {card.dia_vencimento})
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle de Compra Parcelada */}
            {!initialData && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Compra Parcelada?</span>
                  <span className="text-[11px] text-slate-500">Gera as N parcelas futuras na fatura</span>
                </div>
                <input
                  type="checkbox"
                  checked={isParcelado}
                  onChange={(e) => setIsParcelado(e.target.checked)}
                  className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
                />
              </div>
            )}

            {isParcelado && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Número de Parcelas *
                </label>
                <input
                  type="number"
                  min={2}
                  max={96}
                  value={numParcelas}
                  onChange={(e) => setNumParcelas(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Conta de Origem/Destino *
            </label>
            <select
              value={contaId}
              onChange={(e) => setContaId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.apelido} ({c.instituicao_nome})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Categoria e Subcategoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Categoria *
            </label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoriasTree.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Subcategoria (Opcional)
            </label>
            <select
              value={subcategoriaId}
              onChange={(e) => setSubcategoriaId(e.target.value)}
              disabled={subcategoriasDisponiveis.length === 0}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhuma</option>
              {subcategoriasDisponiveis.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
          >
            {loading ? 'Salvando...' : isParcelado ? 'Gerar Compra Parcelada' : initialData ? 'Salvar Alterações' : 'Adicionar Lançamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
