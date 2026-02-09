import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Fuel, Car, Store, CreditCard, Locate, Gauge } from "lucide-react";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import PageStatCard from "@/components/PageStatCard";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface StationService {
  id: string;
  nom: string;
  marque: "Barka Énergies" | "TotalEnergies" | "Shell" | "Oryx" | "SOB Petrol" | "Sonabhy" | "Star Oil" | "Nafex" | "Vivo Energy" | "Autre";
  adresse: string;
  quartier: string;
  ville: string;
  region: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  horaires: string;
  is24h: boolean;
  services: string[];
  carburants: string[];
}

const marqueColors: Record<string, string> = {
  "Barka Énergies": "bg-red-600 text-white",
  "TotalEnergies": "bg-red-600 text-white",
  "Shell": "bg-yellow-500 text-black",
  "Oryx": "bg-blue-600 text-white",
  "SOB Petrol": "bg-green-600 text-white",
  "Sonabhy": "bg-purple-600 text-white",
  "Star Oil": "bg-orange-500 text-white",
  "Nafex": "bg-teal-600 text-white",
  "Vivo Energy": "bg-red-500 text-white",
  "Autre": "bg-gray-500 text-white"
};

import { REGION_NAMES } from "@/lib/regions";

const regions = REGION_NAMES;

const marques = [
  "Barka Énergies",
  "Shell",
  "Oryx",
  "SOB Petrol",
  "Sonabhy",
  "Star Oil",
  "Nafex",
  "Vivo Energy"
];

function createStationIcon(marque: string, is24h: boolean) {
  const color = marque === "Barka Énergies" || marque === "TotalEnergies" ? "#DC2626" :
                marque === "Shell" ? "#EAB308" :
                marque === "Oryx" ? "#2563EB" :
                marque === "SOB Petrol" ? "#16A34A" :
                marque === "Sonabhy" ? "#9333EA" :
                "#6B7280";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">
        ${is24h ? "24" : "S"}
      </text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-station-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function Stations() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedMarque, setSelectedMarque] = useState("all");
  const [show24hOnly, setShow24hOnly] = useState(false);
  const [showNearestOnly, setShowNearestOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationService | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.3714, -1.5197]);
  const [mapZoom, setMapZoom] = useState(7);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [show24hDetails, setShow24hDetails] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  useEffect(() => {
    if (showNearestOnly) {
      if (!userLocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            toast({
              title: "Erreur de localisation",
              description: "Impossible d'obtenir votre position. Veuillez autoriser la geolocalisation.",
              variant: "destructive",
            });
            setShowNearestOnly(false);
          }
        );
      }
    }
  }, [showNearestOnly, userLocation, toast]);

  const { data, isLoading, refetch } = useQuery<{ stations: StationService[], lastUpdated: string }>({
    queryKey: ["/api/stations"],
  });

  const stations = data?.stations || [];

  const { data: stats } = useQuery<{
    total: number;
    par24h: number;
    parMarque: Record<string, number>;
    parRegion: Record<string, number>;
    nombreVilles: number;
  }>({
    queryKey: ["/api/stations/stats"],
  });

  const filteredStations = useMemo(() => {
    if (!Array.isArray(stations)) return [];
    let result = stations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.nom.toLowerCase().includes(query) ||
        s.ville.toLowerCase().includes(query) ||
        s.quartier.toLowerCase().includes(query) ||
        s.adresse.toLowerCase().includes(query) ||
        s.marque.toLowerCase().includes(query)
      );
    }

    if (selectedRegion !== "all") {
      result = result.filter(s => s.region === selectedRegion);
    }

    if (selectedMarque !== "all") {
      result = result.filter(s => s.marque === selectedMarque);
    }

    if (show24hOnly) {
      result = result.filter(s => s.is24h);
    }

    if (showNearestOnly && userLocation) {
      result = result
        .map(s => ({
          ...s,
          distance: calculateDistance(userLocation.lat, userLocation.lng, s.latitude, s.longitude)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20);
    }

    return result;
  }, [stations, searchQuery, selectedRegion, selectedMarque, show24hOnly, showNearestOnly, userLocation, calculateDistance]);

  const handleStationClick = useCallback((station: StationService) => {
    setSelectedStation(station);
    setMapCenter([station.latitude, station.longitude]);
    setMapZoom(15);
  }, []);

  const handleCall = (telephone?: string) => {
    if (telephone) {
      window.location.href = `tel:${telephone}`;
    }
  };

  const handleNavigate = (station: StationService) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;
    window.open(url, "_blank");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Actualisation",
        description: "Donnees des stations-service actualisees",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les donnees",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Stations - Burkina Watch</title>
      </Helmet>
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <Fuel className="h-6 w-6 text-red-500" />
              Stations-Service
            </h1>
            <p className="text-sm text-muted-foreground">
              {stats?.total || 0} stations dans {stats?.nombreVilles || 0} villes du Burkina Faso
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <PageStatCard
            title="Total stations"
            value={stats?.total || 0}
            icon={Fuel}
            description={`Dans ${stats?.nombreVilles || 0} villes`}
            variant="blue"
          />
          <PageStatCard
            title="Barka Énergies"
            value={(stats?.parMarque?.["TotalEnergies"] || 0) + (stats?.parMarque?.["Barka Énergies"] || 0)}
            icon={Gauge}
            description="Ex-TotalEnergies BF"
            variant="red"
          />
          <PageStatCard
            title="Shell"
            value={stats?.parMarque?.["Shell"] || 0}
            icon={Gauge}
            description="Reseau international"
            variant="yellow"
          />
          <PageStatCard
            title="Oryx"
            value={stats?.parMarque?.["Oryx"] || 0}
            icon={Gauge}
            description="Reseau regional"
            variant="blue"
          />
          <PageStatCard
            title="Sonabhy"
            value={stats?.parMarque?.["Sonabhy"] || 0}
            icon={Gauge}
            description="National petrolier"
            variant="purple"
          />
          <PageStatCard
            title="Ouvertes 24h/24"
            value={stats?.par24h || 0}
            icon={Clock}
            description="Cliquez pour la liste"
            variant="green"
            onClick={() => setShow24hDetails(!show24hDetails)}
            clickable
          />
        </div>

        {show24hDetails && (
          <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Stations ouvertes 24h/24
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShow24hDetails(false)}
                  data-testid="button-close-24h-details"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {stations.filter(s => s.is24h).length} stations disponibles jour et nuit
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {stations.filter(s => s.is24h).map((station) => (
                  <div 
                    key={station.id}
                    className="p-3 bg-background rounded-lg border hover-elevate cursor-pointer"
                    onClick={() => handleStationClick(station)}
                    data-testid={`card-24h-station-${station.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{station.nom}</h4>
                      <Badge className={`${marqueColors[station.marque]} text-xs shrink-0`}>
                        {station.marque}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{station.quartier}, {station.ville}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {station.telephone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(station.telephone);
                          }}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Appeler
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(station);
                        }}
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Y aller
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-50">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une station..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <VoiceSearchButton onQueryChange={setSearchQuery} />
            </div>

            <div className="relative z-50">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger data-testid="select-region">
                  <SelectValue placeholder="Toutes les regions" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">Toutes les regions</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative z-50">
              <Select value={selectedMarque} onValueChange={setSelectedMarque}>
                <SelectTrigger data-testid="select-marque">
                  <SelectValue placeholder="Toutes les marques" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">Toutes les marques</SelectItem>
                  {marques.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={show24hOnly ? "default" : "outline"}
              onClick={() => setShow24hOnly(!show24hOnly)}
              className="w-full"
              data-testid="button-24h-filter"
            >
              <Clock className="h-4 w-4 mr-2" />
              24h/24 uniquement
            </Button>
          </div>

          <Button
            variant={showNearestOnly ? "default" : "outline"}
            onClick={() => setShowNearestOnly(!showNearestOnly)}
            className="w-full"
            data-testid="button-nearest-filter"
          >
            <Locate className="h-4 w-4 mr-2" />
            {showNearestOnly ? "Voir tout" : "Les plus proches"}
          </Button>
          {showNearestOnly && (
            <Badge className="bg-primary text-primary-foreground">
              20 plus proches
            </Badge>
          )}

          <div className="h-[300px] md:h-[400px] rounded-lg border relative z-0">
            <div className="absolute inset-0 rounded-lg overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="h-full w-full"
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            {filteredStations.map(station => (
              <Marker
                key={station.id}
                position={[station.latitude, station.longitude]}
                icon={createStationIcon(station.marque, station.is24h)}
                eventHandlers={{
                  click: () => handleStationClick(station)
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-bold text-sm mb-1">{station.nom}</h3>
                    <Badge className={`${marqueColors[station.marque]} text-xs mb-2`}>
                      {station.marque}
                    </Badge>
                    {station.is24h && (
                      <Badge className="bg-green-500 text-white text-xs ml-1 mb-2">24h/24</Badge>
                    )}
                    <p className="text-xs text-gray-600 mb-1">{station.adresse}</p>
                    <p className="text-xs text-gray-500">{station.quartier}, {station.ville}</p>
                    <div className="flex gap-2 mt-2">
                      {station.telephone && (
                        <Button size="sm" variant="outline" onClick={() => handleCall(station.telephone)}>
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleNavigate(station)}>
                        <Navigation className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {filteredStations.length} station{filteredStations.length !== 1 ? "s" : ""} trouvee{filteredStations.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStations.map(station => (
              <Card 
                key={station.id} 
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedStation?.id === station.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleStationClick(station)}
                data-testid={`card-station-${station.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{station.nom}</CardTitle>
                    <div className="flex flex-col gap-1">
                      <Badge className={`${marqueColors[station.marque]} text-xs shrink-0`}>
                        {station.marque}
                      </Badge>
                      {station.is24h && (
                        <Badge className="bg-green-500 text-white text-xs shrink-0">
                          24h/24
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(station as any).distance !== undefined && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2">
                      <Locate className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {(station as any).distance < 1 
                          ? `${Math.round((station as any).distance * 1000)} m` 
                          : `${(station as any).distance.toFixed(1)} km`}
                      </span>
                      <span className="text-xs text-muted-foreground">de vous</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground">{station.adresse}</p>
                      <p className="text-muted-foreground text-xs">{station.quartier}, {station.ville}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className={station.is24h ? "text-green-600 font-medium" : "text-foreground"}>
                      {station.horaires}
                    </span>
                  </div>

                  {station.carburants.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {station.carburants.slice(0, 3).map((c, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                      {station.carburants.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{station.carburants.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {station.services.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {station.services.includes("Boutique") || station.services.includes("Boutique Bonjour") || station.services.includes("Select Shop") ? (
                        <Store className="h-3 w-3" />
                      ) : null}
                      {station.services.includes("Lavage auto") && <Car className="h-3 w-3" />}
                      {station.services.includes("ATM") && <CreditCard className="h-3 w-3" />}
                      <span>{station.services.slice(0, 2).join(", ")}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {station.telephone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(station.telephone);
                        }}
                        data-testid={`button-call-${station.id}`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Appeler
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(station);
                      }}
                      data-testid={`button-navigate-${station.id}`}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Y aller
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredStations.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Fuel className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune station trouvee</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos criteres de recherche
            </p>
          </div>
        )}
      </main>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}
