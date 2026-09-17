import React, { useState, useEffect } from 'react';
import { 
  Users, HandCoins, UserPlus, Receipt, 
  CheckCircle, Ban, AlertCircle, QrCode, Trash2, Edit2, Copy, Check, X
} from 'lucide-react';
import { api } from '../services/api';
import { Pessoa, Divida, ResumoDividas, Conta, ChavePix, DespesaCompartilhada } from '../types';
import { PrivacyValue } from '../components/common/PrivacyValue';

export const SocialPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [resumo, setResumo] = useState<ResumoDividas>({ totalReceber: 0, totalRecebido: 0, totalPerdoado: 0, qtdPendentes: 0 });
  const [contas, setContas] = useState<Conta[]>([]);
  const [chavesPix, setChavesPix] = useState<ChavePix[]>([]);
  const [despesasCompartilhadas, setDespesasCompartilhadas] = useState<DespesaCompartilhada[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  // Modais
  const [modalPessoa, setModalPessoa] = useState(false);
  const [editingPessoaId, setEditingPessoaId] = useState<string | null>(null);

  const [modalEmprestimo, setModalEmprestimo] = useState(false);
  const [editingDividaId, setEditingDividaId] = useState<string | null>(null);

  const [modalDivisao, setModalDivisao] = useState(false);
  const [modalBaixa, setModalBaixa] = useState<{ open: boolean; divida?: Divida }>({ open: false });

  // Modal QR Code PIX com Seleção Explícita de Chave
  const [modalQrPix, setModalQrPix] = useState<{
    open: boolean;
    pessoaNome: string;
    valor: number;
    motivo: string;
    dividaId?: string;
  }>({ open: false, pessoaNome: '', valor: 0, motivo: '' });
  const [chaveSelecionadaId, setChaveSelecionadaId] = useState<string>('');
  const [cobrancaGerada, setCobrancaGerada] = useState<{ payload_emv: string; txid: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [gerandoPix, setGerandoPix] = useState(false);

  // Formulário Nova / Editar Pessoa
  const [formPessoa, setFormPessoa] = useState({ nome: '', apelido: '', telefone: '', email: '' });

  // Formulário Novo / Editar Empréstimo
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
      const [pRes, dRes, rRes, cRes, chRes, dcRes] = await Promise.all([
        api.getPessoas().catch(() => []),
        api.getDividas(filtroStatus !== 'todos' ? filtroStatus : undefined).catch(() => []),
        api.getResumoDividas().catch(() => ({ totalReceber: 0, totalRecebido: 0, totalPerdoado: 0, qtdPendentes: 0 })),
        api.getContas().catch(() => []),
        api.getChavesPix().catch(() => []),
        api.getDespesasCompartilhadas().catch(() => [])
      ]);
      setPessoas(Array.isArray(pRes) ? pRes : (pRes as any)?.data || []);
      setDividas(Array.isArray(dRes) ? dRes : (dRes as any)?.data || []);
      setResumo(rRes && typeof rRes === 'object' ? ((rRes as any)?.data || rRes) : { totalReceber: 0, totalRecebido: 0, totalPerdoado: 0, qtdPendentes: 0 });
      setContas(Array.isArray(cRes) ? cRes : (cRes as any)?.data || []);
      const chaves = Array.isArray(chRes) ? chRes : (chRes as any)?.data || [];
      setChavesPix(chaves);
      if (chaves.length > 0 && !chaveSelecionadaId) {
        setChaveSelecionadaId(chaves[0].id);
      }
      setDespesasCompartilhadas(Array.isArray(dcRes) ? dcRes : (dcRes as any)?.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados sociais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroStatus]);

  // Ações de Pessoa
  const handleAbrirNovaPessoa = () => {
    setEditingPessoaId(null);
    setFormPessoa({ nome: '', apelido: '', telefone: '', email: '' });
    setModalPessoa(true);
  };

  const handleEditarPessoa = (p: Pessoa) => {
    setEditingPessoaId(p.id);
    setFormPessoa({
      nome: p.nome,
      apelido: p.apelido || '',
      telefone: p.telefone || '',
      email: p.email || ''
    });
    setModalPessoa(true);
  };

  const handleSalvarPessoa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPessoa.nome) return;
    try {
      if (editingPessoaId) {
        await api.updatePessoa(editingPessoaId, formPessoa);
      } else {
        await api.createPessoa(formPessoa);
      }
      setModalPessoa(false);
      setEditingPessoaId(null);
      setFormPessoa({ nome: '', apelido: '', telefone: '', email: '' });
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar contato');
    }
  };

  const handleExcluirPessoa = async (p: Pessoa) => {
    if (!confirm(`Deseja realmente excluir o contato de ${p.nome}?`)) return;
    try {
      await api.deletePessoa(p.id);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir contato');
    }
  };

  // Ações de Empréstimo / Dívida
  const handleAbrirNovoEmprestimo = () => {
    setEditingDividaId(null);
    setFormEmprestimo({
      pessoa_id: pessoas[0]?.id || '',
      valor_total: '',
      motivo: '',
      conta_origem_id: contas[0]?.id || '',
      data: new Date().toISOString().split('T')[0],
      vencimento: ''
    });
    setModalEmprestimo(true);
  };

  const handleEditarDivida = (d: Divida) => {
    setEditingDividaId(d.id);
    setFormEmprestimo({
      pessoa_id: d.pessoa_id,
      valor_total: d.valor_total.toString(),
      motivo: d.motivo,
      conta_origem_id: d.conta_origem_id || '',
      data: d.data,
      vencimento: d.vencimento || ''
    });
    setModalEmprestimo(true);
  };

  const handleSalvarEmprestimo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmprestimo.pessoa_id || !formEmprestimo.valor_total) {
      alert('Preencha os campos obrigatórios');
      return;
    }
    try {
      if (editingDividaId) {
        await api.updateDivida(editingDividaId, {
          motivo: formEmprestimo.motivo,
          valor_total: parseFloat(formEmprestimo.valor_total),
          data: formEmprestimo.data,
          vencimento: formEmprestimo.vencimento || undefined
        });
      } else {
        if (!formEmprestimo.conta_origem_id) {
          alert('Selecione a conta de onde saiu o dinheiro');
          return;
        }
        await api.createEmprestimo({
          pessoa_id: formEmprestimo.pessoa_id,
          valor_total: parseFloat(formEmprestimo.valor_total),
          motivo: formEmprestimo.motivo || 'Empréstimo',
          conta_origem_id: formEmprestimo.conta_origem_id,
          data: formEmprestimo.data || undefined,
          vencimento: formEmprestimo.vencimento || undefined
        });
      }
      setModalEmprestimo(false);
      setEditingDividaId(null);
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
      alert(err.message || 'Erro ao salvar dívida');
    }
  };

  const handleExcluirDivida = async (d: Divida) => {
    if (!confirm(`Deseja realmente excluir a dívida de ${d.pessoa_nome} (${d.motivo})? Se for um empréstimo não quitado, o valor será estornado para a conta de origem.`)) {
      return;
    }
    try {
      await api.deleteDivida(d.id);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir dívida');
    }
  };

  const handleExcluirDespesaCompartilhada = async (dc: DespesaCompartilhada) => {
    if (!confirm(`Deseja excluir a divisão "${dc.descricao}"? As cotas geradas serão canceladas e o débito da conta estornado.`)) {
      return;
    }
    try {
      await api.deleteDespesaCompartilhada(dc.id);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir divisão');
    }
  };

  // Gerador de QR Code PIX com Seleção Explícita de Chave
  const handleAbrirModalQrPix = (pessoaNome: string, valor: number, motivo: string, dividaId?: string) => {
    setCobrancaGerada(null);
    setCopiado(false);
    setModalQrPix({
      open: true,
      pessoaNome,
      valor,
      motivo,
      dividaId
    });
  };

  const handleGerarQrPix = async () => {
    if (!chaveSelecionadaId) {
      alert('Selecione qual chave PIX você deseja utilizar.');
      return;
    }
    try {
      setGerandoPix(true);
      const nova = await api.createCobrancaPix({
        chave_pix_id: chaveSelecionadaId,
        valor: modalQrPix.valor,
        mensagem: `Cota de ${modalQrPix.pessoaNome} - ${modalQrPix.motivo}`.substring(0, 140),
        divida_id: modalQrPix.dividaId
      });
      setCobrancaGerada({
        payload_emv: nova.payload_emv,
        txid: nova.txid
      });
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar QR Code PIX');
    } finally {
      setGerandoPix(false);
    }
  };

  const handleCopiarPix = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
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
            onClick={handleAbrirNovaPessoa}
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
            onClick={handleAbrirNovoEmprestimo}
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

      {/* Gerenciamento de Contatos & Amigos */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" />
            Amigos e Contatos Cadastrados ({pessoas.length})
          </h3>
          <button
            onClick={handleAbrirNovaPessoa}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            + Adicionar
          </button>
        </div>

        {pessoas.length === 0 ? (
          <p className="text-xs text-gray-400">Nenhum contato cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {pessoas.map(p => (
              <div
                key={p.id}
                className="bg-gray-50 dark:bg-gray-750 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {p.nome} {p.apelido && <span className="text-gray-400 font-normal">({p.apelido})</span>}
                  </div>
                  {p.total_a_receber > 0 ? (
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block">
                      Deve: <PrivacyValue value={p.total_a_receber} />
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 block truncate">
                      {p.telefone || p.email || 'Sem pendências'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEditarPessoa(p)}
                    title="Editar Contato"
                    className="p-1 text-gray-400 hover:text-blue-500 rounded"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleExcluirPessoa(p)}
                    title="Excluir Contato"
                    className="p-1 text-gray-400 hover:text-rose-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                            onClick={() => handleAbrirModalQrPix(d.pessoa_nome, d.saldo_devedor, d.motivo, d.id)}
                            title="Gerar QR Code PIX para esta cota"
                            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
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
                            onClick={() => handleEditarDivida(d)}
                            title="Editar dívida"
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePerdoar(d)}
                            title="Perdoar dívida"
                            className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleExcluirDivida(d)}
                        title="Excluir dívida"
                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Histórico de Despesas Compartilhadas (Divisões em Grupo) */}
      {despesasCompartilhadas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-500" />
              Despesas Compartilhadas Registradas
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Histórico de contas divididas em grupo. Excluir uma divisão estorna o débito e cancela as cotas pendentes.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3 text-right">Valor Total</th>
                  <th className="px-4 py-3 text-center">Participantes</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {despesasCompartilhadas.map(dc => (
                  <tr key={dc.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {dc.descricao}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {dc.data}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {dc.conta_nome || dc.cartao_nome || 'Outro'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                      <PrivacyValue value={dc.valor_total} />
                    </td>
                    <td className="px-4 py-3 text-center text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold">
                        {dc.total_participantes} amigos
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleExcluirDespesaCompartilhada(dc)}
                        title="Excluir Divisão e Estornar"
                        className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL NOVA / EDITAR PESSOA */}
      {modalPessoa && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingPessoaId ? 'Editar Contato / Amigo' : 'Novo Contato / Amigo'}
            </h3>
            <form onSubmit={handleSalvarPessoa} className="space-y-4">
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

      {/* MODAL NOVO / EDITAR EMPRÉSTIMO */}
      {modalEmprestimo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {editingDividaId ? 'Editar Empréstimo / Dívida' : 'Emprestar Dinheiro'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {editingDividaId 
                ? 'Atualize os dados deste lançamento de pendência.'
                : 'O valor será debitado do saldo da conta bancária de origem e ingressará no patrimônio como ativo a receber.'}
            </p>
            <form onSubmit={handleSalvarEmprestimo} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quem está pegando emprestado? *</label>
                <select
                  required
                  disabled={!!editingDividaId}
                  value={formEmprestimo.pessoa_id}
                  onChange={e => setFormEmprestimo({ ...formEmprestimo, pessoa_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm disabled:opacity-60"
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
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {editingDividaId ? 'Conta de Origem' : 'De onde saiu o dinheiro? *'}
                  </label>
                  <select
                    disabled={!!editingDividaId}
                    required={!editingDividaId}
                    value={formEmprestimo.conta_origem_id}
                    onChange={e => setFormEmprestimo({ ...formEmprestimo, conta_origem_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm disabled:opacity-60"
                  >
                    <option value="">{editingDividaId ? 'Não editável' : 'Selecione a conta...'}</option>
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
                  onClick={() => { setModalEmprestimo(false); setEditingDividaId(null); }}
                  className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
                >
                  {editingDividaId ? 'Salvar Alterações' : 'Confirmar Empréstimo'}
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
                        <div className="flex items-center gap-1 w-28">
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
                        <button
                          type="button"
                          onClick={() => handleAbrirModalQrPix(part.nome, parseFloat(part.valor) || 0, formDivisao.descricao || 'Cota de Despesa')}
                          title="Gerar QR Code PIX para esta cota"
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
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

      {/* MODAL QR CODE PIX COM SELEÇÃO EXPLÍCITA DE CHAVE */}
      {modalQrPix.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Cobrança PIX Instantânea
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Cota de <strong className="text-gray-700 dark:text-gray-300">{modalQrPix.pessoaNome}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalQrPix({ ...modalQrPix, open: false })}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Resumo da Cota */}
              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Motivo / Despesa</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{modalQrPix.motivo || 'Divisão'}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Valor a Pagar</span>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    R$ {modalQrPix.valor.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Escolha da Chave PIX (Exigência do usuário: Chave de sua escolha!) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Escolha qual chave PIX deseja usar para receber: *
                </label>
                {chavesPix.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                    Nenhuma chave PIX cadastrada. Cadastre uma chave no menu <strong>Cobrança PIX</strong> para gerar QR Codes.
                  </div>
                ) : (
                  <select
                    value={chaveSelecionadaId}
                    onChange={e => setChaveSelecionadaId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {chavesPix.map(ch => (
                      <option key={ch.id} value={ch.id}>
                        {ch.apelido ? `[${ch.apelido}] ` : ''}{ch.tipo.toUpperCase()}: {ch.valor_chave} ({ch.nome_recebedor})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Botão de Gerar */}
              {!cobrancaGerada && (
                <button
                  type="button"
                  onClick={handleGerarQrPix}
                  disabled={gerandoPix || chavesPix.length === 0}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <QrCode className="w-4 h-4" />
                  {gerandoPix ? 'Gerando QR Code PIX...' : 'Gerar QR Code com Esta Chave'}
                </button>
              )}

              {/* QR Code Gerado & Copia e Cola */}
              {cobrancaGerada && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-gray-200 dark:border-gray-700 shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cobrancaGerada.payload_emv)}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 rounded-lg"
                    />
                    <span className="text-[11px] text-gray-400 mt-2">Aponte a câmera ou o app do banco</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Código PIX Copia e Cola
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={cobrancaGerada.payload_emv}
                        className="w-full px-2.5 py-2 text-xs font-mono bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 truncate"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopiarPix(cobrancaGerada.payload_emv)}
                        className="shrink-0 flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCobrancaGerada(null)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Trocar Chave PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalQrPix({ ...modalQrPix, open: false })}
                      className="px-4 py-1.5 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
