
import { getProgressToNextLevel, getLevelInfo } from "@shared/pointsSystem";
import { useTranslation } from "react-i18next";
import { Progress } from "./ui/progress";

interface LevelProgressProps {
  points: number;
}

export function LevelProgress({ points }: LevelProgressProps) {
  const { t } = useTranslation();
  const progress = getProgressToNextLevel(points);
  
  if (!progress.nextLevel) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{t('levels.maxLevel')}</span>
          <span className="text-sm text-muted-foreground">{points} pts</span>
        </div>
        <Progress value={100} className="h-2" />
      </div>
    );
  }
  
  const nextLevelInfo = getLevelInfo(progress.nextLevel);
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {t('levels.progressTo')} {t(nextLevelInfo.titleKey)}
        </span>
        <span className="text-sm text-muted-foreground">
          {progress.pointsNeeded} pts {t('levels.remaining')}
        </span>
      </div>
      <Progress value={progress.percentage} className="h-2" />
      <div className="text-xs text-muted-foreground text-right">
        {Math.min(points, nextLevelInfo.maxPoints)} / {nextLevelInfo.maxPoints} pts
      </div>
    </div>
  );
}
