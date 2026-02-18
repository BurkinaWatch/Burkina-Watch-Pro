import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { StealthModeProvider } from "@/components/StealthModeProvider";
import { HelmetProvider } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { InteractiveTutorial } from "@/components/InteractiveTutorial";
import { WifiOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import "./i18n/config";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useOfflineCache } from "./hooks/useOfflineCache";
import { OnboardingProvider } from "./hooks/use-onboarding";

const Home = lazy(() => import("@/pages/Home"));
const Feed = lazy(() => import("@/pages/Feed"));
const Carte = lazy(() => import("@/pages/Carte"));
const Publier = lazy(() => import("@/pages/Publier"));
const SOS = lazy(() => import("@/pages/SOS"));
const SOSPublier = lazy(() => import("@/pages/SOSPublier"));
const SignalementDetail = lazy(() => import("@/pages/SignalementDetail"));
const Profil = lazy(() => import("@/pages/Profil"));
const ProfilPublic = lazy(() => import("@/pages/ProfilPublic"));
const APropos = lazy(() => import("@/pages/APropos"));
const Conditions = lazy(() => import("@/pages/Conditions"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const TrackingLive = lazy(() => import("@/pages/TrackingLive"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Contribuer = lazy(() => import("@/pages/Contribuer"));
const PharmaciesDuFaso = lazy(() => import("@/pages/PharmaciesDuFaso"));
const Urgences = lazy(() => import("@/pages/Urgences"));
const Bulletin = lazy(() => import("@/pages/Bulletin"));
const Events = lazy(() => import("@/pages/Events"));
const StreetView = lazy(() => import("@/pages/StreetView"));
const Ouaga3D = lazy(() => import("@/pages/Ouaga3D"));
const Restaurants = lazy(() => import("@/pages/Restaurants"));
const BoutiquesMarchés = lazy(() => import("@/pages/BoutiquesMarchés"));
const Marches = lazy(() => import("@/pages/Marches"));
const Boutiques = lazy(() => import("@/pages/Boutiques"));
const Banques = lazy(() => import("@/pages/Banques"));
const Stations = lazy(() => import("@/pages/Stations"));
const LiveTrack = lazy(() => import("@/pages/LiveTrack"));
const Gares = lazy(() => import("@/pages/Gares"));
const Hopitaux = lazy(() => import("@/pages/Hopitaux"));
const Universites = lazy(() => import("@/pages/Universites"));
const Cine = lazy(() => import("@/pages/Cine"));
const Weather = lazy(() => import("@/pages/Weather"));
const Hotels = lazy(() => import("@/pages/Hotels"));
const Fiabilite = lazy(() => import("@/pages/Fiabilite"));
const Confidentialite = lazy(() => import("@/pages/Confidentialite"));
const Connexion = lazy(() => import("@/pages/Connexion"));
const NotFound = lazy(() => import("@/pages/not-found"));
const ChatBot = lazy(() => import("@/components/ChatBot"));
const StationsService = lazy(() => import("@/pages/StationsService"));
const Landing = lazy(() => import("@/pages/Landing"));
const Guide = lazy(() => import("@/pages/Guide"));
const Cimetieres = lazy(() => import("@/pages/Cimetieres"));
const SonabelOnea = lazy(() => import("@/pages/SonabelOnea"));
const MairiesPrefectures = lazy(() => import("@/pages/MairiesPrefectures"));
const Telephonie = lazy(() => import("@/pages/Telephonie"));
const Ministeres = lazy(() => import("@/pages/Ministeres"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/feed" component={Feed} />
        <Route path="/fil-actualite" component={Feed} />
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
        <Route path="/pharmacies" component={PharmaciesDuFaso} />
        <Route path="/pharmacies-ii" component={PharmaciesDuFaso} />
        <Route path="/pharmacies-garde" component={PharmaciesDuFaso} />
        <Route path="/urgences" component={Urgences} />
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
        <Route path="/hotels" component={Hotels} />
        <Route path="/cimetieres" component={Cimetieres} />
        <Route path="/sonabel-onea" component={SonabelOnea} />
        <Route path="/mairies-prefectures" component={MairiesPrefectures} />
        <Route path="/telephonie" component={Telephonie} />
        <Route path="/ministeres" component={Ministeres} />
        <Route path="/a-propos" component={APropos} />
        <Route path="/fiabilite" component={Fiabilite} />
        <Route path="/conditions" component={Conditions} />
        <Route path="/confidentialite" component={Confidentialite} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/track/:shareToken" component={LiveTrack} />
        <Route path="/connexion" component={Connexion} />
        <Route path="/login" component={Connexion} />
        <Route path="/guide" component={Guide} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
  useOfflineCache();

  return (
    <>
      <Toaster />
      <OfflineIndicator />
      <Router />
      <Suspense fallback={null}>
        <ChatBot />
      </Suspense>
      <PWAInstallPrompt />
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
              <OnboardingProvider>
                <AppContent />
              </OnboardingProvider>
            </TooltipProvider>
          </StealthModeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
