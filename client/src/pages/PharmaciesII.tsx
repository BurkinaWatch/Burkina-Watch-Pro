import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, ExternalLink, Navigation, Building2, Globe, RefreshCcw, ArrowLeft, Crosshair, PlusSquare, ShieldCheck, Info, Accessibility } from "lucide-react";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Place } from "@shared/schema";
import PageStatCard from "@/components/PageStatCard";
import { useLocation } from "wouter";
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

export default function PharmaciesII() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [, setLocation] = useLocation();

  const { data: placesData, isLoading, refetch } = useQuery<{
    places: Place[];
    total: number;
    lastUpdated: string | null;
    source: string;
  }>({
    queryKey: ["/api/places", "pharmacy"],
  });

  const places = useMemo(() => {
    return placesData?.places || [];
  }, [placesData]);

  const regions = useMemo(() => {
    const r = new Set<string>();
    places.forEach(p => {
      if (p.ville) r.add(p.ville);
    });
    return Array.from(r).sort();
  }, [places]);

  const filteredPharmacies = useMemo(() => {
    if (!places || !Array.isArray(places)) return [];
    return places.filter((p: Place) => {
      const matchesSearch = (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.quartier && p.quartier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.ville && p.ville.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRegion = selectedRegion === "all" || p.ville === selectedRegion;
      
      return matchesSearch && matchesRegion;
    });
  }, [places, searchTerm, selectedRegion]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation("/")}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <PlusSquare className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Pharmacies II</h1>
              <p className="text-sm text-muted-foreground">Données enrichies via OpenStreetMap & Burkina Secure</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PageStatCard 
            title="Total" 
            value={places.length} 
            icon={Building2} 
            variant="green"
            description="Lieux répertoriés"
          />
          <PageStatCard 
            title="Régions" 
            value={regions.length} 
            icon={MapPin} 
            variant="blue"
            description="Couverture nationale"
          />
          <PageStatCard 
            title="Source" 
            value="OSM+" 
            icon={Globe} 
            variant="amber"
            description="Données temps réel"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une pharmacie, garde, quartier..."
              className="pl-9 h-11 bg-muted/30 border-muted-foreground/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-pharmacy"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[200px] h-11 bg-muted/30 border-muted-foreground/20">
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
              variant="outline" 
              className="h-11 gap-2 bg-muted/30 border-muted-foreground/20"
              onClick={() => refetch()}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button variant="secondary" className="w-fit gap-2 h-9 rounded-md px-4">
            <Crosshair className="h-4 w-4" />
            Les plus proches
          </Button>
          <p className="text-sm text-muted-foreground font-medium">
            {filteredPharmacies.length} pharmacies trouvées
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden bg-muted/10">
                <CardHeader className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPharmacies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPharmacies.map((pharmacy: Place) => {
              const tags = (pharmacy.tags as any) || {};
              const isOnDuty = tags.is_on_duty || tags.opening_hours === "24/7";
              
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
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {pharmacy.name}
                      </CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate">{pharmacy.quartier || pharmacy.ville || "Burkina Faso"}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <Navigation className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span className="text-foreground/80 italic">{pharmacy.address || "Adresse non spécifiée"}</span>
                      </div>

                      {pharmacy.telephone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-primary shrink-0" />
                          <a href={`tel:${pharmacy.telephone}`} className="hover:underline text-primary/90">
                            {pharmacy.telephone}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span className="flex items-center gap-2">
                          {pharmacy.horaires || "Horaires non renseignés"}
                          {pharmacy.horaires && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Horaires issus d'OpenStreetMap</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-1">
                        {tags.wheelchair === "yes" && (
                          <Badge variant="outline" className="text-[10px] h-5 flex items-center gap-1">
                            <Accessibility className="h-3 w-3" />
                            Accès PMR
                          </Badge>
                        )}
                        {tags.operator && (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {tags.operator}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-muted/30 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs h-8 hover:bg-primary hover:text-primary-foreground"
                        onClick={() => {
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`, '_blank');
                        }}
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Itinéraire
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => {
                          window.open(`https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`, '_blank');
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Aucun lieu trouvé</h3>
            <p className="text-muted-foreground max-w-xs mt-1">
              Essayez de modifier vos critères de recherche ou la région.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
