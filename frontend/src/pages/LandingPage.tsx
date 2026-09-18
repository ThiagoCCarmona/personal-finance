import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  MessageCircle, 
  Wallet2
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext.js';
import { LandingNavbar } from '../components/landing/LandingNavbar.js';
import { Hero3DCanvas } from '../components/landing/Hero3DCanvas.js';
import { AppMockupPreview } from '../components/landing/AppMockupPreview.js';
import { BorderTravelerSection } from '../components/landing/BorderTravelerSection.js';
import { SecuritySection } from '../components/landing/SecuritySection.js';
import { PricingSection } from '../components/landing/PricingSection.js';
import { FaqSection } from '../components/landing/FaqSection.js';
import { FloatingWhatsApp } from '../components/landing/FloatingWhatsApp.js';

export const LandingPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleOpenDemo = async () => {
    if (user) {
      navigate('/');
      return;
    }

    try {
      setLoadingDemo(true);
      await login('admin', 'admin123');
      navigate('/');
    } catch (err) {
      console.warn('Login direto na demo indisponível, redirecionando para a página de login:', err);
      navigate('/login?demo=true');
    } finally {
      setLoadingDemo(false);
    }
  };

  const whatsappHeroUrl = "https://wa.me/5545991325244?text=Ol%C3%A1!%20Estou%20vendo%20a%20Landing%20Page%20do%20FinanSmart%20Pro%20e%20gostaria%20de%20tirar%20algumas%20d%C3%BAvidas.";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Navbar Fixa */}
      <LandingNavbar onOpenDemo={handleOpenDemo} loadingDemo={loadingDemo} />

      {/* ========================================================================= */}
      {/* HERO SECTION COM THREE.JS INTERATIVO */}
      {/* ========================================================================= */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        
        {/* Three.js 3D Interactive Canvas ao fundo */}
        <Hero3DCanvas />

        {/* Gradientes e Luzes de Fundo */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
          
          {/* Top Pill / Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-950/40 backdrop-blur-md"
          >
            <Sparkles size={16} className="text-emerald-400 animate-pulse" />
            <span>Multimoedas • Tríplice Fronteira • Câmbio PTAX Oficial BACEN</span>
          </motion.div>

          {/* Main Hero Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto"
          >
            O Sistema Financeiro Definitivo para quem vive na{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Fronteira & Viagens
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed"
          >
            Diga adeus ao caos entre <strong>Real, Dólar e Peso Argentino</strong>. Acompanhe a cotação oficial do Banco Central, divida contas de jantares e passeios em 1 toque, liquide empréstimos via <strong>PIX BR Code</strong> e blinde seus dados com isolamento patrimonial estrito.
          </motion.p>

          {/* Action CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <button
              onClick={handleOpenDemo}
              disabled={loadingDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:scale-[1.03] active:scale-[0.98] shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              <Sparkles size={18} className="fill-slate-950" />
              <span>{loadingDemo ? 'Carregando Demonstração...' : 'Testar Demonstração ao Vivo'}</span>
              <ArrowRight size={18} />
            </button>

            <a
              href={whatsappHeroUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl font-semibold text-sm sm:text-base text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 shadow-lg transition-all flex items-center justify-center space-x-2.5 backdrop-blur-md"
            >
              <MessageCircle size={18} className="text-emerald-400" />
              <span>Falar no WhatsApp (45) 99132-5244</span>
            </a>
          </motion.div>

          {/* Value Proof Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Demo com <strong>+R$ 380.000</strong> simulados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Cotação PTAX Olinda / BACEN</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>PWA no celular sem lojas de app</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Modo Privacidade 1 clique</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* MOCKUP INTERATIVO REAL DO SISTEMA COM MODO PRIVACIDADE */}
      {/* ========================================================================= */}
      <AppMockupPreview onOpenDemo={handleOpenDemo} loadingDemo={loadingDemo} />

      {/* ========================================================================= */}
      {/* DIFERENCIAIS DE FRONTEIRA E VIAGENS */}
      {/* ========================================================================= */}
      <BorderTravelerSection />

      {/* ========================================================================= */}
      {/* SEGURANÇA E SOBERANIA DOS DADOS */}
      {/* ========================================================================= */}
      <SecuritySection />

      {/* ========================================================================= */}
      {/* PLANOS SAAS RECORRENTE & VITALÍCIO */}
      {/* ========================================================================= */}
      <PricingSection />

      {/* ========================================================================= */}
      {/* PERGUNTAS FREQUENTES (FAQ) */}
      {/* ========================================================================= */}
      <FaqSection />

      {/* ========================================================================= */}
      {/* FOOTER */}
      {/* ========================================================================= */}
      <footer className="py-12 bg-slate-950 border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet2 size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-300">FinanSmart Pro</div>
              <div>Gestão Financeira Pessoal, Patrimonial & Multimoedas</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#diferenciais" className="hover:text-emerald-400 transition-colors">Diferenciais</a>
            <a href="#fronteira" className="hover:text-emerald-400 transition-colors">Fronteira</a>
            <a href="#planos" className="hover:text-emerald-400 transition-colors">Planos SaaS</a>
            <a href="#seguranca" className="hover:text-emerald-400 transition-colors">Segurança</a>
            <Link to="/login" className="hover:text-emerald-400 transition-colors font-semibold">Área do Cliente</Link>
          </div>

          <div className="text-center sm:text-right">
            <div>Atendimento Direto: <strong className="text-slate-300">(45) 99132-5244</strong></div>
            <div className="mt-0.5">Tríplice Fronteira • Foz do Iguaçu - PR</div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* WHATSAPP FLUTUANTE PERSISTENTE */}
      {/* ========================================================================= */}
      <FloatingWhatsApp />

    </div>
  );
};
