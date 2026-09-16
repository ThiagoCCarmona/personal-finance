import React, { useState, useEffect } from 'react';
import { Settings, Database, Download, ShieldCheck, HardDrive, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { MetricasSistema } from '../types';

export const ConfiguracoesPage: React.FC = () => {
  const [metricas, setMetricas] = useState<MetricasSistema | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleDownloadBackup = () => {
    window.open(api.baixarBackupSqlUrl(), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-500" />
          Configurações & Backup
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gerenciamento de cópias de segurança (Backup) e integridade do banco de dados na sua VPS.
        </p>
      </div>

      {/* Card Backup do Banco */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              Backup Completo do Banco de Dados (SQL Dump)
            </h3>
            <p className="text-xs text-gray-500 max-w-xl">
              Gere e faça download de uma cópia exata de todos os seus dados (usuários, transações, cartões, investimentos e devedores) em formato SQL restaurável.
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
