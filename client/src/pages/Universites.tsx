import { useState, useMemo } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin, Phone, Globe, ArrowLeft, Search, Building2, BookOpen } from "lucide-react";
import PageStatCard from "@/components/PageStatCard";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { REGION_NAMES } from "@/lib/regions";

export default function Universites() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");

  const { data, isLoading } = useQuery<{ universites: any[], lastUpdated: string }>({
    queryKey: ["/api/universites"],
  });

  const universites = data?.universites || [];

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
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Universités et Instituts - Burkina Faso | Burkina Watch</title>
      </Helmet>
      
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              Universités et Instituts
            </h1>
            <p className="text-sm text-muted-foreground">
              Enseignement supérieur au Burkina Faso
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <PageStatCard
            title="Total établissements"
            value={universites.length}
            icon={GraduationCap}
            variant="blue"
          />
          <PageStatCard
            title="Villes couvertes"
            value={new Set(universites.map(u => u.ville)).size}
            icon={MapPin}
            variant="green"
          />
          <PageStatCard
            title="Régions"
            value={new Set(universites.map(u => u.region)).size}
            icon={Building2}
            variant="purple"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une université..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les régions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les régions</SelectItem>
              {REGION_NAMES.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUniversites.map((u) => (
              <Card key={u.id} className="hover-elevate">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg">{u.name}</CardTitle>
                    <Badge variant="secondary">{u.tags?.type || "Université"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>{u.address}, {u.ville} ({u.region})</span>
                  </div>
                  
                  {u.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${u.telephone}`} className="hover:underline text-primary">{u.telephone}</a>
                    </div>
                  )}

                  {u.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={`https://${u.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary truncate">
                        {u.website}
                      </a>
                    </div>
                  )}

                  {u.tags?.courses && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
                        <BookOpen className="h-4 w-4" />
                        Filières principales
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {u.tags.courses.split(", ").map((f: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}

