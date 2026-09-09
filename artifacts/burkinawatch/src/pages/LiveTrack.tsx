import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Clock, User, Navigation, Loader2, RefreshCw, Phone, ArrowLeft } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TrackingData {
  isActive: boolean;
  isPanicMode: boolean;
  startTime: string;
  endTime: string | null;
  userName: string;
  locations: Array<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
    timestamp: string;
  }>;
}

function createPanicIcon() {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
      <circle cx="20" cy="20" r="18" fill="#DC2626" stroke="white" stroke-width="3">
        <animate attributeName="r" values="18;20;18" dur="1s" repeatCount="indefinite"/>
      </circle>
      <circle cx="20" cy="20" r="8" fill="white"/>
      <circle cx="20" cy="20" r="4" fill="#DC2626"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "panic-marker-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [map, center]);
  return null;
}

export default function LiveTrack() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [, navigate] = useLocation();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: trackingData, isLoading, error, refetch } = useQuery<TrackingData>({
    queryKey: ["/api/track", shareToken],
    queryFn: async () => {
      const res = await fetch(`/api/track/${shareToken}`);
      if (!res.ok) throw new Error("Session introuvable");
      return res.json();
    },
    refetchInterval: autoRefresh ? 5000 : false,
    enabled: !!shareToken,
  });

  const lastLocation = trackingData?.locations?.[trackingData.locations.length - 1];
  const mapCenter: [number, number] = lastLocation 
    ? [lastLocation.latitude, lastLocation.longitude] 
    : [12.3657, -1.5228];

  const trajectoryPoints: [number, number][] = trackingData?.locations?.map(
    loc => [loc.latitude, loc.longitude] as [number, number]
  ) || [];

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTimeSinceUpdate = () => {
    if (!lastLocation) return null;
    const diff = Date.now() - new Date(lastLocation.timestamp).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    return `${Math.floor(minutes / 60)}h`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du suivi en direct...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Session introuvable</h2>
            <p className="text-muted-foreground mb-4">
              Ce lien de suivi n'est plus valide ou a expire.
            </p>
            <Button onClick={() => navigate("/")} data-testid="button-go-home">
              Retour a l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Suivi en Direct - Burkina Watch</title>
      </Helmet>
      <div className="bg-red-600 text-white p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-red-700"
              onClick={() => navigate("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            <div>
              <h1 className="font-bold">ALERTE URGENCE</h1>
              <p className="text-sm text-red-100">Suivi en direct de {trackingData.userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {trackingData.isActive ? (
              <Badge className="bg-green-500 text-white animate-pulse">EN COURS</Badge>
            ) : (
              <Badge variant="secondary">TERMINE</Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-red-700"
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <User className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Personne</p>
              <p className="font-semibold text-sm truncate">{trackingData.userName}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Debut</p>
              <p className="font-semibold text-sm">{formatTime(trackingData.startTime)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <MapPin className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Points</p>
              <p className="font-semibold text-sm">{trackingData.locations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <RefreshCw className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs text-muted-foreground">Mise a jour</p>
              <p className="font-semibold text-sm">{getTimeSinceUpdate() || '-'}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              <span className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Position en direct
              </span>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                data-testid="button-auto-refresh"
              >
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] relative">
              <MapContainer
                center={mapCenter}
                zoom={16}
                className="h-full w-full"
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <MapUpdater center={mapCenter} />
                
                {trajectoryPoints.length > 1 && (
                  <Polyline
                    positions={trajectoryPoints}
                    color="#DC2626"
                    weight={4}
                    opacity={0.8}
                  />
                )}
                
                {lastLocation && (
                  <Marker
                    position={[lastLocation.latitude, lastLocation.longitude]}
                    icon={createPanicIcon()}
                  />
                )}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        {lastLocation && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}`,
                  '_blank'
                );
              }}
              data-testid="button-open-maps"
            >
              <Navigation className="h-4 w-4" />
              Ouvrir dans Google Maps
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                window.open(`tel:117`, '_blank');
              }}
              data-testid="button-call-emergency"
            >
              <Phone className="h-4 w-4" />
              Appeler les secours (117)
            </Button>
          </div>
        )}

        {trackingData.locations.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Historique des positions</CardTitle>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {trackingData.locations.slice().reverse().slice(0, 10).map((loc, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                  >
                    <span className="text-muted-foreground">
                      {formatTime(loc.timestamp)}
                    </span>
                    <span className="font-mono text-xs">
                      {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
