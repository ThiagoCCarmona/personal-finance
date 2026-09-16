import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FABProps> = ({ onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed z-40 bottom-20 sm:bottom-8 right-6 p-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-blue-600/30"
      aria-label="Novo Lançamento Rápido"
      title="Novo Lançamento Rápido (+)"
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  );
};
