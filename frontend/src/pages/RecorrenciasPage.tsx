import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Trash2, Edit2, Play, Calendar } from 'lucide-react';
import { api } from '../services/api.js';
import { Recorrencia, Conta, CartaoCredito, Categoria } from '../types/index.js';
import { PrivacyValue } from '../components/common/PrivacyValue.js';
import { RecorrenciaFormModal } from '../components/recorrencias/RecorrenciaFormModal.js';
import { ModalConfirmarLancamentoRecorrencia } from '../components/recorrencias/ModalConfirmarLancamentoRecorrencia.js';

export const RecorrenciasPage: React.FC = () => {
  const [recorrencias, setRecorrencias] = useState<Recorrencia[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecorrencia, setEditingRecorrencia] = useState<Recorrencia | null>(null);

  const [recorrenciaParaLancar, setRecorrenciaParaLancar] = useState<Recorrencia | null>(null);
  const [isConfirmarLancarOpen, setIsConfirmarLancarOpen] = useState(false);

  const hoje = new Date();
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

  const loadData = async () => {
    try {
      setLoading(true);
      const [recData, contasData, cartoesData, catData] = await Promise.all([
        api.getRecorrencias(mesAtual),
        api.getContas(),
        api.getCartoes(),
        api.getCategorias(),
      ]);
      setRecorrencias(recData);
      setContas(contasData);
      setCartoes(cartoesData);
      setCategorias(catData.flat);
    } catch (err) {
      console.error('Erro ao carregar dados de recorrências:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEdit = (rec: Recorrencia) => {
    setEditingRecorrencia(rec);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir esta recorrência? Lançamentos já gerados no passado permanecerão salvos.')) return;
    try {
      await api.deleteRecorrencia(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir recorrência.');
    }
  };

  const handleAbrirConfirmacaoLancar = (rec: Recorrencia) => {
    setRecorrenciaParaLancar(rec);
    setIsConfirmarLancarOpen(true);
  };

  const handleConfirmarLancar = async (id: string, anoMesParam: string, valorCustomizado: number) => {
    await api.lancarRecorrencia(id, anoMesParam, valorCustomizado);
    loadData();
  };

  const totalDespesasFixas = recorrencias
    .filter(r => r.tipo === 'despesa')
    .reduce((acc, r) => acc + r.valor, 0);

  const totalReceitasFixas = recorrencias
    .filter(r => r.tipo === 'receita')
    .reduce((acc, r) => acc + r.valor, 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Despesas & Receitas Recorrentes</h1>
          <p className="text-sm text-slate-400">Acompanhamento de custos fixos e assinaturas mensais</p>
        </div>

        <button
          onClick={() => {
            setEditingRecorrencia(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>Nova Recorrência</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Despesas Fixas</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            <PrivacyValue value={totalDespesasFixas} />
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Comprometimento mensal fixo</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Receitas Fixas</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            <PrivacyValue value={totalReceitasFixas} />
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Salário e rendimentos mensais</span>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Competência em Aberto</span>
          <div className="text-xl font-bold text-slate-200 mt-1 font-mono">
            {mesAtual}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {recorrencias.filter(r => r.ja_lancado).length} de {recorrencias.length} itens já lançados
          </span>
        </div>
      </div>

      {/* Lista de Itens Recorrentes */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-300">Itens Recorrentes Cadastrados ({recorrencias.length})</h2>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Carregando itens...</div>
        ) : recorrencias.length === 0 ? (
          <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center text-xs text-slate-500">
            Nenhuma despesa ou receita recorrente cadastrada.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recorrencias.map((rec) => (
              <div 
                key={rec.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        rec.tipo === 'despesa' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                      <h3 className="text-base font-semibold text-slate-100">{rec.descricao}</h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        rec.natureza === 'variavel'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {rec.natureza === 'variavel' ? 'Variável (Média)' : 'Fixo'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-0.5 inline-block">
                      {rec.categoria_nome} • {rec.frequencia}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(rec)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(rec.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 py-1 border-y border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-500" />
                    <span>Todo dia <strong>{rec.dia_referencia}</strong></span>
                  </div>
                  <span>{rec.cartao_apelido || rec.conta_apelido || rec.forma_pagamento}</span>
                </div>

                {/* Status no Mês Atual: Já Lançado vs Previsto */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className={`text-lg font-black ${
                      rec.tipo === 'despesa' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      <PrivacyValue value={rec.valor} />
                    </div>
                    {rec.natureza === 'variavel' && (
                      <span className="text-[10px] text-slate-500">Média estimada</span>
                    )}
                  </div>

                  <div>
                    {rec.ja_lancado ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
                        <CheckCircle2 size={14} />
                        <span>Já Lançado</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAbrirConfirmacaoLancar(rec)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all"
                        title="Efetivar lançamento no mês atual"
                      >
                        <Play size={13} />
                        <span>Lançar no Mês</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RecorrenciaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadData();
        }}
        initialData={editingRecorrencia}
        contas={contas}
        cartoes={cartoes}
        categorias={categorias}
      />

      <ModalConfirmarLancamentoRecorrencia
        isOpen={isConfirmarLancarOpen}
        onClose={() => setIsConfirmarLancarOpen(false)}
        onConfirm={handleConfirmarLancar}
        recorrencia={recorrenciaParaLancar}
        anoMes={mesAtual}
      />
    </div>
  );
};
