import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { X, Wallet2, Sliders } from 'lucide-react';
import { getOrderedNavItems, groupNavItemsByCategory, NavItemConfig } from './navConfig';
import { MenuConfigModal } from './MenuConfigModal';
import { InstallPwaButton } from '../common/InstallPwaButton';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<NavItemConfig[]>(() => getOrderedNavItems());
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setItems(getOrderedNavItems());
    };
    window.addEventListener('finan_nav_order_changed', handleUpdate);
    return () => window.removeEventListener('finan_nav_order_changed', handleUpdate);
  }, []);

  if (!isOpen) return null;

  const groups = groupNavItemsByCategory(items);

  return (
    <>
      <div className="fixed inset-0 z-50 md:hidden flex">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Gaveta lateral deslizante */}
        <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl">
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsConfigOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                title="Personalizar Menu"
              >
                <Sliders size={18} />
              </button>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lista com Subcategorias */}
          <div className="p-3 space-y-4 overflow-y-auto flex-1 custom-scrollbar pb-6">
            {Object.entries(groups).map(([categoria, catItems]) => (
              <div key={categoria} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500/90 select-none">
                  {categoria}
                </div>
                <div className="space-y-0.5">
                  {catItems.map((item) => {
                    const Icon = item.icon;
                    const displayName = item.customLabel || item.label;

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold shadow-sm'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }`
                        }
                      >
                        <Icon size={16} className="shrink-0" />
                        <span className="truncate">{displayName}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé da Gaveta: Botão PWA de Instalação */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60 shrink-0">
            <InstallPwaButton className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/25 text-xs font-semibold transition w-full" />
          </div>
        </div>
      </div>

      <MenuConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
};

