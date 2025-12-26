import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { PlaceCard, PlaceCardSkeleton } from "@/components/PlaceCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowLeft, RefreshCw, MapPin, CheckCircle, AlertTriangle, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { Place } from "@shared/schema";

interface PlacesListPageProps {
  placeType: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const REGIONS = [
  "Centre", "Hauts-Bassins", "Cascades", "Centre-Nord", "Centre-Ouest",
  "Centre-Est", "Centre-Sud", "Est", "Nord", "Sahel", "Sud-Ouest",
  "Boucle du Mouhoun", "Plateau-Central"
];

export function PlacesListPage({ placeType, title, description, icon }: PlacesListPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: places = [], isLoading, refetch, isRefetching } = useQuery<Place[]>({
    queryKey: ['/api/places', placeType],
    queryFn: async () => {
      const response = await fetch(`/api/places?placeType=${encodeURIComponent(placeType)}`);
      if (!response.ok) throw new Error('Failed to fetch places');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats } = useQuery<{
    total: number;
    byType: Record<string, number>;
    verified: number;
    needsReview: number;
  }>({
    queryKey: ['/api/places/stats'],
    staleTime: 5 * 60 * 1000,
  });

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

  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      const matchesSearch = !searchTerm || 
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.ville?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.quartier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.address?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegion = selectedRegion === "all" || place.region === selectedRegion;
      const matchesStatus = selectedStatus === "all" || place.verificationStatus === selectedStatus;
      
      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [places, searchTerm, selectedRegion, selectedStatus]);

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

  const typeStats = stats?.byType?.[placeType] || places.length;
  const verifiedCount = places.filter(p => p.verificationStatus === "verified").length;
  const pendingCount = places.filter(p => p.verificationStatus === "pending").length;

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
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{typeStats}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{verifiedCount}</p>
                  <p className="text-xs text-muted-foreground">Vérifiés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{Object.keys(regionCounts).length}</p>
                  <p className="text-xs text-muted-foreground">Régions</p>
                </div>
              </div>
            </CardContent>
          </Card>
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

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-status">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="verified">Vérifiés</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="needs_review">À vérifier</SelectItem>
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

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredPlaces.length} lieu{filteredPlaces.length > 1 ? 'x' : ''} trouvé{filteredPlaces.length > 1 ? 's' : ''}
          </p>
          {(searchTerm || selectedRegion !== "all" || selectedStatus !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedRegion("all");
                setSelectedStatus("all");
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
                {searchTerm || selectedRegion !== "all" || selectedStatus !== "all"
                  ? "Essayez de modifier vos critères de recherche"
                  : "Les données seront bientôt disponibles après synchronisation"}
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
                showVerification={true}
                isAuthenticated={false}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
