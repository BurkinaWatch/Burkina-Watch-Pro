import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import GoogleMap from "@/components/GoogleMap";
import FilterChips from "@/components/FilterChips";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type { Categorie, Signalement } from "@shared/schema";

export default function Carte() {
  const [filter, setFilter] = useState<Categorie | "tous">("tous");
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Récupérer les paramètres URL pour centrer la carte
  const urlParams = new URLSearchParams(window.location.search);
  const highlightId = urlParams.get('id');
  const targetLat = urlParams.get('lat');
  const targetLng = urlParams.get('lng');

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
  })) || [];

  const filteredMarkers = filter === "tous"
    ? markers
    : markers.filter(m => m.categorie === filter);

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
            <FilterChips onFilterChange={setFilter} />
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              {filteredMarkers.length} signalement{filteredMarkers.length > 1 ? "s" : ""} affiché{filteredMarkers.length > 1 ? "s" : ""}
            </p>
          </Card>
        </div>

        <GoogleMap 
          markers={filteredMarkers} 
          className="h-full"
          highlightMarkerId={highlightId}
          centerLat={targetLat ? parseFloat(targetLat) : null}
          centerLng={targetLng ? parseFloat(targetLng) : null}
        />
      </div>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}