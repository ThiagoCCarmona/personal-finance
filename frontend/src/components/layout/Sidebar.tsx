import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Sliders } from 'lucide-react';
import { getOrderedNavItems, NavItemConfig } from './navConfig';
import { MenuConfigModal } from './MenuConfigModal';

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

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-2 h-[calc(100vh-4rem)] sticky top-16">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Menu Principal
          </span>
          <button
            onClick={() => setIsConfigOpen(true)}
            title="Personalizar Ordem do Menu"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 p-1 rounded hover:bg-slate-800 transition"
          >
            <Sliders size={13} />
            <span>Organizar</span>
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon size={19} />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <MenuConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
};
