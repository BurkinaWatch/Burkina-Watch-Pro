import { useState, useMemo } from "react";
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
  ExternalLink,
  Navigation
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

export default function Gares() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompagnie, setSelectedCompagnie] = useState<string>("all");
  const [departVille, setDepartVille] = useState("");
  const [arriveeVille, setArriveeVille] = useState("");
  const [activeTab, setActiveTab] = useState("compagnies");

  const { data: transportData, isLoading } = useQuery<{
    compagnies: Compagnie[];
    gares: Gare[];
    trajets: Trajet[];
    stats: TransportStats;
  }>({
    queryKey: ["/api/transport"]
  });

  const compagnies = transportData?.compagnies || [];
  const gares = transportData?.gares || [];
  const trajets = transportData?.trajets || [];
  const stats = transportData?.stats;

  const filteredGares = useMemo(() => {
    return gares.filter(gare => {
      const matchesSearch = searchQuery === "" || 
        gare.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gare.ville.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCompagnie = selectedCompagnie === "all" || 
        gare.compagnie === selectedCompagnie || 
        gare.compagnie === "Publique";
      return matchesSearch && matchesCompagnie;
    });
  }, [gares, searchQuery, selectedCompagnie]);

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
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Compagnies</p>
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compagnies" data-testid="tab-compagnies">
                <Building2 className="w-4 h-4 mr-2" />
                Compagnies
              </TabsTrigger>
              <TabsTrigger value="gares" data-testid="tab-gares">
                <MapPin className="w-4 h-4 mr-2" />
                Gares
              </TabsTrigger>
              <TabsTrigger value="horaires" data-testid="tab-horaires">
                <Clock className="w-4 h-4 mr-2" />
                Horaires
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compagnies" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
            </TabsContent>

            <TabsContent value="gares" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher une gare ou une ville..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-gares"
                  />
                </div>
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

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredGares.map((gare) => (
                  <Card key={gare.id} className="hover-elevate" data-testid={`card-gare-${gare.id}`}>
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
                      
                      <p className="text-xs text-muted-foreground">{gare.adresse}</p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="outline" className="text-xs">
                          {gare.compagnie === "Publique" ? "Publique" : getCompagnieNom(gare.compagnie)}
                        </Badge>
                        <div className="flex gap-1">
                          {gare.telephone && (
                            <a href={`tel:${gare.telephone}`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-call-gare-${gare.id}`}>
                                <Phone className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openGoogleMaps(gare.coordonnees.lat, gare.coordonnees.lng, gare.nom)}
                            data-testid={`button-map-gare-${gare.id}`}
                          >
                            <Navigation className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
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
