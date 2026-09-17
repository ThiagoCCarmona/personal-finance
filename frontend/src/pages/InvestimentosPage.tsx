import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, Trash2, PieChart as PieIcon, Building2, Clock, X, Edit2 } from 'lucide-react';
import { api } from '../services/api.js';
import { PosicaoAtivo, ResumoCarteira, TipoInvestimento } from '../types/index.js';
import { PrivacyValue } from '../components/common/PrivacyValue.js';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const InvestimentosPage: React.FC = () => {
  const [ativos, setAtivos] = useState<PosicaoAtivo[]>([]);
  const [resumo, setResumo] = useState<ResumoCarteira | null>(null);
  const [loading, setLoading] = useState(true);
  const [moedas, setMoedas] = useState<any[]>([]);

  const [showModalNovoAtivo, setShowModalNovoAtivo] = useState(false);
  const [editingAtivoId, setEditingAtivoId] = useState<string | null>(null);
  const [formAtivo, setFormAtivo] = useState<{
    tipo: TipoInvestimento;
    nome: string;
    ticker: string;
    moeda_id: string;
    instituicao: string;
    indexador: string;
    taxa_anual: string;
    data_vencimento: string;
  }>({
    tipo: 'renda_fixa',
    nome: '',
    ticker: '',
    moeda_id: '',
    instituicao: '',
    indexador: '100% CDI',
    taxa_anual: '',
    data_vencimento: '',
  });

  const [showModalMov, setShowModalMov] = useState(false);
  const [ativoSelecionado, setAtivoSelecionado] = useState<PosicaoAtivo | null>(null);
  const [formMov, setFormMov] = useState<{
    tipo: 'aporte' | 'resgate' | 'rendimento';
    valor: string;
    quantidade: string;
    cotacao_praticada: string;
    data: string;
    observacao: string;
  }>({
    tipo: 'aporte',
    valor: '',
    quantidade: '1',
    cotacao_praticada: '',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [dataAtivos, dataResumo, dataMoedas] = await Promise.all([
        api.getInvestimentos(),
        api.getResumoCarteira(),
        api.getMoedas().catch(() => []),
      ]);
      setAtivos(Array.isArray(dataAtivos) ? dataAtivos : []);
      setResumo(dataResumo || { total_aplicado: 0, total_rendimentos: 0, total_aportado: 0 });
      if (dataMoedas && dataMoedas.length > 0) {
        setMoedas(dataMoedas);
        if (!formAtivo.moeda_id) {
          const brl = dataMoedas.find(m => m.codigo === 'BRL') || dataMoedas[0];
          setFormAtivo(prev => ({ ...prev, moeda_id: brl.id }));
        }
      }
    } catch (err) {
      console.error('Erro patrimonio:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleAbrirNovoAtivo = () => {
    setEditingAtivoId(null);
    setFormAtivo({
      tipo: 'renda_fixa',
      nome: '',
      ticker: '',
      moeda_id: moedas[0]?.id || '',
      instituicao: '',
      indexador: '100% CDI',
      taxa_anual: '',
      data_vencimento: '',
    });
    setShowModalNovoAtivo(true);
  };

  const handleEditarAtivo = (ativo: PosicaoAtivo) => {
    setEditingAtivoId(ativo.id);
    const m = moedas.find(item => item.codigo === ativo.moeda_codigo);
    setFormAtivo({
      tipo: ativo.tipo,
      nome: ativo.nome,
      ticker: ativo.ticker || '',
      moeda_id: m ? m.id : (moedas[0]?.id || ''),
      instituicao: ativo.instituicao || '',
      indexador: ativo.indexador || '',
      taxa_anual: ativo.taxa_anual ? String(ativo.taxa_anual) : '',
      data_vencimento: ativo.data_vencimento || '',
    });
    setShowModalNovoAtivo(true);
  };

  const handleSalvarAtivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        tipo: formAtivo.tipo,
        nome: formAtivo.nome,
        ticker: formAtivo.ticker || undefined,
        moeda_id: formAtivo.moeda_id,
        instituicao: formAtivo.instituicao || undefined,
        indexador: formAtivo.indexador || undefined,
        taxa_anual: formAtivo.taxa_anual ? Number(formAtivo.taxa_anual) : undefined,
        data_vencimento: formAtivo.data_vencimento || undefined,
      };

      if (editingAtivoId) {
        await api.updateInvestimento(editingAtivoId, payload);
      } else {
        await api.createInvestimento(payload);
      }
      setShowModalNovoAtivo(false);
      setEditingAtivoId(null);
      carregarDados();
    } catch (err) {
      alert('Erro ao salvar ativo.');
    }
  };

  const handleSalvarMovimentacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ativoSelecionado) return;
    try {
      const valorNum = Number(formMov.valor);
      const qtdNum = Number(formMov.quantidade);
      const cotacaoNum = formMov.cotacao_praticada
        ? Number(formMov.cotacao_praticada)
        : valorNum / qtdNum;

      await api.createMovimentacaoInvestimento({
        investimento_id: ativoSelecionado.id,
        tipo: formMov.tipo,
        valor: valorNum,
        quantidade: qtdNum,
        cotacao_praticada: cotacaoNum,
        data: formMov.data,
        observacao: formMov.observacao || undefined,
      });
      setShowModalMov(false);
      setFormMov({
        tipo: 'aporte',
        valor: '',
        quantidade: '1',
        cotacao_praticada: '',
        data: new Date().toISOString().split('T')[0],
        observacao: '',
      });
      carregarDados();
    } catch (err) {
      alert('Erro ao registrar movimentacao.');
    }
  };

  const handleExcluirAtivo = async (id: string, nome: string) => {
    if (!confirm('Deseja realmente excluir o ativo ' + nome + '?')) return;
    try {
      await api.deleteInvestimento(id);
      carregarDados();
    } catch (err) {
      alert('Erro ao excluir ativo.');
    }
  };

  const CORES: Record<string, string> = {
    renda_fixa: '#3b82f6',
    acao: '#10b981',
    fii: '#8b5cf6',
    cripto: '#f59e0b',
    moeda_estrangeira: '#06b6d4',
  };

  const LABELS: Record<string, string> = {
    renda_fixa: 'Renda Fixa',
    acao: 'Acoes',
    fii: 'FIIs',
    cripto: 'Cripto',
    moeda_estrangeira: 'Moeda Estrangeira',
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-slate-100 flex items-center gap-2'>
            <TrendingUp className='text-blue-500' />
            Carteira & Patrimonio
          </h1>
          <p className='text-sm text-slate-400 mt-1'>Gestao de ativos, preco medio ponderado, aportes e rendimentos</p>
        </div>
        <button
          onClick={handleAbrirNovoAtivo}
          className='flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20'
        >
          <Plus size={18} />
          <span>Novo Ativo</span>
        </button>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <div className='bg-slate-900 border border-slate-800 rounded-2xl p-5'>
          <span className='text-xs text-slate-400 uppercase tracking-wider font-semibold'>Patrimonio Aplicado</span>
          <div className='text-2xl font-bold text-slate-100 mt-2'>
            <PrivacyValue value={resumo?.total_patrimonio ?? 0} />
          </div>
          <span className='text-xs text-slate-500 mt-1 block'>{resumo?.quantidade_ativos ?? 0} ativos monitorados</span>
        </div>

        <div className='bg-slate-900 border border-slate-800 rounded-2xl p-5'>
          <span className='text-xs text-slate-400 uppercase tracking-wider font-semibold'>Total Aportado</span>
          <div className='text-2xl font-bold text-blue-400 mt-2'>
            <PrivacyValue value={resumo?.total_aportado ?? 0} />
          </div>
          <span className='text-xs text-slate-500 mt-1 block'>Total de recursos destinados</span>
        </div>

        <div className='bg-slate-900 border border-slate-800 rounded-2xl p-5'>
          <span className='text-xs text-slate-400 uppercase tracking-wider font-semibold'>Proventos / Rendimentos</span>
          <div className='text-2xl font-bold text-emerald-400 mt-2'>
            <PrivacyValue value={resumo?.total_rendimentos ?? 0} />
          </div>
          <span className='text-xs text-slate-500 mt-1 block'>Dividendos e juros capital</span>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='bg-slate-900 border border-slate-800 rounded-2xl p-5'>
          <h2 className='text-base font-semibold text-slate-100 flex items-center gap-2 mb-4'>
            <PieIcon size={18} className='text-blue-400' /> Alocacao por Classe
          </h2>
          {resumo && resumo.total_patrimonio > 0 ? (
            <div className='h-48 w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={resumo.alocacao_por_tipo}
                  dataKey='valor'
                    nameKey='tipo'
                    cx='50%'
                    cy='50%'
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                  >
                    {resumo.alocacao_por_tipo.map((entry, idx) => (
                      <Cell key={idx} fill={CORES[entry.tipo] || '#64748b'} />
                    ))}
                  </Pie>
                 <Tooltip formatter={(val: any) => [val, 'Saldo']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className='h-48 flex items-center justify-center text-xs text-slate-500'>Nenhum ativo com saldo positivo</div>
          )}
          <div className='space-y-2 mt-4'>
            {resumo?.alocacao_por_tipo.map(item => (
              <div key={item.tipo} className='flex items-center justify-between text-xs'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded-full' style={{ backgroundColor: CORES[item.tipo] || '#64748b' }} />
                  <span className='text-slate-300'>{LABELS[item.tipo] || item.tipo}</span>
                </div>
                <div className='flex items-center gap-3'>
                  <span className='text-slate-400 font-mono'>{item.percentual}%</span>
                  <span className='font-medium text-slate-200'>
                    <PrivacyValue value={item.valor} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5'>
          <h2 className='text-base font-semibold text-slate-100 mb-4'>Posicao Atual dos Ativos</h2>
          {loading ? (
            <div className='py-12 text-center text-slate-500 text-sm'>Carregando carteira...</div>
          ) : ativos.length === 0 ? (
            <div className='py-12 text-center text-slate-500 text-sm'>Nenhum investimento registrado.</div>
          ) : (
            <div className='space-y-3'>
              {ativos.map(ativo => (
                <div key={ativo.id} className='bg-slate-950/60 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div className='flex items-start gap-3'>
                      <div className='w-2.5 h-10 rounded-full mt-1 shrink-0' style={{ backgroundColor: CORES[ativo.tipo] || '#3b82f6' }} />
                     <div>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold text-slate-200 text-base'>{ativo.nome}</span>
                          {ativo.ticker && <span className='bg-slate-800 text-blue-400 font-mono text-[11px]px-2 py-0.5 rounded font-semibold'>{ativo.ticker}</span>}
                        </div>
                        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1'>
                           {ativo.instituicao && <span className='flex items-center gap-1'><Building2 size={12} /> {ativo.instituicao}</span>}
                          {ativo.indexador && <span className='bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded text-[11px]'>{ativo.indexador}</span>}
                          {ativo.data_vencimento && <span className='flex items-center gap-1 text-amber-400/90 text-[11px]'><Clock size={12} /> Vence: {ativo.data_vencimento}</span>}
                        </div>
                     </div>
                    </div>
                    <div className='flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60'>
                      <div className='text-left sm:text-right'>
                        <div className='text-xs text-slate-500'>Saldo Aplicado</div>
                        <div className='text-base font-bold text-slate-100'><PrivacyValue value={ativo.saldo_aplicado} /></div>
                        <div className='text-[11px] text-slate-400 mt-0.5'>Qtd: <span className='font-mono text-slate-300'>{ativo.quantidade_total}</span>{ativo.preco_medio > 0 && <> | PM: <span className='font-mono text-slate-300'>R$ {ativo.preco_medio.toFixed(2)}</span></>}</div>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <button onClick={() => { setAtivoSelecionado(ativo); setShowModalMov(true); }} className='bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium transition'>Movimentar</button>
                        <button onClick={() => handleEditarAtivo(ativo)} title="Editar Ativo" className='p-1.5 text-slate-400 hover:text-blue-400 rounded-lg transition'><Edit2 size={16} /></button>
                        <button onClick={() => handleExcluirAtivo(ativo.id, ativo.nome)} title="Excluir Ativo" className='p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition'><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModalNovoAtivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-100">{editingAtivoId ? 'Editar Ativo' : 'Cadastrar Novo Ativo'}</h3>
              <button onClick={() => setShowModalNovoAtivo(false)} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSalvarAtivo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo</label>
                <select
                  value={formAtivo.tipo}
                  onChange={e => setFormAtivo({ ...formAtivo, tipo: e.target.value as TipoInvestimento })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  <option value="renda_fixa">Renda Fixa</option>
                  <option value="acao">Ações</option>
                  <option value="fii">FIIs</option>
                  <option value="cripto">Criptomoedas</option>
                  <option value="moeda_estrangeira">Moeda Estrangeira</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Ativo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tesouro Selic, PETR4..."
                  value={formAtivo.nome}
                  onChange={e => setFormAtivo({ ...formAtivo, nome: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ticker</label>
                  <input
                    type="text"
                    placeholder="Ex: PETR4"
                    value={formAtivo.ticker}
                    onChange={e => setFormAtivo({ ...formAtivo, ticker: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Instituição</label>
                  <input
                    type="text"
                    placeholder="Ex: XP, Nubank"
                    value={formAtivo.instituicao}
                    onChange={e => setFormAtivo({ ...formAtivo, instituicao: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModalNovoAtivo(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
                >
                  Salvar Ativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalMov && ativoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Lançar Movimentação</h3>
                <p className="text-xs text-slate-400">Ativo: {ativoSelecionado.nome}</p>
              </div>
              <button onClick={() => setShowModalMov(false)} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSalvarMovimentacao} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['aporte', 'resgate', 'rendimento'] as const).map(tipo => (
                    <button
                      type="button"
                      key={tipo}
                      onClick={() => setFormMov({ ...formMov, tipo })}
                      className={`py-2 rounded-xl text-xs font-medium capitalize border transition ${
                        formMov.tipo === tipo
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formMov.valor}
                    onChange={e => setFormMov({ ...formMov, valor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Quantidade</label>
                  <input
                    type="number"
                    step="0.00000001"
                    required
                    placeholder="1"
                    value={formMov.quantidade}
                    onChange={e => setFormMov({ ...formMov, quantidade: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModalMov(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
