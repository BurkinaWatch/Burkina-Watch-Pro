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
import Pharmacies from "@/pages/Pharmacies";
import Urgences from "@/pages/Urgences";
import Bulletin from "@/pages/Bulletin";
import Events from "@/pages/Events";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useOnlineStatus } from "./hooks/useOnlineStatus";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/feed" component={Feed} />
      <Route path="/signalement/:id" component={SignalementDetail} />
      <Route path="/carte" component={Carte} />
      <Route path="/publier" component={Publier} />
      <Route path="/sos" component={SOS} />
      <Route path="/sos/publier" component={SOSPublier} />
      <Route path="/profil" component={Profil} />
      <Route path="/profil/:userId" component={ProfilPublic} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/classement" component={Leaderboard} />
      <Route path="/tracking-live" component={TrackingLive} />
      <Route path="/contribuer" component={Contribuer} />
      <Route path="/pharmacies" component={Pharmacies} />
      <Route path="/urgences" component={Urgences} />
      <Route path="/bulletin" component={Bulletin} />
      <Route path="/events" component={Events} />
      <Route path="/a-propos" component={APropos} />
      <Route path="/conditions" component={Conditions} />
      <Route path="/notifications" component={Notifications} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  useOnlineStatus(isAuthenticated);

  return (
    <>
      <Toaster />
      <Router />
      <ChatBot />
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