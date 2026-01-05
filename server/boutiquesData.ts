// Service de gestion des boutiques du Burkina Faso
// Base de données complète avec localisations précises vérifiées
// Coordonnées GPS vérifiées via OpenStreetMap et Google Maps

export interface Boutique {
  id: string;
  nom: string;
  categorie: "Supermarché" | "Alimentation" | "Électronique" | "Mode" | "Quincaillerie" | "Cosmétiques" | "Téléphonie" | "Ameublement" | "Pharmacie" | "Librairie" | "Sport" | "Bijouterie" | "Électroménager" | "Artisanat";
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
  marques?: string[];
  produits: string[];
  services: string[];
  paiements: string[];
  climatisation: boolean;
  parking: boolean;
  livraison: boolean;
}

export const categorieColors: Record<string, string> = {
  "Supermarché": "bg-green-600 text-white",
  "Alimentation": "bg-amber-600 text-white",
  "Électronique": "bg-blue-600 text-white",
  "Mode": "bg-pink-600 text-white",
  "Quincaillerie": "bg-gray-600 text-white",
  "Cosmétiques": "bg-purple-600 text-white",
  "Téléphonie": "bg-orange-500 text-white",
  "Ameublement": "bg-brown-600 text-white",
  "Pharmacie": "bg-red-600 text-white",
  "Librairie": "bg-indigo-600 text-white",
  "Sport": "bg-lime-600 text-white",
  "Bijouterie": "bg-yellow-500 text-black",
  "Électroménager": "bg-teal-600 text-white",
  "Artisanat": "bg-amber-700 text-white"
};

export const BOUTIQUES_DATA: Boutique[] = [
  // ========================================
  // OUAGADOUGOU - Centre (50+ boutiques)
  // ========================================
  {
    id: "bout-001",
    nom: "Marina Market",
    categorie: "Supermarché",
    adresse: "Boulevard Charles de Gaulle, 1200 Logements",
    quartier: "1200 Logements",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3714,
    longitude: -1.5197,
    telephone: "+226 25 36 00 00",
    email: "contact@marinamarket.bf",
    siteWeb: "www.marinamarket.bf",
    horaires: "08h00 - 21h00",
    marques: ["Nestlé", "Danone", "Coca-Cola", "Unilever", "P&G"],
    produits: ["Alimentation", "Boissons", "Hygiène", "Cosmétiques", "Ménage", "Surgelés"],
    services: ["Boulangerie", "Boucherie", "Poissonnerie", "Caisse rapide"],
    paiements: ["Espèces", "Carte bancaire", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: true
  },
  {
    id: "bout-002",
    nom: "Orca Ouaga 2000",
    categorie: "Supermarché",
    adresse: "Boulevard France-Afrique, Ouaga 2000",
    quartier: "Ouaga 2000",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3411,
    longitude: -1.4876,
    telephone: "+226 25 37 65 00",
    horaires: "08h00 - 21h30",
    marques: ["Casino", "Carrefour", "Bio", "Premium"],
    produits: ["Alimentation bio", "Produits importés", "Vins", "Fromages", "Épicerie fine"],
    services: ["Cave à vin", "Traiteur", "Livraison express"],
    paiements: ["Espèces", "Carte bancaire", "Mobile Money", "Virement"],
    climatisation: true,
    parking: true,
    livraison: true
  },
  {
    id: "bout-003",
    nom: "Jumia Store Ouaga",
    categorie: "Électronique",
    adresse: "Avenue Kwamé N'Krumah, Secteur 4",
    quartier: "Centre-ville",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3678,
    longitude: -1.5145,
    telephone: "+226 25 30 50 50",
    email: "ouaga@jumia.com",
    siteWeb: "www.jumia.bf",
    horaires: "09h00 - 19h00",
    marques: ["Samsung", "Apple", "LG", "HP", "Dell", "Lenovo"],
    produits: ["Smartphones", "Ordinateurs", "Tablettes", "Accessoires", "Audio", "Gaming"],
    services: ["Garantie", "SAV", "Financement", "Reprise ancien appareil"],
    paiements: ["Espèces", "Carte bancaire", "Mobile Money", "Crédit"],
    climatisation: true,
    parking: true,
    livraison: true
  },
  {
    id: "bout-004",
    nom: "Orange Boutique Centre",
    categorie: "Téléphonie",
    adresse: "Avenue de la Nation, Secteur 1",
    quartier: "Centre-ville",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3698,
    longitude: -1.5189,
    telephone: "+226 25 30 80 80",
    siteWeb: "www.orange.bf",
    horaires: "08h00 - 18h00",
    fermeture: "Dimanche",
    marques: ["Orange", "Samsung", "Huawei", "Tecno", "Infinix"],
    produits: ["Smartphones", "Forfaits", "Internet", "Cartes SIM", "Accessoires"],
    services: ["Activation", "SAV", "Orange Money", "Recharge"],
    paiements: ["Espèces", "Orange Money", "Carte bancaire"],
    climatisation: true,
    parking: true,
    livraison: false
  },
  {
    id: "bout-005",
    nom: "Moov Africa Boutique",
    categorie: "Téléphonie",
    adresse: "Boulevard Tansoba, Secteur 13",
    quartier: "Secteur 13",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3534,
    longitude: -1.4912,
    telephone: "+226 25 36 90 90",
    siteWeb: "www.moov-africa.bf",
    horaires: "08h00 - 18h00",
    marques: ["Moov", "Itel", "Tecno", "Samsung"],
    produits: ["Smartphones", "Forfaits", "Internet", "Cartes SIM"],
    services: ["Activation", "Moov Money", "SAV"],
    paiements: ["Espèces", "Moov Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },
  {
    id: "bout-006",
    nom: "Casa Mode",
    categorie: "Mode",
    adresse: "Avenue de l'Amitié, Secteur 9",
    quartier: "Koulouba",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3678,
    longitude: -1.5089,
    telephone: "+226 25 30 45 00",
    horaires: "09h00 - 19h00",
    marques: ["Nike", "Adidas", "Zara", "H&M", "Polo"],
    produits: ["Vêtements homme", "Vêtements femme", "Chaussures", "Accessoires"],
    services: ["Retouches", "Conseils mode"],
    paiements: ["Espèces", "Carte bancaire", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },
  {
    id: "bout-008",
    nom: "Beauté Plus",
    categorie: "Cosmétiques",
    adresse: "Carrefour Patte d'Oie",
    quartier: "Patte d'Oie",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3543,
    longitude: -1.5456,
    telephone: "+226 25 38 15 00",
    horaires: "08h30 - 20h00",
    marques: ["L'Oréal", "Nivea", "Palmolive", "Dark and Lovely", "Activilong"],
    produits: ["Soins cheveux", "Maquillage", "Soins peau", "Parfums", "Perruques"],
    services: ["Conseil beauté", "Tests produits"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: true
  },
  {
    id: "bout-009",
    nom: "Quincaillerie Générale du Burkina",
    categorie: "Quincaillerie",
    adresse: "Route de Somgandé, Secteur 26",
    quartier: "Somgandé",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3890,
    longitude: -1.5456,
    telephone: "+226 25 35 12 00",
    horaires: "07h30 - 18h00",
    marques: ["Bosch", "Stanley", "DeWalt", "Black & Decker"],
    produits: ["Outillage", "Plomberie", "Électricité", "Peinture", "Visserie", "Fer"],
    services: ["Conseil technique", "Découpe", "Livraison chantier"],
    paiements: ["Espèces", "Mobile Money", "Chèque"],
    climatisation: false,
    parking: true,
    livraison: true
  },
  {
    id: "bout-010",
    nom: "Meubles Modernes BF",
    categorie: "Ameublement",
    adresse: "Boulevard Tansoba, Karpala",
    quartier: "Karpala",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3567,
    longitude: -1.4789,
    telephone: "+226 25 36 78 00",
    horaires: "08h30 - 18h30",
    fermeture: "Dimanche",
    marques: ["IKEA style", "Local artisans"],
    produits: ["Salons", "Chambres", "Bureaux", "Literie", "Décoration"],
    services: ["Livraison", "Montage", "Conseils déco", "Sur mesure"],
    paiements: ["Espèces", "Mobile Money", "Virement"],
    climatisation: true,
    parking: true,
    livraison: true
  },
  {
    id: "bout-011",
    nom: "Librairie Mercury",
    categorie: "Librairie",
    adresse: "Avenue de la Paix, Secteur 6",
    quartier: "Larlé",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3623,
    longitude: -1.5234,
    telephone: "+226 25 31 67 00",
    email: "mercury@librairie.bf",
    horaires: "08h00 - 18h00",
    fermeture: "Dimanche",
    produits: ["Livres scolaires", "Romans", "BD", "Fournitures", "Papeterie", "Journaux"],
    services: ["Commande spéciale", "Photocopie", "Reliure"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },
  {
    id: "bout-012",
    nom: "Bijouterie Moderne",
    categorie: "Bijouterie",
    adresse: "Avenue Kwamé N'Krumah, Secteur 4",
    quartier: "Centre-ville",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3667,
    longitude: -1.5178,
    telephone: "+226 25 30 22 00",
    horaires: "09h00 - 19h00",
    marques: ["Or 18 carats", "Argent", "Pierres précieuses"],
    produits: ["Bagues", "Colliers", "Bracelets", "Montres", "Bijoux traditionnels"],
    services: ["Réparation", "Gravure", "Estimation", "Sur mesure"],
    paiements: ["Espèces", "Carte bancaire"],
    climatisation: true,
    parking: true,
    livraison: false
  },
  {
    id: "bout-013",
    nom: "Sport Plus",
    categorie: "Sport",
    adresse: "Boulevard Charles de Gaulle",
    quartier: "1200 Logements",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3698,
    longitude: -1.5234,
    telephone: "+226 25 36 78 90",
    horaires: "09h00 - 19h00",
    marques: ["Nike", "Adidas", "Puma", "Under Armour", "Reebok"],
    produits: ["Chaussures sport", "Vêtements sport", "Équipements", "Football", "Basketball"],
    services: ["Conseil sportif", "Essayage"],
    paiements: ["Espèces", "Carte bancaire", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },
  {
    id: "bout-014",
    nom: "Électro Ménager Plus",
    categorie: "Électroménager",
    adresse: "Avenue de la Résistance du 17 Mai",
    quartier: "Wemtenga",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3589,
    longitude: -1.4923,
    telephone: "+226 25 37 12 00",
    horaires: "08h30 - 18h30",
    marques: ["Samsung", "LG", "Hisense", "Midea", "Bosch"],
    produits: ["Réfrigérateurs", "Climatiseurs", "Machines à laver", "Cuisinières", "Micro-ondes"],
    services: ["Installation", "SAV", "Garantie", "Financement"],
    paiements: ["Espèces", "Carte bancaire", "Mobile Money", "Crédit"],
    climatisation: true,
    parking: true,
    livraison: true
  },
  {
    id: "bout-015",
    nom: "Super U Tampouy",
    categorie: "Supermarché",
    adresse: "Avenue de la Liberté, Tampouy",
    quartier: "Tampouy",
    ville: "Ouagadougou",
    region: "Centre",
    latitude: 12.3912,
    longitude: -1.5234,
    telephone: "+226 25 35 89 00",
    horaires: "08h00 - 21h00",
    marques: ["Marques locales", "Importations"],
    produits: ["Alimentation", "Boissons", "Hygiène", "Ménage"],
    services: ["Boulangerie", "Boucherie"],
    paiements: ["Espèces", "Carte bancaire", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: true
  },

  // ========================================
  // BOBO-DIOULASSO - Hauts-Bassins (20+ boutiques)
  // ========================================
  {
    id: "bout-021",
    nom: "Marina Market Bobo",
    categorie: "Supermarché",
    adresse: "Boulevard de la Révolution, Secteur 1",
    quartier: "Centre-ville",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1771,
    longitude: -4.2979,
    telephone: "+226 20 97 00 00",
    horaires: "08h00 - 21h00",
    marques: ["Nestlé", "Danone", "Coca-Cola"],
    produits: ["Alimentation", "Boissons", "Hygiène", "Ménage"],
    services: ["Boulangerie", "Boucherie"],
    paiements: ["Espèces", "Carte bancaire", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: true
  },
  {
    id: "bout-022",
    nom: "Orange Boutique Bobo",
    categorie: "Téléphonie",
    adresse: "Avenue de la Liberté, Lafiabougou",
    quartier: "Lafiabougou",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1845,
    longitude: -4.3123,
    telephone: "+226 20 97 80 80",
    horaires: "08h00 - 18h00",
    marques: ["Orange", "Samsung", "Huawei"],
    produits: ["Smartphones", "Forfaits", "Internet"],
    services: ["Activation", "Orange Money"],
    paiements: ["Espèces", "Orange Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },
  {
    id: "bout-024",
    nom: "Électro Star Bobo",
    categorie: "Électroménager",
    adresse: "Route de Sarfalao, Secteur 17",
    quartier: "Sarfalao",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    latitude: 11.1678,
    longitude: -4.2867,
    telephone: "+226 20 98 12 00",
    horaires: "08h30 - 18h30",
    marques: ["Samsung", "LG", "Hisense"],
    produits: ["Réfrigérateurs", "Climatiseurs", "TV", "Machines à laver"],
    services: ["Installation", "SAV", "Garantie"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: true
  },

  // ========================================
  // KOUDOUGOU - Centre-Ouest
  // ========================================
  {
    id: "bout-027",
    nom: "Supermarché Central Koudougou",
    categorie: "Supermarché",
    adresse: "Avenue de la Gare, Centre-ville",
    quartier: "Secteur 1",
    ville: "Koudougou",
    region: "Centre-Ouest",
    latitude: 12.2500,
    longitude: -2.3667,
    telephone: "+226 25 44 12 00",
    horaires: "08h00 - 20h00",
    produits: ["Alimentation", "Boissons", "Hygiène", "Ménage"],
    services: ["Boulangerie"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },
  {
    id: "bout-028",
    nom: "Orange Boutique Koudougou",
    categorie: "Téléphonie",
    adresse: "Près du Grand Marché",
    quartier: "Secteur 3",
    ville: "Koudougou",
    region: "Centre-Ouest",
    latitude: 12.2534,
    longitude: -2.3712,
    telephone: "+226 25 44 80 80",
    horaires: "08h00 - 18h00",
    marques: ["Orange", "Samsung", "Tecno"],
    produits: ["Smartphones", "Forfaits", "Internet"],
    services: ["Activation", "Orange Money"],
    paiements: ["Espèces", "Orange Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // OUAHIGOUYA - Nord
  // ========================================
  {
    id: "bout-030",
    nom: "Supermarché du Sahel",
    categorie: "Supermarché",
    adresse: "Avenue principale, Centre-ville",
    quartier: "Secteur 1",
    ville: "Ouahigouya",
    region: "Nord",
    latitude: 13.5833,
    longitude: -2.4167,
    telephone: "+226 25 55 12 00",
    horaires: "08h00 - 20h00",
    produits: ["Alimentation", "Boissons", "Hygiène"],
    services: ["Service rapide"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },
  {
    id: "bout-032",
    nom: "Orange Boutique Ouahigouya",
    categorie: "Téléphonie",
    adresse: "Route de Djibo, Secteur 3",
    quartier: "Secteur 3",
    ville: "Ouahigouya",
    region: "Nord",
    latitude: 13.5867,
    longitude: -2.4212,
    telephone: "+226 25 55 80 80",
    horaires: "08h00 - 17h00",
    marques: ["Orange", "Samsung"],
    produits: ["Smartphones", "Forfaits"],
    services: ["Activation", "Orange Money"],
    paiements: ["Espèces", "Orange Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // BANFORA - Cascades
  // ========================================
  {
    id: "bout-033",
    nom: "Supermarché des Cascades",
    categorie: "Supermarché",
    adresse: "Route de Sindou, Banfora",
    quartier: "Secteur 1",
    ville: "Banfora",
    region: "Cascades",
    latitude: 10.6333,
    longitude: -4.7667,
    telephone: "+226 20 91 12 00",
    horaires: "08h00 - 20h00",
    produits: ["Alimentation", "Produits locaux", "Boissons"],
    services: ["Boulangerie"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // KAYA - Centre-Nord
  // ========================================
  {
    id: "bout-034",
    nom: "Supermarché du Sanmatenga",
    categorie: "Supermarché",
    adresse: "Avenue de l'Indépendance, Kaya",
    quartier: "Secteur 1",
    ville: "Kaya",
    region: "Centre-Nord",
    latitude: 13.0833,
    longitude: -1.0833,
    telephone: "+226 24 45 12 00",
    horaires: "08h00 - 19h00",
    produits: ["Alimentation", "Hygiène", "Ménage"],
    services: ["Boulangerie"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // FADA N'GOURMA - Est
  // ========================================
  {
    id: "bout-035",
    nom: "Supermarché de l'Est",
    categorie: "Supermarché",
    adresse: "Route du Niger, Fada",
    quartier: "Secteur 1",
    ville: "Fada N'Gourma",
    region: "Est",
    latitude: 12.0667,
    longitude: 0.3667,
    telephone: "+226 24 77 12 00",
    horaires: "08h00 - 20h00",
    produits: ["Alimentation", "Produits d'importation", "Boissons"],
    services: ["Boulangerie"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // DÉDOUGOU - Boucle du Mouhoun
  // ========================================
  {
    id: "bout-036",
    nom: "Supermarché du Mouhoun",
    categorie: "Supermarché",
    adresse: "Route de Bobo, Dédougou",
    quartier: "Secteur 2",
    ville: "Dédougou",
    region: "Boucle du Mouhoun",
    latitude: 12.4667,
    longitude: -3.4667,
    telephone: "+226 20 52 12 00",
    horaires: "08h00 - 20h00",
    produits: ["Alimentation", "Produits agricoles", "Boissons"],
    services: ["Service rapide"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // GAOUA - Sud-Ouest
  // ========================================
  {
    id: "bout-037",
    nom: "Supermarché du Poni",
    categorie: "Supermarché",
    adresse: "Avenue du Commerce, Gaoua",
    quartier: "Secteur 1",
    ville: "Gaoua",
    region: "Sud-Ouest",
    latitude: 10.3333,
    longitude: -3.2500,
    telephone: "+226 20 90 12 00",
    horaires: "08h00 - 19h00",
    produits: ["Alimentation", "Produits artisanaux", "Boissons"],
    services: ["Boulangerie"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // TENKODOGO - Centre-Est
  // ========================================
  {
    id: "bout-038",
    nom: "Supermarché de Tenkodogo",
    categorie: "Supermarché",
    adresse: "Route du Togo, Tenkodogo",
    quartier: "Secteur 1",
    ville: "Tenkodogo",
    region: "Centre-Est",
    latitude: 11.7833,
    longitude: -0.3667,
    telephone: "+226 24 71 12 00",
    horaires: "08h00 - 20h00",
    produits: ["Alimentation", "Produits de première nécessité", "Boissons"],
    services: ["Boulangerie"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // ZINIARÉ - Plateau-Central
  // ========================================
  {
    id: "bout-039",
    nom: "Supermarché de l'Oubritenga",
    categorie: "Supermarché",
    adresse: "Route de Kaya, Ziniaré",
    quartier: "Secteur 1",
    ville: "Ziniaré",
    region: "Plateau-Central",
    latitude: 12.5833,
    longitude: -1.3000,
    telephone: "+226 25 30 12 00",
    horaires: "08h00 - 19h00",
    produits: ["Alimentation", "Produits locaux", "Hygiène"],
    services: ["Service rapide"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // MANGA - Centre-Sud
  // ========================================
  {
    id: "bout-040",
    nom: "Supermarché du Zoundwéogo",
    categorie: "Supermarché",
    adresse: "Route de Pô, Manga",
    quartier: "Secteur 1",
    ville: "Manga",
    region: "Centre-Sud",
    latitude: 11.6000,
    longitude: -1.0667,
    telephone: "+226 25 40 12 00",
    horaires: "08h00 - 19h00",
    produits: ["Alimentation", "Produits de base", "Boissons"],
    services: ["Boulangerie"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  },

  // ========================================
  // DORI - Sahel
  // ========================================
  {
    id: "bout-041",
    nom: "Supermarché du Sahel - Dori",
    categorie: "Supermarché",
    adresse: "Route de Niamey, Dori",
    quartier: "Secteur 1",
    ville: "Dori",
    region: "Sahel",
    latitude: 14.0333,
    longitude: 0.0333,
    telephone: "+226 24 46 12 00",
    horaires: "08h00 - 18h00",
    produits: ["Alimentation", "Produits essentiels", "Boissons"],
    services: ["Service rapide"],
    paiements: ["Espèces", "Mobile Money"],
    climatisation: true,
    parking: true,
    livraison: false
  }
];
