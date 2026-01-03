import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, Building2, Landmark, CreditCard, Globe, Mail, Star, Wallet, Locate, X, AlertTriangle } from "lucide-react";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import PageStatCard from "@/components/PageStatCard";
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
  distance?: number;
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

import { REGION_NAMES } from "@/lib/regions";

const regions = REGION_NAMES;

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
  const [showGABDetails, setShowGABDetails] = useState(false);
  const [showBanquesDetails, setShowBanquesDetails] = useState(false);
  const [showCaissesDetails, setShowCaissesDetails] = useState(false);
  const [showEBISDetails, setShowEBISDetails] = useState(false);
  const [gabViewMode, setGabViewMode] = useState<"ville" | "banque">("ville");
  const [showNearestOnly, setShowNearestOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Calculate distance between two coordinates in km
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
          setMapCenter([loc.lat, loc.lng]);
          setMapZoom(12);
          setIsLocating(false);
          toast({
            title: "Position trouvee",
            description: "Affichage des etablissements les plus proches",
          });
        },
        (error) => {
          setIsLocating(false);
          toast({
            title: "Erreur de localisation",
            description: "Impossible d'obtenir votre position. Verifiez les permissions.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      toast({
        title: "Non supporte",
        description: "La geolocalisation n'est pas supportee par votre navigateur.",
        variant: "destructive",
      });
    }
  }, [showNearestOnly, userLocation, toast]);

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

    // Sort by distance if user location is available and nearest filter is active
    if (showNearestOnly && userLocation) {
      result = result
        .map(b => ({
          ...b,
          distance: calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20); // Show only 20 nearest
    }

    return result;
  }, [banques, searchQuery, selectedRegion, selectedType, showGABOnly, showSystemiqueOnly, showNearestOnly, userLocation, calculateDistance]);

  const gabParVille = useMemo(() => {
    const villeMap: Record<string, { ville: string; region: string; totalGAB: number; etablissements: { nom: string; sigle: string; nombreGAB: number; adresse: string; latitude: number; longitude: number }[] }> = {};
    
    banques.filter(b => b.hasGAB && b.nombreGAB && b.nombreGAB > 0).forEach(b => {
      if (!villeMap[b.ville]) {
        villeMap[b.ville] = { ville: b.ville, region: b.region, totalGAB: 0, etablissements: [] };
      }
      villeMap[b.ville].totalGAB += b.nombreGAB || 0;
      villeMap[b.ville].etablissements.push({
        nom: b.nom,
        sigle: b.sigle,
        nombreGAB: b.nombreGAB || 0,
        adresse: b.adresse,
        latitude: b.latitude,
        longitude: b.longitude
      });
    });
    
    return Object.values(villeMap).sort((a, b) => b.totalGAB - a.totalGAB);
  }, [banques]);

  const gabParBanque = useMemo(() => {
    const banqueMap: Record<string, { sigle: string; totalGAB: number; villes: { ville: string; nombreGAB: number; adresse: string; latitude: number; longitude: number }[] }> = {};
    
    banques.filter(b => b.hasGAB && b.nombreGAB && b.nombreGAB > 0).forEach(b => {
      if (!banqueMap[b.sigle]) {
        banqueMap[b.sigle] = { sigle: b.sigle, totalGAB: 0, villes: [] };
      }
      banqueMap[b.sigle].totalGAB += b.nombreGAB || 0;
      banqueMap[b.sigle].villes.push({
        ville: b.ville,
        nombreGAB: b.nombreGAB || 0,
        adresse: b.adresse,
        latitude: b.latitude,
        longitude: b.longitude
      });
    });
    
    return Object.values(banqueMap).sort((a, b) => b.totalGAB - a.totalGAB);
  }, [banques]);

  const banquesParVille = useMemo(() => {
    const villeMap: Record<string, { ville: string; region: string; count: number; etablissements: { nom: string; sigle: string; adresse: string; latitude: number; longitude: number }[] }> = {};
    
    banques.filter(b => b.type === "Banque").forEach(b => {
      if (!villeMap[b.ville]) {
        villeMap[b.ville] = { ville: b.ville, region: b.region, count: 0, etablissements: [] };
      }
      villeMap[b.ville].count++;
      villeMap[b.ville].etablissements.push({
        nom: b.nom,
        sigle: b.sigle,
        adresse: b.adresse,
        latitude: b.latitude,
        longitude: b.longitude
      });
    });
    
    return Object.values(villeMap).sort((a, b) => b.count - a.count);
  }, [banques]);

  const caissesParVille = useMemo(() => {
    const villeMap: Record<string, { ville: string; region: string; count: number; etablissements: { nom: string; sigle: string; adresse: string; latitude: number; longitude: number }[] }> = {};
    
    banques.filter(b => b.type === "Caisse Populaire").forEach(b => {
      if (!villeMap[b.ville]) {
        villeMap[b.ville] = { ville: b.ville, region: b.region, count: 0, etablissements: [] };
      }
      villeMap[b.ville].count++;
      villeMap[b.ville].etablissements.push({
        nom: b.nom,
        sigle: b.sigle,
        adresse: b.adresse,
        latitude: b.latitude,
        longitude: b.longitude
      });
    });
    
    return Object.values(villeMap).sort((a, b) => b.count - a.count);
  }, [banques]);

  const ebisListe = useMemo(() => {
    return banques.filter(b => b.importanceSystemique).map(b => ({
      nom: b.nom,
      sigle: b.sigle,
      ville: b.ville,
      region: b.region,
      adresse: b.adresse,
      latitude: b.latitude,
      longitude: b.longitude,
      nombreGAB: b.nombreGAB || 0
    }));
  }, [banques]);

  const handleGABNavigate = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

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

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 cursor-pointer" onClick={() => setShowBanquesDetails(!showBanquesDetails)}>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Banques</p>
                  <span className="text-2xl font-bold tracking-tight">{stats?.banques || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:scale-110 transition-transform">
                  <Landmark className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 cursor-pointer" onClick={() => setShowCaissesDetails(!showCaissesDetails)}>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Caisses</p>
                  <span className="text-2xl font-bold tracking-tight">{stats?.caissesPopulaires || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-green-500/10 group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 cursor-pointer" onClick={() => setShowGABDetails(!showGABDetails)}>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">GAB</p>
                  <span className="text-2xl font-bold tracking-tight">{stats?.totalGAB || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 cursor-pointer" onClick={() => setShowEBISDetails(!showEBISDetails)}>
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">EBIS</p>
                  <span className="text-2xl font-bold tracking-tight">{stats?.importanceSystemique || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-red-500/10 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Villes</p>
                  <span className="text-2xl font-bold tracking-tight">{stats?.nombreVilles || 0}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showGABDetails && (
          <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                  Liste des GAB ({stats?.totalGAB || 0} distributeurs)
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={gabViewMode === "ville" ? "default" : "outline"}
                    onClick={() => setGabViewMode("ville")}
                    data-testid="button-gab-by-city"
                  >
                    <MapPin className="h-4 w-4 mr-1" />
                    Par ville
                  </Button>
                  <Button
                    size="sm"
                    variant={gabViewMode === "banque" ? "default" : "outline"}
                    onClick={() => setGabViewMode("banque")}
                    data-testid="button-gab-by-bank"
                  >
                    <Building2 className="h-4 w-4 mr-1" />
                    Par banque
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowGABDetails(false)}
                    data-testid="button-close-gab-details"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {gabViewMode === "ville" ? (
                  gabParVille.map((villeData, idx) => (
                    <div key={idx} className="bg-background rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-amber-600" />
                          <span className="font-semibold">{villeData.ville}</span>
                          <Badge variant="outline" className="text-xs">{villeData.region}</Badge>
                        </div>
                        <Badge className="bg-amber-500 text-white">{villeData.totalGAB} GAB</Badge>
                      </div>
                      <div className="space-y-1 ml-6">
                        {villeData.etablissements.map((etab, i) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between text-sm text-muted-foreground p-1.5 rounded hover-elevate cursor-pointer"
                            onClick={() => handleGABNavigate(etab.latitude, etab.longitude)}
                            data-testid={`gab-navigate-ville-${idx}-${i}`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <CreditCard className="h-3 w-3 shrink-0" />
                              <span className="font-medium">{etab.sigle}</span>
                              <span className="text-xs truncate">- {etab.adresse}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-amber-600 font-medium">{etab.nombreGAB}</span>
                              <Navigation className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  gabParBanque.map((banqueData, idx) => (
                    <div key={idx} className="bg-background rounded-lg p-3 border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">{banqueData.sigle}</span>
                        </div>
                        <Badge className="bg-amber-500 text-white">{banqueData.totalGAB} GAB</Badge>
                      </div>
                      <div className="space-y-1 ml-6">
                        {banqueData.villes.map((ville, i) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between text-sm text-muted-foreground p-1.5 rounded hover-elevate cursor-pointer"
                            onClick={() => handleGABNavigate(ville.latitude, ville.longitude)}
                            data-testid={`gab-navigate-banque-${idx}-${i}`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="font-medium">{ville.ville}</span>
                              <span className="text-xs truncate">- {ville.adresse}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-amber-600 font-medium">{ville.nombreGAB}</span>
                              <Navigation className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {showBanquesDetails && (
          <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-blue-600" />
                  Liste des Banques ({stats?.banques || 0} agences)
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBanquesDetails(false)}
                  data-testid="button-close-banques-details"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {banquesParVille.map((villeData, idx) => (
                  <div key={idx} className="bg-background rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">{villeData.ville}</span>
                        <Badge variant="outline" className="text-xs">{villeData.region}</Badge>
                      </div>
                      <Badge className="bg-blue-500 text-white">{villeData.count} agence{villeData.count > 1 ? "s" : ""}</Badge>
                    </div>
                    <div className="space-y-1 ml-6">
                      {villeData.etablissements.map((etab, i) => (
                        <div 
                          key={i} 
                          className="flex items-center justify-between text-sm text-muted-foreground p-1.5 rounded hover-elevate cursor-pointer"
                          onClick={() => handleGABNavigate(etab.latitude, etab.longitude)}
                          data-testid={`banque-navigate-${idx}-${i}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="font-medium">{etab.sigle}</span>
                            <span className="text-xs truncate">- {etab.adresse}</span>
                          </div>
                          <Navigation className="h-3 w-3 text-primary shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showCaissesDetails && (
          <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Liste des Caisses Populaires ({stats?.caissesPopulaires || 0} agences)
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowCaissesDetails(false)}
                  data-testid="button-close-caisses-details"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {caissesParVille.map((villeData, idx) => (
                  <div key={idx} className="bg-background rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="font-semibold">{villeData.ville}</span>
                        <Badge variant="outline" className="text-xs">{villeData.region}</Badge>
                      </div>
                      <Badge className="bg-green-500 text-white">{villeData.count} agence{villeData.count > 1 ? "s" : ""}</Badge>
                    </div>
                    <div className="space-y-1 ml-6">
                      {villeData.etablissements.map((etab, i) => (
                        <div 
                          key={i} 
                          className="flex items-center justify-between text-sm text-muted-foreground p-1.5 rounded hover-elevate cursor-pointer"
                          onClick={() => handleGABNavigate(etab.latitude, etab.longitude)}
                          data-testid={`caisse-navigate-${idx}-${i}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="font-medium">{etab.sigle}</span>
                            <span className="text-xs truncate">- {etab.adresse}</span>
                          </div>
                          <Navigation className="h-3 w-3 text-primary shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showEBISDetails && (
          <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-red-600" />
                  EBIS - Etablissements Bancaires d'Importance Systemique ({stats?.importanceSystemique || 0})
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEBISDetails(false)}
                  data-testid="button-close-ebis-details"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                {ebisListe.map((banque, idx) => (
                  <div 
                    key={idx} 
                    className="bg-background rounded-lg p-3 border hover-elevate cursor-pointer"
                    onClick={() => handleGABNavigate(banque.latitude, banque.longitude)}
                    data-testid={`ebis-navigate-${idx}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Landmark className="h-4 w-4 text-red-600 shrink-0" />
                          <span className="font-semibold">{banque.sigle}</span>
                          <Badge className="bg-red-500 text-white text-xs">EBIS</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{banque.nom}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{banque.ville} ({banque.region})</span>
                          {banque.nombreGAB > 0 && (
                            <Badge variant="outline" className="text-xs">{banque.nombreGAB} GAB</Badge>
                          )}
                        </div>
                      </div>
                      <Navigation className="h-4 w-4 text-primary shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une banque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-10"
                data-testid="input-search"
              />
              <VoiceSearchButton
                onResult={setSearchQuery}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
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

          {/* Bouton Les plus proches */}
          <div className="flex gap-2">
            <Button
              variant={showNearestOnly ? "default" : "outline"}
              onClick={handleNearestFilter}
              disabled={isLocating}
              className={`flex-1 ${showNearestOnly ? "bg-primary" : ""}`}
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
                  {banque.distance !== undefined && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2">
                      <Locate className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {banque.distance < 1 
                          ? `${Math.round(banque.distance * 1000)} m` 
                          : `${banque.distance.toFixed(1)} km`}
                      </span>
                      <span className="text-xs text-muted-foreground">de vous</span>
                    </div>
                  )}
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
