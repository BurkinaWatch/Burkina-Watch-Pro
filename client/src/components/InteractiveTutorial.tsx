import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Heart,
  Map,
  MessageCircle,
  Shield,
  Menu,
  Lightbulb,
} from "lucide-react";

interface TutorialTip {
  id: string;
  title: string;
  text: string;
  icon: React.ReactNode;
  color: string;
}

const TIPS: TutorialTip[] = [
  {
    id: "signalement",
    title: "Signalez",
    text: "Un incident pres de vous ? Publiez un signalement en quelques secondes, photo et localisation incluses.",
    icon: <AlertTriangle className="w-5 h-5" />,
    color: "text-amber-500",
  },
  {
    id: "carte",
    title: "Explorez",
    text: "La carte interactive affiche les incidents, pharmacies, hopitaux et services autour de vous en temps reel.",
    icon: <Map className="w-5 h-5" />,
    color: "text-blue-500",
  },
  {
    id: "sos",
    title: "SOS",
    text: "Besoin d'aide urgente ? Le bouton SOS alerte la communaute et affiche les numeros d'urgence.",
    icon: <Heart className="w-5 h-5" />,
    color: "text-red-500",
  },
  {
    id: "menu",
    title: "Decouvrez",
    text: "Ouvrez le menu pour acceder aux pharmacies, hopitaux, restaurants, cinemas, marches, banques et plus.",
    icon: <Menu className="w-5 h-5" />,
    color: "text-primary",
  },
  {
    id: "assistant",
    title: "Assistant IA",
    text: "Une question ? L'assistant intelligent en bas a droite peut vous guider dans l'application.",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "text-green-500",
  },
  {
    id: "securite",
    title: "Vie privee",
    text: "Vos signalements peuvent etre anonymes et vous pouvez flouter les visages sur vos photos avant publication.",
    icon: <Shield className="w-5 h-5" />,
    color: "text-primary",
  },
];

const STORAGE_KEY = "burkina_watch_tutorial_completed";
const STORAGE_KEY_DONT_SHOW = "burkina_watch_tutorial_dont_show";

export function InteractiveTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [exiting, setExiting] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const dontShow = localStorage.getItem(STORAGE_KEY_DONT_SHOW);

    if (!completed && !dontShow) {
      const timer = setTimeout(() => setIsOpen(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const [paused, setPaused] = useState(false);

  const resetAutoAdvance = useCallback(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (paused) return;
    autoTimer.current = setTimeout(() => {
      setCurrentTip((prev) => {
        if (prev < TIPS.length - 1) return prev + 1;
        return prev;
      });
    }, 8000);
  }, [paused]);

  useEffect(() => {
    if (isOpen) resetAutoAdvance();
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current);
    };
  }, [isOpen, currentTip, resetAutoAdvance]);

  const handleInteraction = useCallback(() => {
    setPaused(true);
    if (autoTimer.current) clearTimeout(autoTimer.current);
  }, []);

  const dismiss = useCallback((permanent: boolean) => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    setExiting(true);
    localStorage.setItem(STORAGE_KEY, "true");
    if (permanent) localStorage.setItem(STORAGE_KEY_DONT_SHOW, "true");
    setTimeout(() => setIsOpen(false), 300);
  }, []);

  const goNext = useCallback(() => {
    handleInteraction();
    if (currentTip < TIPS.length - 1) {
      setCurrentTip((p) => p + 1);
    } else {
      dismiss(false);
    }
  }, [currentTip, dismiss, handleInteraction]);

  const goPrev = useCallback(() => {
    handleInteraction();
    if (currentTip > 0) setCurrentTip((p) => p - 1);
  }, [currentTip, handleInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 50) {
        if (delta < 0) goNext();
        else goPrev();
      }
      touchStartX.current = null;
    },
    [goNext, goPrev],
  );

  if (!isOpen) return null;

  const tip = TIPS[currentTip];
  const isLast = currentTip === TIPS.length - 1;

  return (
    <div
      className={`fixed bottom-4 left-3 right-3 z-[90] max-w-md mx-auto transition-all duration-300 ${exiting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0 animate-in slide-in-from-bottom-4 fade-in duration-400"}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="tutorial-overlay"
    >
      <div className="bg-card border rounded-md shadow-lg overflow-hidden">
        <div className="h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentTip + 1) / TIPS.length) * 100}%` }}
          />
        </div>

        <div className="p-3 flex items-start gap-3">
          <div className={`shrink-0 mt-0.5 ${tip.color}`}>
            {tip.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm">{tip.title}</span>
              <Badge variant="outline" className="text-[10px] leading-tight">
                {currentTip + 1}/{TIPS.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tip.text}
            </p>
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => dismiss(false)}
            className="shrink-0 -mt-1 -mr-1"
            data-testid="button-tutorial-close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="px-3 pb-2.5 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismiss(true)}
            className="text-[10px] text-muted-foreground/60"
            data-testid="checkbox-dont-show-again"
          >
            Masquer
          </Button>

          <div className="flex items-center gap-1" role="tablist" aria-label="Astuces">
            {TIPS.map((_, i) => (
              <Badge
                key={i}
                variant="outline"
                onClick={() => { handleInteraction(); setCurrentTip(i); }}
                className={`cursor-pointer rounded-full border-0 p-0 transition-all ${
                  i === currentTip
                    ? "w-4 h-1.5 bg-primary"
                    : i < currentTip
                      ? "w-1.5 h-1.5 bg-primary/40"
                      : "w-1.5 h-1.5 bg-muted-foreground/20"
                }`}
                data-testid={`tutorial-dot-${i}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={goPrev}
              disabled={currentTip === 0}
              data-testid="button-tutorial-previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={goNext}
              className="gap-1"
              data-testid="button-tutorial-next"
            >
              {isLast ? "OK" : "Suite"}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TutorialTrigger() {
  const [, setForceUpdate] = useState(0);

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY_DONT_SHOW);
    setForceUpdate((prev) => prev + 1);
    window.location.reload();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestart}
      className="gap-2"
      data-testid="button-restart-tutorial"
    >
      <Lightbulb className="w-4 h-4" />
      Revoir les astuces
    </Button>
  );
}
