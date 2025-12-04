import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, Bell, LogIn, User, EyeOff, Eye } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useStealthMode } from "./StealthModeProvider";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import HamburgerMenu from "./HamburgerMenu";
import LanguageSelector from "./LanguageSelector";
import logo from "@assets/burkina_watch_logo.png";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  onMenuClick?: () => void;
  showNotifications?: boolean;
  showLogout?: boolean;
}

function UnreadBadge() {
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  if (!data || data.count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {data.count > 9 ? '9+' : data.count}
    </span>
  );
}

export default function Header({ onMenuClick, showNotifications = true, showLogout = true }: HeaderProps) {
  const { isStealthMode, toggleStealthMode } = useStealthMode();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const handleNotificationClick = () => {
    if (location === "/notifications") {
      setLocation("/");
    } else {
      setLocation("/notifications");
    }
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const getInitials = () => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <>
      <HamburgerMenu open={menuOpen} onOpenChange={setMenuOpen} />
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              data-testid="button-menu"
            >
              <Menu className="w-5 h-5" />
            </Button>
          <Link href="/" className="flex items-center gap-3" data-testid="link-home">
            <img src={logo} alt="Burkina Watch" className="w-10 h-10" />
            <div className="hidden md:block">
              <h1 className="text-xl font-extrabold text-red-600 dark:text-red-400 tracking-tight">Burkina Watch</h1>
              <p className="text-sm font-semibold">
                <span className="text-red-500 dark:text-red-400">Voir.</span>{" "}
                <span className="text-yellow-500 dark:text-yellow-300">Agir.</span>{" "}
                <span className="text-green-500 dark:text-green-400">Protéger.</span>
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {showNotifications && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  data-testid="button-notifications" 
                  className="relative"
                  onClick={handleNotificationClick}
                >
                  <Bell className="w-5 h-5" />
                  <UnreadBadge />
                </Button>
              )}
              <Link href="/profil">
                <Button variant="ghost" size="icon" data-testid="button-profile-link">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.profileImageUrl || ""} style={{ objectFit: "cover" }} />
                    <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </Link>
            </>
          ) : (
            <Button
              size="sm"
              onClick={handleLogin}
              data-testid="button-login"
              className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Connexion</span>
            </Button>
          )}
          <LanguageSelector />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleStealthMode}
            data-testid="button-stealth-toggle"
            title={isStealthMode ? "Désactiver le mode furtif" : "Activer le mode furtif"}
          >
            {isStealthMode ? (
              <EyeOff className="w-5 h-5 text-gray-500" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </Button>
          {/* The theme toggle button is removed to enforce dark mode */}
        </div>
      </div>
    </header>
    </>
  );
}