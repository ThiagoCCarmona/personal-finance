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
import { Methodology503020Section } from '../components/landing/Methodology503020Section.js';
import { PredictabilitySection } from '../components/landing/PredictabilitySection.js';
import { BorderTravelerSection } from '../components/landing/BorderTravelerSection.js';
import { ComparisonTableSection } from '../components/landing/ComparisonTableSection.js';
import { ContinuousEvolutionSection } from '../components/landing/ContinuousEvolutionSection.js';
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
      navigate('/dashboard');
      return;
    }

    try {
      setLoadingDemo(true);
      await login('admin', 'admin123');
      navigate('/dashboard');
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
      {/* HERO SECTION COM THREE.JS INTERATIVO & NOVA PROPOSTA DE VALOR */}
      {/* ========================================================================= */}
      <section className="relative pt-32 pb-20 lg:pt-36 lg:pb-28 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
        
        {/* Three.js 3D Interactive Canvas ao fundo */}
        <Hero3DCanvas />

        {/* Gradientes e Luzes de Fundo */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-tr from-emerald-600/20 via-teal-500/10 to-transparent blur-[140px] pointer-events-none rounded-full" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-7">
          
          {/* Top Pill / Badge de Evolução Contínua */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-950/40 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sistema em Evolução Contínua • Versão 2.4 Ativa • Atualizações Semanais</span>
          </motion.div>

          {/* Main Headline de Impacto */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-5xl mx-auto"
          >
            Tenha clareza total do seu dinheiro:{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              saiba exatamente quanto pode gastar no mês
            </span>{' '}
            sem estourar o orçamento e quanto vai sobrar no mês que vem.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed"
          >
            A metodologia <strong>50-30-20 automatizada</strong> com teto seguro diário, cotação oficial PTAX do Banco Central para compras na fronteira ou viagens, divisão de contas sem atrito e <strong>blindagem anti-fintech (zero anúncios e zero venda de dados)</strong>.
          </motion.p>

          {/* Action CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3"
          >
            <button
              onClick={handleOpenDemo}
              disabled={loadingDemo}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:scale-[1.03] active:scale-[0.98] shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              <Sparkles size={18} className="fill-slate-950" />
              <span>{loadingDemo ? 'Abrindo Demonstração...' : 'Experimentar Demonstração Grátis (Sem Cadastro)'}</span>
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
            className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-slate-400"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Entrada em 1 clique (+R$ 380k simulados)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Metodologia 50-30-20 automatizada</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Cotação PTAX Olinda / BACEN</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Modo Privacidade instantâneo</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* MOCKUP INTERATIVO REAL DO SISTEMA COM MODO PRIVACIDADE */}
      {/* ========================================================================= */}
      <AppMockupPreview onOpenDemo={handleOpenDemo} loadingDemo={loadingDemo} />

      {/* ========================================================================= */}
      {/* METODOLOGIA 50-30-20 AUTOMATIZADA COM TETO DIÁRIO SEGURO */}
      {/* ========================================================================= */}
      <Methodology503020Section />

      {/* ========================================================================= */}
      {/* PREVISIBILIDADE DO PRÓXIMO MÊS & SIMULADOR COM TABELA PRICE */}
      {/* ========================================================================= */}
      <PredictabilitySection />

      {/* ========================================================================= */}
      {/* DIFERENCIAIS DE FRONTEIRA E VIAGENS */}
      {/* ========================================================================= */}
      <BorderTravelerSection />

      {/* ========================================================================= */}
      {/* TABELA COMPARATIVA DIRETA: PLATAFORMA VS EXCEL VS APPS TRADICIONAIS */}
      {/* ========================================================================= */}
      <ComparisonTableSection />

      {/* ========================================================================= */}
      {/* EVOLUÇÃO CONTÍNUA & ROADMAP ATIVO */}
      {/* ========================================================================= */}
      <ContinuousEvolutionSection />

      {/* ========================================================================= */}
      {/* SEGURANÇA E SOBERANIA DOS DADOS */}
      {/* ========================================================================= */}
      <SecuritySection />

      {/* ========================================================================= */}
      {/* PLANOS B2C & SOLUÇÕES B2B (WHITE-LABEL E CORPORATIVO SEM PREÇOS) */}
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
              <div>Gestão Orçamentária 50-30-20, Patrimonial & Multimoedas</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#metodologia" className="hover:text-emerald-400 transition-colors">50-30-20</a>
            <a href="#previsibilidade" className="hover:text-emerald-400 transition-colors">Previsibilidade</a>
            <a href="#comparativo" className="hover:text-emerald-400 transition-colors">Comparativo</a>
            <a href="#fronteira" className="hover:text-emerald-400 transition-colors">Fronteira</a>
            <a href="#evolucao" className="hover:text-emerald-400 transition-colors">Evolução</a>
            <a href="#planos" className="hover:text-emerald-400 transition-colors">Planos</a>
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
