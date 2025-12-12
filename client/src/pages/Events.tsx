
import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { Loader2, MapPin, Calendar, Clock, ExternalLink, Search, Filter, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface Event {
  id: string;
  nom: string;
  type: "Fête nationale" | "Culturel" | "Concert" | "Conférence" | "Sport" | "Infrastructure";
  date: string;
  lieu: string;
  ville: string;
  heure?: string;
  description: string;
  latitude?: number;
  longitude?: number;
  lienOfficiel?: string;
  affiche?: string;
}

const EVENT_TYPES = [
  { value: "all", label: "Tous les types" },
  { value: "Fête nationale", label: "Fêtes nationales" },
  { value: "Culturel", label: "Événements culturels" },
  { value: "Concert", label: "Concerts" },
  { value: "Conférence", label: "Conférences" },
  { value: "Sport", label: "Compétitions sportives" },
  { value: "Infrastructure", label: "Fermetures de routes / Infrastructures" },
];

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const lastFetchRef = useRef<number>(0);

  // Fonction pour récupérer les événements (avec debounce de 5 secondes)
  const fetchEvents = useCallback(async () => {
    const now = Date.now();
    // Éviter les appels multiples rapides (debounce 5 secondes)
    if (now - lastFetchRef.current < 5000) {
      return;
    }
    lastFetchRef.current = now;
    
    setLoading(true);
    try {
      const response = await fetch("/api/events-burkina");
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setEvents(data);
      setFilteredEvents(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les événements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Rafraîchir automatiquement les données quand la page reprend le focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchEvents();
      }
    };

    const handleFocus = () => {
      fetchEvents();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchEvents]);

  useEffect(() => {
    let filtered = events;

    // Filtre par type
    if (selectedType !== "all") {
      filtered = filtered.filter((e) => e.type === selectedType);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.nom.toLowerCase().includes(query) ||
          e.ville.toLowerCase().includes(query) ||
          e.lieu.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  }, [selectedType, searchQuery, events]);

  const getTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      "Fête nationale": "bg-green-500",
      "Culturel": "bg-purple-500",
      "Concert": "bg-pink-500",
      "Conférence": "bg-blue-500",
      "Sport": "bg-orange-500",
      "Infrastructure": "bg-red-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const openMapLocation = (event: Event) => {
    if (event.latitude && event.longitude) {
      window.open(`https://www.google.com/maps?q=${event.latitude},${event.longitude}`, "_blank");
    } else {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(event.lieu + " " + event.ville + " Burkina Faso")}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* Boutons Retour et Actualiser */}
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <Button
            variant="outline"
            onClick={fetchEvents}
            disabled={loading}
            className="gap-2 ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            Burkina Events
          </h1>
          <p className="text-muted-foreground text-lg">
            Tous les événements importants au Burkina Faso
          </p>
        </div>

        {/* Barre de contrôle */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un événement, ville, lieu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtre par type */}
              <div className="w-full md:w-64">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{events.length}</div>
              <div className="text-sm text-muted-foreground">Total événements</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{filteredEvents.length}</div>
              <div className="text-sm text-muted-foreground">Résultats</div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {events.filter(e => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const eventDate = new Date(e.date);
                  eventDate.setHours(0, 0, 0, 0);
                  return eventDate.getTime() === today.getTime();
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Aujourd'hui</div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des événements */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Aucun événement trouvé</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedType !== "all"
                  ? "Essayez de modifier vos filtres de recherche"
                  : "Les événements seront affichés ici une fois disponibles"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge className={`${getTypeBadgeColor(event.type)} text-white`}>
                        {event.type}
                      </Badge>
                      {(() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const eventDate = new Date(event.date);
                        eventDate.setHours(0, 0, 0, 0);
                        if (eventDate.getTime() === today.getTime()) {
                          return (
                            <Badge className="bg-orange-500 text-white animate-pulse">
                              Aujourd'hui
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">{event.nom}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>
                        {event.lieu}, {event.ville}
                      </span>
                    </div>
                    {event.heure && (
                      <div className="flex items-start gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>{event.heure}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => openMapLocation(event)}
                    >
                      <MapPin className="w-4 h-4" />
                      Voir sur la carte
                    </Button>
                    {event.lienOfficiel && (
                      <Button
                        variant="ghost"
                        className="w-full gap-2"
                        onClick={() => window.open(event.lienOfficiel, "_blank")}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Site officiel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
