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
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Locate, Globe, Building2, Mail, Smartphone, Signal, Wifi, Hash, ChevronDown, ChevronUp, Headphones, CreditCard, MessageSquare } from "lucide-react";
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
  operateur: "Orange Burkina" | "Moov Africa" | "Telecel Faso";
  type: string;
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
  distance?: number;
}

interface ApiResponse {
  agences: Agence[];
  total: number;
  orangeCount: number;
  moovCount: number;
  telecelCount: number;
  villesCount: number;
}

const operateurColors: Record<string, string> = {
  "Orange Burkina": "bg-orange-500 text-white",
  "Moov Africa": "bg-sky-600 text-white",
  "Telecel Faso": "bg-emerald-600 text-white",
};

const typeColors: Record<string, string> = {
  "Direction": "bg-red-600 text-white",
  "Agence Principale": "bg-purple-600 text-white",
  "Centre de Service": "bg-slate-600 text-white",
  "Boutique": "bg-teal-600 text-white",
  "Point de Vente": "bg-gray-500 text-white",
};

const regions = REGION_NAMES;

const types = [
  "Direction",
  "Agence Principale",
  "Centre de Service",
  "Boutique",
  "Point de Vente",
];

function createAgenceIcon(operateur: string, type: string) {
  const color = operateur === "Orange Burkina" ? "#F97316" : operateur === "Moov Africa" ? "#0284C7" : "#059669";
  const innerColor = type === "Direction" ? "#DC2626" : type === "Agence Principale" ? "#9333EA" : "white";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="${innerColor}"/>
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
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

export default function Telephonie() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedOperateur, setSelectedOperateur] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedAgence, setSelectedAgence] = useState<Agence | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.3714, -1.5197]);
  const [mapZoom, setMapZoom] = useState(7);
  const [showNearestOnly, setShowNearestOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showCodesUSSD, setShowCodesUSSD] = useState(false);
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
    queryKey: ["/api/telephonie"],
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
        a.operateur.toLowerCase().includes(query) ||
        a.type.toLowerCase().includes(query) ||
        a.services.some(s => s.toLowerCase().includes(query))
      );
    }

    if (selectedOperateur !== "all") {
      result = result.filter(a => a.operateur === selectedOperateur);
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
    } else {
      const typeOrder: Record<string, number> = { "Direction": 0, "Agence Principale": 1, "Centre de Service": 2, "Boutique": 3, "Point de Vente": 4 };
      result = [...result].sort((a, b) => {
        const diff = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
        if (diff !== 0) return diff;
        return a.nom.localeCompare(b.nom);
      });
    }

    return result;
  }, [agences, searchQuery, selectedOperateur, selectedRegion, selectedType, showNearestOnly, userLocation, calculateDistance]);

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
        <title>Agences Telephonie Mobile - Burkina Watch</title>
        <meta name="description" content="Annuaire des agences de telephonie mobile au Burkina Faso - Orange Burkina, Moov Africa, Telecel Faso" />
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
              <Smartphone className="h-6 w-6 text-orange-500" />
              Agences Telephonie Mobile
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

        <div className="bg-gradient-to-r from-orange-500/10 via-sky-500/10 to-emerald-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm font-medium">Orange Burkina</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sky-600" />
                <span className="text-sm font-medium">Moov Africa</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600" />
                <span className="text-sm font-medium">Telecel Faso</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Signal className="h-4 w-4" />
              <span>3 operateurs actifs</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <Card 
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedOperateur === "Orange Burkina" ? "ring-2 ring-orange-500" : ""}`}
            onClick={() => setSelectedOperateur(selectedOperateur === "Orange Burkina" ? "all" : "Orange Burkina")}
            data-testid="card-stat-orange"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground">Orange</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-orange-count">{apiData?.orangeCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-500/10">
                  <Smartphone className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedOperateur === "Moov Africa" ? "ring-2 ring-sky-500" : ""}`}
            onClick={() => setSelectedOperateur(selectedOperateur === "Moov Africa" ? "all" : "Moov Africa")}
            data-testid="card-stat-moov"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground">Moov</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-moov-count">{apiData?.moovCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-500/10">
                  <Wifi className="w-5 h-5 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`hover-elevate cursor-pointer flex-1 min-w-[120px] ${selectedOperateur === "Telecel Faso" ? "ring-2 ring-emerald-500" : ""}`}
            onClick={() => setSelectedOperateur(selectedOperateur === "Telecel Faso" ? "all" : "Telecel Faso")}
            data-testid="card-stat-telecel"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
                <div>
                  <p className="text-xs text-muted-foreground">Telecel</p>
                  <span className="text-2xl font-bold tracking-tight" data-testid="text-telecel-count">{apiData?.telecelCount || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10">
                  <Signal className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1 min-w-[120px]" data-testid="card-stat-villes">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-1">
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

        <Card className="mb-6" data-testid="card-codes-ussd">
          <CardHeader
            className="cursor-pointer pb-3"
            onClick={() => setShowCodesUSSD(!showCodesUSSD)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-5 w-5 text-primary" />
                Codes & Numeros utiles des operateurs
              </CardTitle>
              {showCodesUSSD ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </div>
            {!showCodesUSSD && (
              <p className="text-xs text-muted-foreground mt-1">Appuyez pour voir les codes USSD, numeros de service client et Mobile Money</p>
            )}
          </CardHeader>
          {showCodesUSSD && (
            <CardContent className="space-y-6 pt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <h3 className="text-sm font-bold">Orange Burkina</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { code: "*121#", desc: "Consulter le solde", dialable: true },
                    { code: "123*code#", desc: "Recharger avec carte", dialable: false },
                    { code: "*103#", desc: "Forfaits internet / appels / SMS", dialable: true },
                    { code: "*160*2#", desc: "Consulter consommation internet", dialable: true },
                    { code: "*303#", desc: "Transferer du credit", dialable: true },
                    { code: "*144#", desc: "Orange Money", dialable: true },
                    { code: "*144*2*3*agent*montant*PIN#", desc: "Retrait Orange Money", dialable: false },
                    { code: "3900", desc: "Service client", dialable: true },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={item.dialable ? `tel:${encodeURIComponent(item.code)}` : undefined}
                      onClick={item.dialable ? undefined : (e) => e.preventDefault()}
                      className={`flex items-center gap-3 p-2 rounded-md bg-orange-500/5 border border-orange-500/10 ${item.dialable ? "hover-elevate cursor-pointer" : "opacity-70 cursor-default"}`}
                      data-testid={`code-orange-${i}`}
                    >
                      <Badge className="bg-orange-500 text-white font-mono text-xs shrink-0 no-default-hover-elevate">{item.code}</Badge>
                      <span className="text-xs text-foreground flex-1">{item.desc}</span>
                      {item.dialable && <Phone className="h-3 w-3 text-orange-500 shrink-0" />}
                    </a>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-sky-600" />
                  <h3 className="text-sm font-bold">Moov Africa</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { code: "*555*1#", desc: "Consulter le solde", dialable: true },
                    { code: "*100*code#", desc: "Recharger avec carte", dialable: false },
                    { code: "*200#", desc: "Forfaits internet / appels", dialable: true },
                    { code: "*200*12#", desc: "Verifier compatibilite 4G", dialable: true },
                    { code: "*555*3#", desc: "Transferer du credit", dialable: true },
                    { code: "*855#", desc: "Moov Money", dialable: true },
                    { code: "*855*1*1*1*num*montant*code#", desc: "Transfert Moov Money", dialable: false },
                    { code: "1102", desc: "Service client", dialable: true },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={item.dialable ? `tel:${encodeURIComponent(item.code)}` : undefined}
                      onClick={item.dialable ? undefined : (e) => e.preventDefault()}
                      className={`flex items-center gap-3 p-2 rounded-md bg-sky-600/5 border border-sky-600/10 ${item.dialable ? "hover-elevate cursor-pointer" : "opacity-70 cursor-default"}`}
                      data-testid={`code-moov-${i}`}
                    >
                      <Badge className="bg-sky-600 text-white font-mono text-xs shrink-0 no-default-hover-elevate">{item.code}</Badge>
                      <span className="text-xs text-foreground flex-1">{item.desc}</span>
                      {item.dialable && <Phone className="h-3 w-3 text-sky-600 shrink-0" />}
                    </a>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600" />
                  <h3 className="text-sm font-bold">Telecel Faso</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { code: "*110#", desc: "Consulter le solde", dialable: true },
                    { code: "*109*code#", desc: "Recharger avec carte", dialable: false },
                    { code: "*160#", desc: "Forfaits internet (menu principal)", dialable: true },
                    { code: "*160*1*1#", desc: "Forfaits internet jour", dialable: true },
                    { code: "*160*1*2#", desc: "Forfaits internet semaine", dialable: true },
                    { code: "*160*1*4#", desc: "Forfaits nuit (00h-07h)", dialable: true },
                    { code: "*104#", desc: "Transferer du credit", dialable: true },
                    { code: "*444#", desc: "Bip gratuit (rappelez-moi)", dialable: true },
                    { code: "*633#", desc: "Services souscrits", dialable: true },
                    { code: "888", desc: "Service client", dialable: true },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={item.dialable ? `tel:${encodeURIComponent(item.code)}` : undefined}
                      onClick={item.dialable ? undefined : (e) => e.preventDefault()}
                      className={`flex items-center gap-3 p-2 rounded-md bg-emerald-600/5 border border-emerald-600/10 ${item.dialable ? "hover-elevate cursor-pointer" : "opacity-70 cursor-default"}`}
                      data-testid={`code-telecel-${i}`}
                    >
                      <Badge className="bg-emerald-600 text-white font-mono text-xs shrink-0 no-default-hover-elevate">{item.code}</Badge>
                      <span className="text-xs text-foreground flex-1">{item.desc}</span>
                      {item.dialable && <Phone className="h-3 w-3 text-emerald-600 shrink-0" />}
                    </a>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

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
              <Select value={selectedOperateur} onValueChange={setSelectedOperateur}>
                <SelectTrigger data-testid="select-operateur">
                  <SelectValue placeholder="Tous les operateurs" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">Tous les operateurs</SelectItem>
                  <SelectItem value="Orange Burkina">Orange Burkina</SelectItem>
                  <SelectItem value="Moov Africa">Moov Africa</SelectItem>
                  <SelectItem value="Telecel Faso">Telecel Faso</SelectItem>
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
                    icon={createAgenceIcon(agence.operateur, agence.type)}
                    eventHandlers={{
                      click: () => handleAgenceClick(agence)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[220px]">
                        <h3 className="font-bold text-sm mb-1">{agence.nom}</h3>
                        <div className="flex gap-1 mb-2 flex-wrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs ${operateurColors[agence.operateur]}`}>{agence.operateur}</span>
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

          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap" data-testid="map-legend">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Orange Burkina</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-sky-600" />
              <span>Moov Africa</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-600" />
              <span>Telecel Faso</span>
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
                    <Badge className={`${operateurColors[agence.operateur]} text-xs shrink-0`}>
                      {agence.operateur === "Orange Burkina" ? <Smartphone className="h-3 w-3 mr-1" /> : agence.operateur === "Moov Africa" ? <Wifi className="h-3 w-3 mr-1" /> : <Signal className="h-3 w-3 mr-1" />}
                      {agence.operateur.split(" ")[0]}
                    </Badge>
                  </div>
                  <Badge className={`${typeColors[agence.type] || "bg-gray-500 text-white"} text-xs w-fit`}>
                    {agence.type}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agence.distance !== undefined && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2">
                      <Locate className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {agence.distance < 1 
                          ? `${Math.round(agence.distance * 1000)} m` 
                          : `${agence.distance.toFixed(1)} km`}
                      </span>
                      <span className="text-xs text-muted-foreground">de vous</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground">{agence.adresse}</p>
                      <p className="text-muted-foreground text-xs">{agence.quartier}, {agence.ville}</p>
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

                  {agence.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground text-xs">{agence.email}</span>
                    </div>
                  )}

                  {agence.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={agence.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary text-xs underline"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`link-website-${agence.id}`}
                      >
                        {agence.website.replace("https://", "").replace("www.", "")}
                      </a>
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
                        <Phone className="h-3 w-3 mr-1" />
                        Appeler
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(agence);
                      }}
                      data-testid={`button-navigate-${agence.id}`}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Itineraire
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredAgences.length === 0 && (
          <Card className="p-12 text-center">
            <CardContent>
              <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune agence trouvee</h3>
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
