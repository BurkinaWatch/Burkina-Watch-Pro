import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "wouter";
import { Home, MapPin, FileText, AlertCircle, Heart, Info, Scale, User, LogOut, Cross, Newspaper, Calendar, Navigation, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import logo from "@assets/burkina_watch_logo.png";

interface HamburgerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HamburgerMenu({ open, onOpenChange }: HamburgerMenuProps) {
  const { isAuthenticated, user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Navigation principale - Actions principales
  const mainMenuItems = [
    { href: "/", icon: Home, label: "Accueil", color: "text-primary" },
    { href: "/carte", icon: MapPin, label: "Carte Interactive", color: "text-green-600 dark:text-green-500" },
    { href: "/feed", icon: FileText, label: "Signalements", color: "text-blue-600 dark:text-blue-500" },
    { href: "/sos", icon: AlertCircle, label: "Alerte SOS", color: "text-red-600 dark:text-red-500", badge: "Urgence" },
  ];

  // Services & Actualités - Nouvelles fonctionnalités en avant
  const servicesItems = [
    { href: "/bulletin", icon: Newspaper, label: "Bulletin Citoyen", color: "text-yellow-700 dark:text-yellow-500", badge: "Nouveau", badgeColor: "bg-yellow-500" },
    { href: "/events", icon: Calendar, label: "Événements", color: "text-purple-600 dark:text-purple-500", badge: "Nouveau", badgeColor: "bg-purple-500" },
    { href: "/tracking-live", icon: Navigation, label: "Suivi en Direct", color: "text-cyan-600 dark:text-cyan-500" },
  ];

  // Services d'urgence - Groupés logiquement
  const urgenceItems = [
    { href: "/urgences", icon: AlertCircle, label: "Numéros d'Urgence", color: "text-orange-600 dark:text-orange-500" },
    { href: "/pharmacies", icon: Cross, label: "Pharmacies de Garde", color: "text-red-500 dark:text-red-400" },
  ];

  // Informations & Engagement
  const infoItems = [
    { href: "/a-propos", icon: Info, label: "À propos", color: "text-slate-600 dark:text-slate-400" },
    { href: "/contribuer", icon: Heart, label: "Contribuer", color: "text-pink-600 dark:text-pink-500" },
    { href: "/conditions", icon: Scale, label: "Conditions", color: "text-gray-600 dark:text-gray-400" },
  ];

  const onClose = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0 bg-gradient-to-b from-background via-background to-muted/20">
        <div className="flex flex-col h-full">
          {/* En-tête amélioré avec logo */}
          <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-green-50 to-yellow-50 dark:from-green-950/20 dark:to-yellow-950/20">
            <div className="flex items-center gap-3 mb-2">
              <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl shadow-md" />
              <div>
                <SheetTitle className="text-left">
                  <span className="text-red-600 dark:text-red-500 font-bold text-xl">Burkina Watch</span>
                </SheetTitle>
                <p className="text-xs text-left font-medium">
                  <span className="text-red-600 dark:text-red-500">Voir.</span>{" "}
                  <span className="text-yellow-700 dark:text-yellow-400">Agir.</span>{" "}
                  <span className="text-green-700 dark:text-green-500">Protéger.</span>
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Navigation principale - Design amélioré */}
            <div className="px-3 mb-4">
              <div className="flex items-center gap-2 mb-3 px-2">
                <div className="w-1 h-5 bg-gradient-to-b from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Navigation
                </p>
              </div>
              <nav className="space-y-1.5">
                {mainMenuItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-accent/80 hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden"
                      onClick={() => onOpenChange(false)}
                      data-testid={`menu-${item.label.toLowerCase()}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            <Separator className="my-3" />

            {/* Services & Actualités */}
            <div className="px-3 mb-4">
              <div className="flex items-center gap-2 mb-3 px-2">
                <Sparkles className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Services & Actualités
                </p>
              </div>
              <nav className="space-y-1.5">
                {servicesItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-accent/80 hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden"
                      onClick={() => onOpenChange(false)}
                      data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && (
                        <Badge className={`ml-auto text-[10px] px-1.5 py-0 ${item.badgeColor} text-white border-0`}>
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            <Separator className="my-3" />

            {/* Services d'urgence */}
            <div className="px-3 mb-4">
              <div className="flex items-center gap-2 mb-3 px-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-500" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Urgences & Santé
                </p>
              </div>
              <nav className="space-y-1.5">
                {urgenceItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden"
                      onClick={() => onOpenChange(false)}
                      data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                      <span className="font-medium">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            <Separator className="my-3" />

            {/* Informations */}
            <div className="px-3 mb-4">
              <div className="flex items-center gap-2 mb-3 px-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Informations
                </p>
              </div>
              <nav className="space-y-1.5">
                {infoItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-10 rounded-xl hover:bg-accent/60 transition-all duration-200 group"
                      onClick={() => onOpenChange(false)}
                      data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-sm">{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            {isAuthenticated && (
              <>
                <Separator className="my-3" />

                {/* Compte utilisateur - Design amélioré */}
                <div className="px-3 mb-4">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <User className="w-4 h-4 text-primary" />
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Mon Compte
                    </p>
                  </div>
                  <nav className="space-y-1.5">
                    <Link href="/profil">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-primary/10 hover:scale-[1.02] transition-all duration-200 group"
                        onClick={() => onOpenChange(false)}
                        data-testid="menu-profil"
                      >
                        <User className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Mon Profil</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-11 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-500 hover:scale-[1.02] transition-all duration-200 group"
                      onClick={() => {
                        onOpenChange(false);
                        handleLogout();
                      }}
                      data-testid="menu-logout"
                    >
                      <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Se déconnecter</span>
                    </Button>
                  </nav>
                </div>
              </>
            )}
          </div>

          {/* Footer redesigné */}
          <div className="p-4 border-t bg-gradient-to-r from-green-50 to-yellow-50 dark:from-green-950/20 dark:to-yellow-950/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-xs text-center font-bold text-foreground">
              Burkina Watch v1.0
            </p>
            <p className="text-xs text-center text-muted-foreground mt-1">
              Initiative citoyenne 🇧🇫
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}