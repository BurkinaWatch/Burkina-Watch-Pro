
import Parser from 'rss-parser';

interface EventItem {
  id: string;
  nom: string;
  type: "Fête nationale" | "Concert" | "Café-concert" | "Festival" | "Cinéma" | "Théâtre" | "Dédicace" | "Cérémonie" | "Culturel" | "Conférence" | "Sport" | "Infrastructure" | "Sécurité";
  date: string;
  lieu: string;
  ville: string;
  heure?: string;
  description: string;
  latitude?: number;
  longitude?: number;
  lienOfficiel?: string;
  affiche?: string;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

function upgradeImageUrl(url: string): string {
  if (!url) return url;
  let upgraded = url.replace(/cache-vignettes\/L\d+xH\d+\//i, 'cache-gd2/');
  if (upgraded === url) {
    upgraded = url.replace(/(-)\d+x\d+(\.\w+)$/, '$1scaled$2');
  }
  if (upgraded === url) {
    upgraded = url.replace(/\?w=\d+(&h=\d+)?/, '');
    upgraded = upgraded.replace(/&w=\d+(&h=\d+)?/, '');
  }
  if (upgraded === url) {
    upgraded = url.replace(/-\d+x\d+(?=\.\w+$)/, '');
  }
  return upgraded;
}

const eventImageCache = new Map<string, string | null>();

async function fetchOgImageForEvent(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  if (eventImageCache.has(url)) {
    const cached = eventImageCache.get(url);
    return cached || undefined;
  }
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok) { eventImageCache.set(url, null); return undefined; }
    const html = await response.text();
    let match = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (!match) match = html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    if (!match) match = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    if (!match) match = html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
    if (!match) {
      const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
      if (imgMatches) {
        for (const imgTag of imgMatches) {
          const widthMatch = imgTag.match(/width=["']?(\d+)/i);
          const w = widthMatch ? parseInt(widthMatch[1]) : 0;
          if (w > 0 && w < 200) continue;
          const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
          if (srcMatch && srcMatch[1]) {
            const src = srcMatch[1];
            if (!src.includes('logo') && !src.includes('icon') && !src.includes('avatar') && !src.includes('favicon') && !src.includes('sprite')) {
              match = [null, src];
              break;
            }
          }
        }
      }
    }
    if (match && match[1]) {
      let imageUrl = match[1];
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      }
      eventImageCache.set(url, imageUrl);
      return imageUrl;
    }
    eventImageCache.set(url, null);
    return undefined;
  } catch {
    eventImageCache.set(url, null);
    return undefined;
  }
}

function extractEventImage(item: any): string | undefined {
  let url: string | undefined;
  if (item.media && item.media.$) url = item.media.$.url;
  if (!url && item.mediaThumbnail && item.mediaThumbnail.$) url = item.mediaThumbnail.$.url;
  if (!url && item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) url = item.enclosure.url;
  if (!url) {
    const htmlContent = item.contentEncoded || item.content || item.description || '';
    const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) url = imgMatch[1];
  }
  return url ? upgradeImageUrl(url) : undefined;
}

const EVENT_SOURCES = [
  'https://lefaso.net/spip.php?page=backend',
  'https://www.sidwaya.info/feed/',
  'https://fasonews.africa/feed/',
  'https://www.fasozine.com/feed/',
  'https://www.libreinfo.net/feed/',
  'https://www.wakat.bf/feed/',
  'https://www.aib.bf/spip.php?page=backend',
];

const BURKINA_CITIES = [
  'ouagadougou', 'ouaga', 'bobo-dioulasso', 'bobo dioulasso', 'koudougou',
  'ouahigouya', 'banfora', 'fada', "fada n'gourma", 'kaya', 'tenkodogo',
  'dori', 'dedougou', 'dédougou', 'gaoua', 'ziniaré', 'pô', 'léo',
  'manga', 'kongoussi', 'djibo', 'nouna', 'diébougou', 'orodara',
  'réo', 'yako', 'boulsa', 'bogandé', 'diapaga', 'tougan', 'boromo',
  'houndé', 'sapouy', 'kombissiri', 'koupéla', 'zorgo', 'garango',
  'burkina', 'faso', 'burkinabè', 'burkinabe'
];

interface EventTypePattern {
  type: EventItem['type'];
  keywords: string[];
}

const EVENT_TYPE_PATTERNS: EventTypePattern[] = [
  { type: 'Concert', keywords: ['concert', 'spectacle musical', 'show musical', 'musique live', 'prestation musicale', 'artiste en concert'] },
  { type: 'Café-concert', keywords: ['café-concert', 'cafe-concert', 'café concert', 'soirée musicale', 'bar concert'] },
  { type: 'Festival', keywords: ['festival', 'fespaco', 'festivalier', 'édition du festival', 'fête culturelle'] },
  { type: 'Cinéma', keywords: ['cinéma', 'cinema', 'projection', 'film', 'court-métrage', 'court métrage', 'documentaire', 'long-métrage'] },
  { type: 'Théâtre', keywords: ['théâtre', 'theatre', 'pièce de théâtre', 'spectacle', 'marionnette', 'comédie', 'sketch', 'stand-up', 'one man show'] },
  { type: 'Dédicace', keywords: ['dédicace', 'dedicace', 'livre', 'ouvrage', 'auteur', 'publication', 'lancement du livre', 'salon du livre'] },
  { type: 'Cérémonie', keywords: ['cérémonie', 'ceremonie', 'gala', 'remise de prix', 'distinction', 'hommage', 'commémoration', 'inauguration'] },
  { type: 'Conférence', keywords: ['conférence', 'conference', 'colloque', 'séminaire', 'seminaire', 'forum', 'symposium', 'atelier', 'formation', 'sensibilisation'] },
  { type: 'Sport', keywords: ['sport', 'match', 'compétition', 'competition', 'tournoi', 'championnat', 'coupe', 'football', 'basket', 'marathon', 'lutte', 'cyclisme'] },
  { type: 'Sécurité', keywords: ['sécurité', 'securite', 'terrorisme', 'attaque', 'attentat', 'alerte', 'couvre-feu', 'manifestation', 'marche de protestation', 'insécurité'] },
  { type: 'Infrastructure', keywords: ['infrastructure', 'route', 'pont', 'barrage', 'construction', 'travaux', 'réhabilitation', 'bitumage'] },
  { type: 'Fête nationale', keywords: ['fête nationale', 'fete nationale', 'indépendance', 'independance', '11 décembre', '11 decembre', 'fête du travail'] },
  { type: 'Culturel', keywords: ['culturel', 'culture', 'exposition', 'art', 'danse', 'tradition', 'patrimoine', 'salon', 'foire', 'semaine nationale de la culture', 'snc'] },
];

function detectEventType(text: string): EventItem['type'] | null {
  const lower = text.toLowerCase();
  for (const pattern of EVENT_TYPE_PATTERNS) {
    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) return pattern.type;
    }
  }
  return null;
}

function extractCity(text: string): string {
  const lower = text.toLowerCase();
  for (const city of BURKINA_CITIES) {
    if (lower.includes(city)) {
      if (['burkina', 'faso', 'burkinabè', 'burkinabe'].includes(city)) continue;
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  return 'Ouagadougou';
}

function extractHour(text: string): string | undefined {
  const match = text.match(/(\d{1,2})\s*[hH:]\s*(\d{0,2})/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = (match[2] || '00').padStart(2, '0');
    const hour = parseInt(h);
    if (hour >= 0 && hour <= 23) return `${h}:${m}`;
  }
  return undefined;
}

function isBurkinaRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return BURKINA_CITIES.some(city => lower.includes(city));
}

function extractArticleDate(article: any): string {
  if (article.pubDate || article.isoDate) {
    try {
      const d = new Date(article.isoDate || article.pubDate);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } catch {}
  }
  return new Date().toISOString().split('T')[0];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#?\w+;/g, ' ').trim();
}

function extractEventsFromArticles(articles: any[]): EventItem[] {
  const events: EventItem[] = [];
  const seenTitles = new Set<string>();

  for (const article of articles) {
    const title = article.title || '';
    const snippet = stripHtml(article.contentSnippet || article.description || '');
    const fullText = `${title} ${snippet}`;

    if (!isBurkinaRelated(fullText)) continue;

    const eventType = detectEventType(fullText);
    if (!eventType) continue;

    const titleLower = title.toLowerCase().substring(0, 60);
    if (seenTitles.has(titleLower)) continue;
    seenTitles.add(titleLower);

    const city = extractCity(fullText);
    const hour = extractHour(fullText);
    const date = extractArticleDate(article);
    const description = snippet.length > 200 ? snippet.substring(0, 200) + '...' : snippet;

    events.push({
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nom: title.length > 120 ? title.substring(0, 120) + '...' : title,
      type: eventType,
      date,
      lieu: city,
      ville: city,
      heure: hour,
      description: description || title,
      lienOfficiel: article.link,
      affiche: extractEventImage(article)
    });
  }

  return events;
}

function getNextOccurrence(month: number, day: number): string {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisYearDate = new Date(thisYear, month - 1, day);
  if (thisYearDate >= now) {
    return `${thisYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return `${thisYear + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getFallbackEvents(): EventItem[] {
  const now = new Date();
  const events: EventItem[] = [];

  const nextOddYear = now.getFullYear() % 2 === 1
    ? (new Date(now.getFullYear(), 1, 22) >= now ? now.getFullYear() : now.getFullYear() + 2)
    : now.getFullYear() + 1;
  events.push({
    id: 'fallback-fespaco', nom: 'FESPACO - Festival Panafricain du Cinéma et de la Télévision',
    type: 'Festival', date: `${nextOddYear}-02-22`, lieu: 'Palais des Sports de Ouaga 2000',
    ville: 'Ouagadougou', heure: '09:00',
    description: 'Le plus grand festival de cinéma africain. Projections, compétitions et rencontres avec des cinéastes du continent.'
  });

  const nextEvenYear = now.getFullYear() % 2 === 0
    ? (new Date(now.getFullYear(), 9, 25) >= now ? now.getFullYear() : now.getFullYear() + 2)
    : now.getFullYear() + 1;
  events.push({
    id: 'fallback-siao', nom: "SIAO - Salon International de l'Artisanat de Ouagadougou",
    type: 'Culturel', date: `${nextEvenYear}-10-25`, lieu: 'Parc des Expositions',
    ville: 'Ouagadougou', heure: '08:00',
    description: "Exposition et vente d'artisanat africain. Plus de 3000 exposants de tout le continent."
  });

  events.push({
    id: 'fallback-nak', nom: 'Nuits Atypiques de Koudougou',
    type: 'Festival', date: getNextOccurrence(12, 20), lieu: 'Centre-ville de Koudougou',
    ville: 'Koudougou', heure: '18:00',
    description: 'Festival de musique et de cultures du monde. Concerts, ateliers et spectacles de rue.'
  });

  events.push({
    id: 'fallback-jazz', nom: 'Jazz à Ouaga',
    type: 'Concert', date: getNextOccurrence(4, 28), lieu: 'Institut Français',
    ville: 'Ouagadougou', heure: '20:00',
    description: 'Festival international de jazz. Concerts en plein air avec artistes africains et internationaux.'
  });

  events.push({
    id: 'fallback-snc', nom: 'Semaine Nationale de la Culture (SNC)',
    type: 'Culturel', date: getNextOccurrence(3, 22), lieu: 'Maison de la Culture',
    ville: 'Bobo-Dioulasso', heure: '09:00',
    description: 'Grande fête culturelle nationale. Danse, musique, théâtre et arts traditionnels de toutes les régions.'
  });

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  events.push({
    id: 'fallback-poesie', nom: 'Récital de Poésie - Les Voix du Sahel',
    type: 'Culturel', date: nextMonth.toISOString().split('T')[0], lieu: 'Centre Culturel Français',
    ville: 'Ouagadougou', heure: '19:00',
    description: 'Soirée poésie avec des auteurs locaux et internationaux. Lectures et débats littéraires.'
  });

  const nextSaturday = new Date(now);
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
  nextSaturday.setDate(now.getDate() + daysUntilSaturday);
  events.push({
    id: 'fallback-marche-artisanat', nom: "Marché d'Artisanat de Ouagadougou",
    type: 'Culturel', date: nextSaturday.toISOString().split('T')[0], lieu: 'Village Artisanal',
    ville: 'Ouagadougou', heure: '08:00',
    description: 'Marché hebdomadaire d\'artisanat. Sculptures, textiles, bijoux et produits locaux.'
  });

  events.push({
    id: 'fallback-independance', nom: "Fête Nationale de l'Indépendance",
    type: 'Fête nationale', date: getNextOccurrence(12, 11), lieu: 'Place de la Nation',
    ville: 'Ouagadougou', heure: '08:00',
    description: "Célébration de l'indépendance du Burkina Faso. Défilé militaire, festivités et concerts."
  });

  events.push({
    id: 'fallback-femme', nom: 'Journée Internationale de la Femme',
    type: 'Cérémonie', date: getNextOccurrence(3, 8), lieu: 'Palais des Sports',
    ville: 'Ouagadougou', heure: '09:00',
    description: 'Célébration des femmes burkinabè. Conférences, expositions et spectacles.'
  });

  const nextFriday = new Date(now);
  const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  events.push({
    id: 'fallback-cafe-concert', nom: 'Café-Concert Live Music',
    type: 'Café-concert', date: nextFriday.toISOString().split('T')[0], lieu: 'Bar Le Verdoyant',
    ville: 'Ouagadougou', heure: '21:00',
    description: 'Soirée musique live avec artistes locaux. Ambiance décontractée et conviviale.'
  });

  const nextSunday = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  nextSunday.setDate(now.getDate() + daysUntilSunday);

  events.push({
    id: 'fallback-ceremony', nom: 'Cérémonie du Naaba - Fête Royale Mossi',
    type: 'Cérémonie', date: nextFriday.toISOString().split('T')[0], lieu: 'Palais du Moogho Naaba',
    ville: 'Ouagadougou', heure: '07:00',
    description: 'Cérémonie traditionnelle hebdomadaire du Roi des Mossi. Danse, musique et protocole royal.'
  });

  const cinemaDate = new Date(now); cinemaDate.setDate(now.getDate() + 2);
  events.push({
    id: 'fallback-cinema-plein-air', nom: 'Cinéma en Plein Air - Film Africain',
    type: 'Cinéma', date: cinemaDate.toISOString().split('T')[0], lieu: 'Place de la Révolution',
    ville: 'Ouagadougou', heure: '20:00',
    description: 'Projection gratuite de films africains primés. Animation et débat avec réalisateur.'
  });

  const dedicaceDate = new Date(now); dedicaceDate.setDate(now.getDate() + 6);
  events.push({
    id: 'fallback-dedicace', nom: "Dédicace - \"L'Enfant du Faso\" par Amadou Koné",
    type: 'Dédicace', date: dedicaceDate.toISOString().split('T')[0], lieu: 'Librairie Mercury',
    ville: 'Ouagadougou', heure: '15:00',
    description: "Rencontre avec l'auteur et séance de dédicace de son nouveau roman."
  });

  const lutteDate = new Date(now); lutteDate.setDate(now.getDate() + 9);
  events.push({
    id: 'fallback-lutte', nom: 'Tournoi de Lutte Traditionnelle',
    type: 'Sport', date: lutteDate.toISOString().split('T')[0], lieu: 'Arène de Ouahigouya',
    ville: 'Ouahigouya', heure: '15:00',
    description: 'Compétition de lutte traditionnelle. Champions des différentes régions du Nord.'
  });

  const masqueDate = new Date(now); masqueDate.setDate(now.getDate() + 12);
  events.push({
    id: 'fallback-masque', nom: 'Festival International des Masques de Dédougou',
    type: 'Festival', date: masqueDate.toISOString().split('T')[0], lieu: 'Place Centrale',
    ville: 'Dédougou', heure: '14:00',
    description: 'Festival célébrant les masques sacrés Bwa et Nuna. Danses, rites et expositions.'
  });

  const afrobeatDate = new Date(now); afrobeatDate.setDate(now.getDate() + 11);
  events.push({
    id: 'fallback-afrobeat', nom: 'Concert Afrobeat - Les Fils du Faso',
    type: 'Concert', date: afrobeatDate.toISOString().split('T')[0], lieu: 'CENASA',
    ville: 'Ouagadougou', heure: '20:00',
    description: 'Concert de musique afrobeat par le groupe Les Fils du Faso. Fusion moderne et tradition.'
  });

  const cafeBoboDate = new Date(now); cafeBoboDate.setDate(now.getDate() + 5);
  events.push({
    id: 'fallback-cafe-bobo', nom: 'Café-Concert Jazz Manège',
    type: 'Café-concert', date: cafeBoboDate.toISOString().split('T')[0], lieu: 'Jazz Club Le Manège',
    ville: 'Bobo-Dioulasso', heure: '20:30',
    description: "Soirée jazz dans l'ambiance feutrée du Manège. Artistes locaux et invités."
  });

  const docDate = new Date(now); docDate.setDate(now.getDate() + 4);
  events.push({
    id: 'fallback-documentaire', nom: 'Projection "Thomas Sankara, l\'Homme Intègre"',
    type: 'Cinéma', date: docDate.toISOString().split('T')[0], lieu: 'Institut Français',
    ville: 'Ouagadougou', heure: '18:30',
    description: "Documentaire sur la vie et l'héritage de Thomas Sankara. Débat après projection."
  });

  const salonLivreDate = new Date(now); salonLivreDate.setDate(now.getDate() + 14);
  events.push({
    id: 'fallback-salon-livre', nom: 'Salon du Livre de Ouagadougou (SILO)',
    type: 'Culturel', date: salonLivreDate.toISOString().split('T')[0], lieu: 'SIAO',
    ville: 'Ouagadougou', heure: '09:00',
    description: 'Salon annuel du livre avec éditeurs africains, auteurs et animations littéraires.'
  });

  const basketDate = new Date(now); basketDate.setDate(now.getDate() + 7);
  events.push({
    id: 'fallback-basket', nom: 'Finale Championnat National de Basketball',
    type: 'Sport', date: basketDate.toISOString().split('T')[0], lieu: 'Palais des Sports',
    ville: 'Ouagadougou', heure: '16:00',
    description: 'Finale du championnat national de basketball masculin. ASFA vs Étoile Filante.'
  });

  events.push({
    id: 'fallback-gospel', nom: 'Concert Gospel - Chorale Nationale',
    type: 'Concert', date: nextSunday.toISOString().split('T')[0], lieu: 'Cathédrale de Ouagadougou',
    ville: 'Ouagadougou', heure: '10:00',
    description: 'Concert de musique gospel par la Chorale Nationale. Chants de louange et spiritualité.'
  });

  const cuisineDate = new Date(now); cuisineDate.setDate(now.getDate() + 3);
  events.push({
    id: 'fallback-cuisine', nom: 'Atelier Cuisine Traditionnelle Burkinabè',
    type: 'Culturel', date: cuisineDate.toISOString().split('T')[0], lieu: 'Centre Culturel Américain',
    ville: 'Ouagadougou', heure: '14:00',
    description: 'Apprenez à préparer le Tô, le Riz gras et autres plats traditionnels. Dégustation incluse.'
  });

  const marionetteDate = new Date(now); marionetteDate.setDate(now.getDate() + 2);
  events.push({
    id: 'fallback-marionnettes', nom: 'Spectacle de Marionnettes Géantes',
    type: 'Théâtre', date: marionetteDate.toISOString().split('T')[0], lieu: 'Place de la Révolution',
    ville: 'Ouagadougou', heure: '17:00',
    description: 'Spectacle de marionnettes géantes par la compagnie Naam. Pour enfants et adultes.'
  });

  events.push({
    id: 'fallback-recreatrales', nom: 'Festival Les Récréâtrales',
    type: 'Festival', date: getNextOccurrence(10, 28), lieu: 'Quartier Gounghin',
    ville: 'Ouagadougou', heure: '18:00',
    description: "Festival de théâtre dans les cours familiales de Ouagadougou. Créations originales et rencontres."
  });

  events.push({
    id: 'fallback-journee-culture', nom: 'Journée Mondiale de la Culture Africaine',
    type: 'Culturel', date: getNextOccurrence(1, 24), lieu: 'CENASA',
    ville: 'Ouagadougou', heure: '09:00',
    description: "Célébration de la diversité culturelle africaine. Expositions, danses et tables rondes."
  });

  const foireDate = new Date(now); foireDate.setDate(now.getDate() + 10);
  events.push({
    id: 'fallback-foire-agri', nom: 'Foire Agricole Nationale',
    type: 'Culturel', date: foireDate.toISOString().split('T')[0], lieu: 'Parc des Expositions',
    ville: 'Bobo-Dioulasso', heure: '08:00',
    description: 'Exposition des produits agricoles burkinabè. Démonstrations et ventes directes producteurs.'
  });

  const nextThursday = new Date(now);
  const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7;
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  events.push({
    id: 'fallback-standup', nom: 'Soirée Stand-Up Comedy',
    type: 'Culturel', date: nextThursday.toISOString().split('T')[0], lieu: 'Chez Momo',
    ville: 'Ouagadougou', heure: '21:00',
    description: 'Soirée humour avec les meilleurs comédiens burkinabè. Rires garantis!'
  });

  const santeDate = new Date(now); santeDate.setDate(now.getDate() + 6);
  events.push({
    id: 'fallback-sante', nom: 'Journée de Sensibilisation à la Santé',
    type: 'Conférence', date: santeDate.toISOString().split('T')[0], lieu: 'Hôpital Yalgado',
    ville: 'Ouagadougou', heure: '08:00',
    description: 'Consultations gratuites et sensibilisation aux maladies courantes. Dépistage offert.'
  });

  return events;
}

let cachedEvents: EventItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000;

let backgroundFetchInProgress = false;

async function fetchRssFeeds(): Promise<any[]> {
  const allArticles: any[] = [];

  const results = await Promise.allSettled(
    EVENT_SOURCES.map(async (sourceUrl) => {
      try {
        const response = await fetch(sourceUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/rss+xml, application/atom+xml, text/html'
          },
          signal: AbortSignal.timeout(8000)
        });
        if (!response.ok) return [];
        const xml = await response.text();
        const parsed = await parser.parseString(xml);
        return parsed.items || [];
      } catch {
        return [];
      }
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allArticles.push(...result.value);
    }
  }

  return allArticles;
}

export function scheduleAutoUpdate() {
  console.log(`Service Events initialisé`);

  setTimeout(() => {
    fetchEventsBackground();
  }, 10000);

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    clearEventsCache();
    fetchEventsBackground();
    setInterval(() => {
      clearEventsCache();
      fetchEventsBackground();
    }, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
}

async function fetchEventsBackground() {
  if (backgroundFetchInProgress) return;
  backgroundFetchInProgress = true;
  try {
    const articles = await fetchRssFeeds();
    const rssEvents = extractEventsFromArticles(articles);
    const fallbackEvents = getFallbackEvents();
    const existingNames = new Set(rssEvents.map(e => e.nom.toLowerCase()));
    for (const fallback of fallbackEvents) {
      if (!existingNames.has(fallback.nom.toLowerCase())) {
        rssEvents.push(fallback);
      }
    }
    rssEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    cachedEvents = rssEvents;
    lastFetchTime = Date.now();
    console.log(`${rssEvents.length} événements chargés (dont ${rssEvents.length - fallbackEvents.length} depuis RSS)`);

    const lowQualityEvents = rssEvents.filter(e => e.lienOfficiel && (!e.affiche || e.affiche.includes('cache-vignettes') || e.affiche.includes('L150x'))).slice(0, 25);
    if (lowQualityEvents.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < lowQualityEvents.length; i += batchSize) {
        const batch = lowQualityEvents.slice(i, i + batchSize);
        await Promise.all(batch.map(async (event) => {
          if (event.lienOfficiel) {
            const ogImage = await fetchOgImageForEvent(event.lienOfficiel);
            if (ogImage) event.affiche = ogImage;
          }
        }));
      }
    }
  } catch (error) {
    console.error('Erreur chargement événements en arrière-plan:', error);
    if (cachedEvents.length === 0) {
      cachedEvents = getFallbackEvents();
      cachedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      lastFetchTime = Date.now();
    }
  } finally {
    backgroundFetchInProgress = false;
  }
}

export async function fetchEvents(): Promise<EventItem[]> {
  const now = Date.now();
  if (cachedEvents.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedEvents;
  }

  if (cachedEvents.length === 0) {
    cachedEvents = getFallbackEvents();
    cachedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    lastFetchTime = now;
  }

  fetchEventsBackground();

  return cachedEvents;
}

export function clearEventsCache() {
  cachedEvents = [];
  lastFetchTime = 0;
}
