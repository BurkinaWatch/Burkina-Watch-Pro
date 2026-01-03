import { Cross, ChevronLeft, MapPin, Phone, Clock, Search, Pill, Activity, Navigation, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { REGION_NAMES } from "@/lib/regions";
import { useTranslation } from "react-i18next";
import type { Place } from "@shared/schema";

export default function Pharmacies() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  // OSM Data
  const { data: pharmaciesOSM = [], isLoading: isLoadingOSM } = useQuery<any[]>({
    queryKey: ["/api/places/pharmacy"],
  });

  // DB Data
  const { data: placesData, isLoading: isLoadingDB } = useQuery<{
    places: Place[];
    total: number;
    lastUpdated: string | null;
    source: string;
  }>({
    queryKey: ["/api/places", "pharmacy"],
  });

  const pharmaciesDB = useMemo(() => placesData?.places || [], [placesData]);

  const stats = useMemo(() => {
    return {
      total: pharmaciesOSM.length + pharmaciesDB.length,
      garde: 12, // Mock for visual
      villes: new Set([...pharmaciesOSM.map(p => p.city), ...pharmaciesDB.map(p => p.ville)]).size,
    };
  }, [pharmaciesOSM, pharmaciesDB]);

  const filterData = (data: any[], isOSM: boolean) => {
    let result = data;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (isOSM) {
        result = result.filter(p => p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q));
      } else {
        result = result.filter(p => 
          (p.name || "").toLowerCase().includes(q) ||
          (p.quartier && p.quartier.toLowerCase().includes(q)) ||
          (p.ville && p.ville.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q))
        );
      }
    }
    if (selectedRegion !== "all") {
      if (isOSM) {
        result = result.filter(p => p.region === selectedRegion);
      } else {
        // Assume region mapping might be needed if DB has it, otherwise just filter name
        result = result.filter(p => p.ville === selectedRegion || p.quartier === selectedRegion);
      }
    }
    return result;
  };

  const filteredOSM = useMemo(() => filterData(pharmaciesOSM, true), [pharmaciesOSM, searchQuery, selectedRegion]);
  const filteredDB = useMemo(() => filterData(pharmaciesDB, false), [pharmaciesDB, searchQuery, selectedRegion]);

  return (
    <>
      <Helmet>
        <title>Pharmacies - Burkina Faso | Burkina Watch</title>
        <meta name="description" content="Liste des pharmacies au Burkina Faso via OpenStreetMap et Base de Données." />
      </Helmet>

      <div className="min-h-screen bg-background pb-10">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Cross className="w-7 h-7 text-red-500" />
                Pharmacies
              </h1>
              <p className="text-muted-foreground text-sm">
                Disponibilité des médicaments et pharmacies de garde (Sources OSM & DB)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <span className="text-2xl font-bold tracking-tight">{stats.total}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/10 group-hover:scale-110 transition-transform">
                    <Pill className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">De Garde</p>
                    <span className="text-2xl font-bold tracking-tight">{stats.garde}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-green-500/10 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Villes</p>
                    <span className="text-2xl font-bold tracking-tight">{stats.villes}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:scale-110 transition-transform">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Urgence</p>
                    <span className="text-2xl font-bold tracking-tight">SOS</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-orange-500/10 group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/30 sticky top-0 z-20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une pharmacie, ville..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="osm" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="osm" className="flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Source OpenStreetMap ({filteredOSM.length})
              </TabsTrigger>
              <TabsTrigger value="db" className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Source Base de Données ({filteredDB.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="osm">
              {isLoadingOSM ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} className="h-40 animate-pulse bg-muted/50" />
                  ))}
                </div>
              ) : filteredOSM.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredOSM.map((p) => (
                    <Card key={p.id} className="hover-elevate transition-all group overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-base line-clamp-2">{p.name}</CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{p.city}, {p.region}</span>
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 bg-green-500/10 text-green-700 border-green-200">
                            OSM
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-xs truncate">{p.tags?.opening_hours || "Horaires non renseignés"}</span>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" asChild>
                            <a href={`tel:${p.tags?.phone || ""}`}>
                              <Phone className="w-3 h-3 mr-1" />
                              Appeler
                            </a>
                          </Button>
                          <Button variant="default" size="sm" className="flex-1 text-xs h-8" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`)}>
                            <Navigation className="w-3 h-3 mr-1" />
                            Itinéraire
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune pharmacie trouvée dans la source OSM.
                </div>
              )}
            </TabsContent>

            <TabsContent value="db">
              {isLoadingDB ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} className="h-40 animate-pulse bg-muted/50" />
                  ))}
                </div>
              ) : filteredDB.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredDB.map((pharmacy: Place) => (
                    <Card key={pharmacy.id} className="hover-elevate transition-all border-muted/40 overflow-hidden">
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-base font-bold leading-tight line-clamp-2">
                            {pharmacy.name}
                          </CardTitle>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1 shrink-0" />
                            <span className="truncate">{pharmacy.quartier || pharmacy.ville || "Burkina Faso"}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0 bg-blue-500/10 text-blue-700 border-blue-200">
                          DB
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 text-sm">
                            <Navigation className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            <span className="text-xs text-foreground/80 italic line-clamp-2">{pharmacy.address || "Adresse non spécifiée"}</span>
                          </div>
                          {pharmacy.telephone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-primary shrink-0" />
                              <a href={`tel:${pharmacy.telephone}`} className="text-xs hover:text-primary transition-colors">
                                {pharmacy.telephone}
                              </a>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span className="text-xs">{pharmacy.horaires || "Horaires non renseignés"}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t mt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs h-8"
                            onClick={() => {
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`, '_blank');
                            }}
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Itinéraire
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune pharmacie trouvée dans la base de données.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
