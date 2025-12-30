import type { Gare } from "./transportData";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    "name:fr"?: string;
    amenity?: string;
    public_transport?: string;
    bus?: string;
    operator?: string;
    network?: string;
    "addr:street"?: string;
    "addr:city"?: string;
    "addr:housenumber"?: string;
    phone?: string;
    website?: string;
    opening_hours?: string;
    wheelchair?: string;
    shelter?: string;
    bench?: string;
    covered?: string;
    lit?: string;
  };
}

interface OverpassResponse {
  elements: OSMElement[];
}

function determineRegion(lat: number, lng: number): string {
  if (lat >= 13.8) return "Sahel";
  if (lat >= 13.3 && lng <= -2.0) return "Nord";
  if (lat >= 12.8 && lng >= -1.5 && lng <= -0.5) return "Centre-Nord";
  if (lat >= 12.0 && lat < 12.8 && lng >= -0.8) return "Centre-Est";
  if (lat >= 11.5 && lat < 12.0 && lng >= -0.8) return "Centre-Est";
  if (lat >= 12.0 && lat < 13.0 && lng >= -2.8 && lng <= -1.8) return "Centre-Ouest";
  if (lat >= 12.2 && lat < 13.5 && lng >= -1.8 && lng <= -1.0) return "Plateau-Central";
  if (lat >= 11.5 && lat < 12.2 && lng >= -1.5 && lng <= -0.8) return "Centre-Sud";
  if (lat >= 11.0 && lat < 12.0 && lng >= -4.5 && lng <= -3.0) return "Hauts-Bassins";
  if (lat >= 12.0 && lng >= -4.5 && lng <= -3.0) return "Boucle du Mouhoun";
  if (lat < 11.0 && lng >= -5.5 && lng <= -4.0) return "Cascades";
  if (lat < 11.5 && lng >= -3.5 && lng <= -2.5) return "Sud-Ouest";
  if (lat >= 11.5 && lat < 12.5 && lng >= 0 && lng <= 2.0) return "Est";
  return "Centre";
}

function determineVille(element: OSMElement): string {
  if (element.tags?.["addr:city"]) {
    return element.tags["addr:city"];
  }
  
  const lat = element.lat || element.center?.lat || 0;
  const lng = element.lon || element.center?.lon || 0;
  
  if (lat >= 12.3 && lat <= 12.5 && lng >= -1.6 && lng <= -1.4) return "Ouagadougou";
  if (lat >= 11.1 && lat <= 11.3 && lng >= -4.4 && lng <= -4.2) return "Bobo-Dioulasso";
  if (lat >= 10.5 && lat <= 10.7 && lng >= -4.8 && lng <= -4.7) return "Banfora";
  if (lat >= 13.5 && lat <= 13.7 && lng >= -2.5 && lng <= -2.3) return "Ouahigouya";
  if (lat >= 12.2 && lat <= 12.3 && lng >= -2.4 && lng <= -2.3) return "Koudougou";
  if (lat >= 12.0 && lat <= 12.1 && lng >= 0.3 && lng <= 0.4) return "Fada N'Gourma";
  if (lat >= 13.0 && lat <= 13.2 && lng >= -1.2 && lng <= -1.0) return "Kaya";
  if (lat >= 12.4 && lat <= 12.5 && lng >= -3.5 && lng <= -3.4) return "Dedougou";
  if (lat >= 14.0 && lat <= 14.1 && lng >= -0.1 && lng <= 0.1) return "Dori";
  if (lat >= 11.7 && lat <= 11.9 && lng >= -0.4 && lng <= -0.3) return "Tenkodogo";
  if (lat >= 11.6 && lat <= 11.8 && lng >= -1.2 && lng <= -1.0) return "Manga";
  if (lat >= 10.3 && lat <= 10.4 && lng >= -3.3 && lng <= -3.1) return "Gaoua";
  if (lat >= 12.5 && lat <= 12.7 && lng >= -1.4 && lng <= -1.2) return "Ziniare";
  
  return "Localite";
}

function buildAddress(element: OSMElement): string {
  const parts: string[] = [];
  
  if (element.tags?.["addr:housenumber"]) {
    parts.push(element.tags["addr:housenumber"]);
  }
  if (element.tags?.["addr:street"]) {
    parts.push(element.tags["addr:street"]);
  }
  if (element.tags?.["addr:city"]) {
    parts.push(element.tags["addr:city"]);
  }
  
  if (parts.length === 0) {
    const ville = determineVille(element);
    return `${ville}, Burkina Faso`;
  }
  
  return parts.join(", ");
}

function convertOSMToGare(element: OSMElement, index: number): Gare | null {
  const lat = element.lat || element.center?.lat;
  const lng = element.lon || element.center?.lon;
  
  if (!lat || !lng) return null;
  
  const name = element.tags?.name || element.tags?.["name:fr"];
  if (!name) return null;
  
  const ville = determineVille(element);
  const region = determineRegion(lat, lng);
  
  return {
    id: `osm-bus-${element.id}`,
    nom: name,
    ville: ville,
    region: region,
    adresse: buildAddress(element),
    coordonnees: { lat, lng },
    telephone: element.tags?.phone,
    compagnie: element.tags?.operator || "Publique",
    type: element.tags?.public_transport === "station" ? "principale" : "secondaire"
  };
}

export async function fetchGaresFromOSM(): Promise<Gare[]> {
  const query = `
    [out:json][timeout:60];
    area["ISO3166-1"="BF"][admin_level=2]->.burkina;
    (
      node["amenity"="bus_station"](area.burkina);
      way["amenity"="bus_station"](area.burkina);
      relation["amenity"="bus_station"](area.burkina);
      node["public_transport"="station"]["bus"="yes"](area.burkina);
      way["public_transport"="station"]["bus"="yes"](area.burkina);
      node["highway"="bus_stop"]["name"](area.burkina);
      way["highway"="bus_stop"]["name"](area.burkina);
    );
    out center;
  `;

  try {
    const response = await fetch(OVERPASS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.error(`OSM API error: ${response.status}`);
      return [];
    }

    const data: OverpassResponse = await response.json();
    
    const gares = data.elements
      .map((element, index) => convertOSMToGare(element, index))
      .filter((gare): gare is Gare => gare !== null);

    console.log(`Fetched ${gares.length} bus stations from OSM`);
    return gares;
  } catch (error) {
    console.error("Error fetching bus stations from OSM:", error);
    return [];
  }
}

let cachedOSMGares: Gare[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 3600000;

export async function getGaresWithOSM(hardcodedGares: Gare[]): Promise<Gare[]> {
  const now = Date.now();
  
  if (cachedOSMGares.length === 0 || now - lastFetchTime > CACHE_DURATION) {
    cachedOSMGares = await fetchGaresFromOSM();
    lastFetchTime = now;
  }
  
  const hardcodedIds = new Set(hardcodedGares.map(g => g.nom.toLowerCase()));
  const uniqueOSMGares = cachedOSMGares.filter(
    osmGare => !hardcodedIds.has(osmGare.nom.toLowerCase())
  );
  
  return [...hardcodedGares, ...uniqueOSMGares];
}
