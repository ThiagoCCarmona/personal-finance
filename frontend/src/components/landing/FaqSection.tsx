import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Como funciona a conta de demonstração gratuita?',
      a: 'Você pode testar o sistema imediatamente clicando no botão "Acessar Demo". Uma conta real pré-carregada com mais de R$ 380.000,00 de patrimônio simulado será aberta para você explorar todos os módulos: dashboard, carteira de investimentos, cotações PTAX, simulação de gastos e divisão de despesas sociais.'
    },
    {
      q: 'Como o sistema me ajuda em compras no Paraguai e saídas na Argentina?',
      a: 'O sistema possui integração direta com o Banco Central do Brasil para cotação PTAX diária do Dólar e Euro, além do Peso Argentino. Você sabe exatamente qual o custo real em Reais das compras em Ciudad del Este e Puerto Iguazú, comparando se compensa pagar em dinheiro vivo ou no cartão (evitando surpresas com spreads abusivos e IOF).'
    },
    {
      q: 'Como funciona o recurso de "Rachar a Conta" e cobrança PIX?',
      a: 'Ao fazer um jantar, abastecer ou fazer compras coletivas em viagens, você cadastra o valor total e seleciona os amigos participantes. O sistema calcula a cota de cada um e gera um QR Code PIX BR Code oficial direto na tela. O amigo aponta a câmera, paga pelo banco dele e o valor cai direto na sua conta, sem taxas bancárias intermediárias.'
    },
    {
      q: 'Vocês têm acesso às minhas senhas de banco ou dados financeiros?',
      a: 'NUNCA. O FinanSmart Pro não solicita e não armazena nenhuma senha bancária sua. Todos os seus dados são criptografados e estritamente isolados por usuário. Seus hábitos e patrimônio jamais serão vendidos a financeiras ou seguradoras.'
    },
    {
      q: 'O sistema funciona no meu celular como aplicativo?',
      a: 'Sim! Ele é construído com tecnologia PWA (Progressive Web App). Basta abrir o site no Safari (iOS) ou Chrome (Android) e tocar em "Adicionar à Tela de Início". Ele cria um ícone idêntico ao de um app nativo, com carregamento instantâneo e layout adaptado para telas móveis.'
    },
    {
      q: 'Por que o suporte oficial é do DDD 45?',
      a: 'O sistema foi concebido e programado no coração da Tríplice Fronteira (Foz do Iguaçu / Oeste do Paraná) por profissionais que vivem diariamente a dinâmica de fronteira comercial e turismo. O atendimento é direto com os desenvolvedores pelo WhatsApp (45) 99132-5244.'
    }
  ];

  return (
    <section id="faq" className="py-20 bg-slate-900/40 border-t border-slate-800 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle size={14} />
            <span>Tire Suas Dúvidas</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="text-slate-400 text-sm">
            Tudo o que você precisa saber sobre o sistema, segurança e planos.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-semibold text-white hover:text-emerald-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-500 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-emerald-400' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-400 border-t border-slate-900 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
