import React from 'react';
import { 
  GitCommit, 
  Sparkles, 
  Zap
} from 'lucide-react';

export const ContinuousEvolutionSection: React.FC = () => {
  const updates = [
    {
      version: 'v2.4 (Versão Atual)',
      status: 'Recém-Lançado',
      statusColor: 'emerald',
      title: 'Câmbio PTAX Oficial BACEN & Metodologia 50-30-20 Automatizada',
      desc: 'Integração em tempo real com a API Olinda do Banco Central do Brasil para cotações do Dólar, Peso Argentino e Euro. Lançamento do teto diário seguro de gastos e cálculo de spread cambial em compras no Paraguai e Argentina.',
      date: 'Setembro 2026',
    },
    {
      version: 'v2.3',
      status: 'Entregue',
      statusColor: 'teal',
      title: 'Módulo Social "Rachar a Conta" & Cobrança PIX BR Code',
      desc: 'Criação de despesas compartilhadas para jantares, churrascos e viagens em grupo com quitação atômica e gerador nativo de QR Code e Copia-e-Cola PIX padrão Banco Central sem nenhuma taxa de gateway.',
      date: 'Agosto 2026',
    },
    {
      version: 'v2.2',
      status: 'Entregue',
      statusColor: 'teal',
      title: 'Modo Privacidade Instantâneo & Blindagem RLS',
      desc: 'Proteção de tela com 1 clique para mascarar saldos em locais públicos e aeroportos. Implementação do isolamento estrito de dados por usuário com chaves UUID em todas as tabelas e proteção anti-IDOR.',
      date: 'Julho 2026',
    },
  ];

  const roadmapItems = [
    {
      title: 'Importação Inteligente de Extratos OFX / CSV',
      desc: 'Arraste e solte o extrato do seu banco para conciliação automática com conferência de duplicidades.',
      stage: 'Em Testes Finais',
    },
    {
      title: 'Categorização Preditiva com Inteligência Artificial',
      desc: 'Classificação automática de despesas nas faixas de 50% Essenciais e 30% Estilo de Vida.',
      stage: 'Em Desenvolvimento',
    },
    {
      title: 'Alertas de Melhor Dia de Compra no WhatsApp',
      desc: 'Lembretes automáticos no dia de fechamento da fatura para você comprar com até 40 dias de prazo.',
      stage: 'Planejado',
    },
  ];

  return (
    <section id="evolucao" className="py-20 bg-slate-900/60 border-t border-slate-800 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-emerald-500/5 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Zap size={14} />
            <span>Engenharia Ativa</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Um software vivo, em <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              constante evolução e atualização
            </span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Você não está adquirindo um aplicativo congelado no tempo. Nosso time realiza melhorias contínuas de performance, novas integrações e atualizações de segurança com cadência semanal.
          </p>
        </div>

        {/* 2-Column Layout: Changelog on Left, Roadmap on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Changelog Recent Releases */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <GitCommit size={16} className="text-emerald-400" />
                <span>Últimas Atualizações Entregues</span>
              </span>
              <span className="text-xs text-emerald-400 font-mono font-semibold">Atualizações Automáticas</span>
            </div>

            <div className="space-y-4">
              {updates.map((item) => (
                <div 
                  key={item.version}
                  className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">{item.version}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                        {item.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{item.date}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Public Roadmap / O que vem por aí */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-teal-400" />
                <span>Roadmap Ativo (Em Breve)</span>
              </span>
              <span className="text-xs text-slate-500">Próximos Passos</span>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-5">
              <p className="text-xs text-slate-400 leading-relaxed">
                Todos os assinantes e detentores de licença recebem as novas funcionalidades automaticamente sem nenhum custo adicional.
              </p>

              <div className="space-y-3.5">
                {roadmapItems.map((road) => (
                  <div key={road.title} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{road.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">
                        {road.stage}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {road.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-900 text-center">
                <span className="text-xs text-slate-500">
                  Tem sugestão de funcionalidade? Nosso canal no WhatsApp está sempre aberto para feedbacks da comunidade.
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
