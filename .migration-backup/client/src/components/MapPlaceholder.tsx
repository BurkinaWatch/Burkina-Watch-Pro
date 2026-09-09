import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { Categorie } from "@shared/schema";

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  categorie: Categorie;
  titre: string;
  isSOS?: boolean;
}

interface MapPlaceholderProps {
  markers?: MapMarker[];
  className?: string;
}

export default function MapPlaceholder({ markers = [], className = "" }: MapPlaceholderProps) {
  return (
    <Card className={`relative w-full bg-muted/10 flex items-center justify-center overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/5" />
      
      <div className="relative z-10 text-center p-8">
        <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Carte Interactive</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Visualisation en temps réel des signalements sur la carte du Burkina Faso
        </p>
        {markers.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            {markers.length} signalement{markers.length > 1 ? "s" : ""} sur la carte
          </p>
        )}
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-category-urgence animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-category-securite" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 rounded-full bg-category-sante" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-category-environnement" />
      </div>
    </Card>
  );
}
