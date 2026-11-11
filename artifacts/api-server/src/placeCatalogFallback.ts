import { BANQUES_DATA } from "./banquesData";
import { BOUTIQUES_DATA } from "./boutiquesData";
import { stationsService } from "./stationsService";
import { ALL_AGENCES_TELEPHONIE } from "./telephonieData";

export const CATALOG_FALLBACK_PLACE_TYPES = [
  "fuel",
  "shop",
  "mobile_phone",
  "bank",
] as const;

export type CatalogFallbackPlaceType =
  (typeof CATALOG_FALLBACK_PLACE_TYPES)[number];

export function getCatalogFallbackEntries(placeType: string): Record<string, any>[] {
  switch (placeType) {
    case "fuel":
      return stationsService.getAllStations();
    case "shop":
      return BOUTIQUES_DATA;
    case "mobile_phone":
      return ALL_AGENCES_TELEPHONIE;
    case "bank":
      return BANQUES_DATA;
    default:
      return [];
  }
}

export function selectPlacesWithCatalogFallback<OsmPlace, CatalogPlace>(
  osmPlaces: OsmPlace[],
  catalogPlaces: CatalogPlace[],
): OsmPlace[] | CatalogPlace[] {
  return osmPlaces.length > 0 ? osmPlaces : catalogPlaces;
}