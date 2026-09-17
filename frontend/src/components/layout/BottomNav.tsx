import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, CreditCard, RefreshCw, Menu } from 'lucide-react';

interface BottomNavProps {
  onOpenMenu?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMenu }) => {
  const navItems = [
    { to: '/', label: 'Início', icon: LayoutDashboard },
    { to: '/lancamentos', label: 'Extrato', icon: ArrowLeftRight },
    { to: '/cartoes', label: 'Cartões', icon: CreditCard },
    { to: '/recorrencias', label: 'Fixas', icon: RefreshCw },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around h-16 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full py-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Icon size={18} className="mb-0.5" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}

      {/* Botão de Menu para abrir todas as 14 funcionalidades */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center w-full py-1 text-[10px] font-medium text-slate-400 hover:text-blue-400 transition-colors"
        aria-label="Abrir todas as opções"
      >
        <Menu size={18} className="mb-0.5 text-blue-400" />
        <span className="text-slate-300 font-semibold">Menu</span>
      </button>
    </nav>
  );
};
