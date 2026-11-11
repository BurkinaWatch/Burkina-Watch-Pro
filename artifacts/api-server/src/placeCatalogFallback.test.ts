import assert from "node:assert/strict";
import test from "node:test";
import {
  CATALOG_FALLBACK_PLACE_TYPES,
  getCatalogFallbackEntries,
  selectPlacesWithCatalogFallback,
} from "./placeCatalogFallback";

test("chaque catalogue local reste alimenté comme repli quand OSM est vide", () => {
  for (const placeType of CATALOG_FALLBACK_PLACE_TYPES) {
    const entries = getCatalogFallbackEntries(placeType);

    assert.ok(
      entries.length > 0,
      `Le catalogue local ${placeType} ne doit pas être vide`,
    );
    assert.deepEqual(
      selectPlacesWithCatalogFallback([], entries),
      entries,
      `Une réponse OSM vide doit conserver le catalogue ${placeType}`,
    );
  }
});

test("des données OSM disponibles restent prioritaires sans supprimer le repli", () => {
  const osmPlaces = [{ id: "osm-1" }];
  const catalogPlaces = [{ id: "local-1" }];

  assert.deepEqual(
    selectPlacesWithCatalogFallback(osmPlaces, catalogPlaces),
    osmPlaces,
  );
});