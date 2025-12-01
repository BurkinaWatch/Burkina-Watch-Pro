import { Button } from "@/components/ui/button";
import { Home, Map, Plus, AlertCircle, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function BottomNav() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems = [
    { icon: Home, label: "Accueil", path: "/", testId: "nav-home" },
    { icon: Map, label: "Carte", path: "/carte", testId: "nav-map" },
    { icon: Plus, label: "Publier", path: "/publier", testId: "nav-publish", highlight: true },
    { icon: AlertCircle, label: "SOS", path: "/sos", testId: "nav-sos" },
    { icon: User, label: "Profil", path: "/profil", testId: "nav-profile" },
  ];

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-t shadow-lg ${!isAuthenticated ? 'md:hidden' : ''}`} 
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-20 px-2 gap-1 max-w-screen-xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={`
                  relative flex flex-col items-center gap-1.5 h-auto py-3 px-4 rounded-2xl
                  transition-all duration-300 ease-out
                  ${isActive && !item.highlight 
                    ? "bg-primary/10 text-primary scale-105" 
                    : item.highlight 
                      ? "text-red-600 dark:text-red-500" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                  ${item.highlight ? "hover:scale-110" : "hover:scale-105"}
                `}
                data-testid={item.testId}
              >
                {/* Active indicator */}
                {isActive && !item.highlight && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full" />
                )}
                
                {/* Icon container with special styling for highlight */}
                <div className={`
                  relative transition-all duration-300
                  ${item.highlight 
                    ? "bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-full p-2.5 shadow-lg shadow-red-500/50" 
                    : ""
                  }
                `}>
                  <Icon 
                    className={`
                      transition-all duration-300
                      ${item.highlight 
                        ? "w-6 h-6 text-white" 
                        : isActive 
                          ? "w-6 h-6" 
                          : "w-5 h-5"
                      }
                    `} 
                    strokeWidth={isActive || item.highlight ? 2.5 : 2}
                  />
                  
                  {/* Pulse effect for highlight button */}
                  {item.highlight && (
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                  )}
                </div>
                
                {/* Label */}
                <span className={`
                  text-xs font-medium transition-all duration-300
                  ${isActive && !item.highlight ? "font-semibold" : ""}
                  ${item.highlight ? "font-semibold" : ""}
                `}>
                  {item.label}
                </span>
                
                {/* Ripple effect on hover */}
                <span className="absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 hover:opacity-100 bg-gradient-to-t from-primary/5 to-transparent" />
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
