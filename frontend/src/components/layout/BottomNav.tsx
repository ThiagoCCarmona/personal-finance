import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, CreditCard, RefreshCw, Landmark } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Início', icon: LayoutDashboard },
    { to: '/lancamentos', label: 'Extrato', icon: ArrowLeftRight },
    { to: '/cartoes', label: 'Cartões', icon: CreditCard },
    { to: '/recorrencias', label: 'Fixas', icon: RefreshCw },
    { to: '/contas', label: 'Contas', icon: Landmark },
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
    </nav>
  );
};
