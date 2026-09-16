import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, ChevronLeft, ChevronRight, ShoppingBag, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { CartaoCredito, Instituicao, FaturaDetalhe, CompraParcelada, Categoria } from '../types/index.js';
import { CartaoCard } from '../components/cartoes/CartaoCard.js';
import { CartaoFormModal } from '../components/cartoes/CartaoFormModal.js';
import { Modal } from '../components/common/Modal.js';
import { PrivacyValue } from '../components/common/PrivacyValue.js';

export const CartoesPage: React.FC = () => {
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [parcelamentos, setParcelamentos] = useState<CompraParcelada[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  // Modais
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CartaoCredito | null>(null);

  // Modal Fatura
  const [isFaturaModalOpen, setIsFaturaModalOpen] = useState(false);
  const [faturaCard, setFaturaCard] = useState<CartaoCredito | null>(null);
  const [faturaMes, setFaturaMes] = useState(new Date().toISOString().substring(0, 7));
  const [faturaDetalhe, setFaturaDetalhe] = useState<FaturaDetalhe | null>(null);

  // Modal Novo Parcelamento
  const [isParcelamentoModalOpen, setIsParcelamentoModalOpen] = useState(false);
  const [parcDescricao, setParcDescricao] = useState('');
  const [parcValorTotal, setParcValorTotal] = useState('');
  const [parcNumParcelas, setParcNumParcelas] = useState('3');
  const [parcCartaoId, setParcCartaoId] = useState('');
  const [parcCategoriaId, setParcCategoriaId] = useState('');
  const [parcDataCompra, setParcDataCompra] = useState(new Date().toISOString().split('T')[0]);
  const [parcError, setParcError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [cartoesData, instData, parcData, catData] = await Promise.all([
        api.getCartoes(),
        api.getInstituicoes(),
        api.getParcelamentos(),
        api.getCategorias(),
      ]);
      setCartoes(cartoesData);
      setInstituicoes(instData);
      setParcelamentos(parcData);
      setCategorias(catData.flat);
      if (cartoesData.length > 0 && !parcCartaoId) {
        setParcCartaoId(cartoesData[0].id);
      }
      if (catData.flat.length > 0 && !parcCategoriaId) {
        setParcCategoriaId(catData.flat[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de cartões:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditCard = (card: CartaoCredito) => {
    setEditingCard(card);
    setIsCardModalOpen(true);
  };

  const handleDeleteCard = async (id: string) => {
    if (!window.confirm('Deseja realmente excluir este cartão?')) return;
    try {
      await api.deleteCartao(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir cartão.');
    }
  };

  const handleVerFatura = async (card: CartaoCredito) => {
    setFaturaCard(card);
    setIsFaturaModalOpen(true);
    await carregarFatura(card.id, faturaMes);
  };

  const carregarFatura = async (cardId: string, mes: string) => {
    try {
      const res = await api.getCartaoFatura(cardId, mes);
      setFaturaDetalhe(res);
    } catch (err) {
      console.error('Erro ao carregar fatura:', err);
    }
  };

  const mudarMesFatura = (offset: number) => {
    const [ano, mes] = faturaMes.split('-').map(Number);
    const d = new Date(ano, mes - 1 + offset, 1);
    const novoAnoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setFaturaMes(novoAnoMes);
    if (faturaCard) {
      carregarFatura(faturaCard.id, novoAnoMes);
    }
  };

  const handleCriarParcelamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setParcError(null);

    const val = parseFloat(parcValorTotal.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      setParcError('Informe um valor total válido.');
      return;
    }
    const n = parseInt(parcNumParcelas, 10);
    if (n < 2) {
      setParcError('O número de parcelas deve ser de no mínimo 2.');
      return;
    }

    try {
      await api.createParcelamento({
        descricao: parcDescricao.trim(),
        valor_total: val,
        num_parcelas: n,
        cartao_id: parcCartaoId,
        categoria_id: parcCategoriaId,
        data_compra: parcDataCompra,
      });

      setIsParcelamentoModalOpen(false);
      setParcDescricao('');
      setParcValorTotal('');
      loadData();
    } catch (err: any) {
      setParcError(err.message || 'Erro ao criar compra parcelada.');
    }
  };

  const handleDeleteParcelamento = async (id: string) => {
    if (!window.confirm('Deseja excluir este parcelamento? Todas as parcelas associadas serão removidas do extrato.')) return;
    try {
      await api.deleteParcelamento(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Cartões de Crédito & Faturas</h1>
          <p className="text-sm text-slate-400">Controle de limites, faturas abertas e compras parceladas</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsParcelamentoModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
          >
            <ShoppingBag size={17} />
            <span>Nova Compra Parcelada</span>
          </button>
          <button
            onClick={() => {
              setEditingCard(null);
              setIsCardModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus size={17} />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {/* Grid de Cartões */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Seus Cartões ({cartoes.length})</h2>

        {cartoes.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-2">
            <CreditCard size={32} className="mx-auto text-slate-600" />
            <h3 className="text-sm font-medium text-slate-300">Nenhum cartão de crédito cadastrado</h3>
            <p className="text-xs text-slate-500">Cadastre seu primeiro cartão para acompanhar faturas e parcelamentos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cartoes.map((cartao) => (
              <CartaoCard
                key={cartao.id}
                cartao={cartao}
                onEdit={handleEditCard}
                onDelete={handleDeleteCard}
                onVerFatura={handleVerFatura}
              />
            ))}
          </div>
        )}
      </div>

      {/* Seção de Compras Parceladas Ativas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Compras Parceladas Ativas ({parcelamentos.length})</h2>
          <span className="text-xs text-slate-500 font-mono">Geração automática das N faturas</span>
        </div>

        {parcelamentos.length === 0 ? (
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl text-center text-xs text-slate-500">
            Nenhuma compra parcelada registrada no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parcelamentos.map((parc) => {
              const percPago = Math.round((parc.parcelas_pagas / parc.num_parcelas) * 100);
              return (
                <div key={parc.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">{parc.descricao}</h4>
                      <span className="text-xs text-slate-400">
                        {parc.cartao_apelido} • {parc.categoria_nome}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteParcelamento(parc.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Excluir parcelamento"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Progresso: <strong>{parc.parcelas_pagas} de {parc.num_parcelas}</strong> pagas
                    </span>
                    <span className="font-bold text-slate-200">
                      <PrivacyValue value={parc.valor_total} />
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${percPago}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Saldo restante:</span>
                    <span className="font-bold text-rose-400">
                      <PrivacyValue value={parc.saldo_devedor_remanescente} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Fatura Detalhada */}
      <Modal
        isOpen={isFaturaModalOpen}
        onClose={() => setIsFaturaModalOpen(false)}
        title={`Fatura: ${faturaCard?.apelido || 'Cartão'}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Seletor de Mês da Fatura */}
          <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <button
              onClick={() => mudarMesFatura(-1)}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <span className="text-xs text-slate-400 block">Competência da Fatura</span>
              <strong className="text-sm font-bold text-slate-100 font-mono">
                {faturaMes}
              </strong>
            </div>
            <button
              onClick={() => mudarMesFatura(1)}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Resumo da Fatura */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Total da Fatura</span>
              <div className="text-2xl font-black text-rose-400">
                <PrivacyValue value={faturaDetalhe?.totalFatura ?? 0} />
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <span>{faturaDetalhe?.quantidadeItens ?? 0} lançamentos</span>
              <span className="block mt-0.5 text-slate-500">
                Vence dia {faturaCard?.dia_vencimento}
              </span>
            </div>
          </div>

          {/* Extrato da Fatura */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-800/60">
            {!faturaDetalhe || faturaDetalhe.itens.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Nenhum lançamento nesta fatura para o mês selecionado.
              </div>
            ) : (
              faturaDetalhe.itens.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{item.descricao}</div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.data_compra).toLocaleDateString('pt-BR')} • {item.categoria_nome}
                    </span>
                  </div>
                  <div className="font-bold text-rose-400">
                    <PrivacyValue value={item.valor} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Modal Criar Cartão */}
      <CartaoFormModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSuccess={() => {
          setIsCardModalOpen(false);
          loadData();
        }}
        initialData={editingCard}
        instituicoes={instituicoes}
      />

      {/* Modal Compra Parcelada */}
      <Modal
        isOpen={isParcelamentoModalOpen}
        onClose={() => setIsParcelamentoModalOpen(false)}
        title="Nova Compra Parcelada no Crédito"
      >
        <form onSubmit={handleCriarParcelamento} className="space-y-4">
          {parcError && (
            <div className="p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
              {parcError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Descrição da Compra *</label>
            <input
              type="text"
              required
              placeholder="Ex: Notebook Dell, Passagem Aérea..."
              value={parcDescricao}
              onChange={(e) => setParcDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Valor Total (R$) *</label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0,00"
                value={parcValorTotal}
                onChange={(e) => setParcValorTotal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-base font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nº de Parcelas *</label>
              <input
                type="number"
                min={2}
                max={96}
                required
                value={parcNumParcelas}
                onChange={(e) => setParcNumParcelas(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Cartão de Crédito *</label>
              <select
                value={parcCartaoId}
                onChange={(e) => setParcCartaoId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {cartoes.map((card) => (
                  <option key={card.id} value={card.id}>{card.apelido}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Data da Compra *</label>
              <input
                type="date"
                required
                value={parcDataCompra}
                onChange={(e) => setParcDataCompra(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Categoria *</label>
            <select
              value={parcCategoriaId}
              onChange={(e) => setParcCategoriaId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categorias.filter(c => c.tipo === 'despesa').map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-300">
            💡 As {parcNumParcelas} parcelas serão calculadas e distribuídas automaticamente nos ciclos de fatura do cartão a partir da data de fechamento.
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsParcelamentoModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30"
            >
              Gerar Parcelas
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
