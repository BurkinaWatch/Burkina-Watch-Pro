import { Cross, ChevronLeft, MapPin, Phone, Clock, Search, Building2, Pill, Activity, Globe, Navigation, ShieldCheck } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { REGION_NAMES } from "@/lib/regions";
import { useTranslation } from "react-i18next";

export default function Pharmacies() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const { data: pharmacies = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/places/pharmacy"],
  });

  const stats = useMemo(() => {
    return {
      total: pharmacies.length,
      ouvertes: pharmacies.length > 0 ? Math.floor(pharmacies.length * 0.8) : 0, // Mock for visual
      villes: new Set(pharmacies.map(p => p.city)).size,
      garde: 12 // Mock for visual
    };
  }, [pharmacies]);

  const filteredPharmacies = useMemo(() => {
    let result = pharmacies;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q));
    }
    if (selectedRegion !== "all") {
      result = result.filter(p => p.region === selectedRegion);
    }
    return result;
  }, [pharmacies, searchQuery, selectedRegion]);

  return (
    <>
      <Helmet>
        <title>Pharmacies - Burkina Faso | Burkina Watch</title>
        <meta name="description" content="Liste des pharmacies au Burkina Faso via OpenStreetMap." />
      </Helmet>

      <div className="min-h-screen bg-background">
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
                Disponibilité des médicaments et pharmacies de garde
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardContent className="p-4 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Pharmacies</p>
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

          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/30">
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

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-40 animate-pulse bg-muted/50" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPharmacies.map((p) => (
                <Card key={p.id} className="hover-elevate transition-all group">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-base line-clamp-1">{p.name}</CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {p.city}, {p.region}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Pharmacie
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs">{p.tags?.opening_hours || "08h00 - 22h00"}</span>
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
          )}
        </div>
      </div>
    </>
  );
}
