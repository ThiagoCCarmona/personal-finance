import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FloatingWhatsApp: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(true);

  const whatsappNumber = "5545991325244";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20o%20FinanSmart%20Pro%20(Sistema%20Financeiro).`;

  return (
    <aside aria-label="Atendimento via WhatsApp" className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Tooltip Balloon */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="mb-3 max-w-xs p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-slate-200 shadow-2xl shadow-emerald-950/40 relative flex items-start gap-2.5"
          >
            <div className="flex flex-col text-xs">
              <span className="font-bold text-white flex items-center gap-1">
                👋 Dúvidas sobre o sistema?
              </span>
              <span className="text-slate-400 mt-0.5">
                Fale diretamente com o desenvolvedor no WhatsApp <strong>(45) 99132-5244</strong>.
              </span>
            </div>

            <button
              onClick={() => setShowTooltip(false)}
              className="text-slate-500 hover:text-white p-0.5 rounded"
              title="Fechar aviso"
            >
              <X size={14} />
            </button>

            {/* Little Triangle Pointer */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 border-b border-r border-emerald-500/40 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button with Pulse Effect */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-600/40 hover:scale-110 active:scale-95 transition-all duration-200"
        aria-label="Abrir conversa no WhatsApp"
      >
        {/* Radar Pulse Effect */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />

        <MessageCircle size={28} className="relative fill-white/10 group-hover:rotate-12 transition-transform" />
      </a>
    </aside>
  );
};
