import type { Place } from "@shared/schema";

export type PracticalFilterKey =
  | 'open_now'
  | 'on_duty'
  | 'recent'
  | 'proximity'
  | 'budget'
  | 'available'
  | 'today'
  | 'date'
  | 'urgent';

export type PracticalIntentFamily =
  | 'sante'
  | 'argent'
  | 'manger'
  | 'transport'
  | 'depannage'
  | 'reparation'
  | 'achat'
  | 'hebergement'
  | 'administration'
  | 'telecoms'
  | 'carburant'
  | 'urgence';

export type PracticalExplorerType =
  | 'pharmacy'
  | 'fuel'
  | 'restaurant'
  | 'shop'
  | 'marketplace'
  | 'bank'
  | 'atm'
  | 'car_repair'
  | 'bus_station'
  | 'hotel'
  | 'townhall'
  | 'mobile_phone'
  | 'hospital'
  | 'police';

export type PracticalSearchIntent = {
  key: string;
  href: string;
  label: string;
  family?: PracticalIntentFamily;
  familyLabel?: string;
  explorerType?: PracticalExplorerType;
  matched: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  filters: PracticalFilterKey[];
  budget?: number;
  budgetMode?: 'max' | 'target';
  date?: string;
  searchText: string;
  originalQuery: string;
};

type IntentRule = {
  key: string;
  href: string;
  label: string;
  family: PracticalIntentFamily;
  familyLabel: string;
  explorerType: PracticalExplorerType;
  terms: string[];
  searchTerms?: string[];
};

const intentRules: IntentRule[] = [
  { key: 'pharmacies', href: '/pharmacies', label: 'Pharmacies', family: 'sante', familyLabel: 'Santé', explorerType: 'pharmacy', terms: ['pharmacie', 'médicament', 'medicament', 'pilule'] },
  { key: 'hopitaux', href: '/hopitaux', label: 'Hôpitaux & santé', family: 'sante', familyLabel: 'Santé', explorerType: 'hospital', terms: ['hôpital', 'hopital', 'clinique', 'docteur', 'médecin', 'medecin', 'santé', 'sante', 'csps', 'dispensaire'] },
  { key: 'urgences', href: '/urgences', label: 'Urgences', family: 'urgence', familyLabel: 'Urgence', explorerType: 'police', terms: ['urgence', 'urgent', 'secours', 'ambulance', 'police', 'pompiers'] },
  { key: 'retrait', href: '/banques', label: "Retrait d'argent", family: 'argent', familyLabel: 'Argent', explorerType: 'bank', terms: ['argent', 'retirer', 'retrait', 'banque', 'atm', 'guichet', 'gab', 'cash', 'mobile money'] },
  { key: 'stations', href: '/stations', label: 'Station-service', family: 'carburant', familyLabel: 'Carburant', explorerType: 'fuel', terms: ['station', 'essence', 'carburant', 'fuel', 'gasoil', 'diesel'] },
  { key: 'depannage', href: '/boutiques', label: 'Dépannage', family: 'depannage', familyLabel: 'Dépannage', explorerType: 'car_repair', terms: ['dépannage', 'depannage', 'panne', 'voiture', 'mécanicien', 'mecanicien', 'mécanique', 'mecanique'] },
  { key: 'restaurants', href: '/restaurants', label: 'Restaurants', family: 'manger', familyLabel: 'Manger', explorerType: 'restaurant', terms: ['restaurants', 'restaurant', 'resto'] },
  { key: 'manger', href: '/restaurants', label: 'Manger', family: 'manger', familyLabel: 'Manger', explorerType: 'restaurant', terms: ['manger', 'maquis', 'café', 'cafe', 'cantine', 'repas', 'déjeuner', 'dejeuner'] },
  { key: 'transport', href: '/gares', label: 'Transport', family: 'transport', familyLabel: 'Transport', explorerType: 'bus_station', terms: ['transport', 'gare', 'bus', 'taxi', 'voyage', 'départ', 'depart'] },
  { key: 'reparation', href: '/telephonie', label: 'Réparation', family: 'reparation', familyLabel: 'Réparation', explorerType: 'mobile_phone', terms: ['réparation', 'reparation', 'téléphone', 'telephone', 'mobile', 'cassé', 'casse'] },
  { key: 'marches', href: '/marches', label: 'Marchés', family: 'achat', familyLabel: 'Achat', explorerType: 'marketplace', terms: ['marché', 'marche', 'marchés', 'marches'] },
  {
    key: 'commerce_precis',
    href: '/boutiques',
    label: 'Commerces de proximité',
    family: 'achat',
    familyLabel: 'Achat',
    explorerType: 'shop',
    terms: [
      'acheter',
      'achat',
      'payer',
      'boucherie',
      'viande',
      'légume',
      'legume',
      'légumes',
      'legumes',
      'fruit',
      'fruits',
      'épicerie',
      'epicerie',
      'chaussure',
      'chaussures',
      'nike',
      'commerce',
      'boutique',
      'magasin',
    ],
    searchTerms: ['acheter', 'achat', 'payer', 'commerce', 'boutique', 'magasin'],
  },
  { key: 'commerces', href: '/boutiques', label: 'Commerces & artisans', family: 'achat', familyLabel: 'Achat', explorerType: 'shop', terms: ['acheter', 'achat', 'ciment', 'matériaux', 'materiaux', 'boutique', 'magasin', 'plombier', 'artisan'] },
  { key: 'hebergement', href: '/hotels', label: 'Hôtels & auberges', family: 'hebergement', familyLabel: 'Hébergement', explorerType: 'hotel', terms: ['chambre', 'hôtel', 'hotel', 'auberge', 'hébergement', 'hebergement', 'dormir'] },
  { key: 'administration', href: '/mairies-prefectures', label: 'Mairies & préfectures', family: 'administration', familyLabel: 'Administration', explorerType: 'townhall', terms: ['administration', 'administratif', 'mairie', 'préfecture', 'prefecture', 'service public'] },
  { key: 'telecoms', href: '/telephonie', label: 'Télécoms', family: 'telecoms', familyLabel: 'Télécoms', explorerType: 'mobile_phone', terms: ['télécom', 'telecom', 'téléphonie', 'telephonie', 'réseau', 'sim', 'internet'] },
];

export const normalizePracticalSearch = (value: string) =>
  value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

function parseBudget(query: string) {
  const match = query.match(/\b(\d[\d\s.]*)\s*(?:f|fcfa|francs)?\b/i);
  if (!match) return undefined;
  const value = Number(match[1].replace(/[\s.]/g, ''));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function parseDate(query: string) {
  const match = query.match(/\b(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/);
  return match?.[1];
}

function removeSearchNoise(query: string, rule?: IntentRule) {
  let searchText = query;
  for (const term of rule?.searchTerms || rule?.terms || []) {
    searchText = searchText.replace(normalizePracticalSearch(term), ' ');
  }
  return searchText
    .replace(/\b(je|j|cherche|cherchons|veux|veut|une|un|des|du|de|la|le|les|pour|ou|où|a|à|au|aux|moi|mon|ma|mes|ce|cette|cet|dans|sur|maintenant|soir|aujourd hui|aujourd'hui|disponible|disponibles|ouvert|ouverte|ouverts|ouvertes|garde|proche|pres|pres de|autour|besoin|urgent|urgence|moins|max|budget|tel|type)\b/g, ' ')
    .replace(/\b\d[\d\s.]*\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePracticalSearch(value: string): PracticalSearchIntent {
  const originalQuery = value.trim();
  const query = normalizePracticalSearch(originalQuery);
  const budget = parseBudget(query);
  const date = parseDate(query);
  const filters: PracticalFilterKey[] = [];

  if (/\b(ouvert|ouverte|ouverts|ouvertes|maintenant|ce soir)\b/.test(query)) filters.push('open_now');
  if (/\b(garde|de garde|nuit)\b/.test(query)) filters.push('on_duty');
  if (/\b(recent|recente|verifie|confirme|nouveau)\w*\b/.test(query)) filters.push('recent');
  if (/\b(proche|pres|autour|proximite|a cote)\b/.test(query)) filters.push('proximity');
  if (/\b(disponible|disponibles|en stock)\b/.test(query)) filters.push('available');
  if (/\b(aujourd hui|aujourd'hui|ce soir)\b/.test(query)) filters.push('today');
  if (date) filters.push('date');
  if (budget) filters.push('budget');
  if (/\b(urgence|urgent|secours|panne)\b/.test(query)) filters.push('urgent');

  const ranked = intentRules
    .map((rule, index) => ({
      rule,
      index,
      score: rule.terms.reduce((score, term) => score + (query.includes(normalizePracticalSearch(term)) ? 1 : 0), 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const best = ranked[0]?.rule;
  const searchText = removeSearchNoise(query, best);

  return {
    key: best?.key || 'unknown',
    href: best?.href || '',
    label: best?.label || 'Recherche inconnue',
    family: best?.family,
    familyLabel: best?.familyLabel,
    explorerType: best?.explorerType,
    matched: Boolean(best),
    confidence: best ? (ranked[0].score > 1 ? 'high' : 'medium') : 'none',
    filters,
    budget,
    budgetMode: budget ? (/\b(moins|max|maximum|jusqu)\b/.test(query) ? 'max' : 'target') : undefined,
    date,
    searchText,
    originalQuery,
  };
}

export function buildPracticalRoute(intent: PracticalSearchIntent) {
  if (!intent.matched) return '';
  const params = new URLSearchParams({ pratique: intent.key });
  if (intent.budget) params.set('budget', String(intent.budget));
  if (intent.filters.includes('open_now')) params.set('open', 'now');
  if (intent.filters.includes('on_duty')) params.set('duty', '1');
  if (intent.filters.includes('recent')) params.set('recent', '1');
  if (intent.filters.includes('proximity')) params.set('nearby', '1');
  if (intent.filters.includes('available')) params.set('available', '1');
  if (intent.filters.includes('today')) params.set('today', '1');
  if (intent.date) params.set('date', intent.date);
  return `${intent.href}?${params.toString()}`;
}

export function practicalFilterLabel(filter: PracticalFilterKey, budget?: number) {
  if (filter === 'open_now') return 'Ouvert maintenant à confirmer';
  if (filter === 'on_duty') return 'De garde';
  if (filter === 'recent') return 'Information récente';
  if (filter === 'proximity') return 'À proximité';
  if (filter === 'available') return 'Disponibilité à confirmer';
  if (filter === 'today') return "Aujourd'hui";
  if (filter === 'date') return 'Date demandée';
  if (filter === 'urgent') return 'Besoin urgent';
  return `${budget ? 'Budget max' : 'Budget'} ${new Intl.NumberFormat('fr-FR').format(budget || 0)} FCFA`;
}

export type PracticalLocation = {
  latitude: number;
  longitude: number;
};

type PracticalPlace = Place & { distance?: number };

function placeTags(place: Place) {
  return (place.tags && typeof place.tags === 'object' ? place.tags : {}) as Record<string, unknown>;
}

const placeSearchAliases: Record<string, string[]> = {
  chaussure: ['chaussure', 'chaussures', 'shoe', 'shoes'],
  chaussures: ['chaussure', 'chaussures', 'shoe', 'shoes'],
  boucherie: ['boucherie', 'butcher', 'viande', 'meat'],
  viande: ['boucherie', 'butcher', 'viande', 'meat'],
  legume: ['legume', 'legumes', 'légume', 'légumes', 'greengrocer', 'grocery', 'produce'],
  legumes: ['legume', 'legumes', 'légume', 'légumes', 'greengrocer', 'grocery', 'produce'],
  fruit: ['fruit', 'fruits', 'greengrocer', 'grocery', 'produce'],
  fruits: ['fruit', 'fruits', 'greengrocer', 'grocery', 'produce'],
  epicerie: ['epicerie', 'épicerie', 'grocery', 'convenience', 'supermarket'],
  nike: ['nike'],
};

function searchAlternatives(token: string) {
  return [token, ...(placeSearchAliases[token] || [])].map(normalizePracticalSearch);
}

function textValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

function parsePrice(value: unknown) {
  const match = textValue(value).match(/\d[\d\s.]*/);
  if (!match) return undefined;
  const parsed = Number(match[0].replace(/[\s.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function placePrice(place: Place) {
  const tags = placeTags(place);
  return parsePrice(tags.budget) ?? parsePrice(tags.price) ?? parsePrice(tags.priceRange) ?? parsePrice(tags.priceLevel);
}

function placeOpeningHours(place: Place) {
  const tags = placeTags(place);
  return textValue(place.horaires || tags.opening_hours || tags.service_times);
}

function isOpenNow(place: Place) {
  const hours = placeOpeningHours(place).toLocaleLowerCase('fr-FR');
  if (!hours) return undefined;
  if (/(24\s*\/\s*7|24h|24 h|toujours|non[- ]?stop)/.test(hours)) return true;

  const match = hours.match(/(\d{1,2})(?:[:h](\d{2}))?\s*[-–à]\s*(\d{1,2})(?:[:h](\d{2}))?/);
  if (!match) return undefined;
  const start = Number(match[1]) * 60 + Number(match[2] || 0);
  const end = Number(match[3]) * 60 + Number(match[4] || 0);
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

function isOnDuty(place: Place) {
  const tags = placeTags(place);
  const content = [
    placeOpeningHours(place),
    textValue(tags.garde),
    textValue(tags.on_duty),
    textValue(tags.duty),
    textValue(tags.services),
  ].join(' ').toLocaleLowerCase('fr-FR');
  return /\b(garde|de garde|astreinte|nuit|24\s*\/\s*7)\b/.test(content);
}

function isAvailable(place: Place) {
  const tags = placeTags(place);
  const content = [
    textValue(tags.available),
    textValue(tags.availability),
    textValue(tags.disponibilite),
    textValue(tags.status),
    textValue(tags.services),
  ].join(' ').toLocaleLowerCase('fr-FR');
  return /\b(oui|yes|true|disponible|disponibles|en stock|ouvert|ouverte|actif|active)\b/.test(content);
}

function isRecent(place: Place) {
  const timestamp = place.updatedAt || place.lastSyncedAt || place.createdAt;
  if (!timestamp) return false;
  const age = Date.now() - new Date(timestamp).getTime();
  return Number.isFinite(age) && age >= 0 && age <= 90 * 24 * 60 * 60 * 1000;
}

function distanceInKm(place: Place, location: PracticalLocation) {
  const latitude = Number(place.latitude);
  const longitude = Number(place.longitude);
  if (![latitude, longitude, location.latitude, location.longitude].every(Number.isFinite)) return undefined;
  const earthRadius = 6371;
  const latitudeDelta = (location.latitude - latitude) * Math.PI / 180;
  const longitudeDelta = (location.longitude - longitude) * Math.PI / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude * Math.PI / 180) * Math.cos(location.latitude * Math.PI / 180) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function filterPracticalPlaces(
  places: Place[],
  intent: PracticalSearchIntent,
  location?: PracticalLocation,
): PracticalPlace[] {
  const search = normalizePracticalSearch(intent.searchText);
  const filtered: PracticalPlace[] = places
    .filter((place) => {
      if (search) {
        const tags = placeTags(place);
        const tagText = Object.entries(tags)
          .flatMap(([key, value]) => [key, textValue(value)])
          .filter(Boolean);
        const haystack = normalizePracticalSearch([
          place.name,
          place.address,
          place.quartier,
          place.ville,
          place.region,
          textValue(tags.description),
          textValue(tags.services),
          textValue(tags.cuisine),
          textValue(tags.brand),
          textValue(tags.operator),
          textValue(tags.shop),
          textValue(tags.product),
          ...tagText,
        ].filter(Boolean).join(' '));
        if (!search.split(/\s+/).every((word) => searchAlternatives(word).some((alternative) => haystack.includes(alternative)))) return false;
      }

      if (intent.filters.includes('open_now') && isOpenNow(place) !== true) return false;
      if (intent.filters.includes('on_duty') && !isOnDuty(place)) return false;
      if (intent.filters.includes('recent') && !isRecent(place)) return false;
      if (intent.filters.includes('available') && !isAvailable(place)) return false;

      if (intent.budget) {
        const price = placePrice(place);
        if (price === undefined) return false;
        if (intent.budgetMode === 'max' && price > intent.budget) return false;
        if (intent.budgetMode === 'target' && price > intent.budget) return false;
      }

      return true;
    })
    .map((place): PracticalPlace => {
      const distance = location ? distanceInKm(place, location) : undefined;
      return distance === undefined ? place : { ...place, distance };
    });

  if (intent.filters.includes('proximity') && location) {
    return filtered.sort((a, b) => (a.distance ?? Number.POSITIVE_INFINITY) - (b.distance ?? Number.POSITIVE_INFINITY));
  }
  return filtered;
}