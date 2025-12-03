import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "wouter";
import { Home, MapPin, FileText, AlertCircle, Heart, Info, Scale, User, LogOut, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import logo from "/burkina_watch_logo.png";

interface HamburgerMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HamburgerMenu({ open, onOpenChange }: HamburgerMenuProps) {
  const { isAuthenticated, user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const menuItems = [
    { href: "/", icon: Home, label: "Accueil" },
    { href: "/feed", icon: FileText, label: "Signalements" },
    { href: "/carte", icon: MapPin, label: "Carte" },
    { href: "/sos", icon: AlertCircle, label: "SOS" },
  ];

  const infoItems = [
    { href: "/a-propos", icon: Info, label: "À propos de nous" },
    { href: "/conditions", icon: Scale, label: "Conditions d'utilisation" },
    { href: "/contribuer", icon: Heart, label: "Contribuer" },
  ];

  const onClose = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="text-left">
              <span className="text-red-600 dark:text-red-500 font-bold text-xl">Burkina Watch</span>
            </SheetTitle>
            <p className="text-xs text-left">
              <span className="text-red-600 dark:text-red-500">Voir.</span>{" "}
              <span className="text-yellow-700 dark:text-yellow-400">Agir.</span>{" "}
              <span className="text-green-700 dark:text-green-500">Protéger.</span>
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Navigation principale */}
            <div className="px-4 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Navigation
              </p>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 hover-elevate"
                      onClick={() => onOpenChange(false)}
                      data-testid={`menu-${item.label.toLowerCase()}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            <Separator className="my-4" />

            {/* Informations */}
            <div className="px-4 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Informations
              </p>
              <nav className="space-y-1">
                {infoItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 hover-elevate"
                      onClick={() => onOpenChange(false)}
                      data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Added for the tracking live link */}
            <div className="px-4 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Suivi
              </p>
              <nav className="space-y-1">
                <Link href="/tracking-live">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 hover-elevate"
                    onClick={onClose}
                    data-testid="menu-tracking-live"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Tracking en Direct</span>
                  </Button>
                </Link>
              </nav>
            </div>


            {isAuthenticated && (
              <>
                <Separator className="my-4" />

                {/* Compte utilisateur */}
                <div className="px-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    Compte
                  </p>
                  <Link href="/profil">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 hover-elevate mb-1"
                      onClick={() => onOpenChange(false)}
                      data-testid="menu-profil"
                    >
                      <User className="w-5 h-5" />
                      <span>Mon Profil</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 hover-elevate text-red-600 dark:text-red-500"
                    onClick={() => {
                      onOpenChange(false);
                      handleLogout();
                    }}
                    data-testid="menu-logout"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Se déconnecter</span>
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
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