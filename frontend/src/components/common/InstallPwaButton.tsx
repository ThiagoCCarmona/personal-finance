import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

export const InstallPwaButton: React.FC<{ className?: string }> = ({ className }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosPrompt, setShowIosPrompt] = useState<boolean>(false);

  useEffect(() => {
    // Detecta se já está rodando em modo standalone (PWA instalado)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Detecta iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosPrompt(true);
      return;
    }

    if (!deferredPrompt) {
      alert('Para instalar o app no seu smartphone, abra o menu do navegador (três pontos) e toque em "Instalar aplicativo" ou "Adicionar à tela inicial".');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={className || "flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 border border-blue-500/25 text-xs font-semibold transition w-full"}
      >
        <Download size={15} />
        <span>Instalar App no Celular</span>
      </button>

      {showIosPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Smartphone className="text-blue-400" size={18} />
              <span>Como Instalar no iPhone / iPad</span>
            </h4>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
              <li>Toque no botão de <strong>Compartilhar</strong> (quadrado com seta para cima) na barra do Safari.</li>
              <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</li>
              <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
            </ol>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIosPrompt(false)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
