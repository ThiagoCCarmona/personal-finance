import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Sliders } from 'lucide-react';
import { getOrderedNavItems, groupNavItemsByCategory, NavItemConfig } from './navConfig';
import { MenuConfigModal } from './MenuConfigModal';
import { InstallPwaButton } from '../common/InstallPwaButton';

export const Sidebar: React.FC = () => {
  const [items, setItems] = useState<NavItemConfig[]>(() => getOrderedNavItems());
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setItems(getOrderedNavItems());
    };
    window.addEventListener('finan_nav_order_changed', handleUpdate);
    return () => window.removeEventListener('finan_nav_order_changed', handleUpdate);
  }, []);

  const groups = groupNavItemsByCategory(items);

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-3 h-[calc(100vh-4rem)] sticky top-16">
        <div className="flex items-center justify-between px-3 py-1 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Navegação
          </span>
          <button
            onClick={() => setIsConfigOpen(true)}
            title="Personalizar Ordem e Itens do Menu"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 px-1.5 py-0.5 rounded hover:bg-slate-800 transition"
          >
            <Sliders size={12} />
            <span>Personalizar</span>
          </button>
        </div>

        {/* Lista com Subcategorias */}
        <nav className="overflow-y-auto flex-1 pr-1 custom-scrollbar space-y-4 pb-4">
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
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25 shadow-sm font-semibold'
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
        </nav>

        {/* Rodapé da Sidebar: Instalar App Mobile/Desktop PWA */}
        <div className="pt-2 border-t border-slate-800/80 shrink-0">
          <InstallPwaButton className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition w-full" />
        </div>
      </aside>

      <MenuConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
};

