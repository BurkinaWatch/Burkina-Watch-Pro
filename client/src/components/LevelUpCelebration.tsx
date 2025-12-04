
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { getLevelInfo } from "@shared/pointsSystem";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";

interface LevelUpCelebrationProps {
  newLevel: string;
  onClose: () => void;
}

export function LevelUpCelebration({ newLevel, onClose }: LevelUpCelebrationProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const levelInfo = getLevelInfo(newLevel);
  
  useEffect(() => {
    // Confetti aux couleurs nationales (Rouge, Jaune, Vert)
    const duration = 3000;
    const end = Date.now() + duration;
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ef4444', '#f59e0b', '#10b981'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ef4444', '#f59e0b', '#10b981'],
      });
      
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
    
    // Fermeture automatique après 5 secondes
    const timer = setTimeout(() => {
      setOpen(false);
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) onClose();
    }}>
      <DialogContent className="max-w-md">
        <DialogTitle className="sr-only">{t('levels.congratulations')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('levels.newRank')}: {t(levelInfo.titleKey)}
        </DialogDescription>
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="text-6xl animate-bounce">{levelInfo.icon}</div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold" style={{ color: levelInfo.color }}>
              {t('levels.congratulations')}
            </h2>
            <p className="text-lg font-semibold">
              {t('levels.newRank')}: {t(levelInfo.titleKey)}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t(levelInfo.descriptionKey)}
            </p>
          </div>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-2xl animate-pulse"
            style={{
              backgroundColor: levelInfo.color + "20",
              borderColor: levelInfo.color,
            }}
          >
            <span className="text-5xl">{levelInfo.icon}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
