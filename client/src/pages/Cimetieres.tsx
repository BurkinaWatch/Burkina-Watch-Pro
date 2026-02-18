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
import { Search, MapPin, Clock, Navigation, ArrowLeft, RefreshCw, Locate, Cross, Globe, Users, Landmark } from "lucide-react";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { LocationValidator } from "@/components/LocationValidator";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { REGION_NAMES } from "@/lib/regions";

interface Cimetiere {
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
  horaires: string;
  superficie?: string;
  gestionnaire?: string;
  religion?: string;
  denomination?: string;
  website?: string;
  placeId?: string;
  confirmations?: number;
  reports?: number;
}

const typeColors: Record<string, string> = {
  "Municipal": "bg-slate-600 text-white",
  "Musulman": "bg-emerald-600 text-white",
  "Chretien": "bg-blue-600 text-white",
  "Traditionnel": "bg-amber-700 text-white",
  "Prive": "bg-purple-600 text-white",
  "Religieux": "bg-teal-600 text-white",
};

const regions = REGION_NAMES;

const types = [
  "Municipal",
  "Musulman",
  "Chretien",
  "Traditionnel",
  "Prive",
  "Religieux",
];

function createCimetiereIcon(type: string) {
  const color = type === "Municipal" ? "#475569" :
                type === "Musulman" ? "#059669" :
                type === "Chretien" ? "#2563EB" :
                type === "Traditionnel" ? "#B45309" :
                type === "Prive" ? "#9333EA" :
                "#0D9488";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <path d="M12 6v12M9 9h6" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-cimetiere-icon",
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

export default function Cimetieres() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCimetiere, setSelectedCimetiere] = useState<Cimetiere | null>(null);
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
          toast({ title: "Position trouvee", description: "Affichage des cimetieres les plus proches" });
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

  const { data: cimetieresData, isLoading, refetch } = useQuery<{ cimetieres: Cimetiere[], total: number }>({
    queryKey: ["/api/cimetieres"],
  });

  const cimetieres = cimetieresData?.cimetieres || [];

  const stats = useMemo(() => {
    const arr = Array.isArray(cimetieres) ? cimetieres : [];
    const parType = arr.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const villes = new Set(arr.map(c => c.ville));

    return {
      total: arr.length,
      parType,
      nombreVilles: villes.size,
    };
  }, [cimetieres]);

  const filteredCimetieres = useMemo(() => {
    const arr = Array.isArray(cimetieres) ? cimetieres : [];
    let result = arr;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.nom.toLowerCase().includes(query) ||
        c.ville.toLowerCase().includes(query) ||
        c.quartier.toLowerCase().includes(query) ||
        c.adresse.toLowerCase().includes(query) ||
        c.type.toLowerCase().includes(query)
      );
    }

    if (selectedRegion !== "all") {
      result = result.filter(c => c.region === selectedRegion);
    }

    if (selectedType !== "all") {
      result = result.filter(c => c.type === selectedType);
    }

    if (showNearestOnly && userLocation) {
      result = result
        .map(c => ({
          ...c,
          distance: calculateDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude)
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20);
    }

    return result;
  }, [cimetieres, searchQuery, selectedRegion, selectedType, showNearestOnly, userLocation, calculateDistance]);

  const handleCimetiereClick = useCallback((cimetiere: Cimetiere) => {
    setSelectedCimetiere(cimetiere);
    setMapCenter([cimetiere.latitude, cimetiere.longitude]);
    setMapZoom(15);
  }, []);

  const handleNavigate = (cimetiere: Cimetiere) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${cimetiere.latitude},${cimetiere.longitude}`;
    window.open(url, "_blank");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Actualisation",
        description: "Donnees des cimetieres actualisees",
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
        <title>Cimetieres - Burkina Watch</title>
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
              <Cross className="h-6 w-6 text-slate-500" />
              Cimetieres
            </h1>
            <p className="text-sm text-muted-foreground">
              {stats?.total || 0} cimetieres dans {stats?.nombreVilles || 0} villes du Burkina Faso
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

        <div className="flex flex-wrap gap-4 mb-6">
          <Card 
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-slate-500/10 to-slate-500/5 border-slate-500/20 cursor-pointer flex-1 min-w-[140px] ${selectedType === "all" ? "ring-2 ring-slate-500" : ""}`}
            onClick={() => setSelectedType("all")}
          >
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <span className="text-2xl font-bold tracking-tight">{stats?.total || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-500/10 group-hover:scale-110 transition-transform">
                  <Cross className="w-5 h-5 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 cursor-pointer flex-1 min-w-[140px] ${selectedType === "Musulman" ? "ring-2 ring-emerald-500" : ""}`}
            onClick={() => setSelectedType("Musulman")}
          >
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Musulmans</p>
                  <span className="text-2xl font-bold tracking-tight">{stats?.parType?.["Musulman"] || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 group-hover:scale-110 transition-transform">
                  <Landmark className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 cursor-pointer flex-1 min-w-[140px] ${selectedType === "Chretien" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedType("Chretien")}
          >
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Chretiens</p>
                  <span className="text-2xl font-bold tracking-tight">{stats?.parType?.["Chretien"] || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:scale-110 transition-transform">
                  <Cross className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 flex-1 min-w-[140px]">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Villes</p>
                  <span className="text-2xl font-bold tracking-tight">{stats?.nombreVilles || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-50">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un cimetiere..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <VoiceSearchInput onQueryChange={setSearchQuery} />
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
                {Array.isArray(filteredCimetieres) && filteredCimetieres.map(cimetiere => (
                  <Marker
                    key={cimetiere.id}
                    position={[cimetiere.latitude, cimetiere.longitude]}
                    icon={createCimetiereIcon(cimetiere.type)}
                    eventHandlers={{
                      click: () => handleCimetiereClick(cimetiere)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-sm mb-1">{cimetiere.nom}</h3>
                        <Badge className={`${typeColors[cimetiere.type] || "bg-gray-500 text-white"} text-xs mb-2`}>
                          {cimetiere.type}
                        </Badge>
                        <p className="text-xs text-gray-600 mb-1">{cimetiere.adresse}</p>
                        <p className="text-xs text-gray-500">{cimetiere.quartier}, {cimetiere.ville}</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => handleNavigate(cimetiere)}>
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
            {filteredCimetieres.length} cimetiere{filteredCimetieres.length !== 1 ? "s" : ""} trouve{filteredCimetieres.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(filteredCimetieres) && filteredCimetieres.map(cimetiere => (
              <Card 
                key={cimetiere.id} 
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedCimetiere?.id === cimetiere.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleCimetiereClick(cimetiere)}
                data-testid={`card-cimetiere-${cimetiere.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{cimetiere.nom}</CardTitle>
                    <Badge className={`${typeColors[cimetiere.type] || "bg-gray-500 text-white"} text-xs shrink-0`}>
                      {cimetiere.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(cimetiere as any).distance !== undefined && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2">
                      <Locate className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {(cimetiere as any).distance < 1 
                          ? `${Math.round((cimetiere as any).distance * 1000)} m` 
                          : `${(cimetiere as any).distance.toFixed(1)} km`}
                      </span>
                      <span className="text-xs text-muted-foreground">de vous</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground">{cimetiere.adresse}</p>
                      <p className="text-muted-foreground text-xs">{cimetiere.quartier}, {cimetiere.ville}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{cimetiere.horaires}</span>
                  </div>

                  {cimetiere.gestionnaire && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground text-xs">{cimetiere.gestionnaire}</span>
                    </div>
                  )}

                  {cimetiere.religion && (
                    <div className="flex items-center gap-2 text-sm">
                      <Landmark className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground text-xs">{cimetiere.religion}{cimetiere.denomination ? ` - ${cimetiere.denomination}` : ""}</span>
                    </div>
                  )}

                  {cimetiere.superficie && (
                    <Badge variant="outline" className="text-xs">
                      {cimetiere.superficie}
                    </Badge>
                  )}

                  <LocationValidator placeId={cimetiere.placeId || cimetiere.id} initialConfirmations={cimetiere.confirmations || 0} initialReports={cimetiere.reports || 0} compact />
                  <div className="flex gap-2 pt-2">
                    {cimetiere.website && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(cimetiere.website, "_blank");
                        }}
                        data-testid={`button-website-${cimetiere.id}`}
                      >
                        <Globe className="h-4 w-4 mr-1" />
                        Site web
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(cimetiere);
                      }}
                      data-testid={`button-navigate-${cimetiere.id}`}
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

        {filteredCimetieres.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Cross className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun cimetiere trouve</h3>
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
