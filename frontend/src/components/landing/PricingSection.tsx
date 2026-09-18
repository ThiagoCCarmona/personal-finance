import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  MessageCircle, 
  ArrowRight, 
  Zap, 
  Flame,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PricingSection: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'],
    });
  };

  const handleCycleChange = (cycle: 'monthly' | 'yearly') => {
    setBillingCycle(cycle);
    if (cycle === 'yearly') {
      triggerConfetti();
    }
  };

  const getWhatsAppLink = (planName: string, priceStr: string) => {
    const text = `Olá! Gostaria de contratar o *${planName}* (${priceStr}) do FinanSmart Pro. Como faço para ativar meu acesso?`;
    return `https://wa.me/5545991325244?text=${encodeURIComponent(text)}`;
  };

  return (
    <section id="planos" className="py-24 bg-slate-950 border-t border-slate-800 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Zap size={14} />
            <span>Investimento Inteligente</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Planos Transparentes, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Sem Pegadinhas</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base">
            Economize muito mais do que a assinatura apenas evitando taxas de câmbio abusivas e faturas descontroladas.
          </p>

          {/* Billing Toggle */}
          <div className="pt-4 flex items-center justify-center">
            <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1 shadow-inner">
              <button
                onClick={() => handleCycleChange('monthly')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mensal
              </button>

              <button
                onClick={() => handleCycleChange('yearly')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  billingCycle === 'yearly'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Anual</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase">
                  2 Meses Grátis
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* PLAN 1: MENSAL */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Plano Mensal Flexível
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">Mensalidade Padrão</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Ideal para quem deseja testar mês a mês sem nenhum compromisso de fidelidade.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">R$ 24,90</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Cancele quando quiser</span>
              </div>

              {/* Feature List */}
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Acesso completo a todas as funções</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Cotações PTAX diárias oficiais do BACEN</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Módulo Social & Cobrança PIX BR Code</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Instalação PWA no celular e desktop</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Suporte direto via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href={getWhatsAppLink('Plano Mensal', 'R$ 24,90/mês')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs text-center text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center space-x-2"
              >
                <MessageCircle size={16} />
                <span>Assinar via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* PLAN 2: ANUAL (DESTAQUE) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 flex flex-col justify-between relative scale-[1.02] lg:-translate-y-2">
            
            {/* Badge Popular */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
              <Flame size={14} className="fill-slate-950" />
              <span>Mais Escolhido</span>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Plano Anual Promocional
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">Anual com Desconto</h3>
                <p className="text-xs text-slate-400 mt-2">
                  A escolha da maioria dos moradores da fronteira e investidores conscientes.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-5xl font-extrabold text-emerald-400">R$ 19,90</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[11px] text-emerald-300/80 mt-1 block">
                  Faturado R$ 238,80/ano (Economia de R$ 60,00)
                </span>
              </div>

              {/* Feature List */}
              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Tudo incluso no plano mensal</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>2 Meses Inteiramente Grátis</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Atendimento VIP e suporte prioritário</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Acesso antecipado a novos módulos</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Consultoria inicial de setup das contas</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href={getWhatsAppLink('Plano Anual Promocional', 'R$ 19,90/mês - R$ 238,80/ano')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={triggerConfetti}
                className="w-full py-4 px-4 rounded-xl font-bold text-xs sm:text-sm text-center text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles size={16} />
                <span>Garantir Plano Anual com Desconto</span>
              </a>
            </div>
          </div>

          {/* PLAN 3: VITALÍCIO / FRONTEIRA PRO */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Crown size={14} /> Licença Vitalícia
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">Fronteira Pro Lifetime</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Pague uma única vez e tenha acesso perpétuo para sempre sem mensalidades.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">R$ 297,00</span>
                  <span className="text-xs text-slate-400">/único</span>
                </div>
                <span className="text-[11px] text-indigo-300/80 mt-1 block">
                  Sem mensalidades ou renovações futuras
                </span>
              </div>

              {/* Feature List */}
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Acesso vitalício sem cobranças recorrentes</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Todas as atualizações do sistema incluídas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Soberania total sobre seus dados</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Canal direto com o desenvolvedor</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href={getWhatsAppLink('Licença Vitalícia Fronteira Pro', 'R$ 297,00 pagamento único')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs text-center text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center space-x-2"
              >
                <MessageCircle size={16} />
                <span>Garantir Licença Vitalícia</span>
              </a>
            </div>
          </div>

        </div>

        {/* B2B / White-label Box */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 text-center max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left space-y-1">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Para Consultores & Educadores Financeiros
            </span>
            <h4 className="text-base sm:text-lg font-bold text-white">
              Quer disponibilizar o sistema com a sua marca para seus clientes ou alunos?
            </h4>
            <p className="text-xs text-slate-400">
              Oferecemos planos de licenciamento White-label ou instalação em servidor próprio.
            </p>
          </div>

          <a
            href="https://wa.me/5545991325244?text=Ol%C3%A1!%20Sou%20consultor/educador%20financeiro%20e%20gostaria%20de%20conversar%20sobre%20o%20plano%20White-label."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center space-x-2 shrink-0"
          >
            <span>Falar com o Fundador</span>
            <ArrowRight size={14} />
          </a>
        </div>

      </div>
    </section>
  );
};
