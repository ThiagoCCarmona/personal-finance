import React, { useState, useEffect } from 'react';
import { 
  Users, HandCoins, UserPlus, Receipt, 
  CheckCircle, Ban, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Pessoa, Divida, ResumoDividas, Conta } from '../types';
import { PrivacyValue } from '../components/common/PrivacyValue';

export const SocialPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [resumo, setResumo] = useState<ResumoDividas>({ totalReceber: 0, totalRecebido: 0, totalPerdoado: 0, qtdPendentes: 0 });
  const [contas, setContas] = useState<Conta[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Modais
  const [modalPessoa, setModalPessoa] = useState(false);
  const [modalEmprestimo, setModalEmprestimo] = useState(false);
  const [modalDivisao, setModalDivisao] = useState(false);
  const [modalBaixa, setModalBaixa] = useState<{ open: boolean; divida?: Divida }>({ open: false });

  // Formulário Nova Pessoa
  const [formPessoa, setFormPessoa] = useState({ nome: '', apelido: '', telefone: '', email: '' });

  // Formulário Novo Empréstimo
  const [formEmprestimo, setFormEmprestimo] = useState({
    pessoa_id: '',
    valor_total: '',
    motivo: '',
    conta_origem_id: '',
    data: new Date().toISOString().split('T')[0],
    vencimento: ''
  });

  // Formulário Divisão de Despesa
  const [formDivisao, setFormDivisao] = useState({
    descricao: '',
    valor_total: '',
    conta_origem_id: '',
    categoria_id: '',
    data: new Date().toISOString().split('T')[0],
    participantes: [] as Array<{ pessoa_id: string; nome: string; valor: string }>
  });

  // Formulário Baixa
  const [formBaixa, setFormBaixa] = useState({
    valor: '',
    conta_destino_id: '',
    forma_pagamento: 'pix',
    data: new Date().toISOString().split('T')[0]
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [pRes, dRes, rRes, cRes] = await Promise.all([
        api.getPessoas(),
        api.getDividas(filtroStatus !== 'todos' ? filtroStatus : undefined),
        api.getResumoDividas(),
        api.getContas()
      ]);
      setPessoas(pRes);
      setDividas(dRes);
      setResumo(rRes);
      setContas(cRes);
    } catch (err) {
      console.error('Erro ao carregar dados sociais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroStatus]);

  // Ações de formulário
  const handleCriarPessoa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPessoa.nome) return;
    try {
      await api.createPessoa(formPessoa);
      setModalPessoa(false);
      setFormPessoa({ nome: '', apelido: '', telefone: '', email: '' });
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar contato');
    }
  };

  const handleCriarEmprestimo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmprestimo.pessoa_id || !formEmprestimo.valor_total || !formEmprestimo.conta_origem_id) {
      alert('Preencha os campos obrigatórios');
      return;
    }
    try {
      await api.createEmprestimo({
        pessoa_id: formEmprestimo.pessoa_id,
        valor_total: parseFloat(formEmprestimo.valor_total),
        motivo: formEmprestimo.motivo || 'Empréstimo',
        conta_origem_id: formEmprestimo.conta_origem_id,
        data: formEmprestimo.data || undefined,
        vencimento: formEmprestimo.vencimento || undefined
      });
      setModalEmprestimo(false);
      setFormEmprestimo({
        pessoa_id: '',
        valor_total: '',
        motivo: '',
        conta_origem_id: '',
        data: new Date().toISOString().split('T')[0],
        vencimento: ''
      });
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar empréstimo');
    }
  };

  const handleCalcularDivisaoIgual = () => {
    const total = parseFloat(formDivisao.valor_total);
    if (isNaN(total) || total <= 0 || formDivisao.participantes.length === 0) return;
    
    // Inclui usuário na conta: total / (participantes + 1)
    const partes = formDivisao.participantes.length + 1;
    const cota = (total / partes).toFixed(2);

    setFormDivisao({
      ...formDivisao,
      participantes: formDivisao.participantes.map(p => ({
        ...p,
        valor: cota
      }))
    });
  };

  const handleCriarDivisao = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(formDivisao.valor_total);
    if (isNaN(total) || total <= 0 || formDivisao.participantes.length === 0) {
      alert('Preencha valor e selecione participantes');
      return;
    }
    try {
      await api.createDespesaCompartilhada({
        descricao: formDivisao.descricao,
        valor_total: total,
        data: formDivisao.data,
        conta_origem_id: formDivisao.conta_origem_id || undefined,
        categoria_id: formDivisao.categoria_id || undefined,
        participantes: formDivisao.participantes.map(p => ({
          pessoa_id: p.pessoa_id,
          valor: parseFloat(p.valor) || 0
        }))
      });
      setModalDivisao(false);
      setFormDivisao({
        descricao: '',
        valor_total: '',
        conta_origem_id: '',
        categoria_id: '',
        data: new Date().toISOString().split('T')[0],
        participantes: []
      });
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar despesa compartilhada');
    }
  };

  const handleDarBaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalBaixa.divida) return;
    const v = parseFloat(formBaixa.valor);
    if (isNaN(v) || v <= 0) {
      alert('Informe um valor válido');
      return;
    }
    try {
      await api.darBaixaDivida(modalBaixa.divida.id, {
        valor: v,
        conta_destino_id: formBaixa.conta_destino_id || undefined,
        forma_pagamento: formBaixa.forma_pagamento,
        data: formBaixa.data
      });
      setModalBaixa({ open: false });
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao dar baixa');
    }
  };

  const handlePerdoar = async (divida: Divida) => {
    if (!confirm(`Deseja realmente perdoar a dívida de R$ ${divida.saldo_devedor.toFixed(2)} de ${divida.pessoa_nome}? Esta ação encerra a pendência sem gerar receita.`)) {
      return;
    }
    try {
      await api.perdoarDivida(divida.id);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao perdoar dívida');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-500" />
            Social & Contas a Receber
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie empréstimos a amigos, divisão de contas e controle "quem deve quanto pra quem".
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setModalPessoa(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <UserPlus className="w-4 h-4" />
            Novo Contato
          </button>
          <button
            onClick={() => setModalDivisao(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
          >
            <Receipt className="w-4 h-4" />
            Dividir Despesa
          </button>
          <button
            onClick={() => setModalEmprestimo(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <HandCoins className="w-4 h-4" />
            Emprestar Dinheiro
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Total a Receber</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            <PrivacyValue value={resumo.totalReceber} />
          </div>
          <span className="text-xs text-gray-400 mt-0.5 block">{resumo.qtdPendentes} pendências ativas</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Total Quitado</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            <PrivacyValue value={resumo.totalRecebido} />
          </div>
          <span className="text-xs text-gray-400 mt-0.5 block">Recebido e integrado</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Total Perdoado</span>
          <div className="text-2xl font-bold text-gray-500 dark:text-gray-400 mt-1">
            <PrivacyValue value={resumo.totalPerdoado} />
          </div>
          <span className="text-xs text-gray-400 mt-0.5 block">Encerrado sem receita</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Amigos Cadastrados</span>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {pessoas.length}
          </div>
          <span className="text-xs text-gray-400 mt-0.5 block">Contatos e devedores</span>
        </div>
      </div>

      {/* Contatos com Saldos em Destaque */}
      {pessoas.some(p => p.total_a_receber > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Quem deve para você agora:
          </h3>
          <div className="flex flex-wrap gap-2">
            {pessoas.filter(p => p.total_a_receber > 0).map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-sm flex items-center gap-2 shadow-xs">
                <span className="font-medium text-gray-800 dark:text-gray-200">{p.nome} {p.apelido && `(${p.apelido})`}:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  <PrivacyValue value={p.total_a_receber} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Contas a Receber / Dívidas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Pendências e Dívidas
          </h2>
          <div className="flex gap-2">
            {(['todos', 'pendente', 'parcial', 'quitada', 'perdoada'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFiltroStatus(st)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filtroStatus === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3">Pessoa</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Origem</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3 text-right">Saldo Devedor</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">Carregando dados sociais...</td>
                </tr>
              ) : dividas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Nenhuma dívida ou conta a receber encontrada.
                  </td>
                </tr>
              ) : (
                dividas.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {d.pessoa_nome} {d.pessoa_apelido && <span className="text-xs text-gray-400 font-normal">({d.pessoa_apelido})</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {d.motivo}
                      <span className="block text-xs text-gray-400">{d.data}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {d.conta_origem_nome || 'Lançamento manual'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      <PrivacyValue value={d.valor_total} />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600 dark:text-amber-400">
                      <PrivacyValue value={d.saldo_devedor} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        d.status === 'quitada' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                        d.status === 'perdoada' ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                        d.status === 'parcial' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                      {['pendente', 'parcial'].includes(d.status) && (
                        <>
                          <button
                            onClick={() => {
                              setModalBaixa({ open: true, divida: d });
                              setFormBaixa({
                                ...formBaixa,
                                valor: d.saldo_devedor.toString(),
                                conta_destino_id: contas[0]?.id || ''
                              });
                            }}
                            title="Dar baixa / Receber"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePerdoar(d)}
                            title="Perdoar dívida"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVA PESSOA */}
      {modalPessoa && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Novo Contato / Amigo</h3>
            <form onSubmit={handleCriarPessoa} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={formPessoa.nome}
                  onChange={e => setFormPessoa({ ...formPessoa, nome: e.target.value })}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Apelido (opcional)</label>
                <input
                  type="text"
                  value={formPessoa.apelido}
                  onChange={e => setFormPessoa({ ...formPessoa, apelido: e.target.value })}
                  placeholder="Ex: Carlinhos"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formPessoa.telefone}
                    onChange={e => setFormPessoa({ ...formPessoa, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formPessoa.email}
                    onChange={e => setFormPessoa({ ...formPessoa, email: e.target.value })}
                    placeholder="email@amigo.com"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalPessoa(false)}
                  className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EMPRESTAR DINHEIRO */}
      {modalEmprestimo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Emprestar Dinheiro</h3>
            <p className="text-xs text-gray-500 mb-4">
              O valor será debitado do saldo da conta bancária de origem e ingressará no patrimônio como ativo a receber.
            </p>
            <form onSubmit={handleCriarEmprestimo} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quem está pegando emprestado? *</label>
                <select
                  required
                  value={formEmprestimo.pessoa_id}
                  onChange={e => setFormEmprestimo({ ...formEmprestimo, pessoa_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                >
                  <option value="">Selecione um contato...</option>
                  {pessoas.map(p => (
                    <option key={p.id} value={p.id}>{p.nome} {p.apelido && `(${p.apelido})`}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formEmprestimo.valor_total}
                    onChange={e => setFormEmprestimo({ ...formEmprestimo, valor_total: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">De onde saiu o dinheiro? *</label>
                  <select
                    required
                    value={formEmprestimo.conta_origem_id}
                    onChange={e => setFormEmprestimo({ ...formEmprestimo, conta_origem_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                    <option value="">Selecione a conta...</option>
                    {contas.map(c => (
                      <option key={c.id} value={c.id}>{c.apelido} (Saldo: R$ {c.saldo_atual.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Motivo / Descrição *</label>
                <input
                  type="text"
                  required
                  value={formEmprestimo.motivo}
                  onChange={e => setFormEmprestimo({ ...formEmprestimo, motivo: e.target.value })}
                  placeholder="Ex: Empréstimo para reforma"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data do Empréstimo</label>
                  <input
                    type="date"
                    value={formEmprestimo.data}
                    onChange={e => setFormEmprestimo({ ...formEmprestimo, data: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Previsão de Pagamento</label>
                  <input
                    type="date"
                    value={formEmprestimo.vencimento}
                    onChange={e => setFormEmprestimo({ ...formEmprestimo, vencimento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalEmprestimo(false)}
                  className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Confirmar Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DIVIDIR DESPESA */}
      {modalDivisao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Dividir Despesa em Grupo</h3>
            <p className="text-xs text-gray-500 mb-4">
              Pague a despesa integralmente e gere cotas automáticas a receber para os amigos participantes.
            </p>
            <form onSubmit={handleCriarDivisao} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição *</label>
                <input
                  type="text"
                  required
                  value={formDivisao.descricao}
                  onChange={e => setFormDivisao({ ...formDivisao, descricao: e.target.value })}
                  placeholder="Ex: Pizza com a galera"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Total (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formDivisao.valor_total}
                    onChange={e => setFormDivisao({ ...formDivisao, valor_total: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Conta de Pagamento</label>
                  <select
                    value={formDivisao.conta_origem_id}
                    onChange={e => setFormDivisao({ ...formDivisao, conta_origem_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                    <option value="">Selecione...</option>
                    {contas.map(c => (
                      <option key={c.id} value={c.id}>{c.apelido}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seletor de Participantes */}
              <div className="pt-2 border-t dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Amigos que vão rachar:</span>
                  <button
                    type="button"
                    onClick={handleCalcularDivisaoIgual}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Calcular Divisão Igual
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {pessoas.map(p => {
                    const selected = formDivisao.participantes.some(part => part.pessoa_id === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setFormDivisao({
                              ...formDivisao,
                              participantes: formDivisao.participantes.filter(part => part.pessoa_id !== p.id)
                            });
                          } else {
                            setFormDivisao({
                              ...formDivisao,
                              participantes: [...formDivisao.participantes, { pessoa_id: p.id, nome: p.nome, valor: '0.00' }]
                            });
                          }
                        }}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {selected ? '✓ ' : '+ '} {p.nome}
                      </button>
                    );
                  })}
                </div>

                {/* Lista de Cotas Editáveis */}
                {formDivisao.participantes.length > 0 && (
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-750 p-2.5 rounded-lg">
                    {formDivisao.participantes.map((part, idx) => (
                      <div key={part.pessoa_id} className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">
                          {part.nome}
                        </span>
                        <div className="flex items-center gap-1 w-32">
                          <span className="text-xs text-gray-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={part.valor}
                            onChange={e => {
                              const nov = [...formDivisao.participantes];
                              nov[idx].valor = e.target.value;
                              setFormDivisao({ ...formDivisao, participantes: nov });
                            }}
                            className="w-full px-2 py-1 border rounded text-xs text-right dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalDivisao(false)}
                  className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 text-gray-600 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  Criar Divisão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BAIXA / RECEBIMENTO */}
      {modalBaixa.open && modalBaixa.divida && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Receber Pagamento</h3>
            <p className="text-xs text-gray-500 mb-4">
              Registrar quitação de {modalBaixa.divida.pessoa_nome} ({modalBaixa.divida.motivo}).
            </p>
            <form onSubmit={handleDarBaixa} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor Recebido (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={modalBaixa.divida.saldo_devedor}
                  required
                  value={formBaixa.valor}
                  onChange={e => setFormBaixa({ ...formBaixa, valor: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
                <span className="text-xs text-gray-400 mt-1 block">
                  Saldo devedor total: R$ {modalBaixa.divida.saldo_devedor.toFixed(2)} (suporta quitação parcial)
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Conta de Destino (onde caiu o dinheiro)</label>
                <select
                  required
                  value={formBaixa.conta_destino_id}
                  onChange={e => setFormBaixa({ ...formBaixa, conta_destino_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                >
                  <option value="">Selecione...</option>
                  {contas.map(c => (
                    <option key={c.id} value={c.id}>{c.apelido}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Forma</label>
                  <select
                    value={formBaixa.forma_pagamento}
                    onChange={e => setFormBaixa({ ...formBaixa, forma_pagamento: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro em Espécie</option>
                    <option value="transferencia">Transferência</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
                  <input
                    type="date"
                    value={formBaixa.data}
                    onChange={e => setFormBaixa({ ...formBaixa, data: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalBaixa({ open: false })}
                  className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 text-gray-600 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
