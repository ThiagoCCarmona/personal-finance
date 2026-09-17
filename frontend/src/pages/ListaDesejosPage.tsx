import React, { useState, useEffect } from 'react';
import { 
  Heart, Plus, ExternalLink, CheckCircle2, Clock, Trash2, Edit2, 
  Search, ShoppingBag, Sparkles, History, Store, Link2, TrendingDown, TrendingUp, X
} from 'lucide-react';
import { api } from '../services/api.js';
import { ItemDesejo, Categoria, Conta, CartaoCredito } from '../types/index.js';
import { PrivacyValue } from '../components/common/PrivacyValue.js';

export const ListaDesejosPage: React.FC = () => {
  const [itens, setItens] = useState<ItemDesejo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas');
  const [busca, setBusca] = useState<string>('');

  // Modais
  const [showModalForm, setShowModalForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemDesejo | null>(null);
  const [showModalComprar, setShowModalComprar] = useState(false);
  const [itemComprando, setItemComprando] = useState<ItemDesejo | null>(null);

  // Modal Histórico de Preços
  const [showModalHistorico, setShowModalHistorico] = useState(false);
  const [itemHistorico, setItemHistorico] = useState<ItemDesejo | null>(null);
  const [novoPrecoHistorico, setNovoPrecoHistorico] = useState('');
  const [novaLojaHistorico, setNovaLojaHistorico] = useState('');
  const [novaDataHistorico, setNovaDataHistorico] = useState(() => new Date().toISOString().split('T')[0]);
  const [novaObsHistorico, setNovaObsHistorico] = useState('');
  const [salvandoPreco, setSalvandoPreco] = useState(false);

  // Form State
  const [formItem, setFormItem] = useState<{
    nome: string;
    link: string;
    links: Array<{ url: string; loja: string }>;
    preco_estimado: string;
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    categoria_id: string;
    tipo_gasto: 'essencial' | 'pessoal' | 'desejo' | 'investimento_pessoal' | 'eletronico' | 'casa';
    status: 'planejado' | 'comprado' | 'descartado';
    observacoes: string;
    data_alvo: string;
  }>({
    nome: '',
    link: '',
    links: [{ url: '', loja: '' }],
    preco_estimado: '',
    prioridade: 'media',
    categoria_id: '',
    tipo_gasto: 'desejo',
    status: 'planejado',
    observacoes: '',
    data_alvo: '',
  });

  // Form Comprar State
  const [formComprar, setFormComprar] = useState<{
    debitar_financeiro: boolean;
    tipo_destino: 'conta' | 'cartao';
    conta_id: string;
    cartao_id: string;
    categoria_id: string;
    valor_pago: string;
  }>({
    debitar_financeiro: false,
    tipo_destino: 'conta',
    conta_id: '',
    cartao_id: '',
    categoria_id: '',
    valor_pago: '',
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [itensData, catData, contasData, cartoesData] = await Promise.all([
        api.getItensDesejo({
          status: filtroStatus !== 'todos' ? filtroStatus : undefined,
          prioridade: filtroPrioridade !== 'todas' ? filtroPrioridade : undefined,
          busca: busca.trim() || undefined
        }),
        api.getCategorias('despesa').catch(() => ({ flat: [] })),
        api.getContas().catch(() => []),
        api.getCartoes().catch(() => []),
      ]);
      setItens(itensData);
      setCategorias(catData.flat || []);
      setContas(contasData);
      setCartoes(cartoesData);
    } catch (err) {
      console.error('Erro ao carregar lista de desejos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [filtroStatus, filtroPrioridade, busca]);

  const handleOpenNovo = () => {
    setEditingItem(null);
    setFormItem({
      nome: '',
      link: '',
      links: [{ url: '', loja: '' }],
      preco_estimado: '',
      prioridade: 'media',
      categoria_id: categorias[0]?.id || '',
      tipo_gasto: 'desejo',
      status: 'planejado',
      observacoes: '',
      data_alvo: '',
    });
    setShowModalForm(true);
  };

  const handleOpenEditar = (item: ItemDesejo) => {
    setEditingItem(item);
    let linksIniciais: Array<{ url: string; loja: string }> = [];
    if (item.links && item.links.length > 0) {
      linksIniciais = item.links.map(l => ({ url: l.url || '', loja: l.loja || '' }));
    } else if (item.link) {
      linksIniciais = [{ url: item.link, loja: '' }];
    } else {
      linksIniciais = [{ url: '', loja: '' }];
    }

    setFormItem({
      nome: item.nome,
      link: item.link || '',
      links: linksIniciais,
      preco_estimado: String(item.preco_estimado),
      prioridade: item.prioridade,
      categoria_id: item.categoria_id || '',
      tipo_gasto: item.tipo_gasto as any || 'desejo',
      status: item.status,
      observacoes: item.observacoes || '',
      data_alvo: item.data_alvo ? item.data_alvo.split('T')[0] : '',
    });
    setShowModalForm(true);
  };

  const handleSalvarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const preco = parseFloat(formItem.preco_estimado);
      if (isNaN(preco) || preco <= 0) {
        alert('Informe um preço estimado válido maior que zero.');
        return;
      }

      const linksValidos = formItem.links
        .filter(l => l.url.trim().length > 0)
        .map(l => ({ url: l.url.trim(), loja: l.loja.trim() || undefined }));

      const payload = {
        nome: formItem.nome.trim(),
        link: linksValidos[0]?.url || formItem.link.trim() || undefined,
        links: linksValidos,
        preco_estimado: preco,
        prioridade: formItem.prioridade,
        categoria_id: formItem.categoria_id || undefined,
        tipo_gasto: formItem.tipo_gasto,
        status: formItem.status,
        observacoes: formItem.observacoes.trim() || undefined,
        data_alvo: formItem.data_alvo || undefined,
      };

      if (editingItem) {
        await api.updateItemDesejo(editingItem.id, payload);
      } else {
        await api.createItemDesejo(payload);
      }

      setShowModalForm(false);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar item.');
    }
  };

  const handleOpenHistorico = (item: ItemDesejo) => {
    setItemHistorico(item);
    setNovoPrecoHistorico(String(item.preco_estimado));
    setNovaLojaHistorico(item.links?.[0]?.loja || '');
    setNovaDataHistorico(new Date().toISOString().split('T')[0]);
    setNovaObsHistorico('');
    setShowModalHistorico(true);
  };

  const handleSalvarNovoPreco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemHistorico) return;
    const p = parseFloat(novoPrecoHistorico);
    if (isNaN(p) || p <= 0) {
      alert('Informe um valor de preço válido.');
      return;
    }
    try {
      setSalvandoPreco(true);
      const atualizado = await api.adicionarPrecoItemDesejo(itemHistorico.id, {
        preco: p,
        loja: novaLojaHistorico.trim() || undefined,
        data: novaDataHistorico || undefined,
        observacao: novaObsHistorico.trim() || undefined,
      });
      setItemHistorico(atualizado);
      setNovoPrecoHistorico('');
      setNovaObsHistorico('');
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar preço no histórico.');
    } finally {
      setSalvandoPreco(false);
    }
  };

  const handleExcluir = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente remover "${nome}" da sua lista de desejos?`)) return;
    try {
      await api.deleteItemDesejo(id);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir item.');
    }
  };

  const handleOpenComprar = (item: ItemDesejo) => {
    setItemComprando(item);
    setFormComprar({
      debitar_financeiro: true,
      tipo_destino: 'conta',
      conta_id: contas[0]?.id || '',
      cartao_id: cartoes[0]?.id || '',
      categoria_id: item.categoria_id || categorias[0]?.id || '',
      valor_pago: String(item.preco_estimado),
    });
    setShowModalComprar(true);
  };

  const handleConfirmarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemComprando) return;
    try {
      let body: any = {};
      if (formComprar.debitar_financeiro) {
        body = {
          valor_pago: parseFloat(formComprar.valor_pago) || itemComprando.preco_estimado,
          categoria_id: formComprar.categoria_id || undefined,
          forma_pagamento: formComprar.tipo_destino === 'cartao' ? 'credito' : 'pix_debito',
          conta_id: formComprar.tipo_destino === 'conta' ? formComprar.conta_id : undefined,
          cartao_id: formComprar.tipo_destino === 'cartao' ? formComprar.cartao_id : undefined,
        };
      }
      await api.comprarItemDesejo(itemComprando.id, body);
      setShowModalComprar(false);
      setItemComprando(null);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar compra.');
    }
  };

  // Métricas
  const totalPlanejado = itens
    .filter(i => i.status === 'planejado')
    .reduce((acc, i) => acc + i.preco_estimado, 0);

  const totalComprado = itens
    .filter(i => i.status === 'comprado')
    .reduce((acc, i) => acc + i.preco_estimado, 0);

  const qtdUrgentes = itens.filter(i => i.status === 'planejado' && (i.prioridade === 'urgente' || i.prioridade === 'alta')).length;

  const CORES_PRIORIDADE: Record<string, { bg: string; text: string; border: string; label: string }> = {
    urgente: { bg: 'bg-rose-950/70', text: 'text-rose-400', border: 'border-rose-800/60', label: 'Urgente' },
    alta: { bg: 'bg-amber-950/70', text: 'text-amber-400', border: 'border-amber-800/60', label: 'Alta' },
    media: { bg: 'bg-blue-950/70', text: 'text-blue-400', border: 'border-blue-800/60', label: 'Média' },
    baixa: { bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-800', label: 'Baixa' },
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Heart className="text-pink-500 fill-pink-500/20" size={26} />
            <span>Lista de Desejos & Metas de Compras</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Planeje suas futuras aquisições, compare prioridades e converta desejos em lançamentos reais com 1 clique.
          </p>
        </div>

        <button
          onClick={handleOpenNovo}
          className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-lg shadow-pink-600/20 shrink-0"
        >
          <Plus size={18} />
          <span>Novo Desejo</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Total Planejado</span>
            <div className="text-xl font-bold text-slate-100">
              <PrivacyValue value={totalPlanejado} />
            </div>
            <span className="text-[11px] text-slate-500">
              {itens.filter(i => i.status === 'planejado').length} itens aguardando
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Já Realizados / Comprados</span>
            <div className="text-xl font-bold text-slate-100">
              <PrivacyValue value={totalComprado} />
            </div>
            <span className="text-[11px] text-slate-500">
              {itens.filter(i => i.status === 'comprado').length} sonhos conquistados
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">Alta Prioridade / Urgentes</span>
            <div className="text-xl font-bold text-amber-400">
              {qtdUrgentes} itens
            </div>
            <span className="text-[11px] text-slate-500">
              Foco imediato de compra
            </span>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar produto ou anotação..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-pink-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none"
          >
            <option value="todos">Todos os Status</option>
            <option value="planejado">Planejados</option>
            <option value="comprado">Comprados</option>
            <option value="descartado">Descartados</option>
          </select>

          <select
            value={filtroPrioridade}
            onChange={e => setFiltroPrioridade(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-300 focus:outline-none"
          >
            <option value="todas">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-2xl">
            Carregando lista de desejos...
          </div>
        ) : itens.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <Heart size={36} className="mx-auto text-slate-600" />
            <div className="text-slate-300 font-semibold">Sua lista de desejos está vazia.</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Adicione produtos, cursos, eletrônicos ou viagens que deseja conquistar no futuro.
            </p>
            <button
              onClick={handleOpenNovo}
              className="bg-pink-600/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30 px-4 py-2 rounded-xl text-xs font-semibold transition"
            >
              + Adicionar Primeiro Desejo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {itens.map((item) => {
              const prioInfo = CORES_PRIORIDADE[item.prioridade] || CORES_PRIORIDADE.media;
              const isComprado = item.status === 'comprado';

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900 border rounded-2xl p-4 transition ${
                    isComprado 
                      ? 'border-emerald-800/40 bg-slate-950/40 opacity-75' 
                      : 'border-slate-800 hover:border-slate-700/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${prioInfo.bg} ${prioInfo.text} ${prioInfo.border}`}>
                          {prioInfo.label}
                        </span>
                        {item.categoria_nome && (
                          <span 
                            className="text-[10px] font-semibold px-2 py-0.5 rounded"
                            style={{ backgroundColor: `${item.categoria_cor}20`, color: item.categoria_cor || '#94a3b8' }}
                          >
                            {item.categoria_nome}
                          </span>
                        )}
                        <span className="text-[10px] uppercase text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          {item.tipo_gasto.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className={`text-base font-bold text-slate-100 truncate ${isComprado ? 'line-through text-slate-400' : ''}`}>
                        {item.nome}
                      </h3>

                      {item.observacoes && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {item.observacoes}
                        </p>
                      )}

                      {item.data_alvo && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-400/90 pt-0.5">
                          <Clock size={12} />
                          <span>Previsão: {new Date(item.data_alvo).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-500">Estimado</div>
                      <div className="text-base font-bold text-slate-100">
                        <PrivacyValue value={item.preco_estimado} />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800/80">
                    {/* Links de Lojas */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.links && item.links.length > 0 ? (
                        item.links.map((lnk, lIdx) => (
                          <a
                            key={lIdx}
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 px-2 py-1 rounded-lg transition"
                          >
                            <Store size={12} />
                            <span>{lnk.loja || `Loja ${lIdx + 1}`}</span>
                            <ExternalLink size={11} />
                          </a>
                        ))
                      ) : item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-pink-400 hover:text-pink-300 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 px-2 py-1 rounded-lg transition"
                        >
                          <span>Ver na Loja</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">Sem links cadastrados</span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => handleOpenHistorico(item)}
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 px-2 py-1.5 rounded-lg text-xs font-semibold transition"
                        title="Ver ou registrar histórico de preços"
                      >
                        <History size={13} className="text-amber-400" />
                        <span>Preços ({item.historico_precos?.length || 1})</span>
                      </button>

                      {!isComprado && (
                        <button
                          onClick={() => handleOpenComprar(item)}
                          className="flex items-center gap-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition"
                          title="Marcar como comprado"
                        >
                          <CheckCircle2 size={13} />
                          <span>Comprei</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditar(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition"
                        title="Editar item"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleExcluir(item.id, item.nome)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Remover da lista"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Desejo */}
      {showModalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-100 mb-4">
              {editingItem ? 'Editar Desejo' : 'Adicionar Novo Desejo'}
            </h3>

            <form onSubmit={handleSalvarItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Item / Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Teclado Mecânico, Curso de Inglês, iPhone 16..."
                  value={formItem.nome}
                  onChange={e => setFormItem({ ...formItem, nome: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preço Estimado (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formItem.preco_estimado}
                    onChange={e => setFormItem({ ...formItem, preco_estimado: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridade / Urgência</label>
                  <select
                    value={formItem.prioridade}
                    onChange={e => setFormItem({ ...formItem, prioridade: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="urgente">Urgente</option>
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
              </div>

              {/* Links Múltiplos */}
              <div className="space-y-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Link2 size={13} className="text-pink-400" />
                    <span>Links de Lojas & Produtos</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormItem(prev => ({ ...prev, links: [...prev.links, { url: '', loja: '' }] }))}
                    className="text-[11px] text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1"
                  >
                    <Plus size={12} /> Adicionar outro link
                  </button>
                </div>

                {formItem.links.map((lnk, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Loja (ex: Amazon, Kabum)"
                      value={lnk.loja}
                      onChange={e => {
                        const newLinks = [...formItem.links];
                        newLinks[idx].loja = e.target.value;
                        setFormItem({ ...formItem, links: newLinks });
                      }}
                      className="w-1/3 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                    <input
                      type="url"
                      placeholder="https://..."
                      value={lnk.url}
                      onChange={e => {
                        const newLinks = [...formItem.links];
                        newLinks[idx].url = e.target.value;
                        setFormItem({ ...formItem, links: newLinks });
                      }}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                    />
                    {formItem.links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormItem(prev => ({
                            ...prev,
                            links: prev.links.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                        title="Remover este link"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Gasto</label>
                  <select
                    value={formItem.tipo_gasto}
                    onChange={e => setFormItem({ ...formItem, tipo_gasto: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="desejo">Desejo Pessoal</option>
                    <option value="essencial">Essencial</option>
                    <option value="investimento_pessoal">Investimento Pessoal</option>
                    <option value="eletronico">Eletrônico / Setup</option>
                    <option value="casa">Casa & Conforto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria Vinculada</label>
                  <select
                    value={formItem.categoria_id}
                    onChange={e => setFormItem({ ...formItem, categoria_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="">Sem categoria</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data Alvo de Compra</label>
                  <input
                    type="date"
                    value={formItem.data_alvo}
                    onChange={e => setFormItem({ ...formItem, data_alvo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={formItem.status}
                    onChange={e => setFormItem({ ...formItem, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                  >
                    <option value="planejado">Planejado</option>
                    <option value="comprado">Comprado</option>
                    <option value="descartado">Descartado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Observações / Motivo</label>
                <textarea
                  rows={2}
                  placeholder="Por que você quer comprar? Vale a pena aguardar promoção?"
                  value={formItem.observacoes}
                  onChange={e => setFormItem({ ...formItem, observacoes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModalForm(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-lg shadow-pink-600/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Marcar Como Comprado */}
      {showModalComprar && itemComprando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-1">Parabéns pela Conquista! 🎉</h3>
            <p className="text-xs text-slate-400 mb-4">
              Item: <strong>{itemComprando.nome}</strong>
            </p>

            <form onSubmit={handleConfirmarCompra} className="space-y-4">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer text-sm font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={formComprar.debitar_financeiro}
                    onChange={e => setFormComprar({ ...formComprar, debitar_financeiro: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-900 text-pink-600"
                  />
                  Registrar saída financeira nos Lançamentos
                </label>
                <span className="text-[11px] text-slate-500 block mt-1 pl-6">
                  Se ativado, subtrai o valor da sua conta bancária ou fatura do cartão automaticamente.
                </span>
              </div>

              {formComprar.debitar_financeiro && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Pago Efetivo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formComprar.valor_pago}
                      onChange={e => setFormComprar({ ...formComprar, valor_pago: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Onde foi pago?</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormComprar({ ...formComprar, tipo_destino: 'conta' })}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          formComprar.tipo_destino === 'conta'
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Conta Bancária
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormComprar({ ...formComprar, tipo_destino: 'cartao' })}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          formComprar.tipo_destino === 'cartao'
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}
                      >
                        Cartão de Crédito
                      </button>
                    </div>
                  </div>

                  {formComprar.tipo_destino === 'conta' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Conta de Origem</label>
                      <select
                        value={formComprar.conta_id}
                        onChange={e => setFormComprar({ ...formComprar, conta_id: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      >
                        {contas.map(c => (
                          <option key={c.id} value={c.id}>{c.apelido} (Saldo: R$ {Number(c.saldo_atual).toFixed(2)})</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Cartão Utilizado</label>
                      <select
                        value={formComprar.cartao_id}
                        onChange={e => setFormComprar({ ...formComprar, cartao_id: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none"
                      >
                        {cartoes.map(card => (
                          <option key={card.id} value={card.id}>{card.apelido}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModalComprar(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-600/20"
                >
                  Confirmar Realização
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Histórico de Preços */}
      {showModalHistorico && itemHistorico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <History className="text-amber-400" size={20} />
                  <span>Histórico de Preços</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Item: <strong className="text-slate-200">{itemHistorico.nome}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModalHistorico(false)}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário: Registrar nova cotação de preço */}
            <form onSubmit={handleSalvarNovoPreco} className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Registrar Novo Preço / Promoção
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Preço Atual (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={novoPrecoHistorico}
                    onChange={e => setNovoPrecoHistorico(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Data da Consulta</label>
                  <input
                    type="date"
                    value={novaDataHistorico}
                    onChange={e => setNovaDataHistorico(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Loja / Onde encontrou</label>
                  <input
                    type="text"
                    placeholder="Ex: Mercado Livre, Amazon..."
                    value={novaLojaHistorico}
                    onChange={e => setNovaLojaHistorico(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Observação / Cupom</label>
                  <input
                    type="text"
                    placeholder="Ex: Cupom 10% OFF, Frete Grátis..."
                    value={novaObsHistorico}
                    onChange={e => setNovaObsHistorico(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={salvandoPreco}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs transition disabled:opacity-50"
                >
                  {salvandoPreco ? 'Salvando...' : 'Salvar Nova Cotação'}
                </button>
              </div>
            </form>

            {/* Listagem do Histórico */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">
                Evolução das Cotações ({itemHistorico.historico_precos?.length || 1} registros)
              </span>

              {(!itemHistorico.historico_precos || itemHistorico.historico_precos.length === 0) ? (
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  Apenas o preço estimado inicial de R$ {Number(itemHistorico.preco_estimado).toFixed(2)} registrado.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {[...itemHistorico.historico_precos].reverse().map((h, hIdx, arr) => {
                    const proxReg = arr[hIdx + 1];
                    let variacao: number | null = null;
                    if (proxReg && proxReg.preco > 0) {
                      variacao = ((h.preco - proxReg.preco) / proxReg.preco) * 100;
                    }

                    return (
                      <div
                        key={hIdx}
                        className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-300">
                              {new Date(h.data + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                            </span>
                            {h.loja && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-pink-300 border border-slate-700">
                                {h.loja}
                              </span>
                            )}
                          </div>
                          {h.observacao && (
                            <p className="text-[11px] text-slate-400 truncate">
                              {h.observacao}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-100 text-sm">
                            R$ {Number(h.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          {variacao !== null && (
                            <div className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${
                              variacao < 0 ? 'text-emerald-400' : variacao > 0 ? 'text-rose-400' : 'text-slate-400'
                            }`}>
                              {variacao < 0 ? <TrendingDown size={11} /> : variacao > 0 ? <TrendingUp size={11} /> : null}
                              <span>{variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModalHistorico(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
