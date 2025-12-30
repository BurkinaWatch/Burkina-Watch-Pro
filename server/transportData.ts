export interface GareDestination {
  ville: string;
  horaires: string[];
  duree?: string;
  prix?: number;
  compagnies?: string[];
}

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
  destinations?: GareDestination[];
  heuresOuverture?: string;
  services?: string[];
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
  // ========== REGION CENTRE (Ouagadougou) ==========
  {
    id: "ouaga-inter",
    nom: "Gare Routiere Internationale Ouaga-Inter",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Avenue de la Liberte, Tampouy, Secteur 23, face au stade du 4 Aout",
    coordonnees: { lat: 12.4039, lng: -1.5283 },
    telephone: "+226 25 36 07 39",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 22h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes", "Restauration", "Parking"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "07h00", "08h00", "10h00", "14h00", "16h00", "22h00"], duree: "5h", prix: 6000, compagnies: ["RAHIMO", "TCV", "STMB", "TSR"] },
      { ville: "Banfora", horaires: ["06h30", "08h00", "14h00", "22h00"], duree: "7h", prix: 8000, compagnies: ["RAHIMO", "TCV", "RAKIETA"] },
      { ville: "Ouahigouya", horaires: ["06h00", "07h30", "12h00", "15h00"], duree: "3h30", prix: 4000, compagnies: ["STMB", "TSR"] },
      { ville: "Koudougou", horaires: ["06h00", "07h00", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "2h", prix: 2500, compagnies: ["STMB", "STAF", "SOTRACO"] },
      { ville: "Fada N'Gourma", horaires: ["06h00", "08h00", "14h00"], duree: "4h", prix: 5000, compagnies: ["STMB"] },
      { ville: "Kaya", horaires: ["06h30", "08h00", "12h00", "16h00"], duree: "2h30", prix: 3000, compagnies: ["STMB"] },
      { ville: "Abidjan (CI)", horaires: ["06h00", "14h00", "22h00"], duree: "14h", prix: 20000, compagnies: ["RAHIMO", "TCV", "RAKIETA"] },
      { ville: "Lome (Togo)", horaires: ["06h00", "18h00"], duree: "18h", prix: 25000, compagnies: ["TCV"] },
      { ville: "Niamey (Niger)", horaires: ["07h00", "15h00"], duree: "8h", prix: 12000, compagnies: ["TSR"] },
      { ville: "Bamako (Mali)", horaires: ["06h00", "14h00"], duree: "18h", prix: 22000, compagnies: ["TCV", "TSR"] }
    ]
  },
  {
    id: "ouaga-ouest",
    nom: "Gare de l'Ouest (Pissy)",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Avenue Kadiogo, Secteur 10, Pissy, pres du grand marche de Pissy",
    coordonnees: { lat: 12.3608, lng: -1.5450 },
    telephone: "+226 25 36 42 18",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 20h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "07h00", "08h30", "14h00"], duree: "5h", prix: 5500, compagnies: ["TCV", "STAF"] },
      { ville: "Koudougou", horaires: ["06h00", "07h00", "09h00", "11h00", "14h00", "16h00"], duree: "2h", prix: 2000, compagnies: ["SOTRACO", "STAF"] },
      { ville: "Dedougou", horaires: ["06h30", "08h00", "14h00"], duree: "4h", prix: 4500, compagnies: ["STMB"] },
      { ville: "Leo", horaires: ["07h00", "14h00"], duree: "3h", prix: 3500 }
    ]
  },
  {
    id: "ouaga-sud",
    nom: "Gare Routiere Sud (Zogona)",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Avenue Bassawarga, Secteur 13, Zogona, pres du CSPS",
    coordonnees: { lat: 12.3456, lng: -1.5078 },
    telephone: "+226 25 30 89 12",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h30 - 20h00",
    services: ["Billetterie", "Toilettes", "Restauration"],
    destinations: [
      { ville: "Po", horaires: ["06h00", "08h00", "12h00", "16h00"], duree: "2h30", prix: 3000 },
      { ville: "Tiebele", horaires: ["07h00", "14h00"], duree: "3h", prix: 3500 },
      { ville: "Leo", horaires: ["06h30", "10h00", "14h00"], duree: "3h", prix: 3500 },
      { ville: "Manga", horaires: ["06h00", "09h00", "14h00", "17h00"], duree: "2h", prix: 2500 },
      { ville: "Kombissiri", horaires: ["06h00", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "1h", prix: 1000 }
    ]
  },
  {
    id: "ouaga-est",
    nom: "Gare Routiere Est (Dassasgho)",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Boulevard Charles de Gaulle, Dassasgho, Secteur 28",
    coordonnees: { lat: 12.3789, lng: -1.4685 },
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 19h00",
    services: ["Billetterie", "Toilettes"],
    destinations: [
      { ville: "Fada N'Gourma", horaires: ["06h00", "08h00", "10h00", "14h00"], duree: "4h", prix: 5000, compagnies: ["STMB"] },
      { ville: "Koupela", horaires: ["06h00", "07h30", "09h00", "12h00", "15h00"], duree: "2h", prix: 2500 },
      { ville: "Tenkodogo", horaires: ["06h30", "09h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Pouytenga", horaires: ["06h00", "08h00", "11h00", "14h00", "16h00"], duree: "2h", prix: 2500 },
      { ville: "Ziniare", horaires: ["06h00", "07h00", "08h00", "10h00", "12h00", "14h00", "16h00", "18h00"], duree: "45min", prix: 800 }
    ]
  },
  {
    id: "rahimo-ouaga",
    nom: "Gare Rahimo Transport Kalgondin",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Rue 30.73, Avenue des Arts, Kalgondin, face a la station Total",
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
    adresse: "Avenue de la Grande-Mosquee, Secteur 5, pres de l'aeroport international",
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
    adresse: "Rue du Marche, Secteur 11, Zone commerciale du centre",
    coordonnees: { lat: 12.3701, lng: -1.5234 },
    telephone: "+226 25 30 63 85",
    compagnie: "stmb",
    type: "principale"
  },
  {
    id: "tsr-ouaga",
    nom: "Gare TSR Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Avenue Yennenga, Secteur 9, Gounghin",
    coordonnees: { lat: 12.3650, lng: -1.5320 },
    telephone: "+226 25 36 48 72",
    compagnie: "tsr",
    type: "principale"
  },
  {
    id: "staf-ouaga",
    nom: "Gare STAF Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Boulevard de la Resistance, Secteur 14, Koulouba",
    coordonnees: { lat: 12.3580, lng: -1.5180 },
    telephone: "+226 25 31 55 66",
    compagnie: "staf",
    type: "principale"
  },
  {
    id: "elitis-ouaga",
    nom: "Gare Elitis Express Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Avenue de l'Independance, Secteur 4, pres de l'Hotel Silmande",
    coordonnees: { lat: 12.3720, lng: -1.5100 },
    telephone: "+226 70 88 99 00",
    compagnie: "elitis",
    type: "principale"
  },
  {
    id: "sotraco-depot",
    nom: "Depot Central SOTRACO",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Boulevard Thomas Sankara, Zone industrielle de Kossodo",
    coordonnees: { lat: 12.4150, lng: -1.4820 },
    telephone: "+226 25 30 61 52",
    compagnie: "sotraco",
    type: "principale"
  },

  // ========== REGION HAUTS-BASSINS (Bobo-Dioulasso) ==========
  {
    id: "bobo-centrale",
    nom: "Gare Routiere Centrale Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Avenue de la Revolution, Secteur 1, face au Grand Marche",
    coordonnees: { lat: 11.1771, lng: -4.2979 },
    telephone: "+226 20 98 15 47",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 21h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes", "Restauration", "Consigne bagages"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["05h30", "06h30", "07h30", "09h00", "14h00", "16h00"], duree: "5h", prix: 6000, compagnies: ["RAHIMO", "TCV", "STMB"] },
      { ville: "Banfora", horaires: ["06h00", "08h00", "10h00", "14h00", "17h00"], duree: "2h", prix: 2500, compagnies: ["RAKIETA", "TCV"] },
      { ville: "Orodara", horaires: ["07h00", "12h00", "16h00"], duree: "1h30", prix: 1500, compagnies: ["TCV"] },
      { ville: "Gaoua", horaires: ["06h00", "14h00"], duree: "4h", prix: 5000 },
      { ville: "Dedougou", horaires: ["06h30", "14h00"], duree: "3h30", prix: 4000, compagnies: ["STMB"] },
      { ville: "Abidjan (CI)", horaires: ["06h00", "14h00", "22h00"], duree: "9h", prix: 15000, compagnies: ["RAKIETA", "TCV"] },
      { ville: "Bamako (Mali)", horaires: ["06h00", "14h00"], duree: "12h", prix: 18000, compagnies: ["TCV"] },
      { ville: "Sikasso (Mali)", horaires: ["07h00", "14h00"], duree: "4h", prix: 6000, compagnies: ["TCV"] }
    ]
  },
  {
    id: "bobo-ouest",
    nom: "Gare de l'Ouest Bobo",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Route de Banfora, Secteur 21, Ouezzinville",
    coordonnees: { lat: 11.1650, lng: -4.3150 },
    telephone: "+226 20 97 22 33",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "05h30 - 19h00",
    destinations: [
      { ville: "Banfora", horaires: ["06h00", "08h00", "10h00", "14h00"], duree: "2h", prix: 2000, compagnies: ["RAKIETA"] },
      { ville: "Sindou", horaires: ["07h00", "14h00"], duree: "3h", prix: 3500 },
      { ville: "Niangoloko", horaires: ["06h30", "12h00"], duree: "3h30", prix: 4000 }
    ]
  },
  {
    id: "tcv-bobo",
    nom: "Gare TCV Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Avenue Thomas Sankara, Secteur 2, pres du CHU Souro Sanou",
    coordonnees: { lat: 11.1785, lng: -4.2950 },
    telephone: "+226 20 97 16 93",
    compagnie: "tcv",
    type: "principale",
    heuresOuverture: "05h00 - 22h00",
    services: ["Climatisation", "Salle d'attente TV", "Wifi", "Colis express"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "10h00", "14h00", "16h00", "22h00"], duree: "5h", prix: 6000, compagnies: ["TCV"] },
      { ville: "Banfora", horaires: ["07h00", "12h00", "17h00"], duree: "2h", prix: 2500, compagnies: ["TCV"] },
      { ville: "Orodara", horaires: ["08h00", "14h00"], duree: "1h30", prix: 1500, compagnies: ["TCV"] },
      { ville: "Abidjan (CI)", horaires: ["06h00", "14h00", "22h00"], duree: "9h", prix: 15000, compagnies: ["TCV"] },
      { ville: "Bamako (Mali)", horaires: ["06h00"], duree: "12h", prix: 18000, compagnies: ["TCV"] },
      { ville: "Lome (Togo)", horaires: ["14h00"], duree: "24h", prix: 30000, compagnies: ["TCV"] }
    ]
  },
  {
    id: "rahimo-bobo",
    nom: "Agence Rahimo Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Quartier Sikasso-Cira, pres du pont du Houet",
    coordonnees: { lat: 11.1750, lng: -4.3010 },
    telephone: "+226 64 86 37 55",
    compagnie: "rahimo",
    type: "agence",
    heuresOuverture: "06h00 - 20h00",
    services: ["Climatisation", "USB", "GPS", "Wifi"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "14h00", "16h00"], duree: "5h", prix: 6000, compagnies: ["RAHIMO"] },
      { ville: "Banfora", horaires: ["07h00", "14h00"], duree: "2h", prix: 2500, compagnies: ["RAHIMO"] },
      { ville: "Abidjan (CI)", horaires: ["06h00", "22h00"], duree: "9h", prix: 15000, compagnies: ["RAHIMO"] }
    ]
  },
  {
    id: "stmb-bobo",
    nom: "Gare STMB Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Avenue de la Republique, Secteur 3, Tounouma",
    coordonnees: { lat: 11.1810, lng: -4.2920 },
    telephone: "+226 20 98 44 55",
    compagnie: "stmb",
    type: "agence"
  },
  {
    id: "orodara-gare",
    nom: "Gare Routiere de Orodara",
    ville: "Orodara",
    region: "Hauts-Bassins",
    adresse: "Route Nationale 7, centre-ville, pres du marche central",
    coordonnees: { lat: 10.9833, lng: -4.9167 },
    telephone: "+226 20 96 01 15",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "05h30 - 18h00",
    services: ["Billetterie", "Toilettes"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "08h00", "10h00", "14h00", "16h00"], duree: "1h30", prix: 1500, compagnies: ["TCV"] },
      { ville: "Banfora", horaires: ["07h00", "12h00", "15h00"], duree: "2h30", prix: 2500 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "7h", prix: 7500, compagnies: ["TCV"] },
      { ville: "Sikasso (Mali)", horaires: ["08h00"], duree: "3h", prix: 4500 }
    ]
  },
  {
    id: "hounde-gare",
    nom: "Gare Routiere de Hounde",
    ville: "Hounde",
    region: "Hauts-Bassins",
    adresse: "Route Nationale 1, entree est de la ville",
    coordonnees: { lat: 11.4833, lng: -3.5167 },
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "05h00 - 18h00",
    services: ["Billetterie"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "08h00", "10h00", "14h00"], duree: "2h", prix: 2000 },
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "14h00"], duree: "3h30", prix: 4000, compagnies: ["STMB", "STAF"] },
      { ville: "Koudougou", horaires: ["07h00", "12h00", "16h00"], duree: "1h30", prix: 1500 },
      { ville: "Boromo", horaires: ["06h30", "09h00", "14h00", "16h00"], duree: "1h", prix: 1000 }
    ]
  },

  // ========== REGION CASCADES (Banfora) ==========
  {
    id: "banfora-gare",
    nom: "Gare Routiere de Banfora",
    ville: "Banfora",
    region: "Cascades",
    adresse: "Avenue de l'Independance, Secteur 1, face a la mairie",
    coordonnees: { lat: 10.6325, lng: -4.7592 },
    telephone: "+226 20 91 00 45",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 20h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes", "Restauration"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "07h00", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "2h", prix: 2500, compagnies: ["RAKIETA", "TCV"] },
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "14h00", "22h00"], duree: "7h", prix: 8000, compagnies: ["RAHIMO", "TCV", "RAKIETA"] },
      { ville: "Gaoua", horaires: ["07h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Sindou", horaires: ["06h30", "10h00", "14h00", "16h00"], duree: "1h", prix: 1500 },
      { ville: "Niangoloko", horaires: ["07h00", "09h00", "12h00", "15h00"], duree: "1h30", prix: 2000 },
      { ville: "Abidjan (CI)", horaires: ["06h00", "14h00", "22h00"], duree: "7h", prix: 12000, compagnies: ["RAKIETA", "TCV"] },
      { ville: "Ferkessedougou (CI)", horaires: ["08h00", "14h00"], duree: "3h", prix: 5000 }
    ]
  },
  {
    id: "rakieta-banfora",
    nom: "Agence Rakieta Banfora",
    ville: "Banfora",
    region: "Cascades",
    adresse: "Boulevard Oumarou Kanazoe, Secteur 2, pres du marche",
    coordonnees: { lat: 10.6350, lng: -4.7550 },
    telephone: "+226 20 91 01 23",
    compagnie: "rakieta",
    type: "principale"
  },
  {
    id: "niangoloko-gare",
    nom: "Gare Routiere de Niangoloko",
    ville: "Niangoloko",
    region: "Cascades",
    adresse: "Route Internationale, frontiere Cote d'Ivoire",
    coordonnees: { lat: 10.2833, lng: -4.9167 },
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 18h00",
    services: ["Billetterie", "Douane"],
    destinations: [
      { ville: "Banfora", horaires: ["07h00", "10h00", "14h00", "16h00"], duree: "1h30", prix: 2000 },
      { ville: "Bobo-Dioulasso", horaires: ["06h30", "10h00", "14h00"], duree: "3h30", prix: 4000 },
      { ville: "Ferkessedougou (CI)", horaires: ["08h00", "12h00", "15h00"], duree: "1h30", prix: 3000 },
      { ville: "Abidjan (CI)", horaires: ["07h00", "14h00"], duree: "6h", prix: 10000 }
    ]
  },
  {
    id: "sindou-gare",
    nom: "Gare Routiere de Sindou",
    ville: "Sindou",
    region: "Cascades",
    adresse: "Centre-ville, pres des Pics de Sindou",
    coordonnees: { lat: 10.6667, lng: -5.1667 },
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    services: ["Billetterie"],
    destinations: [
      { ville: "Banfora", horaires: ["07h00", "10h00", "14h00"], duree: "1h", prix: 1500 },
      { ville: "Bobo-Dioulasso", horaires: ["06h30", "14h00"], duree: "3h", prix: 3500 },
      { ville: "Loumana", horaires: ["08h00", "12h00", "15h00"], duree: "30min", prix: 800 }
    ]
  },

  // ========== REGION BOUCLE DU MOUHOUN (Dedougou) ==========
  {
    id: "dedougou-gare",
    nom: "Gare Routiere de Dedougou",
    ville: "Dedougou",
    region: "Boucle du Mouhoun",
    adresse: "Avenue du Mouhoun, Secteur 1, pres de la Maison de la Culture",
    coordonnees: { lat: 12.4633, lng: -3.4600 },
    telephone: "+226 20 52 01 18",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 19h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "14h00"], duree: "4h", prix: 4500, compagnies: ["STMB"] },
      { ville: "Bobo-Dioulasso", horaires: ["06h30", "08h00", "14h00"], duree: "3h30", prix: 4000 },
      { ville: "Boromo", horaires: ["06h00", "08h00", "10h00", "14h00", "16h00"], duree: "1h30", prix: 1500 },
      { ville: "Nouna", horaires: ["07h00", "10h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Tougan", horaires: ["06h30", "12h00", "15h00"], duree: "2h30", prix: 3000 },
      { ville: "Koudougou", horaires: ["06h00", "08h00", "14h00"], duree: "2h30", prix: 3000, compagnies: ["STMB"] }
    ]
  },
  {
    id: "boromo-gare",
    nom: "Gare Routiere de Boromo",
    ville: "Boromo",
    region: "Boucle du Mouhoun",
    adresse: "Route Nationale 1, carrefour central",
    coordonnees: { lat: 11.7500, lng: -2.9333 },
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "05h00 - 18h00",
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Bobo-Dioulasso", horaires: ["06h30", "08h00", "12h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Dedougou", horaires: ["07h00", "10h00", "14h00", "16h00"], duree: "1h30", prix: 1500 },
      { ville: "Hounde", horaires: ["06h00", "08h00", "10h00", "12h00", "15h00"], duree: "1h", prix: 1000 }
    ]
  },
  {
    id: "nouna-gare",
    nom: "Gare Routiere de Nouna",
    ville: "Nouna",
    region: "Boucle du Mouhoun",
    adresse: "Centre-ville, avenue principale",
    coordonnees: { lat: 12.7333, lng: -3.8667 },
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Dedougou", horaires: ["06h30", "10h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "6h", prix: 7000 },
      { ville: "Solenzo", horaires: ["07h00", "12h00", "15h00"], duree: "1h30", prix: 2000 }
    ]
  },
  {
    id: "tougan-gare",
    nom: "Gare Routiere de Tougan",
    ville: "Tougan",
    region: "Boucle du Mouhoun",
    adresse: "Route de Ouahigouya, centre-ville",
    coordonnees: { lat: 13.0667, lng: -3.0667 },
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Ouahigouya", horaires: ["06h30", "10h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Dedougou", horaires: ["07h00", "12h00"], duree: "2h30", prix: 3000 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "5h", prix: 5500 }
    ]
  },
  {
    id: "solenzo-gare",
    nom: "Gare Routiere de Solenzo",
    ville: "Solenzo",
    region: "Boucle du Mouhoun",
    adresse: "Centre-ville, marche central",
    coordonnees: { lat: 12.1833, lng: -4.0333 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== REGION CENTRE-EST (Tenkodogo) ==========
  {
    id: "tenkodogo-gare",
    nom: "Gare Routiere de Tenkodogo",
    ville: "Tenkodogo",
    region: "Centre-Est",
    adresse: "Route Nationale 16, Secteur 1, pres du stade municipal",
    coordonnees: { lat: 11.7800, lng: -0.3694 },
    telephone: "+226 20 70 01 56",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 19h00",
    services: ["Billetterie", "Toilettes", "Restauration"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Koupela", horaires: ["06h30", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "45min", prix: 1000 },
      { ville: "Bittou", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 },
      { ville: "Pama", horaires: ["06h30", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Lome (Togo)", horaires: ["06h00"], duree: "12h", prix: 15000 }
    ]
  },
  {
    id: "koupela-gare",
    nom: "Gare Routiere de Koupela",
    ville: "Koupela",
    region: "Centre-Est",
    adresse: "Route Nationale 4, carrefour du Ghana",
    coordonnees: { lat: 12.1833, lng: -0.3500 },
    telephone: "+226 20 70 40 22",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "05h00 - 18h00",
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "2h", prix: 2500 },
      { ville: "Tenkodogo", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "45min", prix: 1000 },
      { ville: "Fada N'Gourma", horaires: ["06h30", "08h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Pouytenga", horaires: ["07h00", "09h00", "11h00", "14h00", "16h00"], duree: "30min", prix: 800 }
    ]
  },
  {
    id: "pouytenga-gare",
    nom: "Gare Routiere de Pouytenga",
    ville: "Pouytenga",
    region: "Centre-Est",
    adresse: "Marche international de betail, centre-ville",
    coordonnees: { lat: 12.2500, lng: -0.5833 },
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "05h00 - 18h00",
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Koupela", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "30min", prix: 800 },
      { ville: "Kaya", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 },
      { ville: "Tenkodogo", horaires: ["07h00", "12h00", "15h00"], duree: "1h15", prix: 1500 }
    ]
  },
  {
    id: "garango-gare",
    nom: "Gare Routiere de Garango",
    ville: "Garango",
    region: "Centre-Est",
    adresse: "Centre-ville, route de Tenkodogo",
    coordonnees: { lat: 11.8000, lng: -0.5500 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== REGION CENTRE-NORD (Kaya) ==========
  {
    id: "kaya-gare",
    nom: "Gare Routiere de Kaya",
    ville: "Kaya",
    region: "Centre-Nord",
    adresse: "Avenue de la Liberte, Secteur 2, face a la prefecture",
    coordonnees: { lat: 13.0910, lng: -1.0844 },
    telephone: "+226 25 45 01 32",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 18h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "12h00", "14h00"], duree: "2h30", prix: 3000, compagnies: ["STMB"] },
      { ville: "Dori", horaires: ["06h30", "10h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Kongoussi", horaires: ["06h00", "08h00", "10h00", "14h00", "16h00"], duree: "1h", prix: 1500 },
      { ville: "Djibo", horaires: ["07h00", "14h00"], duree: "3h30", prix: 4500 },
      { ville: "Pouytenga", horaires: ["06h30", "09h00", "12h00", "15h00"], duree: "1h30", prix: 2000 }
    ]
  },
  {
    id: "kongoussi-gare",
    nom: "Gare Routiere de Kongoussi",
    ville: "Kongoussi",
    region: "Centre-Nord",
    adresse: "Lac Bam, route nationale, centre-ville",
    coordonnees: { lat: 13.3333, lng: -1.5333 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "barsalogho-gare",
    nom: "Gare Routiere de Barsalogho",
    ville: "Barsalogho",
    region: "Centre-Nord",
    adresse: "Centre-ville, route de Kaya",
    coordonnees: { lat: 13.4167, lng: -1.0667 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== REGION CENTRE-OUEST (Koudougou) ==========
  {
    id: "koudougou-gare",
    nom: "Gare Routiere de Koudougou",
    ville: "Koudougou",
    region: "Centre-Ouest",
    adresse: "Avenue Maurice Yameogo, Secteur 3, pres de la gare ferroviaire",
    coordonnees: { lat: 12.2525, lng: -2.3628 },
    telephone: "+226 25 44 01 87",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 20h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes", "Restauration"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "09h00", "10h00", "12h00", "14h00", "16h00"], duree: "2h", prix: 2500, compagnies: ["STMB", "STAF", "SOTRACO"] },
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "07h00", "08h00", "14h00"], duree: "3h", prix: 4000, compagnies: ["STMB", "STAF"] },
      { ville: "Dedougou", horaires: ["06h30", "10h00", "14h00"], duree: "2h30", prix: 3000, compagnies: ["STMB"] },
      { ville: "Leo", horaires: ["07h00", "12h00", "15h00"], duree: "2h30", prix: 3000 },
      { ville: "Reo", horaires: ["06h00", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "30min", prix: 500 },
      { ville: "Hounde", horaires: ["06h30", "09h00", "14h00"], duree: "1h30", prix: 1500 }
    ]
  },
  {
    id: "reo-gare",
    nom: "Gare Routiere de Reo",
    ville: "Reo",
    region: "Centre-Ouest",
    adresse: "Centre-ville, route de Koudougou",
    coordonnees: { lat: 12.3167, lng: -2.4667 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "tenado-gare",
    nom: "Gare Routiere de Tenado",
    ville: "Tenado",
    region: "Centre-Ouest",
    adresse: "Route de Leo, centre-ville",
    coordonnees: { lat: 12.1833, lng: -2.6500 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "sapouy-gare",
    nom: "Gare Routiere de Sapouy",
    ville: "Sapouy",
    region: "Centre-Ouest",
    adresse: "Centre-ville, carrefour principal",
    coordonnees: { lat: 11.5667, lng: -1.7667 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== REGION CENTRE-SUD (Manga) ==========
  {
    id: "manga-gare",
    nom: "Gare Routiere de Manga",
    ville: "Manga",
    region: "Centre-Sud",
    adresse: "Avenue du Nahouri, Secteur 1, centre administratif",
    coordonnees: { lat: 11.6667, lng: -1.0667 },
    telephone: "+226 20 77 01 12",
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "po-gare",
    nom: "Gare Routiere de Po",
    ville: "Po",
    region: "Centre-Sud",
    adresse: "Route du Ghana, frontiere, centre-ville",
    coordonnees: { lat: 11.1667, lng: -1.1500 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "kombissiri-gare",
    nom: "Gare Routiere de Kombissiri",
    ville: "Kombissiri",
    region: "Centre-Sud",
    adresse: "Route de Manga, centre-ville",
    coordonnees: { lat: 12.0667, lng: -1.3333 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== REGION EST (Fada N'Gourma) ==========
  {
    id: "fada-gare",
    nom: "Gare Routiere de Fada N'Gourma",
    ville: "Fada N'Gourma",
    region: "Est",
    adresse: "Boulevard de l'Est, Secteur 1, face a la grande mosquee",
    coordonnees: { lat: 12.0606, lng: 0.3494 },
    telephone: "+226 20 77 00 45",
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "diapaga-gare",
    nom: "Gare Routiere de Diapaga",
    ville: "Diapaga",
    region: "Est",
    adresse: "Route de Fada, centre-ville, pres du parc W",
    coordonnees: { lat: 12.0667, lng: 1.7833 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "bogande-gare",
    nom: "Gare Routiere de Bogande",
    ville: "Bogande",
    region: "Est",
    adresse: "Centre-ville, route de Fada",
    coordonnees: { lat: 12.9833, lng: -0.1333 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "pama-gare",
    nom: "Gare Routiere de Pama",
    ville: "Pama",
    region: "Est",
    adresse: "Frontiere Benin, route internationale",
    coordonnees: { lat: 11.2500, lng: 0.7000 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== REGION NORD (Ouahigouya) ==========
  {
    id: "ouahigouya-gare",
    nom: "Gare Routiere de Ouahigouya",
    ville: "Ouahigouya",
    region: "Nord",
    adresse: "Avenue Yatenga, Secteur 4, pres du palais du Yatenga Naaba",
    coordonnees: { lat: 13.5826, lng: -2.4192 },
    telephone: "+226 20 55 01 78",
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "gourcy-gare",
    nom: "Gare Routiere de Gourcy",
    ville: "Gourcy",
    region: "Nord",
    adresse: "Route de Ouahigouya, centre-ville",
    coordonnees: { lat: 13.2000, lng: -2.3500 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "yako-gare",
    nom: "Gare Routiere de Yako",
    ville: "Yako",
    region: "Nord",
    adresse: "Route Nationale 2, centre administratif",
    coordonnees: { lat: 12.9500, lng: -2.2667 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "titao-gare",
    nom: "Gare Routiere de Titao",
    ville: "Titao",
    region: "Nord",
    adresse: "Centre-ville, route de Djibo",
    coordonnees: { lat: 13.7667, lng: -2.0667 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "seguenega-gare",
    nom: "Gare Routiere de Seguenega",
    ville: "Seguenega",
    region: "Nord",
    adresse: "Centre-ville, marche hebdomadaire",
    coordonnees: { lat: 13.4333, lng: -1.9667 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== REGION PLATEAU-CENTRAL (Ziniare) ==========
  {
    id: "ziniare-gare",
    nom: "Gare Routiere de Ziniare",
    ville: "Ziniare",
    region: "Plateau-Central",
    adresse: "Route Nationale 3, centre-ville, pres du Laongo",
    coordonnees: { lat: 12.5833, lng: -1.3000 },
    telephone: "+226 25 40 60 12",
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "bousse-gare",
    nom: "Gare Routiere de Bousse",
    ville: "Bousse",
    region: "Plateau-Central",
    adresse: "Centre-ville, route de Yako",
    coordonnees: { lat: 12.6667, lng: -1.9000 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== REGION SAHEL (Dori) ==========
  {
    id: "dori-gare",
    nom: "Gare Routiere de Dori",
    ville: "Dori",
    region: "Sahel",
    adresse: "Avenue du Sahel, centre-ville, face au marche aux bestiaux",
    coordonnees: { lat: 14.0354, lng: -0.0347 },
    telephone: "+226 20 46 01 23",
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "djibo-gare",
    nom: "Gare Routiere de Djibo",
    ville: "Djibo",
    region: "Sahel",
    adresse: "Centre-ville, route de Ouagadougou",
    coordonnees: { lat: 14.1000, lng: -1.6333 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "gorom-gorom-gare",
    nom: "Gare Routiere de Gorom-Gorom",
    ville: "Gorom-Gorom",
    region: "Sahel",
    adresse: "Centre-ville, marche aux chameaux",
    coordonnees: { lat: 14.4500, lng: -0.2333 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "sebba-gare",
    nom: "Gare Routiere de Sebba",
    ville: "Sebba",
    region: "Sahel",
    adresse: "Centre-ville, frontiere Niger",
    coordonnees: { lat: 13.4333, lng: 0.5167 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== REGION SUD-OUEST (Gaoua) ==========
  {
    id: "gaoua-gare",
    nom: "Gare Routiere de Gaoua",
    ville: "Gaoua",
    region: "Sud-Ouest",
    adresse: "Avenue du Poni, Secteur 1, pres des ruines de Loropeni",
    coordonnees: { lat: 10.3250, lng: -3.1750 },
    telephone: "+226 20 87 01 34",
    compagnie: "Publique",
    type: "principale"
  },
  {
    id: "batié-gare",
    nom: "Gare Routiere de Batie",
    ville: "Batie",
    region: "Sud-Ouest",
    adresse: "Centre-ville, frontiere Ghana",
    coordonnees: { lat: 9.8833, lng: -2.9167 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "diebougou-gare",
    nom: "Gare Routiere de Diebougou",
    ville: "Diebougou",
    region: "Sud-Ouest",
    adresse: "Route de Bobo, centre-ville",
    coordonnees: { lat: 10.9667, lng: -3.2500 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "dano-gare",
    nom: "Gare Routiere de Dano",
    ville: "Dano",
    region: "Sud-Ouest",
    adresse: "Centre-ville, marche central",
    coordonnees: { lat: 11.1500, lng: -3.0667 },
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== VILLES SECONDAIRES IMPORTANTES ==========
  {
    id: "leo-gare",
    nom: "Gare Routiere de Leo",
    ville: "Leo",
    region: "Centre-Ouest",
    adresse: "Frontiere Ghana, route internationale",
    coordonnees: { lat: 11.1000, lng: -2.1000 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "ouargaye-gare",
    nom: "Gare Routiere de Ouargaye",
    ville: "Ouargaye",
    region: "Centre-Est",
    adresse: "Centre-ville, route de Tenkodogo",
    coordonnees: { lat: 11.5000, lng: 0.0500 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "zorgo-gare",
    nom: "Gare Routiere de Zorgo",
    ville: "Zorgo",
    region: "Plateau-Central",
    adresse: "Route Nationale 4, centre-ville",
    coordonnees: { lat: 12.2500, lng: -0.6167 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "boulsa-gare",
    nom: "Gare Routiere de Boulsa",
    ville: "Boulsa",
    region: "Centre-Nord",
    adresse: "Centre-ville, route de Kaya",
    coordonnees: { lat: 12.6500, lng: -0.5667 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "sapone-gare",
    nom: "Gare Routiere de Sapone",
    ville: "Sapone",
    region: "Centre",
    adresse: "Route de Po, proche reserve de crocodiles",
    coordonnees: { lat: 12.0500, lng: -1.6000 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "koubri-gare",
    nom: "Gare Routiere de Koubri",
    ville: "Koubri",
    region: "Centre",
    adresse: "Route de Po, peripherie sud de Ouagadougou",
    coordonnees: { lat: 12.1833, lng: -1.5667 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "loumbila-gare",
    nom: "Gare Routiere de Loumbila",
    ville: "Loumbila",
    region: "Centre",
    adresse: "Barrage de Loumbila, route de Ziniare",
    coordonnees: { lat: 12.4833, lng: -1.4000 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "tanghin-dassouri-gare",
    nom: "Gare Routiere de Tanghin-Dassouri",
    ville: "Tanghin-Dassouri",
    region: "Centre",
    adresse: "Route de Bobo, ouest de Ouagadougou",
    coordonnees: { lat: 12.3667, lng: -1.7333 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "pabre-gare",
    nom: "Gare Routiere de Pabre",
    ville: "Pabre",
    region: "Centre",
    adresse: "Route de Ouahigouya, nord de Ouagadougou",
    coordonnees: { lat: 12.5167, lng: -1.5833 },
    compagnie: "Publique",
    type: "secondaire"
  },
  {
    id: "ouagadougou-rood-woko",
    nom: "Gare de Rood Woko",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Grand Marche Rood Woko, centre-ville historique",
    coordonnees: { lat: 12.3639, lng: -1.5178 },
    telephone: "+226 25 30 77 88",
    compagnie: "Publique",
    type: "secondaire"
  },

  // ========== AGENCES SUPPLEMENTAIRES COMPAGNIES PRIVEES ==========
  {
    id: "tcv-banfora",
    nom: "Agence TCV Banfora",
    ville: "Banfora",
    region: "Cascades",
    adresse: "Centre commercial, avenue principale",
    coordonnees: { lat: 10.6340, lng: -4.7580 },
    telephone: "+226 20 91 05 67",
    compagnie: "tcv",
    type: "agence"
  },
  {
    id: "rahimo-banfora",
    nom: "Agence Rahimo Banfora",
    ville: "Banfora",
    region: "Cascades",
    adresse: "Route de Bobo, secteur 2",
    coordonnees: { lat: 10.6310, lng: -4.7620 },
    telephone: "+226 64 86 37 55",
    compagnie: "rahimo",
    type: "agence"
  },
  {
    id: "tcv-koudougou",
    nom: "Agence TCV Koudougou",
    ville: "Koudougou",
    region: "Centre-Ouest",
    adresse: "Avenue Maurice Yameogo, centre-ville",
    coordonnees: { lat: 12.2550, lng: -2.3650 },
    telephone: "+226 25 44 03 21",
    compagnie: "tcv",
    type: "agence"
  },
  {
    id: "stmb-kaya",
    nom: "Agence STMB Kaya",
    ville: "Kaya",
    region: "Centre-Nord",
    adresse: "Route de Ouagadougou, entree sud",
    coordonnees: { lat: 13.0880, lng: -1.0870 },
    telephone: "+226 25 45 02 45",
    compagnie: "stmb",
    type: "agence"
  },
  {
    id: "stmb-fada",
    nom: "Agence STMB Fada N'Gourma",
    ville: "Fada N'Gourma",
    region: "Est",
    adresse: "Centre-ville, route nationale",
    coordonnees: { lat: 12.0580, lng: 0.3510 },
    telephone: "+226 20 77 01 89",
    compagnie: "stmb",
    type: "agence"
  },
  {
    id: "tsr-bobo",
    nom: "Agence TSR Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Quartier Farakan, avenue de la Liberte",
    coordonnees: { lat: 11.1790, lng: -4.3000 },
    telephone: "+226 20 97 33 44",
    compagnie: "tsr",
    type: "agence"
  },
  {
    id: "rakieta-ouaga",
    nom: "Agence Rakieta Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Gare routiere internationale, hall B",
    coordonnees: { lat: 12.4035, lng: -1.5290 },
    telephone: "+226 20 91 01 23",
    compagnie: "rakieta",
    type: "agence"
  },
  {
    id: "elitis-bobo",
    nom: "Agence Elitis Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Quartier Koko, route de Sikasso",
    coordonnees: { lat: 11.1820, lng: -4.2880 },
    telephone: "+226 70 88 99 01",
    compagnie: "elitis",
    type: "agence"
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
