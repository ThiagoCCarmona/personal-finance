import React from 'react';
import { 
  Globe2, 
  Coins, 
  MapPin, 
  Users, 
  EyeOff, 
  QrCode, 
  Plane, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export const BorderTravelerSection: React.FC = () => {
  const cards = [
    {
      icon: Coins,
      tag: 'Compras no Paraguai (USD)',
      title: 'Controle de Dólar sem Surpresas de Câmbio',
      desc: 'Compre em Ciudad del Este sabendo exatamente quanto pagou em Reais. Acompanhe a PTAX oficial do Banco Central e compare com o spread abusivo e IOF cobrado pelas operadoras de cartão.',
      color: 'emerald',
      highlight: 'Economia real de 4% a 8% por compra'
    },
    {
      icon: MapPin,
      tag: 'Gastronomia & Lazer na Argentina (ARS)',
      title: 'Jantares em Puerto Iguazú e Pesos Argentinos',
      desc: 'Acompanhe a volatilidade do Peso Argentino (ARS). Registre gastos com vinhos, cortes nobres e passeios na fronteira argentina sem desorganizar suas finanças pessoais no Brasil.',
      color: 'cyan',
      highlight: 'Suporte a múltiplas moedas e cotações'
    },
    {
      icon: Users,
      tag: 'Viagens em Grupo',
      title: 'Módulo "Rachar a Conta" de Viagens',
      desc: 'Viajou com amigos ou família? O sistema calcula automaticamente a cota de cada pessoa, abate quem já pagou o combustível ou a refeição e gera cobranças individuais atômicas.',
      color: 'indigo',
      highlight: 'Fim das brigas e planilhas confusas de viagem'
    },
    {
      icon: QrCode,
      tag: 'Liquidação Instantânea',
      title: 'Cobrança PIX Direta Padrão Banco Central (BR Code)',
      desc: 'Gere QR Codes e códigos Copia-e-Cola no padrão EMVCo oficial do Banco Central direto na tela para seus amigos pagarem. Sem taxas de gateways intermediários, o dinheiro cai direto na sua conta.',
      color: 'teal',
      highlight: '0% de taxa sobre as transferências'
    },
    {
      icon: EyeOff,
      tag: 'Segurança em Trânsito',
      title: 'Modo Privacidade Instantâneo com 1 Clique',
      desc: 'Passando pela aduana, em restaurantes movimentados ou no aeroporto? Com um simples toque, todos os saldos, faturas e patrimônio são substituídos por marcadores de privacidade.',
      color: 'amber',
      highlight: 'Total discrição em locais públicos'
    },
    {
      icon: Plane,
      tag: 'App Móvel PWA',
      title: 'Funciona no seu Celular como App Nativo',
      desc: 'Instale diretamente na tela inicial do iPhone ou Android sem precisar de lojas de aplicativos. Interface rápida, fluida e adaptada para conexões oscilantes em áreas de fronteira.',
      color: 'purple',
      highlight: 'Instalação em 2 segundos sem gastar memória'
    }
  ];

  return (
    <section id="fronteira" className="relative py-20 bg-slate-950 border-t border-slate-800/80 overflow-hidden">
      
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 -right-48 w-96 h-96 bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 -left-48 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Globe2 size={14} />
            <span>Fronteira & Estilo de Vida Internacional</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Criado por quem vive a realidade da <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Tríplice Fronteira</span>
          </h2>
          
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Aplicativos comuns de finanças foram feitos para quem só gasta em Real e nunca atravessou uma ponte internacional. O <strong>FinanSmart Pro</strong> foi concebido no epicentro do comércio e turismo da fronteira (Brasil, Paraguai e Argentina) para quem exige agilidade multimoedas.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg shadow-slate-950/50"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                      <Icon size={24} />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400/90 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800">
                      {card.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-medium">{card.highlight}</span>
                  <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Highlight Callout Box */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white">
                Mora em Foz do Iguaçu, Cascavel, Toledo ou na região Oeste?
              </h4>
              <p className="text-xs sm:text-sm text-slate-400">
                Oferecemos suporte local e implantação personalizada pelo WhatsApp direto com o criador do sistema.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/5545991325244?text=Ol%C3%A1!%20Moro%20na%20regi%C3%A3o%20de%20fronteira%20e%20gostaria%20de%20saber%20mais%20sobre%20o%20FinanSmart%20Pro."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-400/20 flex items-center justify-center space-x-2 shrink-0"
          >
            <span>Falar no WhatsApp (45) 99132-5244</span>
            <ArrowRight size={16} />
          </a>
        </div>

      </div>
    </section>
  );
};
