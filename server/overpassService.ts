import { db } from "./db";
import { places, placeVerifications, type Place, type InsertPlace, PlaceTypes, VerificationStatuses } from "@shared/schema";
import { eq, and, sql, ilike, or } from "drizzle-orm";

const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
const BURKINA_BBOX = {
  south: 9.4,
  west: -5.5,
  north: 15.1,
  east: 2.4,
};

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const PLACE_TYPE_QUERIES: Record<string, string> = {
  pharmacy: `["amenity"="pharmacy"]`,
  restaurant: `["amenity"="restaurant"]`,
  fuel: `["amenity"="fuel"]`,
  marketplace: `["amenity"="marketplace"]`,
  shop: `["shop"]`,
};

const REGIONS_MAPPING: Record<string, { cities: string[]; bounds?: { south: number; north: number; west: number; east: number } }> = {
  "Centre": { cities: ["Ouagadougou", "Ziniaré", "Saaba", "Pabré", "Tanghin-Dassouri"] },
  "Hauts-Bassins": { cities: ["Bobo-Dioulasso", "Houndé", "Dédougou"] },
  "Cascades": { cities: ["Banfora", "Sindou", "Niangoloko"] },
  "Centre-Nord": { cities: ["Kaya", "Kongoussi", "Bourzanga"] },
  "Centre-Ouest": { cities: ["Koudougou", "Réo", "Léo"] },
  "Centre-Est": { cities: ["Tenkodogo", "Koupéla", "Garango"] },
  "Centre-Sud": { cities: ["Manga", "Pô", "Kombissiri"] },
  "Est": { cities: ["Fada N'Gourma", "Diapaga", "Gayéri"] },
  "Nord": { cities: ["Ouahigouya", "Yako", "Gourcy"] },
  "Sahel": { cities: ["Dori", "Djibo", "Gorom-Gorom"] },
  "Sud-Ouest": { cities: ["Gaoua", "Diébougou", "Dano"] },
  "Boucle du Mouhoun": { cities: ["Dédougou", "Boromo", "Nouna"] },
  "Plateau-Central": { cities: ["Ziniaré", "Zorgho", "Boussé"] },
};

export class OverpassService {
  private static instance: OverpassService;
  private lastSync: Date | null = null;
  private syncInProgress = false;
  private cache: Map<string, { data: OverpassResponse; timestamp: number }> = new Map();
  private cacheTTL = 12 * 60 * 60 * 1000; // 12 hours

  private constructor() {}

  static getInstance(): OverpassService {
    if (!OverpassService.instance) {
      OverpassService.instance = new OverpassService();
    }
    return OverpassService.instance;
  }

  private async fetchFromOverpass(query: string): Promise<OverpassResponse> {
    const cacheKey = query;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      const response = await fetch(OVERPASS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("Overpass API rate limited, waiting...");
          await this.sleep(5000);
          return this.fetchFromOverpass(query);
        }
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json() as OverpassResponse;
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error("Overpass fetch error:", error);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildOverpassQuery(placeType: string): string {
    const typeQuery = PLACE_TYPE_QUERIES[placeType];
    if (!typeQuery) return "";

    const { south, west, north, east } = BURKINA_BBOX;
    
    return `
      [out:json][timeout:60];
      (
        node${typeQuery}(${south},${west},${north},${east});
        way${typeQuery}(${south},${west},${north},${east});
        relation${typeQuery}(${south},${west},${north},${east});
      );
      out center;
    `;
  }

  private parseOSMElement(element: OverpassElement, placeType: string): InsertPlace | null {
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;
    
    if (!lat || !lon) return null;
    if (lat < BURKINA_BBOX.south || lat > BURKINA_BBOX.north) return null;
    if (lon < BURKINA_BBOX.west || lon > BURKINA_BBOX.east) return null;

    const tags = element.tags || {};
    const name = tags.name || tags["name:fr"] || `${placeType} sans nom`;
    
    const address = [
      tags["addr:street"],
      tags["addr:housenumber"],
      tags["addr:city"],
    ].filter(Boolean).join(", ") || tags.address || null;

    const ville = tags["addr:city"] || this.guessCity(lat, lon);
    const region = this.guessRegion(ville);

    return {
      osmId: String(element.id),
      osmType: element.type,
      placeType,
      name,
      latitude: String(lat),
      longitude: String(lon),
      address,
      quartier: tags["addr:suburb"] || tags["addr:neighbourhood"] || null,
      ville,
      region,
      telephone: tags.phone || tags["contact:phone"] || null,
      email: tags.email || tags["contact:email"] || null,
      website: tags.website || tags["contact:website"] || null,
      horaires: tags.opening_hours || null,
      tags: tags as Record<string, unknown>,
      lastSyncedAt: new Date(),
    };
  }

  private guessCity(lat: number, lon: number): string | null {
    if (lat >= 12.3 && lat <= 12.4 && lon >= -1.6 && lon <= -1.4) return "Ouagadougou";
    if (lat >= 11.1 && lat <= 11.2 && lon >= -4.3 && lon <= -4.2) return "Bobo-Dioulasso";
    if (lat >= 10.6 && lat <= 10.7 && lon >= -4.8 && lon <= -4.7) return "Banfora";
    if (lat >= 13.0 && lat <= 13.1 && lon >= -2.4 && lon <= -2.3) return "Ouahigouya";
    if (lat >= 13.2 && lat <= 13.3 && lon >= -1.6 && lon <= -1.5) return "Kaya";
    return null;
  }

  private guessRegion(ville: string | null): string | null {
    if (!ville) return null;
    for (const [region, data] of Object.entries(REGIONS_MAPPING)) {
      if (data.cities.some(city => ville.toLowerCase().includes(city.toLowerCase()))) {
        return region;
      }
    }
    return null;
  }

  async syncPlaceType(placeType: string): Promise<{ added: number; updated: number; errors: number }> {
    const query = this.buildOverpassQuery(placeType);
    if (!query) return { added: 0, updated: 0, errors: 0 };

    let added = 0, updated = 0, errors = 0;

    try {
      const response = await this.fetchFromOverpass(query);
      
      for (const element of response.elements) {
        try {
          const placeData = this.parseOSMElement(element, placeType);
          if (!placeData) continue;

          const existing = await db.select()
            .from(places)
            .where(and(
              eq(places.osmId, placeData.osmId),
              eq(places.osmType, placeData.osmType)
            ))
            .limit(1);

          if (existing.length > 0) {
            await db.update(places)
              .set({
                name: placeData.name,
                latitude: placeData.latitude,
                longitude: placeData.longitude,
                address: placeData.address,
                telephone: placeData.telephone,
                horaires: placeData.horaires,
                tags: placeData.tags,
                lastSyncedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(places.id, existing[0].id));
            updated++;
          } else {
            await db.insert(places).values(placeData);
            added++;
          }
        } catch (err) {
          errors++;
          console.error("Error processing OSM element:", err);
        }
      }

      await this.sleep(1000);
    } catch (error) {
      console.error(`Error syncing ${placeType}:`, error);
      errors++;
    }

    return { added, updated, errors };
  }

  async syncAllPlaces(): Promise<void> {
    if (this.syncInProgress) {
      console.log("Sync already in progress, skipping...");
      return;
    }

    this.syncInProgress = true;
    console.log("🌍 Starting OpenStreetMap sync for Burkina Faso...");

    try {
      for (const placeType of Object.keys(PLACE_TYPE_QUERIES)) {
        console.log(`  Syncing ${placeType}...`);
        const result = await this.syncPlaceType(placeType);
        console.log(`  ✅ ${placeType}: ${result.added} added, ${result.updated} updated, ${result.errors} errors`);
        await this.sleep(2000);
      }

      this.lastSync = new Date();
      console.log("🌍 OpenStreetMap sync completed!");
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async getPlaces(options: {
    placeType?: string;
    region?: string;
    ville?: string;
    search?: string;
    verificationStatus?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Place[]> {
    let query = db.select().from(places);
    const conditions = [];

    if (options.placeType) {
      conditions.push(eq(places.placeType, options.placeType));
    }
    if (options.region) {
      conditions.push(eq(places.region, options.region));
    }
    if (options.ville) {
      conditions.push(eq(places.ville, options.ville));
    }
    if (options.verificationStatus) {
      conditions.push(eq(places.verificationStatus, options.verificationStatus));
    }
    if (options.search) {
      conditions.push(or(
        ilike(places.name, `%${options.search}%`),
        ilike(places.ville, `%${options.search}%`),
        ilike(places.address, `%${options.search}%`)
      ));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    const results = await query
      .limit(options.limit || 500)
      .offset(options.offset || 0);

    return results;
  }

  async getPlaceById(id: string): Promise<Place | null> {
    const result = await db.select()
      .from(places)
      .where(eq(places.id, id))
      .limit(1);
    return result[0] || null;
  }

  async confirmPlace(placeId: string, userId: string | null, ipAddress: string): Promise<boolean> {
    try {
      if (userId) {
        const existing = await db.select()
          .from(placeVerifications)
          .where(and(
            eq(placeVerifications.placeId, placeId),
            eq(placeVerifications.userId, userId),
            eq(placeVerifications.action, "confirm")
          ))
          .limit(1);

        if (existing.length > 0) {
          return false;
        }
      } else {
        const ipExisting = await db.select()
          .from(placeVerifications)
          .where(and(
            eq(placeVerifications.placeId, placeId),
            eq(placeVerifications.ipAddress, ipAddress),
            eq(placeVerifications.action, "confirm")
          ))
          .limit(1);

        if (ipExisting.length > 0) {
          return false;
        }
      }

      await db.insert(placeVerifications).values({
        placeId,
        userId,
        action: "confirm",
        ipAddress,
      });

      const place = await this.getPlaceById(placeId);
      if (place) {
        const newConfirmations = place.confirmations + 1;
        let newStatus = place.verificationStatus;
        
        if (newConfirmations >= 3) {
          newStatus = VerificationStatuses.VERIFIED;
        }

        await db.update(places)
          .set({
            confirmations: newConfirmations,
            verificationStatus: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(places.id, placeId));
      }

      return true;
    } catch (error) {
      console.error("Error confirming place:", error);
      return false;
    }
  }

  async reportPlace(placeId: string, userId: string | null, comment: string | null, ipAddress: string): Promise<boolean> {
    try {
      if (userId) {
        const existing = await db.select()
          .from(placeVerifications)
          .where(and(
            eq(placeVerifications.placeId, placeId),
            eq(placeVerifications.userId, userId),
            eq(placeVerifications.action, "report")
          ))
          .limit(1);

        if (existing.length > 0) {
          return false;
        }
      } else {
        const ipExisting = await db.select()
          .from(placeVerifications)
          .where(and(
            eq(placeVerifications.placeId, placeId),
            eq(placeVerifications.ipAddress, ipAddress),
            eq(placeVerifications.action, "report")
          ))
          .limit(1);

        if (ipExisting.length > 0) {
          return false;
        }
      }

      await db.insert(placeVerifications).values({
        placeId,
        userId,
        action: "report",
        comment,
        ipAddress,
      });

      const place = await this.getPlaceById(placeId);
      if (place) {
        const newReports = place.reports + 1;
        let newStatus = place.verificationStatus;
        
        if (newReports >= 2) {
          newStatus = VerificationStatuses.NEEDS_REVIEW;
        }

        await db.update(places)
          .set({
            reports: newReports,
            verificationStatus: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(places.id, placeId));
      }

      return true;
    } catch (error) {
      console.error("Error reporting place:", error);
      return false;
    }
  }

  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    verified: number;
    needsReview: number;
    lastSync: Date | null;
  }> {
    const allPlaces = await db.select().from(places);
    
    const byType: Record<string, number> = {};
    let verified = 0;
    let needsReview = 0;

    for (const place of allPlaces) {
      byType[place.placeType] = (byType[place.placeType] || 0) + 1;
      if (place.verificationStatus === VerificationStatuses.VERIFIED) verified++;
      if (place.verificationStatus === VerificationStatuses.NEEDS_REVIEW) needsReview++;
    }

    return {
      total: allPlaces.length,
      byType,
      verified,
      needsReview,
      lastSync: this.lastSync,
    };
  }

  async getUserVerifications(placeId: string, userId: string): Promise<{ confirmed: boolean; reported: boolean }> {
    const verifications = await db.select()
      .from(placeVerifications)
      .where(and(
        eq(placeVerifications.placeId, placeId),
        eq(placeVerifications.userId, userId)
      ));

    return {
      confirmed: verifications.some(v => v.action === "confirm"),
      reported: verifications.some(v => v.action === "report"),
    };
  }

  scheduleAutoSync(intervalHours: number = 24): void {
    console.log(`🌍 OpenStreetMap auto-sync scheduled every ${intervalHours} hours`);
    
    this.syncAllPlaces().catch(console.error);
    
    setInterval(() => {
      this.syncAllPlaces().catch(console.error);
    }, intervalHours * 60 * 60 * 1000);
  }
}

export const overpassService = OverpassService.getInstance();
