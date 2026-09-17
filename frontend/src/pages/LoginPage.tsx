import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User as UserIcon, Wallet2, Sparkles, UserPlus, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.js';

export const LoginPage: React.FC = () => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [loginStr, setLoginStr] = useState('');
  const [nomeStr, setNomeStr] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, setupRequired } = useAuth();
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
      if (modo === 'login') {
        await login(loginStr.trim(), senha);
      } else {
        await register(loginStr.trim(), senha, nomeStr.trim() || undefined);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreencherDemo = () => {
    setModo('login');
    setLoginStr('admin');
    setSenha('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-6 animate-scaleUp">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-2">
            <Wallet2 size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            {modo === 'login' ? 'Acesso ao Sistema' : 'Criar Nova Conta'}
          </h1>
          <p className="text-sm text-slate-400">
            {modo === 'login'
              ? 'Ambiente multiusuário com isolamento estrito e privacidade'
              : 'Seus dados financeiros exclusivos e 100% isolados'}
          </p>
        </div>

        {/* Abas Alternância Login / Cadastro */}
        <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => { setModo('login'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
              modo === 'login'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn size={15} />
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setModo('cadastro'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all ${
              modo === 'cadastro'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={15} />
            Cadastrar-se
          </button>
        </div>

        {/* Card Destaque: Conta Demo de Alto Patrimônio para Testes */}
        <div className="p-4 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-purple-500/10 border border-amber-500/20 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles size={14} />
              Demonstração do Sistema (Admin)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
              Saldo R$ 380k+
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Conta pré-populada com cartões Black, compras parceladas, carteira de investimentos e simulações completas.
          </p>
          <button
            type="button"
            onClick={handlePreencherDemo}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-xl transition-colors"
          >
            Usar Credenciais Demo (admin / admin123)
            <ArrowRight size={14} />
          </button>
        </div>

        {error && (
          <div className="p-3.5 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === 'cadastro' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Seu Nome Completo
              </label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={nomeStr}
                  onChange={(e) => setNomeStr(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

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
                placeholder="Seu usuário"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 shadow-lg shadow-blue-600/30 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {loading
              ? 'Processando...'
              : modo === 'login'
              ? 'Entrar no Sistema'
              : 'Criar Minha Conta e Acessar'}
          </button>
        </form>
      </div>
    </div>
  );
};
