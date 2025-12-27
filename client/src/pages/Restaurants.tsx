import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, Navigation, ArrowLeft, RefreshCw, UtensilsCrossed, Wifi, Truck, Car, Star, Locate } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Restaurant {
  id: string;
  nom: string;
  type: string;
  adresse: string;
  quartier: string;
  ville: string;
  region: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  horaires: string;
  fermeture?: string;
  gammePrix: string;
  specialites: string[];
  services: string[];
  wifi: boolean;
  parking: boolean;
  livraison: boolean;
  terrasse: boolean;
  climatisation: boolean;
  capacite?: number;
}

const typeColors: Record<string, string> = {
  "Africain": "bg-amber-600 text-white",
  "Burkinabè": "bg-green-700 text-white",
  "Français": "bg-blue-600 text-white",
  "Libanais": "bg-red-600 text-white",
  "Asiatique": "bg-orange-500 text-white",
  "Italien": "bg-green-600 text-white",
  "Fast-food": "bg-yellow-500 text-black",
  "Grillades": "bg-red-700 text-white",
  "Fruits de mer": "bg-cyan-600 text-white",
  "Végétarien": "bg-lime-600 text-white",
  "Fusion": "bg-purple-600 text-white",
  "International": "bg-indigo-600 text-white"
};

const prixColors: Record<string, string> = {
  "Économique": "bg-green-500 text-white",
  "Moyen": "bg-yellow-500 text-black",
  "Haut de gamme": "bg-orange-500 text-white",
  "Luxe": "bg-red-500 text-white"
};

const regions = [
  "Centre",
  "Hauts-Bassins",
  "Boucle du Mouhoun",
  "Centre-Nord",
  "Centre-Ouest",
  "Centre-Est",
  "Centre-Sud",
  "Est",
  "Nord",
  "Sahel",
  "Sud-Ouest",
  "Cascades",
  "Plateau-Central"
];

const types = [
  "Africain",
  "Burkinabè",
  "Français",
  "Libanais",
  "Asiatique",
  "Italien",
  "Fast-food",
  "Grillades",
  "Fruits de mer",
  "Végétarien",
  "Fusion",
  "International"
];

const prixOptions = [
  { value: "Économique", label: "Économique ($)" },
  { value: "Moyen", label: "Moyen ($$)" },
  { value: "Haut de gamme", label: "Haut de gamme ($$$)" },
  { value: "Luxe", label: "Luxe ($$$$)" }
];

function createRestaurantIcon(type: string) {
  const color = type === "Burkinabè" ? "#15803D" :
                type === "Africain" ? "#D97706" :
                type === "Français" ? "#2563EB" :
                type === "Libanais" ? "#DC2626" :
                type === "Asiatique" ? "#F97316" :
                type === "Fast-food" ? "#EAB308" :
                "#6B7280";

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <path d="M8 8h8M8 12h8M10 16h4" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-restaurant-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
}

function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function Restaurants() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPrix, setSelectedPrix] = useState("all");
  const [showLivraisonOnly, setShowLivraisonOnly] = useState(false);
  const [showWifiOnly, setShowWifiOnly] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([12.3714, -1.5197]);
  const [mapZoom, setMapZoom] = useState(7);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNearestOnly, setShowNearestOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  const handleNearestFilter = useCallback(() => {
    if (showNearestOnly) {
      setShowNearestOnly(false);
      return;
    }
    if (userLocation) {
      setShowNearestOnly(true);
      return;
    }
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          setShowNearestOnly(true);
          setIsLocating(false);
          toast({ title: "Position trouvee", description: "Affichage des restaurants les plus proches" });
        },
        () => {
          setIsLocating(false);
          toast({ title: "Erreur de localisation", description: "Impossible d'obtenir votre position", variant: "destructive" });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      toast({ title: "Non supporte", description: "Geolocalisation non supportee", variant: "destructive" });
    }
  }, [showNearestOnly, userLocation, toast]);

  const { data: restaurants = [], isLoading, refetch } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const { data: stats } = useQuery<{
    total: number;
    avecLivraison: number;
    avecWifi: number;
    parType: Record<string, number>;
    parRegion: Record<string, number>;
    nombreVilles: number;
  }>({
    queryKey: ["/api/restaurants/stats"],
  });

  const filteredRestaurants = useMemo(() => {
    let result = restaurants;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.nom.toLowerCase().includes(query) ||
        r.ville.toLowerCase().includes(query) ||
        r.quartier.toLowerCase().includes(query) ||
        r.adresse.toLowerCase().includes(query) ||
        r.type.toLowerCase().includes(query) ||
        r.specialites.some(s => s.toLowerCase().includes(query))
      );
    }

    if (selectedRegion !== "all") {
      result = result.filter(r => r.region === selectedRegion);
    }

    if (selectedType !== "all") {
      result = result.filter(r => r.type === selectedType);
    }

    if (selectedPrix !== "all") {
      result = result.filter(r => r.gammePrix === selectedPrix);
    }

    if (showLivraisonOnly) {
      result = result.filter(r => r.livraison);
    }

    if (showWifiOnly) {
      result = result.filter(r => r.wifi);
    }

    if (showNearestOnly && userLocation) {
      result = result
        .map(r => ({
          ...r,
          distance: calculateDistance(userLocation.lat, userLocation.lng, r.latitude, r.longitude)
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20);
    }

    return result;
  }, [restaurants, searchQuery, selectedRegion, selectedType, selectedPrix, showLivraisonOnly, showWifiOnly, showNearestOnly, userLocation, calculateDistance]);

  const handleRestaurantClick = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setMapCenter([restaurant.latitude, restaurant.longitude]);
    setMapZoom(15);
  }, []);

  const handleCall = (telephone?: string) => {
    if (telephone) {
      window.location.href = `tel:${telephone}`;
    }
  };

  const handleNavigate = (restaurant: Restaurant) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`;
    window.open(url, "_blank");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Actualisation",
        description: "Donnees des restaurants actualisees",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser les donnees",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
              <UtensilsCrossed className="h-6 w-6 text-orange-500" />
              Restaurants
            </h1>
            <p className="text-sm text-muted-foreground">
              {stats?.total || 0} restaurants dans {stats?.nombreVilles || 0} villes du Burkina Faso
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total restaurants</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.parType?.["Burkinabe"] || stats?.parType?.["Africain"] || 0}</p>
              <p className="text-xs text-muted-foreground">Cuisine locale</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.avecWifi || 0}</p>
              <p className="text-xs text-muted-foreground">Avec Wifi</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats?.avecLivraison || 0}</p>
              <p className="text-xs text-muted-foreground">Livraison</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>

            <div className="relative z-50">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger data-testid="select-region">
                  <SelectValue placeholder="Toutes les regions" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">Toutes les regions</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative z-50">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="all">Tous les types</SelectItem>
                  {types.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={showLivraisonOnly ? "default" : "outline"}
                onClick={() => setShowLivraisonOnly(!showLivraisonOnly)}
                className="flex-1"
                data-testid="button-livraison-filter"
              >
                <Truck className="h-4 w-4 mr-1" />
                Livraison
              </Button>
              <Button
                variant={showWifiOnly ? "default" : "outline"}
                onClick={() => setShowWifiOnly(!showWifiOnly)}
                className="flex-1"
                data-testid="button-wifi-filter"
              >
                <Wifi className="h-4 w-4 mr-1" />
                Wifi
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            <Button
              variant={showNearestOnly ? "default" : "outline"}
              onClick={handleNearestFilter}
              disabled={isLocating}
              data-testid="button-nearest-filter"
            >
              {isLocating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Locate className="h-4 w-4 mr-2" />
              )}
              {showNearestOnly ? "Voir tout" : "Les plus proches"}
            </Button>
            {showNearestOnly && (
              <Badge className="bg-primary text-white self-center">
                20 plus proches
              </Badge>
            )}
          </div>

          <div className="h-[300px] md:h-[400px] rounded-lg border relative z-0">
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="h-full w-full"
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={mapCenter} zoom={mapZoom} />
                {filteredRestaurants.map(restaurant => (
                  <Marker
                    key={restaurant.id}
                    position={[restaurant.latitude, restaurant.longitude]}
                    icon={createRestaurantIcon(restaurant.type)}
                    eventHandlers={{
                      click: () => handleRestaurantClick(restaurant)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-sm mb-1">{restaurant.nom}</h3>
                        <div className="flex gap-1 mb-2">
                          <Badge className={`${typeColors[restaurant.type] || "bg-gray-500 text-white"} text-xs`}>
                            {restaurant.type}
                          </Badge>
                          <Badge className={`${prixColors[restaurant.gammePrix]} text-xs`}>
                            {restaurant.gammePrix}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">{restaurant.adresse}</p>
                        <p className="text-xs text-gray-500">{restaurant.quartier}, {restaurant.ville}</p>
                        <div className="flex gap-2 mt-2">
                          {restaurant.telephone && (
                            <Button size="sm" variant="outline" onClick={() => handleCall(restaurant.telephone)}>
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => handleNavigate(restaurant)}>
                            <Navigation className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 mt-6">
          <h2 className="text-lg font-semibold">
            {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? "s" : ""} trouve{filteredRestaurants.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map(restaurant => (
              <Card 
                key={restaurant.id} 
                className={`cursor-pointer transition-all hover-elevate ${
                  selectedRestaurant?.id === restaurant.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleRestaurantClick(restaurant)}
                data-testid={`card-restaurant-${restaurant.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{restaurant.nom}</CardTitle>
                    <div className="flex flex-col gap-1">
                      <Badge className={`${typeColors[restaurant.type] || "bg-gray-500 text-white"} text-xs shrink-0`}>
                        {restaurant.type}
                      </Badge>
                      <Badge className={`${prixColors[restaurant.gammePrix]} text-xs shrink-0`}>
                        {restaurant.gammePrix}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(restaurant as any).distance !== undefined && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-center gap-2">
                      <Locate className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {(restaurant as any).distance < 1 
                          ? `${Math.round((restaurant as any).distance * 1000)} m` 
                          : `${(restaurant as any).distance.toFixed(1)} km`}
                      </span>
                      <span className="text-xs text-muted-foreground">de vous</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground">{restaurant.adresse}</p>
                      <p className="text-muted-foreground text-xs">{restaurant.quartier}, {restaurant.ville}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{restaurant.horaires}</span>
                    {restaurant.fermeture && (
                      <span className="text-xs text-muted-foreground">(Ferme: {restaurant.fermeture})</span>
                    )}
                  </div>

                  {restaurant.specialites.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {restaurant.specialites.slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      {restaurant.specialites.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{restaurant.specialites.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {restaurant.wifi && <Wifi className="h-4 w-4 text-blue-500" />}
                    {restaurant.livraison && <Truck className="h-4 w-4 text-green-500" />}
                    {restaurant.parking && <Car className="h-4 w-4 text-gray-500" />}
                    {restaurant.terrasse && <span className="text-orange-500">Terrasse</span>}
                    {restaurant.climatisation && <span className="text-cyan-500">Clim</span>}
                  </div>

                  <div className="flex gap-2 pt-2">
                    {restaurant.telephone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(restaurant.telephone);
                        }}
                        data-testid={`button-call-${restaurant.id}`}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Appeler
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate(restaurant);
                      }}
                      data-testid={`button-navigate-${restaurant.id}`}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Y aller
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredRestaurants.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucun restaurant trouve</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos criteres de recherche
            </p>
          </div>
        )}
      </main>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}
