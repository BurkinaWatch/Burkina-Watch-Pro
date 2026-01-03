import { useState, useMemo } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin, Phone, Globe, ChevronLeft, Search, Building2, BookOpen, Navigation, Library } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { REGION_NAMES } from "@/lib/regions";

export default function Universites() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const { data, isLoading } = useQuery<{ universites: any[], lastUpdated: string }>({
    queryKey: ["/api/universites"],
  });

  const universites = data?.universites || [];

  const stats = useMemo(() => {
    return {
      total: universites.length,
      villes: new Set(universites.map(u => u.ville)).size,
      regions: new Set(universites.map(u => u.region)).size,
      instituts: universites.filter(u => u.tags?.type?.toLowerCase().includes("institut")).length
    };
  }, [universites]);

  const filteredUniversites = useMemo(() => {
    let result = universites;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.ville.toLowerCase().includes(query) ||
        u.address.toLowerCase().includes(query)
      );
    }
    if (selectedRegion !== "all") {
      result = result.filter(u => u.region === selectedRegion);
    }
    return result;
  }, [universites, searchQuery, selectedRegion]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Universités et Instituts - Burkina Faso | Burkina Watch</title>
      </Helmet>
      
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-primary" />
              Éducation Supérieure
            </h1>
            <p className="text-muted-foreground text-sm">
              Universités et Instituts de formation au Burkina Faso
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Établissements</p>
                  <span className="text-2xl font-bold tracking-tight">{stats.total}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Villes</p>
                  <span className="text-2xl font-bold tracking-tight">{stats.villes}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-green-500/10 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Instituts</p>
                  <span className="text-2xl font-bold tracking-tight">{stats.instituts}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-500/10 group-hover:scale-110 transition-transform">
                  <Library className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Régions</p>
                  <span className="text-2xl font-bold tracking-tight">{stats.regions}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-orange-500/10 group-hover:scale-110 transition-transform">
                  <Building2 className="w-5 h-5 text-orange-600" />
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
                  placeholder="Rechercher une université, un institut..."
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
              <Card key={i} className="h-48 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredUniversites.map((u) => (
              <Card key={u.id} className="hover-elevate transition-all group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-base line-clamp-2">{u.name}</CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {u.ville}, {u.region}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {u.tags?.type || "Université"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-xs line-clamp-2">{u.address}</span>
                  </div>
                  
                  {u.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${u.telephone}`} className="text-xs text-primary hover:underline">{u.telephone}</a>
                    </div>
                  )}

                  {u.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={`https://${u.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">
                        {u.website}
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${u.lat},${u.lon}`)}>
                      <Navigation className="w-3 h-3 mr-1" />
                      Itinéraire
                    </Button>
                    {u.website && (
                      <Button variant="default" size="sm" className="flex-1 text-xs h-8" asChild>
                        <a href={`https://${u.website}`} target="_blank" rel="noopener noreferrer">
                          <Globe className="w-3 h-3 mr-1" />
                          Site Web
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}

