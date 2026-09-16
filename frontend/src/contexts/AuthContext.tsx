import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { User } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setupRequired: boolean;
  login: (login: string, pass: string) => Promise<void>;
  setup: (login: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await api.getStatus();
      setSetupRequired(res.setupRequired);
      setUser(res.user || null);
    } catch (err) {
      console.error('Falha ao verificar status de autenticação:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (loginStr: string, passStr: string) => {
    const res = await api.login({ login: loginStr, senha: passStr });
    setUser(res.user);
    setSetupRequired(false);
  };

  const setup = async (loginStr: string, passStr: string) => {
    const res = await api.setup({ login: loginStr, senha: passStr });
    setUser(res.user);
    setSetupRequired(false);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Erro no logout:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setupRequired, login, setup, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
