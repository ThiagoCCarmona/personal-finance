import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  CreditCard, 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  Calculator, 
  Landmark, 
  Tags,
  Users,
  QrCode,
  ShoppingCart,
  FileSpreadsheet,
  Settings
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Visão Geral', icon: LayoutDashboard },
    { to: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
    { to: '/cartoes', label: 'Cartões & Faturas', icon: CreditCard },
    { to: '/recorrencias', label: 'Recorrências', icon: RefreshCw },
    { to: '/social', label: 'Social & Devedores', icon: Users },
    { to: '/pix', label: 'Cobranças PIX', icon: QrCode },
    { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
    { to: '/cambio', label: 'Câmbio & PTAX', icon: DollarSign },
    { to: '/simulador', label: 'Simulador Juros', icon: Calculator },
    { to: '/simulador-gastos', label: 'Simulador de Gastos', icon: ShoppingCart },
    { to: '/relatorios', label: 'Relatórios & CSV', icon: FileSpreadsheet },
    { to: '/configuracoes', label: 'Backup & Sistema', icon: Settings },
    { to: '/contas', label: 'Contas & Bancos', icon: Landmark },
    { to: '/categorias', label: 'Categorias', icon: Tags },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-1">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Menu Principal
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
