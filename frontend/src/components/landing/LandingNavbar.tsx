import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet2, 
  Sparkles, 
  MessageCircle, 
  LogIn, 
  Menu, 
  X, 
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LandingNavbarProps {
  onOpenDemo: () => void;
  loadingDemo?: boolean;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onOpenDemo, loadingDemo }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const whatsappUrl = "https://wa.me/5545991325244?text=Ol%C3%A1!%20Vim%20pela%20Landing%20Page%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20Sistema%20Financeiro%20Pessoal.";

  const navLinks = [
    { label: 'Diferenciais', href: '#diferenciais' },
    { label: 'Fronteira & Câmbio', href: '#fronteira' },
    { label: 'Telas do Sistema', href: '#mockup' },
    { label: 'Planos SaaS', href: '#planos' },
    { label: 'Segurança', href: '#seguranca' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
              <Wallet2 size={22} className="group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              FinanSmart <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Pro</span>
            </span>
            <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
              Multimoedas & Fronteira
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3 py-1.5 text-xs lg:text-sm font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-900/60 rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center space-x-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-xl transition-all shadow-sm"
          >
            <MessageCircle size={15} className="text-emerald-400" />
            <span>(45) 99132-5244</span>
          </a>

          <Link
            to="/login"
            className="flex items-center space-x-1 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors"
          >
            <LogIn size={15} />
            <span>Acessar</span>
          </Link>

          <button
            onClick={onOpenDemo}
            disabled={loadingDemo}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Sparkles size={15} />
            <span>{loadingDemo ? 'Iniciando...' : 'Acessar Demo'}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 lg:hidden">
          <button
            onClick={onOpenDemo}
            disabled={loadingDemo}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
          >
            Demo
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
            aria-label="Abrir Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3"
          >
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-emerald-400 hover:bg-slate-900 rounded-lg"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-2.5 text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-xl"
              >
                <MessageCircle size={16} />
                <span>WhatsApp: (45) 99132-5244</span>
              </a>

              <Link
                to="/login"
                className="w-full flex items-center justify-center space-x-2 py-2.5 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-xl"
              >
                <LogIn size={16} />
                <span>Entrar na Minha Conta</span>
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDemo();
                }}
                disabled={loadingDemo}
                className="w-full flex items-center justify-center space-x-2 py-3 text-xs font-semibold text-white bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/30"
              >
                <Sparkles size={16} />
                <span>{loadingDemo ? 'Carregando Demonstração...' : 'Testar Demonstração Grátis'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
