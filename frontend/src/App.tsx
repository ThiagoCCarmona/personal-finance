import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { PrivacyProvider } from './contexts/PrivacyContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { SetupPage } from './pages/SetupPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { LancamentosPage } from './pages/LancamentosPage.js';
import { ContasPage } from './pages/ContasPage.js';
import { CategoriasPage } from './pages/CategoriasPage.js';
import { CartoesPage } from './pages/CartoesPage.js';
import { RecorrenciasPage } from './pages/RecorrenciasPage.js';
import { InvestimentosPage } from './pages/InvestimentosPage.js';
import { CambioPage } from './pages/CambioPage.js';
import { SimuladorPage } from './pages/SimuladorPage.js';
import { SocialPage } from './pages/SocialPage.js';
import { PixPage } from './pages/PixPage.js';
import { SimuladorGastosPage } from './pages/SimuladorGastosPage.js';
import { RelatoriosPage } from './pages/RelatoriosPage.js';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, setupRequired } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Carregando sistema...</span>
        </div>
      </div>
    );
  }

  if (setupRequired) {
    return <Navigate to="/setup" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrivacyProvider>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Rotas Autenticadas */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="lancamentos" element={<LancamentosPage />} />
              <Route path="cartoes" element={<CartoesPage />} />
              <Route path="recorrencias" element={<RecorrenciasPage />} />
              <Route path="social" element={<SocialPage />} />
              <Route path="pix" element={<PixPage />} />
              <Route path="investimentos" element={<InvestimentosPage />} />
              <Route path="cambio" element={<CambioPage />} />
              <Route path="simulador" element={<SimuladorPage />} />
              <Route path="simulador-gastos" element={<SimuladorGastosPage />} />
              <Route path="relatorios" element={<RelatoriosPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
              <Route path="contas" element={<ContasPage />} />
              <Route path="categorias" element={<CategoriasPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PrivacyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
