import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Search, Trash2, Edit2, TrendingDown, TrendingUp, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import { api } from '../services/api.js';
import { Lancamento, Conta, Categoria } from '../types/index.js';
import { PrivacyValue } from '../components/common/PrivacyValue.js';
import { LancamentoFormModal } from '../components/lancamentos/LancamentoFormModal.js';

export const LancamentosPage: React.FC = () => {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [tipo, setTipo] = useState<string>('');
  const [contaId, setContaId] = useState<string>('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modais de Edição e Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);

  // Carregar filtros auxiliares
  useEffect(() => {
    api.getContas().then(setContas).catch(console.error);
    api.getCategorias().then(res => setCategorias(res.flat)).catch(console.error);
  }, []);

  const fetchLancamentos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLancamentos({
        page,
        limit: 20,
        busca: busca || undefined,
        tipo: tipo || undefined,
        contaId: contaId || undefined,
        categoriaId: categoriaId || undefined,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });

      setLancamentos(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err) {
      console.error('Erro ao buscar lançamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [page, busca, tipo, contaId, categoriaId, dataInicio, dataFim]);

  useEffect(() => {
    fetchLancamentos();

    const handleRefresh = () => fetchLancamentos();
    window.addEventListener('financeiro:refresh', handleRefresh);
    return () => window.removeEventListener('financeiro:refresh', handleRefresh);
  }, [fetchLancamentos]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento? O saldo da conta será recalculado automaticamente.')) {
      return;
    }

    try {
      await api.deleteLancamento(id);
      fetchLancamentos();
    } catch (err: any) {
      alert(err.message || 'Falha ao excluir lançamento.');
    }
  };

  const handleEdit = (lanc: Lancamento) => {
    setEditingLancamento(lanc);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLancamento(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchLancamentos();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Lançamentos & Extrato</h1>
          <p className="text-sm text-slate-400">Gerencie todas as despesas e receitas cadastradas ({total} registros)</p>
        </div>

        <button
          onClick={() => {
            setEditingLancamento(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Painel de Filtros Combináveis */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Busca textual */}
          <div className="lg:col-span-2 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro por Tipo */}
          <div>
            <select
              value={tipo}
              onChange={(e) => { setTipo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Tipos</option>
              <option value="despesa">Despesas</option>
              <option value="receita">Receitas</option>
            </select>
          </div>

          {/* Filtro por Conta */}
          <div>
            <select
              value={contaId}
              onChange={(e) => { setContaId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Contas</option>
              {contas.map(c => (
                <option key={c.id} value={c.id}>{c.apelido}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Categoria */}
          <div>
            <select
              value={categoriaId}
              onChange={(e) => { setCategoriaId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as Categorias</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome} ({cat.tipo})</option>
              ))}
            </select>
          </div>

          {/* Limpar Filtros */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                setBusca('');
                setTipo('');
                setContaId('');
                setCategoriaId('');
                setDataInicio('');
                setDataFim('');
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Data</th>
                <th className="py-3.5 px-4">Descrição</th>
                <th className="py-3.5 px-4">Categoria</th>
                <th className="py-3.5 px-4">Conta</th>
                <th className="py-3.5 px-4">Pagamento</th>
                <th className="py-3.5 px-4 text-right">Valor</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Carregando lançamentos...
                  </td>
                </tr>
              ) : lancamentos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                lancamentos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-xs">
                      {new Date(item.data_compra).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${
                          item.tipo === 'despesa' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {item.tipo === 'despesa' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                        </span>
                        <span>{item.descricao}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      <span 
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium inline-block"
                        style={{ backgroundColor: `${item.categoria_cor}20`, color: item.categoria_cor }}
                      >
                        {item.categoria_nome}
                        {item.subcategoria_nome && ` / ${item.subcategoria_nome}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400">
                      {item.conta_apelido}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400 uppercase">
                      {item.forma_pagamento.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold">
                      <PrivacyValue
                        value={item.valor}
                        colored
                        prefix={item.tipo === 'despesa' ? '- ' : '+ '}
                      />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Editar lançamento"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Excluir lançamento"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400">
            <span>Página {page} de {totalPages} ({total} lançamentos)</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <LancamentoFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        initialData={editingLancamento}
      />
    </div>
  );
};
