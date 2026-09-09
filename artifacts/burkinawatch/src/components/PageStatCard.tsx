import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ColorVariant = "primary" | "orange" | "green" | "blue" | "purple" | "amber" | "cyan" | "red" | "yellow";

interface PageStatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: ColorVariant;
  onClick?: () => void;
  clickable?: boolean;
}

const colorConfig: Record<ColorVariant, {
  gradient: string;
  border: string;
  icon: string;
  text: string;
  star: string;
  shield: [string, string, string];
}> = {
  primary: {
    gradient: "from-primary/10 to-primary/5",
    border: "border-primary/20 hover:border-primary/40",
    icon: "text-primary bg-primary/10",
    text: "text-primary",
    star: "#E30613",
    shield: ["#E30613", "#FFD100", "#007A33"]
  },
  orange: {
    gradient: "from-orange-500/10 to-orange-500/5",
    border: "border-orange-500/20 hover:border-orange-500/40",
    icon: "text-orange-600 bg-orange-500/10",
    text: "text-orange-600",
    star: "#F97316",
    shield: ["#F97316", "#FFD100", "#007A33"]
  },
  green: {
    gradient: "from-green-500/10 to-green-500/5",
    border: "border-green-500/20 hover:border-green-500/40",
    icon: "text-green-600 bg-green-500/10",
    text: "text-green-600",
    star: "#22C55E",
    shield: ["#007A33", "#FFD100", "#E30613"]
  },
  blue: {
    gradient: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-500/20 hover:border-blue-500/40",
    icon: "text-blue-600 bg-blue-500/10",
    text: "text-blue-600",
    star: "#3B82F6",
    shield: ["#3B82F6", "#60A5FA", "#93C5FD"]
  },
  purple: {
    gradient: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-500/20 hover:border-purple-500/40",
    icon: "text-purple-600 bg-purple-500/10",
    text: "text-purple-600",
    star: "#A855F7",
    shield: ["#A855F7", "#C084FC", "#E9D5FF"]
  },
  amber: {
    gradient: "from-amber-500/10 to-amber-500/5",
    border: "border-amber-500/20 hover:border-amber-500/40",
    icon: "text-amber-600 bg-amber-500/10",
    text: "text-amber-600",
    star: "#F59E0B",
    shield: ["#F59E0B", "#FBBF24", "#FDE68A"]
  },
  cyan: {
    gradient: "from-cyan-500/10 to-cyan-500/5",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    icon: "text-cyan-600 bg-cyan-500/10",
    text: "text-cyan-600",
    star: "#06B6D4",
    shield: ["#06B6D4", "#22D3EE", "#A5F3FC"]
  },
  red: {
    gradient: "from-red-500/10 to-red-500/5",
    border: "border-red-500/20 hover:border-red-500/40",
    icon: "text-red-600 bg-red-500/10",
    text: "text-red-600",
    star: "#EF4444",
    shield: ["#E30613", "#FFD100", "#007A33"]
  },
  yellow: {
    gradient: "from-yellow-500/10 to-yellow-500/5",
    border: "border-yellow-500/20 hover:border-yellow-500/40",
    icon: "text-yellow-600 bg-yellow-500/10",
    text: "text-yellow-600",
    star: "#EAB308",
    shield: ["#EAB308", "#FACC15", "#FEF08A"]
  }
};

export default function PageStatCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "primary",
  onClick,
  clickable = false
}: PageStatCardProps) {
  const config = colorConfig[variant];

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group",
        "bg-gradient-to-br",
        config.gradient,
        config.border,
        clickable && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Effet de lumiere au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      
      {/* Armoiries stylisees en arriere-plan */}
      <div className="absolute -right-8 -top-8 opacity-5 pointer-events-none">
        <svg width="140" height="140" viewBox="0 0 100 100" className="transform rotate-12">
          <path d="M50 10 L70 30 L70 70 L50 90 L30 70 L30 30 Z" fill={config.shield[0]} opacity="0.3"/>
          <path d="M50 20 L65 35 L65 65 L50 80 L35 65 L35 35 Z" fill={config.shield[1]} opacity="0.4"/>
          <path d="M50 30 L60 40 L60 60 L50 70 L40 60 L40 40 Z" fill={config.shield[2]} opacity="0.5"/>
          <path d="M50 35 L52 42 L59 42 L53 46 L55 53 L50 48 L45 53 L47 46 L41 42 L48 42 Z" 
                fill={config.star} opacity="0.8"/>
        </svg>
      </div>

      <CardHeader className="pb-2 pt-4 relative z-10">
        <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between gap-2">
          <span className="truncate">{title}</span>
          <div className={cn(
            "p-2 rounded-xl transition-transform duration-300 hover:scale-110 relative shrink-0",
            config.icon
          )}>
            <Icon className="w-4 h-4 relative z-10" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5">
              <svg viewBox="0 0 10 10" className="w-full h-full">
                <path d="M5 0 L5.5 3 L8 3 L6 4.5 L7 7 L5 5.5 L3 7 L4 4.5 L2 3 L4.5 3 Z" 
                      fill={config.star} opacity="0.6"/>
              </svg>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 pt-0 pb-4">
        <div className="flex items-baseline gap-2">
          <span className={cn("text-2xl md:text-3xl font-bold tracking-tight", config.text)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" className="inline-block opacity-40 shrink-0">
              <path d="M5 2 L5.3 3.5 L6.5 3.5 L5.5 4.2 L5.8 5.7 L5 5 L4.2 5.7 L4.5 4.2 L3.5 3.5 L4.7 3.5 Z" 
                    fill={config.star}/>
            </svg>
            <span className="truncate">{description}</span>
          </p>
        )}
      </CardContent>

      {/* Bande decorative aux couleurs du drapeau */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex">
        <div className="flex-1" style={{backgroundColor: config.shield[0], opacity: 0.3}}></div>
        <div className="flex-1" style={{backgroundColor: config.shield[1], opacity: 0.3}}></div>
        <div className="flex-1" style={{backgroundColor: config.shield[2], opacity: 0.3}}></div>
      </div>
    </Card>
  );
}
