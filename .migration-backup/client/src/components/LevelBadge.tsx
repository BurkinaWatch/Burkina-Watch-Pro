
import { getLevelInfo } from "@shared/pointsSystem";
import { useTranslation } from "react-i18next";

interface LevelBadgeProps {
  level: string;
  size?: "sm" | "md" | "lg";
  showTitle?: boolean;
}

export function LevelBadge({ level, size = "md", showTitle = true }: LevelBadgeProps) {
  const { t } = useTranslation();
  const levelInfo = getLevelInfo(level);
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
  };
  
  const iconSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };
  
  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center border-2 shadow-lg`}
        style={{
          backgroundColor: levelInfo.color + "20",
          borderColor: levelInfo.color,
        }}
      >
        <span className={iconSizes[size]}>{levelInfo.icon}</span>
      </div>
      {showTitle && (
        <div className="flex flex-col">
          <span className="font-bold text-sm" style={{ color: levelInfo.color }}>
            {t(levelInfo.titleKey)}
          </span>
        </div>
      )}
    </div>
  );
}
