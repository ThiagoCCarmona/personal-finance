import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.js';
import { Sidebar } from './Sidebar.js';
import { BottomNav } from './BottomNav.js';
import { FloatingActionButton } from '../common/FloatingActionButton.js';
import { LancamentoFormModal } from '../lancamentos/LancamentoFormModal.js';

export const AppLayout: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreated = () => {
    setIsModalOpen(false);
    // Dispara evento customizado para as páginas atualizarem dados
    window.dispatchEvent(new CustomEvent('financeiro:refresh'));
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <FloatingActionButton onClick={() => setIsModalOpen(true)} />
      <LancamentoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreated}
      />
    </div>
  );
};
