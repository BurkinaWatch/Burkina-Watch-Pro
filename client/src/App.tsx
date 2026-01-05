import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StealthModeProvider } from "@/components/StealthModeProvider";
import { HelmetProvider } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import ChatBot from "@/components/ChatBot";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import "./i18n/config";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Feed from "@/pages/Feed";
import Carte from "@/pages/Carte";
import Publier from "@/pages/Publier";
import SOS from "@/pages/SOS";
import SOSPublier from "@/pages/SOSPublier";
import SignalementDetail from "@/pages/SignalementDetail";
import Profil from "@/pages/Profil";
import ProfilPublic from "@/pages/ProfilPublic";
import APropos from "@/pages/APropos";
import Conditions from "@/pages/Conditions";
import Leaderboard from "@/pages/Leaderboard";
import TrackingLive from "@/pages/TrackingLive";
import Notifications from "@/pages/Notifications";
import Contribuer from "@/pages/Contribuer";
      <Route path="/bulletin" component={Bulletin} />
      <Route path="/events" component={Events} />
      <Route path="/streetview" component={StreetView} />
      <Route path="/ouaga3d" component={Ouaga3D} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/boutiques-marches" component={BoutiquesMarchés} />
      <Route path="/marches" component={Marches} />
      <Route path="/boutiques" component={Boutiques} />
      <Route path="/banques" component={Banques} />
      <Route path="/stations" component={Stations} />
      <Route path="/hopitaux" component={Hopitaux} />
      <Route path="/universites" component={Universites} />
      <Route path="/gares" component={Gares} />
      <Route path="/cine" component={Cine} />
      <Route path="/meteo" component={Weather} />
      <Route path="/a-propos" component={APropos} />
      <Route path="/fiabilite" component={Fiabilite} />
      <Route path="/conditions" component={Conditions} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/track/:shareToken" component={LiveTrack} />
      <Route component={NotFound} />
    </Switch>
  );
}

function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2">
      <Badge variant="destructive" className="flex items-center gap-2 px-3 py-1 shadow-lg whitespace-nowrap">
        <WifiOff className="w-4 h-4" />
        <span>Mode hors-ligne - Données mises en cache</span>
      </Badge>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  useOnlineStatus(isAuthenticated);

  return (
    <>
      <Toaster />
      <OfflineIndicator />
      <Router />
      <ChatBot />
      <InteractiveTutorial />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <StealthModeProvider>
            <TooltipProvider>
              <AppContent />
            </TooltipProvider>
          </StealthModeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
