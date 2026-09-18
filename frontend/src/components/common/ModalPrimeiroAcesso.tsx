import React, { useState } from 'react';
import { ShieldCheck, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api.js';

interface ModalPrimeiroAcessoProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const ModalPrimeiroAcesso: React.FC<ModalPrimeiroAcessoProps> = ({ isOpen, onSuccess }) => {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!novaSenha || novaSenha.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('A confirmação da senha não confere com a nova senha digitada.');
      return;
    }

    setCarregando(true);
    try {
      await api.trocarSenhaPrimeiroAcesso({ nova_senha: novaSenha });
      onSuccess();
    } catch (err: any) {
      setErro(err?.message || 'Falha ao atualizar a senha. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Primeiro Acesso
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Por segurança, é obrigatório redefinir sua senha inicial.
            </p>
          </div>
        </div>

        {erro && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm flex items-start space-x-2 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Nova Senha (mín. 6 caracteres)
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                required
                minLength={6}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha segura"
                className="w-full pl-10 pr-10 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-white"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {carregando ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Salvar Nova Senha e Acessar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
