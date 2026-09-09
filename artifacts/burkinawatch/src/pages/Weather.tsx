import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import WeatherAlerts from "@/components/WeatherAlerts";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CloudSun } from "lucide-react";
import { useLocation } from "wouter";

export default function Weather() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Meteo - Burkina Watch</title>
      </Helmet>
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <CloudSun className="w-8 h-8 text-primary" />
            Alertes Meteo
          </h1>
          <p className="text-muted-foreground">
            Alertes meteorologiques en temps reel pour le Burkina Faso
          </p>
        </div>

        <WeatherAlerts 
          compact={false} 
          showCities={true} 
          maxAlerts={10}
        />
      </div>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}
