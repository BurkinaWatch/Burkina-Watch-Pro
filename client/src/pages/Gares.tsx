import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  CircleDot
} from "lucide-react";
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
}

interface TransportStats {
  totalCompagnies: number;
  totalGares: number;
  totalTrajets: number;
  villesDesservies: number;
  destinationsInternationales: number;
}

const GARES_PER_PAGE = 50;

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

  const [includeOSM, setIncludeOSM] = useState(true);
  
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

  const filteredGares = useMemo(() => {
    return gares.filter(gare => {
      // Exclure les gares SOTRACO et SITARAIL de l'onglet principal (elles ont leurs onglets dédiés)
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
  }, [gares, searchQuery, selectedCompagnie, selectedRegion]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCompagnie, selectedRegion]);

  const totalPages = Math.ceil(filteredGares.length / GARES_PER_PAGE);
  const paginatedGares = useMemo(() => {
    const start = (currentPage - 1) * GARES_PER_PAGE;
    return filteredGares.slice(start, start + GARES_PER_PAGE);
  }, [filteredGares, currentPage]);

  const filteredTrajets = useMemo(() => {
    return trajets.filter(trajet => {
      const matchesDepart = departVille === "" || 
        trajet.depart.toLowerCase().includes(departVille.toLowerCase());
      const matchesArrivee = arriveeVille === "" || 
        trajet.arrivee.toLowerCase().includes(arriveeVille.toLowerCase());
      const matchesCompagnie = selectedCompagnie === "all" || 
        trajet.compagnieId === selectedCompagnie;
      return matchesDepart && matchesArrivee && matchesCompagnie;
    });
  }, [trajets, departVille, arriveeVille, selectedCompagnie]);

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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card 
                className={`bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 cursor-pointer hover-elevate transition-all ${showCompagnies ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setShowCompagnies(!showCompagnies)}
                data-testid="card-stat-compagnies"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        Compagnies
                        {showCompagnies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalCompagnies}</p>
                    </div>
                    <Building2 className="w-8 h-8 text-blue-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Gares</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalGares}</p>
                    </div>
                    <MapPin className="w-8 h-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Trajets</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalTrajets}</p>
                    </div>
                    <RouteIcon className="w-8 h-8 text-purple-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Villes</p>
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.villesDesservies}</p>
                    </div>
                    <Users className="w-8 h-8 text-amber-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">International</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.destinationsInternationales}</p>
                    </div>
                    <Globe className="w-8 h-8 text-red-500/50" />
                  </div>
                </CardContent>
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
                <TabsList className="grid w-full grid-cols-4 h-auto p-1 gap-1 bg-muted/50">
                  <TabsTrigger 
                    value="gares" 
                    className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-green-500/20 data-[state=active]:border-green-500 data-[state=active]:border-2"
                    data-testid="tab-gares"
                  >
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-xs">Trouver une gare</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{garesOngletPrincipal} gares</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sitarail" 
                    className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-orange-500/20 data-[state=active]:border-orange-500 data-[state=active]:border-2"
                    data-testid="tab-sitarail"
                  >
                    <Train className="w-4 h-4 text-orange-600" />
                    <span className="font-semibold text-xs">SITARAIL</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">Train</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sotraco" 
                    className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:border-emerald-500 data-[state=active]:border-2"
                    data-testid="tab-sotraco"
                  >
                    <Bus className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-xs">SOTRACO</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">Bus urbain</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="horaires" 
                    className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-purple-500/20 data-[state=active]:border-purple-500 data-[state=active]:border-2"
                    data-testid="tab-horaires"
                  >
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-xs">Grands departs</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">Horaires & Prix</span>
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
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>
                      {filteredGares.length > GARES_PER_PAGE 
                        ? `Affichage ${(currentPage - 1) * GARES_PER_PAGE + 1}-${Math.min(currentPage * GARES_PER_PAGE, filteredGares.length)} sur ${filteredGares.length} gares`
                        : `${filteredGares.length} gare${filteredGares.length > 1 ? "s" : ""} trouvee${filteredGares.length > 1 ? "s" : ""}`
                      }
                    </span>
                    <span>Source: Donnees verifiees + OpenStreetMap</span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {paginatedGares.map((gare) => (
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
                        <Badge 
                          variant={gare.type === "principale" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {gare.type}
                        </Badge>
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
                ))}
              </div>

              {filteredGares.length === 0 && (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">Aucune gare trouvee</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Precedent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 5) {
                        page = i + 1;
                      } else if (currentPage <= 3) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i;
                      } else {
                        page = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-1">...</span>
                        <Button
                          variant="outline"
                          size="sm"
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
                    data-testid="button-next-page"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4" />
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
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    Horaires des trains
                  </CardTitle>
                  <CardDescription>Departs les Mardi et Jeudi a 09h00</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-200 dark:bg-orange-900"></div>
                    {gares
                      .filter(g => g.compagnie === "sitarail")
                      .sort((a, b) => {
                        const order = ["ouaga", "koudougou", "siby", "bobo", "banfora", "niangoloko"];
                        const aIdx = order.findIndex(o => a.id.includes(o));
                        const bIdx = order.findIndex(o => b.id.includes(o));
                        return aIdx - bIdx;
                      })
                      .map((gare, index, arr) => (
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
                            </CardContent>
                          </Card>
                        </div>
                      ))}
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
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Lignes et destinations SOTRACO
                  </CardTitle>
                  <CardDescription>Transport urbain dans les principales villes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gares
                    .filter(g => g.compagnie === "sotraco")
                    .map((gare) => (
                      <Card key={gare.id} className="hover-elevate" data-testid={`card-sotraco-${gare.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                <CircleDot className="w-3 h-3 text-emerald-600" />
                                {gare.nom}
                              </h4>
                              <p className="text-xs text-muted-foreground">{gare.ville}, {gare.region}</p>
                              {gare.adresse && (
                                <p className="text-xs text-muted-foreground mt-1">{gare.adresse}</p>
                              )}
                              {gare.heuresOuverture && (
                                <p className="text-xs flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  {gare.heuresOuverture}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {gare.telephone && (
                                <a href={`tel:${gare.telephone}`}>
                                  <Button variant="ghost" size="icon" data-testid={`button-call-sotraco-${gare.id}`}>
                                    <Phone className="w-4 h-4" />
                                  </Button>
                                </a>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => openGoogleMaps(gare.coordonnees.lat, gare.coordonnees.lng, gare.nom)}
                                data-testid={`button-map-sotraco-${gare.id}`}
                              >
                                <Navigation className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {gare.destinations && gare.destinations.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs text-muted-foreground mb-1">Lignes desservies:</p>
                              <div className="flex flex-wrap gap-1">
                                {gare.destinations.map((dest, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {dest.ville}
                                    {dest.prix && ` - ${dest.prix} F`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  
                  {gares.filter(g => g.compagnie === "sotraco").length === 0 && (
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
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Ville de depart"
                        value={departVille}
                        onChange={(e) => setDepartVille(e.target.value)}
                        className="pl-10"
                        data-testid="input-depart"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Ville d'arrivee"
                        value={arriveeVille}
                        onChange={(e) => setArriveeVille(e.target.value)}
                        className="pl-10"
                        data-testid="input-arrivee"
                      />
                    </div>
                    <Select value={selectedCompagnie} onValueChange={setSelectedCompagnie}>
                      <SelectTrigger data-testid="select-compagnie-horaires">
                        <SelectValue placeholder="Compagnie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        {compagnies.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {filteredTrajets.map((trajet) => (
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
                          <Badge variant="outline">{getCompagnieNom(trajet.compagnieId)}</Badge>
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
                    </CardContent>
                  </Card>
                ))}
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
