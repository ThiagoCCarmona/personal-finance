import React, { useState } from 'react';
import { FileSpreadsheet, Download, Printer } from 'lucide-react';
import { api } from '../services/api';

export const RelatoriosPage: React.FC = () => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const handleDownloadLancamentos = () => {
    const url = api.getUrlCsvLancamentos(dataInicio || undefined, dataFim || undefined);
    window.open(url, '_blank');
  };

  const handleDownloadPatrimonio = () => {
    const url = api.getUrlCsvPatrimonio();
    window.open(url, '_blank');
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-emerald-500" />
            Relatórios & Exportação
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Exporte seus dados financeiros em formato CSV compatível com Excel e Google Sheets, ou imprima em PDF.
          </p>
        </div>
        <button
          onClick={handleImprimir}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Salvar PDF
        </button>
      </div>

      {/* Grid de Opções de Exportação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Extrato de Lançamentos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Extrato de Lançamentos (CSV)</h3>
                <span className="text-xs text-gray-400">Receitas, despesas, transferências e faturas</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Arquivo formatado com separador ponto-e-vírgula e acentuação UTF-8 perfeita para abertura imediata no Microsoft Excel brasileiro.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">A partir de:</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs text-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Até:</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="w-full px-2.5 py-1.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-xs text-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleDownloadLancamentos}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm text-sm"
          >
            <Download className="w-4 h-4" />
            Baixar CSV de Lançamentos
          </button>
        </div>

        {/* Card Balanço Patrimonial */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Balanço Patrimonial Consolidado (CSV)</h3>
                <span className="text-xs text-gray-400">Contas, investimentos e contas a receber</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Visão estática de todas as contas bancárias ativas, carteira de investimentos com preço médio e saldo devedor social aberto.
            </p>
          </div>

          <button
            onClick={handleDownloadPatrimonio}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm text-sm"
          >
            <Download className="w-4 h-4" />
            Baixar CSV do Patrimônio
          </button>
        </div>
      </div>
    </div>
  );
};
