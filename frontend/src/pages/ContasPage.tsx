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

  const handleSaveInstituicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!instNome.trim()) {
      setFormError('Informe o nome da instituição.');
      return;
    }

    try {
      await api.createInstituicao({
        nome: instNome.trim(),
        tipo: instTipo,
        cor: instCor,
      });
      setIsInstModalOpen(false);
      setInstNome('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao criar instituição.');
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
            onClick={() => setIsInstModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
          >
            <Landmark size={17} />
            <span>Nova Instituição</span>
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

      {/* Modal de Instituição */}
      <Modal
        isOpen={isInstModalOpen}
        onClose={() => setIsInstModalOpen(false)}
        title="Nova Instituição Bancária"
      >
        <form onSubmit={handleSaveInstituicao} className="space-y-4">
          {formError && (
            <div className="p-3 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nome da Instituição *</label>
            <input
              type="text"
              required
              placeholder="Ex: Nubank, Itaú, Dinheiro Físico..."
              value={instNome}
              onChange={(e) => setInstNome(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Instituição *</label>
            <select
              value={instTipo}
              onChange={(e) => setInstTipo(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="banco">Banco Tradicional / Digital</option>
              <option value="carteira_digital">Carteira Digital (PayPal, PicPay)</option>
              <option value="dinheiro">Dinheiro em Espécie</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Cor de Identificação</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={instCor}
                onChange={(e) => setInstCor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400">{instCor}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsInstModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30"
            >
              Salvar Instituição
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
