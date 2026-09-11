export type PracticalFilterKey = 'open_now' | 'on_duty' | 'recent' | 'proximity' | 'budget' | 'urgent';

export type PracticalSearchIntent = {
  key: string;
  href: string;
  label: string;
  matched: boolean;
  confidence: 'high' | 'medium' | 'low' | 'none';
  filters: PracticalFilterKey[];
  budget?: number;
  originalQuery: string;
};

type IntentRule = {
  key: string;
  href: string;
  label: string;
  terms: string[];
};

const intentRules: IntentRule[] = [
  { key: 'pharmacies', href: '/pharmacies', label: 'Pharmacies', terms: ['pharmacie', 'médicament', 'medicament', 'pilule', 'garde'] },
  { key: 'urgences', href: '/urgences', label: 'Urgences', terms: ['urgence', 'urgent', 'secours', 'ambulance', 'police', 'pompiers'] },
  { key: 'retrait', href: '/banques', label: "Retrait d'argent", terms: ['argent', 'retirer', 'retrait', 'banque', 'atm', 'guichet', 'gab', 'cash'] },
  { key: 'stations', href: '/stations', label: 'Station-service', terms: ['station', 'essence', 'carburant', 'fuel', 'gasoil', 'diesel'] },
  { key: 'depannage', href: '/boutiques', label: 'Dépannage', terms: ['dépannage', 'depannage', 'panne', 'voiture', 'mécanique', 'mecanique', 'plombier'] },
  { key: 'manger', href: '/restaurants', label: 'Manger', terms: ['manger', 'restaurant', 'maquis', 'café', 'cafe', 'cantine', 'repas', 'déjeuner', 'dejeuner'] },
  { key: 'transport', href: '/gares', label: 'Transport', terms: ['transport', 'gare', 'bus', 'taxi', 'voyage', 'départ', 'depart'] },
  { key: 'reparation', href: '/telephonie', label: 'Réparation', terms: ['réparation', 'reparation', 'téléphone', 'telephone', 'mobile', 'cassé', 'casse'] },
  { key: 'commerces', href: '/boutiques', label: 'Commerces & artisans', terms: ['acheter', 'ciment', 'matériaux', 'materiaux', 'boutique', 'magasin', 'plombier', 'artisan'] },
  { key: 'restaurants', href: '/restaurants', label: 'Restaurants', terms: ['restaurants', 'resto'] },
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

export function parsePracticalSearch(value: string): PracticalSearchIntent {
  const originalQuery = value.trim();
  const query = normalizePracticalSearch(originalQuery);
  const budget = parseBudget(query);
  const filters: PracticalFilterKey[] = [];

  if (/\b(ouvert|ouverte|maintenant|ce soir|aujourd hui)\b/.test(query)) filters.push('open_now');
  if (/\b(garde|de garde|nuit)\b/.test(query)) filters.push('on_duty');
  if (/\b(recent|recente|verifie|confirme|nouveau)\w*\b/.test(query)) filters.push('recent');
  if (/\b(proche|pres|autour|proximite|a cote)\b/.test(query)) filters.push('proximity');
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

  return {
    key: best?.key || 'unknown',
    href: best?.href || '',
    label: best?.label || 'Recherche inconnue',
    matched: Boolean(best),
    confidence: best ? (ranked[0].score > 1 ? 'high' : 'medium') : 'none',
    filters,
    budget,
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
  return `${intent.href}?${params.toString()}`;
}

export function practicalFilterLabel(filter: PracticalFilterKey, budget?: number) {
  if (filter === 'open_now') return 'Ouvert maintenant à confirmer';
  if (filter === 'on_duty') return 'De garde';
  if (filter === 'recent') return 'Information récente';
  if (filter === 'proximity') return 'À proximité';
  if (filter === 'urgent') return 'Besoin urgent';
  return `Budget ${new Intl.NumberFormat('fr-FR').format(budget || 0)} FCFA`;
}