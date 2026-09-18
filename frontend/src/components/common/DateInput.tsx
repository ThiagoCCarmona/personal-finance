import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps {
  id?: string;
  name?: string;
  value: string; // formato YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

function isoToBr(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) {
    const [ano, mes, dia] = parts;
    if (ano && mes && dia) {
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    }
  }
  return iso;
}

function brToIso(br: string): string {
  if (!br) return '';
  const parts = br.split('/');
  if (parts.length === 3) {
    const [dia, mes, ano] = parts;
    if (dia.length === 2 && mes.length === 2 && ano.length === 4) {
      const d = parseInt(dia, 10);
      const m = parseInt(mes, 10);
      const y = parseInt(ano, 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        return `${ano}-${mes}-${dia}`;
      }
    }
  }
  return '';
}

export const DateInput: React.FC<DateInputProps> = ({
  id,
  name,
  value,
  onChange,
  label,
  placeholder = 'dd/mm/aaaa',
  error,
  disabled = false,
  required = false,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<string>(isoToBr(value));
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(isoToBr(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value.replace(/\D/g, '');
    if (text.length > 8) text = text.slice(0, 8);

    let formatted = '';
    if (text.length > 0) {
      formatted = text.slice(0, 2);
      if (text.length > 2) {
        formatted += '/' + text.slice(2, 4);
        if (text.length > 4) {
          formatted += '/' + text.slice(4, 8);
        }
      }
    }

    setDisplayValue(formatted);

    if (formatted.length === 10) {
      const iso = brToIso(formatted);
      if (iso) {
        onChange(iso);
      }
    } else if (formatted.length === 0) {
      onChange('');
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIso = e.target.value;
    onChange(newIso);
    setDisplayValue(isoToBr(newIso));
  };

  const openPicker = () => {
    if (disabled) return;
    if (hiddenDateRef.current) {
      try {
        if ('showPicker' in HTMLInputElement.prototype) {
          hiddenDateRef.current.showPicker();
        } else {
          hiddenDateRef.current.focus();
        }
      } catch (err) {
        hiddenDateRef.current.focus();
      }
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={10}
          className={`w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-gray-800 border ${
            error ? 'border-rose-500' : 'border-gray-300 dark:border-gray-700'
          } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
        />

        <input
          ref={hiddenDateRef}
          type="date"
          value={value || ''}
          onChange={handlePickerChange}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only absolute pointer-events-none opacity-0"
        />

        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          title="Abrir calendário"
          className="absolute right-2 p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>
      {error && <span className="text-xs text-rose-500 mt-1">{error}</span>}
    </div>
  );
};
