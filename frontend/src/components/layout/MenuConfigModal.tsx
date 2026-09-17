import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowUp, 
  ArrowDown, 
  RotateCcw, 
  Check, 
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  getAllNavItemsForConfig, 
  saveNavCustomConfig, 
  resetNavCustomConfig, 
  NavItemConfig,
  DEFAULT_NAV_ITEMS 
} from './navConfig';

interface MenuConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuConfigModal: React.FC<MenuConfigModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<NavItemConfig[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItems(getAllNavItemsForConfig());
    }
  }, [isOpen]);

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

  const handleToggleVisible = (index: number) => {
    const newItems = [...items];
    const current = newItems[index].visible !== false;
    newItems[index] = {
      ...newItems[index],
      visible: !current,
    };
    setItems(newItems);
  };

  const handleChangeLabel = (index: number, newLabel: string) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      customLabel: newLabel,
    };
    setItems(newItems);
  };

  const handleSave = () => {
    saveNavCustomConfig(items);
    onClose();
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar a ordem, nomes e visibilidade originais de todos os itens do menu?')) {
      resetNavCustomConfig();
      setItems(DEFAULT_NAV_ITEMS.map(i => ({ ...i })));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Personalizar Menu</h2>
              <p className="text-xs text-slate-400">Reordene, renomeie e oculte itens conforme sua preferência</p>
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
        <div className="p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isVisible = item.visible !== false;
            const displayName = item.customLabel ?? item.label;

            return (
              <div
                key={item.to}
                className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isVisible 
                    ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600' 
                    : 'bg-slate-950/50 border-slate-800/60 opacity-60'
                }`}
              >
                {/* Info e Edição de Nome */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-mono font-bold text-slate-500 w-5 text-center shrink-0">
                    {index + 1}
                  </span>

                  <div className={`p-2 rounded-lg shrink-0 ${isVisible ? 'bg-slate-700/50 text-blue-400' : 'bg-slate-900 text-slate-500'}`}>
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={displayName}
                        onChange={e => handleChangeLabel(index, e.target.value)}
                        placeholder={item.label}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-lg px-2 py-1 text-xs font-semibold text-slate-100 w-full sm:w-56 focus:outline-none transition"
                      />
                      {item.customLabel && item.customLabel !== item.label && (
                        <button
                          type="button"
                          onClick={() => handleChangeLabel(index, item.label)}
                          className="text-[10px] text-slate-400 hover:text-amber-400 underline shrink-0"
                          title={`Restaurar nome original (${item.label})`}
                        >
                          Original
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {item.categoria}
                      </span>
                      <span>{item.to}</span>
                    </div>
                  </div>
                </div>

                {/* Controles: Visibilidade e Reordenação */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  {/* Toggle Visível */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisible(index)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition border ${
                      isVisible
                        ? 'bg-emerald-600/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/25'
                        : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                    }`}
                    title={isVisible ? 'Clique para ocultar do menu' : 'Clique para exibir no menu'}
                  >
                    {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span className="text-[11px]">{isVisible ? 'Visível' : 'Oculto'}</span>
                  </button>

                  {/* Subir */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition"
                    title="Mover para cima"
                  >
                    <ArrowUp size={15} />
                  </button>

                  {/* Descer */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 disabled:opacity-20 disabled:hover:text-slate-400 disabled:hover:bg-transparent transition"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
          <button
            onClick={handleReset}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <RotateCcw size={14} />
            <span>Restaurar Padrão</span>
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
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

