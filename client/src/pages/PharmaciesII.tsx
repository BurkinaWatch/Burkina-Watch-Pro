import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Clock, ExternalLink, Navigation } from "lucide-react";
import { useState, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Place } from "@shared/schema";

export default function PharmaciesII() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: placesData, isLoading } = useQuery<{
    places: Place[];
    total: number;
    lastUpdated: string | null;
    source: string;
  }>({
    queryKey: ["/api/places", "pharmacy"],
  });

  const places = useMemo(() => {
    return placesData?.places || [];
  }, [placesData]);

  const filteredPharmacies = useMemo(() => {
    if (!places || !Array.isArray(places)) return [];
    return places.filter((p: Place) =>
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.quartier && p.quartier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.ville && p.ville.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [places, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 space-y-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Pharmacies II (Base de Données)</h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            {filteredPharmacies.length} pharmacies
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une pharmacie, un quartier ou une ville..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-pharmacy"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPharmacies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPharmacies.map((pharmacy: Place) => (
              <Card key={pharmacy.id} className="hover-elevate transition-all border-muted/40 overflow-hidden">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold leading-tight line-clamp-2">
                      {pharmacy.name}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1 shrink-0" />
                      <span className="truncate">{pharmacy.quartier || pharmacy.ville || "Burkina Faso"}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <Navigation className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-foreground/80 italic">{pharmacy.address || "Adresse non spécifiée"}</span>
                    </div>

                    {pharmacy.telephone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <a href={`tel:${pharmacy.telephone}`} className="hover:text-primary transition-colors">
                          {pharmacy.telephone}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{pharmacy.horaires || "Horaires non renseignés"}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs h-8"
                      onClick={() => {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`, '_blank');
                      }}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Itinéraire
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        window.open(`https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted rounded-full p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Aucune pharmacie trouvée</h3>
            <p className="text-muted-foreground max-w-xs mt-1">
              Essayez de modifier vos critères de recherche ou vérifiez l'orthographe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
