import { db } from "./db";
import { places, type InsertPlace, DataSources } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { PHARMACIES_DATA, type Pharmacie } from "./pharmaciesData";
import { RESTAURANTS_DATA, type Restaurant } from "./restaurantsData";

export interface MigrationStats {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export class DataMigrationService {
  private static instance: DataMigrationService;

  private constructor() {}

  static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService();
    }
    return DataMigrationService.instance;
  }

  async migratePharmacies(): Promise<MigrationStats> {
    const stats: MigrationStats = {
      total: PHARMACIES_DATA.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const pharmacie of PHARMACIES_DATA) {
      try {
        const place = this.transformPharmacyToPlace(pharmacie);
        const result = await this.upsertPlace(place);
        if (result === "inserted") stats.inserted++;
        else if (result === "updated") stats.updated++;
        else stats.skipped++;
      } catch (error) {
        stats.errors.push(`Pharmacie ${pharmacie.nom}: ${error}`);
      }
    }

    console.log(`[Migration] Pharmacies: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.skipped} skipped`);
    return stats;
  }

  async migrateRestaurants(): Promise<MigrationStats> {
    const stats: MigrationStats = {
      total: RESTAURANTS_DATA.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const restaurant of RESTAURANTS_DATA) {
      try {
        const place = this.transformRestaurantToPlace(restaurant);
        const result = await this.upsertPlace(place);
        if (result === "inserted") stats.inserted++;
        else if (result === "updated") stats.updated++;
        else stats.skipped++;
      } catch (error) {
        stats.errors.push(`Restaurant ${restaurant.nom}: ${error}`);
      }
    }

    console.log(`[Migration] Restaurants: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.skipped} skipped`);
    return stats;
  }

  async migrateAll(): Promise<{ pharmacies: MigrationStats; restaurants: MigrationStats }> {
    console.log("[Migration] Starting full data migration...");
    
    const pharmacies = await this.migratePharmacies();
    const restaurants = await this.migrateRestaurants();

    console.log("[Migration] Migration complete!");
    return { pharmacies, restaurants };
  }

  private transformPharmacyToPlace(pharmacie: Pharmacie): InsertPlace {
    const services = [
      ...pharmacie.services,
      ...(pharmacie.is24h ? ["24h/24"] : []),
      ...(pharmacie.gardeNuit ? ["Garde de nuit"] : [])
    ];

    return {
      osmId: `hardcoded-pharmacy-${pharmacie.id}`,
      osmType: "hardcoded",
      placeType: "pharmacy",
      name: pharmacie.nom,
      latitude: String(pharmacie.latitude),
      longitude: String(pharmacie.longitude),
      address: pharmacie.adresse,
      quartier: pharmacie.quartier,
      ville: pharmacie.ville,
      region: pharmacie.region,
      telephone: pharmacie.telephone || null,
      email: pharmacie.email || null,
      website: null,
      horaires: pharmacie.horaires,
      imageUrl: null,
      tags: {
        type: pharmacie.type,
        is24h: pharmacie.is24h,
        gardeNuit: pharmacie.gardeNuit,
        services: pharmacie.services,
        specialites: pharmacie.specialites
      } as Record<string, unknown>,
      source: DataSources.OFFICIEL,
      confidenceScore: "0.9",
      lastSyncedAt: new Date(),
    };
  }

  private transformRestaurantToPlace(restaurant: Restaurant): InsertPlace {
    const services = [
      ...restaurant.services,
      ...(restaurant.wifi ? ["WiFi"] : []),
      ...(restaurant.climatisation ? ["Climatisation"] : []),
      ...(restaurant.parking ? ["Parking"] : []),
      ...(restaurant.terrasse ? ["Terrasse"] : []),
      ...(restaurant.livraison ? ["Livraison"] : [])
    ];

    return {
      osmId: `hardcoded-restaurant-${restaurant.id}`,
      osmType: "hardcoded",
      placeType: "restaurant",
      name: restaurant.nom,
      latitude: String(restaurant.latitude),
      longitude: String(restaurant.longitude),
      address: restaurant.adresse,
      quartier: restaurant.quartier,
      ville: restaurant.ville,
      region: restaurant.region,
      telephone: restaurant.telephone || null,
      email: restaurant.email || null,
      website: restaurant.siteWeb || null,
      horaires: restaurant.horaires,
      imageUrl: null,
      tags: {
        type: restaurant.type,
        gammePrix: restaurant.gammePrix,
        fermeture: restaurant.fermeture,
        services: services,
        specialites: restaurant.specialites,
        capacite: restaurant.capacite
      } as Record<string, unknown>,
      source: DataSources.OFFICIEL,
      confidenceScore: "0.85",
      lastSyncedAt: new Date(),
    };
  }

  private async upsertPlace(place: InsertPlace): Promise<"inserted" | "updated" | "skipped"> {
    const existing = await db.select()
      .from(places)
      .where(and(
        eq(places.osmId, place.osmId),
        eq(places.osmType, place.osmType)
      ))
      .limit(1);

    if (existing.length > 0) {
      await db.update(places)
        .set({
          ...place,
          updatedAt: new Date()
        })
        .where(eq(places.id, existing[0].id));
      return "updated";
    }

    await db.insert(places).values(place);
    return "inserted";
  }

  async getPlacesBySource(source: string): Promise<number> {
    const result = await db.select()
      .from(places)
      .where(eq(places.source, source));
    return result.length;
  }

  async getMigrationStatus(): Promise<{
    osm: number;
    officiel: number;
    communaute: number;
    total: number;
  }> {
    const osm = await this.getPlacesBySource(DataSources.OSM);
    const officiel = await this.getPlacesBySource(DataSources.OFFICIEL);
    const communaute = await this.getPlacesBySource(DataSources.COMMUNAUTE);

    return {
      osm,
      officiel,
      communaute,
      total: osm + officiel + communaute
    };
  }
}

export const dataMigrationService = DataMigrationService.getInstance();
