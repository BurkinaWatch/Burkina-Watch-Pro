import crypto from "node:crypto";
// ============================================
// IMPORTS
// ============================================
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import { 
  places,
  insertSignalementSchema, 
  updateSignalementSchema, 
  insertCommentaireSchema, 
  updateUserProfileSchema, 
  insertLocationPointSchema, 
  insertEmergencyContactSchema, 
  insertChatMessageSchema 
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { OverpassService } from "./overpassService";
import { reverseGeocode } from "./geocoding";
import { sendLocationEmail, sendEmergencyTrackingStartEmail } from "./emailService";
import { verifySignalement } from "./aiVerification";
import { moderateContent, logModerationAction } from "./contentModeration";
import { signalementMutationLimiter } from "./securityHardening";
import { generateChatResponse, isAIAvailable } from "./aiService";
import { fetchBulletins, clearCache } from "./rssService";
import { getOfficialNews } from "./newsService";
import { CINEMAS_INFO, RECENT_FILMS } from "./cineData";
import { fetchEvents, clearEventsCache } from "./eventsService";
import { overpassService } from "./overpassService";
import { dataMigrationService } from "./dataMigrationService";
import { BOUTIQUES_DATA } from "./boutiquesData";
import { PHARMACIES_DATA } from "./pharmaciesData";
import type { Place } from "@shared/schema";

// Create a Map for quick pharmacy lookups by name
const pharmaciesDataMap = new Map<string, typeof PHARMACIES_DATA[0]>();
PHARMACIES_DATA.forEach(p => {
  const normalizedName = p.nom.toLowerCase().replace(/pharmacie\s*/i, "").trim();
  pharmaciesDataMap.set(normalizedName, p);
  pharmaciesDataMap.set(p.nom.toLowerCase(), p);
});

// Helper function to get merged pharmacy data (local + OSM)
function getMergedPharmacies(): any[] {
  // Use PHARMACIES_DATA as the primary source (has accurate guard status)
  const localPharmacies = PHARMACIES_DATA.map(p => {
    let typeGarde: "jour" | "nuit" | "24h" = "jour";
    if (p.is24h) {
      typeGarde = "24h";
    } else if (p.gardeNuit) {
      typeGarde = "nuit";
    }
    
    return {
      id: `local-pharm-${p.id}`,
      nom: p.nom,
      name: p.nom,
      adresse: p.adresse,
      quartier: p.quartier,
      ville: p.ville,
      city: p.ville,
      region: p.region,
      latitude: p.latitude,
      lat: p.latitude,
      longitude: p.longitude,
      lon: p.longitude,
      telephone: p.telephone,
      phone: p.telephone,
      horaires: p.horaires,
      typeGarde,
      is24h: p.is24h,
      gardeNuit: p.gardeNuit,
      services: p.services,
      specialites: p.specialites,
      tags: { 
        is_on_duty: p.is24h || p.gardeNuit,
        opening_hours: p.horaires 
      },
      source: "LOCAL"
    };
  });
  
  return localPharmacies;
}

// ============================================
// HELPERS POUR TRANSFORMER LES DONNÉES OSM
// ============================================

function transformOsmToRestaurant(place: Place, index?: number) {
  const tags = place.tags as Record<string, string> || {};
  const name = place.name || tags.name || tags["name:fr"] || tags["name:en"] || tags.operator || tags.brand || tags.owner || tags.ref || "Restaurant";
  return {
    id: `osm-rest-${place.id}`,
    name: name,
    nom: name,
    type: mapOsmCuisineToType(tags.cuisine || tags.amenity || "restaurant") as any,
    adresse: place.address || "Burkina Faso",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || tags.contact || tags.phone || undefined,
    email: place.email || tags.email || undefined,
    siteWeb: place.website || tags.website || undefined,
    horaires: place.horaires || tags.opening_hours || "Horaires à vérifier",
    gammePrix: "Moyen" as const,
    services: tags.services ? tags.services.split(";").map((s: string) => s.trim()) : [],
    specialites: tags.cuisine ? tags.cuisine.split(";").map((c: string) => c.trim()) : [],
    wifi: tags.internet_access === "wlan" || tags.internet_access === "yes",
    climatisation: false,
    parking: tags.parking === "yes",
    terrasse: tags.outdoor_seating === "yes",
    livraison: tags.delivery === "yes",
    source: "OSM" as const,
    plats: tags.menu || tags.dishes || undefined
  };
}

function mapOsmCuisineToType(cuisine: string): string {
  const cuisineMap: Record<string, string> = {
    "african": "Africain",
    "burkinabe": "Burkinabè",
    "french": "Français",
    "lebanese": "Libanais",
    "asian": "Asiatique",
    "chinese": "Asiatique",
    "vietnamese": "Asiatique",
    "japanese": "Asiatique",
    "fast_food": "Fast-food",
    "pizza": "Pizzeria",
    "grill": "Grillades",
    "cafe": "Café",
    "coffee": "Café",
    "pastry": "Pâtisserie",
    "international": "International",
    "italian": "Italien",
    "restaurant": "Africain",
    "bar": "Maquis"
  };
  return cuisineMap[cuisine.toLowerCase()] || "Africain";
}

function transformOsmToPharmacy(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  const name = place.name || tags.name || tags["name:fr"] || tags["name:en"] || tags.operator || "Pharmacie";
  
  // Try to match with local pharmacy data for guard status
  const normalizedName = name.toLowerCase().replace(/pharmacie\s*/i, "").trim();
  const localData = pharmaciesDataMap.get(normalizedName) || pharmaciesDataMap.get(name.toLowerCase());
  
  // Determine type of guard from local data or OSM tags
  let typeGarde: "jour" | "nuit" | "24h" = "jour";
  let isOnDuty = false;
  
  if (localData) {
    // Use local data for guard status (most accurate)
    if (localData.is24h) {
      typeGarde = "24h";
      isOnDuty = true;
    } else if (localData.gardeNuit) {
      typeGarde = "nuit";
      isOnDuty = true;
    }
  } else {
    // Fallback to OSM tags
    const osmIsOnDuty = tags.is_on_duty || tags.opening_hours === "24/7" || tags.emergency === "yes" || tags["healthcare:speciality:emergency"] === "yes";
    if (osmIsOnDuty || tags.opening_hours?.includes("24")) {
      typeGarde = "24h";
      isOnDuty = true;
    }
  }
  
  return {
    id: `osm-pharm-${place.id}`,
    nom: name,
    adresse: place.address || localData?.adresse || "Burkina Faso",
    quartier: place.quartier || localData?.quartier || "Quartier non spécifié",
    ville: place.ville || localData?.ville || "Ville non spécifiée",
    region: place.region || localData?.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || localData?.telephone || undefined,
    horaires: place.horaires || localData?.horaires || tags.opening_hours || "Horaires à vérifier",
    typeGarde,
    services: localData?.services || [
      tags.dispensing === "yes" ? "Délivrance d'ordonnances" : null,
      tags.wheelchair === "yes" ? "Accès handicapé" : null,
      tags.operator ? `Opérateur: ${tags.operator}` : null
    ].filter(Boolean),
    tags: { ...tags, is_on_duty: isOnDuty },
    source: "OSM" as const
  };
}

function transformOsmToBoutique(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  const shopType = tags.shop || place.placeType;
  const name = place.name || tags.name || tags["name:fr"] || tags["name:en"] || tags.operator || "Boutique";
  return {
    id: `osm-bout-${place.id}`,
    nom: name,
    categorie: mapOsmShopToCategory(shopType),
    adresse: place.address || "Burkina Faso",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    horaires: place.horaires || "Horaires à vérifier",
    produits: [],
    services: [],
    source: "OSM" as const,
    placeId: place.id,
    confirmations: place.confirmations || 0,
    reports: place.reports || 0,
  };
}

function mapOsmShopToCategory(shop: string): string {
  const shopMap: Record<string, string> = {
    "supermarket": "Supermarché",
    "convenience": "Alimentation",
    "grocery": "Alimentation",
    "butcher": "Alimentation",
    "bakery": "Alimentation",
    "electronics": "Électronique",
    "mobile_phone": "Téléphonie",
    "clothes": "Mode",
    "shoes": "Mode",
    "hardware": "Quincaillerie",
    "cosmetics": "Cosmétiques",
    "furniture": "Ameublement",
    "books": "Librairie",
    "sports": "Sport",
    "jewelry": "Bijouterie",
    "hairdresser": "Cosmétiques",
    "beauty": "Cosmétiques"
  };
  return shopMap[shop.toLowerCase()] || "Divers";
}

function transformOsmToMarche(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  const name = place.name || tags.name || tags["name:fr"] || tags["name:en"] || "Marché";
  
  // Extraire les jours d'ouverture à partir d'opening_hours si disponible
  let joursOuverture = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  if (tags.opening_hours) {
    if (tags.opening_hours.toLowerCase().includes("daily") || tags.opening_hours.includes("24/7")) {
      joursOuverture = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    }
  }

  // Extraire les produits courants à partir des tags shop, product, etc.
  const produits = [];
  if (tags.shop === "supermarket") produits.push("Alimentation générale");
  if (tags.craft) produits.push("Artisanat");
  if (tags.amenity === "marketplace") produits.push("Fruits et légumes", "Viande", "Produits locaux");
  
  return {
    id: `osm-march-${place.id}`,
    nom: place.name,
    type: tags.marketplace === "periodic" ? "Hebdomadaire" : "Quartier",
    adresse: place.address || "Burkina Faso",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    horaires: place.horaires || (tags.opening_hours || "07:00 - 18:00"),
    joursOuverture: joursOuverture,
    produits: produits.length > 0 ? produits : ["Produits divers"],
    nombreCommercants: parseInt(tags.capacity || "0") || undefined,
    superficie: tags.area ? `${tags.area} m²` : undefined,
    source: "OSM" as const,
    placeId: place.id,
    confirmations: place.confirmations || 0,
    reports: place.reports || 0,
  };
}

function transformOsmToBanque(place: Place) {
  const tags = place.tags as Record<string, any> || {};
  const rawName = place.name || tags.name || tags["name:fr"] || tags["name:en"] || tags.operator || tags.brand || "";
  const operator = tags.operator || tags.brand || "";

  const knownBanks: Record<string, { nom: string; sigle: string }> = {
    "coris": { nom: "Coris Bank International", sigle: "CBI" },
    "ecobank": { nom: "Ecobank Burkina", sigle: "EBF" },
    "boa": { nom: "Bank of Africa", sigle: "BOA-BF" },
    "bank of africa": { nom: "Bank of Africa", sigle: "BOA-BF" },
    "bicia": { nom: "BICIA-B (Groupe BNP Paribas)", sigle: "BICIA-B" },
    "bnp": { nom: "BICIA-B (Groupe BNP Paribas)", sigle: "BICIA-B" },
    "sgbf": { nom: "Société Générale Burkina Faso", sigle: "SGBF" },
    "societe generale": { nom: "Société Générale Burkina Faso", sigle: "SGBF" },
    "société générale": { nom: "Société Générale Burkina Faso", sigle: "SGBF" },
    "uba": { nom: "United Bank for Africa", sigle: "UBA-BF" },
    "united bank": { nom: "United Bank for Africa", sigle: "UBA-BF" },
    "bcb": { nom: "Banque Commerciale du Burkina", sigle: "BCB" },
    "bsic": { nom: "Banque Sahélo-Saharienne pour l'Investissement et le Commerce", sigle: "BSIC-BF" },
    "wendkuni": { nom: "Banque Wendkuni", sigle: "WENDKUNI" },
    "cbao": { nom: "Compagnie Bancaire de l'Afrique de l'Ouest", sigle: "CBAO" },
    "orabank": { nom: "Orabank Burkina Faso", sigle: "ORABANK" },
    "bab": { nom: "Banque Agricole du Burkina", sigle: "BAB" },
    "banque agricole": { nom: "Banque Agricole du Burkina", sigle: "BAB" },
    "bhbf": { nom: "Banque de l'Habitat du Burkina Faso", sigle: "BHBF" },
    "habitat": { nom: "Banque de l'Habitat du Burkina Faso", sigle: "BHBF" },
    "sonapost": { nom: "SONAPOST - Services Financiers Postaux", sigle: "SONAPOST" },
    "rcpb": { nom: "Réseau des Caisses Populaires du Burkina", sigle: "RCPB" },
    "caisses populaires": { nom: "Réseau des Caisses Populaires du Burkina", sigle: "RCPB" },
    "caisse populaire": { nom: "Caisse Populaire du Burkina", sigle: "CP" },
    "premiere caisse": { nom: "Première Caisse d'Épargne", sigle: "PCE" },
    "pamf": { nom: "Première Agence de Microfinance", sigle: "PAMF" },
    "western union": { nom: "Western Union", sigle: "WU" },
    "moneygram": { nom: "MoneyGram", sigle: "MG" },
    "orange money": { nom: "Orange Money", sigle: "OM" },
    "moov money": { nom: "Moov Money", sigle: "MM" },
    "ria": { nom: "Ria Money Transfer", sigle: "RIA" },
  };

  const searchStr = (rawName + " " + operator).toLowerCase();
  let matchedBank: { nom: string; sigle: string } | null = null;
  for (const [key, value] of Object.entries(knownBanks)) {
    if (searchStr.includes(key)) {
      matchedBank = value;
      break;
    }
  }

  const isAtm = place.placeType === "atm";
  const nom = matchedBank?.nom || rawName || (isAtm ? "GAB" : "Banque");
  const sigle = matchedBank?.sigle || (rawName ? rawName.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 5) : (isAtm ? "GAB" : "BQ"));

  const displayNom = matchedBank ? matchedBank.nom : (rawName || (isAtm ? "Guichet Automatique" : "Etablissement bancaire"));

  return {
    id: `osm-bank-${place.id}`,
    nom: displayNom,
    sigle: sigle,
    type: isAtm ? "GAB" : (searchStr.includes("caisse") || searchStr.includes("rcpb") ? "Caisse Populaire" : (searchStr.includes("microfinance") || searchStr.includes("pamf") ? "Microfinance" : "Banque")),
    categorie: "Commerciale",
    adresse: place.address || tags["addr:street"] || tags["addr:full"] || place.quartier || place.ville || "Adresse non precisee",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    horaires: place.horaires || "8h-16h",
    services: [],
    nombreGAB: isAtm ? 1 : (tags.hasGAB ? 1 : 0),
    hasGAB: isAtm || tags.hasGAB || false,
    importanceSystemique: tags.importanceSystemique || false,
    source: "OSM" as const,
    placeId: place.id,
    confirmations: place.confirmations || 0,
    reports: place.reports || 0,
  };
}

function transformOsmToStation(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  const brand = tags.brand || tags.operator || tags.name || "Station";
  const name = place.name || tags.name || tags["name:fr"] || tags["name:en"] || brand;
  return {
    id: `osm-fuel-${place.id}`,
    nom: name,
    marque: mapOsmBrandToMarque(brand),
    adresse: place.address || "Burkina Faso",
    quartier: place.quartier || "Quartier non spécifié",
    ville: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || undefined,
    horaires: place.horaires || "6h-22h",
    is24h: tags.opening_hours?.includes("24") || false,
    services: [],
    carburants: ["Essence", "Gasoil"],
    source: "OSM" as const,
    placeId: place.id,
    confirmations: place.confirmations || 0,
    reports: place.reports || 0,
  };
}

function transformOsmToHopital(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  return {
    id: `osm-hosp-${place.id}`,
    placeId: place.id,
    name: place.name,
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    address: place.address || "Burkina Faso",
    city: place.ville || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    phone: place.telephone || undefined,
    opening_hours: place.horaires || "24h/24",
    type: tags.healthcare || tags.amenity || "hospital",
    operator_type: tags.operator || tags["operator:type"] || (place.name?.toLowerCase().includes("csps") || place.name?.toLowerCase().includes("chur") || place.name?.toLowerCase().includes("chr") || place.name?.toLowerCase().includes("cma") ? "government" : "private"),
    tags: tags,
    source: "OSM" as const,
    confirmations: place.confirmations || 0,
    reports: place.reports || 0,
  };
}

function transformOsmToUniversity(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  const name = place.name || tags.name || tags["name:fr"] || tags.operator || "Établissement";
  
  // Déterminer le type d'établissement
  let institutionType = "Université";
  const nameLower = name.toLowerCase();
  const amenity = tags.amenity || "";
  
  if (amenity === "college" || nameLower.includes("institut") || nameLower.includes("isge") || nameLower.includes("istic")) {
    institutionType = "Institut";
  } else if (nameLower.includes("école") || nameLower.includes("ecole")) {
    if (nameLower.includes("supérieur") || nameLower.includes("superieur") || nameLower.includes("ingénieur")) {
      institutionType = "Grande École";
    } else {
      institutionType = "École Supérieure";
    }
  } else if (nameLower.includes("centre") && nameLower.includes("formation")) {
    institutionType = "Centre de Formation";
  } else if (amenity === "research_institute" || nameLower.includes("recherche")) {
    institutionType = "Institut de Recherche";
  } else if (nameLower.includes("lycée") || nameLower.includes("lycee")) {
    institutionType = "Lycée Technique";
  }
  
  // Extraire les filières et cursus depuis les tags OSM
  const filieres = tags.subject || tags.description || tags.courses || tags.faculty || "";
  const filieresArray = filieres ? filieres.split(';').map(f => f.trim()).filter(f => f) : [];
  
  // Extraire les niveaux d'études
  const niveaux = tags.isced_level || tags.level || "";
  const niveauxArray = niveaux ? niveaux.split(';').map(n => n.trim()) : [];
  
  return {
    id: `osm-uni-${place.id}`,
    name: name,
    nom: name,
    address: place.address || tags["addr:full"] || tags["addr:street"] || "Burkina Faso",
    adresse: place.address || tags["addr:full"] || tags["addr:street"] || "Burkina Faso",
    quartier: place.quartier || tags["addr:suburb"] || "Quartier non spécifié",
    ville: place.ville || tags["addr:city"] || "Ville non spécifiée",
    region: place.region || "Région non spécifiée",
    lat: parseFloat(place.latitude),
    lon: parseFloat(place.longitude),
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || tags.phone || tags["contact:phone"] || undefined,
    email: place.email || tags.email || tags["contact:email"] || undefined,
    website: place.website || tags.website || tags["contact:website"] || undefined,
    filieres: filieresArray.length > 0 ? filieresArray : undefined,
    niveaux: niveauxArray.length > 0 ? niveauxArray : undefined,
    capacite: tags.capacity ? parseInt(tags.capacity) : undefined,
    anneeCreation: tags.start_date || tags.opening_date || undefined,
    operateur: tags.operator || undefined,
    tags: {
      type: institutionType,
      amenity: amenity,
      filieres: filieres || undefined,
      niveaux: niveaux || undefined,
      ...tags
    },
    type: institutionType,
    source: "OSM" as const,
    placeId: place.id,
    confirmations: place.confirmations || 0,
    reports: place.reports || 0,
  };
}

function transformOsmToCimetiere(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  const name = place.name || tags.name || tags["name:fr"] || "Cimetiere";

  let type = "Municipal";
  const nameLower = name.toLowerCase();
  if (tags.religion === "muslim" || tags.religion === "islam" || nameLower.includes("musulman") || nameLower.includes("islam")) {
    type = "Musulman";
  } else if (tags.religion === "christian" || nameLower.includes("chretien") || nameLower.includes("catholique") || nameLower.includes("protestant")) {
    type = "Chretien";
  } else if (tags.religion === "animist" || nameLower.includes("traditionnel")) {
    type = "Traditionnel";
  } else if (tags.ownership === "private" || nameLower.includes("prive")) {
    type = "Prive";
  } else if (tags.denomination || tags.religion) {
    type = "Religieux";
  }

  return {
    id: `osm-cim-${place.id}`,
    nom: name,
    type,
    adresse: place.address || tags["addr:full"] || tags["addr:street"] || "Burkina Faso",
    quartier: place.quartier || tags["addr:suburb"] || "Quartier non specifie",
    ville: place.ville || tags["addr:city"] || "Ville non specifiee",
    region: place.region || "Region non specifiee",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || tags.phone || tags["contact:phone"] || undefined,
    horaires: place.horaires || tags.opening_hours || "06:00 - 18:00",
    superficie: tags.area ? `${Math.round(parseFloat(tags.area))} m2` : undefined,
    gestionnaire: tags.operator || undefined,
    religion: tags.religion || undefined,
    denomination: tags.denomination || undefined,
    website: place.website || tags.website || undefined,
    source: "OSM" as const,
    placeId: place.id,
    confirmations: place.confirmations || 0,
    reports: place.reports || 0,
  };
}

function transformOsmToLieuDeCulte(place: Place) {
  const tags = place.tags as Record<string, string> || {};
  const name = place.name || tags.name || tags["name:fr"] || tags["name:en"] || tags.operator || "Lieu de culte";
  const nameLower = name.toLowerCase();
  const religion = (tags.religion || "").toLowerCase();
  const denomination = (tags.denomination || "").toLowerCase();
  const building = (tags.building || "").toLowerCase();

  let type = "Autre";
  let religionLabel = "Autre";

  if (religion === "muslim" || religion === "islam" || nameLower.includes("mosquee") || nameLower.includes("mosquée") || nameLower.includes("mosque") || nameLower.includes("masjid") || nameLower.includes("jama") || nameLower.includes("مسجد")) {
    religionLabel = "Islam";
    if (nameLower.includes("grande mosquee") || nameLower.includes("grande mosquée") || nameLower.includes("jama") || nameLower.includes("friday") || tags["mosque:type"] === "jami") {
      type = "Grande Mosquee";
    } else if (nameLower.includes("medersa") || nameLower.includes("madrasa") || nameLower.includes("ecole coranique") || nameLower.includes("école coranique")) {
      type = "Medersa";
    } else {
      type = "Mosquee";
    }
  } else if (religion === "christian" || religion === "christianity" || nameLower.includes("eglise") || nameLower.includes("église") || nameLower.includes("church") || nameLower.includes("paroisse") || nameLower.includes("cathedrale") || nameLower.includes("cathédrale") || nameLower.includes("temple") || nameLower.includes("chapelle") || nameLower.includes("basilique")) {
    if (denomination.includes("catholic") || denomination.includes("catholique") || nameLower.includes("catholique") || nameLower.includes("paroisse") || nameLower.includes("cathedrale") || nameLower.includes("cathédrale") || nameLower.includes("basilique")) {
      religionLabel = "Catholique";
    } else if (denomination.includes("protestant") || denomination.includes("evangel") || denomination.includes("baptist") || denomination.includes("methodist") || denomination.includes("pentecost") || denomination.includes("assembl") || nameLower.includes("protestant") || nameLower.includes("evangel") || nameLower.includes("pentecot") || nameLower.includes("assemblee")) {
      religionLabel = "Protestant / Evangelique";
    } else {
      religionLabel = "Chretien";
    }

    if (nameLower.includes("cathedrale") || nameLower.includes("cathédrale") || building === "cathedral") {
      type = "Cathedrale";
    } else if (nameLower.includes("basilique")) {
      type = "Basilique";
    } else if (nameLower.includes("paroisse")) {
      type = "Paroisse";
    } else if (nameLower.includes("chapelle")) {
      type = "Chapelle";
    } else if (nameLower.includes("temple")) {
      type = "Temple";
    } else {
      type = "Eglise";
    }
  } else if (religion === "animist" || nameLower.includes("animiste") || nameLower.includes("fetiche") || nameLower.includes("fétiche") || nameLower.includes("sacre") || nameLower.includes("sacré")) {
    religionLabel = "Traditionnel";
    type = "Lieu sacre";
  } else {
    if (nameLower.includes("mosquee") || nameLower.includes("mosquée")) {
      religionLabel = "Islam";
      type = "Mosquee";
    } else if (nameLower.includes("eglise") || nameLower.includes("église")) {
      religionLabel = "Chretien";
      type = "Eglise";
    } else if (nameLower.includes("temple")) {
      religionLabel = "Chretien";
      type = "Temple";
    }
  }

  const services: string[] = [];
  if (tags.service_times) services.push("Offices reguliers");
  if (tags.community_centre) services.push("Centre communautaire");
  if (nameLower.includes("paroisse") || denomination.includes("catholic")) services.push("Sacrements");
  if (type === "Medersa") services.push("Enseignement coranique");
  if (type === "Grande Mosquee") services.push("Priere du vendredi");
  if (type === "Cathedrale" || type === "Basilique") services.push("Siege episcopal");

  return {
    id: `osm-culte-${place.id}`,
    nom: name,
    type,
    religion: religionLabel,
    denomination: tags.denomination || undefined,
    adresse: place.address || tags["addr:full"] || tags["addr:street"] || "Burkina Faso",
    quartier: place.quartier || tags["addr:suburb"] || "Quartier non specifie",
    ville: place.ville || tags["addr:city"] || "Ville non specifiee",
    region: place.region || "Region non specifiee",
    latitude: parseFloat(place.latitude),
    longitude: parseFloat(place.longitude),
    telephone: place.telephone || tags.phone || tags["contact:phone"] || undefined,
    email: tags.email || tags["contact:email"] || undefined,
    website: place.website || tags.website || tags["contact:website"] || undefined,
    horaires: place.horaires || tags.opening_hours || tags.service_times || undefined,
    operateur: tags.operator || undefined,
    capacite: tags.capacity ? parseInt(tags.capacity) : undefined,
    anneeConstruction: tags.start_date || tags["building:year"] || undefined,
    description: tags.description || tags["description:fr"] || undefined,
    wikidata: tags.wikidata || undefined,
    wikipedia: tags.wikipedia || undefined,
    image: tags.image || tags.wikimedia_commons || undefined,
    services,
    source: "OSM" as const,
    placeId: place.id,
    confirmations: place.confirmations || 0,
    reports: place.reports || 0,
  };
}

function mapOsmBrandToMarque(brand: string): string {
  const brandLower = brand.toLowerCase();
  if (brandLower.includes("total")) return "TotalEnergies";
  if (brandLower.includes("shell")) return "Shell";
  if (brandLower.includes("oryx")) return "Oryx";
  if (brandLower.includes("sob")) return "SOB Petrol";
  if (brandLower.includes("sonabhy")) return "Sonabhy";
  if (brandLower.includes("barka")) return "Barka Energies";
  return "Autre";
}

// ============================================
// ENREGISTREMENT DES ROUTES
// ============================================
export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // ----------------------------------------
  // ROUTES D'AUTHENTIFICATION HYBRIDE (OTP Email + SMS)
  // ----------------------------------------
  
  const { sendEmailOtp, sendSmsOtp, verifyOtp, checkTwilioAvailability } = await import("./hybridAuthService");
  const { authLimiter } = await import("./securityHardening");

  app.post("/api/auth/send-otp", authLimiter, async (req: any, res) => {
    const { identifier, type } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ success: false, message: "Email ou téléphone requis" });
    }
    
    if (!type || !["email", "sms"].includes(type)) {
      return res.status(400).json({ success: false, message: "Type doit être 'email' ou 'sms'" });
    }

    try {
      let result;
      if (type === "email") {
        result = await sendEmailOtp(identifier);
      } else {
        result = await sendSmsOtp(identifier);
      }
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      res.status(500).json({ success: false, message: error.message || "Erreur serveur" });
    }
  });

  app.post("/api/auth/verify-otp", authLimiter, async (req: any, res) => {
    const { identifier, code, type } = req.body;
    
    if (!identifier || !code || !type) {
      return res.status(400).json({ success: false, message: "Identifiant, code et type requis" });
    }

    try {
      const result = await verifyOtp(identifier, code, type);
      
      if (result.success && result.userId) {
        const user = await storage.getUser(result.userId);
        if (user) {
          const wrappedUser = {
            ...user,
            claims: { sub: user.id }
          };
          req.login(wrappedUser, (err: any) => {
            if (err) {
              console.error("Login error:", err);
              return res.status(500).json({ success: false, message: "Erreur de connexion" });
            }
            req.session.save((saveErr: any) => {
              if (saveErr) {
                console.error("Session save error:", saveErr);
                return res.status(500).json({ success: false, message: "Erreur de sauvegarde de session" });
              }
              console.log("✅ User logged in and session saved:", user.id);
              res.json({ success: true, user: wrappedUser, message: "Connexion réussie" });
            });
          });
        } else {
          res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        }
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ success: false, message: error.message || "Erreur serveur" });
    }
  });

  app.get("/api/auth/check-sms-availability", async (req, res) => {
    try {
      const available = await checkTwilioAvailability();
      res.json({ available });
    } catch (error) {
      res.json({ available: false });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Erreur de déconnexion" });
      }
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ success: false, message: "Erreur de destruction de session" });
        }
        res.clearCookie("connect.sid");
        res.json({ success: true, message: "Déconnexion réussie" });
      });
    });
  });

  app.get("/api/auth/user", (req: any, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).json({ message: "Unauthorized" });
  });

  app.post("/api/auth/magic-link", async (req: any, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });

    const token = crypto.randomUUID();
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ error: "Utilisateur non identifié" });

    try {
      await storage.createMagicLink(userId, email, token);
      
      const domain = req.get("host");
      const magicLink = `${req.protocol}://${domain}/api/auth/verify?token=${token}`;
      
      console.log(`[MagicLink] Pour ${email}: ${magicLink}`);
      
      // En production, on utiliserait Resend ici
      // await sendMagicLinkEmail(email, magicLink);

      res.json({ message: "Lien magique envoyé (vérifiez les logs en dév)" });
    } catch (error) {
      console.error("Magic link error:", error);
      res.status(500).json({ error: "Erreur lors de la génération du lien" });
    }
  });

  app.get("/api/auth/verify", async (req: any, res) => {
    const { token } = req.query;
    if (!token) return res.redirect("/?error=token_missing");

    try {
      const link = await storage.getMagicLinkByToken(token as string);
      if (!link) return res.redirect("/?error=invalid_token");

      // Vérifier si un compte avec cet email existe déjà
      const existingUser = await storage.getUserByEmail(link.email);
      
      if (existingUser) {
        // Fusionner les données si nécessaire, mais ici on va simplement logger l'utilisateur existant
        // Pour cet exercice, on va simplement associer l'email à l'utilisateur actuel s'il est anonyme
        await storage.associateEmailWithUser(link.userId, link.email);
      } else {
        await storage.associateEmailWithUser(link.userId, link.email);
      }

      await storage.consumeMagicLink(token as string);
      
      res.redirect("/?auth=success");
    } catch (error) {
      console.error("Verification error:", error);
      res.redirect("/?error=server_error");
    }
  });

  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = updateUserProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const user = await storage.updateUserProfile(userId, validationResult.data);

      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du profil" });
    }
  });

  // Get leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const topUsers = await storage.getTopUsersByPoints(50);
      res.json(topUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Sync user points based on signalements
  app.post("/api/auth/user/sync-points", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await storage.syncUserPointsFromSignalements(userId);
      res.json(result);
    } catch (error: any) {
      console.error("Error syncing user points:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Award points to user
  app.post("/api/users/:userId/award-points", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { points, reason } = req.body;

      // Only allow awarding points to self or if admin
      const user = await storage.getUser(req.user.claims.sub);
      if (userId !== req.user.claims.sub && user?.role !== "admin") {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const updatedUser = await storage.awardPointsToUser(userId, points);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ----------------------------------------
  // ROUTES STATISTIQUES
  // ----------------------------------------
  app.get("/api/stats", async (_req, res) => {
    try {
      console.log("[STATS] Route called");
      const stats = await storage.getStats();
      console.log("[STATS] Storage stats:", stats);
      
      const fuelResponse = await overpassService.getPlaces({ placeType: "fuel" });
      const pharmacyResponse = await overpassService.getPlaces({ placeType: "pharmacy" });
      const bankResponse = await overpassService.getPlaces({ placeType: "bank" });
      const caisseResponse = await overpassService.getPlaces({ placeType: "caisses_populaires" });
      
      const banks = bankResponse.places.filter(p => p.placeType === "bank");
      const gabs = bankResponse.places.filter(p => p.placeType === "atm" || (p.tags as any)?.hasGAB);
      const ebis = bankResponse.places.filter(p => (p.tags as any)?.importanceSystemique);
      
      const allFinancial = [...bankResponse.places, ...caisseResponse.places];
      const cities = new Set(allFinancial.map(p => p.ville).filter(v => v && v !== "Ville non spécifiée"));

      const finalStats = {
        ...stats,
        totalPharmacies: pharmacyResponse.places.length,
        totalStations: fuelResponse.places.length,
        banques: banks.length,
        caissesPopulaires: caisseResponse.places.length,
        totalGAB: gabs.length,
        importanceSystemique: ebis.length,
        nombreVilles: cities.size || 12
      };

      console.log("[STATS] API Sending finalStats:", JSON.stringify(finalStats));
      res.header("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(finalStats);
    } catch (error) {
      console.error("[STATS] Error fetching stats:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/places/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const { region } = req.query;
      
      const response = await overpassService.getPlaces({ 
        placeType: type,
        region: region as string | undefined
      });
      
      // Transform based on type if needed
      let transformed: any[] = response.places;
      if (type === "hospital") {
        transformed = response.places.map(transformOsmToHopital);
      } else if (type === "pharmacy") {
        // Use local PHARMACIES_DATA as primary source (has accurate guard status)
        transformed = getMergedPharmacies();
      } else if (type === "restaurant") {
        transformed = response.places.map((p, i) => transformOsmToRestaurant(p, i));
      } else if (type === "shop" || type === "supermarket") {
        transformed = response.places.map(transformOsmToBoutique);
      } else if (type === "marketplace") {
        transformed = response.places.map(transformOsmToMarche);
      } else if (type === "bank" || type === "atm" || type === "caisses_populaires") {
        transformed = response.places.map(transformOsmToBanque);
      } else if (type === "fuel") {
        transformed = response.places.map(transformOsmToStation);
      } else if (type === "university") {
        transformed = response.places.map(transformOsmToUniversity);
      }

      res.json(transformed);
    } catch (error) {
      console.error(`Error fetching places for ${req.params.type}:`, error);
      res.status(500).json({ error: "Erreur lors de la récupération des lieux" });
    }
  });

  // ----------------------------------------
  // ROUTES SIGNALEMENTS
  // ----------------------------------------
  app.get("/api/signalements", async (req, res) => {
    try {
      const { categorie, statut, isSOS, limit } = req.query;

      const signalements = await storage.getSignalements({
        categorie: categorie as string | undefined,
        statut: statut as string | undefined,
        isSOS: isSOS === "true" ? true : isSOS === "false" ? false : undefined,
        limit: limit ? parseInt(limit as string) : 50, // Limite par défaut de 50 pour réduire la charge
      });

      // Ajouter les headers de cache
      res.set('Cache-Control', 'public, max-age=300'); // Cache 5 minutes
      res.json(signalements);
    } catch (error) {
      console.error("Error fetching signalements:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des signalements" });
    }
  });

  app.get("/api/signalements/:id", async (req, res) => {
    try {
      const signalement = await storage.getSignalement(req.params.id);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      res.json(signalement);
    } catch (error) {
      console.error("Error fetching signalement:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du signalement" });
    }
  });

  app.post("/api/signalements", isAuthenticated, signalementMutationLimiter, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;

      // 🔍 Modération du contenu
      const moderationResult = await moderateContent(
        `${req.body.titre} ${req.body.description}`,
        req.body.isSOS ? "sos" : "signalement",
        req.body.language || "fr"
      );

      // Log de l'action de modération
      await logModerationAction(userId, req.body.titre, moderationResult, "signalement");

      if (!moderationResult.isApproved) {
        return res.status(400).json({
          error: "content_moderated",
          severity: moderationResult.severity,
          flaggedWords: moderationResult.flaggedWords,
          reason: moderationResult.reason,
          suggestion: moderationResult.suggestion,
        });
      }

      const validationResult = insertSignalementSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      // Vérification IA en arrière-plan
      const verificationPromise = (async () => {
        try {
          const verification = await verifySignalement(validationResult.data);

          await storage.updateSignalement(signalement.id, {
            reliabilityScore: verification.score,
            verificationStatus: verification.status,
          });

          console.log(`✅ Signalement ${signalement.id} vérifié: ${verification.score}/100 (${verification.status})`);
        } catch (error) {
          console.error("❌ Erreur vérification IA:", error);
        }
      });

      const signalement = await storage.createSignalement(validationResult.data);

      // Lancer la vérification sans bloquer la réponse
      verificationPromise();

      // 🔒 Audit logging (non-bloquant)
      storage.logAudit({
        userId,
        action: signalement.isSOS ? "CREATE_SOS" : "CREATE_SIGNALEMENT",
        resourceType: "signalement",
        resourceId: signalement.id,
        details: {
          categorie: signalement.categorie,
          isSOS: signalement.isSOS,
          niveauUrgence: signalement.niveauUrgence,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        severity: signalement.isSOS ? "warning" : "info",
      }).catch(err => console.error("[AUDIT] Erreur log:", err));

      // Broadcast notification to all users about new post
      if (signalement.userId !== "demo-user") {
        const notifType = signalement.isSOS ? "urgence" : "info";
        const notifTitle = signalement.isSOS ? "Nouveau SOS" : "Nouveau signalement";
        const notifDesc = signalement.isSOS
          ? `Un nouveau signal d'urgence a été publié: ${signalement.titre}`
          : `Nouveau signalement publié: ${signalement.titre}`;

        await storage.broadcastNotification(
          notifType,
          notifTitle,
          notifDesc,
          signalement.id,
          userId // Exclude the author
        );

        // Send push notifications to nearby users (non-blocking)
        import("./pushService").then(({ notifyNewSignalement }) => {
          notifyNewSignalement(signalement.id).then((count) => {
            if (count > 0) {
              console.log(`Push notifications sent to ${count} nearby users for signalement ${signalement.id}`);
            }
          }).catch(err => console.error("Push notification error:", err));
        }).catch(err => console.error("Push service import error:", err));
      }

      // Renvoyer le signalement sans les données base64 volumineuses
      const { medias, ...signalementWithoutMedia } = signalement;
      res.status(201).json({
        ...signalementWithoutMedia,
        medias: medias ? medias.map(() => "[MEDIA_DATA]") : [],
      });
    } catch (error) {
      console.error("Error creating signalement:", error);
      res.status(500).json({ error: "Erreur lors de la création du signalement" });
    }
  });

  app.get("/api/auth/user/signalements", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const signalements = await storage.getUserSignalements(userId);
      res.json(signalements);
    } catch (error) {
      console.error("Error fetching user signalements:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des signalements" });
    }
  });

  app.patch("/api/signalements/:id", signalementMutationLimiter, async (req: any, res) => {
    try {
      console.log("📝 PATCH /api/signalements/:id - Données reçues:", req.body);
      
      const signalement = await storage.getSignalement(req.params.id);

      if (!signalement) {
        console.log("❌ Signalement non trouvé:", req.params.id);
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Demo mode: Allow editing signalements created by demo-user
      // Authenticated mode: Only the owner can edit their own signalements
      const userId = req.user?.claims?.sub || "demo-user";

      // Security check: Only allow editing if:
      // 1. Signalement belongs to demo-user (demo mode), OR
      // 2. User is authenticated AND owns this signalement
      const isDemoSignalement = signalement.userId === "demo-user";
      const isOwner = signalement.userId === userId;

      if (!isDemoSignalement && !isOwner) {
        console.log("❌ Non autorisé - userId:", userId, "signalement.userId:", signalement.userId);
        return res.status(403).json({ error: "Vous n'êtes pas autorisé à modifier ce signalement" });
      }

      // If signalement is not a demo signalement, require authentication
      if (!isDemoSignalement && !req.user) {
        console.log("❌ Authentification requise");
        return res.status(401).json({ error: "Authentification requise" });
      }

      const validationResult = updateSignalementSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        console.log("❌ Erreur validation:", errorMessage);
        console.log("Erreurs détaillées:", validationResult.error.errors);
        return res.status(400).json({ error: errorMessage });
      }

      console.log("✅ Données validées:", validationResult.data);

      const updatedSignalement = await storage.updateSignalement(req.params.id, validationResult.data);

      console.log("✅ Signalement mis à jour:", updatedSignalement);

      // 🔒 Audit logging (non-bloquant)
      if (updatedSignalement) {
        storage.logAudit({
          userId,
          action: "UPDATE_SIGNALEMENT",
          resourceType: "signalement",
          resourceId: updatedSignalement.id,
          details: {
            modifications: validationResult.data,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          severity: "info",
        }).catch(err => console.error("[AUDIT] Erreur log:", err));
      }

      // Notify all users about the modification
      if (updatedSignalement && userId !== "demo-user") {
        await storage.broadcastNotification(
          "info",
          "✏️ Signalement modifié",
          `Un signalement a été mis à jour: ${updatedSignalement.titre}`,
          updatedSignalement.id,
          userId
        );
      }

      res.json(updatedSignalement);
    } catch (error) {
      console.error("❌ Error updating signalement:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du signalement" });
    }
  });

  app.delete("/api/signalements/:id", signalementMutationLimiter, async (req: any, res) => {
    try {
      const signalement = await storage.getSignalement(req.params.id);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Demo mode: Allow deleting signalements created by demo-user
      // Authenticated mode: Only the owner can delete their own signalements
      const userId = req.user?.claims?.sub || "demo-user";

      // Security check: Only allow deleting if:
      // 1. Signalement belongs to demo-user (demo mode), OR
      // 2. User is authenticated AND owns this signalement
      const isDemoSignalement = signalement.userId === "demo-user";
      const isOwner = signalement.userId === userId;

      if (!isDemoSignalement && !isOwner) {
        return res.status(403).json({ error: "Vous n'êtes pas autorisé à supprimer ce signalement" });
      }

      // If signalement is not a demo signalement, require authentication
      if (!isDemoSignalement && !req.user) {
        return res.status(401).json({ error: "Authentification requise" });
      }

      const success = await storage.deleteSignalement(req.params.id);

      if (!success) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // 🔒 Audit logging (non-bloquant) - Log après suppression réussie
      storage.logAudit({
        userId,
        action: "DELETE_SIGNALEMENT",
        resourceType: "signalement",
        resourceId: req.params.id,
        details: {
          titre: signalement.titre,
          categorie: signalement.categorie,
          isSOS: signalement.isSOS,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        severity: "warning",
      }).catch(err => console.error("[AUDIT] Erreur log:", err));

      res.json({ message: "Signalement supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting signalement:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du signalement" });
    }
  });

  app.patch("/api/signalements/:id/statut", isAuthenticated, async (req: any, res) => {
    try {
      const { statut } = req.body;
      const userId = req.user.claims.sub;

      if (!statut || !["en_attente", "en_cours", "resolu", "rejete"].includes(statut)) {
        return res.status(400).json({ error: "Statut invalide" });
      }

      // Vérifier que l'utilisateur a les droits (admin ou auteur du signalement)
      const existingSignalement = await storage.getSignalement(req.params.id);
      if (!existingSignalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      const user = await storage.getUser(userId);
      if (existingSignalement.userId !== userId && user?.role !== "admin") {
        return res.status(403).json({ error: "Vous n'avez pas les droits pour modifier ce signalement" });
      }

      const signalement = await storage.updateSignalementStatut(req.params.id, statut);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Les points sont attribués automatiquement dans updateSignalementStatut
      // +10 points quand le statut passe à "résolu"

      // Notify signalement owner
      const statusMessages: Record<string, string> = {
        en_attente: "Votre signalement est en attente de traitement",
        en_cours: "Votre signalement est en cours de traitement",
        resolu: "Votre signalement a été résolu",
        rejete: "Votre signalement a été rejeté"
      };

      await storage.notifySignalementOwner(
        req.params.id,
        statut === "resolu" ? "resolu" : "info",
        "Mise à jour du statut",
        statusMessages[statut] || "Le statut de votre signalement a été mis à jour"
      );

      res.json(signalement);
    } catch (error) {
      console.error("Error updating signalement statut:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du statut" });
    }
  });

  app.post("/api/signalements/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const signalement = await storage.getSignalement(req.params.id);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      const { signalement: updatedSignalement, isLiked } = await storage.likeSignalement(req.params.id, userId);

      if (!updatedSignalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Notify signalement owner only on like (not unlike)
      if (isLiked) {
        await storage.notifySignalementOwner(
          req.params.id,
          "like",
          "❤️ Nouveau like",
          "Quelqu'un a aimé votre signalement"
        );
      }

      res.json({ ...updatedSignalement, isLiked });
    } catch (error) {
      console.error("Error liking signalement:", error);
      res.status(500).json({ error: "Erreur lors du like" });
    }
  });

  app.post("/api/signalements/:id/share", async (req, res) => {
    try {
      const signalement = await storage.shareSignalement(req.params.id);

      if (!signalement) {
        return res.status(404).json({ error: "Signalement non trouvé" });
      }

      // Notify signalement owner about share
      await storage.notifySignalementOwner(
        req.params.id,
        "info",
        "🔗 Partage",
        "Quelqu'un a partagé votre signalement"
      );

      res.json(signalement);
    } catch (error) {
      console.error("Error sharing signalement:", error);
      res.status(500).json({ error: "Erreur lors du partage" });
    }
  });

  // ----------------------------------------
  // ROUTES COMMENTAIRES
  // ----------------------------------------
  app.get("/api/signalements/:id/commentaires", async (req, res) => {
    try {
      const commentaires = await storage.getCommentaires(req.params.id);
      res.json(commentaires);
    } catch (error) {
      console.error("Error fetching commentaires:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des commentaires" });
    }
  });

  app.post("/api/commentaires", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { signalementId, contenu, auteur } = req.body;

      // 🔍 Modération du commentaire
      const moderationResult = await moderateContent(
        contenu,
        "commentaire",
        req.body.language || "fr"
      );

      await logModerationAction(userId, contenu, moderationResult, "commentaire");

      if (!moderationResult.isApproved) {
        return res.status(400).json({
          error: "content_moderated",
          severity: moderationResult.severity,
          flaggedWords: moderationResult.flaggedWords,
          reason: moderationResult.reason,
          suggestion: moderationResult.suggestion,
        });
      }

      const validationResult = insertCommentaireSchema.safeParse({
        ...req.body,
        userId: userId, // Use authenticated user ID
      });

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const commentaire = await storage.createCommentaire(validationResult.data);

      // Notify signalement owner about new comment
      await storage.notifySignalementOwner(
        validationResult.data.signalementId,
        "comment",
        "💬 Nouveau commentaire",
        "Quelqu'un a commenté votre signalement"
      );

      res.status(201).json(commentaire);
    } catch (error) {
      console.error("Error creating commentaire:", error);
      res.status(500).json({ error: "Erreur lors de la création du commentaire" });
    }
  });

  // ----------------------------------------
  // ROUTES NOTIFICATIONS
  // ----------------------------------------
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
    }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du nombre de notifications non lues" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ error: "Notification non trouvée" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de la notification" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "Toutes les notifications ont été marquées comme lues" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour des notifications" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notificationId = req.params.id;

      const notification = await storage.getNotificationById(notificationId);

      if (!notification) {
        return res.status(404).json({ error: "Notification non trouvée" });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const success = await storage.deleteNotification(notificationId);

      if (!success) {
        return res.status(500).json({ error: "Erreur lors de la suppression" });
      }

      res.json({ message: "Notification supprimée avec succès" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de la notification" });
    }
  });

  app.delete("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteAllUserNotifications(userId);
      res.json({ message: "Toutes les notifications ont été supprimées" });
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      res.status(500).json({ error: "Erreur lors de la suppression des notifications" });
    }
  });

  // ----------------------------------------
  // ROUTES PUSH NOTIFICATIONS
  // ----------------------------------------
  app.post("/api/push/subscribe", async (req: any, res) => {
    try {
      const { endpoint, keys, latitude, longitude, radiusKm } = req.body;
      const userId = req.user?.claims?.sub || null;
      
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: "Données d'abonnement invalides" });
      }

      const { saveSubscription } = await import("./pushService");
      await saveSubscription(userId, { endpoint, keys }, latitude, longitude, radiusKm);
      
      res.json({ message: "Abonnement aux notifications activé" });
    } catch (error) {
      console.error("Error subscribing to push:", error);
      res.status(500).json({ error: "Erreur lors de l'abonnement" });
    }
  });

  app.post("/api/push/unsubscribe", async (req: any, res) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint requis" });
      }

      const { removeSubscription } = await import("./pushService");
      await removeSubscription(endpoint);
      
      res.json({ message: "Désabonnement réussi" });
    } catch (error) {
      console.error("Error unsubscribing from push:", error);
      res.status(500).json({ error: "Erreur lors du désabonnement" });
    }
  });

  app.post("/api/push/update-location", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { endpoint, latitude, longitude, radiusKm } = req.body;
      
      if (!endpoint || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "Données de localisation invalides" });
      }

      const { db } = await import("./db");
      const { pushSubscriptions } = await import("@shared/schema");
      const { eq, and } = await import("drizzle-orm");
      
      const [subscription] = await db.select().from(pushSubscriptions)
        .where(and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, userId)
        ));
      
      if (!subscription) {
        return res.status(403).json({ error: "Subscription non autorisée" });
      }

      const { updateSubscriptionLocation } = await import("./pushService");
      await updateSubscriptionLocation(endpoint, latitude, longitude, radiusKm);
      
      res.json({ message: "Localisation mise à jour" });
    } catch (error) {
      console.error("Error updating push location:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour" });
    }
  });

  app.get("/api/push/vapid-key", (req, res) => {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
    res.json({ vapidPublicKey });
  });

  app.get("/api/push/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { getPreferences } = await import("./pushService");
      const preferences = await getPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des préférences" });
    }
  });

  app.put("/api/push/preferences", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { securityAlerts, weatherAlerts, pharmacyUpdates, generalNews, radiusKm } = req.body;
      const { updatePreferences } = await import("./pushService");
      const updated = await updatePreferences(userId, {
        securityAlerts,
        weatherAlerts,
        pharmacyUpdates,
        generalNews,
        radiusKm,
      });
      res.json(updated);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour des préférences" });
    }
  });

  app.get("/api/push/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { getUserSubscriptions } = await import("./pushService");
      const subscriptions = await getUserSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error getting subscriptions:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des abonnements" });
    }
  });

  // ----------------------------------------
  // ROUTES PROFIL PUBLIC
  // ----------------------------------------
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      // Ne retourner que les informations publiques
      const publicUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        ville: user.ville,
        metier: user.metier,
        bio: user.bio,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt,
      };
      res.json(publicUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de l'utilisateur" });
    }
  });

  app.get("/api/users/:userId/signalements", async (req, res) => {
    try {
      const signalements = await storage.getSignalementsByUserId(req.params.userId);
      res.json(signalements);
    } catch (error) {
      console.error("Error fetching user signalements:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des signalements" });
    }
  });

  // ----------------------------------------
  // ROUTES TRACKING GPS
  // ----------------------------------------
  app.post("/api/tracking/start", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { latitude, longitude } = req.body || {};
      
      const session = await storage.startTrackingSession(userId);
      
      // Envoyer une notification aux contacts d'urgence
      try {
        const user = await storage.getUser(userId);
        const emergencyContacts = await storage.getEmergencyContacts(userId);
        
        if (user && emergencyContacts.length > 0) {
          const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur';
          
          // Get initial location if provided
          let initialLocation: { latitude: number; longitude: number; address?: string } | undefined;
          if (latitude && longitude) {
            const geocodeResult = await reverseGeocode(latitude, longitude);
            initialLocation = {
              latitude,
              longitude,
              address: geocodeResult.address
            };
          }
          
          // Envoyer des emails à tous les contacts avec email
          const emailPromises = emergencyContacts
            .filter(contact => contact.email)
            .map(contact => 
              sendEmergencyTrackingStartEmail(
                contact.email!,
                contact.name,
                userName,
                `https://${process.env.RAILWAY_PUBLIC_DOMAIN || process.env.REPLIT_DEV_DOMAIN || process.env.APP_DOMAIN || 'burkinawatch.com'}/tracking-live`,
                initialLocation
              ).catch(err => {
                console.error(`❌ Erreur envoi email à ${contact.email}:`, err);
                return null;
              })
            );
          
          await Promise.all(emailPromises);
          console.log(`✅ Notifications envoyées à ${emailPromises.length} contacts d'urgence pour ${userName}`);
        }
      } catch (notificationError) {
        console.error("⚠️ Erreur lors de l'envoi des notifications (non bloquant):", notificationError);
        // Ne pas bloquer le démarrage du tracking si les notifications échouent
      }
      
      res.status(201).json(session);
    } catch (error) {
      console.error("Error starting tracking session:", error);
      res.status(500).json({ error: "Erreur lors du démarrage du tracking" });
    }
  });

  // Stop tracking session
  app.post("/api/tracking/stop", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // Récupérer la session active
      const activeSession = await storage.getActiveTrackingSession(userId);

      if (!activeSession) {
        console.log(`⚠️ Tentative d'arrêt de tracking sans session active pour l'utilisateur ${userId}`);
        return res.status(404).json({ error: "Aucune session de tracking active" });
      }

      // Arrêter la session en utilisant l'ID de la session
      const session = await storage.stopTrackingSession(activeSession.id);

      if (!session) {
        return res.status(404).json({ error: "Erreur lors de l'arrêt de la session" });
      }

      // Récupérer les points de localisation de cette session
      const locations = await storage.getLocationPointsBySession(session.id);

      let geocodedAddress = "Adresse non disponible";
      let lastLocation: any = null;

      // Send email with location address and GPX file
      if (locations.length > 0) {
        // Get the last location point for address
        lastLocation = locations[locations.length - 1];

        // Get user info for email
        const user = await storage.getUser(userId);

        // Reverse geocode the last location to get address
        const geocodeResult = await reverseGeocode(lastLocation.latitude, lastLocation.longitude);
        geocodedAddress = geocodeResult.address;

        if (user?.email) {
          // Générer le fichier GPX
          const gpxContent = generateGPX(locations);

          // Send email with address and GPX file
          try {
            await sendLocationEmail(
              user.email,
              `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilisateur',
              geocodedAddress,
              locations.length,
              gpxContent,
              session.id
            );
            console.log(`✅ Email envoyé à ${user.email} avec l'adresse: ${geocodedAddress} et le fichier GPX`);
          } catch (emailError) {
            console.error('❌ Échec de l\'envoi de l\'email:', emailError);
            // Don't fail the request if email fails
          }
        } else {
          console.log(`⚠️ Aucun email configuré pour l'utilisateur ${userId}`);
        }
      }

      // Récupérer les contacts d'urgence
      const contacts = await storage.getEmergencyContacts(userId);

      // Si des contacts existent, créer les URLs WhatsApp avec l'adresse géocodée
      if (contacts && contacts.length > 0 && lastLocation) {
        const mapsUrl = `https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}`;

        const user = await storage.getUser(userId);
        const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Un utilisateur';

        // Message avec l'adresse géocodée
        const message = `🚨 ${userName} a terminé son suivi de localisation.\n\n📍 Position finale:\n${geocodedAddress}\n\n🗺️ Voir sur la carte:\n${mapsUrl}\n\n${locations.length} points enregistrés.`;

        const whatsappUrls = contacts.map(contact => {
          const cleanPhone = contact.phone.replace(/[^\d+]/g, '');
          return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        });

        console.log(`✅ ${whatsappUrls.length} URLs WhatsApp générées avec l'adresse: ${geocodedAddress}`);
        return res.json({ ...session, whatsappUrls, address: geocodedAddress });
      }

      res.json(session);
    } catch (error) {
      console.error("Error stopping tracking session:", error);
      res.status(500).json({ error: "Erreur lors de l'arrêt du tracking" });
    }
  });

  // Helper function to generate GPX file
  function generateGPX(locations: any[]): string {
    const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Burkina Watch" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Session de localisation en direct</name>
    <trkseg>`;

    const gpxPoints = locations.map(loc =>
      `      <trkpt lat="${loc.latitude}" lon="${loc.longitude}">
        <time>${new Date(loc.timestamp).toISOString()}</time>
      </trkpt>`
    ).join('\n');

    const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

    return gpxHeader + '\n' + gpxPoints + gpxFooter;
  }

  app.get("/api/tracking/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const session = await storage.getActiveTrackingSession(userId);

      if (!session) {
        return res.status(404).json({ error: "Aucune session de tracking active" });
      }

      res.json(session);
    } catch (error) {
      console.error("Error fetching active tracking session:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de la session" });
    }
  });

  app.post("/api/tracking/location", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const activeSession = await storage.getActiveTrackingSession(userId);

      if (!activeSession) {
        return res.status(404).json({ error: "Aucune session de tracking active" });
      }

      const validationResult = insertLocationPointSchema.safeParse({
        ...req.body,
        sessionId: activeSession.id,
        userId,
      });

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const locationPoint = await storage.addLocationPoint(validationResult.data);
      res.status(201).json(locationPoint);
    } catch (error) {
      console.error("Error adding location point:", error);
      res.status(500).json({ error: "Erreur lors de l'ajout du point de localisation" });
    }
  });

  app.get("/api/tracking/sessions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserTrackingSessions(userId);

      const sessionsWithTrajectory = await Promise.all(
        sessions.map(async (session) => {
          const points = await storage.getSessionLocationPoints(session.id);

          let trajectoryUrl = null;
          if (points.length > 0) {
            const sortedPoints = points.sort((a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            if (sortedPoints.length === 1) {
              const point = sortedPoints[0];
              trajectoryUrl = `https://www.google.com/maps?q=${point.latitude},${point.longitude}`;
            } else {
              const firstPoint = sortedPoints[0];
              const lastPoint = sortedPoints[sortedPoints.length - 1];

              const waypoints = sortedPoints.slice(1, -1)
                .filter((_, index) => index % Math.max(1, Math.floor((sortedPoints.length - 2) / 8)) === 0)
                .map(p => `${p.latitude},${p.longitude}`)
                .join('|');

              const origin = `${firstPoint.latitude},${firstPoint.longitude}`;
              const destination = `${lastPoint.latitude},${lastPoint.longitude}`;

              if (waypoints) {
                trajectoryUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=walking`;
              } else {
                trajectoryUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
              }
            }
          }

          return {
            ...session,
            trajectoryUrl,
            pointCount: points.length
          };
        })
      );

      res.json(sessionsWithTrajectory);
    } catch (error) {
      console.error("Error fetching tracking sessions:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des sessions" });
    }
  });

  app.get("/api/tracking/sessions/:id/points", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = req.params.id;

      const session = await storage.getActiveTrackingSession(userId);
      if (!session || session.id !== sessionId) {
        const sessions = await storage.getUserTrackingSessions(userId);
        const sessionExists = sessions.find(s => s.id === sessionId);

        if (!sessionExists) {
          return res.status(403).json({ error: "Session non trouvée ou non autorisée" });
        }
      }

      const points = await storage.getSessionLocationPoints(sessionId);
      res.json(points);
    } catch (error) {
      console.error("Error fetching session location points:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des points" });
    }
  });

  app.delete("/api/tracking/sessions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessionId = req.params.id;

      const sessions = await storage.getUserTrackingSessions(userId);
      const sessionExists = sessions.find(s => s.id === sessionId);

      if (!sessionExists) {
        return res.status(404).json({ error: "Session non trouvée" });
      }

      const success = await storage.deleteTrackingSession(sessionId);

      if (!success) {
        return res.status(500).json({ error: "Erreur lors de la suppression de la session" });
      }

      res.json({ message: "Session supprimée avec succès" });
    } catch (error) {
      console.error("Error deleting tracking session:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de la session" });
    }
  });

  // New routes for emergency contacts and panic alerts
  app.get("/api/emergency-contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contacts = await storage.getEmergencyContacts(userId);
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des contacts" });
    }
  });

  app.post("/api/emergency-contacts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validationResult = insertEmergencyContactSchema.safeParse({
        ...req.body,
        userId,
      });

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const contact = await storage.createEmergencyContact(validationResult.data);
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating emergency contact:", error);
      res.status(500).json({ error: "Erreur lors de la création du contact" });
    }
  });

  app.delete("/api/emergency-contacts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.deleteEmergencyContact(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Contact non trouvé" });
      }
      res.json({ message: "Contact supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting emergency contact:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du contact" });
    }
  });

  app.post("/api/panic-alert", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { latitude, longitude, address } = req.body;

      const contacts = await storage.getEmergencyContacts(userId);

      if (contacts.length === 0) {
        return res.status(400).json({ error: "Aucun contact d'urgence configuré" });
      }

      const user = await storage.getUser(userId);
      const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Un utilisateur';

      // Demarrer une session de tracking d'urgence avec live location
      const trackingSession = await storage.startPanicTrackingSession(userId);

      // Ajouter le premier point de localisation
      await storage.addLocationPoint({
        sessionId: trackingSession.id,
        userId,
        latitude,
        longitude,
        accuracy: "10",
      });

      const sentTo = contacts.map(c => c.phone);

      // Creer le lien de suivi en direct
      const host = req.get('host') || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.APP_DOMAIN || 'burkinawatch.com';
      const protocol = req.get('x-forwarded-proto') || 'https';
      const liveTrackingUrl = `${protocol}://${host}/track/${trackingSession.shareToken}`;

      // Message avec le lien de suivi en direct
      const message = `🚨 ALERTE URGENCE - ${userName} a besoin d'aide!\n\n📍 SUIVI EN DIRECT:\n${liveTrackingUrl}\n\nCliquez sur ce lien pour suivre sa position en temps reel. Reagissez rapidement!`;

      // Envoyer via WhatsApp pour chaque contact
      const whatsappPromises = contacts.map(contact => {
        const cleanPhone = contact.phone.replace(/[^\d+]/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        console.log(`WhatsApp URL pour ${contact.name}: ${whatsappUrl}`);
        return whatsappUrl;
      });

      const alert = await storage.createPanicAlert({
        userId,
        latitude,
        longitude,
        address: address || null,
        sentTo,
      });

      await storage.createNotification({
        userId,
        type: "panic_alert",
        title: "🚨 Alerte de securite avec suivi en direct",
        description: `Alerte panique envoyee a ${contacts.length} contact(s). Suivi en direct actif.`,
      });

      console.log(`🚨 Alerte panique avec Live Location activee pour ${userName}. Token: ${trackingSession.shareToken}`);

      // Retourner les URLs WhatsApp et les infos de tracking pour que le client puisse continuer le suivi
      res.status(201).json({
        ...alert,
        whatsappUrls: whatsappPromises,
        trackingSessionId: trackingSession.id,
        shareToken: trackingSession.shareToken,
        liveTrackingUrl,
        message: `Alerte envoyee avec suivi en direct. ${contacts.length} contact(s) notifies.`
      });
    } catch (error) {
      console.error("Error creating panic alert:", error);
      res.status(500).json({ error: "Erreur lors de l'envoi de l'alerte" });
    }
  });

  // Endpoint public pour recuperer la position en direct (sans authentification)
  // Securite: expose uniquement les donnees minimales necessaires
  app.get("/api/track/:shareToken", async (req, res) => {
    try {
      const { shareToken } = req.params;

      // Validation du format UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(shareToken)) {
        return res.status(400).json({ error: "Token invalide" });
      }

      const session = await storage.getTrackingSessionByShareToken(shareToken);

      if (!session) {
        return res.status(404).json({ error: "Session de tracking introuvable" });
      }

      // Verifier que la session n'est pas trop ancienne (24h max)
      const sessionAge = Date.now() - new Date(session.startTime).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures
      if (sessionAge > maxAge) {
        return res.status(410).json({ error: "Session expiree" });
      }

      // Recuperer les points de localisation (limites aux 50 derniers pour la confidentialite)
      const allLocations = await storage.getSessionLocationPoints(session.id);
      const locations = allLocations.slice(-50);

      // Recuperer les infos de l'utilisateur - ANONYMISE (prenom uniquement)
      const user = await storage.getUser(session.userId);
      const userName = user?.firstName || 'Utilisateur';

      res.json({
        isActive: session.isActive,
        isPanicMode: session.isPanicMode,
        startTime: session.startTime,
        endTime: session.endTime,
        userName, // Prenom uniquement, pas le nom complet
        locations: locations.map(loc => ({
          latitude: parseFloat(loc.latitude),
          longitude: parseFloat(loc.longitude),
          accuracy: loc.accuracy ? parseFloat(loc.accuracy) : null,
          timestamp: loc.timestamp,
        })),
      });
    } catch (error) {
      console.error("Error fetching live tracking:", error);
      res.status(500).json({ error: "Erreur lors de la recuperation du tracking" });
    }
  });

  app.get("/api/panic-alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getUserPanicAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching panic alerts:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des alertes" });
    }
  });

  // ----------------------------------------
  // ROUTES ANALYSE DES RISQUES ET RECOMMANDATIONS
  // ----------------------------------------
  app.get("/api/risk-zones", async (req, res) => {
    try {
      const { analyzeRiskZones } = await import("./riskAnalysisService");
      const zones = await analyzeRiskZones();
      res.json(zones);
    } catch (error) {
      console.error("Error analyzing risk zones:", error);
      res.status(500).json({ error: "Erreur lors de l'analyse des zones a risque" });
    }
  });

  app.get("/api/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { getPersonalizedRecommendations } = await import("./riskAnalysisService");
      const recommendations = await getPersonalizedRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ error: "Erreur lors de la generation des recommandations" });
    }
  });

  app.get("/api/risk-stats", async (req, res) => {
    try {
      const { getRiskStats } = await import("./riskAnalysisService");
      const stats = await getRiskStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting risk stats:", error);
      res.status(500).json({ error: "Erreur lors de la recuperation des statistiques" });
    }
  });

  // ----------------------------------------
  // ROUTES CHATBOT
  // ----------------------------------------
  let chatStaticDataCache: any = null;
  const chatRequestSchema = insertChatMessageSchema.omit({ role: true });

  app.post("/api/chat", async (req: any, res) => {
    try {
      if (!isAIAvailable()) {
        return res.status(503).json({
          error: "L'assistant IA n'est pas disponible. Veuillez configurer GOOGLE_API_KEY ou GROQ_API_KEY.",
          unavailable: true
        });
      }

      const validationResult = chatRequestSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).toString();
        return res.status(400).json({ error: errorMessage });
      }

      const { sessionId, userId, content } = validationResult.data;

      // Sauvegarder le message de l'utilisateur
      await storage.saveChatMessage({
        sessionId,
        userId: userId || null,
        role: "user",
        content,
      });

      // Récupérer l'historique de la conversation
      const history = await storage.getChatHistory(sessionId);

      // Mapper l'historique au format attendu par le service IA
      const chatMessages = history.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      // Récupérer le contexte de l'application pour enrichir la réponse
      const appContext: any = {};
      
      try {
        const [stats, recentSignalements] = await Promise.all([
          storage.getStats(),
          storage.getSignalements({ limit: 5 })
        ]);
        
        appContext.stats = stats;
        appContext.signalements = recentSignalements;
        
        if (!chatStaticDataCache) {
          const [
            { PHARMACIES_DATA },
            { EMERGENCY_SERVICES },
            { PRESIDENCE_PRIMATURE, MINISTERES },
            { ALL_AGENCES_TELEPHONIE },
            { BANQUES_DATA },
            { GOUVERNORATS, HAUTS_COMMISSARIATS, MAIRIES, PREFECTURES },
            { ALL_AGENCES },
            { RESTAURANTS_DATA },
            { UNIVERSITES_DATA },
          ] = await Promise.all([
            import('./pharmaciesData'),
            import('./urgenciesService'),
            import('./ministeresData'),
            import('./telephonieData'),
            import('./banquesData'),
            import('./mairiesPrefecturesData'),
            import('./sonabelOneaData'),
            import('./restaurantsData'),
            import('./universitesData'),
          ]);
          chatStaticDataCache = {
            pharmacies: PHARMACIES_DATA,
            urgences: EMERGENCY_SERVICES,
            ministeres: [...PRESIDENCE_PRIMATURE, ...MINISTERES],
            telephonie: ALL_AGENCES_TELEPHONIE,
            banques: BANQUES_DATA,
            mairiesPrefectures: [...GOUVERNORATS, ...HAUTS_COMMISSARIATS, ...MAIRIES, ...PREFECTURES],
            sonabelOnea: ALL_AGENCES,
            restaurants: RESTAURANTS_DATA,
            universites: UNIVERSITES_DATA,
          };
        }
        
        Object.assign(appContext, chatStaticDataCache);
      } catch (contextError) {
        console.error("Erreur récupération contexte:", contextError);
      }

      // Appeler le service IA (Gemini avec fallback Groq) avec le contexte
      const { message: assistantMessage, engine } = await generateChatResponse(chatMessages, appContext);

      console.log(`✅ Réponse générée par ${engine === "gemini" ? "Google Gemini" : "Groq LLaMA3"}`);

      // Sauvegarder la réponse de l'assistant
      await storage.saveChatMessage({
        sessionId,
        userId: userId || null,
        role: "assistant",
        content: assistantMessage,
      });

      res.json({ message: assistantMessage, engine });
    } catch (error: any) {
      console.error("Error in chat:", error);

      // Erreur de quota ou service indisponible (case-insensitive)
      const errorMsg = error?.message?.toLowerCase() || "";
      if (errorMsg.includes("quota") || errorMsg.includes("rate limit") || error?.status === 429) {
        return res.status(503).json({
          error: "Le quota d'utilisation de l'assistant IA est temporairement épuisé. Veuillez réessayer dans quelques instants.",
          quotaExceeded: true
        });
      }

      // Erreur générique
      res.status(500).json({ 
        error: error?.message || "Erreur lors du traitement de votre message"
      });
    }
  });

  app.get("/api/chat/history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const history = await storage.getChatHistory(sessionId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
    }
  });

  // ----------------------------------------
  // ROUTES VIE QUOTIDIENNE (PostgreSQL based)
  // ----------------------------------------

  // Pharmacies
  app.get("/api/pharmacies", async (req, res) => {
    try {
      const { region, typeGarde, search } = req.query;
      // Use local PHARMACIES_DATA as primary source (has accurate guard status)
      let pharmacies = getMergedPharmacies();

      if (search) {
        const query = (search as string).toLowerCase();
        pharmacies = pharmacies.filter((p: any) =>
          p.nom?.toLowerCase().includes(query) ||
          p.ville?.toLowerCase().includes(query) ||
          p.quartier?.toLowerCase().includes(query) ||
          p.adresse?.toLowerCase().includes(query)
        );
      }
      if (region && region !== "all") {
        pharmacies = pharmacies.filter((p: any) => p.region === region);
      }
      if (typeGarde && typeGarde !== "all") {
        pharmacies = pharmacies.filter((p: any) => p.typeGarde === typeGarde);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        pharmacies,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des pharmacies" });
    }
  });

  app.get("/api/pharmacies/stats", async (req, res) => {
    try {
      const result = await overpassService.getPlaces({ placeType: "pharmacy" });
      const pharmacies = result.places || [];
      const total = pharmacies.length;
      const par24h = pharmacies.filter(p => (p.tags as any)?.opening_hours?.includes("24")).length;
      
      res.json({
        total,
        par24h,
        lastUpdate: new Date(),
        source: "PostgreSQL"
      });
    } catch (error) {
      console.error("Erreur stats pharmacies:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });



  // Restaurants
  app.get("/api/restaurants", async (req, res) => {
    try {
      const { region, type, search } = req.query;
      const { RESTAURANTS_DATA } = await import("./restaurantsData");
      
      const osmRestaurants = await overpassService.getPlaces({ placeType: "restaurant" });
      const osmFastFood = await overpassService.getPlaces({ placeType: "fast_food" });
      const osmCafe = await overpassService.getPlaces({ placeType: "cafe" });
      const osmBar = await overpassService.getPlaces({ placeType: "bar" });
      const osmPub = await overpassService.getPlaces({ placeType: "pub" });
      const osmIceCream = await overpassService.getPlaces({ placeType: "ice_cream" });
      const osmFoodCourt = await overpassService.getPlaces({ placeType: "food_court" });

      const allOsm = [
        ...osmRestaurants.places,
        ...osmFastFood.places,
        ...osmCafe.places,
        ...osmBar.places,
        ...osmPub.places,
        ...osmIceCream.places,
        ...osmFoodCourt.places
      ];
      
      console.log(`[API] Restaurants found in DB: ${allOsm.length}`);
      
      // Fallback si la DB est vide
      if (allOsm.length === 0 && !search && (!region || region === "all") && (!type || type === "all")) {
        console.log("[API] Aucun restaurant trouvé dans la DB, lancement de la synchronisation...");
        // Sync minimal sets to get started
        try {
          // Utilisation de Promise.all pour accélérer la synchronisation initiale
          await Promise.all([
            overpassService.syncPlaceType("restaurant"),
            overpassService.syncPlaceType("fast_food"),
            overpassService.syncPlaceType("cafe"),
            overpassService.syncPlaceType("bar")
          ]);
          
          // Re-fetch after sync to ensure we have data
          const [retryRestaurants, retryFastFood, retryCafe, retryBar] = await Promise.all([
            overpassService.getPlaces({ placeType: "restaurant" }),
            overpassService.getPlaces({ placeType: "fast_food" }),
            overpassService.getPlaces({ placeType: "cafe" }),
            overpassService.getPlaces({ placeType: "bar" })
          ]);
          
          const retryAllOsm = [
            ...(retryRestaurants.places || []),
            ...(retryFastFood.places || []),
            ...(retryCafe.places || []),
            ...(retryBar.places || [])
          ];
          
          if (retryAllOsm.length > 0) {
            let transformedRestaurants = retryAllOsm.map((p, i) => transformOsmToRestaurant(p, i));
            let combined = [...RESTAURANTS_DATA];
            transformedRestaurants.forEach(osmRest => {
              const isDuplicate = combined.some(localRest => 
                localRest.nom.toLowerCase() === osmRest.nom.toLowerCase() ||
                (Math.abs(localRest.latitude - osmRest.latitude) < 0.0001 && 
                 Math.abs(localRest.longitude - osmRest.longitude) < 0.0001)
              );
              if (!isDuplicate) combined.push(osmRest as any);
            });
            
            return res.json({
              restaurants: combined,
              lastUpdated: new Date().toISOString()
            });
          }
        } catch (syncError) {
          console.error("Error during initial restaurant sync:", syncError);
        }
      }

      let transformedRestaurants = allOsm.map((p, i) => transformOsmToRestaurant(p, i));
      
      // Merge with local data
      let combined = [...RESTAURANTS_DATA];
      transformedRestaurants.forEach(osmRest => {
        const isDuplicate = combined.some(localRest => 
          localRest.nom.toLowerCase() === osmRest.nom.toLowerCase() ||
          (Math.abs(localRest.latitude - osmRest.latitude) < 0.0001 && 
           Math.abs(localRest.longitude - osmRest.longitude) < 0.0001)
        );
        if (!isDuplicate) combined.push(osmRest as any);
      });

      if (search) {
        const query = (search as string).toLowerCase();
        combined = combined.filter(r =>
          r.nom.toLowerCase().includes(query) ||
          r.ville?.toLowerCase().includes(query) ||
          r.quartier?.toLowerCase().includes(query) ||
          r.type?.toLowerCase().includes(query)
        );
      }
      if (region && region !== "all") {
        combined = combined.filter(r => r.region === region);
      }
      if (type && type !== "all") {
        combined = combined.filter(r => r.type === type);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        restaurants: combined,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des restaurants" });
    }
  });

  app.get("/api/restaurants/stats", async (req, res) => {
    try {
      const result = await overpassService.getPlaces({ placeType: "restaurant" });
      const restaurants = result.places || [];
      
      const parType: Record<string, number> = {};
      const parRegion: Record<string, number> = {};
      const villes = new Set<string>();
      let avecLivraison = 0;
      let avecWifi = 0;
      let fromGoogle = 0;
      
      restaurants.forEach((r, i) => {
        const transformed = transformOsmToRestaurant(r, i);
        parType[transformed.type] = (parType[transformed.type] || 0) + 1;
        if (transformed.region) {
          parRegion[transformed.region] = (parRegion[transformed.region] || 0) + 1;
        }
        if (transformed.ville) {
          villes.add(transformed.ville);
        }
        if (transformed.livraison) avecLivraison++;
        if (transformed.wifi) avecWifi++;
        if (r.source === "Google") fromGoogle++;
      });

      res.json({
        total: restaurants.length,
        avecLivraison,
        avecWifi,
        fromGoogle,
        parType,
        parRegion,
        nombreVilles: villes.size,
        lastUpdate: new Date(),
        source: "OpenStreetMap"
      });
    } catch (error) {
      console.error("Erreur stats restaurants:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Stations-service
  app.get("/api/stations", async (req, res) => {
    try {
      const { region, search } = req.query;
      const result = await overpassService.getPlaces({ placeType: "fuel" });
      const dbPlaces = result.places || [];
      const lastUpdated = result.lastUpdated;
      let stations = dbPlaces.map(transformOsmToStation);

      if (search) {
        const query = (search as string).toLowerCase();
        stations = stations.filter(s =>
          s.nom?.toLowerCase().includes(query) ||
          s.ville?.toLowerCase().includes(query) ||
          s.marque?.toLowerCase().includes(query)
        );
      }
      if (region && region !== "all") {
        stations = stations.filter(s => s.region === region);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        stations,
        lastUpdated: lastUpdated?.toISOString() || new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching stations:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des stations" });
    }
  });

  app.get("/api/stations/stats", async (req, res) => {
    try {
      const result = await overpassService.getPlaces({ placeType: "fuel" });
      const stations = result.places || [];
      
      const parMarque: Record<string, number> = {};
      const parRegion: Record<string, number> = {};
      const villes = new Set<string>();
      
      stations.forEach(s => {
        const transformed = transformOsmToStation(s);
        parMarque[transformed.marque] = (parMarque[transformed.marque] || 0) + 1;
        if (transformed.region) {
          parRegion[transformed.region] = (parRegion[transformed.region] || 0) + 1;
        }
        if (transformed.ville) {
          villes.add(transformed.ville);
        }
      });

      res.json({
        total: stations.length,
        par24h: stations.filter(s => (s.tags as any)?.opening_hours?.includes("24")).length,
        parMarque,
        parRegion,
        nombreVilles: villes.size,
        lastUpdate: new Date(),
        source: "PostgreSQL"
      });
    } catch (error) {
      console.error("Erreur stats stations:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // Banques et GAB
  app.get("/api/banques", async (req, res) => {
    try {
      const { region, search } = req.query;
      const resultBanks = await overpassService.getPlaces({ placeType: "bank" });
      const resultAtms = await overpassService.getPlaces({ placeType: "atm" });
      const banks = resultBanks.places || [];
      const atms = resultAtms.places || [];
      let allBanks = [...banks, ...atms].map(transformOsmToBanque);

      if (search) {
        const query = (search as string).toLowerCase();
        allBanks = allBanks.filter(b => b.nom.toLowerCase().includes(query));
      }
      if (region && region !== "all") {
        allBanks = allBanks.filter(b => b.region === region);
      }

      res.json(allBanks);
    } catch (error) {
      console.error("Error fetching banks:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des banques" });
    }
  });

  // Boutiques et Commerces
  app.get("/api/boutiques", async (req, res) => {
    try {
      const { region, categorie, search } = req.query;
      const result = await overpassService.getPlaces({ placeType: "shop" });
      const shops = result.places || [];
      const lastUpdated = result.lastUpdated;
      
      // Combiner les données statiques (BOUTIQUES_DATA) et les données dynamiques (OSM)
      let boutiques = [
        ...BOUTIQUES_DATA,
        ...(shops || []).map(transformOsmToBoutique)
      ];

      if (search) {
        const query = (search as string).toLowerCase();
        boutiques = boutiques.filter(b => b.nom.toLowerCase().includes(query));
      }
      if (region && region !== "all") {
        boutiques = boutiques.filter(b => b.region === region);
      }
      if (categorie && categorie !== "all") {
        boutiques = boutiques.filter(b => b.categorie === categorie);
      }

      res.json({
        boutiques,
        lastUpdated: lastUpdated?.toISOString() || new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching shops:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des boutiques" });
    }
  });

  // Marchés
  app.get("/api/marches", async (req, res) => {
    try {
      const { region, search } = req.query;
      let result = await overpassService.getPlaces({ placeType: "marketplace" });
      let dbPlaces = result.places || [];
      let lastUpdated = result.lastUpdated;
      
      console.log(`[API] Requête Marchés: ${dbPlaces.length} lieux trouvés dans la DB`);
      
      if (dbPlaces.length === 0) {
        console.log("[API] Aucun marché trouvé dans la DB, utilisation des données de secours...");
        const fallbackData = overpassService["getFallbackPlaces"]("marketplace");
        // Injecter les données de secours dans la DB pour les prochaines requêtes
        for (const p of fallbackData) {
          try {
            await db.insert(places).values(p).onConflictDoNothing();
          } catch (e) {}
        }
        const retry = await overpassService.getPlaces({ placeType: "marketplace" });
        dbPlaces = retry.places;
        lastUpdated = retry.lastUpdated;
      }

      let marches = dbPlaces.map(transformOsmToMarche);

      if (search) {
        const query = (search as string).toLowerCase();
        marches = marches.filter(m => m.nom.toLowerCase().includes(query));
      }
      if (region && region !== "all") {
        marches = marches.filter(m => m.region === region);
      }

      res.json({
        marches,
        lastUpdated: lastUpdated?.toISOString() || new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching markets:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des marchés" });
    }
  });

  // ----------------------------------------
  // ROUTES FIABILITE - CONFIRMATION ET SIGNALEMENT
  // ----------------------------------------
  
  // Stocker les confirmations et signalements en mémoire (en production, utiliser la base de données)
  const placeInteractions: Record<string, { confirmations: number; reports: number; confirmedBy: Set<string>; reportedBy: Set<string> }> = {};
  
  app.post("/api/places/:placeType/:placeId/confirm", async (req, res) => {
    try {
      const { placeType, placeId } = req.params;
      const key = `${placeType}-${placeId}`;
      const userIp = req.ip || req.socket.remoteAddress || "anonymous";
      
      if (!placeInteractions[key]) {
        placeInteractions[key] = { confirmations: 0, reports: 0, confirmedBy: new Set(), reportedBy: new Set() };
      }
      
      // Vérifier si l'utilisateur a déjà confirmé
      if (placeInteractions[key].confirmedBy.has(userIp)) {
        return res.status(400).json({ error: "Vous avez deja confirme cette information" });
      }
      
      placeInteractions[key].confirmations++;
      placeInteractions[key].confirmedBy.add(userIp);
      
      res.json({ 
        success: true, 
        confirmations: placeInteractions[key].confirmations,
        reports: placeInteractions[key].reports
      });
    } catch (error) {
      console.error("Erreur confirmation:", error);
      res.status(500).json({ error: "Erreur lors de la confirmation" });
    }
  });
  
  app.post("/api/places/:placeType/:placeId/report", async (req, res) => {
    try {
      const { placeType, placeId } = req.params;
      const key = `${placeType}-${placeId}`;
      const userIp = req.ip || req.socket.remoteAddress || "anonymous";
      
      if (!placeInteractions[key]) {
        placeInteractions[key] = { confirmations: 0, reports: 0, confirmedBy: new Set(), reportedBy: new Set() };
      }
      
      // Vérifier si l'utilisateur a déjà signalé
      if (placeInteractions[key].reportedBy.has(userIp)) {
        return res.status(400).json({ error: "Vous avez deja signale cette information" });
      }
      
      placeInteractions[key].reports++;
      placeInteractions[key].reportedBy.add(userIp);
      
      res.json({ 
        success: true, 
        confirmations: placeInteractions[key].confirmations,
        reports: placeInteractions[key].reports
      });
    } catch (error) {
      console.error("Erreur signalement:", error);
      res.status(500).json({ error: "Erreur lors du signalement" });
    }
  });
  
  app.get("/api/places/:placeType/:placeId/interactions", async (req, res) => {
    try {
      const { placeType, placeId } = req.params;
      const key = `${placeType}-${placeId}`;
      
      const data = placeInteractions[key] || { confirmations: 0, reports: 0 };
      res.json({ 
        confirmations: data.confirmations,
        reports: data.reports
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur" });
    }
  });



  // ----------------------------------------
  // ROUTES MARCHÉS
  // ----------------------------------------
  app.get("/api/marches", async (req, res) => {
    try {
      const { region, ville, search } = req.query;
      const result = await overpassService.getPlaces({
        placeType: "marketplace",
        region: region as string,
        ville: ville as string,
        search: search as string,
      });
      const dbPlaces = result.places || [];

      const marches = dbPlaces.map(p => transformOsmToMarche(p));
      res.set('Cache-Control', 'public, max-age=3600');
      res.json(marches);
    } catch (error) {
      console.error("Erreur récupération marchés:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des marchés" });
    }
  });

  // ----------------------------------------
  // ROUTES MAIRIES & PREFECTURES
  // ----------------------------------------
  app.get("/api/mairies-prefectures", async (req, res) => {
    try {
      const { region, type, search, province } = req.query;
      const { ALL_INSTITUTIONS } = await import("./mairiesPrefecturesData");

      let institutions = [...ALL_INSTITUTIONS];

      if (search) {
        const query = (search as string).toLowerCase();
        institutions = institutions.filter(i =>
          i.nom.toLowerCase().includes(query) ||
          i.ville.toLowerCase().includes(query) ||
          i.province.toLowerCase().includes(query) ||
          i.adresse.toLowerCase().includes(query) ||
          i.services.some(s => s.toLowerCase().includes(query))
        );
      }
      if (type && type !== "all") {
        institutions = institutions.filter(i => i.type === type);
      }
      if (region && region !== "all") {
        institutions = institutions.filter(i => i.region === region);
      }
      if (province && province !== "all") {
        institutions = institutions.filter(i => i.province === province);
      }

      institutions.sort((a, b) => {
        const typeOrder: Record<string, number> = { "Gouvernorat": 0, "Haut-Commissariat": 1, "Prefecture": 2, "Mairie": 3 };
        const diff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
        if (diff !== 0) return diff;
        return a.nom.localeCompare(b.nom);
      });

      const mairieCount = institutions.filter(i => i.type === "Mairie").length;
      const prefectureCount = institutions.filter(i => i.type === "Prefecture").length;
      const hautCommCount = institutions.filter(i => i.type === "Haut-Commissariat").length;
      const gouvernoratCount = institutions.filter(i => i.type === "Gouvernorat").length;
      const villes = new Set(institutions.map(i => i.ville));

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        institutions,
        total: institutions.length,
        mairieCount,
        prefectureCount,
        hautCommCount,
        gouvernoratCount,
        villesCount: villes.size,
      });
    } catch (error) {
      console.error("Erreur recuperation mairies/prefectures:", error);
      res.status(500).json({ error: "Erreur lors de la recuperation des institutions" });
    }
  });

  // ----------------------------------------
  // ROUTES SONABEL & ONEA
  // ----------------------------------------
  app.get("/api/sonabel-onea", async (req, res) => {
    try {
      const { region, societe, type, search } = req.query;
      const { ALL_AGENCES } = await import("./sonabelOneaData");

      let agences = [...ALL_AGENCES];

      if (search) {
        const query = (search as string).toLowerCase();
        agences = agences.filter(a =>
          a.nom.toLowerCase().includes(query) ||
          a.ville.toLowerCase().includes(query) ||
          a.quartier.toLowerCase().includes(query) ||
          a.adresse.toLowerCase().includes(query) ||
          a.services.some(s => s.toLowerCase().includes(query))
        );
      }
      if (societe && societe !== "all") {
        agences = agences.filter(a => a.societe === societe);
      }
      if (type && type !== "all") {
        agences = agences.filter(a => a.type === type);
      }
      if (region && region !== "all") {
        agences = agences.filter(a => a.region === region);
      }

      agences.sort((a, b) => {
        const typeOrder: Record<string, number> = { "Siege": 0, "Direction Regionale": 1, "Agence Commerciale": 2, "Centre": 3, "Antenne": 4 };
        const diff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
        if (diff !== 0) return diff;
        return a.nom.localeCompare(b.nom);
      });

      const sonabelCount = agences.filter(a => a.societe === "SONABEL").length;
      const oneaCount = agences.filter(a => a.societe === "ONEA").length;
      const villes = new Set(agences.map(a => a.ville));

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        agences,
        total: agences.length,
        sonabelCount,
        oneaCount,
        villesCount: villes.size,
      });
    } catch (error) {
      console.error("Erreur recuperation agences SONABEL/ONEA:", error);
      res.status(500).json({ error: "Erreur lors de la recuperation des agences" });
    }
  });

  app.get("/api/lieux-de-culte", async (req, res) => {
    try {
      const { region, type, religion, search } = req.query;

      let response = await overpassService.getPlaces({ placeType: "place_of_worship" });
      let allPlaces = response.places || [];

      if (allPlaces.length < 10) {
        console.log("[API] Peu de lieux de culte trouves, lancement de la synchronisation OSM...");
        try {
          await overpassService.syncPlaceType("place_of_worship");
          response = await overpassService.getPlaces({ placeType: "place_of_worship" });
          allPlaces = response.places || [];
        } catch (syncError) {
          console.error("Erreur sync lieux de culte:", syncError);
        }
      }

      const uniqueIds = new Set<string>();
      const uniquePlaces = allPlaces.filter(p => {
        const key = `${p.latitude}-${p.longitude}`;
        if (uniqueIds.has(key)) return false;
        uniqueIds.add(key);
        return true;
      });

      let lieux = uniquePlaces.map(p => transformOsmToLieuDeCulte(p));

      if (search) {
        const query = (search as string).toLowerCase();
        lieux = lieux.filter(l =>
          l.nom.toLowerCase().includes(query) ||
          l.ville.toLowerCase().includes(query) ||
          l.quartier.toLowerCase().includes(query) ||
          l.type.toLowerCase().includes(query) ||
          l.religion.toLowerCase().includes(query)
        );
      }
      if (region && region !== "all") {
        lieux = lieux.filter(l => l.region === region);
      }
      if (type && type !== "all") {
        lieux = lieux.filter(l => l.type === type);
      }
      if (religion && religion !== "all") {
        lieux = lieux.filter(l => l.religion === religion);
      }

      lieux.sort((a, b) => a.nom.localeCompare(b.nom));

      const stats = {
        total: lieux.length,
        mosquees: lieux.filter(l => l.religion === "Islam").length,
        eglises: lieux.filter(l => ["Catholique", "Protestant / Evangelique", "Chretien"].includes(l.religion)).length,
        traditionnels: lieux.filter(l => l.religion === "Traditionnel").length,
        autres: lieux.filter(l => l.religion === "Autre").length,
      };

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({ lieux, ...stats });
    } catch (error) {
      console.error("Erreur recuperation lieux de culte:", error);
      res.status(500).json({ error: "Erreur lors de la recuperation des lieux de culte" });
    }
  });

  app.get("/api/ministeres", async (req, res) => {
    try {
      const { rang, search } = req.query;
      const { MINISTERES, PRESIDENCE_PRIMATURE } = await import("./ministeresData");

      let ministeres = [...MINISTERES];
      const institutions = [...PRESIDENCE_PRIMATURE];

      if (search) {
        const query = (search as string).toLowerCase();
        ministeres = ministeres.filter(m =>
          m.nom.toLowerCase().includes(query) ||
          m.nomCourt.toLowerCase().includes(query) ||
          m.ministre.toLowerCase().includes(query) ||
          m.domaines.some(d => d.toLowerCase().includes(query)) ||
          m.attributions.some(a => a.toLowerCase().includes(query))
        );
      }
      if (rang && rang !== "all") {
        ministeres = ministeres.filter(m => m.rang === rang);
      }

      const rangOrder: Record<string, number> = { "Ministre d'Etat": 0, "Ministre": 1, "Ministre Delegue": 2 };
      ministeres.sort((a, b) => {
        const diff = (rangOrder[a.rang] ?? 99) - (rangOrder[b.rang] ?? 99);
        if (diff !== 0) return diff;
        return a.nom.localeCompare(b.nom);
      });

      const ministresEtat = ministeres.filter(m => m.rang === "Ministre d'Etat").length;
      const ministresCount = ministeres.filter(m => m.rang === "Ministre").length;
      const deleguesCount = ministeres.filter(m => m.rang === "Ministre Delegue").length;

      res.set('Cache-Control', 'no-cache');
      res.json({
        institutions,
        ministeres,
        total: ministeres.length,
        ministresEtat,
        ministresCount,
        deleguesCount,
      });
    } catch (error) {
      console.error("Erreur recuperation ministeres:", error);
      res.status(500).json({ error: "Erreur lors de la recuperation des ministeres" });
    }
  });

  app.get("/api/telephonie", async (req, res) => {
    try {
      const { region, operateur, type, search } = req.query;
      const { ALL_AGENCES_TELEPHONIE } = await import("./telephonieData");

      let agences = [...ALL_AGENCES_TELEPHONIE];

      if (search) {
        const query = (search as string).toLowerCase();
        agences = agences.filter(a =>
          a.nom.toLowerCase().includes(query) ||
          a.ville.toLowerCase().includes(query) ||
          a.quartier.toLowerCase().includes(query) ||
          a.adresse.toLowerCase().includes(query) ||
          a.operateur.toLowerCase().includes(query) ||
          a.services.some(s => s.toLowerCase().includes(query))
        );
      }
      if (operateur && operateur !== "all") {
        agences = agences.filter(a => a.operateur === operateur);
      }
      if (type && type !== "all") {
        agences = agences.filter(a => a.type === type);
      }
      if (region && region !== "all") {
        agences = agences.filter(a => a.region === region);
      }

      agences.sort((a, b) => {
        const typeOrder: Record<string, number> = { "Direction": 0, "Agence Principale": 1, "Centre de Service": 2, "Boutique": 3, "Point de Vente": 4 };
        const diff = (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
        if (diff !== 0) return diff;
        return a.nom.localeCompare(b.nom);
      });

      const orangeCount = agences.filter(a => a.operateur === "Orange Burkina").length;
      const moovCount = agences.filter(a => a.operateur === "Moov Africa").length;
      const telecelCount = agences.filter(a => a.operateur === "Telecel Faso").length;
      const villes = new Set(agences.map(a => a.ville));

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        agences,
        total: agences.length,
        orangeCount,
        moovCount,
        telecelCount,
        villesCount: villes.size,
      });
    } catch (error) {
      console.error("Erreur recuperation agences telephonie:", error);
      res.status(500).json({ error: "Erreur lors de la recuperation des agences de telephonie" });
    }
  });

  // ----------------------------------------
  // ROUTES CIMETIERES
  // ----------------------------------------
  app.get("/api/cimetieres", async (req, res) => {
    try {
      const { region, search } = req.query;

      const [cemeteries, graveYards] = await Promise.all([
        overpassService.getPlaces({ placeType: "cemetery" }),
        overpassService.getPlaces({ placeType: "grave_yard" })
      ]);

      let allPlaces = [
        ...(cemeteries.places || []),
        ...(graveYards.places || [])
      ];

      if (allPlaces.length < 5) {
        console.log("[API] Peu de cimetieres trouves, lancement de la synchronisation OSM...");
        try {
          await Promise.all([
            overpassService.syncPlaceType("cemetery"),
            overpassService.syncPlaceType("grave_yard")
          ]);
          const [retryCem, retryGrave] = await Promise.all([
            overpassService.getPlaces({ placeType: "cemetery" }),
            overpassService.getPlaces({ placeType: "grave_yard" })
          ]);
          allPlaces = [
            ...(retryCem.places || []),
            ...(retryGrave.places || [])
          ];
        } catch (syncError) {
          console.error("Erreur sync cimetieres:", syncError);
        }
      }

      const uniqueIds = new Set<string>();
      const uniquePlaces = allPlaces.filter(p => {
        const key = `${p.latitude}-${p.longitude}`;
        if (uniqueIds.has(key)) return false;
        uniqueIds.add(key);
        return true;
      });

      let cimetieres = uniquePlaces.map(p => transformOsmToCimetiere(p));

      if (search) {
        const query = (search as string).toLowerCase();
        cimetieres = cimetieres.filter(c =>
          c.nom.toLowerCase().includes(query) ||
          c.ville.toLowerCase().includes(query) ||
          c.quartier.toLowerCase().includes(query)
        );
      }
      if (region && region !== "all") {
        cimetieres = cimetieres.filter(c => c.region === region);
      }

      cimetieres.sort((a, b) => a.nom.localeCompare(b.nom));

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({ cimetieres, total: cimetieres.length });
    } catch (error) {
      console.error("Erreur recuperation cimetieres:", error);
      res.status(500).json({ error: "Erreur lors de la recuperation des cimetieres" });
    }
  });

  // ----------------------------------------
  // ROUTES BOUTIQUES (duplicate removed - using combined route above)
  // ----------------------------------------

  // ----------------------------------------
  // ROUTES UNIVERSITES
  // ----------------------------------------
  app.get("/api/universites", async (req, res) => {
    try {
      const { region, search } = req.query;
      
      // Récupérer tous les types d'établissements d'enseignement supérieur
      const [universities, colleges, researchInstitutes] = await Promise.all([
        overpassService.getPlaces({ placeType: "university" }),
        overpassService.getPlaces({ placeType: "college" }),
        overpassService.getPlaces({ placeType: "research_institute" })
      ]);
      
      let allPlaces = [
        ...(universities.places || []),
        ...(colleges.places || []),
        ...(researchInstitutes.places || [])
      ];
      
      let lastUpdated = universities.lastUpdated || colleges.lastUpdated || researchInstitutes.lastUpdated;

      // Si aucune donnée, lancer la synchronisation OSM
      if (allPlaces.length < 10) {
        console.log("[API] Peu d'universités trouvées, lancement de la synchronisation OSM...");
        try {
          await Promise.all([
            overpassService.syncPlaceType("university"),
            overpassService.syncPlaceType("college"),
            overpassService.syncPlaceType("research_institute")
          ]);
          
          // Re-fetch après sync
          const [retryUni, retryCollege, retryResearch] = await Promise.all([
            overpassService.getPlaces({ placeType: "university" }),
            overpassService.getPlaces({ placeType: "college" }),
            overpassService.getPlaces({ placeType: "research_institute" })
          ]);
          
          allPlaces = [
            ...(retryUni.places || []),
            ...(retryCollege.places || []),
            ...(retryResearch.places || [])
          ];
          lastUpdated = new Date();
          console.log(`[API] Synchronisation terminée: ${allPlaces.length} établissements trouvés`);
        } catch (syncError) {
          console.error("Erreur sync universités OSM:", syncError);
        }
      }
      
      // Transformer les données avec plus de détails
      let universites = allPlaces.map(transformOsmToUniversity);
      
      // Filtrer par région si spécifié
      if (region && region !== "all") {
        universites = universites.filter(u => u.region === region);
      }
      
      // Filtrer par recherche si spécifié
      if (search) {
        const query = (search as string).toLowerCase();
        universites = universites.filter(u => 
          u.name.toLowerCase().includes(query) ||
          u.ville.toLowerCase().includes(query) ||
          u.type.toLowerCase().includes(query)
        );
      }
      
      // Trier: universités d'abord, puis par nom
      universites.sort((a, b) => {
        if (a.type === "Université" && b.type !== "Université") return -1;
        if (a.type !== "Université" && b.type === "Université") return 1;
        return a.name.localeCompare(b.name, 'fr');
      });

      res.json({
        universites,
        total: universites.length,
        lastUpdated: lastUpdated?.toISOString() || new Date().toISOString()
      });
    } catch (error) {
      console.error("Erreur récupération universités:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des universités" });
    }
  });

  // ----------------------------------------
  // ROUTES BANQUES ET CAISSES POPULAIRES
  // ----------------------------------------
  app.get("/api/banques", async (req, res) => {
    try {
      const { BANQUES_DATA } = await import("./banquesData");
      const { region, type, categorie, search, hasGAB, importanceSystemique } = req.query;

      // Récupérer les données codées en dur
      let banques: any[] = [...BANQUES_DATA];

      // Ajouter les données OSM (banques, bureaux de change, transferts d'argent)
      try {
        const resultBanks = await overpassService.getPlaces({ placeType: "bank" });
        const resultBureauChange = await overpassService.getPlaces({ placeType: "bureau_de_change" });
        const resultMoneyTransfer = await overpassService.getPlaces({ placeType: "money_transfer" });
        
        const osmBanks = resultBanks.places || [];
        const osmBureauChange = resultBureauChange.places || [];
        const osmMoneyTransfer = resultMoneyTransfer.places || [];
        
        const allOsmPlaces = [...osmBanks, ...osmBureauChange, ...osmMoneyTransfer];
        const osmTransformed = allOsmPlaces.map(p => transformOsmToBanque(p));
        banques = [...banques, ...osmTransformed];
      } catch (osmError) {
        console.error("Erreur chargement OSM banques:", osmError);
      }

      if (search) {
        const query = (search as string).toLowerCase();
        banques = banques.filter(b =>
          b.nom.toLowerCase().includes(query) ||
          b.sigle?.toLowerCase().includes(query) ||
          b.ville?.toLowerCase().includes(query) ||
          b.quartier?.toLowerCase().includes(query) ||
          b.type?.toLowerCase().includes(query) ||
          (b.services && b.services.some((s: string) => s.toLowerCase().includes(query)))
        );
      }

      if (region && region !== "all") {
        banques = banques.filter(b => b.region === region);
      }

      if (type && type !== "all") {
        banques = banques.filter(b => b.type === type);
      }

      if (categorie && categorie !== "all") {
        banques = banques.filter(b => b.categorie === categorie);
      }

      if (hasGAB === "true") {
        banques = banques.filter(b => b.hasGAB || b.nombreGAB > 0);
      }

      if (importanceSystemique === "true") {
        banques = banques.filter(b => b.importanceSystemique);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json(banques);
    } catch (error) {
      console.error("Erreur récupération banques:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des banques" });
    }
  });

  app.get("/api/banques/stats", async (req, res) => {
    try {
      const { BANQUES_DATA } = await import("./banquesData");
      
      // Récupérer les données OSM
      let osmBanques: any[] = [];
      try {
        const resultBanks = await overpassService.getPlaces({ placeType: "bank" });
        const resultBureauChange = await overpassService.getPlaces({ placeType: "bureau_de_change" });
        const resultMoneyTransfer = await overpassService.getPlaces({ placeType: "money_transfer" });

        const osmBanks = resultBanks.places || [];
        const osmBureauChange = resultBureauChange.places || [];
        const osmMoneyTransfer = resultMoneyTransfer.places || [];

        osmBanques = [...osmBanks, ...osmBureauChange, ...osmMoneyTransfer].map(p => transformOsmToBanque(p));
      } catch (e) {}
      
      // Combiner les données locales et OSM
      const allBanques = [...BANQUES_DATA, ...osmBanques];
      
      // Calculer les statistiques attendues par le frontend
      const banques = allBanques.filter(b => b.type === "Banque").length;
      const caissesPopulaires = allBanques.filter(b => b.type === "Caisse Populaire").length;
      const microfinance = allBanques.filter(b => b.type === "Microfinance").length;
      const avecGAB = allBanques.filter(b => b.hasGAB || (b.nombreGAB && b.nombreGAB > 0)).length;
      const totalGAB = allBanques.reduce((sum, b) => sum + (b.nombreGAB || 0), 0);
      const importanceSystemique = allBanques.filter(b => b.importanceSystemique).length;
      
      // Répartitions
      const parType: Record<string, number> = {};
      const parCategorie: Record<string, number> = {};
      const parRegion: Record<string, number> = {};
      const villes = new Set<string>();
      
      allBanques.forEach(b => {
        if (b.type) parType[b.type] = (parType[b.type] || 0) + 1;
        if (b.categorie) parCategorie[b.categorie] = (parCategorie[b.categorie] || 0) + 1;
        if (b.region) parRegion[b.region] = (parRegion[b.region] || 0) + 1;
        if (b.ville) villes.add(b.ville);
      });
      
      res.json({
        total: allBanques.length,
        banques,
        caissesPopulaires,
        microfinance,
        avecGAB,
        totalGAB,
        totalAgences: allBanques.length,
        importanceSystemique,
        parType,
        parCategorie,
        parRegion,
        nombreVilles: villes.size,
        localCount: BANQUES_DATA.length,
        osmCount: osmBanques.length,
        source: "OSM + Local"
      });
    } catch (error) {
      console.error("Erreur stats banques:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ----------------------------------------
  // ROUTES PHARMACIES (nouvelle version avec données hardcodées)
  // ----------------------------------------
  app.get("/api/pharmacies/v2", async (req, res) => {
    try {
      const { PHARMACIES_DATA } = await import("./pharmaciesData");
      const { region, type, search, is24h, gardeNuit } = req.query;

      let pharmacies = [...PHARMACIES_DATA];

      if (search) {
        const query = (search as string).toLowerCase();
        pharmacies = pharmacies.filter(p =>
          p.nom.toLowerCase().includes(query) ||
          p.ville.toLowerCase().includes(query) ||
          p.quartier.toLowerCase().includes(query) ||
          p.type.toLowerCase().includes(query) ||
          p.services.some(s => s.toLowerCase().includes(query)) ||
          p.specialites.some(s => s.toLowerCase().includes(query))
        );
      }

      if (region && region !== "all") {
        pharmacies = pharmacies.filter(p => p.region === region);
      }

      if (type && type !== "all") {
        pharmacies = pharmacies.filter(p => p.type === type);
      }

      if (is24h === "true") {
        pharmacies = pharmacies.filter(p => p.is24h);
      }

      if (gardeNuit === "true") {
        pharmacies = pharmacies.filter(p => p.gardeNuit);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json(pharmacies);
    } catch (error) {
      console.error("Erreur récupération pharmacies v2:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des pharmacies" });
    }
  });

  app.get("/api/pharmacies/v2/stats", async (req, res) => {
    try {
      const { getPharmaciesStats } = await import("./pharmaciesData");
      const stats = getPharmaciesStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats pharmacies v2:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  // ----------------------------------------
  // ROUTES STATIONS-SERVICE
  // ----------------------------------------
  app.get("/api/stations", async (req, res) => {
    try {
      const { stationsService } = await import("./stationsService");
      const { region, marque, ville, search, is24h } = req.query;

      // Récupérer les données du service existant
      let stations: any[] = stationsService.getAllStations();

      // Ajouter les données OSM (fuel, car_wash)
      try {
        const resultFuel = await overpassService.getPlaces({ placeType: "fuel" });
        const resultCarWash = await overpassService.getPlaces({ placeType: "car_wash" });
        
        const osmFuel = resultFuel.places || [];
        const osmCarWash = resultCarWash.places || [];
        
        const allOsmPlaces = [...osmFuel, ...osmCarWash];
        const osmTransformed = allOsmPlaces.map(p => transformOsmToStation(p));
        stations = [...stations, ...osmTransformed];
      } catch (osmError) {
        console.error("Erreur chargement OSM stations:", osmError);
      }

      // Appliquer les filtres
      if (search) {
        const query = (search as string).toLowerCase();
        stations = stations.filter(s =>
          s.nom?.toLowerCase().includes(query) ||
          s.ville?.toLowerCase().includes(query) ||
          s.quartier?.toLowerCase().includes(query) ||
          s.marque?.toLowerCase().includes(query) ||
          s.adresse?.toLowerCase().includes(query)
        );
      }

      if (region && region !== "all") {
        stations = stations.filter(s => s.region === region);
      }

      if (marque && marque !== "all") {
        stations = stations.filter(s => s.marque === marque);
      }

      if (ville) {
        stations = stations.filter(s => s.ville?.toLowerCase().includes((ville as string).toLowerCase()));
      }

      if (is24h === "true") {
        stations = stations.filter(s => s.is24h);
      }

      res.set('Cache-Control', 'public, max-age=3600');
      res.json(stations);
    } catch (error) {
      console.error("Erreur récupération stations:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des stations" });
    }
  });

  app.get("/api/stations/stats", async (req, res) => {
    try {
      const { stationsService } = await import("./stationsService");
      const localStats = stationsService.getStats();
      
      // Compter les données OSM
      let osmCount = 0;
      try {
        const resultFuel = await overpassService.getPlaces({ placeType: "fuel" });
        const resultCarWash = await overpassService.getPlaces({ placeType: "car_wash" });
        const fuelPlaces = resultFuel.places || [];
        const carWashPlaces = resultCarWash.places || [];
        osmCount = fuelPlaces.length + carWashPlaces.length;
      } catch (e) {}
      
      res.json({
        ...localStats,
        total: localStats.total + osmCount,
        osmCount,
        source: "OSM + Local"
      });
    } catch (error) {
      console.error("Erreur stats stations:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.post("/api/stations/refresh", async (req, res) => {
    try {
      const { stationsService } = await import("./stationsService");
      stationsService.markAsUpdated();
      const stats = stationsService.getStats();
      res.json({ 
        message: "Données des stations-service actualisées",
        ...stats
      });
    } catch (error) {
      console.error("Erreur actualisation stations:", error);
      res.status(500).json({ error: "Erreur lors de l'actualisation" });
    }
  });

  // ----------------------------------------
  // ROUTES LIEUX VÉRIFIÉS (OpenStreetMap)
  // ----------------------------------------
  app.post("/api/places/sync", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Non autorisé" });
      }

      const force = req.query.force === 'true';
      // Lancer la synchronisation en arrière-plan
      overpassService.syncAllPlaces(force).catch(err => console.error("Sync error:", err));
      
      res.json({ message: "Synchronisation démarrée en arrière-plan" });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors du démarrage de la synchronisation" });
    }
  });

  app.get("/api/places", async (req, res) => {
    try {
      const { placeType, region, ville, search, verificationStatus, limit, offset } = req.query;
      
      const response = await overpassService.getPlaces({
        placeType: placeType as string,
        region: region as string,
        ville: ville as string,
        search: search as string,
        verificationStatus: verificationStatus as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      // Transformation spécifique pour les hôpitaux et cliniques
      if (placeType === "hospital" || placeType === "clinic") {
        const transformedPlaces = response.places.map(transformOsmToHopital);
        return res.json({
          places: transformedPlaces,
          total: response.places.length,
          lastUpdated: response.lastUpdated,
          source: "PostgreSQL"
        });
      }

      // Transformation spécifique pour les universités
      if (placeType === "university" || placeType === "college") {
        const transformedPlaces = response.places.map(transformOsmToUniversity);
        return res.json({
          places: transformedPlaces,
          total: response.places.length,
          lastUpdated: response.lastUpdated,
          source: "PostgreSQL"
        });
      }

      // Transformation spécifique pour les restaurants
      if (placeType === "restaurant" || placeType === "fast_food" || placeType === "cafe") {
        // Si aucun restaurant trouvé, synchroniser depuis OSM
        if (response.places.length === 0) {
          console.log(`[API] Aucun ${placeType} trouvé, lancement de la synchronisation OSM...`);
          try {
            await Promise.all([
              overpassService.syncPlaceType("restaurant"),
              overpassService.syncPlaceType("fast_food"),
              overpassService.syncPlaceType("cafe"),
              overpassService.syncPlaceType("bar")
            ]);
            
            // Re-fetch après synchronisation
            const [rest, fastFood, cafe, bar] = await Promise.all([
              overpassService.getPlaces({ placeType: "restaurant" }),
              overpassService.getPlaces({ placeType: "fast_food" }),
              overpassService.getPlaces({ placeType: "cafe" }),
              overpassService.getPlaces({ placeType: "bar" })
            ]);
            
            const allRestaurants = [
              ...rest.places,
              ...fastFood.places,
              ...cafe.places,
              ...bar.places
            ];
            
            const transformedPlaces = allRestaurants.map(transformOsmToRestaurant);
            return res.json({
              places: transformedPlaces,
              total: transformedPlaces.length,
              lastUpdated: new Date().toISOString(),
              source: "OpenStreetMap"
            });
          } catch (syncError) {
            console.error("Erreur sync restaurants OSM:", syncError);
          }
        }
        
        const transformedPlaces = response.places.map(transformOsmToRestaurant);
        return res.json({
          places: transformedPlaces,
          total: response.places.length,
          lastUpdated: response.lastUpdated,
          source: "PostgreSQL"
        });
      }

      // Transformation spécifique pour les pharmacies
      if (placeType === "pharmacy") {
        return res.json({
          places: response.places,
          total: response.places.length,
          lastUpdated: response.lastUpdated,
          source: "PostgreSQL"
        });
      }

      // Transformation spécifique pour les restaurants
      if (placeType === "restaurant" || placeType === "fast_food" || placeType === "cafe") {
        const transformedPlaces = response.places.map(transformOsmToRestaurant);
        return res.json({
          places: transformedPlaces,
          total: response.places.length,
          lastUpdated: response.lastUpdated,
          source: "PostgreSQL"
        });
      }

      res.set('Cache-Control', 'public, max-age=300');
      res.json(response);
    } catch (error) {
      console.error("Erreur récupération places:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des lieux" });
    }
  });

  app.get("/api/places/stats", async (req, res) => {
    try {
      const stats = await overpassService.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats places:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/places/:id", async (req, res) => {
    try {
      const place = await overpassService.getPlaceById(req.params.id);
      if (!place) {
        return res.status(404).json({ error: "Lieu non trouvé" });
      }
      res.json(place);
    } catch (error) {
      console.error("Erreur récupération place:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du lieu" });
    }
  });

  app.get("/api/places/:id/verifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.json({ confirmed: false, reported: false });
      }
      
      const verifications = await overpassService.getUserVerifications(req.params.id, userId);
      res.json(verifications);
    } catch (error) {
      console.error("Erreur récupération verifications:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des vérifications" });
    }
  });

  app.post("/api/places/:id/confirm", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
      const placeId = req.params.id;

      try {
        const success = await overpassService.confirmPlace(placeId, userId, ipAddress);
        if (!success) {
          return res.status(400).json({ error: "Vous avez déjà confirmé ce lieu", success: false });
        }
        return res.json({ message: "Confirmation enregistrée", success: true });
      } catch (dbError: any) {
        if (dbError?.message === "PLACE_NOT_FOUND") {
          const key = `place-${placeId}`;
          if (!placeInteractions[key]) {
            placeInteractions[key] = { confirmations: 0, reports: 0, confirmedBy: new Set(), reportedBy: new Set() };
          }
          if (placeInteractions[key].confirmedBy.has(ipAddress)) {
            return res.status(400).json({ error: "Vous avez déjà confirmé ce lieu", success: false });
          }
          placeInteractions[key].confirmations++;
          placeInteractions[key].confirmedBy.add(ipAddress);
          return res.json({ success: true, confirmations: placeInteractions[key].confirmations, reports: placeInteractions[key].reports });
        }
        throw dbError;
      }
    } catch (error) {
      console.error("Erreur confirmation place:", error);
      res.status(500).json({ error: "Erreur lors de la confirmation", success: false });
    }
  });

  app.post("/api/places/:id/report", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || null;
      const ipAddress = req.ip || req.connection?.remoteAddress || "unknown";
      const { comment } = req.body;
      const placeId = req.params.id;

      try {
        const success = await overpassService.reportPlace(placeId, userId, comment, ipAddress);
        if (!success) {
          return res.status(400).json({ error: "Vous avez déjà signalé ce lieu", success: false });
        }
        return res.json({ message: "Signalement enregistré", success: true });
      } catch (dbError: any) {
        if (dbError?.message === "PLACE_NOT_FOUND") {
          const key = `place-${placeId}`;
          if (!placeInteractions[key]) {
            placeInteractions[key] = { confirmations: 0, reports: 0, confirmedBy: new Set(), reportedBy: new Set() };
          }
          if (placeInteractions[key].reportedBy.has(ipAddress)) {
            return res.status(400).json({ error: "Vous avez déjà signalé ce lieu", success: false });
          }
          placeInteractions[key].reports++;
          placeInteractions[key].reportedBy.add(ipAddress);
          return res.json({ success: true, confirmations: placeInteractions[key].confirmations, reports: placeInteractions[key].reports });
        }
        throw dbError;
      }
    } catch (error) {
      console.error("Erreur signalement place:", error);
      res.status(500).json({ error: "Erreur lors du signalement", success: false });
    }
  });

  app.post("/api/places/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Accès non autorisé" });
      }

      overpassService.syncAllPlaces().catch(console.error);
      res.json({ message: "Synchronisation OpenStreetMap lancée en arrière-plan" });
    } catch (error) {
      console.error("Erreur sync places:", error);
      res.status(500).json({ error: "Erreur lors de la synchronisation" });
    }
  });

  // Extended fuel station sync - more thorough with region-based queries
  app.post("/api/stations/sync-extended", async (req: any, res) => {
    try {
      res.json({ message: "Synchronisation étendue des stations-service lancée en arrière-plan" });
      
      // Run in background
      overpassService.syncFuelStationsExtended().then(result => {
        console.log("Extended fuel sync result:", result);
      }).catch(console.error);
    } catch (error) {
      console.error("Erreur sync stations:", error);
      res.status(500).json({ error: "Erreur lors de la synchronisation" });
    }
  });

  // Migration routes for hardcoded data to OSM format
  app.post("/api/places/migrate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Acces non autorise" });
      }

      const stats = await dataMigrationService.migrateAll();
      res.json({ 
        message: "Migration des donnees hardcodees terminee",
        stats 
      });
    } catch (error) {
      console.error("Erreur migration:", error);
      res.status(500).json({ error: "Erreur lors de la migration" });
    }
  });

  app.get("/api/places/migration-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Acces non autorise" });
      }
      
      const status = await dataMigrationService.getMigrationStatus();
      res.json(status);
    } catch (error) {
      console.error("Erreur status migration:", error);
      res.status(500).json({ error: "Erreur lors de la recuperation du status" });
    }
  });

  // ----------------------------------------
  // ROUTES BULLETIN CITOYEN (RSS)
  // ----------------------------------------
  app.get("/api/bulletin-citoyen", async (req, res) => {
    try {
      const bulletins = await fetchBulletins();
      res.json(bulletins);
    } catch (error) {
      console.error("Erreur bulletin citoyen:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des bulletins" });
    }
  });

  app.post("/api/bulletin-citoyen/refresh", async (req, res) => {
    try {
      clearCache();
      const bulletins = await fetchBulletins();
      res.json({ message: "Cache actualisé", count: bulletins.length });
    } catch (error) {
      console.error("Erreur actualisation bulletin:", error);
      res.status(500).json({ error: "Erreur lors de l'actualisation" });
    }
  });

  // ----------------------------------------
  // ROUTES BURKINA EVENTS
  // ----------------------------------------
  app.get("/api/events-burkina", async (req, res) => {
    try {
      const events = await fetchEvents();
      res.json(events);
    } catch (error) {
      console.error("Erreur events:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des événements" });
    }
  });

  app.post("/api/events-burkina/refresh", async (req, res) => {
    try {
      clearEventsCache();
      const events = await fetchEvents();
      res.json({ message: "Cache actualisé", count: events.length });
    } catch (error) {
      console.error("Erreur actualisation events:", error);
      res.status(500).json({ error: "Erreur lors de l'actualisation" });
    }
  });

  // ----------------------------------------
  // ROUTES URGENCES
  // ----------------------------------------
  app.get("/api/urgences", async (req, res) => {
    try {
      const { urgenciesService } = await import("./urgenciesService");
      const { type, city, region, search } = req.query;

      let services;

      if (search) {
        services = urgenciesService.searchEmergencies(search as string);
      } else if (type) {
        services = urgenciesService.getEmergenciesByType(type as any);
      } else if (city) {
        services = urgenciesService.getEmergenciesByCity(city as string);
      } else if (region) {
        services = urgenciesService.getEmergenciesByRegion(region as string);
      } else {
        services = urgenciesService.getAllEmergencies();
      }

      res.set('Cache-Control', 'public, max-age=3600'); // Cache 1 heure
      res.json(services);
    } catch (error) {
      console.error("Erreur récupération urgences:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des services d'urgence" });
    }
  });

  app.get("/api/urgences/stats", async (req, res) => {
    try {
      const { urgenciesService } = await import("./urgenciesService");
      const stats = urgenciesService.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats urgences:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.post("/api/urgences/refresh", async (req, res) => {
    try {
      const { urgenciesService } = await import("./urgenciesService");
      urgenciesService.markAsUpdated();
      const stats = urgenciesService.getStats();
      res.json({ 
        message: "Données des urgences actualisées",
        ...stats
      });
    } catch (error) {
      console.error("Erreur actualisation urgences:", error);
      res.status(500).json({ error: "Erreur lors de l'actualisation" });
    }
  });

  // Marquer un utilisateur comme en ligne
  app.post("/api/user/online", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.userConnected(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating online status:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour du statut" });
    }
  });

  // Marquer un utilisateur comme hors ligne
  app.post("/api/user/offline", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.userDisconnected(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing online status:", error);
      res.status(500).json({ error: "Erreur lors de la suppression du statut" });
    }
  });

  // ----------------------------------------
  // ROUTES STREETVIEW (Mode Anonyme)
  // ----------------------------------------

  // Récupérer le token Mapillary pour le frontend
  app.get("/api/config/mapillary-token", (req, res) => {
    const token = process.env.MAPILLARY_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "Token Mapillary non configuré" });
    }
    res.json({ token });
  });

  // Récupérer tous les points streetview pour la carte
  app.get("/api/streetview/map-points", async (req, res) => {
    try {
      const points = await storage.getStreetviewPoints();
      // Ne renvoyer que les données nécessaires (sans imageData complète pour performance)
      const mapPoints = points.map(p => ({
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        thumbnailData: p.thumbnailData,
        imageData: p.imageData,
        heading: p.heading,
        pitch: p.pitch,
        capturedAt: p.capturedAt,
      }));
      res.json(mapPoints);
    } catch (error) {
      console.error("Erreur récupération points streetview:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des points" });
    }
  });

  // Upload d'une image streetview (anonyme - pas d'auth requise)
  app.post("/api/streetview/upload", async (req, res) => {
    try {
      const { imageData, thumbnailData, latitude, longitude, heading, pitch } = req.body;

      if (!imageData || !latitude || !longitude) {
        return res.status(400).json({ error: "Données manquantes (image, latitude, longitude)" });
      }

      // Validation des coordonnées
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return res.status(400).json({ error: "Coordonnées invalides" });
      }

      // Limite taille image optimisée (max 2MB en base64 après compression)
      const imageSizeMB = imageData.length / (1024 * 1024);
      if (imageSizeMB > 2) {
        return res.status(400).json({ 
          error: `Image trop volumineuse (${imageSizeMB.toFixed(1)}MB). Maximum: 2MB. Utilisez la compression intégrée.` 
        });
      }

      // Vérifier que l'image est bien un JPEG compressé
      if (!imageData.startsWith('data:image/jpeg')) {
        return res.status(400).json({ error: "Format invalide. Utilisez JPEG uniquement." });
      }

      const point = await storage.createStreetviewPoint({
        imageData,
        thumbnailData: thumbnailData || null,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        heading: heading ? heading.toString() : null,
        pitch: pitch ? pitch.toString() : null,
        deviceInfo: null, // Aucune info device stockée pour anonymat
      });

      console.log(`✅ Photo streetview uploadée: ${point.id} (${imageSizeMB.toFixed(2)}MB)`);
      res.status(201).json({ success: true, id: point.id });
    } catch (error) {
      console.error("Erreur upload streetview:", error);
      res.status(500).json({ error: "Erreur lors de l'upload" });
    }
  });

  // ----------------------------------------
  // ROUTES VIRTUAL TOURS (Tours virtuels)
  // ----------------------------------------

  // Récupérer tous les tours virtuels
  app.get("/api/virtual-tours", async (req, res) => {
    try {
      const tours = await storage.getVirtualTours();
      res.json(tours);
    } catch (error) {
      console.error("Erreur récupération tours virtuels:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des tours" });
    }
  });

  // Récupérer un tour avec ses photos
  app.get("/api/virtual-tours/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const tour = await storage.getVirtualTourWithPhotos(id);
      
      if (!tour) {
        return res.status(404).json({ error: "Tour non trouvé" });
      }

      // Incrémenter le compteur de vues
      await storage.incrementTourViewCount(id);
      
      res.json(tour);
    } catch (error) {
      console.error("Erreur récupération tour:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du tour" });
    }
  });

  // Créer un nouveau tour virtuel avec ses photos (rate limited)
  app.post("/api/virtual-tours", signalementMutationLimiter, async (req, res) => {
    try {
      const { name, description, quartier, latitude, longitude, photos } = req.body;

      if (!name || !latitude || !longitude) {
        return res.status(400).json({ error: "Nom et coordonnées requis" });
      }

      const MIN_PHOTOS_REQUIRED = 5;
      if (!photos || !Array.isArray(photos) || photos.length < MIN_PHOTOS_REQUIRED) {
        return res.status(400).json({ error: `Minimum ${MIN_PHOTOS_REQUIRED} photos requises` });
      }

      // Limite du nombre de photos par tour
      const MAX_PHOTOS_PER_TOUR = 20;
      if (photos.length > MAX_PHOTOS_PER_TOUR) {
        return res.status(400).json({ 
          error: `Maximum ${MAX_PHOTOS_PER_TOUR} photos par tour` 
        });
      }

      // Vérifier la taille des images
      for (const photo of photos) {
        if (!photo.imageData || !photo.imageData.startsWith('data:image/')) {
          return res.status(400).json({ error: "Format d'image invalide" });
        }
        const sizeMB = photo.imageData.length / (1024 * 1024);
        if (sizeMB > 2) {
          return res.status(400).json({ 
            error: `Une image est trop volumineuse (${sizeMB.toFixed(1)}MB). Maximum: 2MB` 
          });
        }
      }

      // Préparer les photos pour la création avec GPS par photo
      const photoData = photos.map((photo: { 
        imageData: string; 
        thumbnailData?: string;
        latitude?: number;
        longitude?: number;
        capturedAt?: string;
      }) => ({
        imageData: photo.imageData,
        thumbnailData: photo.thumbnailData || null,
        latitude: photo.latitude?.toString() || latitude.toString(),
        longitude: photo.longitude?.toString() || longitude.toString(),
        capturedAt: photo.capturedAt ? new Date(photo.capturedAt) : new Date(),
        heading: null,
        pitch: null,
        deviceInfo: null,
      }));

      const tour = await storage.createVirtualTour(
        {
          name: name.slice(0, 100), // Limiter le nom
          description: description ? description.slice(0, 500) : null,
          quartier: quartier ? quartier.slice(0, 100) : null,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          coverPhotoId: null,
          isPublished: true,
        },
        photoData
      );

      console.log(`✅ Tour virtuel créé: ${tour.id} - "${name}" (${photos.length} photos)`);
      res.status(201).json(tour);
    } catch (error) {
      console.error("Erreur création tour virtuel:", error);
      res.status(500).json({ error: "Erreur lors de la création du tour" });
    }
  });

  // Signaler un tour virtuel
  app.post("/api/virtual-tours/:id/report", signalementMutationLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await storage.incrementTourReportCount(id);
      
      if (result.status === "signale") {
        console.log(`⚠️ Tour ${id} marqué comme signalé après ${result.reportCount} signalements`);
      }
      
      console.log(`📢 Signalement tour virtuel: ${id} (total: ${result.reportCount})`);
      res.json({ 
        success: true, 
        message: "Signalement enregistré",
        reportCount: result.reportCount,
        status: result.status
      });
    } catch (error: any) {
      if (error.message === "Tour not found") {
        return res.status(404).json({ error: "Tour non trouvé" });
      }
      console.error("Erreur signalement tour:", error);
      res.status(500).json({ error: "Erreur lors du signalement" });
    }
  });

  // ----------------------------------------
  // ROUTES OUAGA EN 3D
  // ----------------------------------------
  const { ouaga3dService } = await import("./services/ouaga3dService");

  app.get("/api/ouaga3d/stats", async (req, res) => {
    try {
      const stats = await ouaga3dService.getOuaga3dStats();
      res.json(stats);
    } catch (error) {
      console.error("Erreur stats Ouaga3D:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des statistiques" });
    }
  });

  app.get("/api/ouaga3d/assets", async (req, res) => {
    try {
      const { limit, offset, source } = req.query;
      const assets = await ouaga3dService.getImageAssets({
        limit: limit ? parseInt(limit as string) : 100,
        offset: offset ? parseInt(offset as string) : 0,
        source: source as string | undefined
      });
      res.json(assets);
    } catch (error) {
      console.error("Erreur assets Ouaga3D:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des assets" });
    }
  });

  app.get("/api/ouaga3d/coverage", async (req, res) => {
    try {
      const coverage = await ouaga3dService.getCoverageData();
      res.json(coverage);
    } catch (error) {
      console.error("Erreur coverage Ouaga3D:", error);
      res.status(500).json({ error: "Erreur lors de la récupération de la couverture" });
    }
  });

  app.get("/api/ouaga3d/jobs", async (req, res) => {
    try {
      const jobs = await ouaga3dService.getRecentJobs(10);
      res.json(jobs);
    } catch (error) {
      console.error("Erreur jobs Ouaga3D:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des jobs" });
    }
  });

  app.get("/api/ouaga3d/zones", (req, res) => {
    res.json({
      bounds: ouaga3dService.OUAGADOUGOU_BOUNDS,
      zones: ouaga3dService.OUAGADOUGOU_ZONES
    });
  });

  app.post("/api/ouaga3d/trigger-ingestion", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Accès réservé aux administrateurs" });
      }

      const result = await ouaga3dService.triggerManualIngestion();
      res.json(result);
    } catch (error) {
      console.error("Erreur trigger ingestion:", error);
      res.status(500).json({ error: "Erreur lors du déclenchement de l'ingestion" });
    }
  });

  // ============================================
  // TRANSPORT - GARES ROUTIERES ET HORAIRES
  // ============================================
  app.get("/api/transport", async (req, res) => {
    try {
      const { getCompagnies, getGares, getTrajets, getStatistiquesTransport, GARES_DEPART } = await import("./transportData");
      const { getGaresWithOSM } = await import("./garesOSMService");
      
      const includeOSM = req.query.osm === "true";
      const hardcodedGares = getGares();
      const allGares = includeOSM ? await getGaresWithOSM(hardcodedGares) : hardcodedGares;
      
      // Enrichir les trajets avec les infos de gare de départ
      const trajetsWithGares = getTrajets().map(trajet => ({
        ...trajet,
        gareDepart: GARES_DEPART[trajet.depart] || null
      }));
      
      const baseStats = getStatistiquesTransport();
      const stats = {
        ...baseStats,
        totalGares: allGares.length,
        villesDesservies: Array.from(new Set(allGares.map(g => g.ville))).length
      };
      
      res.json({
        compagnies: getCompagnies(),
        gares: allGares,
        trajets: trajetsWithGares,
        stats
      });
    } catch (error) {
      console.error("Erreur transport:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des données de transport" });
    }
  });

  app.get("/api/transport/trajets", async (req, res) => {
    try {
      const { searchTrajets, getTrajets } = await import("./transportData");
      const { depart, arrivee } = req.query;
      
      if (depart && arrivee) {
        res.json(searchTrajets(String(depart), String(arrivee)));
      } else {
        res.json(getTrajets());
      }
    } catch (error) {
      console.error("Erreur trajets:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des trajets" });
    }
  });

  // ============================================
  // PHARMACIES DE GARDE - DONNÉES OFFICIELLES
  // Source: Orange Burkina Faso (https://www.orange.bf)
  // ============================================
  app.get("/api/pharmacies-de-garde", async (req, res) => {
    try {
      const { 
        getPharmaciesDeGarde, 
        getCurrentGardeGroup, 
        GARDE_INFO,
        ALL_PHARMACIES_DE_GARDE
      } = await import("./pharmaciesDeGardeData");
      
      const ville = req.query.ville as "Ouagadougou" | "Bobo-Dioulasso" | undefined;
      const showAll = req.query.all === "true";
      
      const today = new Date();
      const ouagaGroup = getCurrentGardeGroup("Ouagadougou", today);
      const boboGroup = getCurrentGardeGroup("Bobo-Dioulasso", today);
      
      const pharmacies = showAll 
        ? ALL_PHARMACIES_DE_GARDE 
        : getPharmaciesDeGarde(ville, today);
      
      res.json({
        date: today.toISOString().split('T')[0],
        groupeOuagadougou: ouagaGroup,
        groupeBobo: boboGroup,
        pharmacies,
        total: pharmacies.length,
        info: GARDE_INFO
      });
    } catch (error) {
      console.error("Erreur pharmacies de garde:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des pharmacies de garde" });
    }
  });

  app.get("/api/pharmacies-de-garde/groups", async (req, res) => {
    try {
      const { 
        getPharmaciesByGroup, 
        getGardeDatesForGroup 
      } = await import("./pharmaciesDeGardeData");
      
      const ville = req.query.ville as "Ouagadougou" | "Bobo-Dioulasso";
      const groupe = parseInt(req.query.groupe as string) as 1 | 2 | 3 | 4;
      
      if (!ville || !groupe || groupe < 1 || groupe > 4) {
        return res.status(400).json({ 
          error: "Paramètres invalides. Ville et groupe (1-4) requis." 
        });
      }
      
      const pharmacies = getPharmaciesByGroup(ville, groupe);
      const prochaineDates = getGardeDatesForGroup(ville, groupe);
      
      res.json({
        ville,
        groupe,
        pharmacies,
        total: pharmacies.length,
        prochaineDatesDeGarde: prochaineDates.map(d => d.toISOString().split('T')[0])
      });
    } catch (error) {
      console.error("Erreur groupes pharmacies:", error);
      res.status(500).json({ error: "Erreur lors de la récupération du groupe" });
    }
  });

  // ============================================
  // ALERTES MÉTÉO EN TEMPS RÉEL
  // ============================================
  
  app.get("/api/weather-alerts", async (req, res) => {
    try {
      const { getWeatherData, getActiveAlerts } = await import("./weatherAlertService");
      
      const activeOnly = req.query.active === "true";
      
      if (activeOnly) {
        const alerts = await getActiveAlerts();
        res.json({
          alerts,
          count: alerts.length,
          lastUpdate: new Date().toISOString(),
        });
      } else {
        const data = await getWeatherData();
        res.json({
          alerts: data.alerts,
          count: data.alerts.length,
          lastUpdate: data.lastUpdate,
          source: data.source,
        });
      }
    } catch (error) {
      console.error("Erreur alertes météo:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des alertes météo" });
    }
  });

  app.get("/api/cinema/info", async (req, res) => {
    try {
      res.set("Cache-Control", "public, max-age=86400");
      res.json({
        cinemas: CINEMAS_INFO,
        recentFilms: RECENT_FILMS,
      });
    } catch (error) {
      console.error("Erreur info cinéma:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des infos cinéma" });
    }
  });

  // Official news from government sources
  app.get("/api/news/official", async (req, res) => {
    try {
      const news = await getOfficialNews();
      res.set("Cache-Control", "public, max-age=900");
      res.json(news);
    } catch (error) {
      console.error("Error fetching official news:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des actualités" });
    }
  });

  app.get("/api/weather", async (req, res) => {
    try {
      const { getWeatherData, getCityWeather } = await import("./weatherAlertService");
      
      const cityName = req.query.city as string;
      
      if (cityName) {
        const cityWeather = await getCityWeather(cityName);
        if (!cityWeather) {
          return res.status(404).json({ error: `Ville '${cityName}' non trouvée` });
        }
        res.json(cityWeather);
      } else {
        const data = await getWeatherData();
        res.json(data);
      }
    } catch (error) {
      console.error("Erreur données météo:", error);
      res.status(500).json({ error: "Erreur lors de la récupération des données météo" });
    }
  });

  const httpServer = createServer(app);

  // Initial sync on startup if needed
  const overpassService = OverpassService.getInstance();
  const importantTypes = ["pharmacy", "restaurant", "fuel", "shop", "marketplace"];
  
  // Start background sync for critical data
  setTimeout(async () => {
    console.log("🚀 Starting initial data sync check...");
    for (const type of importantTypes) {
      try {
        // Check if we have data for this type
        const existing = await overpassService.getPlaces({ placeType: type, limit: 5 });
        if (existing.places.length < 5) {
          console.log(`📥 Syncing ${type} from OSM (only ${existing.places.length} entries found)...`);
          const result = await overpassService.syncPlaceType(type);
          console.log(`✅ Sync completed for ${type}: ${result.added} added, ${result.updated} updated`);
        } else {
          console.log(`✅ Sync check completed for ${type} (${existing.places.length}+ entries found)`);
        }
        // Add a small delay between initial syncs to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (err) {
        console.error(`❌ Sync error for ${type}:`, err);
      }
    }
    console.log("🏁 All initial data sync checks completed");
  }, 2000);

  return httpServer;
}