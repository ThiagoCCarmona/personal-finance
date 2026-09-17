import React, { useState, useEffect } from 'react';
import { Landmark, Plus, Trash2, Edit2 } from 'lucide-react';
import { api } from '../services/api.js';
import { Conta, Instituicao } from '../types/index.js';
import { PrivacyValue } from '../components/common/PrivacyValue.js';
import { Modal } from '../components/common/Modal.js';

export const ContasPage: React.FC = () => {
  const [contas, setContas] = useState<Conta[]>([]);
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [saldoConsolidado, setSaldoConsolidado] = useState<number>(0);

  // Modais
  const [isContaModalOpen, setIsContaModalOpen] = useState(false);
  const [isInstModalOpen, setIsInstModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<Conta | null>(null);

  // Form Conta
  const [contaApelido, setContaApelido] = useState('');
  const [contaInstId, setContaInstId] = useState('');
  const [contaTipo, setContaTipo] = useState<'corrente' | 'poupanca' | 'carteira_digital' | 'dinheiro'>('corrente');
  const [contaSaldoInicial, setContaSaldoInicial] = useState('0');

  // Form Instituição
  const [editingInst, setEditingInst] = useState<Instituicao | null>(null);
  const [instNome, setInstNome] = useState('');
  const [instTipo, setInstTipo] = useState<'banco' | 'carteira_digital' | 'dinheiro'>('banco');
  const [instCor, setInstCor] = useState('#3B82F6');

  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [contasData, instData, saldoData] = await Promise.all([
        api.getContas(),
        api.getInstituicoes(),
        api.getSaldoConsolidado(),
      ]);
      setContas(contasData);
      setInstituicoes(instData);
      setSaldoConsolidado(saldoData.totalSaldoBrl);
    } catch (err) {
      console.error('Erro ao carregar contas:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenContaModal = (conta?: Conta) => {
    setFormError(null);
    if (conta) {
      setEditingConta(conta);
      setContaApelido(conta.apelido);
      setContaInstId(conta.instituicao_id);
      setContaTipo(conta.tipo);
      setContaSaldoInicial(String(conta.saldo_inicial));
    } else {
      setEditingConta(null);
      setContaApelido('');
      setContaInstId(instituicoes[0]?.id || '');
      setContaTipo('corrente');
      setContaSaldoInicial('0');
    }
    setIsContaModalOpen(true);
  };

  const handleSaveConta = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!contaApelido.trim()) {
      setFormError('Informe o apelido da conta.');
      return;
    }
    if (!contaInstId) {
      setFormError('Selecione a instituição bancária.');
      return;
    }

    try {
      if (editingConta) {
        await api.updateConta(editingConta.id, {
          apelido: contaApelido.trim(),
          instituicao_id: contaInstId,
          tipo: contaTipo,
        });
      } else {
        await api.createConta({
          apelido: contaApelido.trim(),
          instituicao_id: contaInstId,
          tipo: contaTipo,
          saldo_inicial: parseFloat(contaSaldoInicial.replace(',', '.')) || 0,
        });
      }

      setIsContaModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar conta.');
    }
  };

  const handleDeleteConta = async (id: string) => {
    if (!window.confirm('Deseja realmente remover esta conta?')) return;
    try {
      await api.deleteConta(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir conta.');
    }
  };

  const handleOpenInstModal = () => {
    setFormError(null);
    setEditingInst(null);
    setInstNome('');
    setInstTipo('banco');
    setInstCor('#3B82F6');
    setIsInstModalOpen(true);
  };

  const handleEditInstituicao = (inst: Instituicao) => {
    setFormError(null);
    setEditingInst(inst);
    setInstNome(inst.nome);
    setInstTipo(inst.tipo);
    setInstCor(inst.cor || '#3B82F6');
  };

  const handleCancelEditInst = () => {
    setEditingInst(null);
    setInstNome('');
    setInstTipo('banco');
    setInstCor('#3B82F6');
  };

  const handleDeleteInstituicao = async (id: string, nome: string) => {
    const contasVinculadas = contas.filter(c => c.instituicao_id === id);
    if (contasVinculadas.length > 0) {
      alert(`Não é possível excluir "${nome}" porque existem ${contasVinculadas.length} conta(s) vinculadas a ela. Reatribua ou exclua as contas primeiro.`);
      return;
    }

    if (!window.confirm(`Deseja realmente excluir a instituição "${nome}"?`)) return;

    try {
      await api.deleteInstituicao(id);
      if (editingInst?.id === id) {
        handleCancelEditInst();
      }
      loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir instituição.');
    }
  };

  const handleSaveInstituicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!instNome.trim()) {
      setFormError('Informe o nome da instituição.');
      return;
    }

    try {
      if (editingInst) {
        await api.updateInstituicao(editingInst.id, {
          nome: instNome.trim(),
          tipo: instTipo,
          cor: instCor,
        });
      } else {
        await api.createInstituicao({
          nome: instNome.trim(),
          tipo: instTipo,
          cor: instCor,
        });
      }
      handleCancelEditInst();
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar instituição.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Contas & Bancos</h1>
          <p className="text-sm text-slate-400">Controle de saldos e instituições financeiras</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleOpenInstModal}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
          >
            <Landmark size={17} />
            <span>Gerenciar Instituições</span>
          </button>
          <button
            onClick={() => handleOpenContaModal()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus size={17} />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Card Saldo Consolidado */}
      <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Patrimônio Disponível Total</span>
          <div className="text-3xl font-black text-slate-100">
            <PrivacyValue value={saldoConsolidado} />
          </div>
          <p className="text-xs text-slate-400">Soma de todas as contas ativas e dinheiro em espécie</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
            <span className="text-xs text-slate-500 block">Contas Ativas</span>
            <span className="text-lg font-bold text-slate-200">{contas.filter(c => c.ativo).length}</span>
          </div>
          <div className="px-4 py-2 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
            <span className="text-xs text-slate-500 block">Instituições</span>
            <span className="text-lg font-bold text-slate-200">{instituicoes.length}</span>
          </div>
        </div>
      </div>

      {/* Grid de Contas Cadastradas */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Suas Contas</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contas.map((conta) => (
            <div 
              key={conta.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow"
                    style={{ backgroundColor: conta.instituicao_cor || '#3b82f6' }}
                  >
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-slate-100">{conta.apelido}</h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {conta.instituicao_nome} • {conta.tipo.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenContaModal(conta)}
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteConta(conta.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Saldo Atual</span>
                  <div className="text-xl font-bold">
                    <PrivacyValue value={conta.saldo_atual} colored />
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {conta.moeda_codigo || 'BRL'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Conta */}
      <Modal
        isOpen={isContaModalOpen}
        onClose={() => setIsContaModalOpen(false)}
        title={editingConta ? 'Editar Conta' : 'Nova Conta'}
      >
        <form onSubmit={handleSaveConta} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Apelido da Conta *</label>
            <input
              type="text"
              required
              placeholder="Ex: NuConta Principal, Carteira Física..."
              value={contaApelido}
              onChange={(e) => setContaApelido(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Instituição Bancária *</label>
            <select
              value={contaInstId}
              onChange={(e) => setContaInstId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {instituicoes.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.nome} ({inst.tipo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Conta *</label>
            <select
              value={contaTipo}
              onChange={(e) => setContaTipo(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="corrente">Conta Corrente</option>
              <option value="poupanca">Poupança</option>
              <option value="carteira_digital">Carteira Digital</option>
              <option value="dinheiro">Dinheiro em Espécie</option>
            </select>
          </div>

          {!editingConta && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Saldo Inicial (R$)</label>
              <input
                type="text"
                placeholder="0,00"
                value={contaSaldoInicial}
                onChange={(e) => setContaSaldoInicial(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsContaModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30"
            >
              {editingConta ? 'Salvar Alterações' : 'Criar Conta'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Gestão Completa de Instituições */}
      <Modal
        isOpen={isInstModalOpen}
        onClose={() => {
          setIsInstModalOpen(false);
          handleCancelEditInst();
        }}
        title="Gerenciar Instituições Bancárias"
      >
        <div className="space-y-6">
          {formError && (
            <div className="p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
              {formError}
            </div>
          )}

          {/* Formulário de Cadastro / Edição */}
          <form onSubmit={handleSaveInstituicao} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {editingInst ? `Editar: ${editingInst.nome}` : 'Cadastrar Nova Instituição'}
              </span>
              {editingInst && (
                <button
                  type="button"
                  onClick={handleCancelEditInst}
                  className="text-xs text-slate-400 hover:text-slate-200 underline"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Instituição *</label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank, Itaú, Dinheiro Físico..."
                value={instNome}
                onChange={(e) => setInstNome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Instituição *</label>
                <select
                  value={instTipo}
                  onChange={(e) => setInstTipo(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="banco">Banco Tradicional / Digital</option>
                  <option value="carteira_digital">Carteira Digital</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={instCor}
                    onChange={(e) => setInstCor(e.target.value)}
                    className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-400">{instCor}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition"
              >
                {editingInst ? 'Atualizar Instituição' : 'Adicionar Instituição'}
              </button>
            </div>
          </form>

          {/* Lista de Instituições Existentes */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Instituições Ativas ({instituicoes.length})
            </h4>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {instituicoes.map((inst) => {
                const totalContas = contas.filter(c => c.instituicao_id === inst.id).length;
                return (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: inst.cor || '#3b82f6' }}
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-200 block leading-tight">
                          {inst.nome}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {inst.tipo.replace('_', ' ')} • {totalContas} conta(s) vinculada(s)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditInstituicao(inst)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                        title="Editar Instituição"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteInstituicao(inst.id, inst.nome)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Excluir Instituição"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsInstModalOpen(false);
                handleCancelEditInst();
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
