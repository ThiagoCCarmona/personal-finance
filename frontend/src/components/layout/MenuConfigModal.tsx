import React, { useState } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  Sliders
} from 'lucide-react';
import { 
  getOrderedNavItems, 
  saveCustomNavOrder, 
  resetCustomNavOrder, 
  NavItemConfig,
  DEFAULT_NAV_ITEMS 
} from './navConfig';

interface MenuConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuConfigModal: React.FC<MenuConfigModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<NavItemConfig[]>(() => getOrderedNavItems());

  if (!isOpen) return null;

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setItems(newItems);
  };

  const handleSave = () => {
    const order = items.map(i => i.to);
    saveCustomNavOrder(order);
    onClose();
  };

  const handleReset = () => {
    resetCustomNavOrder();
    setItems(DEFAULT_NAV_ITEMS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Organizar Menu</h2>
              <p className="text-xs text-slate-400">Reordene as abas da barra lateral e gaveta mobile ao seu gosto</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* List of nav items */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.to}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-500 w-5 text-center">
                    {index + 1}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-700/50 text-blue-400">
                    <Icon size={16} />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-200 block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {item.categoria} • {item.to}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition"
                    title="Mover para cima"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/40">
          <button
            onClick={handleReset}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <RotateCcw size={14} />
            Restaurar Padrão
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/20"
            >
              <Check size={15} />
              Salvar Ordem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
