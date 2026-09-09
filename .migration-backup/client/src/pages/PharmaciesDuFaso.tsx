import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Phone, Clock, ExternalLink, Navigation, 
  Building2, Globe, RefreshCcw, ArrowLeft, Crosshair, 
  PlusSquare, ShieldCheck, Info, Accessibility, Pill, Activity,
  ChevronLeft, ChevronDown, ChevronUp, Calendar, AlertCircle
} from "lucide-react";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import PageStatCard from "@/components/PageStatCard";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Place } from "@shared/schema";
import { useLocation, Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Helmet } from "react-helmet-async";
import { REGION_NAMES } from "@/lib/regions";
import { LocationValidator } from "@/components/LocationValidator";

type VilleGarde = "Ouagadougou" | "Bobo-Dioulasso" | "Koudougou" | "Ouahigouya" | "Fada N'Gourma";

const VILLES_GARDE: { value: VilleGarde; label: string; short: string }[] = [
  { value: "Ouagadougou", label: "Ouagadougou", short: "Ouaga" },
  { value: "Bobo-Dioulasso", label: "Bobo-Dioulasso", short: "Bobo" },
  { value: "Koudougou", label: "Koudougou", short: "Koudou" },
  { value: "Ouahigouya", label: "Ouahigouya", short: "Ouahi" },
  { value: "Fada N'Gourma", label: "Fada N'Gourma", short: "Fada" },
];

interface PharmacieDeGardeAPI {
  nom: string;
  telephone: string;
  groupe: number;
  ville: VilleGarde;
  adresse?: string;
  latitude?: number;
  longitude?: number;
}

interface GardeResponse {
  date: string;
  groupeOuagadougou: number;
  groupeBobo: number;
  groupesParVille: Record<string, { groupe: number; totalGroupes: number }>;
  periodeDebut: string;
  periodeFin: string;
  pharmacies: PharmacieDeGardeAPI[];
  total: number;
  info: { source: string; lastUpdate: string; description: string };
}

export default function PharmaciesDuFaso() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [gardeFilter, setGardeFilter] = useState<"all" | "garde" | "24h" | "jour" | "nuit">("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [showGardeSection, setShowGardeSection] = useState(true);
  const [gardeVille, setGardeVille] = useState<VilleGarde>("Ouagadougou");
  const [gardeSearchTerm, setGardeSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const handleGeoLocation = () => {
    if (sortByDistance) {
      setSortByDistance(false);
      return;
    }

    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setSortByDistance(true);
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error);
        alert("Impossible d'obtenir votre position. Veuillez vérifier vos paramètres de localisation.");
      }
    );
  };

  const { data: pharmacies = [], isLoading, isFetching } = useQuery<any[]>({
    queryKey: ["/api/places/pharmacy?limit=5000"],
  });

  const { data: gardeData, isLoading: gardeLoading } = useQuery<GardeResponse>({
    queryKey: ["/api/pharmacies-de-garde"],
  });

  const filteredGardePharmacies = useMemo(() => {
    if (!gardeData) return [];
    let result = gardeData.pharmacies.filter(p => p.ville === gardeVille);
    if (gardeSearchTerm) {
      const q = gardeSearchTerm.toLowerCase();
      result = result.filter(p => 
        p.nom.toLowerCase().includes(q) ||
        (p.adresse || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [gardeData, gardeVille, gardeSearchTerm]);

  const regions = useMemo(() => {
    return REGION_NAMES;
  }, []);

  const gardeCounts = useMemo(() => {
    let count24h = 0;
    let countJour = 0;
    let countNuit = 0;
    
    pharmacies.forEach(p => {
      const tags = p.tags || {};
      const typeGarde = (p.typeGarde || "").toLowerCase();
      
      if (typeGarde === "24h" || typeGarde === "24h/24") {
        count24h++;
      } else if (typeGarde === "nuit") {
        countNuit++;
      } else if (typeGarde === "jour") {
        countJour++;
      } else if (tags.is_on_duty) {
        // OSM fallback for on-duty status
        count24h++;
      }
    });
    
    return { 
      total: pharmacies.length,
      garde: count24h + countNuit, // De garde = 24h + Nuit
      h24: count24h, 
      jour: countJour, 
      nuit: countNuit 
    };
  }, [pharmacies]);

  const onDutyCount = gardeCounts.garde;

  const filteredPharmacies = useMemo(() => {
    let result = [...pharmacies];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => 
        (p.name || p.nom || "").toLowerCase().includes(q) || 
        (p.city || p.ville || "").toLowerCase().includes(q) ||
        (p.quartier || "").toLowerCase().includes(q)
      );
    }
    if (selectedRegion !== "all") {
      result = result.filter(p => (p.region || p.ville) === selectedRegion);
    }
    if (gardeFilter !== "all") {
      result = result.filter(p => {
        const tags = p.tags || {};
        const typeGarde = (p.typeGarde || "").toLowerCase();
        const openingHours = tags.opening_hours || "";
        
        if (gardeFilter === "garde") {
          return tags.is_on_duty || openingHours === "24/7" || typeGarde === "24h" || typeGarde === "24h/24" || typeGarde === "nuit";
        } else if (gardeFilter === "24h") {
          return openingHours === "24/7" || typeGarde === "24h" || typeGarde === "24h/24";
        } else if (gardeFilter === "jour") {
          return typeGarde === "jour";
        } else if (gardeFilter === "nuit") {
          return typeGarde === "nuit" || tags.is_on_duty;
        }
        return true;
      });
    }

    if (sortByDistance && userLocation) {
      result = result
        .map(p => ({
          ...p,
          distance: calculateDistance(
            userLocation.lat,
            userLocation.lng,
            parseFloat(p.latitude || p.lat),
            parseFloat(p.longitude || p.lon)
          )
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return result;
  }, [pharmacies, searchTerm, selectedRegion, gardeFilter, sortByDistance, userLocation]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/places/pharmacy"] });
  };

  return (
    <>
      <Helmet>
        <title>Pharmacies du Faso | Burkina Watch</title>
        <meta name="description" content="Liste complète des pharmacies au Burkina Faso avec gardes et localisations." />
      </Helmet>

      <div className="flex flex-col h-full bg-background text-foreground">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <PlusSquare className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Pharmacies du Faso</h1>
                  <p className="text-sm text-muted-foreground">Données enrichies via OpenStreetMap & Burkina Secure (Orange)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <PageStatCard
              title="Pharmacies"
              value={pharmacies.length}
              icon={Pill}
              description="Toutes les pharmacies"
              variant="red"
              onClick={() => {
                setGardeFilter("all");
                setSelectedRegion("all");
                setSearchTerm("");
              }}
              clickable
            />
            <PageStatCard
              title="De Garde"
              value={onDutyCount}
              icon={ShieldCheck}
              description="24h/24 et nuit"
              variant="green"
              onClick={() => setGardeFilter(gardeFilter === "garde" ? "all" : "garde")}
              clickable
            />
            <PageStatCard
              title="Villes"
              value={new Set(pharmacies.map(p => p.city || p.ville)).size}
              icon={MapPin}
              description="Couverture nationale"
              variant="blue"
            />
            <PageStatCard
              title="Urgence"
              value="SOS"
              icon={Activity}
              description="Contacts d'urgence"
              variant="amber"
              onClick={() => setLocation("/sos")}
              clickable
            />
          </div>

          {gardeLoading ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : gardeData && (
            <Card className="border-green-500/40 bg-gradient-to-r from-green-500/10 to-emerald-500/5 dark:from-green-900/20 dark:to-emerald-900/10 overflow-hidden" data-testid="card-pharmacies-garde">
              <CardHeader className="p-4 pb-2">
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-left cursor-pointer"
                  onClick={() => setShowGardeSection(!showGardeSection)}
                  data-testid="button-toggle-garde-section"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-500 rounded-full shadow-lg shadow-green-500/30">
                      <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        Pharmacies de Garde
                        <Badge className="bg-green-600 text-white border-none text-xs">
                          Groupe {gardeData.groupesParVille?.[gardeVille]?.groupe ?? gardeData.groupeOuagadougou}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        Du {new Date(gardeData.periodeDebut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} 12h au {new Date(gardeData.periodeFin).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} 12h
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-green-500/40 text-green-700 dark:text-green-400">
                      {filteredGardePharmacies.length} pharmacies
                    </Badge>
                    {showGardeSection ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </button>
              </CardHeader>
              
              {showGardeSection && (
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {VILLES_GARDE.map((v) => {
                        const grp = gardeData.groupesParVille?.[v.value];
                        return (
                          <Button
                            key={v.value}
                            variant={gardeVille === v.value ? "default" : "outline"}
                            size="sm"
                            className={gardeVille === v.value ? "bg-green-600" : ""}
                            onClick={() => setGardeVille(v.value)}
                            data-testid={`button-garde-${v.short.toLowerCase()}`}
                          >
                            {v.short} (Gr. {grp?.groupe ?? "?"})
                          </Button>
                        );
                      })}
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Rechercher une pharmacie de garde..."
                        value={gardeSearchTerm}
                        onChange={(e) => setGardeSearchTerm(e.target.value)}
                        className="text-sm"
                        data-testid="input-garde-search"
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[400px] overflow-y-auto pr-1">
                    {filteredGardePharmacies.map((ph, idx) => (
                      <div 
                        key={`garde-${idx}`}
                        className="flex items-start gap-3 p-3 rounded-lg bg-background/60 border border-green-500/20 hover:border-green-500/40 transition-colors group"
                        data-testid={`card-garde-pharmacy-${idx}`}
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="font-semibold text-sm truncate">{ph.nom}</p>
                          {ph.adresse && (
                            <p className="text-xs text-muted-foreground line-clamp-2 flex items-start gap-1">
                              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              {ph.adresse}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <a 
                              href={`tel:${ph.telephone}`}
                              className="text-xs text-green-700 dark:text-green-400 hover:underline flex items-center gap-1 font-medium"
                              data-testid={`link-garde-phone-${idx}`}
                            >
                              <Phone className="h-3 w-3" />
                              {ph.telephone}
                            </a>
                            {ph.latitude && ph.longitude && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${ph.latitude},${ph.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                data-testid={`link-garde-itineraire-${idx}`}
                              >
                                <Navigation className="h-3 w-3" />
                                Itinéraire
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Source: {gardeData.info.source.replace('https://www.orange.bf', 'Orange BF')} &bull; Rotation: {gardeData.info.description}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          <div className="flex flex-col md:flex-row gap-4">
            <VoiceSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher une pharmacie, quartier..."
              className="flex-1"
            />
            <div className="flex gap-2">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-[200px] h-11">
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant={sortByDistance ? "default" : "outline"}
                className={`h-11 gap-2 ${sortByDistance ? "bg-blue-600 hover:bg-blue-700 border-blue-600" : ""}`}
                onClick={handleGeoLocation}
              >
                <Crosshair className={`h-4 w-4 ${sortByDistance ? "text-white" : "text-blue-500"}`} />
                {sortByDistance ? "Plus Proches" : "A Proximité"}
              </Button>
              <Button 
                variant="outline" 
                className="h-11 gap-2"
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground mr-2">Filtrer par type :</span>
            <Button 
              variant={gardeFilter === "all" ? "default" : "outline"}
              size="sm"
              className={`gap-2 ${gardeFilter === "all" ? "bg-primary" : ""}`}
              onClick={() => setGardeFilter("all")}
              data-testid="filter-all"
            >
              <Pill className="h-4 w-4" />
              Toutes ({gardeCounts.total})
            </Button>
            <Button 
              variant={gardeFilter === "garde" ? "default" : "outline"}
              size="sm"
              className={`gap-2 ${gardeFilter === "garde" ? "bg-green-600 hover:bg-green-700" : "border-green-500/50 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"}`}
              onClick={() => setGardeFilter("garde")}
              data-testid="filter-garde"
            >
              <ShieldCheck className="h-4 w-4" />
              De Garde ({gardeCounts.garde})
            </Button>
            <Button 
              variant={gardeFilter === "24h" ? "default" : "outline"}
              size="sm"
              className={`gap-2 ${gardeFilter === "24h" ? "bg-orange-600 hover:bg-orange-700" : "border-orange-500/50 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"}`}
              onClick={() => setGardeFilter("24h")}
              data-testid="filter-24h"
            >
              <Clock className="h-4 w-4" />
              24h/24 ({gardeCounts.h24})
            </Button>
            <Button 
              variant={gardeFilter === "jour" ? "default" : "outline"}
              size="sm"
              className={`gap-2 ${gardeFilter === "jour" ? "bg-yellow-600 hover:bg-yellow-700" : "border-yellow-500/50 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"}`}
              onClick={() => setGardeFilter("jour")}
              data-testid="filter-jour"
            >
              <Clock className="h-4 w-4" />
              Jour ({gardeCounts.jour})
            </Button>
            <Button 
              variant={gardeFilter === "nuit" ? "default" : "outline"}
              size="sm"
              className={`gap-2 ${gardeFilter === "nuit" ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-500/50 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"}`}
              onClick={() => setGardeFilter("nuit")}
              data-testid="filter-nuit"
            >
              <Clock className="h-4 w-4" />
              Nuit ({gardeCounts.nuit})
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-40 animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : filteredPharmacies.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPharmacies.map((pharmacy) => {
                const tags = pharmacy.tags || {};
                const isOnDuty = tags.is_on_duty || tags.opening_hours === "24/7" || pharmacy.typeGarde === "24h";
                const distance = (pharmacy as any).distance;
                
                return (
                  <Card key={pharmacy.id} className="hover-elevate transition-all border-muted/40 overflow-hidden bg-muted/5 group relative">
                    <div className="absolute top-0 right-0 p-2 flex flex-col gap-2 items-end">
                      {isOnDuty && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-none flex items-center gap-1 shadow-sm">
                          <ShieldCheck className="h-3 w-3" />
                          De Garde
                        </Badge>
                      )}
                      {distance !== undefined && (
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-blue-200 text-blue-700 flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                        </Badge>
                      )}
                    </div>
                    <CardHeader className="p-4 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-bold line-clamp-2">
                          {pharmacy.name || pharmacy.nom}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{pharmacy.quartier || pharmacy.city || pharmacy.ville || "Burkina Faso"}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm">
                          <Navigation className="h-4 w-4 mt-0.5 text-primary" />
                          <span className="text-foreground/80 italic">{pharmacy.address || pharmacy.adresse || "Adresse non spécifiée"}</span>
                        </div>

                        {(pharmacy.telephone || pharmacy.phone) && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-primary" />
                            <a href={`tel:${pharmacy.telephone || pharmacy.phone}`} className="hover:underline">
                              {pharmacy.telephone || pharmacy.phone}
                            </a>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{pharmacy.horaires || tags.opening_hours || "Horaires non renseignés"}</span>
                        </div>
                      </div>

                      <LocationValidator placeId={pharmacy.placeId || pharmacy.id} initialConfirmations={pharmacy.confirmations || 0} initialReports={pharmacy.reports || 0} compact />
                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs h-8"
                          onClick={() => {
                            const lat = pharmacy.latitude || pharmacy.lat;
                            const lon = pharmacy.longitude || pharmacy.lon;
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
                          }}
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Itinéraire
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Aucun lieu trouvé</h3>
              <p className="text-muted-foreground max-w-xs mt-1">
                Essayez de modifier vos critères de recherche ou la région.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
