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
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Locate, Globe, Mail, Star, Map, List } from "lucide-react";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { LocationValidator } from "@/components/LocationValidator";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { REGION_NAMES } from "@/lib/regions";

interface LieuDeCulte {
  id: string;
  nom: string;
  type: string;
  religion: string;
  denomination?: string;
  adresse: string;
  quartier: string;
  ville: string;
  region: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  email?: string;
  website?: string;
  horaires?: string;
  operateur?: string;
  capacite?: number;
  anneeConstruction?: string;
  description?: string;
  wikidata?: string;
  wikipedia?: string;
  image?: string;
  services: string[];
  source: string;
  placeId?: string;
  confirmations?: number;
  reports?: number;
}

interface ApiResponse {
  lieux: LieuDeCulte[];
  total: number;
  mosquees: number;
  eglises: number;
  traditionnels: number;
  autres: number;
}

const religionColors: Record<string, string> = {
  "Islam": "bg-emerald-600 text-white",
  "Catholique": "bg-blue-600 text-white",
  "Protestant / Evangelique": "bg-purple-600 text-white",
  "Chretien": "bg-sky-600 text-white",
  "Traditionnel": "bg-amber-700 text-white",
  "Autre": "bg-slate-600 text-white",
};

const typeColors: Record<string, string> = {
  "Mosquee": "#059669",
  "Grande Mosquee": "#047857",
  "Medersa": "#10B981",
  "Eglise": "#2563EB",
  "Cathedrale": "#1D4ED8",
  "Basilique": "#1E40AF",
  "Paroisse": "#3B82F6",
  "Chapelle": "#60A5FA",
  "Temple": "#7C3AED",
  "Lieu sacre": "#B45309",
  "Autre": "#6B7280",
};

const typeIcons: Record<string, string> = {
  "Mosquee": "M12 2C7 2 3 6 3 11s4 9 9 9 9-4 9-9S17 2 12 2zm0 3c1.1 0 2 .4 2.7 1L12 9.7 9.3 6c.7-.6 1.6-1 2.7-1z",
  "Grande Mosquee": "M12 2C7 2 3 6 3 11s4 9 9 9 9-4 9-9S17 2 12 2zm0 3c1.1 0 2 .4 2.7 1L12 9.7 9.3 6c.7-.6 1.6-1 2.7-1z",
  "Eglise": "M12 6v12M9 9h6M12 2v4",
  "Cathedrale": "M12 6v12M9 9h6M12 2v4",
  "Paroisse": "M12 6v12M9 9h6M12 2v4",
};

const regions = REGION_NAMES;

const types = [
  "Mosquee", "Grande Mosquee", "Medersa",
  "Eglise", "Cathedrale", "Basilique", "Paroisse", "Chapelle", "Temple",
  "Lieu sacre", "Autre"
];

const religions = [
  "Islam", "Catholique", "Protestant / Evangelique", "Chretien", "Traditionnel", "Autre"
];

function createCulteIcon(type: string, religion: string) {
  const color = typeColors[type] || "#6B7280";

  let symbol = "";
  if (religion === "Islam") {
    symbol = `<path d="M12 7a5 5 0 0 1 0 10A5 5 0 0 1 9 8.5" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/><circle cx="14" cy="8" r="1" fill="white"/>`;
  } else if (["Catholique", "Protestant / Evangelique", "Chretien"].includes(religion)) {
    symbol = `<path d="M12 6v12M9 9h6" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  } else if (religion === "Traditionnel") {
    symbol = `<path d="M12 6v4M12 14v4M8 12h8M9 8l6 8M15 8l-6 8" stroke="white" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  } else {
    symbol = `<circle cx="12" cy="12" r="3" fill="white"/><path d="M12 6v2M12 16v2M6 12h2M16 12h2" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  }

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      ${symbol}
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-culte-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function UserLocationMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);

  if (!position) return null;

  const icon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="3" opacity="0.9"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>`,
    className: "user-location-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return <Marker position={position} icon={icon} />;
}

export default function LieuxDeCulte() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedReligion, setSelectedReligion] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  const { data: apiData, isLoading, refetch } = useQuery<ApiResponse>({
    queryKey: ["/api/lieux-de-culte"],
  });

  const lieux = apiData?.lieux || [];

  const getDistance = useCallback((lat: number, lng: number) => {
    if (!userLocation) return Infinity;
    const R = 6371;
    const dLat = (lat - userLocation[0]) * Math.PI / 180;
    const dLon = (lng - userLocation[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation[0] * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }, [userLocation]);

  const filteredLieux = useMemo(() => {
    let result = Array.isArray(lieux) ? lieux : [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.nom.toLowerCase().includes(query) ||
        l.ville.toLowerCase().includes(query) ||
        l.quartier.toLowerCase().includes(query) ||
        l.type.toLowerCase().includes(query) ||
        l.religion.toLowerCase().includes(query) ||
        (l.denomination || "").toLowerCase().includes(query)
      );
    }

    if (selectedRegion !== "all") {
      result = result.filter(l => l.region === selectedRegion);
    }
    if (selectedType !== "all") {
      result = result.filter(l => l.type === selectedType);
    }
    if (selectedReligion !== "all") {
      if (selectedReligion === "Chretien") {
        result = result.filter(l => ["Catholique", "Protestant / Evangelique", "Chretien"].includes(l.religion));
      } else {
        result = result.filter(l => l.religion === selectedReligion);
      }
    }

    if (sortByDistance && userLocation) {
      result = [...result].sort((a, b) => getDistance(a.latitude, a.longitude) - getDistance(b.latitude, b.longitude));
    } else {
      result = [...result].sort((a, b) => a.nom.localeCompare(b.nom));
    }

    return result;
  }, [lieux, searchQuery, selectedRegion, selectedType, selectedReligion, sortByDistance, userLocation, getDistance]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast({ title: "Erreur", description: "La geolocalisation n'est pas supportee par votre navigateur", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setSortByDistance(true);
        toast({ title: "Position trouvee", description: "Lieux de culte tries par proximite" });
      },
      () => {
        toast({ title: "Erreur", description: "Impossible d'obtenir votre position", variant: "destructive" });
      }
    );
  };

  const handleNavigate = useCallback((lieu: LieuDeCulte) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lieu.latitude},${lieu.longitude}`;
    window.open(url, "_blank");
  }, []);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({ title: "Actualisation", description: "Donnees des lieux de culte actualisees" });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'actualiser les donnees", variant: "destructive" });
    }
  };

  const formatDistance = (km: number) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Eglises & Mosquees - Burkina Watch</title>
        <meta name="description" content="Annuaire des lieux de culte au Burkina Faso - Mosquees, eglises, cathedrales, paroisses, temples et lieux sacres" />
        <meta property="og:title" content="Eglises & Mosquees - Burkina Watch" />
        <meta property="og:description" content="Annuaire des lieux de culte au Burkina Faso - Mosquees, eglises, cathedrales, paroisses, temples" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="/lieux-de-culte" />
        <meta name="twitter:card" content="summary" />
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
              Eglises & Mosquees
            </h1>
            <p className="text-sm text-muted-foreground">
              Lieux de culte du Burkina Faso via OpenStreetMap
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Card
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedReligion === "Islam" ? "ring-2 ring-emerald-500" : ""}`}
            onClick={() => setSelectedReligion(selectedReligion === "Islam" ? "all" : "Islam")}
            data-testid="card-stat-mosquees"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground">Mosquees</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-mosquees-count">{apiData?.mosquees || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedReligion === "Chretien" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedReligion(selectedReligion === "Chretien" ? "all" : "Chretien")}
            data-testid="card-stat-eglises"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground">Eglises</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-eglises-count">{apiData?.eglises || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedReligion === "Traditionnel" ? "ring-2 ring-amber-500" : ""}`}
            onClick={() => setSelectedReligion(selectedReligion === "Traditionnel" ? "all" : "Traditionnel")}
            data-testid="card-stat-traditionnels"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground">Traditionnels</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-traditionnels-count">{apiData?.traditionnels || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-50">
            <div className="relative flex gap-2 md:col-span-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un lieu de culte, une ville..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <VoiceSearchInput onQueryChange={setSearchQuery} />
            </div>

            <div className="relative z-50">
              <Select value={selectedReligion} onValueChange={setSelectedReligion}>
                <SelectTrigger data-testid="select-religion">
                  <SelectValue placeholder="Toutes religions" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">Toutes religions</SelectItem>
                  {religions.map(r => (
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

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative z-40">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[200px]" data-testid="select-region">
                  <SelectValue placeholder="Toutes les regions" />
                </SelectTrigger>
                <SelectContent className="z-[50]">
                  <SelectItem value="all">Toutes les regions</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={handleLocateMe} data-testid="button-locate">
              <Locate className="h-4 w-4 mr-1" />
              Les plus proches
            </Button>

            <div className="ml-auto flex gap-1">
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("map")}
                data-testid="button-view-map"
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 mt-6">
          <h2 className="text-lg font-semibold" data-testid="text-results-count">
            {filteredLieux.length} lieu{filteredLieux.length !== 1 ? "x" : ""} de culte trouve{filteredLieux.length !== 1 ? "s" : ""}
          </h2>
          {sortByDistance && (
            <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => setSortByDistance(false)}>
              <Locate className="h-3 w-3 mr-1" />
              Tri par proximite
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : viewMode === "map" ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[500px] md:h-[600px]">
                <MapContainer
                  center={[12.3714, -1.5197]}
                  zoom={7}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <UserLocationMarker position={userLocation} />
                  {filteredLieux.slice(0, 500).map(lieu => (
                    <Marker
                      key={lieu.id}
                      position={[lieu.latitude, lieu.longitude]}
                      icon={createCulteIcon(lieu.type, lieu.religion)}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <p className="font-bold text-sm">{lieu.nom}</p>
                          <p className="text-xs text-gray-600">{lieu.type} - {lieu.religion}</p>
                          <p className="text-xs mt-1">{lieu.quartier}, {lieu.ville}</p>
                          {lieu.telephone && <p className="text-xs mt-1">Tel: {lieu.telephone}</p>}
                          {lieu.horaires && <p className="text-xs mt-1">Horaires: {lieu.horaires}</p>}
                          {userLocation && (
                            <p className="text-xs mt-1 font-medium text-blue-600">
                              {formatDistance(getDistance(lieu.latitude, lieu.longitude))}
                            </p>
                          )}
                          <button
                            className="text-xs text-blue-600 underline mt-1"
                            onClick={() => handleNavigate(lieu)}
                            data-testid={`button-popup-navigate-${lieu.id}`}
                          >
                            Itineraire
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLieux.map(lieu => (
              <Card key={lieu.id} className="hover-elevate" data-testid={`card-lieu-${lieu.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`${religionColors[lieu.religion] || religionColors["Autre"]} text-xs`}>
                          {lieu.religion}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {lieu.type}
                        </Badge>
                        {lieu.denomination && (
                          <Badge variant="secondary" className="text-xs">
                            {lieu.denomination}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base leading-tight">{lieu.nom}</CardTitle>
                    </div>
                    {sortByDistance && userLocation && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Navigation className="h-3 w-3 mr-1" />
                        {formatDistance(getDistance(lieu.latitude, lieu.longitude))}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-xs">{lieu.quartier}, {lieu.ville} - {lieu.region}</span>
                  </div>

                  {lieu.horaires && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">{lieu.horaires}</span>
                    </div>
                  )}

                  {lieu.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">{lieu.telephone}</span>
                    </div>
                  )}

                  {lieu.operateur && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">Gestionnaire: {lieu.operateur}</span>
                    </div>
                  )}

                  {lieu.description && (
                    <p className="text-xs text-muted-foreground italic">{lieu.description}</p>
                  )}

                  {lieu.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {lieu.services.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    {lieu.telephone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.location.href = `tel:${lieu.telephone}`}
                        data-testid={`button-call-${lieu.id}`}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Appeler
                      </Button>
                    )}
                    {lieu.website && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(lieu.website, "_blank")}
                        data-testid={`button-website-${lieu.id}`}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        Site web
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleNavigate(lieu)}
                      data-testid={`button-navigate-${lieu.id}`}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Itineraire
                    </Button>
                  </div>

                  {lieu.placeId && (
                    <LocationValidator
                      placeId={lieu.placeId}
                      initialConfirmations={lieu.confirmations || 0}
                      initialReports={lieu.reports || 0}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredLieux.length === 0 && (
          <Card className="p-12 text-center">
            <CardContent>
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun lieu de culte trouve</h3>
              <p className="text-sm text-muted-foreground">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNav />
      <EmergencyPanel />
    </div>
  );
}
