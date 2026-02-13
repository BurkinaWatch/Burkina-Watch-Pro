import { Button } from "@/components/ui/button";
import { Home, Map, Plus, AlertCircle, User, Cross } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingTip } from "@/components/OnboardingTip";

export default function BottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { icon: Home, label: "Accueil", path: "/", testId: "nav-home", color: "from-emerald-400 to-emerald-600", tipId: "nav-home", tip: "Tableau de bord principal" },
    { icon: Map, label: "Carte", path: "/carte", testId: "nav-map", color: "from-blue-400 to-blue-600", tipId: "nav-map", tip: "Carte interactive des alertes" },
    { icon: Cross, label: "Pharmacies", path: "/pharmacies", testId: "nav-pharmacies", color: "from-red-400 to-red-600", tipId: "nav-pharmacies", tip: "Pharmacies du Faso" },
    { icon: Plus, label: "Publier", path: "/publier", testId: "nav-publish", highlight: true, color: "from-red-500 via-orange-400 to-yellow-400", tipId: "nav-publish", tip: "Signalez un incident" },
    { icon: AlertCircle, label: "SOS", path: "/fil-actualite", testId: "nav-sos", color: "from-red-500 to-red-600", tipId: "nav-sos", tip: "Fil des signalements" },
    { icon: User, label: "Profil", path: "/profil", testId: "nav-profile", color: "from-purple-400 to-purple-600", tipId: "nav-profile", tip: "Vos paramètres et contacts" },
  ];

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-40 ${!isAuthenticated ? 'md:hidden' : ''}`}
      style={{
        background: "linear-gradient(to top, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85))",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)"
      }}
      data-testid="bottom-nav"
    >
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 opacity-50" />
      
      <div className="flex items-center justify-around h-24 px-2 gap-1 max-w-screen-xl mx-auto relative">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <OnboardingTip 
              key={item.path} 
              id={item.tipId} 
              content={item.tip} 
              side="top"
              delay={500 + index * 800}
            >
              <Link href={item.path}>
                <Button
                variant="ghost"
                size="sm"
                className={`
                  relative flex flex-col items-center justify-center gap-2 h-auto py-2.5 px-3.5 rounded-3xl
                  transition-all duration-300 ease-out group overflow-hidden
                  ${item.highlight 
                    ? "scale-110" 
                    : isActive
                      ? "scale-105"
                      : "hover:scale-105 active:scale-95"
                  }
                `}
                data-testid={item.testId}
              >
                {/* Background glow effect */}
                <span className={`
                  absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300
                  ${item.highlight ? "opacity-100" : "group-hover:opacity-80"}
                  bg-gradient-to-br ${item.color}
                `} 
                style={{ 
                  filter: "blur(8px)",
                  opacity: item.highlight ? 0.3 : isActive ? 0.15 : 0
                }}
                />
                
                {/* Icon container */}
                <div className={`
                  relative flex items-center justify-center transition-all duration-300
                  ${item.highlight 
                    ? `bg-gradient-to-br ${item.color} rounded-full p-3 shadow-2xl`
                    : isActive
                      ? `bg-gradient-to-br ${item.color} bg-opacity-20 rounded-full p-2.5`
                      : "p-2"
                  }
                  ${!item.highlight && !isActive ? "group-hover:bg-white/10 rounded-full" : ""}
                `}>
                  <Icon 
                    className={`
                      transition-all duration-300 relative z-10
                      ${item.highlight 
                        ? "w-7 h-7 text-white drop-shadow-lg" 
                        : isActive
                          ? `w-6 h-6 text-transparent bg-clip-text bg-gradient-to-br ${item.color}`
                          : "w-5 h-5 text-gray-400 group-hover:text-white"
                      }
                    `} 
                    strokeWidth={item.highlight || isActive ? 2.5 : 2}
                    fill={isActive && !item.highlight ? "currentColor" : "none"}
                  />
                  
                  {/* Enhanced pulse effect for highlight button */}
                  {item.highlight && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-gradient-to-br opacity-0 animate-pulse" 
                        style={{ 
                          background: `linear-gradient(to bottom right, rgb(239, 68, 68), rgb(251, 146, 60), rgb(250, 204, 21))`,
                          animationDuration: "2s"
                        }}
                      />
                      <span className="absolute inset-1 rounded-full border-2 border-white/50 animate-pulse opacity-50" />
                    </>
                  )}
                </div>
                
                {/* Label */}
                <span className={`
                  text-xs font-semibold transition-all duration-300 relative z-10 tracking-wide
                  ${isActive || item.highlight 
                    ? `bg-gradient-to-br ${item.color} text-transparent bg-clip-text` 
                    : "text-gray-400 group-hover:text-white"
                  }
                `}>
                  {item.label}
                </span>
                
                {/* Active indicator bar */}
                {isActive && !item.highlight && (
                  <span className={`
                    absolute bottom-0 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all duration-300
                    bg-gradient-to-r ${item.color} shadow-lg
                    ${isActive ? "w-6" : "w-0"}
                  `} />
                )}
              </Button>
              </Link>
            </OnboardingTip>
          );
        })}
      </div>
    </nav>
  );
}
