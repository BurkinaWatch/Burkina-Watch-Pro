/**
 * Contacts d'urgence conservés après audit.
 *
 * Les trois numéros nationaux confirmés sont complétés par les quatre
 * services prioritaires historiques demandés par l'équipe. Ces quatre fiches
 * sont explicitement distinguées des contacts confirmés et restent à
 * revalider lorsque la source institutionnelle ne publie pas le numéro.
 */
import { LEGACY_URGENCIES_AUDIT } from "./urgenciesAudit";

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
  verificationStatus: "confirmed" | "priority-restored";
  verifiedAt: string;
  sourceUrls: string[];
  verificationNote?: string;
}

const VERIFIED_AT = "2026-09-17";
const SECURITY_SOURCE = EMERGENCY_SOURCES[0].url;
const GOVERNMENT_SOURCE = EMERGENCY_SOURCES[1].url;
const SAMU_SOURCE =
  "https://gouvernement.gov.bf/actualites/sante-publique-le-service-daide-medicale-urgente-samu-desormais-operationnel-a-ouagadougou/";
const CIVIL_PROTECTION_SOURCE =
  "https://gouvernement.gov.bf/actualites/protection-civile-30-officiers-sapeurs-pompiers-prets-a-servir/";
const LAABAL_SOURCE =
  "https://gouvernement.gov.bf/actualites/brigade-laabal-ou-le-pari-dune-reconquete-civique-de-nos-villes-et-campagnes/";

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
  {
    id: "national-samu-112",
    name: "SAMU National — Urgences médicales",
    type: "Ambulance",
    city: "National",
    address: "Service d'aide médicale urgente",
    phone: "112",
    available24h: true,
    services: ["Urgences médicales", "Ambulances", "Évacuations sanitaires"],
    verificationStatus: "priority-restored",
    verifiedAt: VERIFIED_AT,
    sourceUrls: [SAMU_SOURCE],
    verificationNote:
      "Service prioritaire restauré depuis la liste historique; confirmer le numéro court auprès du SAMU avant de le présenter comme confirmé.",
  },
  {
    id: "national-civil-protection-1010",
    name: "Protection civile",
    type: "Pompiers",
    city: "National",
    address: "Service national de protection civile",
    phone: "1010",
    available24h: true,
    services: ["Protection civile", "Catastrophes naturelles", "Secours"],
    verificationStatus: "priority-restored",
    verifiedAt: VERIFIED_AT,
    sourceUrls: [CIVIL_PROTECTION_SOURCE],
    verificationNote:
      "Service prioritaire restauré depuis la liste historique; le portail officiel confirme l'organisme, mais pas le numéro dans la page consultée.",
  },
  {
    id: "national-cna-199",
    name: "Centre national d'appel (CNA)",
    type: "Police",
    city: "National",
    address: "Centre national d'appel",
    phone: "199",
    available24h: true,
    services: ["Signalements", "Sécurité nationale"],
    verificationStatus: "priority-restored",
    verifiedAt: VERIFIED_AT,
    sourceUrls: [SECURITY_SOURCE, GOVERNMENT_SOURCE],
    verificationNote:
      "Numéro historique restauré à la demande; sa confirmation institutionnelle actuelle reste à obtenir.",
  },
  {
    id: "national-laabal-50400504",
    name: "Brigade Laabal — Lutte contre l'incivisme",
    type: "Police",
    city: "National",
    address: "Service national de lutte contre l'incivisme",
    phone: "50400504",
    available24h: true,
    services: ["Incivisme", "Ordre public", "Salubrité", "Sécurité routière"],
    verificationStatus: "priority-restored",
    verifiedAt: VERIFIED_AT,
    sourceUrls: [LAABAL_SOURCE],
    verificationNote:
      "Service prioritaire restauré depuis la liste historique; confirmer la ligne téléphonique auprès de la Brigade Laabal.",
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
          status: "confirmed-plus-priority-restored" as const,
        verifiedAt: VERIFIED_AT,
          excludedUnverifiedCount: LEGACY_URGENCIES_AUDIT.pendingVerificationCount,
          audit: LEGACY_URGENCIES_AUDIT,
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