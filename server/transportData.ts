export interface Gare {
  id: string;
  nom: string;
  ville: string;
  region: string;
  adresse: string;
  coordonnees: { lat: number; lng: number };
  telephone?: string;
  compagnie: string;
  type: "principale" | "secondaire" | "agence";
}

export interface Trajet {
  id: string;
  compagnieId: string;
  depart: string;
  arrivee: string;
  horaires: string[];
  duree: string;
  prix: number;
  prixVIP?: number;
  frequence: string;
  jours: string[];
}

export interface Compagnie {
  id: string;
  nom: string;
  nomComplet: string;
  logo?: string;
  description: string;
  fondee: number;
  siege: string;
  telephone: string[];
  email?: string;
  siteWeb?: string;
  services: string[];
  destinations: string[];
  note: number;
  avis: string;
}

export const compagniesTransport: Compagnie[] = [
  {
    id: "rahimo",
    nom: "RAHIMO",
    nomComplet: "Rahimo Transport",
    description: "Compagnie fondee par l'ancien footballeur Rahim Ouedraogo. Bus modernes climatises avec ports USB, GPS et cameras de surveillance.",
    fondee: 2011,
    siege: "Ouagadougou",
    telephone: ["+226 78 29 17 17", "+226 64 86 37 55"],
    email: "info@rahimotransport.com",
    siteWeb: "https://rahimotransport.com",
    services: ["Climatisation", "USB", "GPS", "Wifi", "Bagages 25kg inclus"],
    destinations: ["Bobo-Dioulasso", "Banfora", "Abidjan", "Bouake", "Yamoussoukro", "Lome"],
    note: 4.5,
    avis: "Recommande - Ponctuel et confortable"
  },
  {
    id: "tcv",
    nom: "TCV",
    nomComplet: "Transport Confort Voyageurs",
    description: "Compagnie majeure fondee en 2002, basee a Bobo-Dioulasso. Reseau national et international vers 5 pays de la CEDEAO.",
    fondee: 2002,
    siege: "Bobo-Dioulasso",
    telephone: ["+226 75 79 13 07", "+226 20 97 16 93"],
    siteWeb: "http://tcv-sa.com",
    services: ["Climatisation", "Salle d'attente TV", "Colis"],
    destinations: ["Ouagadougou", "Bobo-Dioulasso", "Orodara", "Banfora", "Abidjan", "Bamako", "Lome", "Cotonou"],
    note: 3.5,
    avis: "Service correct - Flotte vieillissante"
  },
  {
    id: "stmb",
    nom: "STMB",
    nomComplet: "Societe de Transport Moderne du Burkina",
    description: "Grande compagnie experimentee et serieuse, reputee pour sa fiabilite depuis plusieurs decennies.",
    fondee: 1990,
    siege: "Ouagadougou",
    telephone: ["+226 25 30 63 85", "+226 70 20 30 40"],
    services: ["Climatisation", "Bagages"],
    destinations: ["Bobo-Dioulasso", "Ouahigouya", "Koudougou", "Fada N'Gourma", "Kaya"],
    note: 4.0,
    avis: "Fiable et experimente"
  },
  {
    id: "tsr",
    nom: "TSR",
    nomComplet: "Transport Sans Retard",
    description: "Compagnie reguliere offrant des liaisons nationales et internationales a prix competitifs.",
    fondee: 2005,
    siege: "Ouagadougou",
    telephone: ["+226 25 36 48 72"],
    services: ["Climatisation", "Colis"],
    destinations: ["Bobo-Dioulasso", "Ouahigouya", "Niamey", "Bamako"],
    note: 3.8,
    avis: "Bon rapport qualite-prix"
  },
  {
    id: "staf",
    nom: "STAF",
    nomComplet: "Societe de Transport Africain Faso",
    description: "Compagnie recente avec des bus neufs depuis 2024. Tarifs competitifs.",
    fondee: 2018,
    siege: "Ouagadougou",
    telephone: ["+226 25 31 55 66", "+226 70 55 66 77"],
    services: ["Climatisation", "Bagages"],
    destinations: ["Bobo-Dioulasso", "Banfora", "Koudougou"],
    note: 3.7,
    avis: "Bus neufs - En developpement"
  },
  {
    id: "rakieta",
    nom: "RAKIETA",
    nomComplet: "Rakieta Transport",
    description: "Compagnie bien implantee dans le sud-ouest du pays, specialisee dans les liaisons vers Banfora et la Cote d'Ivoire.",
    fondee: 1998,
    siege: "Banfora",
    telephone: ["+226 20 91 01 23"],
    services: ["Climatisation", "Colis"],
    destinations: ["Ouagadougou", "Bobo-Dioulasso", "Banfora", "Abidjan"],
    note: 4.0,
    avis: "Specialiste du Sud-Ouest"
  },
  {
    id: "sotraco",
    nom: "SOTRACO",
    nomComplet: "Societe de Transport en Commun de Ouagadougou",
    description: "Societe publique de transport urbain, nationalisee a 100% par l'Etat en 2025. Bus verts reconnaissables.",
    fondee: 1984,
    siege: "Ouagadougou",
    telephone: ["+226 25 30 61 52"],
    services: ["Transport urbain", "Lignes regulieres"],
    destinations: ["Ouagadougou (urbain)", "Bobo-Dioulasso (urbain)", "Koudougou", "Ouahigouya", "Dedougou", "Ziniare"],
    note: 3.5,
    avis: "Transport public - Tarifs accessibles"
  },
  {
    id: "elitis",
    nom: "ELITIS",
    nomComplet: "Elitis Express",
    description: "Nouvelle compagnie haut de gamme avec des autocars de luxe pour les voyageurs exigeants.",
    fondee: 2022,
    siege: "Ouagadougou",
    telephone: ["+226 70 88 99 00"],
    services: ["Luxe", "Climatisation", "Wifi", "Collation", "Sieges inclinables"],
    destinations: ["Bobo-Dioulasso", "Banfora"],
    note: 4.3,
    avis: "Premium - Confort superieur"
  }
];

export const garesRoutieres: Gare[] = [
  {
    id: "ouaga-inter",
    nom: "Gare Routiere Internationale Ouaga-Inter",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Zone de Tampouy, Route de Ouahigouya",
    coordonnees: { lat: 12.4039, lng: -1.5283 },
    telephone: "+226 25 36 07 39",
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "ouaga-ouest",
    nom: "Gare de l'Ouest",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Secteur 10, Pissy",
    coordonnees: { lat: 12.3608, lng: -1.5450 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "rahimo-ouaga",
    nom: "Gare Rahimo Kalgondin",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Rue 30.73, Avenue des Arts, Kalgondin",
    coordonnees: { lat: 12.3789, lng: -1.4965 },
    telephone: "+226 64 86 37 55",
    compagnie: "rahimo",
    type: "principale"
  },
  {
    id: "tcv-ouaga",
    nom: "Gare TCV Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Avenue de la Grande-Mosquee, pres de l'aeroport",
    coordonnees: { lat: 12.3680, lng: -1.5165 },
    telephone: "+226 75 79 13 07",
    compagnie: "tcv",
    type: "principale"
  },
  {
    id: "stmb-ouaga",
    nom: "Gare STMB Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Secteur 11, Zone commerciale",
    coordonnees: { lat: 12.3701, lng: -1.5234 },
    telephone: "+226 25 30 63 85",
    compagnie: "stmb",
    type: "principale"
  },
  {
    id: "bobo-centrale",
    nom: "Gare Routiere Centrale Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Centre-ville, Avenue de la Revolution",
    coordonnees: { lat: 11.1771, lng: -4.2979 },
    telephone: "+226 20 98 15 47",
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "tcv-bobo",
    nom: "Gare TCV Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Centre-ville",
    coordonnees: { lat: 11.1785, lng: -4.2950 },
    telephone: "+226 20 97 16 93",
    compagnie: "tcv",
    type: "principale"
  },
  {
    id: "rahimo-bobo",
    nom: "Agence Rahimo Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Quartier Sikasso-Cira",
    coordonnees: { lat: 11.1750, lng: -4.3010 },
    telephone: "+226 64 86 37 55",
    compagnie: "rahimo",
    type: "agence"
  },
  {
    id: "banfora-gare",
    nom: "Gare Routiere de Banfora",
    ville: "Banfora",
    region: "Cascades",
    adresse: "Centre-ville, Avenue principale",
    coordonnees: { lat: 10.6325, lng: -4.7592 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "ouahigouya-gare",
    nom: "Gare Routiere de Ouahigouya",
    ville: "Ouahigouya",
    region: "Nord",
    adresse: "Secteur 4",
    coordonnees: { lat: 13.5826, lng: -2.4192 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "koudougou-gare",
    nom: "Gare Routiere de Koudougou",
    ville: "Koudougou",
    region: "Centre-Ouest",
    adresse: "Secteur 3, Route de Ouagadougou",
    coordonnees: { lat: 12.2525, lng: -2.3628 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "fada-gare",
    nom: "Gare Routiere de Fada N'Gourma",
    ville: "Fada N'Gourma",
    region: "Est",
    adresse: "Centre-ville",
    coordonnees: { lat: 12.0606, lng: 0.3494 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "kaya-gare",
    nom: "Gare Routiere de Kaya",
    ville: "Kaya",
    region: "Centre-Nord",
    adresse: "Secteur 2",
    coordonnees: { lat: 13.0910, lng: -1.0844 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "dedougou-gare",
    nom: "Gare Routiere de Dedougou",
    ville: "Dedougou",
    region: "Boucle du Mouhoun",
    adresse: "Centre-ville",
    coordonnees: { lat: 12.4633, lng: -3.4600 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "dori-gare",
    nom: "Gare Routiere de Dori",
    ville: "Dori",
    region: "Sahel",
    adresse: "Centre-ville",
    coordonnees: { lat: 14.0354, lng: -0.0347 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "tenkodogo-gare",
    nom: "Gare Routiere de Tenkodogo",
    ville: "Tenkodogo",
    region: "Centre-Est",
    adresse: "Secteur 1",
    coordonnees: { lat: 11.7800, lng: -0.3694 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "manga-gare",
    nom: "Gare Routiere de Manga",
    ville: "Manga",
    region: "Centre-Sud",
    adresse: "Centre-ville",
    coordonnees: { lat: 11.6667, lng: -1.0667 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "gaoua-gare",
    nom: "Gare Routiere de Gaoua",
    ville: "Gaoua",
    region: "Sud-Ouest",
    adresse: "Centre-ville",
    coordonnees: { lat: 10.3250, lng: -3.1750 },
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "ziniare-gare",
    nom: "Gare Routiere de Ziniare",
    ville: "Ziniare",
    region: "Plateau-Central",
    adresse: "Centre-ville",
    coordonnees: { lat: 12.5833, lng: -1.3000 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "orodara-gare",
    nom: "Gare Routiere de Orodara",
    ville: "Orodara",
    region: "Hauts-Bassins",
    adresse: "Centre-ville",
    coordonnees: { lat: 10.9833, lng: -4.9167 },
    compagnie: "Publique",
    type: "secondaire"
  }
];

export const trajets: Trajet[] = [
  {
    id: "rahimo-ouaga-bobo",
    compagnieId: "rahimo",
    depart: "Ouagadougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["07:30", "10:00", "10:30", "14:00", "14:30", "18:30", "23:30"],
    duree: "5h - 5h30",
    prix: 7500,
    prixVIP: 9000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "rahimo-ouaga-banfora",
    compagnieId: "rahimo",
    depart: "Ouagadougou",
    arrivee: "Banfora",
    horaires: ["07:30", "10:00", "10:30"],
    duree: "6h30",
    prix: 9000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-ouaga-bobo",
    compagnieId: "tcv",
    depart: "Ouagadougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["07:00", "10:00", "14:00", "18:30", "21:00", "22:30"],
    duree: "5h - 5h30",
    prix: 6500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-bobo-orodara",
    compagnieId: "tcv",
    depart: "Bobo-Dioulasso",
    arrivee: "Orodara",
    horaires: ["08:00", "12:00", "16:00"],
    duree: "1h30",
    prix: 1000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-ouaga-bobo",
    compagnieId: "stmb",
    depart: "Ouagadougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["06:30", "09:00", "13:00", "17:00"],
    duree: "5h30",
    prix: 6000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-ouaga-ouahigouya",
    compagnieId: "stmb",
    depart: "Ouagadougou",
    arrivee: "Ouahigouya",
    horaires: ["06:00", "10:00", "14:00"],
    duree: "3h",
    prix: 4000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-ouaga-koudougou",
    compagnieId: "stmb",
    depart: "Ouagadougou",
    arrivee: "Koudougou",
    horaires: ["07:00", "09:00", "11:00", "14:00", "16:00"],
    duree: "2h",
    prix: 2500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-ouaga-fada",
    compagnieId: "stmb",
    depart: "Ouagadougou",
    arrivee: "Fada N'Gourma",
    horaires: ["06:30", "10:00", "14:00"],
    duree: "3h30",
    prix: 4500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-ouaga-kaya",
    compagnieId: "stmb",
    depart: "Ouagadougou",
    arrivee: "Kaya",
    horaires: ["07:00", "11:00", "15:00"],
    duree: "2h",
    prix: 2500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tsr-ouaga-bobo",
    compagnieId: "tsr",
    depart: "Ouagadougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["07:00", "11:00", "15:00", "20:00"],
    duree: "5h30",
    prix: 5500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tsr-ouaga-ouahigouya",
    compagnieId: "tsr",
    depart: "Ouagadougou",
    arrivee: "Ouahigouya",
    horaires: ["07:00", "12:00", "16:00"],
    duree: "3h",
    prix: 3500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "staf-ouaga-bobo",
    compagnieId: "staf",
    depart: "Ouagadougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["08:00", "12:00", "16:00", "21:00"],
    duree: "5h30",
    prix: 5000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "staf-ouaga-koudougou",
    compagnieId: "staf",
    depart: "Ouagadougou",
    arrivee: "Koudougou",
    horaires: ["07:30", "10:30", "14:30", "17:30"],
    duree: "2h",
    prix: 2000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "rakieta-ouaga-banfora",
    compagnieId: "rakieta",
    depart: "Ouagadougou",
    arrivee: "Banfora",
    horaires: ["07:00", "10:00", "14:00"],
    duree: "7h",
    prix: 8500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "rakieta-bobo-banfora",
    compagnieId: "rakieta",
    depart: "Bobo-Dioulasso",
    arrivee: "Banfora",
    horaires: ["08:00", "11:00", "15:00", "18:00"],
    duree: "1h30",
    prix: 1500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "elitis-ouaga-bobo",
    compagnieId: "elitis",
    depart: "Ouagadougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["08:00", "14:00"],
    duree: "5h",
    prix: 12000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "rahimo-ouaga-abidjan",
    compagnieId: "rahimo",
    depart: "Ouagadougou",
    arrivee: "Abidjan",
    horaires: ["18:00"],
    duree: "18h",
    prix: 25000,
    prixVIP: 30000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-ouaga-abidjan",
    compagnieId: "tcv",
    depart: "Ouagadougou",
    arrivee: "Abidjan",
    horaires: ["17:00", "19:00"],
    duree: "18h",
    prix: 22000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-bobo-bamako",
    compagnieId: "tcv",
    depart: "Bobo-Dioulasso",
    arrivee: "Bamako",
    horaires: ["08:00", "20:00"],
    duree: "12h",
    prix: 15000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "rahimo-ouaga-lome",
    compagnieId: "rahimo",
    depart: "Ouagadougou",
    arrivee: "Lome",
    horaires: ["16:00"],
    duree: "20h",
    prix: 30000,
    prixVIP: 37500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-ouaga-lome",
    compagnieId: "tcv",
    depart: "Ouagadougou",
    arrivee: "Lome",
    horaires: ["15:00"],
    duree: "20h",
    prix: 27000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-ouaga-cotonou",
    compagnieId: "tcv",
    depart: "Ouagadougou",
    arrivee: "Cotonou",
    horaires: ["14:00"],
    duree: "22h",
    prix: 32000,
    frequence: "3 fois/semaine",
    jours: ["Lundi", "Mercredi", "Vendredi"]
  },
  {
    id: "tsr-ouaga-niamey",
    compagnieId: "tsr",
    depart: "Ouagadougou",
    arrivee: "Niamey",
    horaires: ["07:00", "19:00"],
    duree: "8h",
    prix: 12000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  }
];

export function getCompagnies() {
  return compagniesTransport;
}

export function getGares() {
  return garesRoutieres;
}

export function getTrajets() {
  return trajets;
}

export function getTrajetsByCompagnie(compagnieId: string) {
  return trajets.filter(t => t.compagnieId === compagnieId);
}

export function getGaresByVille(ville: string) {
  return garesRoutieres.filter(g => g.ville.toLowerCase() === ville.toLowerCase());
}

export function getTrajetsByDepart(ville: string) {
  return trajets.filter(t => t.depart.toLowerCase() === ville.toLowerCase());
}

export function getTrajetsByArrivee(ville: string) {
  return trajets.filter(t => t.arrivee.toLowerCase() === ville.toLowerCase());
}

export function searchTrajets(depart: string, arrivee: string) {
  return trajets.filter(t => 
    t.depart.toLowerCase().includes(depart.toLowerCase()) && 
    t.arrivee.toLowerCase().includes(arrivee.toLowerCase())
  );
}

export function getStatistiquesTransport() {
  const totalCompagnies = compagniesTransport.length;
  const totalGares = garesRoutieres.length;
  const totalTrajets = trajets.length;
  const villesDesservies = Array.from(new Set(garesRoutieres.map(g => g.ville))).length;
  const destinationsInternationales = Array.from(new Set(trajets.filter(t => 
    ["Abidjan", "Bamako", "Lome", "Cotonou", "Niamey", "Accra"].includes(t.arrivee)
  ).map(t => t.arrivee))).length;

  return {
    totalCompagnies,
    totalGares,
    totalTrajets,
    villesDesservies,
    destinationsInternationales
  };
}
