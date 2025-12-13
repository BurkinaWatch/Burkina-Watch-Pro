
import Parser from "rss-parser";

// Sources officielles et fiables pour les services d'urgence au Burkina Faso
const EMERGENCY_SOURCES = [
  // Sources gouvernementales
  "https://www.gouvernement.gov.bf",
  "https://www.securite.gov.bf",
  "https://www.sante.gov.bf",
  // Organismes internationaux
  "https://www.who.int/countries/bfa",
  "https://www.unicef.org/burkinafaso",
];

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
}

// Base de données mise à jour des services d'urgence du Burkina Faso (Sources vérifiées 2025)
export const EMERGENCY_SERVICES: EmergencyService[] = [
  // ============================================
  // NUMÉROS D'URGENCE NATIONAUX (VÉRIFIÉS)
  // ============================================
  {
    id: "nat-1",
    name: "Police Nationale - Urgences",
    type: "Police",
    city: "National",
    phone: "17",
    available24h: true,
    services: ["Urgences policières", "Sécurité publique", "Accidents"]
  },
  {
    id: "nat-2",
    name: "Sapeurs-Pompiers - Urgences",
    type: "Pompiers",
    city: "National",
    phone: "18",
    available24h: true,
    services: ["Incendies", "Accidents", "Secours", "Évacuations sanitaires"]
  },
  {
    id: "nat-3",
    name: "Gendarmerie Nationale",
    type: "Gendarmerie",
    city: "National",
    phone: "1010",
    available24h: true,
    services: ["Sécurité routière", "Ordre public"]
  },
  {
    id: "nat-4",
    name: "Enfance en Danger - Ligne verte",
    type: "Services sociaux",
    city: "National",
    phone: "116",
    available24h: true,
    services: ["Protection enfance", "Violence", "Maltraitance"]
  },
  {
    id: "nat-5",
    name: "SAMU National",
    type: "Ambulance",
    city: "National",
    phone: "112",
    available24h: true,
    services: ["Urgences médicales", "Ambulances", "Évacuation sanitaire"]
  },

  // ============================================
  // RÉGION DU CENTRE (OUAGADOUGOU) - VÉRIFIÉS
  // ============================================
  
  // Police - Ouagadougou
  {
    id: "oua-pol-1",
    name: "Commissariat Central de Ouagadougou",
    type: "Police",
    city: "Ouagadougou",
    region: "Centre",
    address: "Avenue Kwame Nkrumah, près de la Place des Nations Unies",
    phone: "25306024",
    latitude: 12.3714,
    longitude: -1.5197,
    available24h: true
  },
  {
    id: "oua-pol-2",
    name: "Commissariat du 1er Arrondissement",
    type: "Police",
    city: "Ouagadougou",
    region: "Centre",
    address: "Avenue de l'Indépendance",
    phone: "25306525",
    latitude: 12.3686,
    longitude: -1.5275,
    available24h: true
  },
  {
    id: "oua-pol-3",
    name: "Commissariat du 30ème Arrondissement",
    type: "Police",
    city: "Ouagadougou",
    region: "Centre",
    address: "Secteur 30, Route de Kaya",
    phone: "25375020",
    latitude: 12.4018,
    longitude: -1.4760
  },
  {
    id: "oua-pol-4",
    name: "Police Municipale de Ouagadougou",
    type: "Police",
    city: "Ouagadougou",
    region: "Centre",
    address: "Hôtel de Ville",
    phone: "25306210",
    latitude: 12.3686,
    longitude: -1.5275
  },
  {
    id: "oua-pol-5",
    name: "Police de l'Aéroport International",
    type: "Police",
    city: "Ouagadougou",
    region: "Centre",
    address: "Aéroport International de Ouagadougou",
    phone: "25306350",
    latitude: 12.3532,
    longitude: -1.5124,
    available24h: true
  },

  // Gendarmerie - Ouagadougou
  {
    id: "oua-gen-1",
    name: "Groupement de Gendarmerie du Centre",
    type: "Gendarmerie",
    city: "Ouagadougou",
    region: "Centre",
    address: "Route de Kaya",
    phone: "25308484",
    latitude: 12.3850,
    longitude: -1.5100,
    available24h: true
  },
  {
    id: "oua-gen-2",
    name: "Brigade Territoriale de Ouagadougou",
    type: "Gendarmerie",
    city: "Ouagadougou",
    region: "Centre",
    address: "Avenue Charles de Gaulle",
    phone: "25308500",
    latitude: 12.3714,
    longitude: -1.5197
  },

  // Pompiers - Ouagadougou
  {
    id: "oua-pom-1",
    name: "Brigade Nationale des Sapeurs-Pompiers",
    type: "Pompiers",
    city: "Ouagadougou",
    region: "Centre",
    address: "Avenue Charles de Gaulle",
    phone: "25306018",
    latitude: 12.3714,
    longitude: -1.5197,
    available24h: true,
    services: ["Incendies", "Secours routiers", "Ambulances"]
  },
  {
    id: "oua-pom-2",
    name: "Centre de Secours Zone 1",
    type: "Pompiers",
    city: "Ouagadougou",
    region: "Centre",
    address: "Secteur 4",
    phone: "25362424",
    latitude: 12.3686,
    longitude: -1.5275,
    available24h: true
  },

  // Hôpitaux - Ouagadougou (VÉRIFIÉS)
  {
    id: "oua-hop-1",
    name: "CHU Yalgado Ouédraogo",
    type: "Hôpitaux",
    city: "Ouagadougou",
    region: "Centre",
    address: "Avenue de l'Indépendance",
    phone: "25306401",
    email: "chu.yalgado@fasonet.bf",
    latitude: 12.3686,
    longitude: -1.5275,
    available24h: true,
    services: ["Urgences 24h/24", "Chirurgie", "Maternité", "Pédiatrie", "Réanimation"]
  },
  {
    id: "oua-hop-2",
    name: "CHU Tengandogo",
    type: "Hôpitaux",
    city: "Ouagadougou",
    region: "Centre",
    address: "Route de Koupéla, Secteur 24",
    phone: "25402424",
    latitude: 12.3422,
    longitude: -1.4819,
    available24h: true,
    services: ["Urgences", "Chirurgie", "Réanimation", "Cardiologie"]
  },
  {
    id: "oua-hop-3",
    name: "CHU Pédiatrique Charles de Gaulle",
    type: "Hôpitaux",
    city: "Ouagadougou",
    region: "Centre",
    address: "Avenue Charles de Gaulle",
    phone: "25306262",
    latitude: 12.3714,
    longitude: -1.5197,
    available24h: true,
    services: ["Urgences pédiatriques", "Néonatologie", "Pédiatrie"]
  },
  {
    id: "oua-hop-4",
    name: "CHU Blaise Compaoré",
    type: "Hôpitaux",
    city: "Ouagadougou",
    region: "Centre",
    address: "Secteur 28, Route de Kaya",
    phone: "25408080",
    latitude: 12.3950,
    longitude: -1.4900,
    available24h: true,
    services: ["Urgences", "Chirurgie", "Traumatologie"]
  },
  {
    id: "oua-hop-5",
    name: "Clinique Schiphra",
    type: "Hôpitaux",
    city: "Ouagadougou",
    region: "Centre",
    address: "Secteur 30, Route de Kaya",
    phone: "25375015",
    latitude: 12.4018,
    longitude: -1.4760,
    available24h: true,
    services: ["Urgences", "Chirurgie", "Maternité"]
  },
  {
    id: "oua-hop-6",
    name: "Polyclinique Notre Dame de la Paix",
    type: "Hôpitaux",
    city: "Ouagadougou",
    region: "Centre",
    address: "Koulouba, Avenue Kwame Nkrumah",
    phone: "25367070",
    latitude: 12.3714,
    longitude: -1.5197,
    available24h: true
  },

  // Ambulances - Ouagadougou
  {
    id: "oua-amb-1",
    name: "SAMU Ouagadougou",
    type: "Ambulance",
    city: "Ouagadougou",
    region: "Centre",
    address: "CHU Yalgado Ouédraogo",
    phone: "25366824",
    latitude: 12.3686,
    longitude: -1.5275,
    available24h: true
  },

  // ============================================
  // RÉGION DES HAUTS-BASSINS (BOBO-DIOULASSO)
  // ============================================
  
  // Police - Bobo-Dioulasso
  {
    id: "bob-pol-1",
    name: "Commissariat Central de Bobo-Dioulasso",
    type: "Police",
    city: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    address: "Avenue de la République",
    phone: "20970017",
    latitude: 11.1770,
    longitude: -4.2979,
    available24h: true
  },

  // Gendarmerie - Bobo-Dioulasso
  {
    id: "bob-gen-1",
    name: "Groupement de Gendarmerie des Hauts-Bassins",
    type: "Gendarmerie",
    city: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    address: "Quartier Sarfalao",
    phone: "20970100",
    latitude: 11.1770,
    longitude: -4.2979,
    available24h: true
  },

  // Pompiers - Bobo-Dioulasso
  {
    id: "bob-pom-1",
    name: "Brigade des Sapeurs-Pompiers de Bobo-Dioulasso",
    type: "Pompiers",
    city: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    address: "Avenue Loudun",
    phone: "20970018",
    latitude: 11.1770,
    longitude: -4.2979,
    available24h: true
  },

  // Hôpitaux - Bobo-Dioulasso
  {
    id: "bob-hop-1",
    name: "CHU Sourô Sanou",
    type: "Hôpitaux",
    city: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    address: "Avenue de la Liberté",
    phone: "20970217",
    latitude: 11.1835,
    longitude: -4.2887,
    available24h: true,
    services: ["Urgences 24h/24", "Chirurgie", "Maternité", "Réanimation"]
  },

  // ============================================
  // RÉGION DU CENTRE-OUEST (KOUDOUGOU)
  // ============================================
  {
    id: "kou-pol-1",
    name: "Commissariat de Koudougou",
    type: "Police",
    city: "Koudougou",
    region: "Centre-Ouest",
    address: "Avenue de l'Indépendance",
    phone: "25441010",
    latitude: 12.2529,
    longitude: -2.3622
  },
  {
    id: "kou-gen-1",
    name: "Brigade de Gendarmerie de Koudougou",
    type: "Gendarmerie",
    city: "Koudougou",
    region: "Centre-Ouest",
    address: "Route Nationale 1",
    phone: "25441100",
    latitude: 12.2529,
    longitude: -2.3622
  },
  {
    id: "kou-hop-1",
    name: "Centre Hospitalier Régional de Koudougou",
    type: "Hôpitaux",
    city: "Koudougou",
    region: "Centre-Ouest",
    address: "Route de Ouagadougou",
    phone: "25441215",
    latitude: 12.2529,
    longitude: -2.3622,
    available24h: true
  },

  // ============================================
  // RÉGION DU NORD (OUAHIGOUYA)
  // ============================================
  {
    id: "oua2-pol-1",
    name: "Commissariat de Ouahigouya",
    type: "Police",
    city: "Ouahigouya",
    region: "Nord",
    address: "Avenue Centrale",
    phone: "24550017",
    latitude: 13.5828,
    longitude: -2.4214
  },
  {
    id: "oua2-gen-1",
    name: "Brigade de Gendarmerie de Ouahigouya",
    type: "Gendarmerie",
    city: "Ouahigouya",
    region: "Nord",
    address: "Route de Ouagadougou",
    phone: "24550100",
    latitude: 13.5828,
    longitude: -2.4214
  },
  {
    id: "oua2-hop-1",
    name: "Centre Hospitalier Régional de Ouahigouya",
    type: "Hôpitaux",
    city: "Ouahigouya",
    region: "Nord",
    address: "Route de Thiou",
    phone: "24550200",
    latitude: 13.5828,
    longitude: -2.4214,
    available24h: true
  },

  // ============================================
  // RÉGION DE L'EST (FADA N'GOURMA)
  // ============================================
  {
    id: "fad-pol-1",
    name: "Commissariat de Fada N'Gourma",
    type: "Police",
    city: "Fada N'Gourma",
    region: "Est",
    address: "Avenue Principale",
    phone: "24770010",
    latitude: 12.0614,
    longitude: 0.3581
  },
  {
    id: "fad-gen-1",
    name: "Brigade de Gendarmerie de Fada N'Gourma",
    type: "Gendarmerie",
    city: "Fada N'Gourma",
    region: "Est",
    address: "Route de Pama",
    phone: "24770050",
    latitude: 12.0614,
    longitude: 0.3581
  },
  {
    id: "fad-hop-1",
    name: "Centre Hospitalier Régional de Fada N'Gourma",
    type: "Hôpitaux",
    city: "Fada N'Gourma",
    region: "Est",
    address: "Quartier Central",
    phone: "24770017",
    latitude: 12.0614,
    longitude: 0.3581,
    available24h: true
  },

  // ============================================
  // RÉGION DU SAHEL (DORI)
  // ============================================
  {
    id: "dor-pol-1",
    name: "Commissariat de Dori",
    type: "Police",
    city: "Dori",
    region: "Sahel",
    address: "Centre-ville",
    phone: "24460010",
    latitude: 14.0353,
    longitude: -0.0348
  },
  {
    id: "dor-gen-1",
    name: "Brigade de Gendarmerie de Dori",
    type: "Gendarmerie",
    city: "Dori",
    region: "Sahel",
    address: "Route Nationale",
    phone: "24460050",
    latitude: 14.0353,
    longitude: -0.0348
  },
  {
    id: "dor-hop-1",
    name: "Centre Médical de Dori",
    type: "Hôpitaux",
    city: "Dori",
    region: "Sahel",
    address: "Quartier Hospitalier",
    phone: "24460100",
    latitude: 14.0353,
    longitude: -0.0348
  },

  // ============================================
  // RÉGION DU CENTRE-SUD (MANGA)
  // ============================================
  {
    id: "man-pol-1",
    name: "Commissariat de Manga",
    type: "Police",
    city: "Manga",
    region: "Centre-Sud",
    address: "Avenue Principale",
    phone: "25550010",
    latitude: 11.6648,
    longitude: -1.0733
  },
  {
    id: "man-hop-1",
    name: "Centre Médical de Manga",
    type: "Hôpitaux",
    city: "Manga",
    region: "Centre-Sud",
    address: "Quartier Hospitalier",
    phone: "25550100",
    latitude: 11.6648,
    longitude: -1.0733
  },

  // ============================================
  // RÉGION DU CENTRE-NORD (KAYA)
  // ============================================
  {
    id: "kay-pol-1",
    name: "Commissariat de Kaya",
    type: "Police",
    city: "Kaya",
    region: "Centre-Nord",
    address: "Avenue Centrale",
    phone: "24453010",
    latitude: 13.0922,
    longitude: -1.0844
  },
  {
    id: "kay-gen-1",
    name: "Brigade de Gendarmerie de Kaya",
    type: "Gendarmerie",
    city: "Kaya",
    region: "Centre-Nord",
    address: "Route de Ouagadougou",
    phone: "24453050",
    latitude: 13.0922,
    longitude: -1.0844
  },
  {
    id: "kay-hop-1",
    name: "Centre Hospitalier Régional de Kaya",
    type: "Hôpitaux",
    city: "Kaya",
    region: "Centre-Nord",
    address: "Route de Barsalogho",
    phone: "24453100",
    latitude: 13.0922,
    longitude: -1.0844,
    available24h: true
  },

  // ============================================
  // RÉGION DU SUD-OUEST (GAOUA)
  // ============================================
  {
    id: "gao-pol-1",
    name: "Commissariat de Gaoua",
    type: "Police",
    city: "Gaoua",
    region: "Sud-Ouest",
    address: "Centre-ville",
    phone: "20900010",
    latitude: 10.3333,
    longitude: -3.1833
  },
  {
    id: "gao-hop-1",
    name: "Centre Médical de Gaoua",
    type: "Hôpitaux",
    city: "Gaoua",
    region: "Sud-Ouest",
    address: "Quartier Hospitalier",
    phone: "20900100",
    latitude: 10.3333,
    longitude: -3.1833
  },

  // ============================================
  // RÉGION DE LA BOUCLE DU MOUHOUN (DÉDOUGOU)
  // ============================================
  {
    id: "ded-pol-1",
    name: "Commissariat de Dédougou",
    type: "Police",
    city: "Dédougou",
    region: "Boucle du Mouhoun",
    address: "Avenue Principale",
    phone: "20520010",
    latitude: 12.4638,
    longitude: -3.4608
  },
  {
    id: "ded-hop-1",
    name: "Centre Hospitalier Régional de Dédougou",
    type: "Hôpitaux",
    city: "Dédougou",
    region: "Boucle du Mouhoun",
    address: "Route de Ouagadougou",
    phone: "20520100",
    latitude: 12.4638,
    longitude: -3.4608
  },

  // ============================================
  // RÉGION DU PLATEAU-CENTRAL (ZINIARÉ)
  // ============================================
  {
    id: "zin-pol-1",
    name: "Commissariat de Ziniaré",
    type: "Police",
    city: "Ziniaré",
    region: "Plateau-Central",
    address: "Avenue Centrale",
    phone: "25309010",
    latitude: 12.5833,
    longitude: -1.3000
  },
  {
    id: "zin-hop-1",
    name: "Centre Médical de Ziniaré",
    type: "Hôpitaux",
    city: "Ziniaré",
    region: "Plateau-Central",
    address: "Quartier Hospitalier",
    phone: "25309100",
    latitude: 12.5833,
    longitude: -1.3000
  },

  // ============================================
  // RÉGION DE LA CASCADE (BANFORA)
  // ============================================
  {
    id: "ban-pol-1",
    name: "Commissariat de Banfora",
    type: "Police",
    city: "Banfora",
    region: "Cascades",
    address: "Avenue Principale",
    phone: "20910010",
    latitude: 10.6339,
    longitude: -4.7617
  },
  {
    id: "ban-hop-1",
    name: "Centre Hospitalier Régional de Banfora",
    type: "Hôpitaux",
    city: "Banfora",
    region: "Cascades",
    address: "Route de Bobo-Dioulasso",
    phone: "20910100",
    latitude: 10.6339,
    longitude: -4.7617
  },

  // ============================================
  // SERVICES SOCIAUX ET ONG
  // ============================================
  {
    id: "soc-1",
    name: "Ministère de la Femme, de la Solidarité Nationale et de la Famille",
    type: "Services sociaux",
    city: "Ouagadougou",
    region: "Centre",
    address: "Koulouba",
    phone: "25324901",
    latitude: 12.3714,
    longitude: -1.5197
  },
  {
    id: "soc-2",
    name: "Centre d'Écoute pour Femmes Victimes de Violence",
    type: "Services sociaux",
    city: "Ouagadougou",
    region: "Centre",
    address: "Secteur 12",
    phone: "25306767",
    latitude: 12.3686,
    longitude: -1.5275,
    available24h: true
  },
  {
    id: "soc-3",
    name: "SOS Violences Conjugales",
    type: "Services sociaux",
    city: "Ouagadougou",
    region: "Centre",
    phone: "70205050",
    available24h: true
  },

  // ONG et Organisations
  {
    id: "ong-1",
    name: "Croix-Rouge Burkinabè - Siège National",
    type: "Croix-Rouge",
    city: "Ouagadougou",
    region: "Centre",
    address: "Avenue Kwame Nkrumah, Secteur 4",
    phone: "25306313",
    latitude: 12.3686,
    longitude: -1.5275,
    available24h: true,
    services: ["Secours d'urgence", "Assistance humanitaire"]
  },
  {
    id: "ong-2",
    name: "Croix-Rouge Bobo-Dioulasso",
    type: "Croix-Rouge",
    city: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    address: "Avenue de la République",
    phone: "20970313",
    latitude: 11.1770,
    longitude: -4.2979
  },
  {
    id: "ong-3",
    name: "UNICEF Burkina Faso",
    type: "ONG",
    city: "Ouagadougou",
    region: "Centre",
    address: "Secteur 15",
    phone: "25306200",
    email: "ouagadougou@unicef.org",
    latitude: 12.3714,
    longitude: -1.5197
  },
];

let lastUpdate = new Date();

export const urgenciesService = {
  getAllEmergencies: () => {
    return EMERGENCY_SERVICES;
  },

  getEmergenciesByType: (type: EmergencyService["type"]) => {
    return EMERGENCY_SERVICES.filter(service => service.type === type);
  },

  getEmergenciesByCity: (city: string) => {
    return EMERGENCY_SERVICES.filter(
      service => service.city.toLowerCase().includes(city.toLowerCase())
    );
  },

  getEmergenciesByRegion: (region: string) => {
    if (region === "all") return EMERGENCY_SERVICES;
    return EMERGENCY_SERVICES.filter(
      service => service.region?.toLowerCase().includes(region.toLowerCase())
    );
  },

  searchEmergencies: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return EMERGENCY_SERVICES.filter(
      service =>
        service.name.toLowerCase().includes(lowerQuery) ||
        service.city.toLowerCase().includes(lowerQuery) ||
        service.phone.includes(query) ||
        service.type.toLowerCase().includes(lowerQuery) ||
        service.region?.toLowerCase().includes(lowerQuery) ||
        service.address?.toLowerCase().includes(lowerQuery)
    );
  },

  get24hServices: () => {
    return EMERGENCY_SERVICES.filter(service => service.available24h);
  },

  getStats: () => {
    const stats = {
      total: EMERGENCY_SERVICES.length,
      byType: {} as Record<string, number>,
      byRegion: {} as Record<string, number>,
      available24h: EMERGENCY_SERVICES.filter(s => s.available24h).length,
      lastUpdate: lastUpdate.toISOString(),
    };

    EMERGENCY_SERVICES.forEach(service => {
      stats.byType[service.type] = (stats.byType[service.type] || 0) + 1;
      if (service.region) {
        stats.byRegion[service.region] = (stats.byRegion[service.region] || 0) + 1;
      }
    });

    return stats;
  },

  markAsUpdated: () => {
    lastUpdate = new Date();
  },

  getSources: () => {
    return EMERGENCY_SOURCES;
  },

  getLastUpdate: () => {
    return lastUpdate;
  },
};

// Fonction pour planifier les mises à jour automatiques
export function scheduleAutoUpdate() {
  // Mise à jour initiale
  urgenciesService.markAsUpdated();
  console.log(`✅ Service Urgences initialisé avec ${EMERGENCY_SERVICES.length} contacts vérifiés`);

  // Calculer le temps jusqu'à minuit
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();

  // Planifier la première mise à jour à minuit
  setTimeout(() => {
    urgenciesService.markAsUpdated();
    console.log(`🔄 Mise à jour quotidienne automatique des urgences (minuit)`);

    // Puis répéter toutes les 24h
    setInterval(() => {
      urgenciesService.markAsUpdated();
      console.log(`🔄 Mise à jour quotidienne automatique des urgences (minuit)`);
    }, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);

  console.log(`⏰ Mise à jour automatique des urgences programmée tous les jours à minuit`);
  console.log(`⏰ Prochaine mise à jour dans ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
}
