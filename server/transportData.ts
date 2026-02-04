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
  },
  {
    id: "sitarail",
    nom: "SITARAIL",
    nomComplet: "Societe Internationale de Transport Africain par Rail",
    description: "Compagnie ferroviaire gerant la ligne Abidjan-Ouagadougou. Service voyageurs national uniquement depuis 2020 (ligne internationale suspendue). Voyage panoramique a travers le Burkina.",
    fondee: 1995,
    siege: "Abidjan / Ouagadougou",
    telephone: ["+226 25 31 15 02", "+226 25 31 15 03"],
    email: "info@sitarail.com",
    services: ["2e classe", "192 places", "Bagages inclus", "Vue panoramique", "Restauration a bord"],
    destinations: ["Ouagadougou", "Koudougou", "Siby", "Bobo-Dioulasso", "Banfora", "Niangoloko"],
    note: 3.8,
    avis: "Experience unique - Plus lent que le bus mais scenique"
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
    adresse: "Rue 30.73, Avenue des Arts, Kalgondin, Secteur 15, face a la station Total, a 200m de la Clinique Les Genets",
    coordonnees: { lat: 12.3789, lng: -1.4965 },
    telephone: "+226 64 86 37 55",
    compagnie: "rahimo",
    type: "principale",
    heuresOuverture: "05h00 - 22h00",
    services: ["Climatisation", "USB", "GPS", "Wifi", "Bagages 25kg inclus", "Salle d'attente VIP"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "08h00", "10h00", "14h00", "16h00", "22h00"], duree: "5h", prix: 6000, compagnies: ["RAHIMO"] },
      { ville: "Banfora", horaires: ["06h30", "14h00", "22h00"], duree: "7h", prix: 8000, compagnies: ["RAHIMO"] },
      { ville: "Abidjan (CI)", horaires: ["06h00", "14h00", "22h00"], duree: "14h", prix: 20000, compagnies: ["RAHIMO"] },
      { ville: "Bouake (CI)", horaires: ["06h00", "22h00"], duree: "10h", prix: 15000, compagnies: ["RAHIMO"] },
      { ville: "Yamoussoukro (CI)", horaires: ["06h00", "22h00"], duree: "12h", prix: 18000, compagnies: ["RAHIMO"] },
      { ville: "Lome (Togo)", horaires: ["06h00", "18h00"], duree: "18h", prix: 25000, compagnies: ["RAHIMO"] }
    ]
  },
  {
    id: "tcv-ouaga",
    nom: "Gare TCV Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Avenue de la Grande-Mosquee, Secteur 5, Koulouba, pres du rond-point des Nations Unies, face a la Banque Atlantique",
    coordonnees: { lat: 12.3680, lng: -1.5165 },
    telephone: "+226 75 79 13 07",
    compagnie: "tcv",
    type: "principale",
    heuresOuverture: "05h00 - 23h00",
    services: ["Climatisation", "Salle d'attente TV", "Wifi", "Colis express", "Billetterie electronique"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["05h30", "06h30", "08h00", "10h00", "12h00", "14h00", "16h00", "22h00"], duree: "5h", prix: 6000, compagnies: ["TCV"] },
      { ville: "Banfora", horaires: ["06h00", "10h00", "14h00", "22h00"], duree: "7h", prix: 8000, compagnies: ["TCV"] },
      { ville: "Orodara", horaires: ["06h30", "14h00"], duree: "6h30", prix: 7000, compagnies: ["TCV"] },
      { ville: "Abidjan (CI)", horaires: ["06h00", "14h00", "22h00"], duree: "14h", prix: 20000, compagnies: ["TCV"] },
      { ville: "Bamako (Mali)", horaires: ["06h00", "14h00"], duree: "18h", prix: 22000, compagnies: ["TCV"] },
      { ville: "Lome (Togo)", horaires: ["14h00"], duree: "24h", prix: 30000, compagnies: ["TCV"] },
      { ville: "Cotonou (Benin)", horaires: ["06h00"], duree: "28h", prix: 35000, compagnies: ["TCV"] }
    ]
  },
  {
    id: "stmb-ouaga",
    nom: "Gare STMB Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Rue du Marche, Secteur 11, Dapoya, Zone commerciale du centre-ville, derriere le Marche Central de Ouaga 2000",
    coordonnees: { lat: 12.3701, lng: -1.5234 },
    telephone: "+226 25 30 63 85",
    compagnie: "stmb",
    type: "principale",
    heuresOuverture: "05h00 - 20h00",
    services: ["Climatisation", "Bagages 30kg inclus", "Salle d'attente", "Colis"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "07h30", "09h00", "14h00", "16h00"], duree: "5h", prix: 5500, compagnies: ["STMB"] },
      { ville: "Ouahigouya", horaires: ["06h00", "08h00", "10h00", "14h00", "16h00"], duree: "3h30", prix: 4000, compagnies: ["STMB"] },
      { ville: "Koudougou", horaires: ["06h00", "07h00", "08h00", "10h00", "12h00", "14h00", "16h00", "18h00"], duree: "2h", prix: 2500, compagnies: ["STMB"] },
      { ville: "Fada N'Gourma", horaires: ["06h00", "08h00", "14h00"], duree: "4h", prix: 5000, compagnies: ["STMB"] },
      { ville: "Kaya", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "2h30", prix: 3000, compagnies: ["STMB"] },
      { ville: "Dedougou", horaires: ["06h30", "14h00"], duree: "4h30", prix: 5000, compagnies: ["STMB"] }
    ]
  },
  {
    id: "tsr-ouaga",
    nom: "Gare TSR Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Avenue Yennenga, Secteur 9, Gounghin, a cote du Lycee Philippe Zinda Kabore, pres du carrefour de la Patte d'Oie",
    coordonnees: { lat: 12.3650, lng: -1.5320 },
    telephone: "+226 25 36 48 72",
    compagnie: "tsr",
    type: "principale",
    heuresOuverture: "05h30 - 21h00",
    services: ["Climatisation", "Colis", "Bagages inclus"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "08h00", "14h00", "16h00"], duree: "5h", prix: 5000, compagnies: ["TSR"] },
      { ville: "Ouahigouya", horaires: ["06h30", "09h00", "14h00"], duree: "3h30", prix: 3500, compagnies: ["TSR"] },
      { ville: "Niamey (Niger)", horaires: ["07h00", "15h00"], duree: "8h", prix: 12000, compagnies: ["TSR"] },
      { ville: "Bamako (Mali)", horaires: ["06h00"], duree: "18h", prix: 20000, compagnies: ["TSR"] }
    ]
  },
  {
    id: "staf-ouaga",
    nom: "Gare STAF Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Boulevard de la Resistance, Secteur 14, Koulouba, face au Ministere de l'Economie, a 100m de la Place des Cineastes",
    coordonnees: { lat: 12.3580, lng: -1.5180 },
    telephone: "+226 25 31 55 66",
    compagnie: "staf",
    type: "principale",
    heuresOuverture: "05h30 - 20h00",
    services: ["Climatisation", "Bagages inclus", "Bus neufs"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h30", "08h00", "14h00", "16h00"], duree: "5h", prix: 5000, compagnies: ["STAF"] },
      { ville: "Banfora", horaires: ["07h00", "14h00"], duree: "7h", prix: 7000, compagnies: ["STAF"] },
      { ville: "Koudougou", horaires: ["06h00", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "2h", prix: 2000, compagnies: ["STAF"] }
    ]
  },
  {
    id: "elitis-ouaga",
    nom: "Gare Elitis Express Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Avenue de l'Independance, Secteur 4, Koulouba, pres de l'Hotel Silmande, face a la Chambre de Commerce et d'Industrie",
    coordonnees: { lat: 12.3720, lng: -1.5100 },
    telephone: "+226 70 88 99 00",
    compagnie: "elitis",
    type: "principale",
    heuresOuverture: "06h00 - 20h00",
    services: ["Luxe", "Climatisation", "Wifi haut debit", "Collation offerte", "Sieges inclinables 180°", "Prises electriques", "Ecrans individuels"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["07h00", "14h00"], duree: "4h30", prix: 12000, compagnies: ["ELITIS"] },
      { ville: "Banfora", horaires: ["07h00"], duree: "6h30", prix: 15000, compagnies: ["ELITIS"] }
    ]
  },
  // ========== RESEAU SOTRACO - BUS URBAINS ==========
  // Source officielle: sotraco.bf - Mise a jour Decembre 2024
  // Contact: +226 52 50 18 18 / +226 25 35 55 55
  // Email: contact@sotraco.bf
  // Siege: 2257, Avenue du Sanmatenga, Secteur 19, Ouagadougou

  // ===== TERMINUS CENTRAUX OUAGADOUGOU =====
  {
    id: "sotraco-naba-koom",
    nom: "Terminus Naba Koom (Place Naaba Koom)",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Place Naaba Koom, Centre-ville, face a la Maison du Peuple",
    coordonnees: { lat: 12.3660, lng: -1.5220 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "04h50 - 23h00",
    services: ["Terminus central", "Correspondances multiples", "Abri voyageurs", "Information lignes"],
    destinations: [
      { ville: "L1 - Karpala (via Av. Charles de Gaulle)", horaires: ["05h00-22h00, toutes les 15-20 min"], prix: 200 },
      { ville: "L2 - Yamtenga (via Patte-d'Oie)", horaires: ["05h00-22h00, toutes les 15-20 min"], prix: 200 },
      { ville: "L2B - Balkuy (via Ouaga 2000)", horaires: ["05h00-22h00, toutes les 20 min"], prix: 200 },
      { ville: "L5 - Signonghin Saaba (via Echangeur Est)", horaires: ["05h00-22h00, toutes les 20 min"], prix: 200 },
      { ville: "L5B - One School Saaba", horaires: ["05h30-21h00, toutes les 25 min"], prix: 200 },
      { ville: "L6 - Koulweoguin (via Tanghin)", horaires: ["05h00-22h00, toutes les 20 min"], prix: 200 },
      { ville: "L6B - Voie de contournement (via Kossodo)", horaires: ["05h00-22h00, toutes les 20 min"], prix: 200 },
      { ville: "L9 - Saaba (via Taabtenga)", horaires: ["05h30-21h30, toutes les 25 min"], prix: 200 },
      { ville: "L11 - Rimkieta (via Sankaryare)", horaires: ["05h30-21h00, toutes les 20 min"], prix: 200 },
      { ville: "L15 - Belle Ville Watinoma", horaires: ["06h00-20h00, toutes les 25 min"], prix: 200 },
      { ville: "L16 - Bassinko (via Echangeur Nord)", horaires: ["06h00-20h00, toutes les 30 min"], prix: 200 },
      { ville: "Intercommunale Ziniare (via Loumbila)", horaires: ["06h00-19h00, toutes les 45 min"], prix: 300 },
      { ville: "Intercommunale Koubri", horaires: ["06h30-18h30, toutes les 60 min"], prix: 300 }
    ]
  },
  {
    id: "sotraco-zone-ecoles",
    nom: "Terminus Zone des Ecoles",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Zone des Ecoles, pres de la DG Police Nationale, Secteur 4",
    coordonnees: { lat: 12.3720, lng: -1.5100 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "05h00 - 22h00",
    services: ["Terminus principal", "Correspondances", "Abri voyageurs"],
    destinations: [
      { ville: "L3 - Bissighin (via Echangeur Nord)", horaires: ["05h50-21h50, toutes les 20 min"], prix: 200 },
      { ville: "L4 - Sandogo (via Echangeur Ouest)", horaires: ["05h30-21h30, toutes les 20 min"], prix: 200 },
      { ville: "L4B - Zagtouli (via Boulmiougou)", horaires: ["06h00-21h00, toutes les 25 min"], prix: 200 },
      { ville: "L10 - CHU Tengandogo (via Patte-d'Oie)", horaires: ["04h50-22h59, toutes les 20 min"], prix: 200 },
      { ville: "L12 - Bonheur Ville (via Cissin)", horaires: ["05h30-21h00, toutes les 25 min"], prix: 200 },
      { ville: "L13 - Kamboinsin (via Echangeur Nord)", horaires: ["06h00-20h30, toutes les 25 min"], prix: 200 },
      { ville: "L17 - Boassa (via Sandogo)", horaires: ["06h00-20h00, toutes les 30 min"], prix: 200 }
    ]
  },
  {
    id: "sotraco-siege",
    nom: "Siege SOTRACO - Arret Kossodo",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "2257, Avenue du Sanmatenga, Secteur 19, Zone industrielle Kossodo",
    coordonnees: { lat: 12.4150, lng: -1.4820 },
    telephone: "+226 25 35 55 55",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "07h30 - 16h00 (administratif)",
    services: ["Siege social", "Abonnements", "Reclamations", "Information", "Depot central"],
    destinations: [
      { ville: "L6B vers Naba Koom", horaires: ["Transit - toutes les 20 min"], prix: 200 },
      { ville: "Intercommunale Ziniare", horaires: ["Transit vers Ziniare"], prix: 300 }
    ]
  },

  // ===== LIGNES OUAGADOUGOU - DETAILS COMPLETS =====
  {
    id: "sotraco-ligne1-karpala",
    nom: "Terminus L1 Karpala",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Karpala, Station SOGEL B, Secteur 30, quartier Bogodogo",
    coordonnees: { lat: 12.3450, lng: -1.4850 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "05h00 - 22h00",
    services: ["Terminus de ligne", "Abri voyageurs"],
    destinations: [
      { ville: "Ligne 1 vers Naba Koom", horaires: ["05h00-22h00, depart toutes les 15-20 min"], duree: "35-45 min", prix: 200 }
    ]
  },
  {
    id: "sotraco-ligne2-yamtenga",
    nom: "Terminus L2 Yamtenga (2 Boutiques)",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Yamtenga, Lycee Communal, Secteur 29, quartier Bogodogo",
    coordonnees: { lat: 12.3350, lng: -1.4750 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "05h00 - 22h00",
    services: ["Terminus de ligne", "Abri voyageurs"],
    destinations: [
      { ville: "Ligne 2 vers Naba Koom (via Patte-d'Oie)", horaires: ["05h00-22h00, depart toutes les 15-20 min"], duree: "40-50 min", prix: 200 }
    ]
  },
  {
    id: "sotraco-ligne2b-balkuy",
    nom: "Terminus L2B Balkuy",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Balkuy, Trame d'accueil Ouaga 2000, Zone Sud",
    coordonnees: { lat: 12.3100, lng: -1.5100 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "05h00 - 22h00",
    services: ["Terminus de ligne", "Ligne la plus longue (18+ km, 39 arrets)"],
    destinations: [
      { ville: "Ligne 2B vers Naba Koom (via Ouaga 2000, Gare Rahimo, CHU Yalgado)", horaires: ["05h00-22h00, depart toutes les 20 min"], duree: "34 min", prix: 200 }
    ]
  },
  {
    id: "sotraco-ligne3-bissighin",
    nom: "Terminus L3 Bissighin",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Bissighin, DRB Bissighin, route de Ouahigouya, Secteur 28",
    coordonnees: { lat: 12.4200, lng: -1.5450 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "05h50 - 21h50",
    services: ["Terminus de ligne", "25 arrets", "Abri voyageurs"],
    destinations: [
      { ville: "Ligne 3 vers Zone des Ecoles (via Echangeur Nord, Place de la Nation)", horaires: ["05h50-21h50, depart toutes les 20 min"], duree: "34 min", prix: 200 }
    ]
  },
  {
    id: "sotraco-ligne4-sandogo",
    nom: "Terminus L4 Sandogo",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Sandogo, quartier peripherique Ouest, Secteur 26",
    coordonnees: { lat: 12.3600, lng: -1.5650 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "05h30 - 21h30",
    services: ["Terminus de ligne", "21 arrets"],
    destinations: [
      { ville: "Ligne 4 vers Zone des Ecoles (via Echangeur Ouest, Place de la Nation)", horaires: ["05h30-21h30, depart toutes les 20 min"], duree: "27 min", prix: 200 }
    ]
  },
  {
    id: "sotraco-ligne5-signonghin",
    nom: "Terminus L5 Signonghin (Saaba)",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Sigui Yaar de Bargo, Route de Fada, Station ORYX Signonghin",
    coordonnees: { lat: 12.3800, lng: -1.4300 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "05h00 - 22h00",
    services: ["Terminus de ligne", "20 arrets", "Dessert Saaba"],
    destinations: [
      { ville: "Ligne 5 vers Naba Koom (via Echangeur Est, CHU Yalgado)", horaires: ["05h00-22h00, depart toutes les 20 min"], duree: "29 min", prix: 200 }
    ]
  },
  {
    id: "sotraco-ligne6-koulweoguin",
    nom: "Terminus L6 Koulweoguin",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Koulweoguin, Chateau d'eau, Secteur 22, quartier Tanghin",
    coordonnees: { lat: 12.3950, lng: -1.5100 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "04h59 - 22h40",
    services: ["Terminus de ligne", "Ligne la plus courte (6 km, 13 arrets)"],
    destinations: [
      { ville: "Ligne 6 vers Naba Koom (via Marche Tanghin, Paspanga)", horaires: ["04h59-22h40, depart toutes les 15-20 min"], duree: "20 min", prix: 200 }
    ]
  },
  {
    id: "sotraco-ligne10-tengandogo",
    nom: "Terminus L10 CHU Tengandogo",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "CHU de Tengandogo, Route de Sapone, Zone Sud",
    coordonnees: { lat: 12.3150, lng: -1.5250 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "04h50 - 22h59",
    services: ["Terminus de ligne", "24 arrets", "Acces CHU"],
    destinations: [
      { ville: "Ligne 10 vers Zone des Ecoles (via Patte-d'Oie, Lycee Bambata)", horaires: ["04h50-22h59, depart toutes les 20 min"], duree: "33-34 min", prix: 200 }
    ]
  },

  // ===== TERMINUS BOBO-DIOULASSO =====
  {
    id: "sotraco-bobo-tiefo-amoro",
    nom: "Terminus Place Tiefo Amoro",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Place Tiefo Amoro, Centre-ville, pres de l'Avenue de la Nation",
    coordonnees: { lat: 11.1771, lng: -4.2979 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "05h45 - 20h30 (Lun-Ven) / 07h00 - 19h45 (Week-end)",
    services: ["Terminus central Bobo", "12 lignes ordinaires", "3 lignes etudiants", "238 km de reseau", "312 arrets"],
    destinations: [
      { ville: "L1 - Cite universitaire Belleville (CROUB)", horaires: ["05h45-20h30, toutes les 20 min"], prix: 200 },
      { ville: "L1B - Cite verte Belleville (via INSSA)", horaires: ["06h00-20h00, toutes les 25 min"], prix: 200 },
      { ville: "L2 - Station Oryx Route de Ouaga", horaires: ["05h45-20h30, toutes les 20 min"], prix: 200 },
      { ville: "L2B - Marche de Yegueresso", horaires: ["06h00-20h00, toutes les 25 min"], prix: 200 },
      { ville: "L3 - Station Petro Sar Route de Bama", horaires: ["06h00-20h00, toutes les 25 min"], prix: 200 },
      { ville: "L4 - Station Oryx (via Hotel de ville)", horaires: ["06h00-20h00, toutes les 25 min"], prix: 200 },
      { ville: "L5 - Depot pharmaceutique Farako Ba", horaires: ["06h00-20h00, toutes les 30 min"], prix: 200 },
      { ville: "L6 - Logements sociaux Ouezzinville", horaires: ["06h00-20h00, toutes les 25 min"], prix: 200 },
      { ville: "L7 - CSPS Santidougou", horaires: ["06h00-19h30, toutes les 30 min"], prix: 200 },
      { ville: "L8 - Djoulankolo-logo", horaires: ["06h00-19h30, toutes les 30 min"], prix: 200 },
      { ville: "L10 - IRA (Institut Regional Agricole)", horaires: ["06h30-19h00, toutes les 30 min"], prix: 200 }
    ]
  },
  {
    id: "sotraco-bobo-zone-ecoles",
    nom: "Terminus Zone des Ecoles Bobo",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Zone des Ecoles, Dafra auto-ecole, Secteur 1",
    coordonnees: { lat: 11.1850, lng: -4.2900 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "06h00 - 20h00",
    services: ["Terminus secondaire", "Correspondances"],
    destinations: [
      { ville: "L9 - Marche du 22 (via SNC, Boulevard Independance)", horaires: ["06h00-20h00, toutes les 25 min"], prix: 200 }
    ]
  },

  // ===== TERMINUS KOUDOUGOU =====
  {
    id: "sotraco-koudougou-central",
    nom: "Terminus Central TAL-MBI Koudougou",
    ville: "Koudougou",
    region: "Centre-Ouest",
    adresse: "Carrefour TAL-MBI, Quartier Issouka, Centre-ville",
    coordonnees: { lat: 12.2500, lng: -2.3650 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "06h00 - 19h30",
    services: ["Terminus central Koudougou", "7 lignes ordinaires", "4 lignes intercommunales", "140 km de reseau", "160 arrets", "12 terminus peripheriques"],
    destinations: [
      { ville: "L1 - Terminus Issouka (vers Gare routiere)", horaires: ["06h00-19h30, toutes les 30 min"], prix: 150 },
      { ville: "L2 - Terminus Secteur 10 (via Universite)", horaires: ["06h00-19h30, toutes les 30 min"], prix: 150 },
      { ville: "L3 - Terminus Goundi (route de Dedougou)", horaires: ["06h00-19h30, toutes les 30 min"], prix: 150 },
      { ville: "L4 - Terminus Dapoya", horaires: ["06h30-19h00, toutes les 35 min"], prix: 150 },
      { ville: "L5 - Terminus RTB (route de Reo)", horaires: ["06h00-19h30, toutes les 30 min"], prix: 150 },
      { ville: "L6 - Terminus Lycee WendSongda (route de Yako)", horaires: ["06h30-19h00, toutes les 35 min"], prix: 150 },
      { ville: "Intercommunale Reo", horaires: ["06h30, 10h00, 14h00, 17h00"], duree: "45 min", prix: 300 },
      { ville: "Intercommunale Sabou", horaires: ["07h00, 11h00, 15h00"], duree: "30 min", prix: 250 },
      { ville: "Intercommunale Tenado", horaires: ["07h00, 12h00, 16h00"], duree: "40 min", prix: 300 },
      { ville: "Intercommunale Ramongho", horaires: ["08h00, 13h00"], duree: "35 min", prix: 250 }
    ]
  },
  {
    id: "sotraco-koudougou-gare",
    nom: "Terminus Gare Routiere Koudougou",
    ville: "Koudougou",
    region: "Centre-Ouest",
    adresse: "Gare Routiere, Centre-ville, pres de la Banque BDU",
    coordonnees: { lat: 12.2520, lng: -2.3680 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "secondaire",
    heuresOuverture: "06h00 - 19h00",
    services: ["Terminus peripherique", "Connexion gare routiere"],
    destinations: [
      { ville: "L3 depuis Goundi (via Universite, SONABEL, Mairie)", horaires: ["06h00-19h00, toutes les 30 min"], prix: 150 }
    ]
  },

  // ===== TERMINUS OUAHIGOUYA =====
  {
    id: "sotraco-ouahigouya-central",
    nom: "Terminus Central SOTRACO Ouahigouya",
    ville: "Ouahigouya",
    region: "Nord",
    adresse: "Centre-ville Ouahigouya, pres du Grand Marche",
    coordonnees: { lat: 13.5833, lng: -2.4167 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "06h00 - 19h00",
    services: ["Terminus central", "Lignes urbaines", "Abri voyageurs"],
    destinations: [
      { ville: "Lignes urbaines Ouahigouya", horaires: ["06h00-19h00, frequence variable"], prix: 150 }
    ]
  },

  // ===== TERMINUS DEDOUGOU =====
  {
    id: "sotraco-dedougou-central",
    nom: "Terminus SOTRACO Dedougou",
    ville: "Dedougou",
    region: "Boucle du Mouhoun",
    adresse: "Centre-ville Dedougou, pres de la Prefecture",
    coordonnees: { lat: 12.4633, lng: -3.4600 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "06h30 - 18h30",
    services: ["Service operationnel depuis dec. 2021", "2 lignes etudiants", "Transport scolaire"],
    destinations: [
      { ville: "Ligne etudiante 1 - Universites et Lycees", horaires: ["06h30-08h00, 12h00-13h00, 17h00-18h30"], prix: 100 },
      { ville: "Ligne etudiante 2 - Quartiers residentiels", horaires: ["06h30-08h00, 12h00-13h00, 17h00-18h30"], prix: 100 }
    ]
  },

  // ===== LIGNES SPECIALES UNIVERSITAIRES OUAGADOUGOU =====
  {
    id: "sotraco-uo1-kossodo",
    nom: "Ligne Speciale UO1 - Cite Kossodo",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Cite universitaire de Kossodo, pres de la Mosquee de vendredi",
    coordonnees: { lat: 12.4100, lng: -1.4750 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "secondaire",
    heuresOuverture: "06h30 - 19h00",
    services: ["Transport etudiant", "Ligne speciale UO1"],
    destinations: [
      { ville: "UO1 via SIAO (Tan Aliz, Echangeur Est, LTO, ISIG)", horaires: ["06h30, 07h00, 07h30, 12h00, 13h00, 17h00, 18h00"], prix: 100 }
    ]
  },
  {
    id: "sotraco-uts-saaba",
    nom: "Lignes Speciales UTS (Universite Thomas Sankara)",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Campus Universite Thomas Sankara, Route de Fada, Saaba",
    coordonnees: { lat: 12.3900, lng: -1.4200 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "secondaire",
    heuresOuverture: "06h00 - 19h30",
    services: ["Transport etudiant", "3 axes vers UTS", "Dessert campus universitaire"],
    destinations: [
      { ville: "Axe 1: UO1 - CHU Charles de Gaulle - Echangeur Est - Saaba - Peage - UTS", horaires: ["06h30, 07h00, 12h30, 17h30"], prix: 100 },
      { ville: "Axe 2: SIAO - CHU Charles de Gaulle - Echangeur Est - Saaba - Peage - UTS", horaires: ["06h30, 07h00, 12h30, 17h30"], prix: 100 },
      { ville: "Axe 3: CHU Yalgado - ENAREF - Echangeur Est - Saaba - Peage - UTS", horaires: ["06h30, 07h00, 12h30, 17h30"], prix: 100 }
    ]
  },

  // ===== LIGNES INTERCOMMUNALES =====
  {
    id: "sotraco-intercommunale-ziniare",
    nom: "Ligne Intercommunale Ouagadougou - Ziniare",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Depart: Terminus Naba Koom - Arrivee: Ex-gare routiere Ziniare",
    coordonnees: { lat: 12.5833, lng: -1.3000 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "06h00 - 19h00",
    services: ["Ligne intercommunale", "Dessert Loumbila", "Connexion Plateau-Central"],
    destinations: [
      { ville: "Ziniare via CHR Ziniare, Bangrin, Nongana, Loumbila, Nioko II, Kossodo, Siege SOTRACO, CHU Yalgado", horaires: ["06h00, 07h00, 08h00, 10h00, 12h00, 14h00, 16h00, 18h00"], duree: "1h15", prix: 300 }
    ]
  },
  {
    id: "sotraco-intercommunale-koubri",
    nom: "Ligne Intercommunale Ouagadougou - Koubri",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Depart: Gare routiere Ouaga - Arrivee: Marche de Koubri",
    coordonnees: { lat: 12.2000, lng: -1.3667 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "06h30 - 18h30",
    services: ["Ligne intercommunale", "Dessert Balkuy et peripherie Sud"],
    destinations: [
      { ville: "Koubri via Mairie Koubri, College St Antoine, Kiendpalgo, Balkuy, Nongtaaba, Ouaga 2000, Camp Baba SY, CCVA, Gare routiere", horaires: ["06h30, 08h00, 10h00, 12h00, 14h00, 16h00, 18h00"], duree: "1h", prix: 300 }
    ]
  },
  {
    id: "sotraco-intercommunale-pabre",
    nom: "Ligne Intercommunale Ouagadougou - Pabre",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Depart: Memorial Thomas Sankara - Arrivee: Mosquee de Pabre",
    coordonnees: { lat: 12.5167, lng: -1.5667 },
    telephone: "+226 52 50 18 18",
    compagnie: "sotraco",
    type: "principale",
    heuresOuverture: "06h30 - 18h00",
    services: ["Ligne intercommunale", "Dessert Kossoghin et PMK"],
    destinations: [
      { ville: "Pabre via CARFO Paspanga, RTB, Nations Unies, Place de la Nation, Lycee Kolog Naba, CMA Paul VI, Seminaire Kossoghin, LAC, PMK, Mosquee Pabre", horaires: ["06h30, 08h00, 10h30, 13h00, 15h30, 17h30"], duree: "50 min", prix: 250 }
    ]
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
    adresse: "Avenue de la Republique, Secteur 3, Tounouma, a cote de la station Shell, pres du rond-point de l'Independance",
    coordonnees: { lat: 11.1810, lng: -4.2920 },
    telephone: "+226 20 98 44 55",
    compagnie: "stmb",
    type: "agence",
    heuresOuverture: "05h30 - 20h00",
    services: ["Climatisation", "Bagages inclus", "Salle d'attente"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "10h00", "14h00", "16h00"], duree: "5h", prix: 5500, compagnies: ["STMB"] },
      { ville: "Dedougou", horaires: ["07h00", "14h00"], duree: "3h30", prix: 4000, compagnies: ["STMB"] },
      { ville: "Ouahigouya", horaires: ["06h00", "14h00"], duree: "8h", prix: 9000, compagnies: ["STMB"] },
      { ville: "Koudougou", horaires: ["06h30", "09h00", "14h00", "16h00"], duree: "3h", prix: 3500, compagnies: ["STMB"] }
    ]
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
    adresse: "Boulevard Oumarou Kanazoe, Secteur 2, face au marche central, pres de la station Total",
    coordonnees: { lat: 10.6350, lng: -4.7550 },
    telephone: "+226 20 91 01 23",
    compagnie: "rakieta",
    type: "principale",
    heuresOuverture: "05h30 - 20h00",
    services: ["Climatisation", "Bagages inclus", "Colis"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "07h00", "08h30", "10h00", "12h00", "14h00", "16h00"], duree: "2h", prix: 2500, compagnies: ["RAKIETA"] },
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "14h00", "22h00"], duree: "7h", prix: 8000, compagnies: ["RAKIETA"] },
      { ville: "Abidjan (CI)", horaires: ["06h00", "14h00", "22h00"], duree: "7h", prix: 12000, compagnies: ["RAKIETA"] },
      { ville: "Niangoloko", horaires: ["07h00", "10h00", "14h00", "16h00"], duree: "1h30", prix: 2000, compagnies: ["RAKIETA"] },
      { ville: "Sindou", horaires: ["08h00", "12h00", "15h00"], duree: "1h", prix: 1500, compagnies: ["RAKIETA"] }
    ]
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
    adresse: "Centre-ville, pres du marche central, face a la pharmacie communale",
    coordonnees: { lat: 12.1833, lng: -4.0333 },
    telephone: "+226 20 53 70 12",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Nouna", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 },
      { ville: "Dedougou", horaires: ["06h30", "08h00", "14h00"], duree: "3h", prix: 3500 },
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Ouagadougou", horaires: ["06h00"], duree: "7h", prix: 7500 }
    ]
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
    adresse: "Centre-ville, route de Tenkodogo, pres du CEG de Garango, face au marche",
    coordonnees: { lat: 11.8000, lng: -0.5500 },
    telephone: "+226 20 70 50 18",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Tenkodogo", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "40min", prix: 800 },
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "14h00"], duree: "3h", prix: 3500 },
      { ville: "Koupela", horaires: ["07h00", "10h00", "14h00"], duree: "1h", prix: 1200 },
      { ville: "Zabr", horaires: ["08h00", "12h00", "15h00"], duree: "30min", prix: 500 }
    ]
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
    adresse: "Lac Bam, route nationale, pres du pont du lac Bam, face a la mairie",
    coordonnees: { lat: 13.3333, lng: -1.5333 },
    telephone: "+226 25 45 40 15",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Kaya", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "1h", prix: 1500 },
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "14h00"], duree: "3h30", prix: 4000 },
      { ville: "Djibo", horaires: ["07h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Yako", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 }
    ]
  },
  {
    id: "barsalogho-gare",
    nom: "Gare Routiere de Barsalogho",
    ville: "Barsalogho",
    region: "Centre-Nord",
    adresse: "Centre-ville, route de Kaya, pres de la mosquee centrale, face au dispensaire",
    coordonnees: { lat: 13.4167, lng: -1.0667 },
    telephone: "+226 25 45 50 08",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h30 - 16h00",
    destinations: [
      { ville: "Kaya", horaires: ["07h00", "10h00", "14h00"], duree: "45min", prix: 1000 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "3h15", prix: 3800 },
      { ville: "Dori", horaires: ["07h00"], duree: "3h30", prix: 4500 }
    ]
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
    adresse: "Centre-ville, route de Koudougou, face au marche de Reo, pres de l'eglise catholique",
    coordonnees: { lat: 12.3167, lng: -2.4667 },
    telephone: "+226 25 44 10 22",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Koudougou", horaires: ["06h00", "07h00", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "30min", prix: 500 },
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Tenado", horaires: ["07h00", "10h00", "14h00"], duree: "45min", prix: 700 }
    ]
  },
  {
    id: "tenado-gare",
    nom: "Gare Routiere de Tenado",
    ville: "Tenado",
    region: "Centre-Ouest",
    adresse: "Route de Leo, centre-ville, pres du commissariat, face a la banque BICIA",
    coordonnees: { lat: 12.1833, lng: -2.6500 },
    telephone: "+226 25 44 20 15",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Koudougou", horaires: ["06h30", "08h00", "10h00", "14h00"], duree: "1h", prix: 1000 },
      { ville: "Leo", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 1800 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "3h", prix: 3500 },
      { ville: "Reo", horaires: ["07h00", "10h00", "14h00", "16h00"], duree: "45min", prix: 700 }
    ]
  },
  {
    id: "sapouy-gare",
    nom: "Gare Routiere de Sapouy",
    ville: "Sapouy",
    region: "Centre-Ouest",
    adresse: "Centre-ville, carrefour principal, face a la mairie, pres du CSPS",
    coordonnees: { lat: 11.5667, lng: -1.7667 },
    telephone: "+226 25 47 50 08",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Leo", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 },
      { ville: "Po", horaires: ["07h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Kombissiri", horaires: ["06h30", "09h00", "14h00"], duree: "1h", prix: 1200 }
    ]
  },

  // ========== REGION CENTRE-SUD (Manga) ==========
  {
    id: "manga-gare",
    nom: "Gare Routiere de Manga",
    ville: "Manga",
    region: "Centre-Sud",
    adresse: "Avenue du Nahouri, Secteur 1, centre administratif, face a la prefecture, pres du stade",
    coordonnees: { lat: 11.6667, lng: -1.0667 },
    telephone: "+226 20 77 01 12",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h30 - 18h00",
    services: ["Billetterie", "Toilettes"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "14h00", "16h00"], duree: "2h", prix: 2500 },
      { ville: "Po", horaires: ["06h30", "09h00", "12h00", "15h00"], duree: "1h", prix: 1200 },
      { ville: "Tiebele", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 1800 },
      { ville: "Kombissiri", horaires: ["06h00", "08h00", "10h00", "14h00", "16h00"], duree: "1h", prix: 1000 },
      { ville: "Leo", horaires: ["07h00", "14h00"], duree: "2h", prix: 2500 }
    ]
  },
  {
    id: "po-gare",
    nom: "Gare Routiere de Po",
    ville: "Po",
    region: "Centre-Sud",
    adresse: "Route du Ghana, frontiere, centre-ville, face au poste de douane, pres du marche",
    coordonnees: { lat: 11.1667, lng: -1.1500 },
    telephone: "+226 20 77 20 15",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 18h00",
    services: ["Billetterie", "Douane"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Manga", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "1h", prix: 1200 },
      { ville: "Tiebele", horaires: ["07h00", "10h00", "14h00"], duree: "30min", prix: 500 },
      { ville: "Navrongo (Ghana)", horaires: ["08h00", "12h00", "15h00"], duree: "1h30", prix: 2500 },
      { ville: "Bolgatanga (Ghana)", horaires: ["07h00", "14h00"], duree: "2h", prix: 3500 }
    ]
  },
  {
    id: "kombissiri-gare",
    nom: "Gare Routiere de Kombissiri",
    ville: "Kombissiri",
    region: "Centre-Sud",
    adresse: "Route de Manga, centre-ville, pres du CEG, face au marche central",
    coordonnees: { lat: 12.0667, lng: -1.3333 },
    telephone: "+226 20 77 10 08",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "1h", prix: 1000 },
      { ville: "Manga", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "1h", prix: 1000 },
      { ville: "Po", horaires: ["07h00", "10h00", "14h00"], duree: "2h", prix: 2200 },
      { ville: "Sapouy", horaires: ["07h00", "14h00"], duree: "1h", prix: 1200 }
    ]
  },

  // ========== REGION EST (Fada N'Gourma) ==========
  {
    id: "fada-gare",
    nom: "Gare Routiere de Fada N'Gourma",
    ville: "Fada N'Gourma",
    region: "Est",
    adresse: "Boulevard de l'Est, Secteur 1, face a la grande mosquee, pres du palais royal du Gulmu",
    coordonnees: { lat: 12.0606, lng: 0.3494 },
    telephone: "+226 20 77 00 45",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 19h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes", "Restauration"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "14h00"], duree: "4h", prix: 5000, compagnies: ["STMB"] },
      { ville: "Koupela", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "2h", prix: 2500 },
      { ville: "Diapaga", horaires: ["07h00", "10h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Pama", horaires: ["06h30", "14h00"], duree: "4h", prix: 5000 },
      { ville: "Bogande", horaires: ["07h00", "14h00"], duree: "3h30", prix: 4500 },
      { ville: "Kantchari", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 },
      { ville: "Niamey (Niger)", horaires: ["06h00"], duree: "10h", prix: 15000 }
    ]
  },
  {
    id: "diapaga-gare",
    nom: "Gare Routiere de Diapaga",
    ville: "Diapaga",
    region: "Est",
    adresse: "Route de Fada, centre-ville, pres du parc W, face a la mairie, a 5km de l'entree du parc",
    coordonnees: { lat: 12.0667, lng: 1.7833 },
    telephone: "+226 20 79 80 12",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Fada N'Gourma", horaires: ["06h30", "08h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "7h", prix: 9000 },
      { ville: "Kantchari", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 },
      { ville: "Parc W (Entree)", horaires: ["08h00", "14h00"], duree: "30min", prix: 500 }
    ]
  },
  {
    id: "bogande-gare",
    nom: "Gare Routiere de Bogande",
    ville: "Bogande",
    region: "Est",
    adresse: "Centre-ville, route de Fada, pres de la prefecture, face au marche",
    coordonnees: { lat: 12.9833, lng: -0.1333 },
    telephone: "+226 20 79 70 08",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Fada N'Gourma", horaires: ["06h30", "10h00", "14h00"], duree: "3h30", prix: 4500 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "7h30", prix: 9500 },
      { ville: "Piela", horaires: ["07h00", "10h00", "14h00"], duree: "1h", prix: 1500 },
      { ville: "Manni", horaires: ["07h00", "14h00"], duree: "1h30", prix: 2000 }
    ]
  },
  {
    id: "pama-gare",
    nom: "Gare Routiere de Pama",
    ville: "Pama",
    region: "Est",
    adresse: "Frontiere Benin, route internationale, pres du poste de douane, face au commissariat",
    coordonnees: { lat: 11.2500, lng: 0.7000 },
    telephone: "+226 20 79 60 05",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 18h00",
    services: ["Billetterie", "Douane"],
    destinations: [
      { ville: "Fada N'Gourma", horaires: ["06h30", "10h00", "14h00"], duree: "4h", prix: 5000 },
      { ville: "Tenkodogo", horaires: ["07h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Ouagadougou", horaires: ["06h00"], duree: "8h", prix: 10000 },
      { ville: "Natitingou (Benin)", horaires: ["08h00", "14h00"], duree: "3h", prix: 6000 },
      { ville: "Cotonou (Benin)", horaires: ["06h00"], duree: "12h", prix: 20000 }
    ]
  },

  // ========== REGION NORD (Ouahigouya) ==========
  {
    id: "ouahigouya-gare",
    nom: "Gare Routiere de Ouahigouya",
    ville: "Ouahigouya",
    region: "Nord",
    adresse: "Avenue Yatenga, Secteur 4, pres du palais du Yatenga Naaba, face a la place du cinquantenaire",
    coordonnees: { lat: 13.5826, lng: -2.4192 },
    telephone: "+226 20 55 01 78",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 19h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes", "Restauration"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["05h30", "06h30", "07h30", "08h30", "10h00", "14h00", "16h00"], duree: "3h30", prix: 4000, compagnies: ["STMB", "TSR"] },
      { ville: "Kaya", horaires: ["07h00", "10h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Tougan", horaires: ["06h30", "10h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Djibo", horaires: ["07h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Gourcy", horaires: ["06h00", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "45min", prix: 800 },
      { ville: "Yako", horaires: ["06h30", "08h00", "10h00", "14h00"], duree: "1h15", prix: 1500 },
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "14h00"], duree: "8h", prix: 9000 }
    ]
  },
  {
    id: "gourcy-gare",
    nom: "Gare Routiere de Gourcy",
    ville: "Gourcy",
    region: "Nord",
    adresse: "Route de Ouahigouya, centre-ville, pres de l'hopital de district, face au marche",
    coordonnees: { lat: 13.2000, lng: -2.3500 },
    telephone: "+226 20 55 40 12",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Ouahigouya", horaires: ["06h30", "08h00", "10h00", "12h00", "14h00", "16h00"], duree: "45min", prix: 800 },
      { ville: "Ouagadougou", horaires: ["06h00", "08h00", "14h00"], duree: "4h15", prix: 4800 },
      { ville: "Yako", horaires: ["07h00", "10h00", "14h00"], duree: "30min", prix: 500 },
      { ville: "Titao", horaires: ["07h00", "14h00"], duree: "1h30", prix: 2000 }
    ]
  },
  {
    id: "yako-gare",
    nom: "Gare Routiere de Yako",
    ville: "Yako",
    region: "Nord",
    adresse: "Route Nationale 2, centre administratif, face a la mairie, pres de la station Petrofa",
    coordonnees: { lat: 12.9500, lng: -2.2667 },
    telephone: "+226 20 55 30 08",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "14h00"], duree: "2h15", prix: 2800 },
      { ville: "Ouahigouya", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "1h15", prix: 1500 },
      { ville: "Gourcy", horaires: ["07h00", "10h00", "14h00"], duree: "30min", prix: 500 },
      { ville: "Kongoussi", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 }
    ]
  },
  {
    id: "titao-gare",
    nom: "Gare Routiere de Titao",
    ville: "Titao",
    region: "Nord",
    adresse: "Centre-ville, route de Djibo, face au CEG, pres du CSPS",
    coordonnees: { lat: 13.7667, lng: -2.0667 },
    telephone: "+226 20 55 50 05",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h30 - 16h00",
    destinations: [
      { ville: "Ouahigouya", horaires: ["06h30", "10h00", "14h00"], duree: "1h", prix: 1200 },
      { ville: "Djibo", horaires: ["07h00", "14h00"], duree: "1h30", prix: 2000 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "4h30", prix: 5200 },
      { ville: "Gourcy", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 }
    ]
  },
  {
    id: "seguenega-gare",
    nom: "Gare Routiere de Seguenega",
    ville: "Seguenega",
    region: "Nord",
    adresse: "Centre-ville, marche hebdomadaire, face au dispensaire, pres de l'ecole primaire",
    coordonnees: { lat: 13.4333, lng: -1.9667 },
    telephone: "+226 20 55 20 05",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h30 - 16h00",
    destinations: [
      { ville: "Ouahigouya", horaires: ["07h00", "10h00", "14h00"], duree: "1h", prix: 1000 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "4h", prix: 5000 },
      { ville: "Kaya", horaires: ["07h00"], duree: "2h30", prix: 3000 }
    ]
  },

  // ========== REGION PLATEAU-CENTRAL (Ziniare) ==========
  {
    id: "ziniare-gare",
    nom: "Gare Routiere de Ziniare",
    ville: "Ziniare",
    region: "Plateau-Central",
    adresse: "Route Nationale 3, centre-ville, pres du parc de sculptures de Laongo, face a la mairie",
    coordonnees: { lat: 12.5833, lng: -1.3000 },
    telephone: "+226 25 40 60 12",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h30 - 18h00",
    services: ["Billetterie", "Toilettes"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "09h00", "10h00", "12h00", "14h00", "16h00", "18h00"], duree: "45min", prix: 800 },
      { ville: "Kaya", horaires: ["06h30", "08h00", "10h00", "14h00"], duree: "1h45", prix: 2200 },
      { ville: "Koupela", horaires: ["07h00", "10h00", "14h00"], duree: "1h15", prix: 1500 },
      { ville: "Pouytenga", horaires: ["07h00", "14h00"], duree: "1h30", prix: 1800 },
      { ville: "Laongo (Sculptures)", horaires: ["08h00", "10h00", "14h00", "16h00"], duree: "15min", prix: 300 }
    ]
  },
  {
    id: "bousse-gare",
    nom: "Gare Routiere de Bousse",
    ville: "Bousse",
    region: "Plateau-Central",
    adresse: "Centre-ville, route de Yako, pres du commissariat, face au marche",
    coordonnees: { lat: 12.6667, lng: -1.9000 },
    telephone: "+226 25 40 50 08",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Ouagadougou", horaires: ["06h00", "07h00", "08h00", "10h00", "14h00"], duree: "1h30", prix: 1800 },
      { ville: "Yako", horaires: ["06h30", "08h00", "10h00", "14h00", "16h00"], duree: "45min", prix: 800 },
      { ville: "Kongoussi", horaires: ["07h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Ouahigouya", horaires: ["06h00", "14h00"], duree: "2h30", prix: 3200 }
    ]
  },

  // ========== REGION SAHEL (Dori) ==========
  {
    id: "dori-gare",
    nom: "Gare Routiere de Dori",
    ville: "Dori",
    region: "Sahel",
    adresse: "Avenue du Sahel, centre-ville, face au marche aux bestiaux, pres de la grande mosquee",
    coordonnees: { lat: 14.0354, lng: -0.0347 },
    telephone: "+226 20 46 01 23",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h00 - 18h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["05h00", "06h00", "07h00", "14h00"], duree: "5h30", prix: 7000 },
      { ville: "Kaya", horaires: ["06h00", "10h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Djibo", horaires: ["07h00", "10h00", "14h00"], duree: "2h30", prix: 3500 },
      { ville: "Gorom-Gorom", horaires: ["07h00", "14h00"], duree: "1h30", prix: 2500 },
      { ville: "Sebba", horaires: ["07h00", "14h00"], duree: "2h", prix: 3000 },
      { ville: "Niamey (Niger)", horaires: ["06h00"], duree: "8h", prix: 12000 }
    ]
  },
  {
    id: "djibo-gare",
    nom: "Gare Routiere de Djibo",
    ville: "Djibo",
    region: "Sahel",
    adresse: "Centre-ville, route de Ouagadougou, face a la prefecture, pres du stade municipal",
    coordonnees: { lat: 14.1000, lng: -1.6333 },
    telephone: "+226 20 46 20 08",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Ouagadougou", horaires: ["05h30", "06h30", "14h00"], duree: "5h", prix: 6500 },
      { ville: "Kaya", horaires: ["06h30", "10h00", "14h00"], duree: "3h30", prix: 4500 },
      { ville: "Ouahigouya", horaires: ["07h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Kongoussi", horaires: ["07h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Titao", horaires: ["07h00", "10h00", "14h00"], duree: "1h30", prix: 2000 }
    ]
  },
  {
    id: "gorom-gorom-gare",
    nom: "Gare Routiere de Gorom-Gorom",
    ville: "Gorom-Gorom",
    region: "Sahel",
    adresse: "Centre-ville, marche aux chameaux (jeudi), pres de la mosquee centrale",
    coordonnees: { lat: 14.4500, lng: -0.2333 },
    telephone: "+226 20 46 30 05",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 16h00",
    destinations: [
      { ville: "Dori", horaires: ["06h30", "10h00", "14h00"], duree: "1h30", prix: 2500 },
      { ville: "Ouagadougou", horaires: ["05h00", "14h00"], duree: "7h", prix: 9500 },
      { ville: "Markoye", horaires: ["07h00", "14h00"], duree: "2h", prix: 3000 }
    ]
  },
  {
    id: "sebba-gare",
    nom: "Gare Routiere de Sebba",
    ville: "Sebba",
    region: "Sahel",
    adresse: "Centre-ville, route du Niger, pres du poste de douane, face au marche",
    coordonnees: { lat: 13.4333, lng: 0.5167 },
    telephone: "+226 20 46 40 05",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    services: ["Billetterie", "Douane"],
    destinations: [
      { ville: "Dori", horaires: ["06h30", "10h00", "14h00"], duree: "2h", prix: 3000 },
      { ville: "Ouagadougou", horaires: ["05h00", "14h00"], duree: "7h30", prix: 10000 },
      { ville: "Fada N'Gourma", horaires: ["07h00"], duree: "5h", prix: 6500 },
      { ville: "Tera (Niger)", horaires: ["08h00", "14h00"], duree: "2h", prix: 4000 }
    ]
  },

  // ========== REGION SUD-OUEST (Gaoua) ==========
  {
    id: "gaoua-gare",
    nom: "Gare Routiere de Gaoua",
    ville: "Gaoua",
    region: "Sud-Ouest",
    adresse: "Avenue du Poni, Secteur 1, pres des ruines de Loropeni (25km), face a la prefecture",
    coordonnees: { lat: 10.3250, lng: -3.1750 },
    telephone: "+226 20 87 01 34",
    compagnie: "Publique",
    type: "principale",
    heuresOuverture: "05h30 - 18h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "07h00", "14h00"], duree: "4h", prix: 5000 },
      { ville: "Banfora", horaires: ["06h30", "10h00", "14h00"], duree: "3h", prix: 4000 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "9h", prix: 11000 },
      { ville: "Diebougou", horaires: ["07h00", "10h00", "14h00", "16h00"], duree: "1h30", prix: 2000 },
      { ville: "Batie", horaires: ["07h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Loropeni (Ruines)", horaires: ["08h00", "14h00"], duree: "30min", prix: 800 },
      { ville: "Wa (Ghana)", horaires: ["07h00"], duree: "4h", prix: 8000 }
    ]
  },
  {
    id: "batié-gare",
    nom: "Gare Routiere de Batie",
    ville: "Batie",
    region: "Sud-Ouest",
    adresse: "Centre-ville, route du Ghana, pres du poste de douane, face au marche",
    coordonnees: { lat: 9.8833, lng: -2.9167 },
    telephone: "+226 20 87 20 08",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    services: ["Billetterie", "Douane"],
    destinations: [
      { ville: "Gaoua", horaires: ["06h30", "10h00", "14h00"], duree: "2h", prix: 2500 },
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "14h00"], duree: "6h", prix: 7500 },
      { ville: "Ouagadougou", horaires: ["06h00"], duree: "11h", prix: 13500 },
      { ville: "Hamile (Ghana)", horaires: ["08h00", "12h00", "15h00"], duree: "30min", prix: 1000 },
      { ville: "Wa (Ghana)", horaires: ["08h00"], duree: "2h", prix: 4000 }
    ]
  },
  {
    id: "diebougou-gare",
    nom: "Gare Routiere de Diebougou",
    ville: "Diebougou",
    region: "Sud-Ouest",
    adresse: "Route de Bobo, centre-ville, pres de la cathedrale, face au lycee departementale",
    coordonnees: { lat: 10.9667, lng: -3.2500 },
    telephone: "+226 20 87 10 12",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Gaoua", horaires: ["06h30", "09h00", "12h00", "15h00"], duree: "1h30", prix: 2000 },
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "08h00", "14h00"], duree: "2h30", prix: 3000 },
      { ville: "Ouagadougou", horaires: ["06h00", "14h00"], duree: "7h30", prix: 9000 },
      { ville: "Dano", horaires: ["07h00", "10h00", "14h00"], duree: "45min", prix: 800 }
    ]
  },
  {
    id: "dano-gare",
    nom: "Gare Routiere de Dano",
    ville: "Dano",
    region: "Sud-Ouest",
    adresse: "Centre-ville, marche central, face a l'eglise, pres du CSPS",
    coordonnees: { lat: 11.1500, lng: -3.0667 },
    telephone: "+226 20 87 30 05",
    compagnie: "Publique",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    destinations: [
      { ville: "Diebougou", horaires: ["06h30", "09h00", "12h00", "15h00"], duree: "45min", prix: 800 },
      { ville: "Bobo-Dioulasso", horaires: ["06h00", "14h00"], duree: "3h15", prix: 3800 },
      { ville: "Gaoua", horaires: ["07h00", "14h00"], duree: "2h15", prix: 2800 },
      { ville: "Ouagadougou", horaires: ["06h00"], duree: "8h15", prix: 9800 }
    ]
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
  },

  // ========== GARES FERROVIAIRES SITARAIL ==========
  {
    id: "sitarail-ouaga",
    nom: "Gare Ferroviaire SITARAIL Ouagadougou",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Place de la Gare, Centre-ville, Secteur 4, a cote du Conseil de l'Entente",
    coordonnees: { lat: 12.37362, lng: -1.52657 },
    telephone: "+226 25 31 07 39",
    compagnie: "sitarail",
    type: "principale",
    heuresOuverture: "06h00 - 18h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes", "Consigne bagages", "Parking"],
    destinations: [
      { ville: "Koudougou", horaires: ["09h00 (Mardi)", "09h00 (Jeudi)"], duree: "2h30", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Siby", horaires: ["09h00 (Mardi)", "09h00 (Jeudi)"], duree: "4h", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Bobo-Dioulasso", horaires: ["09h00 (Mardi)", "09h00 (Jeudi)"], duree: "7h", prix: 6000, compagnies: ["SITARAIL"] },
      { ville: "Banfora", horaires: ["09h00 (Mardi)"], duree: "9h", prix: 6000, compagnies: ["SITARAIL"] },
      { ville: "Niangoloko", horaires: ["09h00 (Mardi)"], duree: "10h", prix: 6000, compagnies: ["SITARAIL"] }
    ]
  },
  {
    id: "sitarail-koudougou",
    nom: "Gare Ferroviaire SITARAIL Koudougou",
    ville: "Koudougou",
    region: "Centre-Ouest",
    adresse: "Route de Ouagadougou, Centre-ville, pres du marche central",
    coordonnees: { lat: 12.2520, lng: -2.3610 },
    telephone: "+226 25 44 07 65",
    compagnie: "sitarail",
    type: "principale",
    heuresOuverture: "06h00 - 17h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["11h30 (Jeudi) - arret retour"], duree: "2h30", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Bobo-Dioulasso", horaires: ["11h30 (Mardi, Jeudi) - transit"], duree: "4h30", prix: 3000, compagnies: ["SITARAIL"] }
    ]
  },
  {
    id: "sitarail-siby",
    nom: "Gare Ferroviaire SITARAIL Siby",
    ville: "Siby",
    region: "Hauts-Bassins",
    adresse: "Centre-ville de Siby, le long de la voie ferree",
    coordonnees: { lat: 11.5500, lng: -3.5333 },
    telephone: "+226 20 53 00 12",
    compagnie: "sitarail",
    type: "secondaire",
    heuresOuverture: "07h00 - 16h00",
    services: ["Billetterie", "Abri"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["13h00 (Jeudi) - arret retour"], duree: "4h", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Bobo-Dioulasso", horaires: ["13h00 (Mardi, Jeudi) - transit"], duree: "3h", prix: 3000, compagnies: ["SITARAIL"] }
    ]
  },
  {
    id: "sitarail-bobo",
    nom: "Gare Ferroviaire SITARAIL Bobo-Dioulasso",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Place de la Gare, Avenue de la Liberte, Secteur 1, BP 5699, pres du centre-ville historique",
    coordonnees: { lat: 11.1785, lng: -4.2920 },
    telephone: "+226 20 98 15 47",
    compagnie: "sitarail",
    type: "principale",
    heuresOuverture: "06h00 - 18h00",
    services: ["Billetterie", "Salle d'attente climatisee", "Toilettes", "Restauration", "Consigne bagages", "Parking"],
    destinations: [
      { ville: "Ouagadougou", horaires: ["09h00 (Jeudi)"], duree: "7h", prix: 6000, compagnies: ["SITARAIL"] },
      { ville: "Koudougou", horaires: ["09h00 (Jeudi) - transit"], duree: "4h30", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Banfora", horaires: ["09h00 (Mardi) - transit depuis Ouaga"], duree: "2h", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Niangoloko", horaires: ["09h00 (Mardi) - transit depuis Ouaga"], duree: "3h30", prix: 3000, compagnies: ["SITARAIL"] }
    ]
  },
  {
    id: "sitarail-banfora",
    nom: "Gare Ferroviaire SITARAIL Banfora",
    ville: "Banfora",
    region: "Cascades",
    adresse: "Route de la Gare, Centre-ville, pres des Cascades de Karfiguela",
    coordonnees: { lat: 10.6310, lng: -4.7650 },
    telephone: "+226 20 91 02 34",
    compagnie: "sitarail",
    type: "secondaire",
    heuresOuverture: "06h00 - 17h00",
    services: ["Billetterie", "Salle d'attente", "Toilettes"],
    destinations: [
      { ville: "Bobo-Dioulasso", horaires: ["Transit vers Ouaga (Mardi retour)"], duree: "2h", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Niangoloko", horaires: ["Transit depuis Ouaga (Mardi)"], duree: "1h30", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Ouagadougou", horaires: ["Transit retour (Mercredi matin)"], duree: "9h", prix: 6000, compagnies: ["SITARAIL"] }
    ]
  },
  {
    id: "sitarail-niangoloko",
    nom: "Gare Ferroviaire SITARAIL Niangoloko",
    ville: "Niangoloko",
    region: "Cascades",
    adresse: "Frontiere Burkina-Cote d'Ivoire, Centre-ville de Niangoloko, poste frontiere",
    coordonnees: { lat: 9.9667, lng: -4.9167 },
    telephone: "+226 20 91 05 00",
    compagnie: "sitarail",
    type: "principale",
    heuresOuverture: "06h00 - 18h00",
    services: ["Billetterie", "Douane", "Police des frontieres", "Toilettes", "Change"],
    destinations: [
      { ville: "Banfora", horaires: ["Retour vers Ouaga (Mercredi matin)"], duree: "1h30", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Bobo-Dioulasso", horaires: ["Retour vers Ouaga (Mercredi matin)"], duree: "3h30", prix: 3000, compagnies: ["SITARAIL"] },
      { ville: "Ouagadougou", horaires: ["Retour vers Ouaga (Mercredi matin)"], duree: "10h", prix: 6000, compagnies: ["SITARAIL"] }
    ]
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
  },
  // ========== TRAJETS FERROVIAIRES SITARAIL ==========
  {
    id: "sitarail-ouaga-bobo",
    compagnieId: "sitarail",
    depart: "Ouagadougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["09:00"],
    duree: "7h",
    prix: 6000,
    frequence: "2 fois/semaine",
    jours: ["Mardi", "Jeudi"]
  },
  {
    id: "sitarail-bobo-ouaga",
    compagnieId: "sitarail",
    depart: "Bobo-Dioulasso",
    arrivee: "Ouagadougou",
    horaires: ["09:00"],
    duree: "7h",
    prix: 6000,
    frequence: "1 fois/semaine",
    jours: ["Jeudi"]
  },
  {
    id: "sitarail-ouaga-niangoloko",
    compagnieId: "sitarail",
    depart: "Ouagadougou",
    arrivee: "Niangoloko",
    horaires: ["09:00"],
    duree: "10h",
    prix: 6000,
    frequence: "1 fois/semaine",
    jours: ["Mardi"]
  },
  {
    id: "sitarail-ouaga-koudougou",
    compagnieId: "sitarail",
    depart: "Ouagadougou",
    arrivee: "Koudougou",
    horaires: ["09:00"],
    duree: "2h30",
    prix: 3000,
    frequence: "2 fois/semaine",
    jours: ["Mardi", "Jeudi"]
  },
  {
    id: "sitarail-ouaga-banfora",
    compagnieId: "sitarail",
    depart: "Ouagadougou",
    arrivee: "Banfora",
    horaires: ["09:00"],
    duree: "9h",
    prix: 6000,
    frequence: "1 fois/semaine",
    jours: ["Mardi"]
  },
  // ========== TRAJETS DEPUIS BOBO-DIOULASSO ==========
  {
    id: "rahimo-bobo-ouaga",
    compagnieId: "rahimo",
    depart: "Bobo-Dioulasso",
    arrivee: "Ouagadougou",
    horaires: ["06:00", "08:00", "10:00", "14:00", "18:00", "22:00"],
    duree: "5h - 5h30",
    prix: 7500,
    prixVIP: 9000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-bobo-ouaga",
    compagnieId: "tcv",
    depart: "Bobo-Dioulasso",
    arrivee: "Ouagadougou",
    horaires: ["06:00", "08:00", "12:00", "16:00", "20:00"],
    duree: "5h - 5h30",
    prix: 6500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-bobo-ouaga",
    compagnieId: "stmb",
    depart: "Bobo-Dioulasso",
    arrivee: "Ouagadougou",
    horaires: ["05:30", "08:00", "12:00", "16:00"],
    duree: "5h30",
    prix: 6000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "rakieta-bobo-ouaga",
    compagnieId: "rakieta",
    depart: "Bobo-Dioulasso",
    arrivee: "Ouagadougou",
    horaires: ["06:00", "10:00", "14:00"],
    duree: "5h30",
    prix: 6500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-bobo-abidjan",
    compagnieId: "tcv",
    depart: "Bobo-Dioulasso",
    arrivee: "Abidjan",
    horaires: ["07:00", "18:00"],
    duree: "12h",
    prix: 18000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS KOUDOUGOU ==========
  {
    id: "stmb-koudougou-ouaga",
    compagnieId: "stmb",
    depart: "Koudougou",
    arrivee: "Ouagadougou",
    horaires: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00"],
    duree: "2h",
    prix: 2500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "staf-koudougou-ouaga",
    compagnieId: "staf",
    depart: "Koudougou",
    arrivee: "Ouagadougou",
    horaires: ["06:30", "09:00", "12:00", "15:00", "18:00"],
    duree: "2h",
    prix: 2000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-koudougou-bobo",
    compagnieId: "stmb",
    depart: "Koudougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["07:00", "11:00", "15:00"],
    duree: "3h30",
    prix: 4000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "sitarail-koudougou-ouaga",
    compagnieId: "sitarail",
    depart: "Koudougou",
    arrivee: "Ouagadougou",
    horaires: ["11:30"],
    duree: "2h30",
    prix: 3000,
    frequence: "2 fois/semaine",
    jours: ["Mardi", "Jeudi"]
  },
  {
    id: "sitarail-koudougou-bobo",
    compagnieId: "sitarail",
    depart: "Koudougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["11:30"],
    duree: "4h30",
    prix: 4000,
    frequence: "2 fois/semaine",
    jours: ["Mardi", "Jeudi"]
  },
  // ========== TRAJETS DEPUIS OUAHIGOUYA ==========
  {
    id: "stmb-ouahigouya-ouaga",
    compagnieId: "stmb",
    depart: "Ouahigouya",
    arrivee: "Ouagadougou",
    horaires: ["05:30", "08:00", "11:00", "14:00"],
    duree: "3h",
    prix: 4000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tsr-ouahigouya-ouaga",
    compagnieId: "tsr",
    depart: "Ouahigouya",
    arrivee: "Ouagadougou",
    horaires: ["06:00", "10:00", "14:00"],
    duree: "3h",
    prix: 3500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-ouahigouya-djibo",
    compagnieId: "stmb",
    depart: "Ouahigouya",
    arrivee: "Djibo",
    horaires: ["07:00", "13:00"],
    duree: "2h30",
    prix: 3000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS BANFORA ==========
  {
    id: "rakieta-banfora-ouaga",
    compagnieId: "rakieta",
    depart: "Banfora",
    arrivee: "Ouagadougou",
    horaires: ["05:30", "08:00", "12:00"],
    duree: "7h",
    prix: 8500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "rakieta-banfora-bobo",
    compagnieId: "rakieta",
    depart: "Banfora",
    arrivee: "Bobo-Dioulasso",
    horaires: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00"],
    duree: "1h30",
    prix: 1500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-banfora-abidjan",
    compagnieId: "tcv",
    depart: "Banfora",
    arrivee: "Abidjan",
    horaires: ["06:00", "14:00"],
    duree: "10h",
    prix: 15000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "sitarail-banfora-ouaga",
    compagnieId: "sitarail",
    depart: "Banfora",
    arrivee: "Ouagadougou",
    horaires: ["07:00"],
    duree: "9h",
    prix: 6000,
    frequence: "1 fois/semaine",
    jours: ["Mercredi"]
  },
  // ========== TRAJETS DEPUIS FADA N'GOURMA ==========
  {
    id: "stmb-fada-ouaga",
    compagnieId: "stmb",
    depart: "Fada N'Gourma",
    arrivee: "Ouagadougou",
    horaires: ["05:30", "08:00", "12:00", "15:00"],
    duree: "3h30",
    prix: 4500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-fada-diapaga",
    compagnieId: "stmb",
    depart: "Fada N'Gourma",
    arrivee: "Diapaga",
    horaires: ["07:00", "12:00"],
    duree: "2h",
    prix: 2500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-fada-niamey",
    compagnieId: "stmb",
    depart: "Fada N'Gourma",
    arrivee: "Niamey",
    horaires: ["06:00"],
    duree: "6h",
    prix: 10000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS KAYA ==========
  {
    id: "stmb-kaya-ouaga",
    compagnieId: "stmb",
    depart: "Kaya",
    arrivee: "Ouagadougou",
    horaires: ["05:30", "08:00", "11:00", "14:00", "16:00"],
    duree: "2h",
    prix: 2500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-kaya-dori",
    compagnieId: "stmb",
    depart: "Kaya",
    arrivee: "Dori",
    horaires: ["06:00", "12:00"],
    duree: "3h30",
    prix: 4000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS TENKODOGO ==========
  {
    id: "stmb-tenkodogo-ouaga",
    compagnieId: "stmb",
    depart: "Tenkodogo",
    arrivee: "Ouagadougou",
    horaires: ["05:30", "08:00", "11:00", "14:00"],
    duree: "2h30",
    prix: 3000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-tenkodogo-fada",
    compagnieId: "stmb",
    depart: "Tenkodogo",
    arrivee: "Fada N'Gourma",
    horaires: ["07:00", "13:00"],
    duree: "2h",
    prix: 2500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-tenkodogo-lome",
    compagnieId: "tcv",
    depart: "Tenkodogo",
    arrivee: "Lome",
    horaires: ["06:00"],
    duree: "14h",
    prix: 20000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS DORI ==========
  {
    id: "stmb-dori-ouaga",
    compagnieId: "stmb",
    depart: "Dori",
    arrivee: "Ouagadougou",
    horaires: ["05:00", "08:00"],
    duree: "5h",
    prix: 5500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-dori-kaya",
    compagnieId: "stmb",
    depart: "Dori",
    arrivee: "Kaya",
    horaires: ["06:00", "12:00"],
    duree: "3h30",
    prix: 4000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS DEDOUGOU ==========
  {
    id: "stmb-dedougou-ouaga",
    compagnieId: "stmb",
    depart: "Dedougou",
    arrivee: "Ouagadougou",
    horaires: ["05:30", "08:00", "12:00"],
    duree: "4h",
    prix: 4500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "stmb-dedougou-bobo",
    compagnieId: "stmb",
    depart: "Dedougou",
    arrivee: "Bobo-Dioulasso",
    horaires: ["06:00", "10:00", "14:00"],
    duree: "2h30",
    prix: 3000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS GAOUA ==========
  {
    id: "rakieta-gaoua-bobo",
    compagnieId: "rakieta",
    depart: "Gaoua",
    arrivee: "Bobo-Dioulasso",
    horaires: ["06:00", "12:00"],
    duree: "4h",
    prix: 4500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "rakieta-gaoua-ouaga",
    compagnieId: "rakieta",
    depart: "Gaoua",
    arrivee: "Ouagadougou",
    horaires: ["05:00", "10:00"],
    duree: "8h",
    prix: 9000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS ORODARA ==========
  {
    id: "tcv-orodara-bobo",
    compagnieId: "tcv",
    depart: "Orodara",
    arrivee: "Bobo-Dioulasso",
    horaires: ["06:30", "09:00", "12:00", "15:00", "18:00"],
    duree: "1h30",
    prix: 1000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-orodara-ouaga",
    compagnieId: "tcv",
    depart: "Orodara",
    arrivee: "Ouagadougou",
    horaires: ["06:00", "14:00"],
    duree: "6h30",
    prix: 7000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS ZINIARÉ ==========
  {
    id: "sotraco-ziniare-ouaga",
    compagnieId: "sotraco",
    depart: "Ziniaré",
    arrivee: "Ouagadougou",
    horaires: ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00"],
    duree: "45min",
    prix: 500,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS PO ==========
  {
    id: "stmb-po-ouaga",
    compagnieId: "stmb",
    depart: "Pô",
    arrivee: "Ouagadougou",
    horaires: ["06:00", "10:00", "14:00"],
    duree: "2h30",
    prix: 3000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  {
    id: "tcv-po-accra",
    compagnieId: "tcv",
    depart: "Pô",
    arrivee: "Accra",
    horaires: ["06:00"],
    duree: "8h",
    prix: 15000,
    frequence: "Quotidien",
    jours: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  },
  // ========== TRAJETS DEPUIS LEO ==========
  {
    id: "stmb-leo-ouaga",
    compagnieId: "stmb",
    depart: "Léo",
    arrivee: "Ouagadougou",
    horaires: ["06:00", "12:00"],
    duree: "3h",
    prix: 3500,
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
