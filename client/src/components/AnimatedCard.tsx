import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "success" | "info";
  showFlag?: boolean;
}

export function AnimatedCard({ 
  children, 
  className, 
  variant = "default",
  showFlag = true 
}: AnimatedCardProps) {
  const variantStyles = {
    default: "from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40",
    destructive: "from-destructive/10 to-destructive/5 border-destructive/20 hover:border-destructive/40",
    success: "from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40",
    info: "from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40"
  };

  const flagColors = {
    red: "#E30613",
    yellow: "#FFD100",
    green: "#007A33"
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br",
      variantStyles[variant],
      className
    )}>
      {/* Effet de lumière au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      
      {children}

      {/* Bande décorative aux couleurs du drapeau */}
      {showFlag && (
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          <div className="flex-1" style={{backgroundColor: flagColors.red, opacity: 0.3}}></div>
          <div className="flex-1" style={{backgroundColor: flagColors.yellow, opacity: 0.3}}></div>
          <div className="flex-1" style={{backgroundColor: flagColors.green, opacity: 0.3}}></div>
        </div>
      )}
    </Card>
  );
}
