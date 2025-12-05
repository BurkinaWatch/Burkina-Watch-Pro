
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

// Base de données élargie des services d'urgence du Burkina Faso
export const EMERGENCY_SERVICES: EmergencyService[] = [
  // ============================================
  // NUMÉROS D'URGENCE NATIONAUX
  // ============================================
  { 
    id: "nat-1", 
    name: "Police Nationale - Numéro d'urgence", 
    type: "Police", 
    city: "National", 
    phone: "17", 
    available24h: true,
    services: ["Urgences policières", "Sécurité publique"]
  },
  { 
    id: "nat-2", 
    name: "Sapeurs-Pompiers - Urgence incendie", 
    type: "Pompiers", 
    city: "National", 
    phone: "18", 
    available24h: true,
    services: ["Incendies", "Accidents", "Secours"]
  },
  { 
    id: "nat-3", 
    name: "Gendarmerie Nationale - Centre d'appel", 
    type: "Gendarmerie", 
    city: "National", 
    phone: "50494949", 
    available24h: true 
  },
  { 
    id: "nat-4", 
    name: "Action Sociale - Enfance en danger", 
    type: "Services sociaux", 
    city: "National", 
    phone: "116", 
    available24h: true,
    services: ["Protection enfance", "Violence"]
  },
  { 
    id: "nat-5", 
    name: "SAMU National", 
    type: "Ambulance", 
    city: "National", 
    phone: "25366824", 
    available24h: true,
    services: ["Urgences médicales", "Ambulances"]
  },

  // ============================================
  // RÉGION DU CENTRE (OUAGADOUGOU)
  // ============================================
  // Police
  { 
    id: "oua-pol-1", 
    name: "Commissariat Central de Ouagadougou", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Avenue Kwame Nkrumah", 
    phone: "25306024", 
    latitude: 12.3714, 
    longitude: -1.5197,
    available24h: true
  },
  { 
    id: "oua-pol-2", 
    name: "Commissariat de Police du 17ème Arrondissement", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Secteur 17", 
    phone: "25360101",
    latitude: 12.3850, 
    longitude: -1.5100
  },
  { 
    id: "oua-pol-3", 
    name: "Commissariat de Police du 30ème Arrondissement", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Secteur 30", 
    phone: "25375020",
    latitude: 12.4018, 
    longitude: -1.4760
  },
  { 
    id: "oua-pol-4", 
    name: "Commissariat Urbain de Baskuy", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Arrondissement de Baskuy", 
    phone: "25308585"
  },
  { 
    id: "oua-pol-5", 
    name: "Commissariat Urbain de Bogodogo", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Arrondissement de Bogodogo", 
    phone: "25387070"
  },
  { 
    id: "oua-pol-6", 
    name: "Commissariat Urbain de Boulmiougou", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Arrondissement de Boulmiougou", 
    phone: "25368888"
  },
  { 
    id: "oua-pol-7", 
    name: "Commissariat Urbain de Nongr-Massom", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Arrondissement de Nongr-Massom", 
    phone: "25367575"
  },
  { 
    id: "oua-pol-8", 
    name: "Commissariat Urbain de Sig-Noghin", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Arrondissement de Sig-Noghin", 
    phone: "25361212"
  },
  { 
    id: "oua-pol-9", 
    name: "Police de l'Aéroport International de Ouagadougou", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Aéroport International", 
    phone: "25306350",
    available24h: true
  },
  { 
    id: "oua-pol-10", 
    name: "Police des Frontières - Ouagadougou", 
    type: "Police", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25308600"
  },

  // Gendarmerie
  { 
    id: "oua-gen-1", 
    name: "Brigade de Gendarmerie de Ouagadougou", 
    type: "Gendarmerie", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Route de Kaya", 
    phone: "25308484", 
    latitude: 12.3714, 
    longitude: -1.5197
  },
  { 
    id: "oua-gen-2", 
    name: "Groupement de Gendarmerie du Centre", 
    type: "Gendarmerie", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25308400"
  },
  { 
    id: "oua-gen-3", 
    name: "Brigade Laabal - Lutte contre criminalité", 
    type: "Gendarmerie", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Zone militaire", 
    phone: "50400504", 
    latitude: 12.3714, 
    longitude: -1.5197,
    services: ["Lutte contre criminalité", "Enquêtes"]
  },
  { 
    id: "oua-gen-4", 
    name: "Brigade Territoriale de Ouagadougou", 
    type: "Gendarmerie", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25308500"
  },

  // Pompiers
  { 
    id: "oua-pom-1", 
    name: "Brigade des Sapeurs-Pompiers de Ouagadougou", 
    type: "Pompiers", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Avenue Charles De Gaulle", 
    phone: "25306018", 
    latitude: 12.3714, 
    longitude: -1.5197,
    available24h: true,
    services: ["Incendies", "Secours", "Ambulances"]
  },
  { 
    id: "oua-pom-2", 
    name: "Centre de Secours des Pompiers - Zone 1", 
    type: "Pompiers", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25362020",
    available24h: true
  },
  { 
    id: "oua-pom-3", 
    name: "Centre de Secours des Pompiers - Zone 3", 
    type: "Pompiers", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25374040",
    available24h: true
  },

  // Hôpitaux et Santé
  { 
    id: "oua-hop-1", 
    name: "CHU Yalgado Ouédraogo", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Avenue Gamal Abdel Nasser", 
    phone: "25306401", 
    email: "chu.yalgado@fasonet.bf",
    latitude: 12.3834, 
    longitude: -1.5169,
    available24h: true,
    services: ["Urgences", "Chirurgie", "Maternité", "Pédiatrie"]
  },
  { 
    id: "oua-hop-2", 
    name: "CHU Tengandogo", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Quartier Tengandogo", 
    phone: "25402424", 
    latitude: 12.3422, 
    longitude: -1.4819,
    available24h: true,
    services: ["Urgences", "Chirurgie", "Réanimation"]
  },
  { 
    id: "oua-hop-3", 
    name: "CHU Pédiatrique Charles De Gaulle", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Avenue Charles De Gaulle", 
    phone: "25306262",
    available24h: true,
    services: ["Pédiatrie", "Néonatologie", "Urgences pédiatriques"]
  },
  { 
    id: "oua-hop-4", 
    name: "CHU Blaise Compaoré", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25408080",
    available24h: true,
    services: ["Urgences", "Chirurgie"]
  },
  { 
    id: "oua-hop-5", 
    name: "Centre Médical avec Antenne Chirurgicale Schiphra", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Secteur 30", 
    phone: "25375015", 
    latitude: 12.4018, 
    longitude: -1.4760,
    available24h: true
  },
  { 
    id: "oua-hop-6", 
    name: "Clinique Yeredon", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Avenue Kwame Nkrumah", 
    phone: "25360088", 
    latitude: 12.3714, 
    longitude: -1.5197,
    available24h: true
  },
  { 
    id: "oua-hop-7", 
    name: "Clinique Princesse Sarah", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Ouaga 2000", 
    phone: "25375050",
    services: ["Urgences", "Maternité"]
  },
  { 
    id: "oua-hop-8", 
    name: "Clinique Internationale de l'Amitié", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Secteur 15", 
    phone: "25363636"
  },
  { 
    id: "oua-hop-9", 
    name: "Polyclinique Notre Dame de la Paix", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25367070"
  },
  { 
    id: "oua-hop-10", 
    name: "Centre Médical Paul VI", 
    type: "Hôpitaux", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25310707"
  },

  // Ambulances
  { 
    id: "oua-amb-1", 
    name: "SAMU Ouagadougou", 
    type: "Ambulance", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25366824",
    available24h: true
  },
  { 
    id: "oua-amb-2", 
    name: "Service d'Ambulances - CHU Yalgado", 
    type: "Ambulance", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25306450",
    available24h: true
  },

  // ============================================
  // RÉGION DES HAUTS-BASSINS (BOBO-DIOULASSO)
  // ============================================
  // Police
  { 
    id: "bob-pol-1", 
    name: "Commissariat de Police de Bobo-Dioulasso", 
    type: "Police", 
    city: "Bobo-Dioulasso", 
    region: "Hauts-Bassins",
    address: "Avenue de la République", 
    phone: "20970017", 
    latitude: 11.1770, 
    longitude: -4.2979,
    available24h: true
  },
  { 
    id: "bob-pol-2", 
    name: "Commissariat Urbain de Konsa", 
    type: "Police", 
    city: "Bobo-Dioulasso", 
    region: "Hauts-Bassins",
    phone: "20970200"
  },
  { 
    id: "bob-pol-3", 
    name: "Commissariat Urbain de Dafra", 
    type: "Police", 
    city: "Bobo-Dioulasso", 
    region: "Hauts-Bassins",
    phone: "20970300"
  },

  // Gendarmerie
  { 
    id: "bob-gen-1", 
    name: "Compagnie de Gendarmerie de Bobo-Dioulasso", 
    type: "Gendarmerie", 
    city: "Bobo-Dioulasso", 
    region: "Hauts-Bassins",
    address: "Quartier Sarfalao", 
    phone: "20970100", 
    latitude: 11.1770, 
    longitude: -4.2979
  },
  { 
    id: "bob-gen-2", 
    name: "Groupement de Gendarmerie des Hauts-Bassins", 
    type: "Gendarmerie", 
    city: "Bobo-Dioulasso", 
    region: "Hauts-Bassins",
    phone: "20970150"
  },

  // Pompiers
  { 
    id: "bob-pom-1", 
    name: "Caserne des Pompiers de Bobo-Dioulasso", 
    type: "Pompiers", 
    city: "Bobo-Dioulasso", 
    region: "Hauts-Bassins",
    address: "Avenue Loudun", 
    phone: "20970018", 
    latitude: 11.1770, 
    longitude: -4.2979,
    available24h: true
  },

  // Hôpitaux
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
    services: ["Urgences", "Chirurgie", "Maternité"]
  },
  { 
    id: "bob-hop-2", 
    name: "Centre Médical de Bobo-Dioulasso", 
    type: "Hôpitaux", 
    city: "Bobo-Dioulasso", 
    region: "Hauts-Bassins",
    phone: "20970300"
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
    address: "Centre-ville", 
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
    phone: "25441100"
  },
  { 
    id: "kou-hop-1", 
    name: "Centre Médical de Koudougou", 
    type: "Hôpitaux", 
    city: "Koudougou", 
    region: "Centre-Ouest",
    phone: "25441215", 
    latitude: 12.2529, 
    longitude: -2.3622
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
    address: "Rue principale", 
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
    phone: "24550100"
  },
  { 
    id: "oua2-hop-1", 
    name: "Centre Hospitalier Régional de Ouahigouya", 
    type: "Hôpitaux", 
    city: "Ouahigouya", 
    region: "Nord",
    phone: "24550200",
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
    phone: "24770010"
  },
  { 
    id: "fad-gen-1", 
    name: "Brigade de Gendarmerie de Fada N'Gourma", 
    type: "Gendarmerie", 
    city: "Fada N'Gourma", 
    region: "Est",
    phone: "24770050"
  },
  { 
    id: "fad-hop-1", 
    name: "Centre Hospitalier Régional de Fada N'Gourma", 
    type: "Hôpitaux", 
    city: "Fada N'Gourma", 
    region: "Est",
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
    phone: "24460010"
  },
  { 
    id: "dor-gen-1", 
    name: "Brigade de Gendarmerie de Dori", 
    type: "Gendarmerie", 
    city: "Dori", 
    region: "Sahel",
    phone: "24460050"
  },
  { 
    id: "dor-hop-1", 
    name: "Centre Médical de Dori", 
    type: "Hôpitaux", 
    city: "Dori", 
    region: "Sahel",
    phone: "24460100"
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
    phone: "25550010"
  },
  { 
    id: "man-hop-1", 
    name: "Centre Médical de Manga", 
    type: "Hôpitaux", 
    city: "Manga", 
    region: "Centre-Sud",
    phone: "25550100"
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
    phone: "24453010"
  },
  { 
    id: "kay-gen-1", 
    name: "Brigade de Gendarmerie de Kaya", 
    type: "Gendarmerie", 
    city: "Kaya", 
    region: "Centre-Nord",
    phone: "24453050"
  },
  { 
    id: "kay-hop-1", 
    name: "Centre Hospitalier Régional de Kaya", 
    type: "Hôpitaux", 
    city: "Kaya", 
    region: "Centre-Nord",
    phone: "24453100",
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
    phone: "20900010"
  },
  { 
    id: "gao-hop-1", 
    name: "Centre Médical de Gaoua", 
    type: "Hôpitaux", 
    city: "Gaoua", 
    region: "Sud-Ouest",
    phone: "20900100"
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
    phone: "20520010"
  },
  { 
    id: "ded-hop-1", 
    name: "Centre Hospitalier Régional de Dédougou", 
    type: "Hôpitaux", 
    city: "Dédougou", 
    region: "Boucle du Mouhoun",
    phone: "20520100"
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
    phone: "25309010"
  },
  { 
    id: "zin-hop-1", 
    name: "Centre Médical de Ziniaré", 
    type: "Hôpitaux", 
    city: "Ziniaré", 
    region: "Plateau-Central",
    phone: "25309100"
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
    phone: "20910010"
  },
  { 
    id: "ban-hop-1", 
    name: "Centre Hospitalier Régional de Banfora", 
    type: "Hôpitaux", 
    city: "Banfora", 
    region: "Cascades",
    phone: "20910100"
  },

  // ============================================
  // SERVICES SOCIAUX ET ONG
  // ============================================
  { 
    id: "soc-1", 
    name: "Ministère de la Femme et de la Famille", 
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
    phone: "25306767",
    available24h: true
  },
  { 
    id: "soc-3", 
    name: "SOS Violences Conjugales", 
    type: "Services sociaux", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "70205050"
  },

  // ONG et Organisations
  { 
    id: "ong-1", 
    name: "Croix-Rouge Burkinabè - Siège National", 
    type: "Croix-Rouge", 
    city: "Ouagadougou", 
    region: "Centre",
    address: "Avenue Kwame Nkrumah", 
    phone: "25306313", 
    latitude: 12.3714, 
    longitude: -1.5197,
    available24h: true
  },
  { 
    id: "ong-2", 
    name: "Croix-Rouge Bobo-Dioulasso", 
    type: "Croix-Rouge", 
    city: "Bobo-Dioulasso", 
    region: "Hauts-Bassins",
    phone: "20970313"
  },
  { 
    id: "ong-3", 
    name: "Médecins Sans Frontières - Ouagadougou", 
    type: "ONG", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25361424", 
    latitude: 12.3714, 
    longitude: -1.5197
  },
  { 
    id: "ong-4", 
    name: "SOS Enfants Burkina", 
    type: "ONG", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25361010", 
    latitude: 12.3714, 
    longitude: -1.5197
  },
  { 
    id: "ong-5", 
    name: "UNICEF Burkina Faso", 
    type: "ONG", 
    city: "Ouagadougou", 
    region: "Centre",
    phone: "25306200",
    email: "ouagadougou@unicef.org"
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
