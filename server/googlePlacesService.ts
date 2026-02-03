import { db } from "./db";
import { places, type Place } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

interface GooglePlaceResult {
  id: string;
  displayName: {
    text: string;
    languageCode: string;
  };
  formattedAddress: string;
  location: {
    latitude: number;
    longitude: number;
  };
  regularOpeningHours?: {
    openNow: boolean;
    periods: Array<{
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }>;
    weekdayDescriptions: string[];
  };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  primaryType?: string;
  primaryTypeDisplayName?: {
    text: string;
  };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  editorialSummary?: {
    text: string;
  };
  servesBeer?: boolean;
  servesWine?: boolean;
  servesBreakfast?: boolean;
  servesLunch?: boolean;
  servesDinner?: boolean;
  servesVegetarianFood?: boolean;
  takeout?: boolean;
  delivery?: boolean;
  dineIn?: boolean;
  reservable?: boolean;
  outdoorSeating?: boolean;
}

interface GooglePlacesResponse {
  places: GooglePlaceResult[];
  nextPageToken?: string;
}

const BURKINA_CITIES = [
  { name: "Ouagadougou", lat: 12.3714, lng: -1.5197 },
  { name: "Bobo-Dioulasso", lat: 11.1771, lng: -4.2979 },
  { name: "Koudougou", lat: 12.2525, lng: -2.3629 },
  { name: "Ouahigouya", lat: 13.5833, lng: -2.4167 },
  { name: "Banfora", lat: 10.6333, lng: -4.7667 },
  { name: "Fada N'Gourma", lat: 12.0611, lng: 0.3556 },
  { name: "Kaya", lat: 13.0917, lng: -1.0844 },
  { name: "Tenkodogo", lat: 11.7833, lng: -0.3667 },
  { name: "Dédougou", lat: 12.4633, lng: -3.4600 },
  { name: "Dori", lat: 14.0333, lng: -0.0333 },
];

const CITY_TO_REGION: Record<string, string> = {
  "Ouagadougou": "Kadiogo",
  "Bobo-Dioulasso": "Guiriko",
  "Koudougou": "Nando",
  "Ouahigouya": "Yaadga",
  "Banfora": "Tannounyan",
  "Fada N'Gourma": "Goulmou",
  "Kaya": "Kuilse",
  "Tenkodogo": "Nakambe",
  "Dédougou": "Bankui",
  "Dori": "Liptako",
};

export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = "https://places.googleapis.com/v1/places:searchNearby";

  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("⚠️ GOOGLE_API_KEY non configurée - Service Google Places désactivé");
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async searchRestaurantsInCity(city: { name: string; lat: number; lng: number }): Promise<GooglePlaceResult[]> {
    if (!this.apiKey) return [];

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
      "places.regularOpeningHours",
      "places.nationalPhoneNumber",
      "places.internationalPhoneNumber",
      "places.websiteUri",
      "places.rating",
      "places.userRatingCount",
      "places.priceLevel",
      "places.primaryType",
      "places.primaryTypeDisplayName",
      "places.photos",
      "places.editorialSummary",
      "places.servesBeer",
      "places.servesWine",
      "places.servesBreakfast",
      "places.servesLunch",
      "places.servesDinner",
      "places.servesVegetarianFood",
      "places.takeout",
      "places.delivery",
      "places.dineIn",
      "places.reservable",
      "places.outdoorSeating"
    ].join(",");

    const requestBody = {
      includedTypes: ["restaurant", "cafe", "fast_food_restaurant", "bar", "meal_takeaway"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: {
            latitude: city.lat,
            longitude: city.lng
          },
          radius: 10000
        }
      },
      languageCode: "fr"
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": fieldMask
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Places API error for ${city.name}:`, response.status, errorText);
        return [];
      }

      const data: GooglePlacesResponse = await response.json();
      return data.places || [];
    } catch (error) {
      console.error(`Error fetching restaurants in ${city.name}:`, error);
      return [];
    }
  }

  private formatOpeningHours(hours?: GooglePlaceResult["regularOpeningHours"]): string {
    if (!hours || !hours.weekdayDescriptions) return "";
    return hours.weekdayDescriptions.join(" | ");
  }

  private mapPriceLevel(priceLevel?: string): string {
    const mapping: Record<string, string> = {
      "PRICE_LEVEL_FREE": "Gratuit",
      "PRICE_LEVEL_INEXPENSIVE": "Économique",
      "PRICE_LEVEL_MODERATE": "Moyen",
      "PRICE_LEVEL_EXPENSIVE": "Haut de gamme",
      "PRICE_LEVEL_VERY_EXPENSIVE": "Luxe"
    };
    return mapping[priceLevel || ""] || "Non spécifié";
  }

  private buildServices(place: GooglePlaceResult): string[] {
    const services: string[] = [];
    if (place.dineIn) services.push("Sur place");
    if (place.takeout) services.push("À emporter");
    if (place.delivery) services.push("Livraison");
    if (place.reservable) services.push("Réservation");
    if (place.outdoorSeating) services.push("Terrasse");
    if (place.servesBreakfast) services.push("Petit-déjeuner");
    if (place.servesLunch) services.push("Déjeuner");
    if (place.servesDinner) services.push("Dîner");
    if (place.servesBeer || place.servesWine) services.push("Bar");
    if (place.servesVegetarianFood) services.push("Options végétariennes");
    return services;
  }

  private getPhotoUrl(photo: { name: string }, maxWidth: number = 400): string {
    if (!this.apiKey || !photo.name) return "";
    return `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=${maxWidth}&key=${this.apiKey}`;
  }

  async syncRestaurantsFromGoogle(): Promise<{ added: number; updated: number; errors: number }> {
    if (!this.apiKey) {
      console.log("⚠️ Google Places API non configurée, synchronisation ignorée");
      return { added: 0, updated: 0, errors: 0 };
    }

    let added = 0, updated = 0, errors = 0;

    console.log("🔄 Début de la synchronisation Google Places...");

    for (const city of BURKINA_CITIES) {
      try {
        console.log(`📍 Recherche de restaurants à ${city.name}...`);
        const results = await this.searchRestaurantsInCity(city);
        console.log(`  → ${results.length} restaurants trouvés`);

        for (const place of results) {
          try {
            const googlePlaceId = `google_${place.id}`;
            const region = CITY_TO_REGION[city.name] || "Kadiogo";
            
            const existingPlace = await db.select()
              .from(places)
              .where(eq(places.osmId, googlePlaceId))
              .limit(1);

            const tags: Record<string, string> = {};
            if (place.rating) tags.rating = place.rating.toString();
            if (place.userRatingCount) tags.ratingCount = place.userRatingCount.toString();
            if (place.priceLevel) tags.priceLevel = this.mapPriceLevel(place.priceLevel);
            if (place.editorialSummary?.text) tags.description = place.editorialSummary.text;
            if (place.primaryTypeDisplayName?.text) tags.cuisine = place.primaryTypeDisplayName.text;
            
            const services = this.buildServices(place);
            if (services.length > 0) tags.services = services.join(", ");
            
            if (place.photos && place.photos.length > 0) {
              tags.photoUrl = this.getPhotoUrl(place.photos[0]);
            }

            const placeData = {
              name: place.displayName?.text || "Restaurant",
              placeType: "restaurant",
              latitude: place.location.latitude.toString(),
              longitude: place.location.longitude.toString(),
              address: place.formattedAddress || "",
              ville: city.name,
              region: region,
              telephone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
              website: place.websiteUri || null,
              horaires: this.formatOpeningHours(place.regularOpeningHours) || null,
              osmId: googlePlaceId,
              osmType: "google",
              source: "Google",
              tags: tags,
              verificationStatus: "verified",
              updatedAt: new Date(),
              lastSyncedAt: new Date()
            };

            if (existingPlace.length > 0) {
              await db.update(places)
                .set(placeData)
                .where(eq(places.osmId, googlePlaceId));
              updated++;
            } else {
              await db.insert(places).values(placeData);
              added++;
            }
          } catch (err) {
            console.error(`Erreur lors de l'ajout du restaurant ${place.displayName?.text}:`, err);
            errors++;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Erreur lors de la recherche à ${city.name}:`, err);
        errors++;
      }
    }

    console.log(`✅ Synchronisation terminée: ${added} ajoutés, ${updated} mis à jour, ${errors} erreurs`);
    return { added, updated, errors };
  }

  async getRestaurantsWithDetails(options: {
    ville?: string;
    region?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Place[]> {
    const conditions = [eq(places.placeType, "restaurant")];

    if (options.ville) {
      conditions.push(eq(places.ville, options.ville));
    }
    if (options.region) {
      conditions.push(eq(places.region, options.region));
    }

    let query = db.select().from(places).where(and(...conditions));

    if (options.search) {
      query = db.select().from(places).where(
        and(
          ...conditions,
          sql`(${places.name} ILIKE ${'%' + options.search + '%'} OR ${places.address} ILIKE ${'%' + options.search + '%'})`
        )
      );
    }

    const results = await query
      .orderBy(sql`CASE WHEN ${places.source} = 'Google' THEN 0 ELSE 1 END`)
      .limit(options.limit || 50)
      .offset(options.offset || 0);

    return results;
  }
}

export const googlePlacesService = new GooglePlacesService();
