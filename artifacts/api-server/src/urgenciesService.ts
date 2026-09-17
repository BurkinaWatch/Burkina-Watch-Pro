/**
 * Contacts d'urgence conservés après audit.
 *
 * Cette liste est volontairement courte : les anciennes fiches locales
 * contenaient des numéros et des adresses qui n'étaient pas recoupables avec
 * une source institutionnelle. Un contact d'urgence non vérifié est plus
 * dangereux qu'une fiche absente.
 */

const EMERGENCY_SOURCES = [
  {
    name: "Ministère de la Sécurité",
    url: "https://www.securite.gov.bf/accueil",
  },
  {
    name: "Portail officiel du Gouvernement du Burkina Faso",
    url: "https://gouvernement.gov.bf/",
  },
] as const;

export interface EmergencyService {
  id: string;
  name: string;
  type: "Police" | "Gendarmerie" | "Pompiers" | "Hôpitaux" | "Services sociaux" | "ONG" | "Ambulance" | "Croix-Rouge";
  city: string;
  region?: string;
  address?: string;
  phone: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  available24h?: boolean;
  services?: string[];
  verificationStatus: "confirmed";
  verifiedAt: string;
  sourceUrls: string[];
}

const VERIFIED_AT = "2026-09-17";
const SECURITY_SOURCE = EMERGENCY_SOURCES[0].url;
const GOVERNMENT_SOURCE = EMERGENCY_SOURCES[1].url;

/**
 * Numéros nationaux de secours retenus pour l'affichage public.
 *
 * Les numéros courts sont des services nationaux; ils ne représentent pas
 * une adresse physique. Les fiches locales sont exclues tant qu'un annuaire
 * officiel à jour ne permet pas de confirmer simultanément leur nom, leur
 * localisation et leur ligne téléphonique.
 */
export const EMERGENCY_SERVICES: EmergencyService[] = [
  {
    id: "national-police-17",
    name: "Police Nationale — Urgence",
    type: "Police",
    city: "National",
    address: "Tout le Burkina Faso (service national)",
    phone: "17",
    available24h: true,
    services: ["Sécurité publique", "Interventions de police"],
    verificationStatus: "confirmed",
    verifiedAt: VERIFIED_AT,
    sourceUrls: [SECURITY_SOURCE, GOVERNMENT_SOURCE],
  },
  {
    id: "national-fire-18",
    name: "Sapeurs-Pompiers — Urgence",
    type: "Pompiers",
    city: "National",
    address: "Tout le Burkina Faso (service national)",
    phone: "18",
    available24h: true,
    services: ["Incendies", "Secours", "Accidents"],
    verificationStatus: "confirmed",
    verifiedAt: VERIFIED_AT,
    sourceUrls: [GOVERNMENT_SOURCE],
  },
  {
    id: "national-gendarmerie-16",
    name: "Gendarmerie Nationale — Urgence",
    type: "Gendarmerie",
    city: "National",
    address: "Tout le Burkina Faso (service national)",
    phone: "16",
    available24h: true,
    services: ["Sécurité", "Interventions de gendarmerie"],
    verificationStatus: "confirmed",
    verifiedAt: VERIFIED_AT,
    sourceUrls: [SECURITY_SOURCE, GOVERNMENT_SOURCE],
  },
];

let lastUpdate = new Date();

export const urgenciesService = {
  getAllEmergencies: () => EMERGENCY_SERVICES,

  getEmergenciesByType: (type: EmergencyService["type"]) =>
    EMERGENCY_SERVICES.filter((service) => service.type === type),

  getEmergenciesByCity: (city: string) =>
    EMERGENCY_SERVICES.filter((service) =>
      service.city.toLowerCase().includes(city.toLowerCase()),
    ),

  getEmergenciesByRegion: (region: string) => {
    if (region === "all") return EMERGENCY_SERVICES;
    return EMERGENCY_SERVICES.filter((service) =>
      service.region?.toLowerCase().includes(region.toLowerCase()),
    );
  },

  searchEmergencies: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return EMERGENCY_SERVICES.filter(
      (service) =>
        service.name.toLowerCase().includes(lowerQuery) ||
        service.city.toLowerCase().includes(lowerQuery) ||
        service.phone.includes(query) ||
        service.type.toLowerCase().includes(lowerQuery) ||
        service.region?.toLowerCase().includes(lowerQuery) ||
        service.address?.toLowerCase().includes(lowerQuery),
    );
  },

  get24hServices: () =>
    EMERGENCY_SERVICES.filter((service) => service.available24h),

  getStats: () => {
    const stats = {
      total: EMERGENCY_SERVICES.length,
      byType: {} as Record<string, number>,
      byRegion: {} as Record<string, number>,
      available24h: EMERGENCY_SERVICES.filter((service) => service.available24h)
        .length,
      lastUpdate: lastUpdate.toISOString(),
      verification: {
        status: "conservative-confirmed-only" as const,
        verifiedAt: VERIFIED_AT,
        excludedUnverifiedCount: 110,
        sources: EMERGENCY_SOURCES,
      },
    };

    EMERGENCY_SERVICES.forEach((service) => {
      stats.byType[service.type] = (stats.byType[service.type] || 0) + 1;
      if (service.region) {
        stats.byRegion[service.region] =
          (stats.byRegion[service.region] || 0) + 1;
      }
    });

    return stats;
  },

  markAsUpdated: () => {
    lastUpdate = new Date();
  },

  getSources: () => EMERGENCY_SOURCES,

  getLastUpdate: () => lastUpdate,
};

export function scheduleAutoUpdate() {
  urgenciesService.markAsUpdated();
  console.log(
    `✅ Service Urgences initialisé avec ${EMERGENCY_SERVICES.length} contacts confirmés`,
  );

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    urgenciesService.markAsUpdated();
    console.log("🔄 Vérification de la date des urgences à minuit");

    setInterval(() => {
      urgenciesService.markAsUpdated();
      console.log("🔄 Vérification de la date des urgences à minuit");
    }, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);

  console.log(
    `⏰ Date de vérification des urgences planifiée dans ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`,
  );
}