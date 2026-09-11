import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { List, Loader2, Map as MapIcon, RefreshCw, Search } from "lucide-react";
import type { Place } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import GoogleMap, { type PlaceMapMarker } from "@/components/GoogleMap";
import { PlaceCard } from "@/components/PlaceCard";
import { offlineStorage } from "@/lib/offlineStorage";

type ExplorerType = "pharmacy" | "fuel" | "restaurant" | "shop" | "marketplace";

const EXPLORER_TYPES: Array<{ value: ExplorerType; label: string }> = [
  { value: "pharmacy", label: "Pharmacies" },
  { value: "fuel", label: "Stations" },
  { value: "restaurant", label: "Restaurants" },
  { value: "shop", label: "Boutiques" },
  { value: "marketplace", label: "Marchés" },
];

interface PratiqueExplorerProps {
  initialType?: ExplorerType;
  searchTerm?: string;
}

interface PlacesResponse {
  places?: Place[];
}

function normalizePlaces(data: Place[] | PlacesResponse | undefined): Place[] {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.places) ? data.places : [];
}

export function PratiqueExplorer({ initialType = "pharmacy", searchTerm = "" }: PratiqueExplorerProps) {
  const [placeType, setPlaceType] = useState<ExplorerType>(initialType);
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, refetch } = useQuery<Place[] | PlacesResponse>({
    queryKey: ["pratique-explorer", placeType],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/places?placeType=${encodeURIComponent(placeType)}`);
        if (!response.ok) throw new Error("Impossible de charger les lieux");
        const freshData = await response.json() as Place[] | PlacesResponse;
        const freshPlaces = normalizePlaces(freshData);
        await offlineStorage.cachePlaces(placeType, freshPlaces);
        return freshData;
      } catch (error) {
        const cachedPlaces = await offlineStorage.getCachedPlaces(placeType);
        if (cachedPlaces.length) return { places: cachedPlaces };
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const places = useMemo(() => {
    const query = localSearch.trim().toLocaleLowerCase();
    return normalizePlaces(data)
      .filter((place) => {
        if (!query) return true;
        return [place.name, place.address, place.quartier, place.ville, place.region]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase().includes(query));
      })
      .slice(0, 24);
  }, [data, localSearch]);

  const markers = useMemo<PlaceMapMarker[]>(
    () =>
      places.flatMap((place) => {
        const lat = Number(place.latitude);
        const lng = Number(place.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];
        return [{
          id: String(place.id),
          lat,
          lng,
          title: place.name || "Lieu sans nom",
          address: place.address || [place.quartier, place.ville].filter(Boolean).join(", "),
        }];
      }),
    [places],
  );

  return (
    <section className="border-y border-emerald-900/10 bg-emerald-50/40 py-12 dark:bg-emerald-950/10" data-testid="pratique-explorer">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Nouveau dans Burkina Pratique</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-emerald-950 dark:text-emerald-50">Explorez les lieux autour de vous</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Filtrez les données existantes, passez de la liste à la carte et ouvrez directement une fiche vérifiable.
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-2 border-emerald-700/20 bg-background">
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {places.length} résultat{places.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {EXPLORER_TYPES.map((type) => (
            <Button
              key={type.value}
              type="button"
              size="sm"
              variant={placeType === type.value ? "default" : "outline"}
              onClick={() => setPlaceType(type.value)}
              className={placeType === type.value ? "bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-500 dark:text-emerald-950" : ""}
            >
              {type.label}
            </Button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Filtrer par nom, ville ou quartier"
              className="h-11 bg-background pl-10"
              aria-label="Filtrer les lieux"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")} className="gap-2">
              <List className="h-4 w-4" /> Liste
            </Button>
            <Button type="button" variant={viewMode === "map" ? "default" : "outline"} onClick={() => setViewMode("map")} className="gap-2">
              <MapIcon className="h-4 w-4" /> Carte
            </Button>
            <Button type="button" variant="outline" size="icon" onClick={() => void refetch()} aria-label="Actualiser les lieux">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <Card><CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Chargement des lieux…</CardContent></Card>
          ) : isError ? (
            <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Les lieux ne sont pas disponibles pour le moment. Réessayez ou consultez une catégorie.</CardContent></Card>
          ) : viewMode === "map" ? (
            <div className="overflow-hidden rounded-2xl border bg-background">
              <GoogleMap
                markers={[]}
                placeMode
                placeMarkers={markers}
                highlightPlaceId={selectedPlaceId}
                onPlaceMarkerClick={(marker) => setSelectedPlaceId(marker.id)}
                className="h-[420px] w-full"
              />
            </div>
          ) : places.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {places.slice(0, 6).map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          ) : (
            <Card><CardHeader><CardTitle className="text-base">Aucun lieu trouvé</CardTitle></CardHeader><CardContent className="pt-0 text-sm text-muted-foreground">Essayez une autre catégorie ou retirez le filtre de recherche.</CardContent></Card>
          )}
          {viewMode === "list" && places.length > 6 ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">Les 6 premiers résultats sont affichés ici. Utilisez une catégorie pour ouvrir la liste complète.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}