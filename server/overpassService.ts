import { db } from "./db";
import { places, placeVerifications, type Place, type InsertPlace, PlaceTypes, VerificationStatuses, DataSources } from "@shared/schema";
import { eq, and, sql, ilike, or } from "drizzle-orm";
import { storage } from "./storage";

// Multiple Overpass API endpoints for redundancy
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
let currentEndpointIndex = 0;
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
  // Santé
  pharmacy: `["amenity"="pharmacy"]`,
  hospital: `["amenity"="hospital"]`,
  clinic: `["amenity"="clinic"]`,
  doctors: `["amenity"="doctors"]`,
  dentist: `["amenity"="dentist"]`,
  
  // Restauration
  restaurant: `["amenity"="restaurant"]`,
  fast_food: `["amenity"="fast_food"]`,
  cafe: `["amenity"="cafe"]`,
  bar: `["amenity"="bar"]`,
  pub: `["amenity"="pub"]`,
  ice_cream: `["amenity"="ice_cream"]`,
  food_court: `["amenity"="food_court"]`,
  
  // Carburant et transport
  fuel: `["amenity"="fuel"]`,
  car_wash: `["amenity"="car_wash"]`,
  car_repair: `["shop"="car_repair"]`,
  car_parts: `["shop"="car_parts"]`,
  bicycle: `["shop"="bicycle"]`,
  motorcycle: `["shop"="motorcycle"]`,
  bus_station: `["amenity"="bus_station"]`,
  taxi: `["amenity"="taxi"]`,
  
  // Commerce
  marketplace: `["amenity"="marketplace"]`,
  supermarket: `["shop"="supermarket"]`,
  convenience: `["shop"="convenience"]`,
  grocery: `["shop"="grocery"]`,
  butcher: `["shop"="butcher"]`,
  bakery: `["shop"="bakery"]`,
  pastry: `["shop"="pastry"]`,
  confectionery: `["shop"="confectionery"]`,
  greengrocer: `["shop"="greengrocer"]`,
  seafood: `["shop"="seafood"]`,
  deli: `["shop"="deli"]`,
  
  // Mode et beauté
  clothes: `["shop"="clothes"]`,
  shoes: `["shop"="shoes"]`,
  jewelry: `["shop"="jewelry"]`,
  hairdresser: `["shop"="hairdresser"]`,
  beauty: `["shop"="beauty"]`,
  cosmetics: `["shop"="cosmetics"]`,
  tailor: `["shop"="tailor"]`,
  fabric: `["shop"="fabric"]`,
  
  // Électronique et télécom
  electronics: `["shop"="electronics"]`,
  mobile_phone: `["shop"="mobile_phone"]`,
  computer: `["shop"="computer"]`,
  appliance: `["shop"="appliance"]`,
  
  // Maison et construction
  hardware: `["shop"="hardware"]`,
  furniture: `["shop"="furniture"]`,
  houseware: `["shop"="houseware"]`,
  paint: `["shop"="paint"]`,
  bathroom_furnishing: `["shop"="bathroom_furnishing"]`,
  
  // Services financiers
  bank: `["amenity"="bank"]`,
  atm: `["amenity"="atm"]`,
  bureau_de_change: `["amenity"="bureau_de_change"]`,
  money_transfer: `["amenity"="money_transfer"]`,
  
  // Hébergement
  hotel: `["tourism"="hotel"]`,
  guest_house: `["tourism"="guest_house"]`,
  hostel: `["tourism"="hostel"]`,
  motel: `["tourism"="motel"]`,
  
  // Éducation
  school: `["amenity"="school"]`,
  university: `["amenity"="university"]`,
  college: `["amenity"="college"]`,
  kindergarten: `["amenity"="kindergarten"]`,
  library: `["amenity"="library"]`,
  driving_school: `["amenity"="driving_school"]`,
  
  // Culture et loisirs
  cinema: `["amenity"="cinema"]`,
  theatre: `["amenity"="theatre"]`,
  nightclub: `["amenity"="nightclub"]`,
  arts_centre: `["amenity"="arts_centre"]`,
  community_centre: `["amenity"="community_centre"]`,
  place_of_worship: `["amenity"="place_of_worship"]`,
  
  // Sport et fitness
  sports_centre: `["leisure"="sports_centre"]`,
  fitness_centre: `["leisure"="fitness_centre"]`,
  swimming_pool: `["leisure"="swimming_pool"]`,
  stadium: `["leisure"="stadium"]`,
  pitch: `["leisure"="pitch"]`,
  
  // Services publics
  police: `["amenity"="police"]`,
  fire_station: `["amenity"="fire_station"]`,
  post_office: `["amenity"="post_office"]`,
  townhall: `["amenity"="townhall"]`,
  embassy: `["amenity"="embassy"]`,
  courthouse: `["amenity"="courthouse"]`,
  
  // Autres commerces
  bookshop: `["shop"="books"]`,
  stationery: `["shop"="stationery"]`,
  gift: `["shop"="gift"]`,
  toys: `["shop"="toys"]`,
  sports: `["shop"="sports"]`,
  optician: `["shop"="optician"]`,
  photo: `["shop"="photo"]`,
  variety_store: `["shop"="variety_store"]`,
  kiosk: `["shop"="kiosk"]`,
  tobacco: `["shop"="tobacco"]`,
  alcohol: `["shop"="alcohol"]`,
  beverages: `["shop"="beverages"]`,
  
  // Agriculture et élevage
  agrarian: `["shop"="agrarian"]`,
  farm: `["shop"="farm"]`,
  pet: `["shop"="pet"]`,
  
  // Autres services
  laundry: `["shop"="laundry"]`,
  dry_cleaning: `["shop"="dry_cleaning"]`,
  copyshop: `["shop"="copyshop"]`,
  travel_agency: `["shop"="travel_agency"]`,
  funeral_directors: `["shop"="funeral_directors"]`,
  locksmith: `["shop"="locksmith"]`,
  
  // Tourisme
  attraction: `["tourism"="attraction"]`,
  museum: `["tourism"="museum"]`,
  viewpoint: `["tourism"="viewpoint"]`,
  artwork: `["tourism"="artwork"]`,
  
  // Espaces verts
  park: `["leisure"="park"]`,
  garden: `["leisure"="garden"]`,
  nature_reserve: `["leisure"="nature_reserve"]`,
};

const REGIONS_MAPPING: Record<string, { cities: string[]; bounds: { south: number; north: number; west: number; east: number } }> = {
  "Centre": { 
    cities: ["Ouagadougou", "Ziniaré", "Saaba", "Pabré", "Tanghin-Dassouri", "Komsilga", "Koubri", "Loumbila", "Nagréongo", "Ourgou-Manega"],
    bounds: { south: 12.0, north: 12.8, west: -1.9, east: -1.2 }
  },
  "Hauts-Bassins": { 
    cities: ["Bobo-Dioulasso", "Houndé", "Léna", "Dandé", "Padéma", "Bama", "Karangasso-Vigué", "Péni", "Satiri", "Toussiana"],
    bounds: { south: 10.5, north: 12.0, west: -5.5, east: -3.5 }
  },
  "Cascades": { 
    cities: ["Banfora", "Sindou", "Niangoloko", "Bérégadougou", "Ouo", "Sidéradougou", "Tiéfora", "Mangodara", "Soubakaniédougou", "Douna"],
    bounds: { south: 9.4, north: 11.0, west: -5.5, east: -4.0 }
  },
  "Centre-Nord": { 
    cities: ["Kaya", "Kongoussi", "Bourzanga", "Boulsa", "Barsalogho", "Pissila", "Tougouri", "Yalgo", "Dablo", "Namissiguima"],
    bounds: { south: 12.8, north: 14.0, west: -1.8, east: -0.5 }
  },
  "Centre-Ouest": { 
    cities: ["Koudougou", "Réo", "Léo", "Sabou", "Ténado", "Nanoro", "Didyr", "Pouni", "Zawara", "Thyou"],
    bounds: { south: 11.5, north: 12.8, west: -2.8, east: -1.8 }
  },
  "Centre-Est": { 
    cities: ["Tenkodogo", "Koupéla", "Garango", "Ouargaye", "Bittou", "Pouytenga", "Andemtenga", "Dourtenga", "Lalgaye", "Sangha"],
    bounds: { south: 11.0, north: 12.5, west: -0.8, east: 0.5 }
  },
  "Centre-Sud": { 
    cities: ["Manga", "Pô", "Kombissiri", "Nobéré", "Saponé", "Gogo", "Guiaro", "Tiébélé", "Biéha", "Gongombiro"],
    bounds: { south: 11.0, north: 12.2, west: -1.6, east: -0.6 }
  },
  "Est": { 
    cities: ["Fada N'Gourma", "Diapaga", "Gayéri", "Bogandé", "Manni", "Pama", "Kantchari", "Tambaga", "Matiacoali", "Comin-Yanga"],
    bounds: { south: 11.0, north: 13.5, west: -0.5, east: 2.4 }
  },
  "Nord": { 
    cities: ["Ouahigouya", "Yako", "Gourcy", "Titao", "Séguénéga", "Thiou", "Koumbri", "Arbollé", "Bokin", "Kirsi"],
    bounds: { south: 12.8, north: 14.5, west: -3.0, east: -1.8 }
  },
  "Sahel": { 
    cities: ["Dori", "Djibo", "Gorom-Gorom", "Sebba", "Aribinda", "Seytenga", "Tongomayel", "Baraboulé", "Sampelga", "Markoye"],
    bounds: { south: 13.5, north: 15.1, west: -1.5, east: 1.0 }
  },
  "Sud-Ouest": { 
    cities: ["Gaoua", "Diébougou", "Dano", "Batié", "Kampti", "Loropéni", "Nako", "Dissin", "Legmoin", "Iolonioro"],
    bounds: { south: 9.8, north: 11.5, west: -4.0, east: -2.5 }
  },
  "Boucle du Mouhoun": { 
    cities: ["Dédougou", "Boromo", "Nouna", "Solenzo", "Toma", "Tougan", "Djibasso", "Safané", "Bondokuy", "Gassan"],
    bounds: { south: 11.5, north: 13.5, west: -4.5, east: -2.5 }
  },
  "Plateau-Central": { 
    cities: ["Ziniaré", "Zorgho", "Boussé", "Mogtédo", "Méguet", "Absouya", "Laye", "Niou", "Zitenga", "Sourgoubila"],
    bounds: { south: 12.2, north: 13.0, west: -1.5, east: -0.5 }
  },
};

// Extended city coordinates for more accurate geo-matching (45 provinces + major towns)
const CITY_COORDINATES: Record<string, { lat: number; lon: number; radius: number }> = {
  // Région Centre
  "Ouagadougou": { lat: 12.37, lon: -1.52, radius: 0.15 },
  "Ziniaré": { lat: 12.58, lon: -1.30, radius: 0.05 },
  "Saaba": { lat: 12.36, lon: -1.40, radius: 0.03 },
  
  // Région Hauts-Bassins
  "Bobo-Dioulasso": { lat: 11.17, lon: -4.30, radius: 0.12 },
  "Houndé": { lat: 11.50, lon: -3.52, radius: 0.05 },
  "Léna": { lat: 11.10, lon: -4.00, radius: 0.03 },
  
  // Région Cascades
  "Banfora": { lat: 10.63, lon: -4.77, radius: 0.06 },
  "Sindou": { lat: 10.67, lon: -5.17, radius: 0.03 },
  "Niangoloko": { lat: 10.27, lon: -4.92, radius: 0.03 },
  
  // Région Centre-Nord
  "Kaya": { lat: 13.08, lon: -1.08, radius: 0.05 },
  "Kongoussi": { lat: 13.33, lon: -1.53, radius: 0.03 },
  "Boulsa": { lat: 12.67, lon: -0.57, radius: 0.03 },
  
  // Région Centre-Ouest
  "Koudougou": { lat: 12.25, lon: -2.37, radius: 0.06 },
  "Réo": { lat: 12.32, lon: -2.47, radius: 0.03 },
  "Léo": { lat: 11.10, lon: -2.10, radius: 0.03 },
  
  // Région Centre-Est
  "Tenkodogo": { lat: 11.78, lon: -0.37, radius: 0.04 },
  "Koupéla": { lat: 12.18, lon: -0.35, radius: 0.03 },
  "Garango": { lat: 11.80, lon: -0.55, radius: 0.03 },
  "Pouytenga": { lat: 12.25, lon: -0.52, radius: 0.03 },
  
  // Région Centre-Sud
  "Manga": { lat: 11.67, lon: -1.07, radius: 0.03 },
  "Pô": { lat: 11.17, lon: -1.15, radius: 0.03 },
  "Kombissiri": { lat: 12.07, lon: -1.33, radius: 0.03 },
  
  // Région Est
  "Fada N'Gourma": { lat: 12.07, lon: 0.35, radius: 0.05 },
  "Diapaga": { lat: 12.07, lon: 1.78, radius: 0.03 },
  "Bogandé": { lat: 12.97, lon: -0.13, radius: 0.03 },
  "Pama": { lat: 11.25, lon: 0.70, radius: 0.03 },
  
  // Région Nord
  "Ouahigouya": { lat: 13.58, lon: -2.43, radius: 0.06 },
  "Yako": { lat: 12.95, lon: -2.27, radius: 0.03 },
  "Gourcy": { lat: 13.20, lon: -2.35, radius: 0.03 },
  "Titao": { lat: 13.77, lon: -2.07, radius: 0.03 },
  
  // Région Sahel
  "Dori": { lat: 14.03, lon: -0.03, radius: 0.04 },
  "Djibo": { lat: 14.10, lon: -1.63, radius: 0.03 },
  "Gorom-Gorom": { lat: 14.45, lon: -0.23, radius: 0.03 },
  "Sebba": { lat: 13.43, lon: 0.53, radius: 0.03 },
  
  // Région Sud-Ouest
  "Gaoua": { lat: 10.33, lon: -3.18, radius: 0.04 },
  "Diébougou": { lat: 10.97, lon: -3.25, radius: 0.03 },
  "Dano": { lat: 11.15, lon: -3.07, radius: 0.03 },
  "Batié": { lat: 9.88, lon: -2.92, radius: 0.03 },
  
  // Région Boucle du Mouhoun
  "Dédougou": { lat: 12.47, lon: -3.47, radius: 0.05 },
  "Boromo": { lat: 11.75, lon: -2.93, radius: 0.03 },
  "Nouna": { lat: 12.73, lon: -3.87, radius: 0.03 },
  "Solenzo": { lat: 12.18, lon: -4.07, radius: 0.03 },
  "Tougan": { lat: 13.07, lon: -3.07, radius: 0.03 },
  
  // Région Plateau-Central
  "Zorgho": { lat: 12.25, lon: -0.62, radius: 0.03 },
  "Boussé": { lat: 12.67, lon: -1.90, radius: 0.03 },
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

  private async fetchFromOverpass(query: string, retries = 3): Promise<OverpassResponse> {
    const cacheKey = query;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      // Rotate through endpoints on each retry
      const endpoint = OVERPASS_ENDPOINTS[(currentEndpointIndex + attempt) % OVERPASS_ENDPOINTS.length];
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            console.warn(`Overpass API rate limited on ${endpoint}, waiting...`);
            await this.sleep(10000);
            continue;
          }
          if (response.status === 504 || response.status === 503) {
            console.warn(`Overpass API ${response.status} on ${endpoint}, trying next...`);
            currentEndpointIndex = (currentEndpointIndex + 1) % OVERPASS_ENDPOINTS.length;
            await this.sleep(3000);
            continue;
          }
          throw new Error(`Overpass API error: ${response.status}`);
        }

        const data = await response.json() as OverpassResponse;
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn(`Overpass API timeout on ${endpoint}, trying next...`);
          currentEndpointIndex = (currentEndpointIndex + 1) % OVERPASS_ENDPOINTS.length;
          continue;
        }
        console.error(`Overpass fetch error on ${endpoint}:`, error);
        if (attempt < retries - 1) {
          await this.sleep(5000);
          continue;
        }
      }
    }
    
    // Return empty result instead of throwing
    console.warn("All Overpass endpoints failed, returning empty result");
    return { elements: [] };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildOverpassQuery(placeType: string): string {
    const typeQuery = PLACE_TYPE_QUERIES[placeType];
    if (!typeQuery) return "";

    const { south, west, north, east } = BURKINA_BBOX;
    
    // Simplifier la requête marketplace pour éviter les timeouts et s'assurer de capturer les centres commerciaux et marchés
    if (placeType === "marketplace") {
      return `
        [out:json][timeout:180];
        (
          node["amenity"="marketplace"](${south},${west},${north},${east});
          way["amenity"="marketplace"](${south},${west},${north},${east});
          node["shop"="mall"](${south},${west},${north},${east});
          way["shop"="mall"](${south},${west},${north},${east});
          node["leisure"="market"](${south},${west},${north},${east});
          way["leisure"="market"](${south},${west},${north},${east});
        );
        out center;
      `;
    }

    return `
      [out:json][timeout:180][maxsize:536870912];
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
    let name = tags.name || tags["name:fr"] || tags.operator || tags.brand || tags.owner || tags.ref;
    
    if (!name) {
      if (placeType === "marketplace") {
        const village = tags["addr:village"] || tags["addr:city"];
        name = village ? `Marché de ${village}` : "Marché Central";
      } else {
        name = `${placeType} sans nom`;
      }
    }
    
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
      source: "OSM", // Données provenant d'OpenStreetMap
      confidenceScore: "0.6", // Score par défaut pour les données OSM
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
      
      // Batch processing for better performance
      for (const element of response.elements) {
        try {
          const placeData = this.parseOSMElement(element, placeType);
          if (!placeData) continue;

          // Enregistrer systématiquement en DB
          await db.insert(places).values(placeData).onConflictDoUpdate({
            target: [places.osmId, places.osmType],
            set: {
              name: placeData.name,
              latitude: placeData.latitude,
              longitude: placeData.longitude,
              address: placeData.address,
              telephone: placeData.telephone,
              horaires: placeData.horaires,
              tags: placeData.tags,
              lastSyncedAt: new Date(),
              updatedAt: new Date(),
            }
          });
          added++;
        } catch (err) {
          errors++;
          // Silent fail for individual elements
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
  } = {}): Promise<{ places: Place[]; lastUpdated: Date | null }> {
    // Check if we need to refresh (once per day or if empty)
    // IMPORTANT: On ne bloque JAMAIS l'appel utilisateur par une synchronisation
    if (options.placeType) {
      const pType = options.placeType;
      const now = new Date();
      const lastSyncKey = `last_sync_${pType}`;
      
      // On récupère la date de dernière sync de manière asynchrone
      storage.getMetadata(lastSyncKey).then(lastSyncStr => {
        const lastSyncDate = lastSyncStr ? new Date(lastSyncStr) : null;
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (!lastSyncDate || (now.getTime() - lastSyncDate.getTime() > oneDay)) {
          console.log(`[Overpass] Refreshing ${pType} in background (last sync: ${lastSyncDate})`);
          this.syncPlaceType(pType).then(() => {
            storage.setMetadata(lastSyncKey, now.toISOString());
          }).catch(err => console.error(`Error refreshing ${pType}:`, err));
        }
      }).catch(err => console.error("Error getting metadata:", err));
    }

    // 1. Lire exclusivement depuis la base de données
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

    let results = await query
      .limit(options.limit || 10000)
      .offset(options.offset || 0);

    // Trouver la date de mise à jour la plus récente dans les résultats
    let latestUpdate: Date | null = null;
    if (results.length > 0) {
      latestUpdate = results.reduce((latest, current) => {
        const currentSync = current.lastSyncedAt;
        if (!latest || (currentSync && currentSync > latest)) return currentSync;
        return latest;
      }, null as Date | null);
    }

    // Fallback: Si la DB est vide pour ce type, on tente une sync bloquante
    // Sauf pour bus_station qui sera géré différemment si besoin
    if (results.length === 0 && options.placeType) {
      console.log(`[Overpass] DB empty for ${options.placeType}, forced sync...`);
      try {
        await this.syncPlaceType(options.placeType);
        
        // Update metadata after successful sync
        const now = new Date();
        const lastSyncKey = `last_sync_${options.placeType}`;
        await storage.setMetadata(lastSyncKey, now.toISOString());
        
        // Re-query after sync
        results = await db.select().from(places)
          .where(eq(places.placeType, options.placeType))
          .limit(options.limit || 10000)
          .offset(options.offset || 0);
          
        if (results.length > 0) {
          latestUpdate = results.reduce((latest, current) => {
            const currentSync = current.lastSyncedAt;
            if (!latest || (currentSync && currentSync > latest)) return currentSync;
            return latest;
          }, null as Date | null);
        }
      } catch (err) {
        console.error(`[Overpass] Forced sync failed for ${options.placeType}:`, err);
      }
    }

    return { places: results, lastUpdated: latestUpdate };
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

  // Enhanced fuel station sync with multiple tags and region-based querying
  async syncFuelStationsExtended(): Promise<{ total: number; added: number; updated: number; errors: number }> {
    console.log("⛽ Starting extended fuel station sync...");
    
    let totalAdded = 0, totalUpdated = 0, totalErrors = 0;
    const processedOsmIds = new Set<string>();

    // Extended fuel queries - multiple tag variations
    const fuelQueries = [
      `["amenity"="fuel"]`,
      `["shop"="gas"]`,
      `["shop"="fuel"]`,
      `["amenity"="fuel_station"]`,
      `["landuse"="fuel_station"]`,
      // Brand-specific queries to catch stations with brand but different main tags
      `["brand"~"Total|Shell|Oryx|Barka|Sonabhy|SOB|Vivo|Petrofa|Nafex|Star Oil|Libya Oil|Petrolyn"]`,
      `["operator"~"Total|Shell|Oryx|Sonabhy|Vivo|Barka"]`,
    ];

    // Sync by region to avoid Overpass limits and get better coverage
    for (const [regionName, regionData] of Object.entries(REGIONS_MAPPING)) {
      const { south, north, west, east } = regionData.bounds;
      console.log(`  📍 Syncing region: ${regionName}...`);

      for (const queryFilter of fuelQueries) {
        try {
          const query = `
            [out:json][timeout:180][maxsize:536870912];
            (
              node${queryFilter}(${south},${west},${north},${east});
              way${queryFilter}(${south},${west},${north},${east});
              relation${queryFilter}(${south},${west},${north},${east});
            );
            out center;
          `;

          const response = await this.fetchFromOverpass(query);
          
          for (const element of response.elements) {
            const osmKey = `${element.type}-${element.id}`;
            if (processedOsmIds.has(osmKey)) continue;
            processedOsmIds.add(osmKey);

            try {
              const placeData = this.parseOSMElement(element, "fuel");
              if (!placeData) continue;

              // Override region with the actual region we're querying
              placeData.region = regionName;
              placeData.ville = placeData.ville || this.guessCityExtended(
                parseFloat(placeData.latitude),
                parseFloat(placeData.longitude)
              );

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
                    region: placeData.region,
                    ville: placeData.ville,
                    tags: placeData.tags,
                    lastSyncedAt: new Date(),
                    updatedAt: new Date(),
                  })
                  .where(eq(places.id, existing[0].id));
                totalUpdated++;
              } else {
                await db.insert(places).values(placeData);
                totalAdded++;
              }
            } catch (err) {
              totalErrors++;
            }
          }

          await this.sleep(500); // Respect rate limits between queries
        } catch (error) {
          console.error(`  ❌ Error with query ${queryFilter} in ${regionName}:`, error);
          totalErrors++;
        }
      }
      
      await this.sleep(1000); // Pause between regions
    }

    // Also do a country-wide sync for any stations that might fall outside defined regions
    console.log("  🌍 Country-wide fuel station sweep...");
    for (const queryFilter of fuelQueries.slice(0, 3)) { // Main fuel queries only
      try {
        const { south, west, north, east } = BURKINA_BBOX;
        const query = `
          [out:json][timeout:300][maxsize:1073741824];
          (
            node${queryFilter}(${south},${west},${north},${east});
            way${queryFilter}(${south},${west},${north},${east});
            relation${queryFilter}(${south},${west},${north},${east});
          );
          out center;
        `;

        const response = await this.fetchFromOverpass(query);
        
        for (const element of response.elements) {
          const osmKey = `${element.type}-${element.id}`;
          if (processedOsmIds.has(osmKey)) continue;
          processedOsmIds.add(osmKey);

          try {
            const placeData = this.parseOSMElement(element, "fuel");
            if (!placeData) continue;

            placeData.ville = placeData.ville || this.guessCityExtended(
              parseFloat(placeData.latitude),
              parseFloat(placeData.longitude)
            );
            placeData.region = placeData.region || this.guessRegionFromCoords(
              parseFloat(placeData.latitude),
              parseFloat(placeData.longitude)
            );

            const existing = await db.select()
              .from(places)
              .where(and(
                eq(places.osmId, placeData.osmId),
                eq(places.osmType, placeData.osmType)
              ))
              .limit(1);

            if (existing.length === 0) {
              await db.insert(places).values(placeData);
              totalAdded++;
            }
          } catch (err) {
            totalErrors++;
          }
        }

        await this.sleep(2000);
      } catch (error) {
        console.error("Country-wide sweep error:", error);
      }
    }

    const total = processedOsmIds.size;
    console.log(`⛽ Extended fuel sync complete: ${total} unique stations processed, ${totalAdded} added, ${totalUpdated} updated, ${totalErrors} errors`);
    
    return { total, added: totalAdded, updated: totalUpdated, errors: totalErrors };
  }

  // Extended city guessing with coordinate-based matching
  private guessCityExtended(lat: number, lon: number): string | null {
    // First check the detailed city coordinates
    for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
      const distance = Math.sqrt(
        Math.pow(lat - coords.lat, 2) + Math.pow(lon - coords.lon, 2)
      );
      if (distance <= coords.radius) {
        return cityName;
      }
    }
    
    // Fallback to the original method
    return this.guessCity(lat, lon);
  }

  // Guess region from coordinates
  private guessRegionFromCoords(lat: number, lon: number): string | null {
    for (const [regionName, regionData] of Object.entries(REGIONS_MAPPING)) {
      const { south, north, west, east } = regionData.bounds;
      if (lat >= south && lat <= north && lon >= west && lon <= east) {
        return regionName;
      }
    }
    return null;
  }

  // Get fuel station count from OSM
  async getFuelStationCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(places)
      .where(eq(places.placeType, "fuel"));
    return result[0]?.count || 0;
  }
}

export const overpassService = OverpassService.getInstance();
