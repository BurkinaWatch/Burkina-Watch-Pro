export interface Restaurant {
  id: string;
  nom: string;
  type: "Africain" | "Burkinabè" | "Français" | "Libanais" | "Asiatique" | "Fast-food" | "Pizzeria" | "Grillades" | "Maquis" | "Café" | "Pâtisserie" | "International" | "Italien" | "Fusion";
  adresse: string;
  quartier: string;
  ville: string;
  region: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  horaires: string;
  fermeture?: string;
  gammePrix: "Économique" | "Moyen" | "Haut de gamme" | "Luxe";
  services: string[];
  specialites: string[];
  capacite?: number;
  wifi: boolean;
  climatisation: boolean;
  parking: boolean;
  terrasse: boolean;
  livraison: boolean;
  source: "Vérifié" | "OSM";
}

export const typeColors: Record<string, string> = {
  "Africain": "bg-amber-600 text-white",
  "Burkinabè": "bg-green-600 text-white",
  "Français": "bg-blue-600 text-white",
  "Libanais": "bg-red-600 text-white",
  "Asiatique": "bg-orange-500 text-white",
  "Fast-food": "bg-yellow-500 text-black",
  "Pizzeria": "bg-red-500 text-white",
  "Grillades": "bg-amber-700 text-white",
  "Maquis": "bg-green-700 text-white",
  "Café": "bg-brown-600 text-white",
  "Pâtisserie": "bg-pink-500 text-white",
  "International": "bg-purple-600 text-white",
  "Italien": "bg-emerald-600 text-white",
  "Fusion": "bg-violet-600 text-white"
};

export const RESTAURANTS_DATA: Restaurant[] = [
  {
    id: "rest-001",
    nom: "L'Eau Vive",
    type: "International",
    adresse: "Avenue Kwamé N'Krumah, Secteur 4",
    quartier: "Centre-ville",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3678,
    longitude: -1.5145,
    telephone: "+226 25 30 63 63",
    email: "contact@eauvive-ouaga.org",
    horaires: "12h00 - 14h30, 19h00 - 22h00",
    fermeture: "Dimanche midi",
    gammePrix: "Haut de gamme",
    services: ["Réservation", "Événements", "Buffet"],
    specialites: ["Cuisine française", "Plats internationaux", "Desserts maison"],
    capacite: 150,
    wifi: true,
    climatisation: true,
    parking: true,
    terrasse: true,
    livraison: false,
    source: "Vérifié"
  },
  {
    id: "rest-002",
    nom: "Le Verdoyant",
    type: "Français",
    adresse: "Boulevard Charles de Gaulle, 1200 Logements",
    quartier: "1200 Logements",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3714,
    longitude: -1.5197,
    telephone: "+226 25 36 44 44",
    horaires: "11h30 - 15h00, 18h30 - 23h00",
    fermeture: "Lundi",
    gammePrix: "Haut de gamme",
    services: ["Réservation", "Événements privés", "Bar"],
    specialites: ["Cuisine française", "Fruits de mer", "Steaks"],
    capacite: 80,
    wifi: true,
    climatisation: true,
    parking: true,
    terrasse: true,
    livraison: false,
    source: "Vérifié"
  },
  {
    id: "rest-003",
    nom: "Chez Géline",
    type: "Burkinabè",
    adresse: "Rue 15.24, Secteur 15",
    quartier: "Dapoya",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3789,
    longitude: -1.5156,
    telephone: "+226 25 30 89 12",
    horaires: "10h00 - 23h00",
    gammePrix: "Moyen",
    services: ["Service rapide", "À emporter"],
    specialites: ["Riz sauce", "Poulet braisé", "Tô", "Babenda"],
    capacite: 60,
    wifi: false,
    climatisation: false,
    parking: true,
    terrasse: true,
    livraison: true,
    source: "Vérifié"
  }
];
