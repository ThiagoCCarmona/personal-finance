import React from 'react';
import { Eye, EyeOff, LogOut, Wallet2, Menu } from 'lucide-react';
import { usePrivacy } from '../../contexts/PrivacyContext.js';
import { useAuth } from '../../contexts/AuthContext.js';

interface HeaderProps {
  onOpenMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMenu }) => {
  const { isPrivate, togglePrivacy } = usePrivacy();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="flex items-center gap-3">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Abrir menu de navegação"
          >
            <Menu size={22} />
          </button>
        )}
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/20 text-blue-500 border border-blue-500/30">
          <Wallet2 size={22} />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-100 tracking-tight leading-none">
            Financeiro
          </h1>
          <span className="text-xs text-slate-400 font-medium">Self-Hosted</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Toggle Modo Privacidade */}
        <button
          type="button"
          onClick={togglePrivacy}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
            isPrivate
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-700'
          }`}
          title={isPrivate ? 'Desativar Modo Privacidade' : 'Ativar Modo Privacidade (ocultar valores)'}
          aria-label="Alternar Modo Privacidade"
        >
          {isPrivate ? <EyeOff size={18} /> : <Eye size={18} />}
          <span className="hidden sm:inline text-xs">
            {isPrivate ? 'Privacidade Ativa' : 'Privacidade'}
          </span>
        </button>

        {/* Informações do Usuário e Logout */}
        {user && (
          <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-800">
            <div className="hidden md:flex flex-col items-end">
              <div className="flex items-center gap-1.5">
                <strong className="text-xs text-slate-200">{user.nome || user.login}</strong>
                {user.role === 'admin' ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Admin
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                    Usuário
                  </span>
                )}
              </div>
              {user.nome && <span className="text-[10px] text-slate-500">@{user.login}</span>}
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition-colors"
              title="Encerrar Sessão"
              aria-label="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
