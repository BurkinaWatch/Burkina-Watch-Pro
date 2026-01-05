import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, Bell, LogIn, User, EyeOff, Eye } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useStealthMode } from "./StealthModeProvider";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import HamburgerMenu from "./HamburgerMenu";
import LanguageSelector from "./LanguageSelector";
import BurkinaWatchLogo from "./BurkinaWatchLogo";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { playNotificationSound } from "@/lib/notificationSound";
import { OfflineIndicator } from "./OfflineIndicator";

interface HeaderProps {
  onMenuClick?: () => void;
  showNotifications?: boolean;
  showLogout?: boolean;
}

function UnreadBadge() {
  const prevCountRef = useRef<number>(0);
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (data && data.count > prevCountRef.current && prevCountRef.current !== 0) {
      playNotificationSound();
    }
    if (data) {
      prevCountRef.current = data.count;
    }
  }, [data]);

  if (!data || data.count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
      {data.count > 9 ? '9+' : data.count}
    </span>
  );
}

export default function Header({ onMenuClick, showNotifications = true, showLogout = true }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { isStealthMode, toggleStealthMode } = useStealthMode();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();

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
              className="relative group hover:bg-gradient-to-r hover:from-primary/20 hover:to-destructive/20 transition-all duration-300 hover:scale-110 hover:shadow-lg border-2 border-transparent hover:border-primary/30"
              data-testid="button-hamburger-menu"
            >
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
              <Menu className="h-6 w-6 group-hover:text-primary transition-colors" />
            </Button>
            <Link href="/">
              <button
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <BurkinaWatchLogo size={40} />
                <div className="flex flex-col min-w-0">
                  <h1 className="text-sm sm:text-base md:text-xl font-extrabold text-red-600 dark:text-red-400 tracking-tight">{t("header.title")}</h1>
                  <p className="text-xs sm:text-sm font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                    <span className="text-red-500 dark:text-red-400">{t("header.slogan.see")}</span>
                    <span className="hidden sm:inline"> </span>
                    <span className="text-yellow-500 dark:text-yellow-300">{t("header.slogan.act")}</span>
                    <span className="hidden sm:inline"> </span>
                    <span className="text-green-500 dark:text-green-400">{t("header.slogan.protect")}</span>
                  </p>
                </div>
              </button>
            </Link>
          </div>

        <div className="flex items-center gap-2">
          <OfflineIndicator />
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
              <span className="hidden sm:inline">{t("header.loginButton")}</span>
            </Button>
          )}
          <LanguageSelector />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            data-testid="button-theme-toggle"
            title={theme === "dark" ? "Passer au mode clair" : "Passer au mode sombre"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

        </div>
      </div>
    </header>
    </>
  );
}