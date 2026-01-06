import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, MapPin, Phone, Clock, ExternalLink, Navigation, 
  Building2, Globe, RefreshCcw, ArrowLeft, Crosshair, 
  PlusSquare, ShieldCheck, Info, Accessibility, Pill, Activity,
  ChevronLeft
} from "lucide-react";
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

export default function PharmaciesDuFaso() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [onlyOnDuty, setOnlyOnDuty] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: pharmacies = [], isLoading, isFetching } = useQuery<any[]>({
    queryKey: ["/api/places/pharmacy?limit=5000"],
  });

  const regions = useMemo(() => {
    return REGION_NAMES;
  }, []);

  const onDutyCount = useMemo(() => {
    return pharmacies.filter(p => {
      const tags = p.tags || {};
      return tags.is_on_duty || tags.opening_hours === "24/7" || p.typeGarde === "24h";
    }).length;
  }, [pharmacies]);

  const filteredPharmacies = useMemo(() => {
    let result = pharmacies;
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
    if (onlyOnDuty) {
      result = result.filter(p => {
        const tags = p.tags || {};
        return tags.is_on_duty || tags.opening_hours === "24/7" || p.typeGarde === "24h";
      });
    }
    return result;
  }, [pharmacies, searchTerm, selectedRegion, onlyOnDuty]);

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
                  <p className="text-sm text-muted-foreground">Données enrichies via OpenStreetMap & Burkina Secure</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-red-500/10 border-red-500/20 hover:bg-red-500/15 transition-all group overflow-visible">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest opacity-80">Pharmacies</p>
                  <h3 className="text-3xl font-black">{pharmacies.length}</h3>
                </div>
                <div className="p-2.5 bg-red-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Pill className="h-5 w-5 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10 border-green-500/20 hover:bg-green-500/15 transition-all group overflow-visible">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest opacity-80">De Garde</p>
                  <h3 className="text-3xl font-black">{onDutyCount}</h3>
                </div>
                <div className="p-2.5 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15 transition-all group overflow-visible">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest opacity-80">Villes</p>
                  <h3 className="text-3xl font-black">{new Set(pharmacies.map(p => p.city || p.ville)).size}</h3>
                </div>
                <div className="p-2.5 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-5 w-5 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15 transition-all group overflow-visible cursor-pointer"
              onClick={() => setLocation("/sos")}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest opacity-80">Urgence</p>
                  <h3 className="text-3xl font-black tracking-tighter italic">SOS</h3>
                </div>
                <div className="p-2.5 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <Activity className="h-5 w-5 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une pharmacie, quartier..."
                className="pl-9 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                variant={onlyOnDuty ? "default" : "outline"}
                className={`h-11 gap-2 ${onlyOnDuty ? "bg-green-600 hover:bg-green-700 border-green-600" : ""}`}
                onClick={() => setOnlyOnDuty(!onlyOnDuty)}
              >
                <ShieldCheck className={`h-4 w-4 ${onlyOnDuty ? "text-white" : "text-green-500"}`} />
                {onlyOnDuty ? "Gardes Uniquement" : "Toutes"}
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
                
                return (
                  <Card key={pharmacy.id} className="hover-elevate transition-all border-muted/40 overflow-hidden bg-muted/5 group relative">
                    {isOnDuty && (
                      <div className="absolute top-0 right-0 p-2">
                        <Badge className="bg-green-500 hover:bg-green-600 text-white border-none flex items-center gap-1 shadow-sm">
                          <ShieldCheck className="h-3 w-3" />
                          De Garde
                        </Badge>
                      </div>
                    )}
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
