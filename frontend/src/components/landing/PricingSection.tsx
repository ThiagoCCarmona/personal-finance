import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  MessageCircle, 
  Zap, 
  Flame,
  Crown,
  Briefcase,
  Building2,
  AlertCircle
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

  const getWhatsAppLink = (planName: string, detail: string = '') => {
    const text = `Olá! Gostaria de conversar sobre o *${planName}* ${detail ? `(${detail})` : ''} do FinanSmart Pro. Como podemos prosseguir?`;
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
            <span>Planos & Investimento</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Escolha o Plano Ideal para a sua <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Liberdade Financeira</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base">
            Tenha clareza orçamentária imediata por um valor menor do que um lanche por mês. Sem pegadinhas e sem venda de dados.
          </p>

          {/* Billing Toggle (Mensal / Anual) */}
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
                  33% OFF
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* B2C Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mb-20">
          
          {/* PLANO 1: MENSAL */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Entrada Sem Fidelidade
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">Plano Mensal</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Custa menos que um lanche por mês. Ideal para quem quer começar a organizar a vida financeira agora.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">R$ 29,90</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Sem carência ou multas de cancelamento</span>
              </div>

              {/* Feature List */}
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Metodologia 50-30-20 automatizada</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Cálculo do Saldo Projetado no próximo mês</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Cotações PTAX oficiais do BACEN em tempo real</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Módulo Social & Cobrança PIX BR Code</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>PWA instalável no celular e desktop</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href={getWhatsAppLink('Plano Mensal', 'R$ 29,90/mês')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs text-center text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center space-x-2"
              >
                <MessageCircle size={16} />
                <span>Assinar via WhatsApp</span>
              </a>
            </div>
          </div>

          {/* PLANO 2: ANUAL (MAIS VENDIDO) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 flex flex-col justify-between relative scale-[1.02] lg:-translate-y-2">
            
            {/* Badge Popular */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5">
              <Flame size={14} className="fill-slate-950" />
              <span>Mais Vendido</span>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Maior Economia Anual
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">Plano Anual</h3>
                <p className="text-xs text-slate-400 mt-2">
                  A escolha inteligente para garantir previsibilidade e economizar 33% no ano todo.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-5xl font-extrabold text-emerald-400">R$ 19,90</span>
                  <span className="text-xs text-slate-400">/mês</span>
                </div>
                <span className="text-[11px] text-emerald-300/80 mt-1 block">
                  Faturado R$ 238,80/ano (Economia de R$ 120,00 no ano)
                </span>
              </div>

              {/* Feature List */}
              <ul className="space-y-3 text-xs text-slate-200">
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Todos os recursos do plano mensal</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Economia de 33% comparado ao plano mensal</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Suporte VIP e atendimento direto no WhatsApp</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Acesso antecipado a novos módulos e updates</span>
                </li>
                <li className="flex items-center gap-2.5 font-medium">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Garantia incondicional de satisfação de 7 dias</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href={getWhatsAppLink('Plano Anual Mais Vendido', 'R$ 238,80/ano')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={triggerConfetti}
                className="w-full py-4 px-4 rounded-xl font-bold text-xs sm:text-sm text-center text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles size={16} />
                <span>Garantir Plano Anual com 33% OFF</span>
              </a>
            </div>
          </div>

          {/* PLANO 3: OFERTA FUNDADOR (VITALÍCIO COM ESCASSEZ LIMITADA) */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between hover:border-indigo-500/50 transition-all relative">
            
            {/* Scarcity Badge */}
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <AlertCircle size={12} />
              <span>Apenas 50 Licenças</span>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Crown size={14} /> Oferta Especial de Lançamento
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">Oferta Fundador</h3>
                <p className="text-xs text-slate-400 mt-2">
                  Pagamento único com acesso perpétuo para sempre. Sem mensalidades ou renovações no futuro.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">R$ 497,00</span>
                  <span className="text-xs text-slate-400">/pagamento único</span>
                </div>
                <span className="text-[11px] text-indigo-300/80 mt-1 block">
                  Acesso vitalício sem cobranças recorrentes
                </span>

                {/* Scarcity Progress Bar */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>Lote Fundador: 38/50 preenchidas</span>
                    <span className="text-amber-400">Restam 12 licenças</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[76%] h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Acesso vitalício perpétuo sem mensalidades</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Todas as atualizações do Roadmap inclusas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Canal exclusivo de suporte direto com os devs</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0" />
                  <span>Badge exclusivo de Membro Fundador</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <a
                href={getWhatsAppLink('Oferta Fundador (Vitalício)', 'R$ 497,00 pagamento único')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl font-semibold text-xs text-center text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
              >
                <Crown size={16} />
                <span>Garantir Licença de Fundador</span>
              </a>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* MODALIDADES B2B: WHITE-LABEL & CORPORATIVO (SEM PREÇOS EXPOSTOS) */}
        {/* ========================================================================= */}
        <div className="pt-8 border-t border-slate-800/80">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Soluções Especializadas B2B
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
              Sua Própria Plataforma Financeira
            </h3>
            <p className="text-slate-400 text-sm">
              Potencialize sua consultoria financeira ou proteja os dados da sua empresa com tecnologia de ponta sob medida.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Card 1: White-Label para Educadores e Consultores */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Briefcase size={24} />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
                    Para Educadores & Consultores Financeiros
                  </span>
                  <h4 className="text-xl font-bold text-white mt-1">
                    Licença White-Label com Sua Própria Marca
                  </h4>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p className="font-semibold text-white">
                    A grande dor do consultor financeiro:
                  </p>
                  <p className="text-slate-400">
                    Você vende um curso ou mentoria de alto valor, entrega uma planilha do Excel para o aluno, ele se perde, abandona o preenchimento em 3 semanas e não renova o acompanhamento.
                  </p>
                  <p className="text-teal-300 font-medium pt-1">
                    Com a nossa plataforma White-Label, você entrega o <strong>seu próprio sistema</strong> com logotipo, cores da sua marca e domínio próprio (<code className="text-xs text-teal-300">app.suamarca.com.br</code>), gerando um valor percebido gigantesco e retenção máxima dos seus alunos.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-teal-400 shrink-0" />
                    <span>Instância própria com sua identidade visual e logotipo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-teal-400 shrink-0" />
                    <span>Domínio customizado e certificado SSL automático</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-teal-400 shrink-0" />
                    <span>Painel para criação e gerenciamento de alunos/clientes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-teal-400 shrink-0" />
                    <span>Suporte técnico e infraestrutura gerenciada</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <a
                  href={getWhatsAppLink('Licença White-Label para Consultoria/Mentoria')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-center text-slate-950 bg-teal-400 hover:bg-teal-300 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle size={16} />
                  <span>Falar com o Fundador sobre White-Label</span>
                </a>
              </div>
            </div>

            {/* Card 2: Licença Corporativa / On-Premise */}
            <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Building2 size={24} />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Empresas, Family Offices & Escritórios
                  </span>
                  <h4 className="text-xl font-bold text-white mt-1">
                    Licença Corporativa On-Premise (Servidor Próprio)
                  </h4>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p className="font-semibold text-white">
                    Sigilo patrimonial corporativo inegociável:
                  </p>
                  <p className="text-slate-400">
                    Projetado para empresas, holdings e escritórios de investimento que exigem executar o sistema exclusivamente dentro de seus próprios servidores/VPS dedicados.
                  </p>
                  <p className="text-emerald-300 font-medium pt-1">
                    Zero dados trafegando em servidores de terceiros. Você tem controle total do contêiner Docker, do banco de dados PostgreSQL e de todas as rotinas de backup interno.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Instalação completa em servidor/VPS próprio da empresa</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Acesso direto ao banco de dados e rotinas de backup isoladas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Treinamento e consultoria técnica de onboarding inclusos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400 shrink-0" />
                    <span>Sem mensalidades obrigatórias de terceiros</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <a
                  href={getWhatsAppLink('Licença Corporativa On-Premise (Servidor Próprio)')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-center text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle size={16} />
                  <span>Consultar Licença Corporativa no WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
