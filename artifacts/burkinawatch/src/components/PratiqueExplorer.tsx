import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { List, Loader2, Map as MapIcon, RefreshCw, Search } from "lucide-react";
import type { Offer, Place, Signalement } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import GoogleMap, { type PlaceMapMarker } from "@/components/GoogleMap";
import { PlaceCard } from "@/components/PlaceCard";
import { OfferCard } from "@/components/OfferCard";
import { PracticalSignalCard } from "@/components/PracticalSignalCard";
import { offlineStorage } from "@/lib/offlineStorage";
import {
  filterPracticalPlaces,
  parsePracticalSearch,
  practicalFilterLabel,
  type PracticalExplorerType,
  type PracticalLocation,
  type PracticalSearchIntent,
} from "@/lib/practicalSearch";

type ExplorerType = PracticalExplorerType;

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
  intent?: PracticalSearchIntent;
}

interface PlacesResponse {
  places?: Place[];
}

type PracticalConfirmationSummary = {
  confirm: number;
  report: number;
  contest: number;
  currentAction: string | null;
  state: "confirmed" | "reported" | "contested" | "mixed" | "unknown";
};

type PracticalOffer = Offer & {
  placeName?: string | null;
  confirmations?: PracticalConfirmationSummary;
};

type PracticalSignal = Signalement & {
  signalType?: string | null;
  sourceType?: string | null;
  sourceName?: string | null;
  expiresAt?: string | Date | null;
  freshnessExpiresAt?: string | Date | null;
  confirmations?: PracticalConfirmationSummary;
};

function normalizePlaces(data: Place[] | PlacesResponse | undefined): Place[] {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.places) ? data.places : [];
}

export function PratiqueExplorer({ initialType = "pharmacy", searchTerm = "", intent }: PratiqueExplorerProps) {
  const [placeType, setPlaceType] = useState<ExplorerType>(initialType);
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [location, setLocation] = useState<PracticalLocation>();
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    setPlaceType(initialType);
  }, [initialType]);

  const effectiveIntent = useMemo<PracticalSearchIntent>(() => {
    const parsed = intent || parsePracticalSearch(localSearch);
    return { ...parsed, searchText: localSearch };
  }, [intent, localSearch]);

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

  const { data: offers = [], isLoading: offersLoading } = useQuery<PracticalOffer[]>({
    queryKey: ["/api/pratique/offers"],
    queryFn: async () => {
      const response = await fetch("/api/pratique/offers?limit=24");
      if (!response.ok) throw new Error("Impossible de charger les offres");
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const { data: signals = [], isLoading: signalsLoading } = useQuery<PracticalSignal[]>({
    queryKey: ["/api/pratique/signals"],
    queryFn: async () => {
      const response = await fetch("/api/pratique/signals?limit=12");
      if (!response.ok) throw new Error("Impossible de charger les signaux");
      return response.json();
    },
    staleTime: 60 * 1000,
  });

  const places = useMemo(() => {
    return filterPracticalPlaces(normalizePlaces(data), effectiveIntent, location)
      .slice(0, 24);
  }, [data, effectiveIntent, location]);

  const visibleOffers = useMemo(() => {
    const terms = effectiveIntent.searchText.toLocaleLowerCase("fr-FR").trim().split(/\s+/).filter((term) => term.length > 2);
    if (!terms.length) return offers.slice(0, 6);
    return offers
      .filter((offer) => {
        const haystack = [offer.title, offer.description, offer.category, offer.zone, offer.placeName]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("fr-FR");
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, 6);
  }, [effectiveIntent.searchText, offers]);

  const visibleSignals = useMemo(() => {
    const terms = effectiveIntent.searchText.toLocaleLowerCase("fr-FR").trim().split(/\s+/).filter((term) => term.length > 2);
    if (!terms.length) return signals.slice(0, 4);
    return signals
      .filter((signal) => {
        const haystack = [signal.titre, signal.description, signal.signalType, signal.localisation]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("fr-FR");
        return terms.some((term) => haystack.includes(term));
      })
      .slice(0, 4);
  }, [effectiveIntent.searchText, signals]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La position n’est pas disponible sur cet appareil.");
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setLocationError("Position non disponible. Les résultats proches restent inconnus."),
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 10_000 },
    );
  };

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

        {effectiveIntent.filters.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="practical-active-filters">
            <span className="text-xs font-semibold text-muted-foreground">Filtres compris</span>
            {effectiveIntent.filters.map((filter) => (
              <Badge key={filter} variant="secondary">
                {practicalFilterLabel(filter, effectiveIntent.budget)}
              </Badge>
            ))}
            {effectiveIntent.filters.includes("proximity") && !location ? (
              <Button type="button" size="sm" variant="outline" onClick={requestLocation}>
                Utiliser ma position
              </Button>
            ) : null}
          </div>
        ) : null}

        {locationError ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">{locationError}</p>
        ) : null}

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
            <Card><CardHeader><CardTitle className="text-base">Aucun lieu vérifiable trouvé</CardTitle></CardHeader><CardContent className="pt-0 text-sm text-muted-foreground">Essayez une autre catégorie ou retirez un filtre. Une disponibilité, une ouverture ou un prix absents ne sont pas inventés.</CardContent></Card>
          )}
          {viewMode === "list" && places.length > 6 ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">Les 6 premiers résultats sont affichés ici. Utilisez une catégorie pour ouvrir la liste complète.</p>
          ) : null}
        </div>

        {visibleOffers.length > 0 ? (
          <div className="mt-10" data-testid="practical-offers">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Concret maintenant</p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-950 dark:text-emerald-50">Offres disponibles</h3>
              <p className="mt-1 text-sm text-muted-foreground">Chaque offre garde sa source, sa date et son statut.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
            </div>
          </div>
        ) : null}

        {visibleSignals.length > 0 ? (
          <div className="mt-10" data-testid="practical-signals">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Contexte citoyen</p>
              <h3 className="mt-1 text-2xl font-bold text-emerald-950 dark:text-emerald-50">Signaux récents</h3>
              <p className="mt-1 text-sm text-muted-foreground">Les confirmations contradictoires restent affichées comme « À confirmer ».</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {visibleSignals.map((signal) => <PracticalSignalCard key={signal.id} signal={signal} />)}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}