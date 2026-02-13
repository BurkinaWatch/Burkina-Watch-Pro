import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "destructive" | "success" | "info";
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
  onClick?: () => void;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  trend = "neutral",
  loading = false,
  onClick
}: StatCardProps) {
  const variantStyles = {
    default: "from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40",
    destructive: "from-destructive/10 to-destructive/5 border-destructive/20 hover:border-destructive/40",
    success: "from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40",
    info: "from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40"
  };

  const iconVariantStyles = {
    default: "text-primary bg-primary/10",
    destructive: "text-destructive bg-destructive/10",
    success: "text-green-600 bg-green-500/10",
    info: "text-blue-600 bg-blue-500/10"
  };

  const trendColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-muted-foreground"
  };

  // Couleurs des armoiries selon la variante
  const coatOfArmsColors = {
    default: {
      star: "#E30613",
      shield1: "#E30613",
      shield2: "#FFD100",
      shield3: "#007A33"
    },
    destructive: {
      star: "#E30613",
      shield1: "#E30613",
      shield2: "#FFD100",
      shield3: "#007A33"
    },
    success: {
      star: "#FFD100",
      shield1: "#007A33",
      shield2: "#FFD100",
      shield3: "#E30613"
    },
    info: {
      star: "#3B82F6",
      shield1: "#3B82F6",
      shield2: "#60A5FA",
      shield3: "#93C5FD"
    }
  };

  const colors = coatOfArmsColors[variant];

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
        "bg-gradient-to-br",
        variantStyles[variant],
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Effet de lumière au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      
      {/* Armoiries stylisées en arrière-plan */}
      <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none">
        <svg width="160" height="160" viewBox="0 0 100 100" className="transform rotate-12">
          {/* Écu simplifié aux couleurs du Burkina */}
          <path d="M50 10 L70 30 L70 70 L50 90 L30 70 L30 30 Z" fill={colors.shield1} opacity="0.3"/>
          <path d="M50 20 L65 35 L65 65 L50 80 L35 65 L35 35 Z" fill={colors.shield2} opacity="0.4"/>
          <path d="M50 30 L60 40 L60 60 L50 70 L40 60 L40 40 Z" fill={colors.shield3} opacity="0.5"/>

          {/* Étoile centrale */}
          <path d="M50 35 L52 42 L59 42 L53 46 L55 53 L50 48 L45 53 L47 46 L41 42 L48 42 Z" 
                fill={colors.star} opacity="0.8"/>
        </svg>
      </div>

      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
          <span>{title}</span>
          <div className={cn(
            "p-2.5 rounded-xl transition-transform duration-300 hover:scale-110 relative",
            iconVariantStyles[variant]
          )}>
            <Icon className="w-5 h-5 relative z-10" />
            {/* Mini étoile décorative */}
            <div className="absolute -top-1 -right-1 w-3 h-3">
              <svg viewBox="0 0 10 10" className="w-full h-full">
                <path d="M5 0 L5.5 3 L8 3 L6 4.5 L7 7 L5 5.5 L3 7 L4 4.5 L2 3 L4.5 3 Z" 
                      fill={colors.star} opacity="0.6"/>
              </svg>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-baseline gap-2">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <span className="text-4xl font-bold tracking-tight">{value}</span>
              {trend !== "neutral" && (
                <span className={cn("text-sm font-medium", trendColors[trend])}>
                  {trend === "up" ? "↗" : "↘"}
                </span>
              )}
            </>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 10 10" className="inline-block opacity-40">
              <path d="M5 2 L5.3 3.5 L6.5 3.5 L5.5 4.2 L5.8 5.7 L5 5 L4.2 5.7 L4.5 4.2 L3.5 3.5 L4.7 3.5 Z" 
                    fill={colors.star}/>
            </svg>
            {description}
          </p>
        )}
      </CardContent>

      {/* Bande décorative aux couleurs du drapeau */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex">
        <div className="flex-1" style={{backgroundColor: colors.shield1, opacity: 0.3}}></div>
        <div className="flex-1" style={{backgroundColor: colors.shield2, opacity: 0.3}}></div>
        <div className="flex-1" style={{backgroundColor: colors.shield3, opacity: 0.3}}></div>
      </div>
    </Card>
  );
}