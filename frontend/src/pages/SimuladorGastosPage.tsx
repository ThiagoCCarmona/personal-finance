import React, { useState, useEffect } from 'react';
import { ShoppingCart, ArrowRight, CreditCard, Wallet, Calendar, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { Conta, CartaoCredito, ResultadoSimulacaoGasto } from '../types';
import { PrivacyValue } from '../components/common/PrivacyValue';

export const SimuladorGastosPage: React.FC = () => {
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<CartaoCredito[]>([]);
  const [resultado, setResultado] = useState<ResultadoSimulacaoGasto | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    descricao: 'Notebook ou Viagem',
    valor_original: '1200',
    moeda_codigo: 'USD',
    cotacao_personalizada: '',
    forma_pagamento: 'cartao_parcelado' as 'a_vista' | 'cartao_parcelado',
    conta_id: '',
    cartao_id: '',
    num_parcelas: 6,
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
        data_prevista: form.data_prevista
      });
      // Suporta tanto retorno desempacotado quanto { data: ... }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-indigo-500" />
          Simulador de Gastos & Impacto Futuro
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Simule compras em Real ou Moeda Estrangeira (USD/EUR) antes de comprar e visualize o impacto imediato no saldo ou faturas futuras.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulário de Simulação */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            Parâmetros da Compra
          </h2>

          <form onSubmit={handleSimular} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">O que você planeja comprar? *</label>
              <input
                type="text"
                required
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.valor_original}
                  onChange={e => setForm({ ...form, valor_original: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Moeda</label>
                <select
                  value={form.moeda_codigo}
                  onChange={e => setForm({ ...form, moeda_codigo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm font-semibold"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {form.moeda_codigo !== 'BRL' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cotação Customizada (opcional)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={form.cotacao_personalizada}
                  onChange={e => setForm({ ...form, cotacao_personalizada: e.target.value })}
                  placeholder="Deixe em branco para usar PTAX oficial"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
                <span className="text-xs text-gray-400 mt-0.5 block">
                  Se vazio, utiliza a cotação oficial PTAX mais recente do Banco Central.
                </span>
              </div>
            )}

            {/* Forma de Pagamento */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Como vai pagar?</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, forma_pagamento: 'a_vista' })}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                    form.forma_pagamento === 'a_vista'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Wallet className="w-4 h-4" /> À Vista
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, forma_pagamento: 'cartao_parcelado' })}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                    form.forma_pagamento === 'cartao_parcelado'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Parcelado no Cartão
                </button>
              </div>
            </div>

            {form.forma_pagamento === 'a_vista' ? (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Conta Bancária / Origem</label>
                <select
                  value={form.conta_id || 'unificado'}
                  onChange={e => setForm({ ...form, conta_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
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
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cartão de Crédito</label>
                  <select
                    value={form.cartao_id}
                    onChange={e => setForm({ ...form, cartao_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                    {cartoes.map(c => (
                      <option key={c.id} value={c.id}>{c.apelido} (Limite: R$ {Number(c.limite || 0).toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Parcelas</label>
                  <select
                    value={form.num_parcelas}
                    onChange={e => setForm({ ...form, num_parcelas: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map(n => (
                      <option key={n} value={n}>{n}x</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Calculando projeção...' : 'Simular Impacto'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Painel de Resultados da Simulação */}
        <div className="lg:col-span-7 space-y-4">
          {!resultado ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-gray-400 h-full flex flex-col items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm font-medium">Preencha os dados e clique em "Simular Impacto".</p>
              <span className="text-xs text-gray-400">Você poderá ver o comprometimento mês a mês antes de comprar.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Card Resumo do Valor Convertido */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <span className="text-xs font-semibold uppercase text-gray-400">Custo Total Projetado</span>
                <div className="flex flex-wrap items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">
                    <PrivacyValue value={resultado.valor_total_brl} />
                  </span>
                  {resultado.moeda_codigo !== 'BRL' && (
                    <span className="text-sm text-gray-500">
                      ({resultado.moeda_codigo} {resultado.valor_original.toFixed(2)} @ R$ {resultado.cotacao_utilizada.toFixed(4)})
                    </span>
                  )}
                </div>
                {resultado.forma_pagamento === 'cartao_parcelado' && (
                  <div className="mt-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {resultado.num_parcelas} parcelas de <PrivacyValue value={resultado.valor_parcela_brl} />
                  </div>
                )}
              </div>

              {/* Impacto no Saldo (À Vista) */}
              {resultado.impacto_a_vista && (
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Impacto no Saldo de: {resultado.impacto_a_vista.conta_nome}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                      <span className="text-xs text-gray-400">Saldo Atual</span>
                      <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        <PrivacyValue value={resultado.impacto_a_vista.saldo_atual} />
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      resultado.impacto_a_vista.saldo_apos_compra < 0 
                        ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300' 
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    }`}>
                      <span className="text-xs">Saldo Projetado</span>
                      <div className="text-lg font-bold">
                        <PrivacyValue value={resultado.impacto_a_vista.saldo_apos_compra} />
                      </div>
                    </div>
                  </div>
                  {resultado.impacto_a_vista.saldo_apos_compra < 0 && (
                    <div className="flex items-center gap-2 text-xs text-red-600 font-medium pt-1">
                      <AlertTriangle className="w-4 h-4" />
                      Atenção: essa compra deixará a conta no vermelho / cheque especial!
                    </div>
                  )}
                </div>
              )}

              {/* Impacto no Limite e Faturas Futuras (Cartão) */}
              {resultado.impacto_cartao && (
                <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                    Projeção de Faturas: {resultado.impacto_cartao.cartao_nome}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-400">Limite Disponível Atual:</span>
                      <div className="font-bold text-gray-800 dark:text-gray-200">
                        <PrivacyValue value={resultado.impacto_cartao.limite_disponivel_atual} />
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Limite Restante após Compra:</span>
                      <div className={`font-bold ${resultado.impacto_cartao.limite_disponivel_projetado < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        <PrivacyValue value={resultado.impacto_cartao.limite_disponivel_projetado} />
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Evolução das Faturas Mês a Mês */}
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block mb-2">
                      Fatura dos Próximos Meses com a Parcela Adicionada:
                    </span>
                    <div className="space-y-2">
                      {resultado.impacto_cartao.projecoes_faturas.map(proj => (
                        <div key={proj.mes_ano} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-750 rounded-lg text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{proj.mes_ano}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400">
                              Atual: <PrivacyValue value={proj.fatura_atual_estimada} />
                            </span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                              + <PrivacyValue value={proj.adicional_simulado} />
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
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
