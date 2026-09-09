import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, MapPin, Phone, Globe, ChevronLeft, Search, Building2, BookOpen, Navigation, Library, RefreshCw, Locate, School } from "lucide-react";
import { VoiceSearchInput } from "@/components/VoiceSearchInput";
import PageStatCard from "@/components/PageStatCard";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { REGION_NAMES } from "@/lib/regions";
import { useToast } from "@/hooks/use-toast";
import { LocationValidator } from "@/components/LocationValidator";

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function Universites() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedFiliere, setSelectedFiliere] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<"all" | "universite" | "institut">("all");
  const [sortByProximity, setSortByProximity] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isFetching, refetch } = useQuery<{ universites: any[], lastUpdated: string }>({
    queryKey: ["/api/universites"],
  });

  const universites = data?.universites || [];

  const allFilieres = useMemo(() => {
    // Liste des catégories simplifiées basée sur le document fourni
    return [
      "Sciences juridiques, politiques & sociales",
      "Économie, gestion, commerce & finance",
      "Sciences informatiques & numérique",
      "Mathématiques, physique & sciences exactes",
      "Sciences de la vie & biologie",
      "Agriculture, environnement & ressources naturelles",
      "Sciences de l’ingénieur & technologies",
      "Communication, médias & arts",
      "Langues, lettres & sciences humaines",
      "Éducation & formation",
      "Tourisme, hôtellerie & services",
      "Santé & paramédical"
    ];
  }, []);

  const handleRefresh = async () => {
    toast({ title: "Actualisation...", description: "Mise à jour des données en cours" });
    await refetch();
    toast({ title: "Terminé", description: "Données actualisées avec succès" });
  };

  const handleProximitySort = () => {
    if (sortByProximity) {
      setSortByProximity(false);
      return;
    }
    
    if (userLocation) {
      setSortByProximity(true);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
        setSortByProximity(true);
        setIsLocating(false);
        toast({ title: "Position trouvée", description: "Tri par proximité activé" });
      },
      (error) => {
        setIsLocating(false);
        toast({ title: "Erreur", description: "Impossible d'obtenir votre position", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const stats = useMemo(() => {
    const instituts = universites.filter(u => {
      const type = (u.tags?.type || u.name || "").toLowerCase();
      return type.includes("institut") || type.includes("centre") || type.includes("ecole") || type.includes("école") || type.includes("formation");
    }).length;
    return {
      total: universites.length,
      villes: new Set(universites.map(u => u.ville)).size,
      regions: new Set(universites.map(u => u.region)).size,
      universites: universites.length - instituts,
      instituts
    };
  }, [universites]);

  const filteredUniversites = useMemo(() => {
    let result = universites;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.ville.toLowerCase().includes(query) ||
        u.address.toLowerCase().includes(query) ||
        (u.filières && u.filières.some((f: string) => f.toLowerCase().includes(query)))
      );
    }
    if (selectedRegion !== "all") {
      result = result.filter(u => u.region === selectedRegion);
    }
    if (selectedTypeFilter !== "all") {
      result = result.filter(u => {
        const type = (u.tags?.type || u.name || "").toLowerCase();
        const isInstitut = type.includes("institut") || type.includes("centre") || type.includes("ecole") || type.includes("école") || type.includes("formation");
        return selectedTypeFilter === "institut" ? isInstitut : !isInstitut;
      });
    }
    if (selectedFiliere !== "all") {
      result = result.filter(u => {
        const uFilieres = u.filières || u.tags?.filieres;
        const filiereList = Array.isArray(uFilieres) 
          ? uFilieres 
          : (typeof uFilieres === 'string' ? uFilieres.split(',') : []);
        
        // Mapping de correspondance entre catégories et mots-clés
        const categoryKeywords: Record<string, string[]> = {
          "Sciences juridiques, politiques & sociales": ["droit", "juridique", "politique", "sociale", "sociologie", "anthropologie", "relations internationales"],
          "Économie, gestion, commerce & finance": ["économie", "gestion", "finance", "comptabilité", "banque", "assurance", "marketing", "management", "commerce", "logistique"],
          "Sciences informatiques & numérique": ["informatique", "logiciel", "réseau", "télécom", "cybersécurité", "web", "data", "intelligence artificielle"],
          "Mathématiques, physique & sciences exactes": ["mathématiques", "physique", "chimie", "statistique"],
          "Sciences de la vie & biologie": ["biologie", "biochimie", "microbiologie", "génétique", "biomédicale"],
          "Agriculture, environnement & ressources naturelles": ["agronomie", "agriculture", "élevage", "environnement", "naturelle", " rural", "eau", "assainissement"],
          "Sciences de l’ingénieur & technologies": ["génie", "électrique", "mécanique", "industriel", "énergétique", "technologie", "btp", "maintenance"],
          "Communication, médias & arts": ["communication", "journalisme", "multimédia", "publicité", "audiovisuel", "cinéma", "art", "culture", "patrimoine"],
          "Langues, lettres & sciences humaines": ["langue", "lettre", "linguistique", "traduction", "histoire", "géographie", "philosophie", "psychologie"],
          "Éducation & formation": ["éducation", "pédagogie", "enseignant", "didactique", "scolaire"],
          "Tourisme, hôtellerie & services": ["tourisme", "hôtellerie", "restauration"],
          "Santé & paramédical": ["médecine", "pharmacie", "infirmier", "sage-femme", "santé", "nutrition"]
        };

        const keywords = categoryKeywords[selectedFiliere] || [];
        return filiereList.some(f => 
          keywords.some(k => f.toLowerCase().includes(k.toLowerCase()))
        );
      });
    }
    
    if (sortByProximity && userLocation) {
      result = result.map(u => ({
        ...u,
        distance: calculateDistance(userLocation.lat, userLocation.lon, u.lat, u.lon)
      })).sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }
    
    return result;
  }, [universites, searchQuery, selectedRegion, selectedTypeFilter, selectedFiliere, sortByProximity, userLocation]);

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

        <div className="flex flex-wrap gap-3">
          <PageStatCard
            title="Total"
            value={stats.total}
            icon={GraduationCap}
            description={`${stats.villes} villes`}
            variant="blue"
            onClick={() => {
              setSelectedTypeFilter("all");
              setSelectedRegion("all");
              setSelectedFiliere("all");
            }}
            clickable
          />
          <PageStatCard
            title="Universites"
            value={stats.universites}
            icon={School}
            description="Enseignement superieur"
            variant="green"
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === "universite" ? "all" : "universite")}
            clickable
          />
          <PageStatCard
            title="Instituts"
            value={stats.instituts}
            icon={Library}
            description="Ecoles et centres"
            variant="purple"
            onClick={() => setSelectedTypeFilter(selectedTypeFilter === "institut" ? "all" : "institut")}
            clickable
          />
          <PageStatCard
            title="Regions"
            value={stats.regions}
            icon={Building2}
            description="Couverture nationale"
            variant="amber"
          />
        </div>

        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/30">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <VoiceSearchInput 
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Rechercher une université, un institut..."
                  className="flex-1"
                />
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-region">
                    <SelectValue placeholder="Région" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {REGION_NAMES.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-filiere">
                    <SelectValue placeholder="Filière" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les filières</SelectItem>
                    {allFilieres.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={sortByProximity ? "default" : "outline"}
                  size="sm"
                  onClick={handleProximitySort}
                  disabled={isLocating}
                  className="gap-2"
                  data-testid="button-proximity-sort"
                >
                  <Locate className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
                  {isLocating ? "Localisation..." : "Les plus proches"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isFetching}
                  className="gap-2"
                  data-testid="button-refresh-universities"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
                {sortByProximity && userLocation && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    Tri par distance activé
                  </Badge>
                )}
              </div>
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
                        {u.distance !== undefined && (
                          <span className="ml-2 text-primary font-medium">
                            ({u.distance < 1 ? `${Math.round(u.distance * 1000)}m` : `${u.distance.toFixed(1)}km`})
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {u.tags?.type || "Université"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(u.filières || u.tags?.filieres) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(Array.isArray(u.filières) ? u.filières : (u.tags?.filieres?.split(',') || [])).slice(0, 5).map((f: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-[11px] py-0.5 px-2 bg-primary/5 border-primary/20">
                          {typeof f === 'string' ? f.trim() : f}
                        </Badge>
                      ))}
                      {(Array.isArray(u.filières) ? u.filières : (u.tags?.filieres?.split(',') || [])).length > 5 && (
                        <Badge variant="outline" className="text-[11px] py-0.5 px-2">
                          +{(Array.isArray(u.filières) ? u.filières : (u.tags?.filieres?.split(',') || [])).length - 5}
                        </Badge>
                      )}
                    </div>
                  )}
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

                  <LocationValidator placeId={u.placeId} initialConfirmations={u.confirmations} initialReports={u.reports} compact />
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

