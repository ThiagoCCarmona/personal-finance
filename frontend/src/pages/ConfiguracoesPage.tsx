import React, { useState, useEffect } from 'react';
import { Settings, Database, Download, ShieldCheck, HardDrive, RefreshCw, Lock } from 'lucide-react';
import { api } from '../services/api';
import { MetricasSistema } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const ConfiguracoesPage: React.FC = () => {
  const { user, updateUserLocal, refreshUser } = useAuth();
  const [metricas, setMetricas] = useState<MetricasSistema | null>(null);
  const [loading, setLoading] = useState(true);

  // Perfil
  const [nomeVisualizacao, setNomeVisualizacao] = useState(user?.nome || '');
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Troca de Senha Opcional
  const [mostrarTrocaSenha, setMostrarTrocaSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [msgSenha, setMsgSenha] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    if (user?.nome) {
      setNomeVisualizacao(user.nome);
    }
  }, [user?.nome]);

  const carregarMetricas = async () => {
    try {
      setLoading(true);
      const res = await api.getMetricasSistema();
      setMetricas(res.data);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarMetricas();
  }, []);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgPerfil(null);
    try {
      setSalvandoPerfil(true);
      await api.atualizarPerfil({ nome: nomeVisualizacao.trim() });
      updateUserLocal({ nome: nomeVisualizacao.trim() });
      await refreshUser();
      setMsgPerfil({ tipo: 'sucesso', texto: 'Nome de visualização atualizado com sucesso!' });
    } catch (err: any) {
      setMsgPerfil({ tipo: 'erro', texto: err.message || 'Erro ao atualizar perfil.' });
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const handleTrocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgSenha(null);
    if (!novaSenha || novaSenha.length < 6) {
      setMsgSenha({ tipo: 'erro', texto: 'A senha deve ter no mínimo 6 caracteres.' });
      return;
    }
    try {
      setSalvandoSenha(true);
      await api.trocarSenhaPrimeiroAcesso({ nova_senha: novaSenha });
      setMsgSenha({ tipo: 'sucesso', texto: 'Senha alterada com sucesso!' });
      setNovaSenha('');
      setMostrarTrocaSenha(false);
    } catch (err: any) {
      setMsgSenha({ tipo: 'erro', texto: err.message || 'Erro ao alterar senha.' });
    } finally {
      setSalvandoSenha(false);
    }
  };

  const handleDownloadBackup = () => {
    window.open(api.baixarBackupSqlUrl(), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-500" />
          Configurações & Perfil
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Personalize seu nome de visualização, gerencie sua segurança e monitore a integridade do banco de dados.
        </p>
      </div>

      {/* Card Meu Perfil & Nome de Visualização */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Meu Perfil
          </h3>
          <p className="text-xs text-gray-500">
            Defina como você deseja ser chamado dentro do sistema e nos relatórios.
          </p>
        </div>

        {msgPerfil && (
          <div className={`p-3 rounded-lg text-xs font-medium ${
            msgPerfil.tipo === 'sucesso' 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {msgPerfil.texto}
          </div>
        )}

        <form onSubmit={handleSalvarPerfil} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Nome de Visualização
            </label>
            <input
              type="text"
              value={nomeVisualizacao}
              onChange={(e) => setNomeVisualizacao(e.target.value)}
              placeholder="Ex: Thiago Carmona"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="w-full sm:w-auto">
            <span className="block text-xs text-gray-400 mb-1">Usuário: @{user?.login}</span>
            <button
              type="submit"
              disabled={salvandoPerfil}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm text-sm disabled:opacity-50 transition-colors"
            >
              {salvandoPerfil ? 'Salvando...' : 'Atualizar Nome'}
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-750 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span className="text-xs text-gray-500">
            Deseja alterar sua senha pessoal de acesso?
          </span>
          <button
            type="button"
            onClick={() => setMostrarTrocaSenha(!mostrarTrocaSenha)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            {mostrarTrocaSenha ? 'Cancelar Troca de Senha' : 'Trocar Minha Senha'}
          </button>
        </div>

        {mostrarTrocaSenha && (
          <form onSubmit={handleTrocarSenha} className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl space-y-3 border border-gray-200 dark:border-gray-700">
            {msgSenha && (
              <div className={`p-2.5 rounded-lg text-xs font-medium ${
                msgSenha.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {msgSenha.texto}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Nova Senha (mín. 6 caracteres)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite a nova senha"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={salvandoSenha}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm text-xs disabled:opacity-50"
            >
              {salvandoSenha ? 'Alterando...' : 'Confirmar Nova Senha'}
            </button>
          </form>
        )}
      </div>

      {/* Card Backup do Banco (Apenas Administrador) */}
      {user?.role === 'admin' ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded">
                  Área do Administrador
                </span>
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                Backup Completo do Banco de Dados (SQL Dump)
              </h3>
              <p className="text-xs text-gray-500 max-w-xl">
                Gere e faça download de uma cópia exata de todos os dados do sistema (usuários, transações, cartões, investimentos e devedores) em formato SQL restaurável.
              </p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm text-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Baixar Backup Agora (.sql)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Backup Global do Sistema (Restrito ao Administrador)
              </h3>
              <p className="text-xs text-gray-500">
                O backup SQL de baixo nível inclui tabelas de todos os usuários e é exclusivo do administrador da instância. Para exportar seus lançamentos pessoais em formato CSV/planilha, utilize a aba de <Link to="/relatorios" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">Relatórios</Link>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Métricas e Estatísticas do Sistema */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gray-500" />
            Integridade e Recursos do Banco de Dados
          </h3>
          <button onClick={carregarMetricas} className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading || !metricas ? (
          <div className="py-6 text-center text-gray-400 text-sm">Carregando métricas...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
              <span className="text-xs text-gray-400">Tamanho no Disco</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{metricas.tamanho_banco}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
              <span className="text-xs text-gray-400">Total de Lançamentos</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{metricas.total_lancamentos}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
              <span className="text-xs text-gray-400">Ativos na Carteira</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{metricas.total_investimentos}</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
              <span className="text-xs text-gray-400">Dívidas Registradas</span>
              <div className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{metricas.total_dividas}</div>
            </div>
          </div>
        )}

        <div className="pt-2 text-xs text-gray-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Ambiente 100% isolado na VPS do usuário. Nenhum dado é transmitido para nuvens públicas ou servidores de telemetria.
        </div>
      </div>
    </div>
  );
};
