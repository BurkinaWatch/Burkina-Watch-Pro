import { db } from "./db";
import { places, type InsertPlace } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

const BURKINA_BBOX = {
  south: 9.4,
  west: -5.5,
  north: 15.1,
  east: 2.4,
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export class OverpassService {
  private static instance: OverpassService;
  private constructor() {}

  static getInstance(): OverpassService {
    if (!OverpassService.instance) {
      OverpassService.instance = new OverpassService();
    }
    return OverpassService.instance;
  }

  private async fetchFromOverpass(query: string): Promise<any> {
    const endpoint = OVERPASS_ENDPOINTS[0];
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) throw new Error(`Overpass API error: ${response.status}`);
    return await response.json();
  }

  private buildOverpassQuery(placeType: string): string {
    const { south, west, north, east } = BURKINA_BBOX;
    let tags = "";
    if (placeType === "caisses_populaires") {
      tags = `["amenity"~"bank|microfinance"]["name"~"Caisse Populaire|RCPB|Caisse"]`;
    } else if (placeType === "bank") {
      tags = `["amenity"~"bank|microfinance"]`;
    } else if (placeType === "atm") {
      tags = `["amenity"="atm"]`;
    } else {
      tags = `["amenity"="${placeType}"]`;
    }

    return `
      [out:json][timeout:180];
      (
        node${tags}(${south},${west},${north},${east});
        way${tags}(${south},${west},${north},${east});
        relation${tags}(${south},${west},${north},${east});
      );
      out center;
    `;
  }

  async getPlaces(options: { placeType?: string; region?: string }) {
    let query = db.select().from(places);
    if (options.placeType) {
      // Logic here to filter by type
    }
    const results = await query;
    return { places: results };
  }

  async syncPlaceType(placeType: string, force = false): Promise<{ added: number; updated: number; errors: number }> {
    const query = this.buildOverpassQuery(placeType);
    const response = await this.fetchFromOverpass(query);
    let added = 0, updated = 0, errors = 0;

    if (force) {
      await db.delete(places).where(eq(places.placeType, placeType));
    }

    for (const element of response.elements) {
      try {
        const placeData = this.parseOSMElement(element, placeType);
        if (!placeData) continue;
        await db.insert(places).values(placeData).onConflictDoUpdate({
          target: [places.osmId, places.osmType],
          set: { ...placeData, updatedAt: new Date() }
        });
        added++;
      } catch (err) {
        errors++;
      }
    }
    return { added, updated, errors };
  }

  private parseOSMElement(element: any, placeType: string): InsertPlace | null {
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    if (!lat || !lon) return null;

    const tags = element.tags || {};
    const name = tags.name || tags.operator || tags.brand || `${placeType} sans nom`;
    
    let finalType = placeType;
    if (name.toLowerCase().includes("caisse") || name.toLowerCase().includes("rcpb")) {
      finalType = "caisses_populaires";
    }

    return {
      osmId: String(element.id),
      osmType: element.type,
      placeType: finalType,
      name,
      latitude: String(lat),
      longitude: String(lon),
      address: tags["addr:street"] || "Burkina Faso",
      quartier: tags["addr:suburb"] || "Quartier non spécifié",
      ville: tags["addr:city"] || "Ville non spécifiée",
      region: "Région non spécifiée",
      tags: {
        ...tags,
        hasGAB: tags.atm === "yes" || finalType === "atm",
        importanceSystemique: name.toLowerCase().includes("coris") || name.toLowerCase().includes("boa")
      },
    };
  }
}

export const overpassService = OverpassService.getInstance();
