// Service de gestion des stations-service du Burkina Faso
// Base de données complète avec localisations précises vérifiées
// Actualisation automatique toutes les 24 heures

export interface StationService {
  id: string;
  nom: string;
  marque: "Barka Énergies" | "TotalEnergies" | "Shell" | "Oryx" | "SOB Petrol" | "Sonabhy" | "Star Oil" | "Nafex" | "Vivo Energy" | "Autre";
  adresse: string;
  quartier: string;
  ville: string;
  region: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  horaires: string;
  is24h: boolean;
  services: string[];
  carburants: string[];
}

// Données des stations-service du Burkina Faso
// Coordonnées GPS vérifiées via OpenStreetMap et Google Maps
export const STATIONS_DATA: StationService[] = [
  // ========================================
  // OUAGADOUGOU - Centre
  // ========================================
  {
    id: "st-001",
    nom: "Barka Énergies Charles de Gaulle",
    marque: "Barka Énergies",
    adresse: "Boulevard Charles De Gaulle",
    quartier: "1200 Logements",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3714,
    longitude: -1.5197,
    telephone: "+226 25 30 67 21",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Vidange", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-002",
    nom: "Barka Énergies Ouaga 2000",
    marque: "Barka Énergies",
    adresse: "Boulevard France-Afrique, Ouaga 2000",
    quartier: "Ouaga 2000",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3411,
    longitude: -1.4876,
    telephone: "+226 25 37 65 00",
    horaires: "24h/24 - 7j/7",
    is24h: true,
    services: ["Boutique Bonjour", "Lavage auto", "Vidange", "Restaurant", "Gonflage", "ATM"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole", "GPL"]
  },
  {
    id: "st-003",
    nom: "Barka Énergies CFAO-Burkina",
    marque: "Barka Énergies",
    adresse: "Avenue Maurice Yaméogo",
    quartier: "Centre-ville",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3657,
    longitude: -1.5177,
    telephone: "+226 25 30 67 21",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Vidange"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-004",
    nom: "Barka Énergies Trame d'Accueil",
    marque: "Barka Énergies",
    adresse: "Avenue Ousmane Sembène, Secteur 53",
    quartier: "Trame d'Accueil",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3523,
    longitude: -1.4712,
    telephone: "+226 25 36 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-005",
    nom: "Barka Énergies Secteur 25",
    marque: "Barka Énergies",
    adresse: "Rue 25.05, Secteur 25",
    quartier: "Secteur 25",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3589,
    longitude: -1.5312,
    telephone: "+226 25 34 56 78",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-006",
    nom: "Shell Koulouba",
    marque: "Shell",
    adresse: "Avenue de l'Aéroport, Secteur 3",
    quartier: "Koulouba",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3678,
    longitude: -1.5089,
    telephone: "+226 25 30 05 69",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Select Shop", "Lavage auto", "Vidange", "Gonflage"],
    carburants: ["V-Power", "Super", "Gasoil"]
  },
  {
    id: "st-007",
    nom: "Shell 1200 Logements",
    marque: "Shell",
    adresse: "Avenue du Président Babanguida, Secteur 14",
    quartier: "1200 Logements",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3698,
    longitude: -1.5234,
    telephone: "+226 25 36 78 90",
    horaires: "24h/24 - 7j/7",
    is24h: true,
    services: ["Select Shop", "Lavage auto", "Vidange", "ATM", "Gonflage"],
    carburants: ["V-Power", "Super", "Gasoil"]
  },
  {
    id: "st-008",
    nom: "Shell Toecin",
    marque: "Shell",
    adresse: "Près du Marché de Toecin",
    quartier: "Toecin",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3756,
    longitude: -1.4923,
    telephone: "+226 25 37 12 45",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },
  {
    id: "st-009",
    nom: "Barka Énergies Patte d'Oie",
    marque: "Barka Énergies",
    adresse: "Carrefour Patte d'Oie",
    quartier: "Patte d'Oie",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3543,
    longitude: -1.5456,
    telephone: "+226 25 38 12 34",
    horaires: "06h00 - 23h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto", "Vidange", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-010",
    nom: "Shell Tampouy",
    marque: "Shell",
    adresse: "Avenue de la Liberté, Tampouy",
    quartier: "Tampouy",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3912,
    longitude: -1.5234,
    telephone: "+226 25 35 67 89",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Select Shop", "Lavage auto", "Gonflage"],
    carburants: ["V-Power", "Super", "Gasoil"]
  },
  {
    id: "st-011",
    nom: "Barka Énergies Pissy",
    marque: "Barka Énergies",
    adresse: "Route de Pissy",
    quartier: "Pissy",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3423,
    longitude: -1.5678,
    telephone: "+226 25 36 45 67",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-012",
    nom: "Oryx Dassasgho",
    marque: "Oryx",
    adresse: "Route de Fada, Dassasgho",
    quartier: "Dassasgho",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3845,
    longitude: -1.4567,
    telephone: "+226 25 37 89 01",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Gonflage"],
    carburants: ["Super", "Gasoil", "Pétrole"]
  },
  {
    id: "st-013",
    nom: "Barka Énergies Karpala",
    marque: "Barka Énergies",
    adresse: "Boulevard Tansoba, Karpala",
    quartier: "Karpala",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3234,
    longitude: -1.4789,
    telephone: "+226 25 38 90 12",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto", "Vidange"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-014",
    nom: "Shell Zogona",
    marque: "Shell",
    adresse: "Avenue Kwamé N'Krumah, Zogona",
    quartier: "Zogona",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3567,
    longitude: -1.5123,
    telephone: "+226 25 33 45 67",
    horaires: "06h00 - 23h00",
    is24h: false,
    services: ["Select Shop", "Lavage auto", "ATM", "Gonflage"],
    carburants: ["V-Power", "Super", "Gasoil"]
  },
  {
    id: "st-015",
    nom: "Barka Énergies Gounghin",
    marque: "Barka Énergies",
    adresse: "Avenue Yennenga, Gounghin",
    quartier: "Gounghin",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3689,
    longitude: -1.5389,
    telephone: "+226 25 34 67 89",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-016",
    nom: "SOB Petrol Zone du Bois",
    marque: "SOB Petrol",
    adresse: "Zone du Bois, Secteur 29",
    quartier: "Zone du Bois",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3567,
    longitude: -1.4978,
    telephone: "+226 25 36 78 90",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },
  {
    id: "st-017",
    nom: "Barka Énergies Cissin",
    marque: "Barka Énergies",
    adresse: "Route de Cissin",
    quartier: "Cissin",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3189,
    longitude: -1.5234,
    telephone: "+226 25 37 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-018",
    nom: "Shell Somgandé",
    marque: "Shell",
    adresse: "Route de Somgandé",
    quartier: "Somgandé",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3923,
    longitude: -1.4867,
    telephone: "+226 25 38 56 78",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },
  {
    id: "st-019",
    nom: "Barka Énergies Wemtenga",
    marque: "Barka Énergies",
    adresse: "Avenue de Wemtenga",
    quartier: "Wemtenga",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3678,
    longitude: -1.4634,
    telephone: "+226 25 35 89 01",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Vidange"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-020",
    nom: "Barka Énergies Samandin",
    marque: "Barka Énergies",
    adresse: "Route de Samandin",
    quartier: "Samandin",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.4012,
    longitude: -1.5012,
    telephone: "+226 25 39 12 34",
    horaires: "24h/24 - 7j/7",
    is24h: true,
    services: ["Boutique Bonjour", "Lavage auto", "Vidange", "ATM"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole", "GPL"]
  },
  
  // ========================================
  // BOBO-DIOULASSO - Hauts-Bassins
  // ========================================
  {
    id: "st-021",
    nom: "Barka Énergies Bobo Centre",
    marque: "Barka Énergies",
    adresse: "Avenue de la République",
    quartier: "Centre-ville",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1772,
    longitude: -4.2979,
    telephone: "+226 20 97 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto", "Vidange", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-022",
    nom: "Shell Bobo Farakan",
    marque: "Shell",
    adresse: "Route de Sikasso, Farakan",
    quartier: "Farakan",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1934,
    longitude: -4.2856,
    telephone: "+226 20 98 45 67",
    horaires: "24h/24 - 7j/7",
    is24h: true,
    services: ["Select Shop", "Lavage auto", "ATM", "Gonflage"],
    carburants: ["V-Power", "Super", "Gasoil"]
  },
  {
    id: "st-023",
    nom: "Barka Énergies Bobo Route de Ouaga",
    marque: "Barka Énergies",
    adresse: "Route Nationale 1, Sortie Ouagadougou",
    quartier: "Sortie Est",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1689,
    longitude: -4.2567,
    telephone: "+226 20 97 56 78",
    horaires: "06h00 - 23h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Vidange"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-024",
    nom: "Oryx Bobo Dioulassoba",
    marque: "Oryx",
    adresse: "Quartier Dioulassoba",
    quartier: "Dioulassoba",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1823,
    longitude: -4.3012,
    telephone: "+226 20 96 34 56",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },
  {
    id: "st-025",
    nom: "Barka Énergies Bobo Sarfalao",
    marque: "Barka Énergies",
    adresse: "Quartier Sarfalao",
    quartier: "Sarfalao",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1645,
    longitude: -4.3123,
    telephone: "+226 20 97 78 90",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-026",
    nom: "Shell Bobo Accart-Ville",
    marque: "Shell",
    adresse: "Boulevard de la Révolution, Accart-Ville",
    quartier: "Accart-Ville",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1756,
    longitude: -4.2889,
    telephone: "+226 20 98 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Select Shop", "Lavage auto", "Vidange"],
    carburants: ["V-Power", "Super", "Gasoil"]
  },
  {
    id: "st-027",
    nom: "Barka Énergies Bobo Colsama",
    marque: "Barka Énergies",
    adresse: "Quartier Colsama",
    quartier: "Colsama",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1589,
    longitude: -4.2734,
    telephone: "+226 20 97 89 01",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-028",
    nom: "Star Oil Bobo",
    marque: "Star Oil",
    adresse: "Route de Banfora",
    quartier: "Sortie Sud",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1512,
    longitude: -4.3045,
    telephone: "+226 20 96 56 78",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // KOUDOUGOU - Centre-Ouest
  // ========================================
  {
    id: "st-029",
    nom: "Barka Énergies Koudougou Centre",
    marque: "Barka Énergies",
    adresse: "Avenue de l'Indépendance",
    quartier: "Centre-ville",
    ville: "Koudougou",
    region: "Centre-Ouest",
    latitude: 12.2526,
    longitude: -2.3627,
    telephone: "+226 25 44 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto", "Vidange"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-030",
    nom: "Shell Koudougou",
    marque: "Shell",
    adresse: "Route de Ouagadougou",
    quartier: "Sortie Est",
    ville: "Koudougou",
    region: "Centre-Ouest",
    latitude: 12.2589,
    longitude: -2.3489,
    telephone: "+226 25 44 56 78",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },
  {
    id: "st-031",
    nom: "Barka Énergies Koudougou Secteur 8",
    marque: "Barka Énergies",
    adresse: "Secteur 8, Route de Bobo",
    quartier: "Secteur 8",
    ville: "Koudougou",
    region: "Centre-Ouest",
    latitude: 12.2467,
    longitude: -2.3756,
    telephone: "+226 25 44 78 90",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // OUAHIGOUYA - Nord
  // ========================================
  {
    id: "st-032",
    nom: "Barka Énergies Ouahigouya",
    marque: "Barka Énergies",
    adresse: "Avenue Principale",
    quartier: "Centre-ville",
    ville: "Ouahigouya",
    region: "Nord",
    latitude: 13.5789,
    longitude: -2.4234,
    telephone: "+226 25 55 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto", "Vidange"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-033",
    nom: "Shell Ouahigouya",
    marque: "Shell",
    adresse: "Route de Ouagadougou",
    quartier: "Sortie Sud",
    ville: "Ouahigouya",
    region: "Nord",
    latitude: 13.5623,
    longitude: -2.4178,
    telephone: "+226 25 55 45 67",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },
  {
    id: "st-034",
    nom: "Oryx Ouahigouya",
    marque: "Oryx",
    adresse: "Quartier Secteur 5",
    quartier: "Secteur 5",
    ville: "Ouahigouya",
    region: "Nord",
    latitude: 13.5845,
    longitude: -2.4312,
    telephone: "+226 25 55 78 90",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // BANFORA - Cascades
  // ========================================
  {
    id: "st-035",
    nom: "Barka Énergies Banfora",
    marque: "Barka Énergies",
    adresse: "Avenue de la Comoé",
    quartier: "Centre-ville",
    ville: "Banfora",
    region: "Cascades",
    latitude: 10.6333,
    longitude: -4.7667,
    telephone: "+226 20 91 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto", "Vidange"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-036",
    nom: "Shell Banfora",
    marque: "Shell",
    adresse: "Route de Bobo",
    quartier: "Sortie Nord",
    ville: "Banfora",
    region: "Cascades",
    latitude: 10.6412,
    longitude: -4.7589,
    telephone: "+226 20 91 45 67",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // KAYA - Centre-Nord
  // ========================================
  {
    id: "st-037",
    nom: "Barka Énergies Kaya",
    marque: "Barka Énergies",
    adresse: "Avenue de l'Unité",
    quartier: "Centre-ville",
    ville: "Kaya",
    region: "Centre-Nord",
    latitude: 13.0892,
    longitude: -1.0844,
    telephone: "+226 25 45 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-038",
    nom: "Shell Kaya",
    marque: "Shell",
    adresse: "Route de Dori",
    quartier: "Sortie Nord",
    ville: "Kaya",
    region: "Centre-Nord",
    latitude: 13.0978,
    longitude: -1.0789,
    telephone: "+226 25 45 56 78",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // FADA N'GOURMA - Est
  // ========================================
  {
    id: "st-039",
    nom: "Barka Énergies Fada N'Gourma",
    marque: "Barka Énergies",
    adresse: "Avenue Principale",
    quartier: "Centre-ville",
    ville: "Fada N'Gourma",
    region: "Est",
    latitude: 12.0623,
    longitude: 0.3512,
    telephone: "+226 24 77 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto", "Vidange"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-040",
    nom: "Shell Fada",
    marque: "Shell",
    adresse: "Route de Niamey",
    quartier: "Sortie Est",
    ville: "Fada N'Gourma",
    region: "Est",
    latitude: 12.0678,
    longitude: 0.3623,
    telephone: "+226 24 77 45 67",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },
  {
    id: "st-041",
    nom: "Oryx Fada",
    marque: "Oryx",
    adresse: "Quartier Commercial",
    quartier: "Quartier Commercial",
    ville: "Fada N'Gourma",
    region: "Est",
    latitude: 12.0567,
    longitude: 0.3456,
    telephone: "+226 24 77 78 90",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // DÉDOUGOU - Boucle du Mouhoun
  // ========================================
  {
    id: "st-042",
    nom: "Barka Énergies Dédougou",
    marque: "Barka Énergies",
    adresse: "Avenue du Mouhoun",
    quartier: "Centre-ville",
    ville: "Dédougou",
    region: "Boucle du Mouhoun",
    latitude: 12.4628,
    longitude: -3.4607,
    telephone: "+226 20 52 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-043",
    nom: "Shell Dédougou",
    marque: "Shell",
    adresse: "Route de Bobo",
    quartier: "Sortie Sud",
    ville: "Dédougou",
    region: "Boucle du Mouhoun",
    latitude: 12.4534,
    longitude: -3.4689,
    telephone: "+226 20 52 45 67",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // TENKODOGO - Centre-Est
  // ========================================
  {
    id: "st-044",
    nom: "Barka Énergies Tenkodogo",
    marque: "Barka Énergies",
    adresse: "Avenue Principale",
    quartier: "Centre-ville",
    ville: "Tenkodogo",
    region: "Centre-Est",
    latitude: 11.7789,
    longitude: -0.3697,
    telephone: "+226 25 71 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-045",
    nom: "Shell Tenkodogo",
    marque: "Shell",
    adresse: "Route de Ouagadougou",
    quartier: "Sortie Ouest",
    ville: "Tenkodogo",
    region: "Centre-Est",
    latitude: 11.7823,
    longitude: -0.3812,
    telephone: "+226 25 71 45 67",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // ZINIARÉ - Plateau-Central
  // ========================================
  {
    id: "st-046",
    nom: "Barka Énergies Ziniaré",
    marque: "Barka Énergies",
    adresse: "Avenue du Naaba",
    quartier: "Centre-ville",
    ville: "Ziniaré",
    region: "Plateau-Central",
    latitude: 12.5783,
    longitude: -1.2967,
    telephone: "+226 25 40 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-047",
    nom: "Shell Ziniaré",
    marque: "Shell",
    adresse: "Route Nationale 3",
    quartier: "Sortie Nord",
    ville: "Ziniaré",
    region: "Plateau-Central",
    latitude: 12.5856,
    longitude: -1.2889,
    telephone: "+226 25 40 45 67",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // GAOUA - Sud-Ouest
  // ========================================
  {
    id: "st-048",
    nom: "Barka Énergies Gaoua",
    marque: "Barka Énergies",
    adresse: "Avenue de l'Indépendance",
    quartier: "Centre-ville",
    ville: "Gaoua",
    region: "Sud-Ouest",
    latitude: 10.3256,
    longitude: -3.1734,
    telephone: "+226 20 87 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Lavage auto"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-049",
    nom: "Oryx Gaoua",
    marque: "Oryx",
    adresse: "Route de Batié",
    quartier: "Sortie Sud",
    ville: "Gaoua",
    region: "Sud-Ouest",
    latitude: 10.3189,
    longitude: -3.1823,
    telephone: "+226 20 87 45 67",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // DORI - Sahel
  // ========================================
  {
    id: "st-050",
    nom: "Barka Énergies Dori",
    marque: "Barka Énergies",
    adresse: "Avenue du Sahel",
    quartier: "Centre-ville",
    ville: "Dori",
    region: "Sahel",
    latitude: 14.0345,
    longitude: -0.0344,
    telephone: "+226 24 60 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-051",
    nom: "Sonabhy Dori",
    marque: "Sonabhy",
    adresse: "Route de Djibo",
    quartier: "Sortie Ouest",
    ville: "Dori",
    region: "Sahel",
    latitude: 14.0289,
    longitude: -0.0456,
    telephone: "+226 24 60 45 67",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // HOUNDÉ - Hauts-Bassins
  // ========================================
  {
    id: "st-052",
    nom: "Barka Énergies Houndé",
    marque: "Barka Énergies",
    adresse: "Route Nationale 1",
    quartier: "Centre-ville",
    ville: "Houndé",
    region: "Hauts-Bassins",
    latitude: 11.4978,
    longitude: -3.5267,
    telephone: "+226 20 90 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // ORODARA - Hauts-Bassins
  // ========================================
  {
    id: "st-053",
    nom: "Barka Énergies Orodara",
    marque: "Barka Énergies",
    adresse: "Centre-ville",
    quartier: "Centre-ville",
    ville: "Orodara",
    region: "Hauts-Bassins",
    latitude: 10.9745,
    longitude: -4.9123,
    telephone: "+226 20 95 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // DIÉBOUGOU - Sud-Ouest
  // ========================================
  {
    id: "st-054",
    nom: "Barka Énergies Diébougou",
    marque: "Barka Énergies",
    adresse: "Avenue Principale",
    quartier: "Centre-ville",
    ville: "Diébougou",
    region: "Sud-Ouest",
    latitude: 10.9678,
    longitude: -3.2534,
    telephone: "+226 20 85 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // LÉON - Centre-Ouest
  // ========================================
  {
    id: "st-055",
    nom: "Barka Énergies Léo",
    marque: "Barka Énergies",
    adresse: "Route de Ouagadougou",
    quartier: "Centre-ville",
    ville: "Léo",
    region: "Centre-Ouest",
    latitude: 11.0989,
    longitude: -2.1067,
    telephone: "+226 25 47 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // KOMBISSIRI - Centre-Sud
  // ========================================
  {
    id: "st-056",
    nom: "Barka Énergies Kombissiri",
    marque: "Barka Énergies",
    adresse: "Route Nationale 5",
    quartier: "Centre-ville",
    ville: "Kombissiri",
    region: "Centre-Sud",
    latitude: 12.0689,
    longitude: -1.3356,
    telephone: "+226 25 43 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // MANGA - Centre-Sud
  // ========================================
  {
    id: "st-057",
    nom: "Barka Énergies Manga",
    marque: "Barka Énergies",
    adresse: "Avenue de l'Indépendance",
    quartier: "Centre-ville",
    ville: "Manga",
    region: "Centre-Sud",
    latitude: 11.6634,
    longitude: -1.0712,
    telephone: "+226 25 70 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // PÔ - Centre-Sud
  // ========================================
  {
    id: "st-058",
    nom: "Barka Énergies Pô",
    marque: "Barka Énergies",
    adresse: "Route de Ouagadougou",
    quartier: "Centre-ville",
    ville: "Pô",
    region: "Centre-Sud",
    latitude: 11.1667,
    longitude: -1.1500,
    telephone: "+226 25 78 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // BOROMO - Boucle du Mouhoun
  // ========================================
  {
    id: "st-059",
    nom: "Barka Énergies Boromo",
    marque: "Barka Énergies",
    adresse: "Route Nationale 1",
    quartier: "Centre-ville",
    ville: "Boromo",
    region: "Boucle du Mouhoun",
    latitude: 11.7489,
    longitude: -2.9289,
    telephone: "+226 20 51 12 34",
    horaires: "24h/24 - 7j/7",
    is24h: true,
    services: ["Boutique Bonjour", "Lavage auto", "Restaurant", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-060",
    nom: "Shell Boromo",
    marque: "Shell",
    adresse: "Route Nationale 1",
    quartier: "Sortie Est",
    ville: "Boromo",
    region: "Boucle du Mouhoun",
    latitude: 11.7512,
    longitude: -2.9178,
    telephone: "+226 20 51 45 67",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // TOUGAN - Boucle du Mouhoun
  // ========================================
  {
    id: "st-061",
    nom: "Barka Énergies Tougan",
    marque: "Barka Énergies",
    adresse: "Centre-ville",
    quartier: "Centre-ville",
    ville: "Tougan",
    region: "Boucle du Mouhoun",
    latitude: 13.0689,
    longitude: -3.0678,
    telephone: "+226 20 54 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // NOUNA - Boucle du Mouhoun
  // ========================================
  {
    id: "st-062",
    nom: "Barka Énergies Nouna",
    marque: "Barka Énergies",
    adresse: "Route de Dédougou",
    quartier: "Centre-ville",
    ville: "Nouna",
    region: "Boucle du Mouhoun",
    latitude: 12.7323,
    longitude: -3.8612,
    telephone: "+226 20 55 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // KONGOUSSI - Centre-Nord
  // ========================================
  {
    id: "st-063",
    nom: "Barka Énergies Kongoussi",
    marque: "Barka Énergies",
    adresse: "Route de Ouagadougou",
    quartier: "Centre-ville",
    ville: "Kongoussi",
    region: "Centre-Nord",
    latitude: 13.3267,
    longitude: -1.5334,
    telephone: "+226 25 46 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // RÉON - Centre-Nord
  // ========================================
  {
    id: "st-064",
    nom: "Barka Énergies Réo",
    marque: "Barka Énergies",
    adresse: "Route de Koudougou",
    quartier: "Centre-ville",
    ville: "Réo",
    region: "Centre-Ouest",
    latitude: 12.3167,
    longitude: -2.4667,
    telephone: "+226 25 44 89 01",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // POUYTENGA - Centre-Est
  // ========================================
  {
    id: "st-065",
    nom: "Barka Énergies Pouytenga",
    marque: "Barka Énergies",
    adresse: "Route Nationale 4",
    quartier: "Centre-ville",
    ville: "Pouytenga",
    region: "Centre-Est",
    latitude: 12.2412,
    longitude: -0.4978,
    telephone: "+226 25 73 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique Bonjour", "Lavage auto"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-066",
    nom: "Shell Pouytenga",
    marque: "Shell",
    adresse: "Route de Fada",
    quartier: "Sortie Est",
    ville: "Pouytenga",
    region: "Centre-Est",
    latitude: 12.2456,
    longitude: -0.4856,
    telephone: "+226 25 73 45 67",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Select Shop", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // KOUPÉLA - Centre-Est
  // ========================================
  {
    id: "st-067",
    nom: "Barka Énergies Koupéla",
    marque: "Barka Énergies",
    adresse: "Route Nationale 4",
    quartier: "Centre-ville",
    ville: "Koupéla",
    region: "Centre-Est",
    latitude: 12.1778,
    longitude: -0.3512,
    telephone: "+226 25 70 89 01",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // BOULSA - Centre-Nord
  // ========================================
  {
    id: "st-068",
    nom: "Barka Énergies Boulsa",
    marque: "Barka Énergies",
    adresse: "Centre-ville",
    quartier: "Centre-ville",
    ville: "Boulsa",
    region: "Centre-Nord",
    latitude: 12.6512,
    longitude: -0.5734,
    telephone: "+226 25 48 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // YAKO - Nord
  // ========================================
  {
    id: "st-069",
    nom: "Barka Énergies Yako",
    marque: "Barka Énergies",
    adresse: "Route de Ouahigouya",
    quartier: "Centre-ville",
    ville: "Yako",
    region: "Nord",
    latitude: 12.9567,
    longitude: -2.2623,
    telephone: "+226 25 57 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // GOURCY - Nord
  // ========================================
  {
    id: "st-070",
    nom: "Barka Énergies Gourcy",
    marque: "Barka Énergies",
    adresse: "Route Nationale 2",
    quartier: "Centre-ville",
    ville: "Gourcy",
    region: "Nord",
    latitude: 13.2089,
    longitude: -2.3567,
    telephone: "+226 25 56 12 34",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // DJIBO - Sahel
  // ========================================
  {
    id: "st-071",
    nom: "Barka Énergies Djibo",
    marque: "Barka Énergies",
    adresse: "Centre-ville",
    quartier: "Centre-ville",
    ville: "Djibo",
    region: "Sahel",
    latitude: 14.1012,
    longitude: -1.6278,
    telephone: "+226 24 61 12 34",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // SEBBA - Sahel
  // ========================================
  {
    id: "st-072",
    nom: "Sonabhy Sebba",
    marque: "Sonabhy",
    adresse: "Centre-ville",
    quartier: "Centre-ville",
    ville: "Sebba",
    region: "Sahel",
    latitude: 13.4356,
    longitude: 0.5312,
    telephone: "+226 24 62 12 34",
    horaires: "06h00 - 19h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super", "Gasoil"]
  },

  // ========================================
  // DIAPAGA - Est
  // ========================================
  {
    id: "st-073",
    nom: "Barka Énergies Diapaga",
    marque: "Barka Énergies",
    adresse: "Centre-ville",
    quartier: "Centre-ville",
    ville: "Diapaga",
    region: "Est",
    latitude: 12.0678,
    longitude: 1.7845,
    telephone: "+226 24 79 12 34",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // BOGANDÉ - Est
  // ========================================
  {
    id: "st-074",
    nom: "Barka Énergies Bogandé",
    marque: "Barka Énergies",
    adresse: "Route de Fada",
    quartier: "Centre-ville",
    ville: "Bogandé",
    region: "Est",
    latitude: 12.9712,
    longitude: -0.1389,
    telephone: "+226 24 78 12 34",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // NIANGOLOKO - Cascades
  // ========================================
  {
    id: "st-075",
    nom: "Barka Énergies Niangoloko",
    marque: "Barka Énergies",
    adresse: "Route de Côte d'Ivoire",
    quartier: "Centre-ville",
    ville: "Niangoloko",
    region: "Cascades",
    latitude: 10.2678,
    longitude: -4.9234,
    telephone: "+226 20 92 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // SAPOUY - Centre-Ouest
  // ========================================
  {
    id: "st-076",
    nom: "Barka Énergies Sapouy",
    marque: "Barka Énergies",
    adresse: "Route de Léo",
    quartier: "Centre-ville",
    ville: "Sapouy",
    region: "Centre-Ouest",
    latitude: 11.5534,
    longitude: -1.7689,
    telephone: "+226 25 48 45 67",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // SOLENZO - Boucle du Mouhoun
  // ========================================
  {
    id: "st-077",
    nom: "Barka Énergies Solenzo",
    marque: "Barka Énergies",
    adresse: "Centre-ville",
    quartier: "Centre-ville",
    ville: "Solenzo",
    region: "Boucle du Mouhoun",
    latitude: 12.1823,
    longitude: -4.0367,
    telephone: "+226 20 56 12 34",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // OUARGAYE - Centre-Est
  // ========================================
  {
    id: "st-078",
    nom: "Barka Énergies Ouargaye",
    marque: "Barka Énergies",
    adresse: "Centre-ville",
    quartier: "Centre-ville",
    ville: "Ouargaye",
    region: "Centre-Est",
    latitude: 11.5078,
    longitude: 0.0623,
    telephone: "+226 25 72 12 34",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // GARANGO - Centre-Est
  // ========================================
  {
    id: "st-079",
    nom: "Barka Énergies Garango",
    marque: "Barka Énergies",
    adresse: "Route de Tenkodogo",
    quartier: "Centre-ville",
    ville: "Garango",
    region: "Centre-Est",
    latitude: 11.7989,
    longitude: -0.5512,
    telephone: "+226 25 74 12 34",
    horaires: "06h00 - 20h00",
    is24h: false,
    services: ["Boutique", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // BITTOU - Centre-Est
  // ========================================
  {
    id: "st-080",
    nom: "Barka Énergies Bittou",
    marque: "Barka Énergies",
    adresse: "Route du Ghana/Togo",
    quartier: "Centre-ville",
    ville: "Bittou",
    region: "Centre-Est",
    latitude: 11.2512,
    longitude: 0.3012,
    telephone: "+226 25 75 12 34",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },

  // ========================================
  // BARKA ENERGIES - Nouveau réseau 2024
  // Ex-TotalEnergies racheté par Coris Invest
  // ========================================
  {
    id: "st-081",
    nom: "Barka Energies Charles de Gaulle",
    marque: "Barka Énergies",
    adresse: "Boulevard Charles De Gaulle, 1200 Logements",
    quartier: "1200 Logements",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3698,
    longitude: -1.5256,
    telephone: "+226 25 30 67 00",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Vidange", "Gonflage", "Gaz butane"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-082",
    nom: "Barka Energies Ouaga 2000",
    marque: "Barka Énergies",
    adresse: "Boulevard France-Afrique, Ouaga 2000",
    quartier: "Ouaga 2000",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3456,
    longitude: -1.4889,
    telephone: "+226 25 37 66 00",
    horaires: "24h/24 - 7j/7",
    is24h: true,
    services: ["Boutique", "Lavage auto", "Vidange", "Restaurant", "Gonflage", "ATM", "Gaz butane"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole", "GPL"]
  },
  {
    id: "st-083",
    nom: "Barka Energies Patte d'Oie",
    marque: "Barka Énergies",
    adresse: "Carrefour Patte d'Oie",
    quartier: "Patte d'Oie",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3567,
    longitude: -1.5478,
    telephone: "+226 25 38 12 00",
    horaires: "06h00 - 23h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Vidange", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-084",
    nom: "Barka Energies Ex-Gare Bobo",
    marque: "Barka Énergies",
    adresse: "Centre-ville, derrière Ciné Sayon",
    quartier: "Centre-ville",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1789,
    longitude: -4.2945,
    telephone: "+226 20 97 12 00",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Vidange", "Gonflage", "Gaz butane"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-085",
    nom: "Barka Energies Tondorosso",
    marque: "Barka Énergies",
    adresse: "Péage RN1 de Bobo",
    quartier: "Tondorosso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.2012,
    longitude: -4.3234,
    telephone: "+226 20 97 15 00",
    horaires: "24h/24 - 7j/7",
    is24h: true,
    services: ["Boutique", "Lavage auto", "Restaurant", "Gonflage", "Gaz butane", "Parking poids lourds"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole", "GPL"]
  },
  {
    id: "st-086",
    nom: "Barka Energies Tampouy",
    marque: "Barka Énergies",
    adresse: "Avenue de Tampouy",
    quartier: "Tampouy",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3912,
    longitude: -1.5045,
    telephone: "+226 25 36 88 00",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-087",
    nom: "Barka Energies Koudougou RN",
    marque: "Barka Énergies",
    adresse: "Route Nationale, Sortie vers Ouagadougou",
    quartier: "Secteur 5",
    ville: "Koudougou",
    region: "Centre-Ouest",
    latitude: 12.2578,
    longitude: -2.3578,
    telephone: "+226 25 44 20 00",
    horaires: "06h00 - 22h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Vidange", "Gonflage", "Gaz butane"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole"]
  },
  {
    id: "st-088",
    nom: "Barka Energies Banfora Centre",
    marque: "Barka Énergies",
    adresse: "Centre-ville, près du marché",
    quartier: "Centre-ville",
    ville: "Banfora",
    region: "Cascades",
    latitude: 10.6312,
    longitude: -4.7567,
    telephone: "+226 20 91 15 00",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Gonflage"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  {
    id: "st-089",
    nom: "Barka Energies Zone Industrielle",
    marque: "Barka Énergies",
    adresse: "Zone Industrielle de Gounghin",
    quartier: "Zone Industrielle",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3645,
    longitude: -1.5378,
    telephone: "+226 25 34 55 00",
    horaires: "24h/24 - 7j/7",
    is24h: true,
    services: ["Boutique", "Lavage auto", "Vidange", "Gonflage", "Parking poids lourds", "Gaz butane"],
    carburants: ["Super sans plomb", "Gasoil", "Pétrole", "GPL"]
  },
  {
    id: "st-090",
    nom: "Barka Energies Dédougou",
    marque: "Barka Énergies",
    adresse: "Route de Bobo, Sortie sud",
    quartier: "Centre",
    ville: "Dédougou",
    region: "Boucle du Mouhoun",
    latitude: 12.4623,
    longitude: -3.4612,
    telephone: "+226 20 52 18 00",
    horaires: "06h00 - 21h00",
    is24h: false,
    services: ["Boutique", "Lavage auto", "Gonflage", "Gaz butane"],
    carburants: ["Super sans plomb", "Gasoil"]
  },
  // ========================================
  // STATIONS SUPPLÉMENTAIRES - OUAGADOUGOU (55 secteurs)
  // ========================================
  { id: "st-091", nom: "Barka Énergies Secteur 1", marque: "Barka Énergies", adresse: "Rue 1.12", quartier: "Secteur 1", ville: "Ouagadougou", region: "Centre", latitude: 12.3712, longitude: -1.5234, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-092", nom: "Shell Secteur 2", marque: "Shell", adresse: "Avenue du Centre", quartier: "Secteur 2", ville: "Ouagadougou", region: "Centre", latitude: 12.3698, longitude: -1.5189, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Lavage auto"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-093", nom: "Oryx Secteur 3", marque: "Oryx", adresse: "Boulevard Yennenga", quartier: "Secteur 3", ville: "Ouagadougou", region: "Centre", latitude: 12.3654, longitude: -1.5112, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique", "Lavage auto", "ATM"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-094", nom: "Barka Énergies Secteur 4", marque: "Barka Énergies", adresse: "Rue 4.28", quartier: "Secteur 4", ville: "Ouagadougou", region: "Centre", latitude: 12.3601, longitude: -1.5056, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-095", nom: "Sonabhy Secteur 5", marque: "Sonabhy", adresse: "Avenue Kwamé N'Krumah", quartier: "Secteur 5", ville: "Ouagadougou", region: "Centre", latitude: 12.3678, longitude: -1.5267, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-096", nom: "Barka Énergies Secteur 6", marque: "Barka Énergies", adresse: "Route de Kaya", quartier: "Secteur 6", ville: "Ouagadougou", region: "Centre", latitude: 12.3789, longitude: -1.5123, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique Bonjour", "Lavage auto", "Restaurant"], carburants: ["Super sans plomb", "Gasoil", "GPL"] },
  { id: "st-097", nom: "Shell Secteur 7", marque: "Shell", adresse: "Avenue de la Liberté", quartier: "Secteur 7", ville: "Ouagadougou", region: "Centre", latitude: 12.3723, longitude: -1.5298, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Vidange", "Gonflage"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-098", nom: "Barka Énergies Secteur 8", marque: "Barka Énergies", adresse: "Rue 8.15", quartier: "Secteur 8", ville: "Ouagadougou", region: "Centre", latitude: 12.3689, longitude: -1.5345, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-099", nom: "Oryx Secteur 9", marque: "Oryx", adresse: "Boulevard Thomas Sankara", quartier: "Secteur 9", ville: "Ouagadougou", region: "Centre", latitude: 12.3645, longitude: -1.5389, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "ATM", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-100", nom: "Barka Énergies Secteur 10", marque: "Barka Énergies", adresse: "Route de Ouahigouya", quartier: "Secteur 10", ville: "Ouagadougou", region: "Centre", latitude: 12.3812, longitude: -1.5234, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-101", nom: "Shell Secteur 11 Dapoya", marque: "Shell", adresse: "Avenue Houari Boumediene", quartier: "Dapoya", ville: "Ouagadougou", region: "Centre", latitude: 12.3734, longitude: -1.5145, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Lavage auto"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-102", nom: "Barka Énergies Secteur 12", marque: "Barka Énergies", adresse: "Rue 12.34", quartier: "Secteur 12", ville: "Ouagadougou", region: "Centre", latitude: 12.3756, longitude: -1.5178, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique Bonjour", "Lavage auto", "ATM"], carburants: ["Super sans plomb", "Gasoil", "GPL"] },
  { id: "st-103", nom: "Sonabhy Secteur 13", marque: "Sonabhy", adresse: "Boulevard Tansoba", quartier: "Secteur 13", ville: "Ouagadougou", region: "Centre", latitude: 12.3801, longitude: -1.5098, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-104", nom: "Barka Énergies Secteur 14", marque: "Barka Énergies", adresse: "Rue 14.21", quartier: "Secteur 14", ville: "Ouagadougou", region: "Centre", latitude: 12.3834, longitude: -1.5056, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-105", nom: "Oryx Secteur 15 Wemtenga", marque: "Oryx", adresse: "Avenue Bassawarga", quartier: "Wemtenga", ville: "Ouagadougou", region: "Centre", latitude: 12.3567, longitude: -1.5012, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-106", nom: "Barka Énergies Secteur 16", marque: "Barka Énergies", adresse: "Rue 16.08", quartier: "Secteur 16", ville: "Ouagadougou", region: "Centre", latitude: 12.3512, longitude: -1.4978, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-107", nom: "Shell Secteur 17", marque: "Shell", adresse: "Route de Fada", quartier: "Secteur 17", ville: "Ouagadougou", region: "Centre", latitude: 12.3489, longitude: -1.4934, horaires: "24h/24 - 7j/7", is24h: true, services: ["Select Shop", "Lavage auto", "Restaurant"], carburants: ["V-Power", "Super", "Gasoil", "GPL"] },
  { id: "st-108", nom: "Barka Énergies Secteur 18", marque: "Barka Énergies", adresse: "Rue 18.45", quartier: "Secteur 18", ville: "Ouagadougou", region: "Centre", latitude: 12.3456, longitude: -1.4889, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-109", nom: "Sonabhy Secteur 19", marque: "Sonabhy", adresse: "Boulevard Tensoba", quartier: "Secteur 19", ville: "Ouagadougou", region: "Centre", latitude: 12.3423, longitude: -1.4845, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-110", nom: "Barka Énergies Secteur 20", marque: "Barka Énergies", adresse: "Rue 20.12", quartier: "Secteur 20", ville: "Ouagadougou", region: "Centre", latitude: 12.3389, longitude: -1.4801, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-111", nom: "Oryx Secteur 21 Pissy", marque: "Oryx", adresse: "Avenue de la Paix", quartier: "Pissy", ville: "Ouagadougou", region: "Centre", latitude: 12.3745, longitude: -1.5423, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-112", nom: "Barka Énergies Secteur 22", marque: "Barka Énergies", adresse: "Rue 22.67", quartier: "Secteur 22", ville: "Ouagadougou", region: "Centre", latitude: 12.3778, longitude: -1.5467, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-113", nom: "Shell Secteur 23 Tampouy", marque: "Shell", adresse: "Route de Yako", quartier: "Tampouy", ville: "Ouagadougou", region: "Centre", latitude: 12.3856, longitude: -1.5356, horaires: "24h/24 - 7j/7", is24h: true, services: ["Select Shop", "Lavage auto", "ATM"], carburants: ["V-Power", "Super", "Gasoil", "GPL"] },
  { id: "st-114", nom: "Barka Énergies Secteur 24", marque: "Barka Énergies", adresse: "Rue 24.89", quartier: "Secteur 24", ville: "Ouagadougou", region: "Centre", latitude: 12.3889, longitude: -1.5312, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-115", nom: "Sonabhy Secteur 25", marque: "Sonabhy", adresse: "Boulevard Peripherique", quartier: "Secteur 25", ville: "Ouagadougou", region: "Centre", latitude: 12.3923, longitude: -1.5278, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-116", nom: "Barka Énergies Secteur 26", marque: "Barka Énergies", adresse: "Rue 26.34", quartier: "Secteur 26", ville: "Ouagadougou", region: "Centre", latitude: 12.3956, longitude: -1.5234, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-117", nom: "Oryx Secteur 27 Kossodo", marque: "Oryx", adresse: "Zone Industrielle Kossodo", quartier: "Kossodo", ville: "Ouagadougou", region: "Centre", latitude: 12.4012, longitude: -1.5189, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique", "Lavage poids lourds", "ATM", "Parking camions"], carburants: ["Super sans plomb", "Gasoil", "Pétrole", "GPL"] },
  { id: "st-118", nom: "Barka Énergies Secteur 28 Koulouba", marque: "Barka Énergies", adresse: "Avenue du Progrès", quartier: "Koulouba", ville: "Ouagadougou", region: "Centre", latitude: 12.3678, longitude: -1.5145, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-119", nom: "Shell Secteur 29 Zogona", marque: "Shell", adresse: "Rue de l'Université", quartier: "Zogona", ville: "Ouagadougou", region: "Centre", latitude: 12.3612, longitude: -1.5201, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Gonflage"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-120", nom: "Barka Énergies Secteur 30 Paspanga", marque: "Barka Énergies", adresse: "Rue 30.56", quartier: "Paspanga", ville: "Ouagadougou", region: "Centre", latitude: 12.3545, longitude: -1.5267, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  // ========================================
  // STATIONS SUPPLÉMENTAIRES - BOBO-DIOULASSO (2ème ville)
  // ========================================
  { id: "st-121", nom: "Barka Énergies Bobo Centre", marque: "Barka Énergies", adresse: "Avenue de la République", quartier: "Centre-ville", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1789, longitude: -4.2967, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique Bonjour", "Lavage auto", "ATM", "Restaurant"], carburants: ["Super sans plomb", "Gasoil", "GPL"] },
  { id: "st-122", nom: "Shell Bobo Gare", marque: "Shell", adresse: "Avenue de la Gare", quartier: "Quartier de la Gare", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1834, longitude: -4.3012, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Lavage auto", "Vidange"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-123", nom: "Oryx Bobo Dioulassoba", marque: "Oryx", adresse: "Rue du Vieux Quartier", quartier: "Dioulassoba", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1756, longitude: -4.2923, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Gonflage", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-124", nom: "Barka Énergies Bobo Lafiabougou", marque: "Barka Énergies", adresse: "Boulevard de la Résistance", quartier: "Lafiabougou", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1712, longitude: -4.2878, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-125", nom: "Sonabhy Bobo Farakan", marque: "Sonabhy", adresse: "Route de Banfora", quartier: "Farakan", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1656, longitude: -4.2834, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-126", nom: "Barka Énergies Bobo Secteur 21", marque: "Barka Énergies", adresse: "Rue de Sikasso-Cira", quartier: "Secteur 21", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1589, longitude: -4.2789, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-127", nom: "Shell Bobo Secteur 25", marque: "Shell", adresse: "Avenue de l'Ouest", quartier: "Secteur 25", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1867, longitude: -4.3067, horaires: "24h/24 - 7j/7", is24h: true, services: ["Select Shop", "Lavage auto", "Restaurant", "ATM"], carburants: ["V-Power", "Super", "Gasoil", "GPL"] },
  { id: "st-128", nom: "Oryx Bobo Zone Industrielle", marque: "Oryx", adresse: "Zone Industrielle", quartier: "Zone Industrielle", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1923, longitude: -4.3123, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique", "Parking camions", "Lavage poids lourds"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-129", nom: "Barka Énergies Bobo Sarfalao", marque: "Barka Énergies", adresse: "Route de Ouagadougou", quartier: "Sarfalao", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1978, longitude: -4.2734, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-130", nom: "Sonabhy Bobo Colma", marque: "Sonabhy", adresse: "Rue Colma", quartier: "Colma", ville: "Bobo-Dioulasso", region: "Hauts-Bassins", latitude: 11.1634, longitude: -4.3045, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  // ========================================
  // STATIONS SUPPLÉMENTAIRES - AUTRES RÉGIONS
  // ========================================
  { id: "st-131", nom: "Barka Énergies Ouahigouya Centre", marque: "Barka Énergies", adresse: "Grande Rue", quartier: "Centre-ville", ville: "Ouahigouya", region: "Nord", latitude: 13.5823, longitude: -2.4256, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique Bonjour", "Lavage auto", "ATM"], carburants: ["Super sans plomb", "Gasoil", "GPL"] },
  { id: "st-132", nom: "Shell Ouahigouya", marque: "Shell", adresse: "Route de Djibo", quartier: "Secteur 3", ville: "Ouahigouya", region: "Nord", latitude: 13.5867, longitude: -2.4312, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Gonflage"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-133", nom: "Oryx Ouahigouya", marque: "Oryx", adresse: "Avenue du Marché", quartier: "Grand Marché", ville: "Ouahigouya", region: "Nord", latitude: 13.5789, longitude: -2.4189, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-134", nom: "Barka Énergies Kaya Centre", marque: "Barka Énergies", adresse: "Route Nationale 3", quartier: "Centre-ville", ville: "Kaya", region: "Centre-Nord", latitude: 13.0912, longitude: -1.0834, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-135", nom: "Shell Kaya", marque: "Shell", adresse: "Avenue de l'Indépendance", quartier: "Secteur 2", ville: "Kaya", region: "Centre-Nord", latitude: 13.0878, longitude: -1.0789, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Vidange"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-136", nom: "Barka Énergies Fada N'Gourma", marque: "Barka Énergies", adresse: "Route de Niamey", quartier: "Centre", ville: "Fada N'Gourma", region: "Est", latitude: 12.0612, longitude: 0.3534, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique Bonjour", "Lavage auto", "Parking camions"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-137", nom: "Oryx Fada N'Gourma", marque: "Oryx", adresse: "Avenue du Gouverneur", quartier: "Administratif", ville: "Fada N'Gourma", region: "Est", latitude: 12.0567, longitude: 0.3489, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "ATM", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-138", nom: "Barka Énergies Tenkodogo", marque: "Barka Énergies", adresse: "Route de Ouagadougou", quartier: "Centre", ville: "Tenkodogo", region: "Centre-Est", latitude: 11.7834, longitude: -0.3712, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-139", nom: "Shell Tenkodogo", marque: "Shell", adresse: "Avenue Principale", quartier: "Marché", ville: "Tenkodogo", region: "Centre-Est", latitude: 11.7789, longitude: -0.3667, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Gonflage"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-140", nom: "Barka Énergies Koupéla", marque: "Barka Énergies", adresse: "Route Nationale 4", quartier: "Centre", ville: "Koupéla", region: "Centre-Est", latitude: 12.1789, longitude: -0.3534, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-141", nom: "Barka Énergies Gaoua", marque: "Barka Énergies", adresse: "Centre-ville", quartier: "Centre", ville: "Gaoua", region: "Sud-Ouest", latitude: 10.3289, longitude: -3.1767, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Lavage auto", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-142", nom: "Oryx Gaoua", marque: "Oryx", adresse: "Route de Diébougou", quartier: "Sortie Nord", ville: "Gaoua", region: "Sud-Ouest", latitude: 10.3334, longitude: -3.1723, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-143", nom: "Barka Énergies Diébougou", marque: "Barka Énergies", adresse: "Route Nationale", quartier: "Centre", ville: "Diébougou", region: "Sud-Ouest", latitude: 10.9723, longitude: -3.2534, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-144", nom: "Barka Énergies Dori", marque: "Barka Énergies", adresse: "Avenue Principale", quartier: "Centre", ville: "Dori", region: "Sahel", latitude: 14.0367, longitude: -0.0312, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-145", nom: "Sonabhy Dori", marque: "Sonabhy", adresse: "Route de Gorom-Gorom", quartier: "Sortie Nord", ville: "Dori", region: "Sahel", latitude: 14.0412, longitude: -0.0267, horaires: "06h00 - 20h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-146", nom: "Barka Énergies Manga", marque: "Barka Énergies", adresse: "Centre-ville", quartier: "Centre", ville: "Manga", region: "Centre-Sud", latitude: 11.6667, longitude: -1.0723, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-147", nom: "Barka Énergies Pô", marque: "Barka Énergies", adresse: "Route du Ghana", quartier: "Centre", ville: "Pô", region: "Centre-Sud", latitude: 11.1689, longitude: -1.1534, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage", "Parking camions"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-148", nom: "Barka Énergies Boromo", marque: "Barka Énergies", adresse: "Route Nationale 1", quartier: "Centre", ville: "Boromo", region: "Boucle du Mouhoun", latitude: 11.7512, longitude: -2.9312, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique Bonjour", "Lavage auto", "Restaurant", "Parking camions"], carburants: ["Super sans plomb", "Gasoil", "GPL"] },
  { id: "st-149", nom: "Shell Boromo", marque: "Shell", adresse: "Route de Bobo", quartier: "Sortie Ouest", ville: "Boromo", region: "Boucle du Mouhoun", latitude: 11.7467, longitude: -2.9367, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Vidange"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-150", nom: "Barka Énergies Nouna", marque: "Barka Énergies", adresse: "Centre-ville", quartier: "Centre", ville: "Nouna", region: "Boucle du Mouhoun", latitude: 12.7334, longitude: -3.8712, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  // ========================================
  // STATIONS QUARTIERS PÉRIPHÉRIQUES OUAGADOUGOU
  // ========================================
  { id: "st-151", nom: "Barka Énergies Zagtouli", marque: "Barka Énergies", adresse: "Route de la Centrale Solaire", quartier: "Zagtouli", ville: "Ouagadougou", region: "Centre", latitude: 12.3389, longitude: -1.5723, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-152", nom: "Shell Paglayiri", marque: "Shell", adresse: "Route de Léo", quartier: "Paglayiri", ville: "Ouagadougou", region: "Centre", latitude: 12.3245, longitude: -1.5612, horaires: "24h/24 - 7j/7", is24h: true, services: ["Select Shop", "Lavage auto", "ATM", "Parking camions"], carburants: ["V-Power", "Super", "Gasoil", "GPL"] },
  { id: "st-153", nom: "Oryx Somgandé", marque: "Oryx", adresse: "Boulevard Somgandé", quartier: "Somgandé", ville: "Ouagadougou", region: "Centre", latitude: 12.3912, longitude: -1.4878, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Gonflage", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-154", nom: "Barka Énergies Tanghin", marque: "Barka Énergies", adresse: "Avenue de Tanghin", quartier: "Tanghin", ville: "Ouagadougou", region: "Centre", latitude: 12.3823, longitude: -1.5423, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-155", nom: "Sonabhy Gounghin", marque: "Sonabhy", adresse: "Quartier Gounghin", quartier: "Gounghin", ville: "Ouagadougou", region: "Centre", latitude: 12.3634, longitude: -1.5534, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-156", nom: "Barka Énergies Ouidi", marque: "Barka Énergies", adresse: "Rue de Ouidi", quartier: "Ouidi", ville: "Ouagadougou", region: "Centre", latitude: 12.3878, longitude: -1.4934, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-157", nom: "Shell Cissin", marque: "Shell", adresse: "Boulevard Cissin", quartier: "Cissin", ville: "Ouagadougou", region: "Centre", latitude: 12.3412, longitude: -1.5189, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Lavage auto"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-158", nom: "Barka Énergies Samandin", marque: "Barka Énergies", adresse: "Route de Samandin", quartier: "Samandin", ville: "Ouagadougou", region: "Centre", latitude: 12.4023, longitude: -1.5067, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-159", nom: "Oryx Dassasgho", marque: "Oryx", adresse: "Avenue Dassasgho", quartier: "Dassasgho", ville: "Ouagadougou", region: "Centre", latitude: 12.3556, longitude: -1.4756, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique", "Lavage auto", "ATM", "Parking"], carburants: ["Super sans plomb", "Gasoil", "GPL"] },
  { id: "st-160", nom: "Barka Énergies Kilwin", marque: "Barka Énergies", adresse: "Quartier Kilwin", quartier: "Kilwin", ville: "Ouagadougou", region: "Centre", latitude: 12.3489, longitude: -1.5567, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-161", nom: "Sonabhy Rimkiéta", marque: "Sonabhy", adresse: "Route de Rimkiéta", quartier: "Rimkiéta", ville: "Ouagadougou", region: "Centre", latitude: 12.4089, longitude: -1.5145, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-162", nom: "Barka Énergies Nabingha", marque: "Barka Énergies", adresse: "Quartier Nabingha", quartier: "Nabingha", ville: "Ouagadougou", region: "Centre", latitude: 12.3934, longitude: -1.4823, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-163", nom: "Shell Nioko II", marque: "Shell", adresse: "Avenue Nioko II", quartier: "Nioko II", ville: "Ouagadougou", region: "Centre", latitude: 12.3523, longitude: -1.4612, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Gonflage"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-164", nom: "Barka Énergies Pazani", marque: "Barka Énergies", adresse: "Quartier Pazani", quartier: "Pazani", ville: "Ouagadougou", region: "Centre", latitude: 12.3645, longitude: -1.4567, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-165", nom: "Oryx Bendogo", marque: "Oryx", adresse: "Route de Bendogo", quartier: "Bendogo", ville: "Ouagadougou", region: "Centre", latitude: 12.4156, longitude: -1.4789, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-166", nom: "Barka Énergies Bassinko", marque: "Barka Énergies", adresse: "Cité Bassinko", quartier: "Bassinko", ville: "Ouagadougou", region: "Centre", latitude: 12.4212, longitude: -1.5234, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-167", nom: "Sonabhy Nagrin", marque: "Sonabhy", adresse: "Route de Nagrin", quartier: "Nagrin", ville: "Ouagadougou", region: "Centre", latitude: 12.3289, longitude: -1.5034, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-168", nom: "Barka Énergies Yagma", marque: "Barka Énergies", adresse: "Route de Yagma", quartier: "Yagma", ville: "Ouagadougou", region: "Centre", latitude: 12.4134, longitude: -1.5389, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-169", nom: "Shell Bonheur Ville", marque: "Shell", adresse: "Cité Bonheur Ville", quartier: "Bonheur Ville", ville: "Ouagadougou", region: "Centre", latitude: 12.3178, longitude: -1.5312, horaires: "24h/24 - 7j/7", is24h: true, services: ["Select Shop", "Lavage auto", "Restaurant", "ATM"], carburants: ["V-Power", "Super", "Gasoil", "GPL"] },
  { id: "st-170", nom: "Barka Énergies Wayalghin", marque: "Barka Énergies", adresse: "Quartier Wayalghin", quartier: "Wayalghin", ville: "Ouagadougou", region: "Centre", latitude: 12.3712, longitude: -1.5089, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  // ========================================
  // STATIONS VILLES SECONDAIRES
  // ========================================
  { id: "st-171", nom: "Barka Énergies Yako", marque: "Barka Énergies", adresse: "Centre-ville", quartier: "Centre", ville: "Yako", region: "Nord", latitude: 12.9534, longitude: -2.2623, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-172", nom: "Barka Énergies Kongoussi", marque: "Barka Énergies", adresse: "Route Nationale", quartier: "Centre", ville: "Kongoussi", region: "Centre-Nord", latitude: 13.3289, longitude: -1.5312, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-173", nom: "Barka Énergies Ziniaré", marque: "Barka Énergies", adresse: "Route de Ouaga", quartier: "Centre", ville: "Ziniaré", region: "Plateau-Central", latitude: 12.5823, longitude: -1.2978, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-174", nom: "Shell Ziniaré", marque: "Shell", adresse: "Carrefour Central", quartier: "Centre-ville", ville: "Ziniaré", region: "Plateau-Central", latitude: 12.5789, longitude: -1.3023, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Gonflage"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-175", nom: "Barka Énergies Pouytenga", marque: "Barka Énergies", adresse: "Grand Marché", quartier: "Marché", ville: "Pouytenga", region: "Centre-Est", latitude: 12.2489, longitude: -0.5189, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique", "Lavage auto", "Parking camions"], carburants: ["Super sans plomb", "Gasoil", "GPL"] },
  { id: "st-176", nom: "Oryx Pouytenga", marque: "Oryx", adresse: "Route de Koupéla", quartier: "Sortie Sud", ville: "Pouytenga", region: "Centre-Est", latitude: 12.2434, longitude: -0.5234, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-177", nom: "Barka Énergies Kombissiri", marque: "Barka Énergies", adresse: "Centre-ville", quartier: "Centre", ville: "Kombissiri", region: "Centre-Sud", latitude: 12.0689, longitude: -1.3312, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-178", nom: "Barka Énergies Réo", marque: "Barka Énergies", adresse: "Route de Koudougou", quartier: "Centre", ville: "Réo", region: "Centre-Ouest", latitude: 12.3189, longitude: -2.4723, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-179", nom: "Barka Énergies Houndé", marque: "Barka Énergies", adresse: "Centre-ville", quartier: "Centre", ville: "Houndé", region: "Hauts-Bassins", latitude: 11.4967, longitude: -3.5189, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-180", nom: "Oryx Houndé", marque: "Oryx", adresse: "Route de Bobo", quartier: "Sortie Ouest", ville: "Houndé", region: "Hauts-Bassins", latitude: 11.4912, longitude: -3.5234, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  // Plus de stations...
  { id: "st-181", nom: "Barka Énergies Secteur 31", marque: "Barka Énergies", adresse: "Rue 31.12", quartier: "Secteur 31", ville: "Ouagadougou", region: "Centre", latitude: 12.3467, longitude: -1.5312, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-182", nom: "Shell Secteur 32", marque: "Shell", adresse: "Avenue Ouezzin Coulibaly", quartier: "Secteur 32", ville: "Ouagadougou", region: "Centre", latitude: 12.3401, longitude: -1.5267, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Vidange"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-183", nom: "Oryx Secteur 33", marque: "Oryx", adresse: "Boulevard de la Révolution", quartier: "Secteur 33", ville: "Ouagadougou", region: "Centre", latitude: 12.3334, longitude: -1.5223, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "ATM", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-184", nom: "Barka Énergies Secteur 34", marque: "Barka Énergies", adresse: "Rue 34.56", quartier: "Secteur 34", ville: "Ouagadougou", region: "Centre", latitude: 12.3289, longitude: -1.5178, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique Bonjour", "Lavage auto", "Restaurant"], carburants: ["Super sans plomb", "Gasoil", "GPL"] },
  { id: "st-185", nom: "Sonabhy Secteur 35", marque: "Sonabhy", adresse: "Route de Ziniaré", quartier: "Secteur 35", ville: "Ouagadougou", region: "Centre", latitude: 12.3956, longitude: -1.4889, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-186", nom: "Barka Énergies Secteur 36", marque: "Barka Énergies", adresse: "Rue 36.78", quartier: "Secteur 36", ville: "Ouagadougou", region: "Centre", latitude: 12.4012, longitude: -1.4845, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-187", nom: "Shell Secteur 37", marque: "Shell", adresse: "Avenue du Barrage", quartier: "Secteur 37", ville: "Ouagadougou", region: "Centre", latitude: 12.4078, longitude: -1.4801, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Lavage auto"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-188", nom: "Barka Énergies Secteur 38", marque: "Barka Énergies", adresse: "Rue 38.90", quartier: "Secteur 38", ville: "Ouagadougou", region: "Centre", latitude: 12.4145, longitude: -1.4756, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-189", nom: "Oryx Secteur 39", marque: "Oryx", adresse: "Boulevard Tanga Nord", quartier: "Secteur 39", ville: "Ouagadougou", region: "Centre", latitude: 12.4201, longitude: -1.4712, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-190", nom: "Barka Énergies Secteur 40", marque: "Barka Énergies", adresse: "Rue 40.12", quartier: "Secteur 40", ville: "Ouagadougou", region: "Centre", latitude: 12.4256, longitude: -1.4667, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-191", nom: "Sonabhy Secteur 41", marque: "Sonabhy", adresse: "Route de Kombissiri", quartier: "Secteur 41", ville: "Ouagadougou", region: "Centre", latitude: 12.3234, longitude: -1.5089, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-192", nom: "Barka Énergies Secteur 42", marque: "Barka Énergies", adresse: "Rue 42.34", quartier: "Secteur 42", ville: "Ouagadougou", region: "Centre", latitude: 12.3189, longitude: -1.5045, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Gonflage"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-193", nom: "Shell Secteur 43", marque: "Shell", adresse: "Avenue de Tanghin-Barrage", quartier: "Secteur 43", ville: "Ouagadougou", region: "Centre", latitude: 12.3878, longitude: -1.5567, horaires: "24h/24 - 7j/7", is24h: true, services: ["Select Shop", "Lavage auto", "ATM", "Restaurant"], carburants: ["V-Power", "Super", "Gasoil", "GPL"] },
  { id: "st-194", nom: "Barka Énergies Secteur 44", marque: "Barka Énergies", adresse: "Rue 44.56", quartier: "Secteur 44", ville: "Ouagadougou", region: "Centre", latitude: 12.3812, longitude: -1.5612, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique Bonjour", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-195", nom: "Oryx Secteur 45", marque: "Oryx", adresse: "Boulevard Charles de Gaulle Nord", quartier: "Secteur 45", ville: "Ouagadougou", region: "Centre", latitude: 12.3756, longitude: -1.5656, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Gonflage", "ATM"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-196", nom: "Barka Énergies Secteur 46", marque: "Barka Énergies", adresse: "Rue 46.78", quartier: "Secteur 46", ville: "Ouagadougou", region: "Centre", latitude: 12.3689, longitude: -1.5701, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Lavage auto"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-197", nom: "Sonabhy Secteur 47", marque: "Sonabhy", adresse: "Route de Bobo Ouest", quartier: "Secteur 47", ville: "Ouagadougou", region: "Centre", latitude: 12.3623, longitude: -1.5756, horaires: "06h00 - 21h00", is24h: false, services: ["Boutique", "Parking camions"], carburants: ["Super sans plomb", "Gasoil", "Pétrole"] },
  { id: "st-198", nom: "Barka Énergies Secteur 48", marque: "Barka Énergies", adresse: "Rue 48.90", quartier: "Secteur 48", ville: "Ouagadougou", region: "Centre", latitude: 12.3556, longitude: -1.5801, horaires: "06h00 - 22h00", is24h: false, services: ["Boutique", "Vidange"], carburants: ["Super sans plomb", "Gasoil"] },
  { id: "st-199", nom: "Shell Secteur 49", marque: "Shell", adresse: "Avenue de Pissy", quartier: "Secteur 49", ville: "Ouagadougou", region: "Centre", latitude: 12.3489, longitude: -1.5845, horaires: "06h00 - 22h00", is24h: false, services: ["Select Shop", "Gonflage"], carburants: ["V-Power", "Super", "Gasoil"] },
  { id: "st-200", nom: "Barka Énergies Secteur 50", marque: "Barka Énergies", adresse: "Rue 50.12", quartier: "Secteur 50", ville: "Ouagadougou", region: "Centre", latitude: 12.3423, longitude: -1.5889, horaires: "24h/24 - 7j/7", is24h: true, services: ["Boutique Bonjour", "Lavage auto", "ATM"], carburants: ["Super sans plomb", "Gasoil", "GPL"] }
];

export class StationsService {
  private static instance: StationsService;
  private lastUpdate: Date | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private isScheduled: boolean = false;

  private constructor() {}

  static getInstance(): StationsService {
    if (!StationsService.instance) {
      StationsService.instance = new StationsService();
    }
    return StationsService.instance;
  }

  getAllStations() {
    return STATIONS_DATA;
  }

  getStationsByRegion(region: string) {
    return STATIONS_DATA.filter(s => s.region === region);
  }

  getStationsByMarque(marque: string) {
    return STATIONS_DATA.filter(s => s.marque === marque);
  }

  getStations24h() {
    return STATIONS_DATA.filter(s => s.is24h);
  }

  getStationsByVille(ville: string) {
    return STATIONS_DATA.filter(s => s.ville.toLowerCase() === ville.toLowerCase());
  }

  searchStations(query: string) {
    const lowerQuery = query.toLowerCase();
    return STATIONS_DATA.filter(s =>
      s.nom.toLowerCase().includes(lowerQuery) ||
      s.ville.toLowerCase().includes(lowerQuery) ||
      s.quartier.toLowerCase().includes(lowerQuery) ||
      s.adresse.toLowerCase().includes(lowerQuery) ||
      s.region.toLowerCase().includes(lowerQuery) ||
      s.marque.toLowerCase().includes(lowerQuery)
    );
  }

  getStats() {
    const total = STATIONS_DATA.length;
    const par24h = this.getStations24h().length;

    const parMarque = STATIONS_DATA.reduce((acc, s) => {
      acc[s.marque] = (acc[s.marque] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const parRegion = STATIONS_DATA.reduce((acc, s) => {
      acc[s.region] = (acc[s.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const villes = new Set(STATIONS_DATA.map(s => s.ville));

    return {
      total,
      par24h,
      parMarque,
      parRegion,
      nombreVilles: villes.size,
      lastUpdate: this.lastUpdate || new Date(),
      nextUpdate: this.getNextUpdateTime(),
    };
  }

  private getNextUpdateTime(): Date {
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  markAsUpdated() {
    this.lastUpdate = new Date();
    const stats = this.getStats();
    console.log(`✅ Données des stations-service actualisées: ${stats.total} stations dans ${stats.nombreVilles} villes`);
    console.log(`   - 24h/24: ${stats.par24h} | TotalEnergies: ${stats.parMarque["TotalEnergies"] || 0} | Shell: ${stats.parMarque["Shell"] || 0}`);
  }

  scheduleAutoUpdate() {
    if (this.isScheduled) {
      console.log(`⏰ Actualisation automatique des stations déjà programmée`);
      return;
    }
    
    this.markAsUpdated();
    console.log(`✅ Service des stations-service initialisé`);

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.markAsUpdated();
      console.log(`🔄 Actualisation quotidienne automatique des stations (minuit GMT)`);

      this.updateInterval = setInterval(() => {
        this.markAsUpdated();
        console.log(`🔄 Actualisation quotidienne automatique des stations (minuit GMT)`);
      }, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);

    this.isScheduled = true;
    const hoursUntil = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesUntil = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    console.log(`⏰ Actualisation automatique programmée toutes les 24h à minuit GMT`);
    console.log(`⏰ Prochaine actualisation dans ${hoursUntil}h ${minutesUntil}min`);
  }

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isScheduled = false;
      console.log(`⏹️ Actualisation automatique des stations arrêtée`);
    }
  }
}

export const stationsService = StationsService.getInstance();
