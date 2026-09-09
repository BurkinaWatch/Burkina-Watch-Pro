import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Shield, Wifi, Zap } from "lucide-react";
import BurkinaWatchLogo from "./BurkinaWatchLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "pwa_install_dismissed";
const DISMISS_DURATION = 60 * 60 * 1000;
const SHOW_DELAY = 90 * 1000;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < DISMISS_DURATION) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      setTimeout(() => {
        setShowPrompt(true);
      }, SHOW_DELAY);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error("Erreur lors de l'installation:", error);
    }
    
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-4 md:max-w-sm">
      <div 
        className="rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          background: "linear-gradient(145deg, rgba(10, 18, 36, 0.98), rgba(20, 30, 52, 0.98))",
          borderColor: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(24px)"
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 opacity-80" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-white/10 transition-colors z-10"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-gray-500 hover:text-gray-300 transition-colors" />
        </button>

        <div className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg">
              <BurkinaWatchLogo className="w-10 h-10" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight">
                Burkina Watch
              </h3>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">
                Application officielle de securite civique
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
              <Wifi className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] text-gray-400 text-center leading-tight">Mode hors ligne</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] text-gray-400 text-center leading-tight">Acces rapide</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/5 border border-white/5">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-[10px] text-gray-400 text-center leading-tight">Alertes SOS</span>
            </div>
          </div>
          
          <div className="flex gap-2.5">
            <Button
              size="sm"
              onClick={handleInstall}
              className="flex-1 bg-white hover:bg-gray-100 text-gray-900 font-semibold h-10 rounded-xl shadow-lg transition-all"
              data-testid="button-install-pwa"
            >
              <Download className="w-4 h-4 mr-2" />
              Installer gratuitement
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-300 hover:bg-white/5 h-10 rounded-xl px-4"
              data-testid="button-dismiss-pwa"
            >
              Plus tard
            </Button>
          </div>

          <p className="text-[10px] text-gray-600 text-center mt-3">
            Gratuit - Aucune donnee personnelle collectee
          </p>
        </div>
      </div>
    </div>
  );
}
