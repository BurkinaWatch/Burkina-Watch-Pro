import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Building2, Landmark, CreditCard, Globe, Mail, Star, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Banque {
  id: string;
  nom: string;
  sigle: string;
  type: "Banque" | "Caisse Populaire" | "Microfinance" | "Établissement Financier";
  categorie: "Commerciale" | "Agricole" | "Postale" | "Régionale" | "Microfinance";
  adresse: string;
  quartier: string;
  ville: string;
  region: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  horaires: string;
  services: string[];
  hasGAB: boolean;
  nombreAgences?: number;
  nombreGAB?: number;
  importanceSystemique?: boolean;
}

const typeColors: Record<string, string> = {
  "Banque": "bg-blue-600 text-white",
  "Caisse Populaire": "bg-green-600 text-white",
  "Microfinance": "bg-amber-600 text-white",
  "Établissement Financier": "bg-purple-600 text-white"
};

const categorieColors: Record<string, string> = {
  "Commerciale": "bg-blue-500 text-white",
  "Agricole": "bg-green-500 text-white",
  "Postale": "bg-orange-500 text-white",
  "Régionale": "bg-teal-500 text-white",
  "Microfinance": "bg-amber-500 text-white"
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
  "Banque",
  "Caisse Populaire",
  "Microfinance"
];

const categories = [
  "Commerciale",
  "Agricole",
  "Postale",
  "Régionale",
  "Microfinance"
];

function createBanqueIcon(type: string, hasGAB: boolean, importanceSystemique?: boolean) {
  const color = type === "Banque" ? "#2563EB" :
                type === "Caisse Populaire" ? "#16A34A" :
                type === "Microfinance" ? "#D97706" :
                "#7C3AED";

  const ringColor = importanceSystemique ? "#EF4444" : "white";
  const gabIndicator = hasGAB ? `<circle cx="18" cy="6" r="4" fill="#10B981" stroke="white" stroke-width="1"/>` : "";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="${ringColor}" stroke-width="2"/>
      <path d="M12 5v2M12 17v2M7 10h10M7 14h10" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <rect x="8" y="8" width="8" height="8" rx="1" stroke="white" stroke-width="1.5" fill="none"/>
      ${gabIndicator}
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-banque-icon",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function Banques() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showGABOnly, setShowGABOnly] = useState(false);
  const [showSystemiqueOnly, setShowSystemiqueOnly] = useState(false);
  const [selectedBanque, setSelectedBanque] = useState<Banque | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.3714, -1.5197]);
  const [mapZoom, setMapZoom] = useState(7);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const { data: banques = [], isLoading, refetch } = useQuery<Banque[]>({
    queryKey: ["/api/banques"],
  });

  const { data: stats } = useQuery<{
    total: number;
    banques: number;
    caissesPopulaires: number;
    microfinance: number;
    avecGAB: number;
    totalGAB: number;
    totalAgences: number;
    importanceSystemique: number;
    parType: Record<string, number>;
    parCategorie: Record<string, number>;
    parRegion: Record<string, number>;
    nombreVilles: number;
  }>({
    queryKey: ["/api/banques/stats"],
  });

  const filteredBanques = useMemo(() => {
    let result = banques;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.nom.toLowerCase().includes(query) ||
        b.sigle.toLowerCase().includes(query) ||
        b.ville.toLowerCase().includes(query) ||
        b.quartier.toLowerCase().includes(query) ||
        b.adresse.toLowerCase().includes(query) ||
        b.type.toLowerCase().includes(query) ||
        b.services.some(s => s.toLowerCase().includes(query))
      );
    }

    if (selectedRegion !== "all") {
      result = result.filter(b => b.region === selectedRegion);
    }

    if (selectedType !== "all") {
      result = result.filter(b => b.type === selectedType);
    }

    if (showGABOnly) {
      result = result.filter(b => b.hasGAB);
    }

    if (showSystemiqueOnly) {
      result = result.filter(b => b.importanceSystemique);
    }

    return result;
  }, [banques, searchQuery, selectedRegion, selectedType, showGABOnly, showSystemiqueOnly]);

  const handleBanqueClick = useCallback((banque: Banque) => {
    setSelectedBanque(banque);
    setMapCenter([banque.latitude, banque.longitude]);
    setMapZoom(15);
  }, []);

  const handleCall = (telephone?: string) => {
    if (telephone) {
      window.location.href = `tel:${telephone}`;
    }
  };

  const handleNavigate = (banque: Banque) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${banque.latitude},${banque.longitude}`;
    window.open(url, "_blank");
  };

  const handleWebsite = (siteWeb?: string) => {
    if (siteWeb) {
      const url = siteWeb.startsWith("http") ? siteWeb : `https://${siteWeb}`;
      window.open(url, "_blank");
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Actualisation",
        description: "Donnees des banques actualisees",
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
              <Landmark className="h-6 w-6 text-blue-500" />
              Banques et Caisses Populaires
            </h1>
            <p className="text-sm text-muted-foreground">
              {stats?.total || 0} etablissements financiers - {stats?.totalGAB || 0} GAB au Burkina Faso
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
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.banques || 0}</p>
              <p className="text-xs text-muted-foreground">Banques</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.caissesPopulaires || 0}</p>
              <p className="text-xs text-muted-foreground">Caisses Populaires</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats?.totalGAB || 0}</p>
              <p className="text-xs text-muted-foreground">GAB disponibles</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats?.importanceSystemique || 0}</p>
              <p className="text-xs text-muted-foreground">EBIS (Systemique)</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une banque..."
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

            <div className="flex gap-2">
              <Button
                variant={showGABOnly ? "default" : "outline"}
                onClick={() => setShowGABOnly(!showGABOnly)}
                className="flex-1"
                data-testid="button-gab-filter"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                GAB
              </Button>
              <Button
                variant={showSystemiqueOnly ? "default" : "outline"}
                onClick={() => setShowSystemiqueOnly(!showSystemiqueOnly)}
                className="flex-1"
                data-testid="button-ebis-filter"
              >
                <Star className="h-4 w-4 mr-1" />
                EBIS
              </Button>
            </div>
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
                {filteredBanques.map(banque => (
                  <Marker
                    key={banque.id}
                    position={[banque.latitude, banque.longitude]}
                    icon={createBanqueIcon(banque.type, banque.hasGAB, banque.importanceSystemique)}
                    eventHandlers={{
                      click: () => handleBanqueClick(banque)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[220px]">
                        <h3 className="font-bold text-sm mb-1">{banque.nom}</h3>
                        <div className="flex gap-1 mb-2 flex-wrap">
                          <Badge className={`${typeColors[banque.type] || "bg-gray-500 text-white"} text-xs`}>
                            {banque.type}
                          </Badge>
                          {banque.hasGAB && (
                            <Badge className="bg-emerald-500 text-white text-xs">GAB</Badge>
                          )}
                          {banque.importanceSystemique && (
                            <Badge className="bg-red-500 text-white text-xs">EBIS</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{banque.adresse}</p>
                        <p className="text-xs text-gray-500">{banque.quartier}, {banque.ville}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {banque.telephone && (
                            <Button size="sm" variant="outline" onClick={() => handleCall(banque.telephone)}>
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleNavigate(banque)}>
                            <Navigation className="h-3 w-3" />
                          </Button>
                          {banque.siteWeb && (
                            <Button size="sm" variant="outline" onClick={() => handleWebsite(banque.siteWeb)}>
                              <Globe className="h-3 w-3" />
                            </Button>
                          )}
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
            {filteredBanques.length} etablissement{filteredBanques.length !== 1 ? "s" : ""} trouve{filteredBanques.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBanques.map(banque => (
              <Card 
                key={banque.id} 
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedBanque?.id === banque.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleBanqueClick(banque)}
                data-testid={`card-banque-${banque.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base line-clamp-2">{banque.nom}</CardTitle>
                      <p className="text-sm text-muted-foreground font-medium">{banque.sigle}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Badge className={`${typeColors[banque.type] || "bg-gray-500 text-white"} text-xs`}>
                        {banque.type}
                      </Badge>
                      {banque.importanceSystemique && (
                        <Badge className="bg-red-500 text-white text-xs">EBIS</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground">{banque.adresse}</p>
                      <p className="text-muted-foreground text-xs">{banque.quartier}, {banque.ville}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{banque.horaires}</span>
                  </div>

                  {banque.hasGAB && banque.nombreGAB && banque.nombreGAB > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald-500 rounded-full p-1.5">
                            <CreditCard className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              {banque.nombreGAB} GAB disponible{banque.nombreGAB > 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500">
                              Retrait 24h/24
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500 text-white text-xs">
                          GAB
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs">
                    {banque.nombreAgences && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Building2 className="h-4 w-4" />
                        <span>{banque.nombreAgences} agences</span>
                      </div>
                    )}
                  </div>

                  {banque.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {banque.services.slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      {banque.services.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{banque.services.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 flex-wrap">
                    {banque.telephone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(banque.telephone);
                        }}
                        data-testid={`button-call-${banque.id}`}
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
                        handleNavigate(banque);
                      }}
                      data-testid={`button-navigate-${banque.id}`}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Y aller
                    </Button>
                    {banque.siteWeb && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWebsite(banque.siteWeb);
                        }}
                        data-testid={`button-website-${banque.id}`}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredBanques.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune banque trouvee</h3>
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
