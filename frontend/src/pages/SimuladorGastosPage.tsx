import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, ArrowRight, CreditCard, Wallet, Calendar, AlertTriangle, 
  Percent, Sparkles 
} from 'lucide-react';
import { api } from '../services/api';
import { Conta, CartaoCredito, ResultadoSimulacaoGasto } from '../types';
import { PrivacyValue } from '../components/common/PrivacyValue';
import { DateInput } from '../components/common/DateInput';

export const SimuladorGastosPage: React.FC = () => {
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [resultado, setResultado] = useState<ResultadoSimulacaoGasto | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    descricao: 'Notebook ou Viagem',
    valor_original: '1200',
    moeda_codigo: 'BRL',
    cotacao_personalizada: '',
    forma_pagamento: 'cartao_parcelado' as 'a_vista' | 'cartao_parcelado',
    conta_id: 'unificado',
    cartao_id: '',
    num_parcelas: 6,
    com_juros: false,
    taxa_juros_mensal: '2.5',
    tipo_juros: 'price' as 'price' | 'simples',
    data_prevista: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    async function load() {
      try {
        const [cRes, crtRes] = await Promise.all([
          api.getContas(),
          api.getCartoes()
        ]);
        setContas(cRes);
        setCartoes(crtRes);
        setForm(prev => ({ ...prev, conta_id: 'unificado' }));
        if (crtRes.length > 0) setForm(prev => ({ ...prev, cartao_id: crtRes[0].id }));
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      }
    }
    load();
  }, []);

  const handleSimular = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(form.valor_original);
    if (isNaN(val) || val <= 0) {
      alert('Informe um valor válido');
      return;
    }
    try {
      setLoading(true);
      const res: any = await api.simularGastos({
        descricao: form.descricao,
        valor_original: val,
        moeda_codigo: form.moeda_codigo,
        cotacao_personalizada: form.cotacao_personalizada ? parseFloat(form.cotacao_personalizada) : undefined,
        forma_pagamento: form.forma_pagamento,
        conta_id: form.forma_pagamento === 'a_vista' ? (form.conta_id || undefined) : undefined,
        cartao_id: form.forma_pagamento === 'cartao_parcelado' ? (form.cartao_id || undefined) : undefined,
        num_parcelas: Number(form.num_parcelas) || 1,
        com_juros: form.forma_pagamento === 'cartao_parcelado' ? form.com_juros : false,
        taxa_juros_mensal: form.com_juros ? parseFloat(form.taxa_juros_mensal) || 0 : undefined,
        tipo_juros: form.tipo_juros,
        data_prevista: form.data_prevista
      });
      const finalResult = res?.data || res;
      setResultado(finalResult);
    } catch (err: any) {
      alert(err.message || 'Erro ao simular gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-emerald-500" />
          Simulador de Gastos & Impacto Futuro
        </h1>
        <p className="text-sm text-slate-400">
          Simule compras à vista ou parceladas com juros e veja o impacto imediato no seu saldo atual e no saldo do mês que vem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulário de Simulação */}
        <div className="lg:col-span-5 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            Parâmetros da Compra
          </h2>

          <form onSubmit={handleSimular} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                O que você planeja comprar? *
              </label>
              <input
                type="text"
                required
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.valor_original}
                  onChange={e => setForm({ ...form, valor_original: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Moeda</label>
                <select
                  value={form.moeda_codigo}
                  onChange={e => setForm({ ...form, moeda_codigo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {form.moeda_codigo !== 'BRL' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Cotação Customizada (opcional)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.cotacao_personalizada}
                  onChange={e => setForm({ ...form, cotacao_personalizada: e.target.value })}
                  placeholder="Vazio = usar PTAX oficial"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}

            <div>
              <DateInput
                label="Data Prevista da Compra"
                value={form.data_prevista}
                onChange={novaData => setForm({ ...form, data_prevista: novaData })}
              />
            </div>

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, forma_pagamento: 'a_vista' })}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.forma_pagamento === 'a_vista'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Wallet className="w-4 h-4" /> À Vista
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, forma_pagamento: 'cartao_parcelado' })}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.forma_pagamento === 'cartao_parcelado'
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Cartão Parcelado
                </button>
              </div>
            </div>

            {form.forma_pagamento === 'a_vista' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Origem do Pagamento
                </label>
                <select
                  value={form.conta_id || 'unificado'}
                  onChange={e => setForm({ ...form, conta_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="unificado">
                    🌐 Saldo Unificado (Todas as Contas — R$ {contas.reduce((acc, c) => acc + Number(c.saldo_atual || 0), 0).toFixed(2)})
                  </option>
                  {contas.map(c => (
                    <option key={c.id} value={c.id}>{c.apelido} (Saldo: R$ {Number(c.saldo_atual || 0).toFixed(2)})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Cartão de Crédito
                  </label>
                  <select
                    value={form.cartao_id}
                    onChange={e => setForm({ ...form, cartao_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {cartoes.map(c => (
                      <option key={c.id} value={c.id}>{c.apelido} (Limite: R$ {Number(c.limite || 0).toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Número de Parcelas
                  </label>
                  <select
                    value={form.num_parcelas}
                    onChange={e => setForm({ ...form, num_parcelas: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map(n => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>
                </div>

                {/* Opção de Juros nas Parcelas */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="chkComJuros" className="text-xs font-semibold text-slate-200 cursor-pointer flex items-center gap-1.5">
                      <Percent size={14} className="text-amber-400" />
                      <span>Simular com Juros no Parcelamento</span>
                    </label>
                    <input
                      type="checkbox"
                      id="chkComJuros"
                      checked={form.com_juros}
                      onChange={e => setForm({ ...form, com_juros: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {form.com_juros && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 animate-fade-in">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Taxa de Juros Mensal (% a.m.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={form.taxa_juros_mensal}
                          onChange={e => setForm({ ...form, taxa_juros_mensal: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Amortização / Cálculo
                        </label>
                        <select
                          value={form.tipo_juros}
                          onChange={e => setForm({ ...form, tipo_juros: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                          <option value="price">Tabela Price (Composto)</option>
                          <option value="simples">Juros Simples</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? 'Calculando projeção...' : 'Simular Impacto'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Painel de Resultados da Simulação */}
        <div className="lg:col-span-7 space-y-4">
          {!resultado ? (
            <div className="bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 h-full flex flex-col items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-slate-700 mb-2" />
              <p className="text-sm font-medium text-slate-300">Preencha os dados e clique em "Simular Impacto".</p>
              <span className="text-xs text-slate-500 mt-1">
                Você poderá ver o impacto detalhado no saldo atual, faturas e a projeção com receitas recorrentes para o mês seguinte.
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Card Resumo do Custo Total */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Custo Total Projetado
                  </span>
                  {resultado.com_juros && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      +{(resultado.percentual_acrescimo_juros || 0).toFixed(1)}% de juros
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-100">
                    <PrivacyValue value={resultado.valor_total_brl} />
                  </span>
                  {resultado.moeda_codigo !== 'BRL' && (
                    <span className="text-sm text-slate-400">
                      ({resultado.moeda_codigo} {resultado.valor_original.toFixed(2)} @ R$ {resultado.cotacao_utilizada.toFixed(4)})
                    </span>
                  )}
                </div>

                {resultado.forma_pagamento === 'cartao_parcelado' && (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="font-semibold text-emerald-400">
                      {resultado.num_parcelas}x de <PrivacyValue value={resultado.valor_parcela_brl} />
                    </div>
                    {resultado.com_juros && resultado.total_juros_brl ? (
                      <div className="text-xs text-slate-400">
                        Total em juros: <span className="text-amber-400 font-semibold"><PrivacyValue value={resultado.total_juros_brl} /></span> (À vista: <PrivacyValue value={resultado.valor_a_vista_brl || 0} />)
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* CARD NOVO: Projeção de Saldo no Mês Que Vem */}
              {resultado.projecao_mes_seguinte && (
                <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-emerald-400" size={18} />
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                      Previsão de Saldo no Mês Que Vem
                    </h3>
                  </div>

                  <p className="text-xs text-slate-400">
                    Projeção considerando saldo em conta, receitas fixas recorrentes e as faturas/despesas previstas.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                      <span className="text-[11px] text-slate-400 block">Saldo Sem Esta Compra</span>
                      <div className="text-base font-bold text-slate-200 mt-0.5">
                        <PrivacyValue value={resultado.projecao_mes_seguinte.saldo_projetado_sem_compra} />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        (+) Recorrências: <PrivacyValue value={resultado.projecao_mes_seguinte.receitas_recorrentes} />
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                      <span className="text-[11px] text-slate-400 block">Impacto no Mês Que Vem</span>
                      <div className="text-base font-bold text-rose-400 mt-0.5">
                        - <PrivacyValue value={resultado.projecao_mes_seguinte.impacto_compra} />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {resultado.forma_pagamento === 'a_vista' ? 'Debitado do saldo' : 'Parcela na fatura'}
                      </span>
                    </div>

                    <div className={`p-3 rounded-xl border ${
                      resultado.projecao_mes_seguinte.saldo_projetado_com_compra < 0
                        ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                        : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    }`}>
                      <span className="text-[11px] block font-semibold">Saldo Final Estimado</span>
                      <div className="text-base font-black mt-0.5">
                        <PrivacyValue value={resultado.projecao_mes_seguinte.saldo_projetado_com_compra} />
                      </div>
                      <span className="text-[10px] opacity-80">No próximo mês</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Impacto no Saldo (À Vista) */}
              {resultado.impacto_a_vista && (
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-3">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Impacto Imediato no Saldo: {resultado.impacto_a_vista.conta_nome}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-xs text-slate-400">Saldo Atual</span>
                      <div className="text-lg font-bold text-slate-100 mt-0.5">
                        <PrivacyValue value={resultado.impacto_a_vista.saldo_atual} />
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl border ${
                      resultado.impacto_a_vista.saldo_apos_compra < 0 
                        ? 'bg-rose-950/40 border-rose-800 text-rose-300' 
                        : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    }`}>
                      <span className="text-xs font-semibold">Saldo Após a Compra</span>
                      <div className="text-lg font-bold mt-0.5">
                        <PrivacyValue value={resultado.impacto_a_vista.saldo_apos_compra} />
                      </div>
                    </div>
                  </div>
                  {resultado.impacto_a_vista.saldo_apos_compra < 0 && (
                    <div className="flex items-center gap-2 text-xs text-rose-400 font-medium pt-1">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Atenção: essa compra deixará a conta no vermelho / cheque especial!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Impacto no Limite e Faturas Futuras (Cartão) */}
              {resultado.impacto_cartao && (
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    Projeção de Faturas: {resultado.impacto_cartao.cartao_nome}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-slate-400">Limite Disponível Atual:</span>
                      <div className="font-bold text-slate-100 mt-0.5 text-sm">
                        <PrivacyValue value={resultado.impacto_cartao.limite_disponivel_atual} />
                      </div>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-slate-400">Limite Restante após Compra:</span>
                      <div className={`font-bold mt-0.5 text-sm ${resultado.impacto_cartao.limite_disponivel_projetado < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        <PrivacyValue value={resultado.impacto_cartao.limite_disponivel_projetado} />
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Evolução das Faturas Mês a Mês */}
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-2">
                      Fatura dos Próximos Meses com a Parcela Adicionada:
                    </span>
                    <div className="space-y-2">
                      {resultado.impacto_cartao.projecoes_faturas.map(proj => (
                        <div key={proj.mes_ano} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-slate-200">{proj.mes_ano}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-400">
                              Atual: <PrivacyValue value={proj.fatura_atual_estimada} />
                            </span>
                            <span className="text-emerald-400 font-medium">
                              + <PrivacyValue value={proj.adicional_simulado} />
                            </span>
                            <span className="font-bold text-slate-100">
                              Total: <PrivacyValue value={proj.fatura_projetada_total} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
