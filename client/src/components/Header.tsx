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
  const { isStealthMode, toggleStealthMode } = useStealthMode();
  const { isAuthenticated, user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();

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
        <div className="flex h-16 items-center px-4 md:px-6">
          <Button
            variant="ghost"
            size="default"
            onClick={() => setMenuOpen(true)}
            className="relative group hover:bg-gradient-to-r hover:from-primary/20 hover:to-destructive/20 transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-primary/30 gap-2 px-3"
            data-testid="button-hamburger-menu"
          >
            <div className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-ping" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            <Menu className="h-5 w-5 group-hover:text-primary transition-colors" />
            <span className="font-bold text-[11px] xs:text-xs sm:text-sm uppercase tracking-wider block">
              {t("header.menu") || "Menu"}
            </span>
          </Button>
        </div>
      </header>
    </>
  );
}