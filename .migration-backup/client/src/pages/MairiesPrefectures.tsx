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
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Locate, Building2, Mail, Globe, Landmark, Shield, Crown } from "lucide-react";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { REGION_NAMES } from "@/lib/regions";

interface Institution {
  id: string;
  nom: string;
  type: "Mairie" | "Prefecture" | "Haut-Commissariat" | "Gouvernorat";
  adresse: string;
  quartier: string;
  ville: string;
  province: string;
  region: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  telephoneSecondaire?: string;
  email?: string;
  website?: string;
  horaires: string;
  services: string[];
  responsable?: string;
  titreResponsable?: string;
}

interface ApiResponse {
  institutions: Institution[];
  total: number;
  mairieCount: number;
  prefectureCount: number;
  hautCommCount: number;
  gouvernoratCount: number;
  villesCount: number;
}

const typeColors: Record<string, string> = {
  "Gouvernorat": "bg-red-600 text-white",
  "Haut-Commissariat": "bg-purple-600 text-white",
  "Prefecture": "bg-blue-600 text-white",
  "Mairie": "bg-green-600 text-white",
};

const typeIcons: Record<string, typeof Landmark> = {
  "Gouvernorat": Crown,
  "Haut-Commissariat": Shield,
  "Prefecture": Landmark,
  "Mairie": Building2,
};

const types = [
  "Gouvernorat",
  "Haut-Commissariat",
  "Prefecture",
  "Mairie",
];

function createInstitutionIcon(type: string) {
  const colorMap: Record<string, string> = {
    "Gouvernorat": "#DC2626",
    "Haut-Commissariat": "#9333EA",
    "Prefecture": "#2563EB",
    "Mairie": "#16A34A",
  };
  const color = colorMap[type] || "#6B7280";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <path d="M12 6l4 4v6H8v-6l4-4z" fill="white" stroke="none"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-institution-icon",
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

export default function MairiesPrefectures() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.3714, -1.5197]);
  const [mapZoom, setMapZoom] = useState(7);
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
          toast({ title: "Position trouvee", description: "Affichage des institutions les plus proches" });
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

  const { data: apiData, isLoading, refetch } = useQuery<ApiResponse>({
    queryKey: ["/api/mairies-prefectures"],
  });

  const institutions = apiData?.institutions || [];

  const filteredInstitutions = useMemo(() => {
    let result = Array.isArray(institutions) ? institutions : [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.nom.toLowerCase().includes(query) ||
        i.ville.toLowerCase().includes(query) ||
        i.province.toLowerCase().includes(query) ||
        i.adresse.toLowerCase().includes(query) ||
        i.type.toLowerCase().includes(query) ||
        i.services.some(s => s.toLowerCase().includes(query))
      );
    }

    if (selectedRegion !== "all") {
      result = result.filter(i => i.region === selectedRegion);
    }

    if (selectedType !== "all") {
      result = result.filter(i => i.type === selectedType);
    }

    if (showNearestOnly && userLocation) {
      result = result
        .map(i => ({
          ...i,
          distance: calculateDistance(userLocation.lat, userLocation.lng, i.latitude, i.longitude)
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20);
    }

    return result;
  }, [institutions, searchQuery, selectedRegion, selectedType, showNearestOnly, userLocation, calculateDistance]);

  const handleInstitutionClick = useCallback((inst: Institution) => {
    setSelectedInstitution(inst);
    setMapCenter([inst.latitude, inst.longitude]);
    setMapZoom(15);
  }, []);

  const handleCall = (telephone?: string) => {
    if (telephone) {
      window.location.href = `tel:${telephone}`;
    }
  };

  const handleNavigate = (inst: Institution) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${inst.latitude},${inst.longitude}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Mairies & Prefectures - Burkina Watch</title>
        <meta name="description" content="Annuaire des mairies, prefectures, gouvernorats et hauts-commissariats du Burkina Faso" />
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
              <Landmark className="h-6 w-6 text-blue-600" />
              Mairies & Prefectures
            </h1>
            <p className="text-sm text-muted-foreground">
              {apiData?.total || 0} institutions dans {apiData?.villesCount || 0} villes du Burkina Faso
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Card
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedType === "Mairie" ? "ring-2 ring-green-500" : ""}`}
            onClick={() => setSelectedType(selectedType === "Mairie" ? "all" : "Mairie")}
            data-testid="card-stat-mairie"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Mairies</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-mairie-count">{apiData?.mairieCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-green-500/10">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedType === "Prefecture" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedType(selectedType === "Prefecture" ? "all" : "Prefecture")}
            data-testid="card-stat-prefecture"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Prefectures</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-prefecture-count">{apiData?.prefectureCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <Landmark className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedType === "Haut-Commissariat" ? "ring-2 ring-purple-500" : ""}`}
            onClick={() => setSelectedType(selectedType === "Haut-Commissariat" ? "all" : "Haut-Commissariat")}
            data-testid="card-stat-hc"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Hauts-Comm.</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-hc-count">{apiData?.hautCommCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedType === "Gouvernorat" ? "ring-2 ring-red-500" : ""}`}
            onClick={() => setSelectedType(selectedType === "Gouvernorat" ? "all" : "Gouvernorat")}
            data-testid="card-stat-gouv"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gouvernorats</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-gouv-count">{apiData?.gouvernoratCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-red-500/10">
                  <Crown className="w-5 h-5 text-red-600" />
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
                  placeholder="Rechercher une institution..."
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
                  {REGION_NAMES.map(r => (
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
                {Array.isArray(filteredInstitutions) && filteredInstitutions.map(inst => (
                  <Marker
                    key={inst.id}
                    position={[inst.latitude, inst.longitude]}
                    icon={createInstitutionIcon(inst.type)}
                    eventHandlers={{
                      click: () => handleInstitutionClick(inst)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[220px]">
                        <h3 className="font-bold text-sm mb-1">{inst.nom}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs mb-2 ${typeColors[inst.type] || "bg-gray-500 text-white"}`}>{inst.type}</span>
                        <p className="text-xs text-gray-600 mb-1">{inst.adresse}</p>
                        <p className="text-xs text-gray-500">{inst.ville}, {inst.province}</p>
                        {inst.telephone && (
                          <p className="text-xs text-gray-600 mt-1">{inst.telephone}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2" data-testid="map-legend">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              <span>Mairie</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span>Prefecture</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-600" />
              <span>Haut-Comm.</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-600" />
              <span>Gouvernorat</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 mt-6">
          <h2 className="text-lg font-semibold" data-testid="text-results-count">
            {filteredInstitutions.length} institution{filteredInstitutions.length !== 1 ? "s" : ""} trouvee{filteredInstitutions.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(filteredInstitutions) && filteredInstitutions.map(inst => {
              const TypeIcon = typeIcons[inst.type] || Building2;
              return (
                <Card
                  key={inst.id}
                  className={`cursor-pointer hover-elevate ${
                    selectedInstitution?.id === inst.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleInstitutionClick(inst)}
                  data-testid={`card-institution-${inst.id}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-2">{inst.nom}</CardTitle>
                      <Badge className={`${typeColors[inst.type] || "bg-gray-500 text-white"} text-xs shrink-0`}>
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {inst.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(inst as any).distance !== undefined && (
                      <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2">
                        <Locate className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          {(inst as any).distance < 1
                            ? `${Math.round((inst as any).distance * 1000)} m`
                            : `${(inst as any).distance.toFixed(1)} km`}
                        </span>
                        <span className="text-xs text-muted-foreground">de vous</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-foreground">{inst.adresse}</p>
                        <p className="text-muted-foreground text-xs">{inst.quartier}, {inst.ville}</p>
                        <p className="text-muted-foreground text-xs">Province: {inst.province} - Region: {inst.region}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground text-xs">{inst.horaires}</span>
                    </div>

                    {inst.telephone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground text-xs">{inst.telephone}</span>
                        {inst.telephoneSecondaire && (
                          <span className="text-muted-foreground text-xs">/ {inst.telephoneSecondaire}</span>
                        )}
                      </div>
                    )}

                    {inst.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground text-xs">{inst.email}</span>
                      </div>
                    )}

                    {inst.titreResponsable && (
                      <div className="text-xs text-muted-foreground">
                        Responsable: {inst.titreResponsable}
                      </div>
                    )}

                    {inst.services.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {inst.services.slice(0, 4).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                        {inst.services.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{inst.services.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {inst.telephone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(inst.telephone);
                          }}
                          data-testid={`button-call-${inst.id}`}
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          Appeler
                        </Button>
                      )}
                      {inst.website && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(inst.website, "_blank");
                          }}
                          data-testid={`button-website-${inst.id}`}
                        >
                          <Globe className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(inst);
                        }}
                        data-testid={`button-navigate-${inst.id}`}
                      >
                        <Navigation className="h-4 w-4 mr-1" />
                        Y aller
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredInstitutions.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune institution trouvee</h3>
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
