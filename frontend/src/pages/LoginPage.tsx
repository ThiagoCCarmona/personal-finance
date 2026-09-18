import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, Wallet2, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';

export const LoginPage: React.FC = () => {
  const [loginStr, setLoginStr] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, setupRequired } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (setupRequired) {
      navigate('/setup');
    }
  }, [setupRequired, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      await login(loginStr.trim(), senha);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas ou usuário inativo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 animate-scaleUp">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 mb-2">
            <Wallet2 size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Acesso ao Sistema
          </h1>
          <p className="text-sm text-slate-400">
            Acesso restrito a usuários autorizados
          </p>
        </div>

        {error && (
          <div className="p-3.5 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Usuário (Login)
            </label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={loginStr}
                onChange={(e) => setLoginStr(e.target.value)}
                placeholder="Seu login"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <LogIn size={18} />
            <span>{loading ? 'Entrando...' : 'Entrar no Sistema'}</span>
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          Novos acessos devem ser solicitados diretamente ao administrador do sistema.
        </div>
      </div>
    </div>
  );
};
