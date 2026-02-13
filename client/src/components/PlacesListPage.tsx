import { useState, useMemo, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { PlaceCard, PlaceCardSkeleton } from "@/components/PlaceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, RefreshCw, MapPin, Building2, Locate } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Place } from "@shared/schema";
import { REGION_NAMES } from "@/lib/regions";

interface PlacesListPageProps {
  placeType: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  renderStats?: (places: Place[]) => React.ReactNode;
  hideDefaultStats?: boolean;
  searchTerm?: string;
}

const REGIONS = REGION_NAMES;

interface PlaceWithDistance extends Place {
  distance?: number;
}

interface ApiResponse {
  places: Place[];
  total: number;
}

export function PlacesListPage({ 
  placeType, 
  title, 
  description, 
  icon, 
  renderStats, 
  hideDefaultStats,
  searchTerm: externalSearchTerm
}: PlacesListPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [showNearestOnly, setShowNearestOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm === "all" ? "" : externalSearchTerm);
    }
  }, [externalSearchTerm]);

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
          toast({
            title: "Position trouvee",
            description: "Affichage des lieux les plus proches",
          });
        },
        (error) => {
          setIsLocating(false);
          toast({
            title: "Erreur de localisation",
            description: "Impossible d'obtenir votre position. Verifiez les permissions.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setIsLocating(false);
      toast({
        title: "Non supporte",
        description: "La geolocalisation n'est pas supportee par votre navigateur.",
        variant: "destructive",
      });
    }
  }, [showNearestOnly, userLocation, toast]);

  const { data, isLoading, refetch, isRefetching } = useQuery<ApiResponse | Place[]>({
    queryKey: ['/api/places', placeType],
    queryFn: async () => {
      const response = await fetch(`/api/places?placeType=${encodeURIComponent(placeType)}`);
      if (!response.ok) throw new Error('Failed to fetch places');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Extract places from response (handling both Array and Wrapper object formats)
  const places = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && 'places' in data && Array.isArray(data.places)) {
      return data.places;
    }
    return [];
  }, [data]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };
    const handleFocus = () => refetch();
    
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetch]);

  const filteredPlaces = useMemo((): PlaceWithDistance[] => {
    let result = places.filter(place => {
      const matchesSearch = !searchTerm || 
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.quartier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegion = selectedRegion === "all" || place.region === selectedRegion;
      
      return matchesSearch && matchesRegion;
    });

    if (showNearestOnly && userLocation) {
      result = result
        .map(p => ({
          ...p,
          distance: p.latitude && p.longitude 
            ? calculateDistance(userLocation.lat, userLocation.lng, Number(p.latitude), Number(p.longitude))
            : undefined
        }))
        .filter(p => p.distance !== undefined)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20);
    }
    
    return result;
  }, [places, searchTerm, selectedRegion, showNearestOnly, userLocation, calculateDistance]);

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    places.forEach(place => {
      if (place.region) {
        counts[place.region] = (counts[place.region] || 0) + 1;
      }
    });
    return counts;
  }, [places]);

  const handleRefresh = async () => {
    await refetch();
    toast({
      title: "Actualisé",
      description: `${filteredPlaces.length} lieux trouvés`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">{title}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {!hideDefaultStats && (
            <>
              <Card 
                className="hover-elevate transition-all border-primary/10 cursor-pointer"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRegion("all");
                }}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{places.length}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="hover-elevate transition-all border-blue-100 dark:border-blue-900 cursor-pointer"
                onClick={() => setSelectedRegion("all")}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{Object.keys(regionCounts).length}</p>
                      <p className="text-xs text-muted-foreground">Régions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
          {renderStats && renderStats(places)}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un lieu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-region">
              <SelectValue placeholder="Région" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les régions</SelectItem>
              {REGIONS.map(region => (
                <SelectItem key={region} value={region}>
                  {region} {regionCounts[region] ? `(${regionCounts[region]})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefetching}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={showNearestOnly ? "default" : "outline"}
            onClick={handleNearestFilter}
            disabled={isLocating}
            className="flex-1 md:flex-none"
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

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredPlaces.length} lieu{filteredPlaces.length > 1 ? 'x' : ''} trouvé{filteredPlaces.length > 1 ? 's' : ''}
          </p>
          {(searchTerm || selectedRegion !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedRegion("all");
              }}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PlaceCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPlaces.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucun lieu trouvé</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedRegion !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Les données seront disponibles après synchronisation avec la base de données"}
              </p>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlaces.map(place => (
              <PlaceCard
                key={place.id}
                place={place}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
