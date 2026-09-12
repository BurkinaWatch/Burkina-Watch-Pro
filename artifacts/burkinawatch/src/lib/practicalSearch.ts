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
};

const intentRules: IntentRule[] = [
  { key: 'pharmacies', href: '/pharmacies', label: 'Pharmacies', family: 'sante', familyLabel: 'Santé', explorerType: 'pharmacy', terms: ['pharmacie', 'médicament', 'medicament', 'pilule'] },
  { key: 'hopitaux', href: '/hopitaux', label: 'Hôpitaux & santé', family: 'sante', familyLabel: 'Santé', explorerType: 'hospital', terms: ['hôpital', 'hopital', 'clinique', 'docteur', 'médecin', 'medecin', 'santé', 'sante', 'csps', 'dispensaire'] },
  { key: 'urgences', href: '/urgences', label: 'Urgences', family: 'urgence', familyLabel: 'Urgence', explorerType: 'police', terms: ['urgence', 'urgent', 'secours', 'ambulance', 'police', 'pompiers'] },
  { key: 'retrait', href: '/banques', label: "Retrait d'argent", family: 'argent', familyLabel: 'Argent', explorerType: 'bank', terms: ['argent', 'retirer', 'retrait', 'banque', 'atm', 'guichet', 'gab', 'cash', 'mobile money'] },
  { key: 'stations', href: '/stations', label: 'Station-service', family: 'carburant', familyLabel: 'Carburant', explorerType: 'fuel', terms: ['station', 'essence', 'carburant', 'fuel', 'gasoil', 'diesel'] },
  { key: 'depannage', href: '/boutiques', label: 'Dépannage', family: 'depannage', familyLabel: 'Dépannage', explorerType: 'car_repair', terms: ['dépannage', 'depannage', 'panne', 'voiture', 'mécanicien', 'mecanicien', 'mécanique', 'mecanique', 'plombier'] },
  { key: 'restaurants', href: '/restaurants', label: 'Restaurants', family: 'manger', familyLabel: 'Manger', explorerType: 'restaurant', terms: ['restaurants', 'restaurant', 'resto'] },
  { key: 'manger', href: '/restaurants', label: 'Manger', family: 'manger', familyLabel: 'Manger', explorerType: 'restaurant', terms: ['manger', 'maquis', 'café', 'cafe', 'cantine', 'repas', 'déjeuner', 'dejeuner'] },
  { key: 'transport', href: '/gares', label: 'Transport', family: 'transport', familyLabel: 'Transport', explorerType: 'bus_station', terms: ['transport', 'gare', 'bus', 'taxi', 'voyage', 'départ', 'depart'] },
  { key: 'reparation', href: '/telephonie', label: 'Réparation', family: 'reparation', familyLabel: 'Réparation', explorerType: 'mobile_phone', terms: ['réparation', 'reparation', 'téléphone', 'telephone', 'mobile', 'cassé', 'casse'] },
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
  for (const term of rule?.terms || []) {
    searchText = searchText.replace(normalizePracticalSearch(term), ' ');
  }
  return searchText
    .replace(/\b(je|j|cherche|cherchons|veux|veut|une|un|des|du|de|la|le|les|pour|ou|où|a|à|au|aux|moi|mon|ma|mes|ce|cette|cet|dans|sur|maintenant|soir|aujourd hui|aujourd'hui|disponible|disponibles|ouvert|ouverte|ouverts|ouvertes|garde|proche|pres|pres de|autour|besoin|urgent|urgence|moins|max|budget)\b/g, ' ')
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