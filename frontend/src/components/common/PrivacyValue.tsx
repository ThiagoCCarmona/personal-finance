import React from 'react';
import { usePrivacy } from '../../contexts/PrivacyContext.js';

interface PrivacyValueProps {
  value: number | string | undefined | null;
  currencySymbol?: string;
  className?: string;
  colored?: boolean; // Se true, verde para positivo e vermelho para negativo
  prefix?: string;
  type?: 'despesa' | 'receita';
}

export const PrivacyValue: React.FC<PrivacyValueProps> = ({
  value,
  currencySymbol = 'R$',
  className = '',
  colored = false,
  prefix = '',
  type,
}) => {
  const { formatCurrency, isPrivate } = usePrivacy();

  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  const formatted = formatCurrency(value, currencySymbol);

  let finalPrefix = prefix;
  if (!finalPrefix && colored && type) {
    finalPrefix = type === 'despesa' ? '- ' : '+ ';
  }

  let colorClass = '';
  if (colored && !isPrivate) {
    if (type === 'despesa' || finalPrefix.trim().startsWith('-')) {
      colorClass = 'text-rose-400 font-semibold';
    } else if (type === 'receita' || finalPrefix.trim().startsWith('+')) {
      colorClass = 'text-emerald-400 font-semibold';
    } else if (num > 0) {
      colorClass = 'text-emerald-400';
    } else if (num < 0) {
      colorClass = 'text-rose-400';
    } else {
      colorClass = 'text-slate-400';
    }
  }

  return (
    <span className={`${colorClass} ${className} font-medium tracking-tight inline-block`}>
      {finalPrefix}{formatted}
    </span>
  );
};
