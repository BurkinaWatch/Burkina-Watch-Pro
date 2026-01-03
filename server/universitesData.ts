// Données de secours pour les universités et instituts du Burkina Faso
export interface Universite {
  id: string;
  nom: string;
  type: "Publique" | "Privée" | "Institut" | "Grande École";
  ville: string;
  region: string;
  adresse: string;
  latitude: number;
  longitude: number;
  telephone?: string;
  siteWeb?: string;
  filières: string[];
}

export const UNIVERSITES_DATA: Universite[] = [
  {
    id: "univ-001",
    nom: "Université Joseph Ki-Zerbo",
    type: "Publique",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Zogona",
    latitude: 12.3761,
    longitude: -1.5011,
    telephone: "+226 25 30 70 64",
    siteWeb: "www.ujkz.bf",
    filières: ["Sciences Exactes", "Sciences de la Santé", "Lettres et Arts", "Droit", "Économie"]
  },
  {
    id: "univ-002",
    nom: "Université Nazi Boni",
    type: "Publique",
    ville: "Bobo-Dioulasso",
    region: "Hauts-Bassins",
    adresse: "Nasso",
    latitude: 11.1711,
    longitude: -4.4379,
    telephone: "+226 20 97 12 11",
    siteWeb: "www.unb.bf",
    filières: ["Sciences de la Vie", "Polytechnique", "Sciences Humaines"]
  },
  {
    id: "univ-003",
    nom: "Université de Koudougou (Norbert Zongo)",
    type: "Publique",
    ville: "Koudougou",
    region: "Centre-Ouest",
    adresse: "Secteur 1",
    latitude: 12.2534,
    longitude: -2.3589,
    telephone: "+226 25 44 04 44",
    siteWeb: "www.unz.bf",
    filières: ["Éducation", "Sciences Économiques", "Lettres"]
  },
  {
    id: "univ-004",
    nom: "Université Aube Nouvelle",
    type: "Privée",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "1200 Logements",
    latitude: 12.3689,
    longitude: -1.5034,
    telephone: "+226 25 36 25 25",
    siteWeb: "www.u-auben.com",
    filières: ["Management", "Informatique", "Génie Civil"]
  },
  {
    id: "univ-005",
    nom: "Institut Supérieur de Technologies (IST)",
    type: "Institut",
    ville: "Ouagadougou",
    region: "Centre",
    adresse: "Lafiabougou",
    latitude: 12.3589,
    longitude: -1.5345,
    telephone: "+226 25 37 40 40",
    siteWeb: "www.istbf.com",
    filières: ["Génie Industriel", "Agro-alimentaire", "Gestion"]
  }
];
