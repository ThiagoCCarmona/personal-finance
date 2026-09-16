import React, { createContext, useContext, useState, useEffect } from 'react';

interface PrivacyContextType {
  isPrivate: boolean;
  togglePrivacy: () => void;
  formatCurrency: (value: number | string | undefined | null, currencySymbol?: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType>({} as PrivacyContextType);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPrivate, setIsPrivate] = useState<boolean>(() => {
    return localStorage.getItem('financeiro_privacy_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('financeiro_privacy_mode', String(isPrivate));
  }, [isPrivate]);

  const togglePrivacy = () => {
    setIsPrivate(prev => !prev);
  };

  const formatCurrency = (value: number | string | undefined | null, currencySymbol: string = 'R$') => {
    if (isPrivate) {
      return `${currencySymbol} ••••`;
    }

    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return `${currencySymbol} 0,00`;

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencySymbol === 'R$' ? 'BRL' : (currencySymbol === 'US$' ? 'USD' : 'BRL'),
    }).format(num);
  };

  return (
    <PrivacyContext.Provider value={{ isPrivate, togglePrivacy, formatCurrency }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => useContext(PrivacyContext);
