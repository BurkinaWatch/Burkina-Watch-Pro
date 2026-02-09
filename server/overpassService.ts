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
  hospital: `["amenity"~"hospital|clinic|doctors|dentist|nursing_home|health_post|dispensary|health_centre"]`,
  hospital_extra: `["healthcare"~"hospital|clinic|doctor|dentist|health_centre|dispensary|medical_centre|physiotherapist|nursing_home"]`,
  hospital_burkina: `["name"~"CSPS|CHUR|CHR|CMA|Centre de Santé|Hôpital|Clinique|Dispensaire"]`,
  hospital_operator: `["operator:type"~"public|religious|private"]`,
  hospital_social: `["amenity"="social_facility"]["social_facility"~"nursing_home|assisted_living"]`,
  
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
  shop: `["shop"~"supermarket|convenience|grocery|butcher|bakery|clothes|shoes|electronics|mobile_phone|computer|hardware|furniture|cosmetics|beauty|hairdresser"]`,
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
  bank: `["amenity"~"bank|microfinance"]`,
  atm: `["amenity"="atm"]`,
  bureau_de_change: `["amenity"="bureau_de_change"]`,
  money_transfer: `["amenity"="money_transfer"]`,
  caisses_populaires: `["amenity"~"bank|microfinance"]["name"~"Caisse Populaire|RCPB|Caisse"]`,
  
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
  research_institute: `["amenity"="research_institute"]`,
  
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
  "Bankui": { 
    cities: ["Dedougou", "Boromo", "Nouna", "Solenzo", "Toma", "Djibasso", "Safane", "Bondokuy", "Gassan", "Gossina"],
    bounds: { south: 11.8, north: 13.5, west: -4.5, east: -2.8 }
  },
  "Djoro": { 
    cities: ["Gaoua", "Diebougou", "Dano", "Batie", "Kampti", "Loropeni", "Nako", "Dissin", "Legmoin", "Boussera"],
    bounds: { south: 9.5, north: 11.5, west: -4.0, east: -2.5 }
  },
  "Goulmou": { 
    cities: ["Fada N'Gourma", "Pama", "Matiacoali", "Diapangou", "Tibga", "Yamba", "Kompienga", "Madjoari"],
    bounds: { south: 11.0, north: 12.8, west: -0.5, east: 1.0 }
  },
  "Guiriko": { 
    cities: ["Bobo-Dioulasso", "Hounde", "Lena", "Dande", "Padema", "Bama", "Karangasso-Vigue", "Peni", "Satiri", "Toussiana", "Orodara"],
    bounds: { south: 10.5, north: 12.0, west: -5.5, east: -3.5 }
  },
  "Kadiogo": { 
    cities: ["Ouagadougou", "Saaba", "Pabre", "Tanghin-Dassouri", "Komsilga", "Koubri", "Komki-Ipala"],
    bounds: { south: 12.2, north: 12.6, west: -1.8, east: -1.3 }
  },
  "Kuilse": { 
    cities: ["Kaya", "Kongoussi", "Bourzanga", "Barsalogho", "Pissila", "Dablo", "Boussouma", "Korsimoro", "Mane"],
    bounds: { south: 12.8, north: 14.0, west: -1.5, east: -0.3 }
  },
  "Liptako": { 
    cities: ["Dori", "Gorom-Gorom", "Sebba", "Seytenga", "Markoye", "Oursi", "Deou", "Tin-Akof", "Falagountou"],
    bounds: { south: 13.5, north: 15.1, west: -0.5, east: 1.0 }
  },
  "Nakambe": { 
    cities: ["Tenkodogo", "Koupela", "Garango", "Ouargaye", "Bittou", "Pouytenga", "Andemtenga", "Lalgaye", "Sangha"],
    bounds: { south: 11.0, north: 12.5, west: -0.8, east: 0.5 }
  },
  "Nando": { 
    cities: ["Koudougou", "Reo", "Sabou", "Tenado", "Nanoro", "Didyr", "Pouni", "Zawara", "Thyou", "Kokologho"],
    bounds: { south: 11.5, north: 12.8, west: -2.8, east: -1.8 }
  },
  "Nazinon": { 
    cities: ["Leo", "Manga", "Po", "Kombissiri", "Sapone", "Gogo", "Guiaro", "Tiebele", "Bieha", "Sapouy", "Cassou"],
    bounds: { south: 10.8, north: 12.0, west: -2.5, east: -1.5 }
  },
  "Oubri": { 
    cities: ["Ziniare", "Zorgho", "Bousse", "Mogtedo", "Meguet", "Absouya", "Laye", "Niou", "Zitenga", "Sourgoubila", "Loumbila"],
    bounds: { south: 12.2, north: 13.0, west: -1.5, east: -0.5 }
  },
  "Sirba": { 
    cities: ["Bogande", "Gayeri", "Manni", "Piela", "Bilanga", "Boulsa", "Tougouri", "Yalgo", "Foutouri", "Dargo"],
    bounds: { south: 12.5, north: 14.0, west: -0.3, east: 1.0 }
  },
  "Soum": { 
    cities: ["Djibo", "Aribinda", "Tongomayel", "Baraboule", "Kelbo", "Nassoumbou", "Pobe-Mengao"],
    bounds: { south: 13.5, north: 15.0, west: -1.5, east: -0.3 }
  },
  "Sourou": { 
    cities: ["Tougan", "Yako", "Gourcy", "Di", "Gomboro", "Kassoum", "Kiembara", "Lanfiera", "Arbolle", "Bokin"],
    bounds: { south: 12.8, north: 14.0, west: -3.5, east: -2.5 }
  },
  "Tannounyan": { 
    cities: ["Banfora", "Sindou", "Niangoloko", "Beregadougou", "Ouo", "Sideradougou", "Tiefora", "Mangodara", "Soubakaniédougou", "Douna"],
    bounds: { south: 9.4, north: 11.0, west: -5.5, east: -4.0 }
  },
  "Tapoa": { 
    cities: ["Diapaga", "Kantchari", "Logobou", "Namounou", "Partiaga", "Tambaga", "Tansarga", "Bottou"],
    bounds: { south: 11.5, north: 13.0, west: 0.8, east: 2.4 }
  },
  "Yaadga": { 
    cities: ["Ouahigouya", "Titao", "Gourcy", "Seguenenga", "Thiou", "Koumbri", "Oula", "Rambo", "Tangaye", "Zogore"],
    bounds: { south: 12.8, north: 14.5, west: -3.0, east: -1.8 }
  },
};

const CITY_COORDINATES: Record<string, { lat: number; lon: number; radius: number }> = {
  "Ouagadougou": { lat: 12.37, lon: -1.52, radius: 0.15 },
  "Ziniaré": { lat: 12.58, lon: -1.30, radius: 0.05 },
  "Saaba": { lat: 12.36, lon: -1.40, radius: 0.03 },
  "Bobo-Dioulasso": { lat: 11.17, lon: -4.30, radius: 0.12 },
  "Houndé": { lat: 11.50, lon: -3.52, radius: 0.05 },
  "Banfora": { lat: 10.63, lon: -4.77, radius: 0.06 },
  "Kaya": { lat: 13.08, lon: -1.08, radius: 0.05 },
  "Koudougou": { lat: 12.25, lon: -2.37, radius: 0.06 },
  "Tenkodogo": { lat: 11.78, lon: -0.37, radius: 0.04 },
  "Fada N'Gourma": { lat: 12.07, lon: 0.35, radius: 0.05 },
  "Ouahigouya": { lat: 13.58, lon: -2.43, radius: 0.06 },
  "Dori": { lat: 14.03, lon: -0.03, radius: 0.04 },
  "Gaoua": { lat: 10.33, lon: -3.18, radius: 0.04 },
  "Dédougou": { lat: 12.47, lon: -3.47, radius: 0.05 },
};

export class OverpassService {
  private static instance: OverpassService;
  private lastSync: Date | null = null;
  private cache: Map<string, { data: OverpassResponse; timestamp: number }> = new Map();
  private cacheTTL = 24 * 60 * 60 * 1000;

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
      const endpoint = OVERPASS_ENDPOINTS[(currentEndpointIndex + attempt) % OVERPASS_ENDPOINTS.length];
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429) {
            await this.sleep(10000);
            continue;
          }
          currentEndpointIndex = (currentEndpointIndex + 1) % OVERPASS_ENDPOINTS.length;
          await this.sleep(3000);
          continue;
        }

        const data = await response.json() as OverpassResponse;
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } catch (error: any) {
        currentEndpointIndex = (currentEndpointIndex + 1) % OVERPASS_ENDPOINTS.length;
        if (attempt < retries - 1) {
          await this.sleep(5000);
          continue;
        }
      }
    }
    
    return { elements: [] };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private buildOverpassQuery(placeType: string): string {
    const typeQuery = PLACE_TYPE_QUERIES[placeType];
    if (!typeQuery) return "";

    const { south, west, north, east } = BURKINA_BBOX;
    
    if (placeType === "hospital") {
      return `
        [out:json][timeout:180][maxsize:1073741824];
        (
          node["amenity"~"hospital|clinic|doctors|dentist|health_post|dispensary|health_centre"](${south},${west},${north},${east});
          way["amenity"~"hospital|clinic|doctors|dentist|health_post|dispensary|health_centre"](${south},${west},${north},${east});
          relation["amenity"~"hospital|clinic|doctors|dentist|health_post|dispensary|health_centre"](${south},${west},${north},${east});
          node["healthcare"~"hospital|clinic|doctor|dentist|health_centre|dispensary|medical_centre"](${south},${west},${north},${east});
          way["healthcare"~"hospital|clinic|doctor|dentist|health_centre|dispensary|medical_centre"](${south},${west},${north},${east});
          node["name"~"CSPS|CHUR|CHR|CMA|Centre de Santé|Hôpital|Clinique|Dispensaire"](${south},${west},${north},${east});
          way["name"~"CSPS|CHUR|CHR|CMA|Centre de Santé|Hôpital|Clinique|Dispensaire"](${south},${west},${north},${east});
        );
        out center;
      `;
    }

    if (placeType === "restaurant" || placeType === "fast_food" || placeType === "cafe") {
      return `
        [out:json][timeout:180];
        (
          node["amenity"~"restaurant|fast_food|cafe|bar|pub|ice_cream|food_court"](${south},${west},${north},${east});
          way["amenity"~"restaurant|fast_food|cafe|bar|pub|ice_cream|food_court"](${south},${west},${north},${east});
          relation["amenity"~"restaurant|fast_food|cafe|bar|pub|ice_cream|food_court"](${south},${west},${north},${east});
        );
        out center;
      `;
    }

    if (placeType === "fuel") {
      return `
        [out:json][timeout:300][maxsize:1073741824];
        (
          node["amenity"="fuel"](${south},${west},${north},${east});
          way["amenity"="fuel"](${south},${west},${north},${east});
          relation["amenity"="fuel"](${south},${west},${north},${east});
          node["shop"="gas"](${south},${west},${north},${east});
          way["shop"="gas"](${south},${west},${north},${east});
          node["amenity"="fuel_station"](${south},${west},${north},${east});
          way["amenity"="fuel_station"](${south},${west},${north},${east});
          node["fuel:diesel"="yes"](${south},${west},${north},${east});
          way["fuel:diesel"="yes"](${south},${west},${north},${east});
          node["fuel:octane_95"="yes"](${south},${west},${north},${east});
          way["fuel:octane_95"="yes"](${south},${west},${north},${east});
          node["brand"~"Total|TotalEnergies|Shell|Oryx|Sonabhy|Barka|Petrovit|Oilibya|Libya Oil|OLA|Ola|SIBE|VIVO|Vivo|Star Oil|Tamoil"](${south},${west},${north},${east});
          way["brand"~"Total|TotalEnergies|Shell|Oryx|Sonabhy|Barka|Petrovit|Oilibya|Libya Oil|OLA|Ola|SIBE|VIVO|Vivo|Star Oil|Tamoil"](${south},${west},${north},${east});
          node["operator"~"Total|TotalEnergies|Shell|Oryx|Sonabhy|Barka|Petrovit|Oilibya|Libya Oil|OLA|Ola|SIBE|VIVO|Vivo"](${south},${west},${north},${east});
          way["operator"~"Total|TotalEnergies|Shell|Oryx|Sonabhy|Barka|Petrovit|Oilibya|Libya Oil|OLA|Ola|SIBE|VIVO|Vivo"](${south},${west},${north},${east});
          node["name"~"Station.service|Carburant|Essence|Gasoil|Pompe|Petrol|station-service|station essence"](${south},${west},${north},${east});
          way["name"~"Station.service|Carburant|Essence|Gasoil|Pompe|Petrol|station-service|station essence"](${south},${west},${north},${east});
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

    const ville = tags["addr:city"] || this.guessCity(lat, lon) || "Ville non spécifiée";
    const region = tags["addr:region"] || tags["is_in:region"] || this.guessRegion(ville) || "Région non spécifiée";

    const enrichedTags = {
      ...tags,
      cuisine: tags["cuisine"] || tags["diet:type"],
      menu: tags["menu"] || tags["menu:url"] || tags["dishes"],
      contact: tags["contact:phone"] || tags["phone"] || tags["contact:mobile"],
      opening_hours: tags["opening_hours"],
      website: tags["contact:website"] || tags["website"],
    };

    return {
      osmId: element.id.toString(),
      osmType: element.type,
      placeType,
      name,
      latitude: lat.toString(),
      longitude: lon.toString(),
      address,
      ville,
      region,
      telephone: enrichedTags.contact || null,
      website: enrichedTags.website || null,
      horaires: enrichedTags.opening_hours || null,
      tags: enrichedTags,
      source: "OSM",
      confidenceScore: "0.5",
    };
  }

  private guessCity(lat: number, lon: number): string | null {
    for (const [cityName, coords] of Object.entries(CITY_COORDINATES)) {
      const distance = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lon - coords.lon, 2));
      if (distance <= coords.radius) return cityName;
    }
    return null;
  }

  private guessRegion(ville: string): string | null {
    for (const [regionName, regionData] of Object.entries(REGIONS_MAPPING)) {
      if (regionData.cities.includes(ville)) return regionName;
    }
    return null;
  }

  async syncPlaceType(placeType: string): Promise<{ added: number; updated: number; errors: number }> {
    const query = this.buildOverpassQuery(placeType);
    const response = await this.fetchFromOverpass(query);
    let added = 0, updated = 0, errors = 0;

    for (const element of response.elements) {
      try {
        const placeData = this.parseOSMElement(element, placeType);
        if (!placeData) continue;

        const existing = await db.select().from(places).where(and(eq(places.osmId, placeData.osmId), eq(places.osmType, placeData.osmType))).limit(1);

        if (existing.length > 0) {
          await db.update(places).set({ ...placeData, lastSyncedAt: new Date(), updatedAt: new Date() }).where(eq(places.id, existing[0].id));
          updated++;
        } else {
          await db.insert(places).values(placeData);
          added++;
        }
      } catch (err) {
        errors++;
      }
    }
    return { added, updated, errors };
  }

  async syncAllPlaces(): Promise<void> {
    const types = Object.keys(PLACE_TYPE_QUERIES);
    for (const type of types) {
      await this.syncPlaceType(type);
      await this.sleep(2000);
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
    let q = db.select().from(places);
    const conditions = [];

    if (options.placeType) conditions.push(eq(places.placeType, options.placeType));
    if (options.region) conditions.push(eq(places.region, options.region));
    if (options.ville) conditions.push(eq(places.ville, options.ville));
    if (options.verificationStatus) conditions.push(eq(places.verificationStatus, options.verificationStatus));
    if (options.search) {
      conditions.push(or(
        ilike(places.name, `%${options.search}%`),
        ilike(places.ville, `%${options.search}%`),
        ilike(places.address, `%${options.search}%`)
      ));
    }

    if (conditions.length > 0) q = q.where(and(...conditions)) as typeof q;
    const results = await q.limit(options.limit || 10000).offset(options.offset || 0);

    return { 
      places: results, 
      lastUpdated: results.length > 0 ? results[0].lastSyncedAt : null 
    };
  }

  private async ensurePlaceExists(placeId: string): Promise<boolean> {
    const existing = await db.select({ id: places.id }).from(places).where(eq(places.id, placeId)).limit(1);
    return existing.length > 0;
  }

  async confirmPlace(placeId: string, userId: string | null, ipAddress: string): Promise<boolean> {
    const placeExists = await this.ensurePlaceExists(placeId);
    if (!placeExists) {
      throw new Error("PLACE_NOT_FOUND");
    }

    const existing = await db.select().from(placeVerifications).where(
      and(
        eq(placeVerifications.placeId, placeId),
        userId
          ? eq(placeVerifications.userId, userId)
          : eq(placeVerifications.ipAddress, ipAddress),
        eq(placeVerifications.action, "confirm")
      )
    ).limit(1);

    if (existing.length > 0) return false;

    await db.insert(placeVerifications).values({
      placeId,
      userId,
      action: "confirm",
      ipAddress,
    });

    await db.update(places)
      .set({ confirmations: sql`${places.confirmations} + 1` })
      .where(eq(places.id, placeId));

    return true;
  }

  async reportPlace(placeId: string, userId: string | null, comment: string | undefined, ipAddress: string): Promise<boolean> {
    const placeExists = await this.ensurePlaceExists(placeId);
    if (!placeExists) {
      throw new Error("PLACE_NOT_FOUND");
    }

    const existing = await db.select().from(placeVerifications).where(
      and(
        eq(placeVerifications.placeId, placeId),
        userId
          ? eq(placeVerifications.userId, userId)
          : eq(placeVerifications.ipAddress, ipAddress),
        eq(placeVerifications.action, "report")
      )
    ).limit(1);

    if (existing.length > 0) return false;

    await db.insert(placeVerifications).values({
      placeId,
      userId,
      action: "report",
      comment: comment || null,
      ipAddress,
    });

    await db.update(places)
      .set({ reports: sql`${places.reports} + 1` })
      .where(eq(places.id, placeId));

    return true;
  }

  async getUserVerifications(placeId: string, userId: string | null): Promise<{ confirmed: boolean; reported: boolean }> {
    if (!userId) return { confirmed: false, reported: false };

    const results = await db.select({ action: placeVerifications.action })
      .from(placeVerifications)
      .where(
        and(
          eq(placeVerifications.placeId, placeId),
          eq(placeVerifications.userId, userId)
        )
      );

    return {
      confirmed: results.some(r => r.action === "confirm"),
      reported: results.some(r => r.action === "report"),
    };
  }
}

export const overpassService = OverpassService.getInstance();
