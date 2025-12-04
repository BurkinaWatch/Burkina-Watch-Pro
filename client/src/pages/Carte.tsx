import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import GoogleMap from "@/components/GoogleMap";
import FilterChips from "@/components/FilterChips";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Flame } from "lucide-react";
import type { Categorie, Signalement } from "@shared/schema";

const BURKINA_REGIONS = [
  "Toutes les régions",
  "Bankui", "Djôrô", "Goulmou", "Guiriko", "Kadiogo",
  "Koom-Kuuli", "Kom-Pangala", "Nakambga", "Passoré",
  "Poni-Tiari", "Sahel", "Taar-Soomba", "Taoud-Weogo",
  "Tondeka", "Wètemga", "Yirka-Gaongo", "Yonyoosé"
];

export default function Carte() {
  const [filter, setFilter] = useState<Categorie | "tous">("tous");
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("Toutes les régions");
  const [heatmapMode, setHeatmapMode] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Récupérer les paramètres URL pour centrer la carte
  const urlParams = new URLSearchParams(window.location.search);
  const highlightId = urlParams.get('id');
  const targetLat = urlParams.get('lat');
  const targetLng = urlParams.get('lng');

  // Obtenir la position de l'utilisateur
  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log("Erreur de géolocalisation:", error)
      );
    }
  });

  const { data: signalements, isLoading } = useQuery<Signalement[]>({
    queryKey: ["/api/signalements"],
    staleTime: 5 * 60 * 1000, // Cache de 5 minutes
    gcTime: 10 * 60 * 1000,
  });

  const markers = signalements?.map(s => ({
    id: s.id,
    lat: parseFloat(s.latitude),
    lng: parseFloat(s.longitude),
    categorie: s.categorie as Categorie,
    titre: s.titre,
    isSOS: s.isSOS || false,
    niveauUrgence: s.niveauUrgence,
    localisation: s.localisation || "",
  })) || [];

  // Fonction pour calculer la distance entre deux points (formule de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredMarkers = useMemo(() => {
    let filtered = markers;

    // Filtre par catégorie
    if (filter !== "tous") {
      filtered = filtered.filter(m => m.categorie === filter);
    }

    // Filtre par région
    if (selectedRegion !== "Toutes les régions") {
      filtered = filtered.filter(m => 
        m.localisation.toLowerCase().includes(selectedRegion.toLowerCase())
      );
    }

    // Filtre par rayon
    if (searchRadius !== "all" && userLocation) {
      const radius = parseInt(searchRadius);
      filtered = filtered.filter(m => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          m.lat,
          m.lng
        );
        return distance <= radius;
      });
    }

    return filtered;
  }, [markers, filter, selectedRegion, searchRadius, userLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <div className="relative h-[calc(100vh-4rem-4rem)] md:h-[calc(100vh-4rem)]">
        <div className="absolute top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 z-30 max-w-md">
          <Card className="p-3 md:p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-lg border-2">
            <h2 className="text-base md:text-lg font-semibold mb-3">Carte Interactive</h2>
            
            {/* Contrôles de rayon */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">Rayon:</span>
              </div>
              <div className="flex gap-1.5">
                {["1km", "5km", "10km", "all"].map((radius) => (
                  <Button
                    key={radius}
                    variant={searchRadius === radius ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSearchRadius(radius)}
                    className={`flex-1 text-xs h-8 font-semibold transition-all ${
                      searchRadius === radius 
                        ? "bg-green-600 hover:bg-green-700 text-white shadow-md" 
                        : "bg-background/60 hover:bg-accent border-border"
                    }`}
                    disabled={radius !== "all" && !userLocation}
                  >
                    {radius === "all" ? "∞" : radius}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sélecteur de région */}
            <div className="mb-3">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full text-xs h-9 bg-background/50">
                  <SelectValue placeholder="Sélectionner une région" />
                </SelectTrigger>
                <SelectContent>
                  {BURKINA_REGIONS.map((region) => (
                    <SelectItem key={region} value={region} className="text-xs">
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bouton carte thermique */}
            <Button
              variant={heatmapMode ? "default" : "outline"}
              size="sm"
              onClick={() => setHeatmapMode(!heatmapMode)}
              className="w-full text-xs h-9 bg-background/50 hover:bg-primary/10"
            >
              <Flame className="w-4 h-4 mr-2" />
              Carte thermique
            </Button>

            {/* Compteur de signalements */}
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                {filteredMarkers.length} signalement{filteredMarkers.length > 1 ? "s" : ""} affiché{filteredMarkers.length > 1 ? "s" : ""}
                {searchRadius !== "all" && userLocation && (
                  <span className="ml-1 text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                    dans {searchRadius}
                  </span>
                )}
              </p>
            </div>
          </Card>
        </div>

        <GoogleMap
          markers={filteredMarkers}
          className="h-full"
          highlightMarkerId={highlightId}
          centerLat={targetLat ? parseFloat(targetLat) : (userLocation?.lat || null)}
          centerLng={targetLng ? parseFloat(targetLng) : (userLocation?.lng || null)}
          heatmapMode={heatmapMode}
        />
      </div>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}