import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Bus, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Star, 
  Search, 
  ArrowRight, 
  Building2, 
  Route as RouteIcon,
  Calendar,
  Banknote,
  Users,
  Wifi,
  Snowflake,
  Package,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Navigation,
  Train,
  CircleDot,
  Locate
} from "lucide-react";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { LocationValidator } from "@/components/LocationValidator";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";

interface Compagnie {
  id: string;
  nom: string;
  nomComplet: string;
  description: string;
  fondee: number;
  siege: string;
  telephone: string[];
  email?: string;
  siteWeb?: string;
  services: string[];
  destinations: string[];
  note: number;
  avis: string;
}

interface GareDestination {
  ville: string;
  horaires: string[];
  duree?: string;
  prix?: number;
  compagnies?: string[];
}

interface Gare {
  id: string;
  nom: string;
  ville: string;
  region: string;
  adresse: string;
  coordonnees: { lat: number; lng: number };
  telephone?: string;
  compagnie: string;
  type: "principale" | "secondaire" | "agence";
  destinations?: GareDestination[];
  heuresOuverture?: string;
  services?: string[];
  imageUrl?: string;
}

interface GareDepart {
  nom: string;
  adresse: string;
  coordonnees: { lat: number; lng: number };
  telephone?: string;
}

interface Trajet {
  id: string;
  compagnieId: string;
  depart: string;
  arrivee: string;
  horaires: string[];
  duree: string;
  prix: number;
  prixVIP?: number;
  frequence: string;
  jours: string[];
  gareDepart?: GareDepart;
}

interface TransportStats {
  totalCompagnies: number;
  totalGares: number;
  totalTrajets: number;
  villesDesservies: number;
  destinationsInternationales: number;
}

const GARES_PER_PAGE = 50;

const VILLE_COORDS: Record<string, {lat: number, lon: number}> = {
  "Ouagadougou": { lat: 12.3714, lon: -1.5197 },
  "Bobo-Dioulasso": { lat: 11.1771, lon: -4.2979 },
  "Koudougou": { lat: 12.2525, lon: -2.3628 },
  "Ouahigouya": { lat: 13.5826, lon: -2.4213 },
  "Banfora": { lat: 10.6328, lon: -4.7580 },
  "Kaya": { lat: 13.0910, lon: -1.0842 },
  "Fada N'Gourma": { lat: 12.0626, lon: 0.3574 },
  "Tenkodogo": { lat: 11.7800, lon: -0.3697 },
  "Dori": { lat: 14.0354, lon: -0.0347 },
  "Dedougou": { lat: 12.4633, lon: -3.4606 },
  "Gaoua": { lat: 10.3250, lon: -3.1667 },
  "Orodara": { lat: 10.9760, lon: -4.9081 },
  "Ziniaré": { lat: 12.5833, lon: -1.3000 },
  "Pô": { lat: 11.1667, lon: -1.1500 },
  "Léo": { lat: 11.1000, lon: -2.1000 },
  "Diapaga": { lat: 12.0728, lon: 1.7881 },
  "Djibo": { lat: 14.1000, lon: -1.6333 }
};

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

function findNearestCity(lat: number, lon: number): string {
  let nearest = "Ouagadougou";
  let minDistance = Infinity;
  for (const [ville, coords] of Object.entries(VILLE_COORDS)) {
    const dist = calculateDistance(lat, lon, coords.lat, coords.lon);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = ville;
    }
  }
  return nearest;
}

export default function Gares() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompagnie, setSelectedCompagnie] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [departVille, setDepartVille] = useState("");
  const [arriveeVille, setArriveeVille] = useState("");
  const [activeTab, setActiveTab] = useState("gares");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedGare, setExpandedGare] = useState<string | null>(null);
  const [showCompagnies, setShowCompagnies] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { toast } = useToast();

  const [includeOSM, setIncludeOSM] = useState(true);
  const [sortByNearest, setSortByNearest] = useState(false);
  const [sortSitarailNearest, setSortSitarailNearest] = useState(false);
  const [sortSotracoNearest, setSortSotracoNearest] = useState(false);
  const [sortDepartsNearest, setSortDepartsNearest] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLocatingForSort, setIsLocatingForSort] = useState(false);
  
  const { data: transportData, isLoading } = useQuery<{
    compagnies: Compagnie[];
    gares: Gare[];
    trajets: Trajet[];
    stats: TransportStats;
  }>({
    queryKey: ["/api/transport", { osm: includeOSM }],
    queryFn: async () => {
      const response = await fetch(`/api/transport?osm=${includeOSM}`);
      if (!response.ok) throw new Error("Failed to fetch transport data");
      return response.json();
    }
  });

  const compagnies = transportData?.compagnies || [];
  const gares = transportData?.gares || [];
  const trajets = transportData?.trajets || [];
  const stats = transportData?.stats;

  const regions = useMemo(() => {
    return Array.from(new Set(gares.map(g => g.region))).sort();
  }, [gares]);

  // Compteur des gares hors SOTRACO et SITARAIL pour l'onglet principal
  const garesOngletPrincipal = useMemo(() => {
    return gares.filter(g => g.compagnie !== "sotraco" && g.compagnie !== "sitarail").length;
  }, [gares]);

  // Compteur des gares SITARAIL (trains)
  const garesSitarail = useMemo(() => {
    return gares.filter(g => g.compagnie === "sitarail").length;
  }, [gares]);

  // Compteur des lignes SOTRACO (37 lignes: 18 Ouaga + 12 Bobo + 7 Koudougou)
  const lignesSotraco = 37;

  const requestLocationAndSort = (setter: (v: boolean) => void, currentValue: boolean, label: string) => {
    if (currentValue) {
      setter(false);
      return;
    }
    if (userLocation) {
      setter(true);
      setCurrentPage(1);
      return;
    }
    setIsLocatingForSort(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setter(true);
        setCurrentPage(1);
        setIsLocatingForSort(false);
        toast({ title: "Position trouvee", description: `${label} triés par proximité` });
      },
      () => {
        setIsLocatingForSort(false);
        toast({ title: "Erreur de localisation", description: "Impossible d'obtenir votre position", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSortByNearest = () => requestLocationAndSort(setSortByNearest, sortByNearest, "Les gares sont");
  const handleSortSitarailNearest = () => requestLocationAndSort(setSortSitarailNearest, sortSitarailNearest, "Les gares SITARAIL sont");
  const handleSortSotracoNearest = () => requestLocationAndSort(setSortSotracoNearest, sortSotracoNearest, "Les lignes SOTRACO sont");
  const handleSortDepartsNearest = () => requestLocationAndSort(setSortDepartsNearest, sortDepartsNearest, "Les trajets sont");

  const getDistanceToGare = (gare: Gare): number | null => {
    if (!userLocation) return null;
    return calculateDistance(userLocation.lat, userLocation.lng, gare.coordonnees.lat, gare.coordonnees.lng);
  };

  const filteredGares = useMemo(() => {
    const filtered = gares.filter(gare => {
      if (gare.compagnie === "sotraco" || gare.compagnie === "sitarail") return false;
      
      const matchesSearch = searchQuery === "" || 
        gare.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gare.ville.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (gare.adresse || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCompagnie = selectedCompagnie === "all" || 
        gare.compagnie === selectedCompagnie;
      const matchesRegion = selectedRegion === "all" || 
        gare.region === selectedRegion;
      return matchesSearch && matchesCompagnie && matchesRegion;
    });

    if (sortByNearest && userLocation) {
      filtered.sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coordonnees.lat, a.coordonnees.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coordonnees.lat, b.coordonnees.lng);
        return distA - distB;
      });
    }

    return filtered;
  }, [gares, searchQuery, selectedCompagnie, selectedRegion, sortByNearest, userLocation]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCompagnie, selectedRegion]);

  const totalPages = Math.ceil(filteredGares.length / GARES_PER_PAGE);
  const paginatedGares = useMemo(() => {
    const start = (currentPage - 1) * GARES_PER_PAGE;
    return filteredGares.slice(start, start + GARES_PER_PAGE);
  }, [filteredGares, currentPage]);

  // Liste des villes de départ disponibles
  const villesDepart = useMemo(() => {
    const villes = Array.from(new Set(trajets.map(t => t.depart))).sort();
    return villes;
  }, [trajets]);

  // Liste des villes d'arrivée disponibles  
  const villesArrivee = useMemo(() => {
    const villes = Array.from(new Set(trajets.map(t => t.arrivee))).sort();
    return villes;
  }, [trajets]);

  const handleLocateMe = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearestCity = findNearestCity(position.coords.latitude, position.coords.longitude);
        setDepartVille(nearestCity);
        setIsLocating(false);
        toast({ 
          title: "Position trouvée", 
          description: `Ville la plus proche: ${nearestCity}` 
        });
      },
      (error) => {
        setIsLocating(false);
        toast({ 
          title: "Erreur de localisation", 
          description: "Impossible d'obtenir votre position", 
          variant: "destructive" 
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredTrajets = useMemo(() => {
    const filtered = trajets.filter(trajet => {
      const matchesDepart = departVille === "" || 
        trajet.depart.toLowerCase().includes(departVille.toLowerCase());
      const matchesArrivee = arriveeVille === "" || 
        trajet.arrivee.toLowerCase().includes(arriveeVille.toLowerCase());
      const matchesCompagnie = selectedCompagnie === "all" || 
        trajet.compagnieId === selectedCompagnie;
      return matchesDepart && matchesArrivee && matchesCompagnie;
    });
    if (sortDepartsNearest && userLocation) {
      filtered.sort((a, b) => {
        const aCoordsGare = a.gareDepart?.coordonnees;
        const bCoordsGare = b.gareDepart?.coordonnees;
        const aCoordsVille = VILLE_COORDS[a.depart];
        const bCoordsVille = VILLE_COORDS[b.depart];
        const distA = aCoordsGare ? calculateDistance(userLocation.lat, userLocation.lng, aCoordsGare.lat, aCoordsGare.lng) : aCoordsVille ? calculateDistance(userLocation.lat, userLocation.lng, aCoordsVille.lat, aCoordsVille.lon) : Infinity;
        const distB = bCoordsGare ? calculateDistance(userLocation.lat, userLocation.lng, bCoordsGare.lat, bCoordsGare.lng) : bCoordsVille ? calculateDistance(userLocation.lat, userLocation.lng, bCoordsVille.lat, bCoordsVille.lon) : Infinity;
        return distA - distB;
      });
    }
    return filtered;
  }, [trajets, departVille, arriveeVille, selectedCompagnie, sortDepartsNearest, userLocation]);

  const sortedSitarailGares = useMemo(() => {
    const sitarail = gares.filter(g => g.compagnie === "sitarail");
    if (sortSitarailNearest && userLocation) {
      return [...sitarail].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coordonnees.lat, a.coordonnees.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coordonnees.lat, b.coordonnees.lng);
        return distA - distB;
      });
    }
    const order = ["ouaga", "koudougou", "siby", "bobo", "banfora", "niangoloko"];
    return sitarail.sort((a, b) => {
      const aIdx = order.findIndex(o => a.id.includes(o));
      const bIdx = order.findIndex(o => b.id.includes(o));
      return aIdx - bIdx;
    });
  }, [gares, sortSitarailNearest, userLocation]);

  const sortedSotracoGares = useMemo(() => {
    const sotraco = gares.filter(g => g.compagnie === "sotraco");
    if (sortSotracoNearest && userLocation) {
      return [...sotraco].sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coordonnees.lat, a.coordonnees.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coordonnees.lat, b.coordonnees.lng);
        return distA - distB;
      });
    }
    return sotraco;
  }, [gares, sortSotracoNearest, userLocation]);

  const getDistanceToTrajet = (trajet: Trajet): number | null => {
    if (!userLocation) return null;
    const gareCoordsObj = trajet.gareDepart?.coordonnees;
    if (gareCoordsObj) {
      return calculateDistance(userLocation.lat, userLocation.lng, gareCoordsObj.lat, gareCoordsObj.lng);
    }
    const villeCoords = VILLE_COORDS[trajet.depart];
    if (villeCoords) {
      return calculateDistance(userLocation.lat, userLocation.lng, villeCoords.lat, villeCoords.lon);
    }
    return null;
  };

  const getCompagnieNom = (id: string) => {
    return compagnies.find(c => c.id === id)?.nom || id;
  };

  const renderStars = (note: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < Math.floor(note) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
        />
      );
    }
    return stars;
  };

  const getServiceIcon = (service: string) => {
    if (service.toLowerCase().includes("clim")) return <Snowflake className="w-3 h-3" />;
    if (service.toLowerCase().includes("wifi")) return <Wifi className="w-3 h-3" />;
    if (service.toLowerCase().includes("bagage") || service.toLowerCase().includes("colis")) return <Package className="w-3 h-3" />;
    return null;
  };

  const openGoogleMaps = (lat: number, lng: number, nom: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(nom)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-muted rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gares Routieres et Horaires - Burkina Faso | Burkina Watch</title>
        <meta name="description" content="Liste complete des gares routieres et horaires de bus au Burkina Faso. Compagnies: Rahimo, TCV, STMB, TSR, STAF, Rakieta. Trajets nationaux et internationaux." />
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
                <Bus className="w-7 h-7 text-primary" />
                Gares Routieres
              </h1>
              <p className="text-muted-foreground text-sm">
                Transport interurbain au Burkina Faso
              </p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4" data-testid="container-stats">
              {/* Compagnies Card */}
              <Card 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 ${showCompagnies ? 'ring-2 ring-primary shadow-xl' : ''}`}
                onClick={() => setShowCompagnies(!showCompagnies)}
                data-testid="card-stat-compagnies"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
                  <svg width="120" height="120" viewBox="0 0 100 100" className="transform rotate-12">
                    <path d="M50 10 L70 30 L70 70 L50 90 L30 70 L30 30 Z" fill="#E30613" opacity="0.3"/>
                    <path d="M50 20 L65 35 L65 65 L50 80 L35 65 L35 35 Z" fill="#FFD100" opacity="0.4"/>
                    <path d="M50 30 L60 40 L60 60 L50 70 L40 60 L40 40 Z" fill="#007A33" opacity="0.5"/>
                    <path d="M50 35 L52 42 L59 42 L53 46 L55 53 L50 48 L45 53 L47 46 L41 42 L48 42 Z" fill="#E30613" opacity="0.8"/>
                  </svg>
                </div>
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Compagnies
                        {showCompagnies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight">{stats.totalCompagnies}</span>
                        <span className="text-sm font-medium text-green-600">↗</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 flex">
                  <div className="flex-1 bg-[#E30613]/30"></div>
                  <div className="flex-1 bg-[#FFD100]/30"></div>
                  <div className="flex-1 bg-[#007A33]/30"></div>
                </div>
              </Card>

              {/* Gares Card */}
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
                  <svg width="120" height="120" viewBox="0 0 100 100" className="transform rotate-12">
                    <path d="M50 10 L70 30 L70 70 L50 90 L30 70 L30 30 Z" fill="#007A33" opacity="0.3"/>
                    <path d="M50 20 L65 35 L65 65 L50 80 L35 65 L35 35 Z" fill="#FFD100" opacity="0.4"/>
                    <path d="M50 30 L60 40 L60 60 L50 70 L40 60 L40 40 Z" fill="#E30613" opacity="0.5"/>
                    <path d="M50 35 L52 42 L59 42 L53 46 L55 53 L50 48 L45 53 L47 46 L41 42 L48 42 Z" fill="#FFD100" opacity="0.8"/>
                  </svg>
                </div>
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Gares</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight">{stats.totalGares}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-green-500/10 transition-transform duration-300 group-hover:scale-110">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 flex">
                  <div className="flex-1 bg-[#007A33]/30"></div>
                  <div className="flex-1 bg-[#FFD100]/30"></div>
                  <div className="flex-1 bg-[#E30613]/30"></div>
                </div>
              </Card>

              {/* Gares Train Card */}
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 hover:border-orange-500/40">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
                  <svg width="120" height="120" viewBox="0 0 100 100" className="transform rotate-12">
                    <path d="M50 10 L70 30 L70 70 L50 90 L30 70 L30 30 Z" fill="#E30613" opacity="0.3"/>
                    <path d="M50 20 L65 35 L65 65 L50 80 L35 65 L35 35 Z" fill="#FFD100" opacity="0.4"/>
                    <path d="M50 30 L60 40 L60 60 L50 70 L40 60 L40 40 Z" fill="#007A33" opacity="0.5"/>
                    <path d="M50 35 L52 42 L59 42 L53 46 L55 53 L50 48 L45 53 L47 46 L41 42 L48 42 Z" fill="#E30613" opacity="0.8"/>
                  </svg>
                </div>
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Gares Train</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight">{garesSitarail}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-orange-500/10 transition-transform duration-300 group-hover:scale-110">
                      <Train className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 flex">
                  <div className="flex-1 bg-[#E30613]/30"></div>
                  <div className="flex-1 bg-[#FFD100]/30"></div>
                  <div className="flex-1 bg-[#007A33]/30"></div>
                </div>
              </Card>

              {/* Lignes SOTRACO Card */}
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
                  <svg width="120" height="120" viewBox="0 0 100 100" className="transform rotate-12">
                    <path d="M50 10 L70 30 L70 70 L50 90 L30 70 L30 30 Z" fill="#007A33" opacity="0.3"/>
                    <path d="M50 20 L65 35 L65 65 L50 80 L35 65 L35 35 Z" fill="#FFD100" opacity="0.4"/>
                    <path d="M50 30 L60 40 L60 60 L50 70 L40 60 L40 40 Z" fill="#E30613" opacity="0.5"/>
                    <path d="M50 35 L52 42 L59 42 L53 46 L55 53 L50 48 L45 53 L47 46 L41 42 L48 42 Z" fill="#FFD100" opacity="0.8"/>
                  </svg>
                </div>
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Lignes SOTRACO</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight">{lignesSotraco}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 transition-transform duration-300 group-hover:scale-110">
                      <Bus className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 flex">
                  <div className="flex-1 bg-[#007A33]/30"></div>
                  <div className="flex-1 bg-[#FFD100]/30"></div>
                  <div className="flex-1 bg-[#E30613]/30"></div>
                </div>
              </Card>

              {/* International Card */}
              <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                <div className="absolute -right-6 -top-6 opacity-5 pointer-events-none">
                  <svg width="120" height="120" viewBox="0 0 100 100" className="transform rotate-12">
                    <path d="M50 10 L70 30 L70 70 L50 90 L30 70 L30 30 Z" fill="#3B82F6" opacity="0.3"/>
                    <path d="M50 20 L65 35 L65 65 L50 80 L35 65 L35 35 Z" fill="#60A5FA" opacity="0.4"/>
                    <path d="M50 30 L60 40 L60 60 L50 70 L40 60 L40 40 Z" fill="#93C5FD" opacity="0.5"/>
                    <path d="M50 35 L52 42 L59 42 L53 46 L55 53 L50 48 L45 53 L47 46 L41 42 L48 42 Z" fill="#3B82F6" opacity="0.8"/>
                  </svg>
                </div>
                <CardContent className="p-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">International</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold tracking-tight">{stats.destinationsInternationales}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-500/10 transition-transform duration-300 group-hover:scale-110">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
                <div className="absolute bottom-0 left-0 right-0 h-1 flex">
                  <div className="flex-1 bg-[#E30613]/30"></div>
                  <div className="flex-1 bg-[#FFD100]/30"></div>
                  <div className="flex-1 bg-[#007A33]/30"></div>
                </div>
              </Card>
            </div>
          )}

          {/* Section Compagnies (affichee quand on clique sur la carte Compagnies) */}
          {showCompagnies && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Les {compagnies.length} compagnies de transport
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCompagnies(false)}
                  data-testid="button-close-compagnies"
                >
                  Fermer
                  <ChevronUp className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 animate-in slide-in-from-top-2 duration-300">
                {compagnies.map((compagnie) => (
                  <Card key={compagnie.id} className="overflow-hidden hover-elevate" data-testid={`card-compagnie-${compagnie.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Bus className="w-5 h-5 text-primary" />
                            {compagnie.nom}
                          </CardTitle>
                          <CardDescription>{compagnie.nomComplet}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(compagnie.note)}
                          <span className="text-sm font-medium ml-1">{compagnie.note}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{compagnie.description}</p>
                      
                      <div className="flex flex-wrap gap-1">
                        {compagnie.services.slice(0, 4).map((service, i) => (
                          <Badge key={i} variant="secondary" className="text-xs flex items-center gap-1">
                            {getServiceIcon(service)}
                            {service}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{compagnie.siege}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Depuis {compagnie.fondee}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {compagnie.telephone.map((tel, i) => (
                          <a key={i} href={`tel:${tel}`}>
                            <Button variant="outline" size="sm" className="text-xs" data-testid={`button-call-${compagnie.id}-${i}`}>
                              <Phone className="w-3 h-3 mr-1" />
                              {tel}
                            </Button>
                          </a>
                        ))}
                        {compagnie.siteWeb && (
                          <a href={compagnie.siteWeb} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="text-xs" data-testid={`button-website-${compagnie.id}`}>
                              <Globe className="w-3 h-3 mr-1" />
                              Site web
                            </Button>
                          </a>
                        )}
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Destinations principales:</p>
                        <div className="flex flex-wrap gap-1">
                          {compagnie.destinations.slice(0, 5).map((dest, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {dest}
                            </Badge>
                          ))}
                          {compagnie.destinations.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{compagnie.destinations.length - 5}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-md p-2">
                        <p className="text-xs italic text-muted-foreground">{compagnie.avis}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section de navigation principale avec titre explicatif */}
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/30">
            <CardContent className="p-4">
              <div className="text-center mb-3">
                <h2 className="text-lg font-bold flex items-center justify-center gap-2">
                  <Bus className="w-5 h-5 text-primary" />
                  Que recherchez-vous ?
                </h2>
                <p className="text-sm text-muted-foreground">Gares routieres, train SITARAIL, bus SOTRACO et grands departs</p>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1 gap-0.5 sm:gap-1 bg-muted/50">
                  <TabsTrigger 
                    value="gares" 
                    className="flex flex-col items-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 px-1 sm:px-2 data-[state=active]:bg-green-500/20 data-[state=active]:border-green-500 data-[state=active]:border-2 min-w-0"
                    data-testid="tab-gares"
                  >
                    <MapPin className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="font-semibold text-[10px] sm:text-xs truncate max-w-full">Gares</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">{garesOngletPrincipal} gares</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sitarail" 
                    className="flex flex-col items-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 px-1 sm:px-2 data-[state=active]:bg-orange-500/20 data-[state=active]:border-orange-500 data-[state=active]:border-2 min-w-0"
                    data-testid="tab-sitarail"
                  >
                    <Train className="w-4 h-4 text-orange-600 shrink-0" />
                    <span className="font-semibold text-[10px] sm:text-xs truncate max-w-full">SITARAIL</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">Train</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sotraco" 
                    className="flex flex-col items-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 px-1 sm:px-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-emerald-500 data-[state=active]:border-2 min-w-0"
                    data-testid="tab-sotraco"
                  >
                    <Bus className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-[10px] sm:text-xs truncate max-w-full">SOTRACO</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">Bus urbain</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="horaires" 
                    className="flex flex-col items-center gap-0.5 sm:gap-1 py-1.5 sm:py-2 px-1 sm:px-2 data-[state=active]:bg-purple-500/20 data-[state=active]:border-purple-500 data-[state=active]:border-2 min-w-0"
                    data-testid="tab-horaires"
                  >
                    <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="font-semibold text-[10px] sm:text-xs truncate max-w-full">Departs</span>
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">Horaires & Prix</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

            <TabsContent value="gares" className="space-y-4">
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Rechercher une gare, ville ou adresse..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-gares"
                      />
                    </div>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-region">
                        <SelectValue placeholder="Region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les regions ({regions.length})</SelectItem>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedCompagnie} onValueChange={setSelectedCompagnie}>
                      <SelectTrigger className="w-full sm:w-48" data-testid="select-compagnie">
                        <SelectValue placeholder="Compagnie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les compagnies</SelectItem>
                        {compagnies.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-xs text-muted-foreground">
                      {filteredGares.length > GARES_PER_PAGE 
                        ? `Affichage ${(currentPage - 1) * GARES_PER_PAGE + 1}-${Math.min(currentPage * GARES_PER_PAGE, filteredGares.length)} sur ${filteredGares.length} gares`
                        : `${filteredGares.length} gare${filteredGares.length > 1 ? "s" : ""} trouvee${filteredGares.length > 1 ? "s" : ""}`
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={sortByNearest ? "default" : "outline"}
                        size="sm"
                        onClick={handleSortByNearest}
                        disabled={isLocatingForSort}
                        className="gap-1.5 text-xs"
                        data-testid="button-sort-nearest"
                      >
                        <Locate className={`w-3.5 h-3.5 ${isLocatingForSort ? 'animate-spin' : ''}`} />
                        {isLocatingForSort ? "Localisation..." : sortByNearest ? "Les plus proches" : "Les plus proches"}
                      </Button>
                      <span className="text-xs text-muted-foreground hidden sm:inline">Source: Donnees verifiees + OSM</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {paginatedGares.map((gare) => {
                  const distance = sortByNearest ? getDistanceToGare(gare) : null;
                  return (
                  <Card 
                    key={gare.id} 
                    className={`hover-elevate cursor-pointer transition-all ${expandedGare === gare.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setExpandedGare(expandedGare === gare.id ? null : gare.id)}
                    data-testid={`card-gare-${gare.id}`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm">{gare.nom}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {gare.ville}, {gare.region}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {distance !== null && (
                            <Badge variant="outline" className="text-xs gap-1 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                              <Locate className="w-3 h-3" />
                              {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`}
                            </Badge>
                          )}
                          <Badge 
                            variant={gare.type === "principale" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {gare.type}
                          </Badge>
                        </div>
                      </div>
                      
                      {gare.adresse && (
                        <p className="text-xs text-muted-foreground">{gare.adresse}</p>
                      )}
                      
                      {gare.heuresOuverture && (
                        <p className="text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary" />
                          <span className="text-muted-foreground">Ouvert:</span> {gare.heuresOuverture}
                        </p>
                      )}

                      {gare.destinations && gare.destinations.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">Destinations:</span>
                          {gare.destinations.slice(0, 3).map((dest, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {dest.ville}
                            </Badge>
                          ))}
                          {gare.destinations.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{gare.destinations.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="outline" className="text-xs">
                          {gare.compagnie === "Publique" ? "Publique" : getCompagnieNom(gare.compagnie)}
                        </Badge>
                        <div className="flex gap-1">
                          {gare.telephone && (
                            <a href={`tel:${gare.telephone}`} onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" data-testid={`button-call-gare-${gare.id}`}>
                                <Phone className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openGoogleMaps(gare.coordonnees.lat, gare.coordonnees.lng, gare.nom);
                            }}
                            data-testid={`button-map-gare-${gare.id}`}
                          >
                            <Navigation className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                        <LocationValidator
                          placeId={gare.id}
                          initialConfirmations={0}
                          initialReports={0}
                          compact
                        />
                      </div>

                      {expandedGare === gare.id && gare.destinations && gare.destinations.length > 0 && (
                        <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <RouteIcon className="w-4 h-4 text-primary" />
                            Destinations et Horaires
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {gare.destinations.map((dest, i) => (
                              <div key={i} className="bg-muted/30 rounded-md p-2 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{dest.ville}</span>
                                  <div className="flex items-center gap-2">
                                    {dest.duree && (
                                      <span className="text-xs text-muted-foreground">{dest.duree}</span>
                                    )}
                                    {dest.prix && (
                                      <Badge variant="secondary" className="text-xs font-mono">
                                        {dest.prix.toLocaleString()} F
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {dest.horaires && dest.horaires.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {dest.horaires.map((h, j) => (
                                      <Badge key={j} variant="outline" className="text-xs font-mono">
                                        {h}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {dest.compagnies && dest.compagnies.length > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Bus className="w-3 h-3" />
                                    {dest.compagnies.join(", ")}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {gare.services && gare.services.length > 0 && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground mb-1">Services:</p>
                              <div className="flex flex-wrap gap-1">
                                {gare.services.map((service, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {service}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  );
                })}
              </div>

              {filteredGares.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Aucune gare trouvee</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                    <span className="hidden xs:inline">Precedent</span>
                    <span className="xs:hidden">Prec.</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 3) {
                        page = i + 1;
                      } else if (currentPage <= 2) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        page = totalPages - 2 + i;
                      } else {
                        page = currentPage - 1 + i;
                      }
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className="h-8 w-8 p-0 text-xs sm:text-sm"
                          onClick={() => setCurrentPage(page)}
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {totalPages > 3 && currentPage < totalPages - 1 && (
                      <>
                        <span className="px-0.5 text-xs text-muted-foreground">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-xs sm:text-sm"
                          onClick={() => setCurrentPage(totalPages)}
                          data-testid={`button-page-${totalPages}`}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
                    data-testid="button-next-page"
                  >
                    <span className="hidden xs:inline">Suivant</span>
                    <span className="xs:hidden">Suiv.</span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 sm:mr-1" />
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sitarail" className="space-y-4">
              <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <Train className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">SITARAIL - Train Burkina</h3>
                      <p className="text-sm text-muted-foreground">
                        Societe Internationale de Transport Africain par Rail. Voyage panoramique a travers le Burkina Faso.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Phone className="w-3 h-3 mr-1" />
                          +226 25 31 15 02
                        </Badge>
                        <Badge variant="outline" className="text-xs">192 places</Badge>
                        <Badge variant="outline" className="text-xs">2e classe</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        Horaires des trains
                      </CardTitle>
                      <CardDescription>Departs les Mardi et Jeudi a 09h00</CardDescription>
                    </div>
                    <Button
                      variant={sortSitarailNearest ? "default" : "outline"}
                      size="sm"
                      onClick={handleSortSitarailNearest}
                      disabled={isLocatingForSort}
                      className="gap-1.5 text-xs shrink-0"
                      data-testid="button-sort-nearest-sitarail"
                    >
                      <Locate className={`w-3.5 h-3.5 ${isLocatingForSort ? 'animate-spin' : ''}`} />
                      {isLocatingForSort ? "Localisation..." : "Les plus proches"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-200 dark:bg-orange-900"></div>
                    {sortedSitarailGares.map((gare) => {
                      const distance = sortSitarailNearest ? getDistanceToGare(gare) : null;
                      return (
                        <div key={gare.id} className="relative pl-10 pb-6 last:pb-0">
                          <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-background"></div>
                          <Card className="hover-elevate">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold text-sm">{gare.nom}</h4>
                                  <p className="text-xs text-muted-foreground">{gare.adresse}</p>
                                  {gare.telephone && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                      <Phone className="w-3 h-3" />
                                      {gare.telephone}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {distance !== null && (
                                    <Badge variant="outline" className="text-xs gap-1 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                                      <Locate className="w-3 h-3" />
                                      {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`}
                                    </Badge>
                                  )}
                                  <div className="flex gap-1">
                                    {gare.telephone && (
                                      <a href={`tel:${gare.telephone}`}>
                                        <Button variant="ghost" size="icon" data-testid={`button-call-sitarail-${gare.id}`}>
                                          <Phone className="w-4 h-4" />
                                        </Button>
                                      </a>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => openGoogleMaps(gare.coordonnees.lat, gare.coordonnees.lng, gare.nom)}
                                      data-testid={`button-map-sitarail-${gare.id}`}
                                    >
                                      <Navigation className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              {gare.destinations && gare.destinations.length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <div className="flex flex-wrap gap-1">
                                    {gare.destinations.map((dest, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {dest.ville} - {dest.prix?.toLocaleString()} F
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="mt-2 pt-2 border-t">
                                <LocationValidator
                                  placeId={gare.id}
                                  initialConfirmations={0}
                                  initialReports={0}
                                  compact
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-green-600" />
                    Tarifs indicatifs
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="bg-background rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Ouaga - Bobo</p>
                      <p className="font-bold text-green-600">6,000 FCFA</p>
                    </div>
                    <div className="bg-background rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Ouaga - Koudougou</p>
                      <p className="font-bold text-green-600">3,000 FCFA</p>
                    </div>
                    <div className="bg-background rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Bobo - Banfora</p>
                      <p className="font-bold text-green-600">3,000 FCFA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sotraco" className="space-y-4">
              <Card className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-lg">
                      <Bus className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">SOTRACO - Bus Urbains</h3>
                      <p className="text-sm text-muted-foreground">
                        Societe de Transport en Commun de Ouagadougou. Transport public urbain nationalise a 100%.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Phone className="w-3 h-3 mr-1" />
                          +226 25 30 61 52
                        </Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs">Bus Verts</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        Lignes et destinations SOTRACO
                      </CardTitle>
                      <CardDescription>Transport urbain dans les principales villes</CardDescription>
                    </div>
                    <Button
                      variant={sortSotracoNearest ? "default" : "outline"}
                      size="sm"
                      onClick={handleSortSotracoNearest}
                      disabled={isLocatingForSort}
                      className="gap-1.5 text-xs shrink-0"
                      data-testid="button-sort-nearest-sotraco"
                    >
                      <Locate className={`w-3.5 h-3.5 ${isLocatingForSort ? 'animate-spin' : ''}`} />
                      {isLocatingForSort ? "Localisation..." : "Les plus proches"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sortedSotracoGares.map((gare) => {
                    const distance = sortSotracoNearest ? getDistanceToGare(gare) : null;
                    return (
                      <Card key={gare.id} className="hover-elevate" data-testid={`card-sotraco-${gare.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm flex items-center gap-2 truncate">
                                <CircleDot className="w-3 h-3 text-emerald-600 shrink-0" />
                                {gare.nom}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">{gare.ville}, {gare.region}</p>
                              {gare.adresse && (
                                <p className="text-xs text-muted-foreground mt-1 truncate">{gare.adresse}</p>
                              )}
                              {gare.heuresOuverture && (
                                <p className="text-xs flex items-center gap-1 mt-1 truncate">
                                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                                  {gare.heuresOuverture}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              {distance !== null && (
                                <Badge variant="outline" className="text-xs gap-1 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                                  <Locate className="w-3 h-3" />
                                  {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`}
                                </Badge>
                              )}
                              {gare.imageUrl && (
                                <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                                  <img 
                                    src={gare.imageUrl} 
                                    alt={gare.nom}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex gap-1">
                                {gare.telephone && (
                                  <a href={`tel:${gare.telephone}`}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-call-sotraco-${gare.id}`}>
                                      <Phone className="w-4 h-4" />
                                    </Button>
                                  </a>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openGoogleMaps(gare.coordonnees.lat, gare.coordonnees.lng, gare.nom)}
                                  data-testid={`button-map-sotraco-${gare.id}`}
                                >
                                  <Navigation className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          {gare.destinations && gare.destinations.length > 0 && (
                            <div className="mt-2 pt-2 border-t overflow-hidden">
                              <p className="text-xs text-muted-foreground mb-1">Lignes desservies:</p>
                              <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                                {gare.destinations.map((dest, i) => (
                                  <div key={i} className="text-xs text-muted-foreground truncate">
                                    {dest.ville}
                                    {dest.prix && ` - ${dest.prix} F`}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 pt-2 border-t">
                            <LocationValidator
                              placeId={gare.id}
                              initialConfirmations={0}
                              initialReports={0}
                              compact
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {sortedSotracoGares.length === 0 && (
                    <div className="text-center py-8">
                      <Bus className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">Donnees SOTRACO en cours de chargement...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Tarifs SOTRACO</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Ticket urbain</p>
                      <p className="font-bold text-green-600">200 FCFA</p>
                    </div>
                    <div className="bg-background rounded-md p-2">
                      <p className="text-xs text-muted-foreground">Carte mensuelle</p>
                      <p className="font-bold text-green-600">5,000 FCFA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="horaires" className="space-y-4">
              <Card className="bg-gradient-to-r from-purple-500/5 via-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      Rechercher un trajet
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLocateMe}
                      disabled={isLocating}
                      className="gap-2"
                      data-testid="button-locate-me"
                    >
                      <Locate className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
                      {isLocating ? "Localisation..." : "Ma position"}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Select value={departVille || "all"} onValueChange={(v) => setDepartVille(v === "all" ? "" : v)}>
                      <SelectTrigger data-testid="select-depart">
                        <MapPin className="w-4 h-4 mr-2 text-green-600" />
                        <SelectValue placeholder="Ville de départ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les villes ({villesDepart.length})</SelectItem>
                        {villesDepart.map(ville => (
                          <SelectItem key={ville} value={ville}>{ville}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={arriveeVille || "all"} onValueChange={(v) => setArriveeVille(v === "all" ? "" : v)}>
                      <SelectTrigger data-testid="select-arrivee">
                        <MapPin className="w-4 h-4 mr-2 text-red-600" />
                        <SelectValue placeholder="Ville d'arrivée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les destinations ({villesArrivee.length})</SelectItem>
                        {villesArrivee.map(ville => (
                          <SelectItem key={ville} value={ville}>{ville}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedCompagnie} onValueChange={setSelectedCompagnie}>
                      <SelectTrigger data-testid="select-compagnie-horaires">
                        <Bus className="w-4 h-4 mr-2 text-primary" />
                        <SelectValue placeholder="Compagnie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les compagnies</SelectItem>
                        {compagnies.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {filteredTrajets.length} trajet{filteredTrajets.length > 1 ? 's' : ''} trouvé{filteredTrajets.length > 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      {departVille && (
                        <Badge variant="secondary" className="gap-1">
                          <MapPin className="w-3 h-3" />
                          Départs depuis {departVille}
                        </Badge>
                      )}
                      <Button
                        variant={sortDepartsNearest ? "default" : "outline"}
                        size="sm"
                        onClick={handleSortDepartsNearest}
                        disabled={isLocatingForSort}
                        className="gap-1.5 text-xs"
                        data-testid="button-sort-nearest-departs"
                      >
                        <Locate className={`w-3.5 h-3.5 ${isLocatingForSort ? 'animate-spin' : ''}`} />
                        {isLocatingForSort ? "Localisation..." : "Les plus proches"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {filteredTrajets.map((trajet) => {
                  const trajetDistance = sortDepartsNearest ? getDistanceToTrajet(trajet) : null;
                  return (
                  <Card key={trajet.id} className="overflow-hidden" data-testid={`card-trajet-${trajet.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-center">
                            <p className="font-bold text-lg">{trajet.depart}</p>
                            <p className="text-xs text-muted-foreground">Depart</p>
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <div className="h-px bg-border flex-1"></div>
                            <div className="flex flex-col items-center">
                              <ArrowRight className="w-5 h-5 text-primary" />
                              <span className="text-xs text-muted-foreground">{trajet.duree}</span>
                            </div>
                            <div className="h-px bg-border flex-1"></div>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-lg">{trajet.arrivee}</p>
                            <p className="text-xs text-muted-foreground">Arrivee</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            {trajetDistance !== null && (
                              <Badge variant="outline" className="text-xs gap-1 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700">
                                <Locate className="w-3 h-3" />
                                {trajetDistance < 1 ? `${Math.round(trajetDistance * 1000)}m` : `${trajetDistance.toFixed(1)} km`}
                              </Badge>
                            )}
                            <Badge variant="outline">{getCompagnieNom(trajet.compagnieId)}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-green-600" />
                            <span className="font-bold text-green-600">{trajet.prix.toLocaleString()} FCFA</span>
                            {trajet.prixVIP && (
                              <Badge variant="secondary" className="text-xs">
                                VIP: {trajet.prixVIP.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Horaires de depart ({trajet.frequence})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {trajet.horaires.map((horaire, i) => (
                            <Badge key={i} variant="secondary" className="font-mono">
                              {horaire}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {trajet.gareDepart && (
                        <div className="mt-4 pt-4 border-t bg-gradient-to-r from-blue-500/5 to-blue-500/10 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span className="font-semibold text-sm truncate">{trajet.gareDepart.nom}</span>
                              </div>
                              <p className="text-xs text-muted-foreground pl-6 truncate">{trajet.gareDepart.adresse}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {trajet.gareDepart.telephone && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => window.open(`tel:${trajet.gareDepart?.telephone}`, '_self')}
                                  data-testid={`button-call-gare-${trajet.id}`}
                                >
                                  <Phone className="w-3 h-3" />
                                  <span className="hidden sm:inline">Appeler</span>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1"
                                onClick={() => {
                                  const { lat, lng } = trajet.gareDepart!.coordonnees;
                                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                                }}
                                data-testid={`button-navigate-gare-${trajet.id}`}
                              >
                                <Navigation className="w-3 h-3" />
                                <span className="hidden sm:inline">Y aller</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  );
                })}
              </div>

              {filteredTrajets.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Aucun trajet trouve</p>
                  <p className="text-xs text-muted-foreground mt-1">Modifiez vos criteres de recherche</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bus className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Conseils de voyage</h3>
                  <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>Arrivez 30 minutes avant le depart prevu</li>
                    <li>Verifiez les horaires aupres de la compagnie (susceptibles de changer)</li>
                    <li>Prevoyez de l'eau et des encas pour les longs trajets</li>
                    <li>Gardez vos documents d'identite a portee de main</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
