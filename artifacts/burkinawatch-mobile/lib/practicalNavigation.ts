import { Feather } from '@expo/vector-icons';

export type PracticalItem = {
  label: string;
  route: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
  keywords: string[];
};

export const practicalQuickLinks: PracticalItem[] = [
  {
    label: 'Pharmacie',
    route: '/pharmacies',
    icon: 'plus-square',
    description: 'Trouver une pharmacie du Faso',
    keywords: ['pharmacie', 'médicament', 'garde'],
  },
  {
    label: 'Urgence',
    route: '/urgences',
    icon: 'phone-call',
    description: 'Les contacts qui comptent maintenant',
    keywords: ['urgence', 'secours', 'ambulance', 'police'],
  },
  {
    label: "Retrait d'argent",
    route: '/banques',
    icon: 'credit-card',
    description: 'Agences et services bancaires',
    keywords: ['argent', 'banque', 'atm', 'guichet'],
  },
  {
    label: 'Station-service',
    route: '/stations',
    icon: 'truck',
    description: 'Carburant et stations-service',
    keywords: ['station', 'essence', 'carburant', 'fuel'],
  },
  {
    label: 'Dépannage',
    route: '/boutiques',
    icon: 'tool',
    description: 'Artisans, commerces et services de proximité',
    keywords: ['dépannage', 'panne', 'voiture', 'mécanique'],
  },
  {
    label: 'Manger',
    route: '/restaurants',
    icon: 'coffee',
    description: 'Maquis, restaurants, bars et cafés',
    keywords: ['manger', 'restaurant', 'maquis', 'café'],
  },
  {
    label: 'Transport',
    route: '/gares',
    icon: 'navigation',
    description: 'Gares routières et départs',
    keywords: ['transport', 'gare', 'bus', 'voyage'],
  },
  {
    label: 'Réparation',
    route: '/telephonie',
    icon: 'smartphone',
    description: 'Téléphonie, agences et services mobiles',
    keywords: ['réparation', 'téléphone', 'téléphonie', 'mobile'],
  },
];

export const practicalCategories: PracticalItem[] = [
  ...practicalQuickLinks.slice(0, 4),
  {
    label: 'Hôpitaux & santé',
    route: '/hopitaux',
    icon: 'heart',
    description: 'Établissements de santé',
    keywords: ['hôpital', 'santé'],
  },
  {
    label: 'Restaurants',
    route: '/restaurants',
    icon: 'coffee',
    description: 'Manger près de vous',
    keywords: ['restaurant', 'manger'],
  },
  {
    label: 'Marchés',
    route: '/marches',
    icon: 'shopping-bag',
    description: 'Marchés et commerce de proximité',
    keywords: ['marché', 'commerce'],
  },
  {
    label: 'Boutiques',
    route: '/boutiques',
    icon: 'shopping-bag',
    description: 'Commerces et adresses de proximité',
    keywords: ['boutique', 'magasin', 'commerce'],
  },
  {
    label: 'Boutiques & marchés',
    route: '/boutiques-marches',
    icon: 'grid',
    description: 'Commerces, étals et marchés',
    keywords: ['boutique', 'marché'],
  },
  {
    label: 'Gares routières',
    route: '/gares',
    icon: 'navigation',
    description: 'Transport et départs',
    keywords: ['gare', 'transport'],
  },
  {
    label: 'Hôtels & auberges',
    route: '/hotels',
    icon: 'home',
    description: 'Où dormir au Burkina Faso',
    keywords: ['hôtel', 'auberge', 'hébergement'],
  },
  {
    label: 'Mairies & préfectures',
    route: '/mairies-prefectures',
    icon: 'map',
    description: 'Services administratifs',
    keywords: ['mairie', 'préfecture', 'administration'],
  },
  {
    label: 'Ministères',
    route: '/ministeres',
    icon: 'briefcase',
    description: 'Institutions et services publics',
    keywords: ['ministère', 'service public'],
  },
  {
    label: 'Universités & instituts',
    route: '/universites',
    icon: 'book-open',
    description: 'Étudier et se former',
    keywords: ['université', 'institut', 'école'],
  },
  {
    label: 'Lieux de culte',
    route: '/lieux-de-culte',
    icon: 'heart',
    description: 'Églises et mosquées',
    keywords: ['église', 'mosquée', 'culte'],
  },
  {
    label: 'SONABEL & ONEA',
    route: '/sonabel-onea',
    icon: 'zap',
    description: 'Électricité et eau',
    keywords: ['sonabel', 'onea', 'eau', 'électricité'],
  },
  {
    label: 'Téléphonie',
    route: '/telephonie',
    icon: 'smartphone',
    description: 'Opérateurs et agences',
    keywords: ['téléphonie', 'téléphone', 'orange', 'moov'],
  },
  {
    label: 'Cinéma',
    route: '/cine',
    icon: 'film',
    description: 'Séances et salles',
    keywords: ['cinéma', 'film'],
  },
  {
    label: 'Météo',
    route: '/meteo',
    icon: 'cloud',
    description: 'Conditions et alertes météo',
    keywords: ['météo', 'pluie', 'temps'],
  },
];

export const categoryRoutes: Record<string, string> = {
  urgences: '/urgences',
  pharmacies: '/pharmacies',
  hopitaux: '/hopitaux',
  stations: '/stations',
  gares: '/gares',
  marches: '/marches',
};

export const categoryLabels: Record<string, string> = Object.fromEntries(
  practicalCategories.map((category) => [category.route, category.label]),
);