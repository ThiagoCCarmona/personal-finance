import React, { useState, useEffect } from 'react';
import { QrCode, Copy, Check, Plus, Trash2, CheckCircle, Key, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { ChavePix, CobrancaPix, Divida, Conta } from '../types';
import { PrivacyValue } from '../components/common/PrivacyValue';

export const PixPage: React.FC = () => {
  const [, setLoading] = useState(true);
  const [chaves, setChaves] = useState<ChavePix[]>([]);
  const [cobrancas, setCobrancas] = useState<CobrancaPix[]>([]);
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Modais
  const [modalChave, setModalChave] = useState(false);
  const [modalCobranca, setModalCobranca] = useState(false);
  const [cobrancaAtiva, setCobrancaAtiva] = useState<CobrancaPix | null>(null);

  // Form Chave
  const [formChave, setFormChave] = useState({
    tipo: 'cpf' as any,
    valor_chave: '',
    nome_recebedor: '',
    cidade_recebedor: 'SAO PAULO',
    apelido: ''
  });

  // Form Cobrança
  const [formCobranca, setFormCobranca] = useState({
    chave_pix_id: '',
    valor: '',
    mensagem: '',
    divida_id: ''
  });

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [chRes, cobRes, divRes, cRes] = await Promise.all([
        api.getChavesPix().catch(() => []),
        api.getCobrancasPix().catch(() => []),
        api.getDividas('pendente').catch(() => []),
        api.getContas().catch(() => [])
      ]);
      setChaves(Array.isArray(chRes) ? chRes : (chRes as any)?.data || []);
      setCobrancas(Array.isArray(cobRes) ? cobRes : (cobRes as any)?.data || []);
      setDividas(Array.isArray(divRes) ? divRes : (divRes as any)?.data || []);
      setContas(Array.isArray(cRes) ? cRes : (cRes as any)?.data || []);
    } catch (err) {
      console.error('Erro ao carregar PIX:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleCriarChave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createChavePix(formChave);
      setModalChave(false);
      setFormChave({
        tipo: 'cpf',
        valor_chave: '',
        nome_recebedor: '',
        cidade_recebedor: 'SAO PAULO',
        apelido: ''
      });
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar chave');
    }
  };

  const handleCriarCobranca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCobranca.chave_pix_id) {
      alert('Selecione uma chave PIX');
      return;
    }
    try {
      const nova = await api.createCobrancaPix({
        chave_pix_id: formCobranca.chave_pix_id,
        valor: parseFloat(formCobranca.valor) || 0,
        mensagem: formCobranca.mensagem || undefined,
        divida_id: formCobranca.divida_id || undefined
      });
      setModalCobranca(false);
      setCobrancaAtiva(nova);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar cobrança PIX');
    }
  };

  const handleCopiarPayload = (payload: string, id: string) => {
    navigator.clipboard.writeText(payload);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const handleConfirmarRecebimento = async (cobranca: CobrancaPix) => {
    const contaId = contas[0]?.id;
    if (!contaId) {
      alert('Cadastre uma conta antes de confirmar');
      return;
    }
    if (!confirm(`Confirmar recebimento de R$ ${cobranca.valor.toFixed(2)}? Caso esteja vinculada a uma dívida, a mesma será quitada automaticamente.`)) {
      return;
    }
    try {
      await api.confirmarCobrancaPix(cobranca.id, { conta_destino_id: contaId });
      carregarDados();
      if (cobrancaAtiva?.id === cobranca.id) {
        setCobrancaAtiva(null);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar cobrança');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-7 h-7 text-emerald-500" />
            Cobranças & Chaves PIX
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gere códigos PIX Copia e Cola (padrão EMV Bacen) e vincule diretamente a empréstimos e divisões.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setModalChave(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <Key className="w-4 h-4 text-gray-500" />
            Cadastrar Chave PIX
          </button>
          <button
            onClick={() => {
              if (chaves.length === 0) {
                alert('Cadastre pelo menos uma chave PIX antes de gerar cobrança.');
                return;
              }
              setFormCobranca({
                chave_pix_id: chaves[0].id,
                valor: '',
                mensagem: '',
                divida_id: ''
              });
              setModalCobranca(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Gerar Cobrança PIX
          </button>
        </div>
      </div>

      {/* Grid: Minhas Chaves PIX */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
          <Key className="w-4 h-4 text-emerald-500" />
          Minhas Chaves Cadastradas
        </h2>
        {chaves.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-gray-400 text-sm">
            Nenhuma chave PIX cadastrada. Adicione sua chave para gerar cobranças com 1 clique.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chaves.map(ch => (
              <div key={ch.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {ch.tipo.toUpperCase()}
                    </span>
                    <button
                      onClick={async () => {
                        if (confirm('Deseja excluir esta chave?')) {
                          await api.deleteChavePix(ch.id);
                          carregarDados();
                        }
                      }}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 font-mono text-sm font-bold text-gray-900 dark:text-white break-all">
                    {ch.valor_chave}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {ch.nome_recebedor} • {ch.cidade_recebedor}
                  </div>
                </div>
                {ch.apelido && (
                  <span className="text-xs text-indigo-500 font-medium mt-2 block">
                    {ch.apelido}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cobrança Visual Ativa (Modal / Destaque) */}
      {cobrancaAtiva && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 rounded-xl p-5 shadow-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
                <QrCode className="w-4 h-4" /> Cobrança PIX Pronta
              </span>
              <div className="text-2xl font-black text-gray-900 dark:text-white">
                <PrivacyValue value={cobrancaAtiva.valor} />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Recebedor: <strong>{cobrancaAtiva.nome_recebedor}</strong> | TXID: {cobrancaAtiva.txid}
              </p>
              {cobrancaAtiva.mensagem && (
                <p className="text-xs text-gray-500">Mensagem: "{cobrancaAtiva.mensagem}"</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => handleCopiarPayload(cobrancaAtiva.payload_emv, cobrancaAtiva.id)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm"
              >
                {copiadoId === cobrancaAtiva.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiadoId === cobrancaAtiva.id ? 'Código Copiado!' : 'Copiar Código PIX'}
              </button>
              <button
                onClick={() => handleConfirmarRecebimento(cobrancaAtiva)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-sm font-semibold rounded-lg"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como Recebido
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800/40">
            <span className="text-xs text-gray-500 block mb-1">Payload EMV (Copia e Cola):</span>
            <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono break-all select-all text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
              {cobrancaAtiva.payload_emv}
            </div>
          </div>
        </div>
      )}

      {/* Histórico de Cobranças Geradas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Histórico de Cobranças Geradas
          </h2>
          <button onClick={carregarDados} className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase">
              <tr>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Chave / Recebedor</th>
                <th className="px-4 py-3">Vínculo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cobrancas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    Nenhuma cobrança gerada ainda.
                  </td>
                </tr>
              ) : (
                cobrancas.map(cob => (
                  <tr key={cob.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      <PrivacyValue value={cob.valor} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-mono">{cob.valor_chave}</span>
                      <span className="block text-gray-400">{cob.nome_recebedor}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {cob.divida_motivo ? (
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {cob.pessoa_nome}: {cob.divida_motivo}
                        </span>
                      ) : (
                        cob.mensagem || 'Cobrança avulsa'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        cob.status === 'recebida'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {cob.status === 'recebida' ? 'RECEBIDA' : 'AGUARDANDO'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleCopiarPayload(cob.payload_emv, cob.id)}
                        title="Copiar PIX"
                        className="p-1 text-gray-500 hover:text-emerald-600 rounded"
                      >
                        {copiadoId === cob.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                      {cob.status === 'aguardando_confirmacao' && (
                        <button
                          onClick={() => handleConfirmarRecebimento(cob)}
                          title="Confirmar Recebimento"
                          className="p-1 text-gray-500 hover:text-emerald-600 rounded"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (confirm('Deseja excluir esta cobrança do histórico?')) {
                            try {
                              await api.deleteCobrancaPix(cob.id);
                              if (cobrancaAtiva?.id === cob.id) setCobrancaAtiva(null);
                              carregarDados();
                            } catch (err: any) {
                              alert(err.message || 'Erro ao excluir cobrança');
                            }
                          }
                        }}
                        title="Excluir cobrança"
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
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

      {/* MODAL CADASTRAR CHAVE PIX */}
      {modalChave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Cadastrar Chave PIX</h3>
            <form onSubmit={handleCriarChave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Chave *</label>
                <select
                  value={formChave.tipo}
                  onChange={e => setFormChave({ ...formChave, tipo: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave Aleatória (EVP)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chave PIX *</label>
                <input
                  type="text"
                  required
                  value={formChave.valor_chave}
                  onChange={e => setFormChave({ ...formChave, valor_chave: e.target.value })}
                  placeholder="Ex: 12345678900 ou email@pix.com"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo do Titular *</label>
                <input
                  type="text"
                  required
                  value={formChave.nome_recebedor}
                  onChange={e => setFormChave({ ...formChave, nome_recebedor: e.target.value })}
                  placeholder="Ex: SEU NOME COMPLETO"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade do Titular *</label>
                  <input
                    type="text"
                    required
                    value={formChave.cidade_recebedor}
                    onChange={e => setFormChave({ ...formChave, cidade_recebedor: e.target.value })}
                    placeholder="SAO PAULO"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Apelido (opcional)</label>
                  <input
                    type="text"
                    value={formChave.apelido}
                    onChange={e => setFormChave({ ...formChave, apelido: e.target.value })}
                    placeholder="Ex: Nubank"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalChave(false)}
                  className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 text-gray-600 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Salvar Chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GERAR COBRANÇA PIX */}
      {modalCobranca && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Gerar Cobrança PIX</h3>
            <form onSubmit={handleCriarCobranca} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chave Destino *</label>
                <select
                  required
                  value={formCobranca.chave_pix_id}
                  onChange={e => setFormCobranca({ ...formCobranca, chave_pix_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                >
                  {chaves.map(ch => (
                    <option key={ch.id} value={ch.id}>
                      {ch.apelido ? `${ch.apelido} (${ch.valor_chave})` : ch.valor_chave}
                    </option>
                  ))}
                </select>
              </div>
              {dividas.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vincular a Dívida Existente (opcional)</label>
                  <select
                    value={formCobranca.divida_id}
                    onChange={e => {
                      const divId = e.target.value;
                      const d = dividas.find(item => item.id === divId);
                      setFormCobranca({
                        ...formCobranca,
                        divida_id: divId,
                        valor: d ? d.saldo_devedor.toString() : formCobranca.valor,
                        mensagem: d ? `Pagamento: ${d.motivo}` : formCobranca.mensagem
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  >
                    <option value="">Cobrança avulsa (sem vínculo)</option>
                    {dividas.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.pessoa_nome} - {d.motivo} (R$ {d.saldo_devedor.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valor da Cobrança (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formCobranca.valor}
                  onChange={e => setFormCobranca({ ...formCobranca, valor: e.target.value })}
                  placeholder="0,00 (deixe em branco para valor aberto)"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mensagem na Cobrança</label>
                <input
                  type="text"
                  maxLength={140}
                  value={formCobranca.mensagem}
                  onChange={e => setFormCobranca({ ...formCobranca, mensagem: e.target.value })}
                  placeholder="Ex: Cota da pizza"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalCobranca(false)}
                  className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 text-gray-600 dark:text-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  Gerar QR Code & Copia-e-Cola
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
