import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  X,
  LayoutDashboard, 
  ArrowLeftRight, 
  CreditCard, 
  RefreshCw, 
  Users, 
  QrCode, 
  TrendingUp, 
  DollarSign, 
  Calculator, 
  ShoppingCart, 
  FileSpreadsheet, 
  Settings, 
  Landmark, 
  Tags,
  Wallet2
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const grupos = [
    {
      titulo: 'Principal',
      itens: [
        { to: '/', label: 'Visão Geral', icon: LayoutDashboard },
        { to: '/lancamentos', label: 'Lançamentos', icon: ArrowLeftRight },
        { to: '/cartoes', label: 'Cartões & Faturas', icon: CreditCard },
        { to: '/recorrencias', label: 'Recorrências', icon: RefreshCw },
      ]
    },
    {
      titulo: 'Social & PIX',
      itens: [
        { to: '/social', label: 'Social & Devedores', icon: Users },
        { to: '/pix', label: 'Cobranças PIX', icon: QrCode },
      ]
    },
    {
      titulo: 'Investimentos & Câmbio',
      itens: [
        { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
        { to: '/cambio', label: 'Câmbio & PTAX', icon: DollarSign },
      ]
    },
    {
      titulo: 'Simuladores & Planejamento',
      itens: [
        { to: '/simulador', label: 'Simulador de Juros', icon: Calculator },
        { to: '/simulador-gastos', label: 'Simulador de Gastos', icon: ShoppingCart },
      ]
    },
    {
      titulo: 'Análises & Gestão',
      itens: [
        { to: '/relatorios', label: 'Relatórios & Dashboards', icon: FileSpreadsheet },
        { to: '/contas', label: 'Contas & Bancos', icon: Landmark },
        { to: '/categorias', label: 'Categorias', icon: Tags },
        { to: '/configuracoes', label: 'Backup & Sistema', icon: Settings },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Gaveta lateral deslizante */}
      <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl overflow-y-auto">
        {/* Topo da Gaveta */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60 sticky top-0 backdrop-blur z-20">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 border border-blue-500/30">
              <Wallet2 size={18} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100 block leading-none">Menu Geral</span>
              <span className="text-[10px] text-slate-400">Todas as Funcionalidades</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Navegação por Grupos */}
        <div className="p-3 space-y-4 pb-20">
          {grupos.map((grupo) => (
            <div key={grupo.titulo} className="space-y-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                {grupo.titulo}
              </span>
              {grupo.itens.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
