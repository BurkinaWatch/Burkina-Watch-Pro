import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Store, Users, Calendar, ShoppingBasket, Locate, Building } from "lucide-react";
import PageStatCard from "@/components/PageStatCard";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Marche {
  id: string;
  nom: string;
  type: string;
  adresse: string;
  quartier: string;
  ville: string;
  region: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  joursOuverture: string[];
  horaires: string;
  produits: string[];
  infrastructures: string[];
  nombreCommercants?: number;
  superficie?: string;
  dateCreation?: string;
}

const typeColors: Record<string, string> = {
  "Central": "bg-amber-600 text-white",
  "Quartier": "bg-green-600 text-white",
  "Hebdomadaire": "bg-blue-600 text-white",
  "Bétail": "bg-orange-700 text-white",
  "Gros": "bg-purple-600 text-white",
  "Artisanal": "bg-orange-500 text-white",
  "Fruits et Légumes": "bg-lime-600 text-white"
};

const regions = [
  "Centre",
  "Hauts-Bassins",
  "Boucle du Mouhoun",
  "Centre-Nord",
  "Centre-Ouest",
  "Centre-Est",
  "Centre-Sud",
  "Est",
  "Nord",
  "Sahel",
  "Sud-Ouest",
  "Cascades",
  "Plateau-Central"
];

const types = [
  "Central",
  "Quartier",
  "Hebdomadaire",
  "Bétail",
  "Gros",
  "Artisanal",
  "Fruits et Légumes"
];

function createMarcheIcon(type: string) {
  const color = type === "Central" ? "#D97706" :
                type === "Quartier" ? "#16A34A" :
                type === "Hebdomadaire" ? "#2563EB" :
                type === "Bétail" ? "#C2410C" :
                type === "Gros" ? "#9333EA" :
                type === "Artisanal" ? "#F97316" :
                "#65A30D";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <path d="M7 17V9h10v8M7 9l5-4l5 4" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-marche-icon",
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

export default function Marches() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedMarche, setSelectedMarche] = useState<Marche | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.3714, -1.5197]);
  const [mapZoom, setMapZoom] = useState(7);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNearestOnly, setShowNearestOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
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

  const handleNearestFilter = useCallback(() => {
    if (showNearestOnly) {
      setShowNearestOnly(false);
      return;
    }
    if (userLocation) {
      setShowNearestOnly(true);
      return;
    }
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setShowNearestOnly(true);
          setIsLocating(false);
          toast({ title: "Position trouvee", description: "Affichage des marches les plus proches" });
        },
        () => {
          setIsLocating(false);
          toast({ title: "Erreur de localisation", description: "Impossible d'obtenir votre position", variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      toast({ title: "Non supporte", description: "Geolocalisation non supportee", variant: "destructive" });
    }
  }, [showNearestOnly, userLocation, toast]);

  const { data: marches = [], isLoading, refetch } = useQuery<Marche[]>({
    queryKey: ["/api/marches"],
  });

  const { data: stats } = useQuery<{
    total: number;
    totalCommercants: number;
    parType: Record<string, number>;
    parRegion: Record<string, number>;
    nombreVilles: number;
  }>({
    queryKey: ["/api/marches/stats"],
  });

  const filteredMarches = useMemo(() => {
    let result = marches;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.nom.toLowerCase().includes(query) ||
        m.ville.toLowerCase().includes(query) ||
        m.quartier.toLowerCase().includes(query) ||
        m.adresse.toLowerCase().includes(query) ||
        m.type.toLowerCase().includes(query) ||
        m.produits.some(p => p.toLowerCase().includes(query))
      );
    }

    if (selectedRegion !== "all") {
      result = result.filter(m => m.region === selectedRegion);
    }

    if (selectedType !== "all") {
      result = result.filter(m => m.type === selectedType);
    }

    if (showNearestOnly && userLocation) {
      result = result
        .map(m => ({
          ...m,
          distance: calculateDistance(userLocation.lat, userLocation.lng, m.latitude, m.longitude)
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20);
    }

    return result;
  }, [marches, searchQuery, selectedRegion, selectedType, showNearestOnly, userLocation, calculateDistance]);

  const handleMarcheClick = useCallback((marche: Marche) => {
    setSelectedMarche(marche);
    setMapCenter([marche.latitude, marche.longitude]);
    setMapZoom(15);
  }, []);

  const handleCall = (telephone?: string) => {
    if (telephone) {
      window.location.href = `tel:${telephone}`;
    }
  };

  const handleNavigate = (marche: Marche) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${marche.latitude},${marche.longitude}`;
    window.open(url, "_blank");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Actualisation",
        description: "Donnees des marches actualisees",
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
              <Store className="h-6 w-6 text-amber-500" />
              Marches
            </h1>
            <p className="text-sm text-muted-foreground">
              {stats?.total || 0} marches dans {stats?.nombreVilles || 0} villes du Burkina Faso
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <PageStatCard
            title="Total marches"
            value={stats?.total || 0}
            icon={Store}
            description={`Dans ${stats?.nombreVilles || 0} villes`}
            variant="amber"
          />
          <PageStatCard
            title="Marches de quartier"
            value={stats?.parType?.["Quartier"] || 0}
            icon={Building}
            description="Proximite"
            variant="green"
          />
          <PageStatCard
            title="Hebdomadaires"
            value={stats?.parType?.["Hebdomadaire"] || 0}
            icon={Calendar}
            description="Jours fixes"
            variant="blue"
          />
          <PageStatCard
            title="Commercants"
            value={stats?.totalCommercants || 0}
            icon={Users}
            description="Acteurs economiques"
            variant="purple"
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un marche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
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
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">Tous les types</SelectItem>
                  {types.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button
              variant={showNearestOnly ? "default" : "outline"}
              onClick={handleNearestFilter}
              disabled={isLocating}
              data-testid="button-nearest-filter"
            >
              {isLocating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Locate className="h-4 w-4 mr-2" />
              )}
              {showNearestOnly ? "Voir tout" : "Les plus proches"}
            </Button>
            {showNearestOnly && (
              <Badge className="bg-primary text-white self-center">
                20 plus proches
              </Badge>
            )}
          </div>

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
                {filteredMarches.map(marche => (
                  <Marker
                    key={marche.id}
                    position={[marche.latitude, marche.longitude]}
                    icon={createMarcheIcon(marche.type)}
                    eventHandlers={{
                      click: () => handleMarcheClick(marche)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-sm mb-1">{marche.nom}</h3>
                        <Badge className={`${typeColors[marche.type] || "bg-gray-500 text-white"} text-xs mb-2`}>
                          {marche.type}
                        </Badge>
                        <p className="text-xs text-gray-600 mb-1">{marche.adresse}</p>
                        <p className="text-xs text-gray-500">{marche.quartier}, {marche.ville}</p>
                        <div className="flex gap-2 mt-2">
                          {marche.telephone && (
                            <Button size="sm" variant="outline" onClick={() => handleCall(marche.telephone)}>
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleNavigate(marche)}>
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

        <div className="flex items-center justify-between mb-4 mt-6">
          <h2 className="text-lg font-semibold">
            {filteredMarches.length} marche{filteredMarches.length !== 1 ? "s" : ""} trouve{filteredMarches.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarches.map(marche => (
              <Card 
                key={marche.id} 
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedMarche?.id === marche.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleMarcheClick(marche)}
                data-testid={`card-marche-${marche.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{marche.nom}</CardTitle>
                    <Badge className={`${typeColors[marche.type] || "bg-gray-500 text-white"} text-xs shrink-0`}>
                      {marche.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(marche as any).distance !== undefined && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2">
                      <Locate className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {(marche as any).distance < 1 
                          ? `${Math.round((marche as any).distance * 1000)} m` 
                          : `${(marche as any).distance.toFixed(1)} km`}
                      </span>
                      <span className="text-xs text-muted-foreground">de vous</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground">{marche.adresse}</p>
                      <p className="text-muted-foreground text-xs">{marche.quartier}, {marche.ville}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{marche.horaires}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground text-xs">{marche.joursOuverture.join(", ")}</span>
                  </div>

                  {marche.produits.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {marche.produits.slice(0, 4).map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                      {marche.produits.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{marche.produits.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {marche.nombreCommercants && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {marche.nombreCommercants.toLocaleString()} commercants
                      </span>
                    )}
                    {marche.superficie && (
                      <span>{marche.superficie}</span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {marche.telephone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(marche.telephone);
                        }}
                        data-testid={`button-call-${marche.id}`}
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
                        handleNavigate(marche);
                      }}
                      data-testid={`button-navigate-${marche.id}`}
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

        {filteredMarches.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun marche trouve</h3>
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
