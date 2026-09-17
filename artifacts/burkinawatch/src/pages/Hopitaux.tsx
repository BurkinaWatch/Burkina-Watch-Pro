import { Hospital, ChevronLeft, MapPin, Phone, Clock, Search, Building2, Landmark, Cross, HeartPulse, Activity, Globe, Navigation, RefreshCw, Locate, Loader2, Truck, Mail, ExternalLink, Info } from "lucide-react";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { REGION_NAMES } from "@/lib/regions";
import { useToast } from "@/hooks/use-toast";
import { LocationValidator } from "@/components/LocationValidator";
import { getLocationErrorMessage, requestUserLocation } from "@/lib/geolocation";
import { MOBILE_CLINIC_NETWORK } from "@/data/mobileClinics";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Hopitaux() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [sortByProximity, setSortByProximity] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: hopitaux = [], isLoading, isFetching } = useQuery<any[]>({
    queryKey: ["/api/places/hospital"],
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/places/hospital"] });
  };

  const handleFindNearest = useCallback(() => {
    setIsLocating(true);
    void requestUserLocation()
      .then((location) => {
        setUserLocation({
          lat: location.lat,
          lon: location.lng,
        });
        setSortByProximity(true);
        toast({
          title: "Position trouvée",
          description: "Les hôpitaux sont triés par proximité.",
        });
      })
      .catch((error) => {
        toast({
          title: "Erreur de localisation",
          description: getLocationErrorMessage(error),
          variant: "destructive",
        });
      })
      .finally(() => setIsLocating(false));
  }, [toast]);

  const stats = useMemo(() => {
    return {
      total: hopitaux.length,
      public: hopitaux.filter(h => h.operator_type === "government" || h.type === "hospital").length,
      prive: hopitaux.filter(h => h.operator_type === "private").length,
      pharmacies: hopitaux.filter(h => h.type === "pharmacy").length,
      villes: new Set(hopitaux.map(h => h.city)).size
    };
  }, [hopitaux]);

  const filteredHopitaux = useMemo(() => {
    let result = hopitaux;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(h => h.name?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q));
    }
    if (selectedRegion !== "all") {
      result = result.filter(h => h.region === selectedRegion);
    }
    if (sortByProximity && userLocation) {
      result = result
        .map(h => ({
          ...h,
          distance: calculateDistance(userLocation.lat, userLocation.lon, h.latitude, h.longitude)
        }))
        .sort((a, b) => a.distance - b.distance);
    }
    return result;
  }, [hopitaux, searchQuery, selectedRegion, sortByProximity, userLocation]);

  return (
    <>
      <Helmet>
        <title>Hôpitaux et Centres de Santé - Burkina Faso | Burkina Watch</title>
        <meta name="description" content="Liste complète des hôpitaux, CMA, Centres de Santé et Cliniques au Burkina Faso avec localisation et contacts." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Hospital className="w-7 h-7 text-primary" />
                  Santé & Hôpitaux
                </h1>
                <p className="text-muted-foreground text-sm">
                  Infrastructures sanitaires au Burkina Faso
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isFetching}
              className="gap-2"
              data-testid="button-refresh-hospitals"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent border-red-500/30 backdrop-blur-sm shadow-lg shadow-red-500/5">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] opacity-80">Établissements</p>
                    <h3 className="text-3xl font-black tracking-tighter text-foreground">{stats.total}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/20 group-hover:bg-red-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                    <Hospital className="w-5 h-5 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-700 animate-pulse-slow" />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </Card>

            <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/30 backdrop-blur-sm shadow-lg shadow-blue-500/5">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] opacity-80">Publics</p>
                    <h3 className="text-3xl font-black tracking-tighter text-foreground">{stats.public}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner">
                    <Building2 className="w-5 h-5 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700 animate-pulse-slow" />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </Card>

            <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/30 backdrop-blur-sm shadow-lg shadow-purple-500/5">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] opacity-80">Privés</p>
                    <h3 className="text-3xl font-black tracking-tighter text-foreground">{stats.prive}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/20 group-hover:bg-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                    <HeartPulse className="w-5 h-5 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700 animate-pulse-slow" />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </Card>

            <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent border-green-500/30 backdrop-blur-sm shadow-lg shadow-green-500/5">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-[0.2em] opacity-80">Villes</p>
                    <h3 className="text-3xl font-black tracking-tighter text-foreground">{stats.villes}</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-green-500/20 group-hover:bg-green-500/30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner">
                    <MapPin className="w-5 h-5 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-700 animate-pulse-slow" />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </Card>

            <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent border-orange-500/30 backdrop-blur-sm shadow-lg shadow-orange-500/5">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.2em] opacity-80">Urgences</p>
                    <h3 className="text-3xl font-black tracking-tighter italic text-foreground">24h/7</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-orange-500/20 group-hover:bg-orange-500/30 group-hover:scale-125 transition-all duration-500 shadow-inner animate-pulse">
                    <Activity className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  </div>
                </div>
              </CardContent>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-700 animate-pulse-slow" />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/30">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <VoiceSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Rechercher un hôpital, une clinique, une ville..."
                  className="flex-1"
                />
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {REGION_NAMES.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={sortByProximity ? "default" : "outline"}
                  size="sm"
                  onClick={handleFindNearest}
                  disabled={isLocating}
                  className="gap-2 whitespace-nowrap"
                  data-testid="button-nearest-hospitals"
                >
                  {isLocating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Locate className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Les plus proches</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-primary/5 to-transparent" data-testid="mobile-clinic-network">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-500/15 p-2.5">
                    <Truck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {MOBILE_CLINIC_NETWORK.unitCount} cliniques mobiles nationales
                      <Badge variant="outline" className="border-emerald-500/40 text-[10px] text-emerald-700">Réseau itinérant</Badge>
                    </CardTitle>
                    <CardDescription className="mt-1 max-w-3xl">
                      {MOBILE_CLINIC_NETWORK.status}. Elles ne disposent pas d’une adresse fixe : leur localisation dépend des campagnes et des sorties sanitaires.
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit shrink-0">{MOBILE_CLINIC_NETWORK.regionCount} régions couvertes</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border bg-background/60 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <HeartPulse className="h-4 w-4 text-emerald-600" />
                    Services documentés
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {MOBILE_CLINIC_NETWORK.services.map((service) => <li key={service}>• {service}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border bg-background/60 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    Activité rapportée pour 2025
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {MOBILE_CLINIC_NETWORK.impact.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/20 bg-background/60 p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="flex items-center gap-2 font-semibold"><Info className="h-4 w-4 text-emerald-600" /> Où trouver la prochaine sortie ?</p>
                  <p className="text-muted-foreground">
                    Contactez le ministère pour confirmer la prochaine localisation, la date de passage et les modalités de prise en charge.
                  </p>
                  <p className="text-muted-foreground">{MOBILE_CLINIC_NETWORK.contact.address}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a href={`tel:${MOBILE_CLINIC_NETWORK.contact.phone}`}><Phone className="h-3.5 w-3.5" />{MOBILE_CLINIC_NETWORK.contact.phone}</a>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a href={`mailto:${MOBILE_CLINIC_NETWORK.contact.email}`}><Mail className="h-3.5 w-3.5" />Email</a>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                    <a href={MOBILE_CLINIC_NETWORK.contact.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" />Source officielle</a>
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Source : <a className="underline underline-offset-2" href={MOBILE_CLINIC_NETWORK.source.url} target="_blank" rel="noreferrer">{MOBILE_CLINIC_NETWORK.source.label}</a>. Les 15 unités sont comptées comme un réseau national et non comme 15 établissements fixes afin de ne pas afficher une fausse adresse.
              </p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-48 animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredHopitaux.map((h) => (
                <Card key={h.id} className="hover-elevate transition-all overflow-hidden group">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-base line-clamp-1">{h.name}</CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {h.city}, {h.region}
                          {h.distance !== undefined && (
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">
                              {h.distance < 1 ? `${Math.round(h.distance * 1000)}m` : `${h.distance.toFixed(1)}km`}
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant={h.operator_type === "government" ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {h.operator_type === "government" ? "Public" : "Privé"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs">{h.opening_hours || "Heures non spécifiées"}</span>
                    </div>
                    {h.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs">{h.phone}</span>
                      </div>
                    )}
                    <LocationValidator placeId={h.placeId} initialConfirmations={h.confirmations} initialReports={h.reports} compact />
                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                        <a href={`tel:${h.phone || "112"}`}>
                          <Phone className="w-3 h-3 mr-1" />
                          Appeler
                        </a>
                      </Button>
                      <Button variant="default" size="sm" className="flex-1 text-xs h-8" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`)}>
                        <Navigation className="w-3 h-3 mr-1" />
                        Itinéraire
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
