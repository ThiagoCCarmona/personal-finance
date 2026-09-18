import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  KeyRound, 
  Server, 
  FileCheck2, 
  UserX,
  CheckCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export const SecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      icon: Database,
      title: 'Isolamento Estrito em Nível de Linha (RLS)',
      desc: 'Todas as tabelas possuem chave estrangeira vinculada ao UUID do usuário. Nenhuma consulta no banco de dados é executada sem validação rigorosa de escopo.',
    },
    {
      icon: Lock,
      title: 'Proteção Anti-IDOR em 100% dos Endpoints',
      desc: 'Tentativas de alterar ou visualizar contas, faturas ou despesas de outros usuários retornam erro 404 imediato. Segurança validada em todas as camadas da API.',
    },
    {
      icon: KeyRound,
      title: 'Senhas Criptografadas com Bcrypt (12 Rounds)',
      desc: 'Suas credenciais são protegidas com um dos algoritmos criptográficos mais seguros do mundo, com 12 rodadas de salt resistente a ataques de força bruta.',
    },
    {
      icon: UserX,
      title: 'Zero Rastreamento & Zero Venda de Dados',
      desc: 'Grandes aplicativos de finanças oferecem planos gratuitos para vender seus hábitos a bancos e seguradoras. No FinanSmart Pro, seu sigilo financeiro é inviolável.',
    },
    {
      icon: Server,
      title: 'Arquitetura Self-Hosted / Nuvem Segura',
      desc: 'Estruturado em contêineres Docker leves e seguros. Pode rodar na sua própria VPS ou na nossa infraestrutura blindada com backups automáticos.',
    },
    {
      icon: FileCheck2,
      title: 'Exportação e Soberania Total dos Dados',
      desc: 'Exporte relatórios completos em CSV (compatível com Excel brasileiro) e tenha a tranquilidade de nunca ficar preso a uma plataforma proprietária fechada.',
    },
  ];

  return (
    <section id="seguranca" className="py-20 bg-slate-900/60 border-t border-slate-800 relative overflow-hidden">
      
      {/* Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-64 bg-emerald-500/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Blindagem & Privacidade</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Sua Vida Financeira <span className="text-emerald-400">Não É Produto</span>
          </h2>

          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Seus saldos, limites e investimentos são informações extremamente sensíveis. Construímos cada linha de código com os mais altos padrões de segurança da engenharia de software contemporânea.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: idx * 0.06 }}
                className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-900 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle size={14} />
                  <span>Ativo e Monitorado</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Security Guarantee Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center max-w-2xl mx-auto space-y-2">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Nenhuma Senha Bancária é Armazenada
          </div>
          <p className="text-xs text-slate-400">
            Você não conecta as senhas dos seus aplicativos de banco. Suas contas bancárias reais permanecem 100% protegidas contra invasões, sem intermediários externos tendo acesso às suas credenciais.
          </p>
        </div>

      </div>
    </section>
  );
};
