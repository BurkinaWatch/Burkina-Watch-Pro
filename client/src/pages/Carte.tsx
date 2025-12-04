import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import EmergencyPanel from "@/components/EmergencyPanel";
import GoogleMap from "@/components/GoogleMap";
import FilterChips from "@/components/FilterChips";
import { useState, useMemo } from "react";
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
    localisation: s.localisation || "",
  })) || [];

  const filteredMarkers = useMemo(() => {
    if (filter === "tous") {
      return markers;
    }
    return markers.filter(m => m.categorie === filter);
  }, [markers, filter]);

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
        <GoogleMap
          markers={filteredMarkers}
          className="h-full"
          highlightMarkerId={highlightId}
          centerLat={targetLat ? parseFloat(targetLat) : null}
          centerLng={targetLng ? parseFloat(targetLng) : null}
          heatmapMode={false}
        />
      </div>

      <EmergencyPanel />
      <BottomNav />
    </div>
  );
}