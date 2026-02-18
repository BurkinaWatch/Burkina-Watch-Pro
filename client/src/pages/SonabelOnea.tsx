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
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Locate, Zap, Droplets, Globe, Building2, Mail, PhoneCall } from "lucide-react";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { REGION_NAMES } from "@/lib/regions";

interface Agence {
  id: string;
  nom: string;
  societe: "SONABEL" | "ONEA";
  type: string;
  adresse: string;
  quartier: string;
  ville: string;
  region: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  telephoneSecondaire?: string;
  email?: string;
  website?: string;
  horaires: string;
  services: string[];
  numVert?: string;
  bp?: string;
}

interface ApiResponse {
  agences: Agence[];
  total: number;
  sonabelCount: number;
  oneaCount: number;
  villesCount: number;
}

const societeColors: Record<string, string> = {
  "SONABEL": "bg-amber-500 text-white",
  "ONEA": "bg-blue-500 text-white",
};

const typeColors: Record<string, string> = {
  "Siege": "bg-red-600 text-white",
  "Direction Regionale": "bg-purple-600 text-white",
  "Agence Commerciale": "bg-green-600 text-white",
  "Centre": "bg-slate-600 text-white",
  "Antenne": "bg-teal-600 text-white",
};

const regions = REGION_NAMES;

const types = [
  "Siege",
  "Direction Regionale",
  "Agence Commerciale",
  "Centre",
  "Antenne",
];

function createAgenceIcon(societe: string, type: string) {
  const color = societe === "SONABEL" ? "#F59E0B" : "#3B82F6";
  const innerColor = type === "Siege" ? "#DC2626" : type === "Direction Regionale" ? "#9333EA" : "white";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="${innerColor}"/>
      ${societe === "SONABEL" 
        ? '<path d="M12 5l1 3h-2l1-3z" fill="white" stroke="none"/>'
        : '<path d="M10 8c0-1.1.9-2 2-2s2 .9 2 2c0 2-2 3-2 3s-2-1-2-3z" fill="white" stroke="none"/>'
      }
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-agence-icon",
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

export default function SonabelOnea() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedSociete, setSelectedSociete] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAgence, setSelectedAgence] = useState<Agence | null>(null);
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
          toast({ title: "Position trouvee", description: "Affichage des agences les plus proches" });
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
    queryKey: ["/api/sonabel-onea"],
  });

  const agences = apiData?.agences || [];

  const filteredAgences = useMemo(() => {
    let result = Array.isArray(agences) ? agences : [];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.nom.toLowerCase().includes(query) ||
        a.ville.toLowerCase().includes(query) ||
        a.quartier.toLowerCase().includes(query) ||
        a.adresse.toLowerCase().includes(query) ||
        a.type.toLowerCase().includes(query) ||
        a.services.some(s => s.toLowerCase().includes(query))
      );
    }

    if (selectedSociete !== "all") {
      result = result.filter(a => a.societe === selectedSociete);
    }

    if (selectedRegion !== "all") {
      result = result.filter(a => a.region === selectedRegion);
    }

    if (selectedType !== "all") {
      result = result.filter(a => a.type === selectedType);
    }

    if (showNearestOnly && userLocation) {
      result = result
        .map(a => ({
          ...a,
          distance: calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20);
    }

    return result;
  }, [agences, searchQuery, selectedSociete, selectedRegion, selectedType, showNearestOnly, userLocation, calculateDistance]);

  const handleAgenceClick = useCallback((agence: Agence) => {
    setSelectedAgence(agence);
    setMapCenter([agence.latitude, agence.longitude]);
    setMapZoom(15);
  }, []);

  const handleCall = (telephone?: string) => {
    if (telephone) {
      window.location.href = `tel:${telephone}`;
    }
  };

  const handleNavigate = (agence: Agence) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${agence.latitude},${agence.longitude}`;
    window.open(url, "_blank");
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Actualisation",
        description: "Donnees des agences actualisees",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les donnees",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>SONABEL & ONEA - Burkina Watch</title>
        <meta name="description" content="Annuaire des agences SONABEL (electricite) et ONEA (eau) au Burkina Faso" />
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
              <Zap className="h-6 w-6 text-amber-500" />
              SONABEL & ONEA
            </h1>
            <p className="text-sm text-muted-foreground">
              {apiData?.total || 0} agences dans {apiData?.villesCount || 0} villes du Burkina Faso
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-gradient-to-r from-amber-500/10 via-transparent to-blue-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">SONABEL - Electricite</p>
                  <p className="text-xs text-muted-foreground">Num. vert: <span className="font-bold text-amber-600">80 00 11 30</span></p>
                </div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">ONEA - Eau & Assainissement</p>
                  <p className="text-xs text-muted-foreground">Num. vert: <span className="font-bold text-blue-600">80 00 11 11</span></p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleCall("80001130")} data-testid="button-call-sonabel-vert">
                <PhoneCall className="h-3 w-3 mr-1" />
                SONABEL
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleCall("80001111")} data-testid="button-call-onea-vert">
                <PhoneCall className="h-3 w-3 mr-1" />
                ONEA
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Card 
            className={`hover-elevate cursor-pointer flex-1 min-w-[140px] ${selectedSociete === "SONABEL" ? "ring-2 ring-amber-500" : ""}`}
            onClick={() => setSelectedSociete(selectedSociete === "SONABEL" ? "all" : "SONABEL")}
            data-testid="card-stat-sonabel"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">SONABEL</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-sonabel-count">{apiData?.sonabelCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`hover-elevate cursor-pointer flex-1 min-w-[140px] ${selectedSociete === "ONEA" ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setSelectedSociete(selectedSociete === "ONEA" ? "all" : "ONEA")}
            data-testid="card-stat-onea"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">ONEA</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-onea-count">{apiData?.oneaCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10">
                  <Droplets className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1 min-w-[140px]" data-testid="card-stat-total">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-total-count">{apiData?.total || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-green-500/10">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1 min-w-[140px]" data-testid="card-stat-villes">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Villes</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-villes-count">{apiData?.villesCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative z-50">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une agence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
              <VoiceSearchInput onQueryChange={setSearchQuery} />
            </div>

            <div className="relative z-50">
              <Select value={selectedSociete} onValueChange={setSelectedSociete}>
                <SelectTrigger data-testid="select-societe">
                  <SelectValue placeholder="Toutes les societes" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">Toutes les societes</SelectItem>
                  <SelectItem value="SONABEL">SONABEL (Electricite)</SelectItem>
                  <SelectItem value="ONEA">ONEA (Eau)</SelectItem>
                </SelectContent>
              </Select>
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
                {Array.isArray(filteredAgences) && filteredAgences.map(agence => (
                  <Marker
                    key={agence.id}
                    position={[agence.latitude, agence.longitude]}
                    icon={createAgenceIcon(agence.societe, agence.type)}
                    eventHandlers={{
                      click: () => handleAgenceClick(agence)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[220px]">
                        <h3 className="font-bold text-sm mb-1">{agence.nom}</h3>
                        <div className="flex gap-1 mb-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${societeColors[agence.societe]}`}>{agence.societe}</span>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${typeColors[agence.type] || "bg-gray-500 text-white"}`}>{agence.type}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{agence.adresse}</p>
                        <p className="text-xs text-gray-500">{agence.quartier}, {agence.ville}</p>
                        {agence.telephone && (
                          <p className="text-xs text-gray-600 mt-1">{agence.telephone}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2" data-testid="map-legend">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>SONABEL</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>ONEA</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 mt-6">
          <h2 className="text-lg font-semibold" data-testid="text-results-count">
            {filteredAgences.length} agence{filteredAgences.length !== 1 ? "s" : ""} trouvee{filteredAgences.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(filteredAgences) && filteredAgences.map(agence => (
              <Card 
                key={agence.id} 
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedAgence?.id === agence.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleAgenceClick(agence)}
                data-testid={`card-agence-${agence.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{agence.nom}</CardTitle>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Badge className={`${societeColors[agence.societe]} text-xs`}>
                        {agence.societe === "SONABEL" ? <Zap className="h-3 w-3 mr-1" /> : <Droplets className="h-3 w-3 mr-1" />}
                        {agence.societe}
                      </Badge>
                    </div>
                  </div>
                  <Badge className={`${typeColors[agence.type] || "bg-gray-500 text-white"} text-xs w-fit`}>
                    {agence.type}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(agence as any).distance !== undefined && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2">
                      <Locate className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {(agence as any).distance < 1 
                          ? `${Math.round((agence as any).distance * 1000)} m` 
                          : `${(agence as any).distance.toFixed(1)} km`}
                      </span>
                      <span className="text-xs text-muted-foreground">de vous</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground">{agence.adresse}</p>
                      <p className="text-muted-foreground text-xs">{agence.quartier}, {agence.ville}</p>
                      {agence.bp && (
                        <p className="text-muted-foreground text-xs">{agence.bp}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground text-xs">{agence.horaires}</span>
                  </div>

                  {agence.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground text-xs">{agence.telephone}</span>
                      {agence.telephoneSecondaire && (
                        <span className="text-muted-foreground text-xs">/ {agence.telephoneSecondaire}</span>
                      )}
                    </div>
                  )}

                  {agence.numVert && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-md p-2 flex items-center gap-2">
                      <PhoneCall className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">Num. vert: {agence.numVert}</span>
                    </div>
                  )}

                  {agence.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground text-xs">{agence.email}</span>
                    </div>
                  )}

                  {agence.services.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agence.services.slice(0, 5).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      {agence.services.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{agence.services.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {agence.telephone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(agence.telephone);
                        }}
                        data-testid={`button-call-${agence.id}`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Appeler
                      </Button>
                    )}
                    {agence.website && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(agence.website, "_blank");
                        }}
                        data-testid={`button-website-${agence.id}`}
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
                        handleNavigate(agence);
                      }}
                      data-testid={`button-navigate-${agence.id}`}
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

        {filteredAgences.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune agence trouvee</h3>
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
