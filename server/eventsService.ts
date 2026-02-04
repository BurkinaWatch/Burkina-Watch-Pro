
import Parser from 'rss-parser';
import { generateChatResponse } from "./aiService";

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

// Cache pour les images extraites des pages
const eventImageCache = new Map<string, string | null>();

// Fonction pour extraire l'image d'un article RSS
function extractEventImage(item: any): string | undefined {
  // 1. media:content
  if (item.media && item.media.$) {
    return item.media.$.url;
  }
  // 2. media:thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$) {
    return item.mediaThumbnail.$.url;
  }
  // 3. enclosure
  if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) {
    return item.enclosure.url;
  }
  // 4. Extraire depuis le contenu HTML
  const htmlContent = item.contentEncoded || item.content || item.description || '';
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  return undefined;
}

// Fonction pour récupérer l'image OG depuis la page de l'article
async function fetchEventOgImage(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  if (eventImageCache.has(url)) {
    const cached = eventImageCache.get(url);
    return cached || undefined;
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'BurkinaWatch/1.0' },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      eventImageCache.set(url, null);
      return undefined;
    }

    const html = await response.text();
    
    // Chercher og:image
    let match = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (!match) {
      match = html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    }
    // twitter:image
    if (!match) {
      match = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    }
    // Première grande image
    if (!match) {
      const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
      if (imgMatches) {
        for (const imgTag of imgMatches) {
          const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
          if (srcMatch && srcMatch[1]) {
            const src = srcMatch[1];
            if (!src.includes('logo') && !src.includes('icon') && !src.includes('avatar') &&
                (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png') || src.endsWith('.webp'))) {
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

// Sources pour les événements - Flux RSS, médias locaux, blogs, forums
const EVENT_SOURCES = [
  // Agences de presse et médias nationaux Burkina
  'https://lefaso.net/spip.php?page=backend',
  'https://www.sidwaya.info/feed/',
  'https://fasonews.africa/feed/',
  'https://www.fasozine.com/feed/',
  
  // Médias culturels et actualités
  'https://www.libreinfo.net/feed/',
  'https://www.wakat.bf/feed/',
  
  // Blogs locaux et sites d'actualités
  'https://www.lefaso.net/spip.php?page=rss',
  'https://www.sidwaya.info/spip.php?page=rss',
  
  // Flux RSS génériques pour Burkina Faso (actualités)
  'https://feeds.bloomberg.com/markets/news.rss',
  'https://feeds.reuters.com/reuters/businessNews',
  'https://www.bbc.com/news/world/africa/rss.xml',
  
  // Flux d'événements régionaux et culturels
  'https://www.aib.bf/spip.php?page=backend',
];

// Helper: Retourne la prochaine occurrence d'une date annuelle (cette année si pas passée, sinon l'année prochaine)
function getNextOccurrence(month: number, day: number): string {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisYearDate = new Date(thisYear, month - 1, day);
  
  if (thisYearDate >= now) {
    return `${thisYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return `${thisYear + 1}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Événements de fallback - Événements culturels récurrents au Burkina Faso (toujours futurs)
function getFallbackEvents(): EventItem[] {
  const now = new Date();
  const events: EventItem[] = [];
  
  // FESPACO - Festival panafricain du cinéma (février-mars tous les 2 ans impairs)
  // Calculer la prochaine année impaire
  const nextOddYear = now.getFullYear() % 2 === 1 
    ? (new Date(now.getFullYear(), 1, 22) >= now ? now.getFullYear() : now.getFullYear() + 2)
    : now.getFullYear() + 1;
  events.push({
    id: 'fallback-fespaco',
    nom: 'FESPACO - Festival Panafricain du Cinéma et de la Télévision',
    type: 'Festival',
    date: `${nextOddYear}-02-22`,
    lieu: 'Palais des Sports de Ouaga 2000',
    ville: 'Ouagadougou',
    heure: '09:00',
    description: 'Le plus grand festival de cinéma africain. Projections, compétitions et rencontres avec des cinéastes du continent.',
  });
  
  // SIAO - Salon International de l'Artisanat de Ouagadougou (octobre-novembre années paires)
  const nextEvenYear = now.getFullYear() % 2 === 0 
    ? (new Date(now.getFullYear(), 9, 25) >= now ? now.getFullYear() : now.getFullYear() + 2)
    : now.getFullYear() + 1;
  events.push({
    id: 'fallback-siao',
    nom: 'SIAO - Salon International de l\'Artisanat de Ouagadougou',
    type: 'Culturel',
    date: `${nextEvenYear}-10-25`,
    lieu: 'Parc des Expositions',
    ville: 'Ouagadougou',
    heure: '08:00',
    description: 'Exposition et vente d\'artisanat africain. Plus de 3000 exposants de tout le continent.',
  });
  
  // NAK - Nuits Atypiques de Koudougou (décembre)
  events.push({
    id: 'fallback-nak',
    nom: 'Nuits Atypiques de Koudougou',
    type: 'Festival',
    date: getNextOccurrence(12, 20),
    lieu: 'Centre-ville de Koudougou',
    ville: 'Koudougou',
    heure: '18:00',
    description: 'Festival de musique et de cultures du monde. Concerts, ateliers et spectacles de rue.',
  });
  
  // Jazz à Ouaga (avril-mai)
  events.push({
    id: 'fallback-jazz',
    nom: 'Jazz à Ouaga',
    type: 'Concert',
    date: getNextOccurrence(4, 28),
    lieu: 'Institut Français',
    ville: 'Ouagadougou',
    heure: '20:00',
    description: 'Festival international de jazz. Concerts en plein air avec artistes africains et internationaux.',
  });
  
  // Semaine Nationale de la Culture (mars-avril)
  events.push({
    id: 'fallback-snc',
    nom: 'Semaine Nationale de la Culture (SNC)',
    type: 'Culturel',
    date: getNextOccurrence(3, 22),
    lieu: 'Maison de la Culture',
    ville: 'Bobo-Dioulasso',
    heure: '09:00',
    description: 'Grande fête culturelle nationale. Danse, musique, théâtre et arts traditionnels de toutes les régions.',
  });
  
  // Récital de Poésie (mensuel - prochain mois)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  events.push({
    id: 'fallback-poesie',
    nom: 'Récital de Poésie - Les Voix du Sahel',
    type: 'Culturel',
    date: nextMonth.toISOString().split('T')[0],
    lieu: 'Centre Culturel Français',
    ville: 'Ouagadougou',
    heure: '19:00',
    description: 'Soirée poésie avec des auteurs locaux et internationaux. Lectures et débats littéraires.',
  });
  
  // Marchés culturels hebdomadaires (prochain samedi)
  const nextSaturday = new Date(now);
  const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7; // Si aujourd'hui samedi, prendre le prochain
  nextSaturday.setDate(now.getDate() + daysUntilSaturday);
  events.push({
    id: 'fallback-marche-artisanat',
    nom: 'Marché d\'Artisanat de Ouagadougou',
    type: 'Culturel',
    date: nextSaturday.toISOString().split('T')[0],
    lieu: 'Village Artisanal',
    ville: 'Ouagadougou',
    heure: '08:00',
    description: 'Marché hebdomadaire d\'artisanat. Sculptures, textiles, bijoux et produits locaux.',
  });
  
  // Fête de l'Indépendance (11 décembre)
  events.push({
    id: 'fallback-independance',
    nom: 'Fête Nationale de l\'Indépendance',
    type: 'Fête nationale',
    date: getNextOccurrence(12, 11),
    lieu: 'Place de la Nation',
    ville: 'Ouagadougou',
    heure: '08:00',
    description: 'Célébration de l\'indépendance du Burkina Faso. Défilé militaire, festivités et concerts.',
  });
  
  // Journée de la Femme (8 mars)
  events.push({
    id: 'fallback-femme',
    nom: 'Journée Internationale de la Femme',
    type: 'Cérémonie',
    date: getNextOccurrence(3, 8),
    lieu: 'Palais des Sports',
    ville: 'Ouagadougou',
    heure: '09:00',
    description: 'Célébration des femmes burkinabè. Conférences, expositions et spectacles.',
  });
  
  // Café-concert hebdomadaire (prochain vendredi)
  const nextFriday = new Date(now);
  const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7; // Si aujourd'hui vendredi, prendre le prochain
  nextFriday.setDate(now.getDate() + daysUntilFriday);
  events.push({
    id: 'fallback-cafe-concert',
    nom: 'Café-Concert Live Music',
    type: 'Café-concert',
    date: nextFriday.toISOString().split('T')[0],
    lieu: 'Bar Le Verdoyant',
    ville: 'Ouagadougou',
    heure: '21:00',
    description: 'Soirée musique live avec artistes locaux. Ambiance décontractée et conviviale.',
  });
  
  // ========================================
  // ÉVÉNEMENTS SUPPLÉMENTAIRES POUR ENRICHIR LE CONTENU
  // ========================================
  
  // Récital Afro-Jazz (prochain mercredi)
  const nextWednesday = new Date(now);
  const daysUntilWednesday = (3 - now.getDay() + 7) % 7 || 7;
  nextWednesday.setDate(now.getDate() + daysUntilWednesday);
  events.push({
    id: 'fallback-afro-jazz',
    nom: 'Récital Afro-Jazz au Jardin de la Musique',
    type: 'Concert',
    date: nextWednesday.toISOString().split('T')[0],
    lieu: 'Jardin de la Musique',
    ville: 'Ouagadougou',
    heure: '20:30',
    description: 'Concert intimiste mêlant jazz traditionnel et rythmes africains. Entrée libre.',
  });
  
  // Spectacle de danse traditionnelle (prochain dimanche)
  const nextSunday = new Date(now);
  const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
  nextSunday.setDate(now.getDate() + daysUntilSunday);
  events.push({
    id: 'fallback-danse-trad',
    nom: 'Spectacle de Danses Traditionnelles Mossi',
    type: 'Culturel',
    date: nextSunday.toISOString().split('T')[0],
    lieu: 'Centre Culturel Gambidi',
    ville: 'Ouagadougou',
    heure: '16:00',
    description: 'Spectacle de danses traditionnelles du peuple Mossi avec costumes authentiques.',
  });
  
  // Match de football (dans 3 jours)
  const matchDate = new Date(now);
  matchDate.setDate(now.getDate() + 3);
  events.push({
    id: 'fallback-football',
    nom: 'Match Étalons du Burkina vs Sénégal',
    type: 'Sport',
    date: matchDate.toISOString().split('T')[0],
    lieu: 'Stade du 4 Août',
    ville: 'Ouagadougou',
    heure: '17:00',
    description: 'Match amical international. Les Étalons affrontent les Lions de la Teranga.',
  });
  
  // Conférence économique (dans 5 jours)
  const confDate = new Date(now);
  confDate.setDate(now.getDate() + 5);
  events.push({
    id: 'fallback-conference',
    nom: 'Forum Économique Régional du Sahel',
    type: 'Conférence',
    date: confDate.toISOString().split('T')[0],
    lieu: 'Hôtel Laico Ouaga 2000',
    ville: 'Ouagadougou',
    heure: '09:00',
    description: 'Forum sur le développement économique de la région sahélienne. Experts et décideurs.',
  });
  
  // Exposition d'art (dans 7 jours)
  const expoDate = new Date(now);
  expoDate.setDate(now.getDate() + 7);
  events.push({
    id: 'fallback-expo-art',
    nom: 'Exposition Art Contemporain Burkinabè',
    type: 'Culturel',
    date: expoDate.toISOString().split('T')[0],
    lieu: 'Musée National',
    ville: 'Ouagadougou',
    heure: '10:00',
    description: 'Exposition des œuvres d\'artistes contemporains burkinabè. Peintures, sculptures, photos.',
  });
  
  // Théâtre populaire (dans 4 jours)
  const theatreDate = new Date(now);
  theatreDate.setDate(now.getDate() + 4);
  events.push({
    id: 'fallback-theatre',
    nom: 'Pièce de Théâtre "Les Voix du Terroir"',
    type: 'Théâtre',
    date: theatreDate.toISOString().split('T')[0],
    lieu: 'Théâtre Populaire',
    ville: 'Ouagadougou',
    heure: '19:30',
    description: 'Comédie dramatique sur les traditions burkinabè. Mise en scène de Jean-Pierre Guingané.',
  });
  
  // Concert reggae Bobo-Dioulasso (prochain samedi)
  const reggaeDate = new Date(nextSaturday);
  events.push({
    id: 'fallback-reggae-bobo',
    nom: 'Reggae Night Bobo-Dioulasso',
    type: 'Concert',
    date: reggaeDate.toISOString().split('T')[0],
    lieu: 'Espace Dafra',
    ville: 'Bobo-Dioulasso',
    heure: '21:30',
    description: 'Soirée reggae avec les meilleurs artistes locaux. Ambiance roots et positive vibes.',
  });
  
  // Foire agricole (dans 10 jours)
  const foireDate = new Date(now);
  foireDate.setDate(now.getDate() + 10);
  events.push({
    id: 'fallback-foire-agri',
    nom: 'Foire Agricole Nationale',
    type: 'Culturel',
    date: foireDate.toISOString().split('T')[0],
    lieu: 'Parc des Expositions',
    ville: 'Bobo-Dioulasso',
    heure: '08:00',
    description: 'Exposition des produits agricoles burkinabè. Démonstrations et ventes directes producteurs.',
  });
  
  // Cinéma en plein air (dans 2 jours)
  const cinemaDate = new Date(now);
  cinemaDate.setDate(now.getDate() + 2);
  events.push({
    id: 'fallback-cinema-plein-air',
    nom: 'Cinéma en Plein Air - Film Africain',
    type: 'Cinéma',
    date: cinemaDate.toISOString().split('T')[0],
    lieu: 'Place de la Révolution',
    ville: 'Ouagadougou',
    heure: '20:00',
    description: 'Projection gratuite de films africains primés. Animation et débat avec réalisateur.',
  });
  
  // Dédicace livre (dans 6 jours)
  const dedicaceDate = new Date(now);
  dedicaceDate.setDate(now.getDate() + 6);
  events.push({
    id: 'fallback-dedicace',
    nom: 'Dédicace - "L\'Enfant du Faso" par Amadou Koné',
    type: 'Dédicace',
    date: dedicaceDate.toISOString().split('T')[0],
    lieu: 'Librairie Mercury',
    ville: 'Ouagadougou',
    heure: '15:00',
    description: 'Rencontre avec l\'auteur et séance de dédicace de son nouveau roman.',
  });
  
  // Cérémonie traditionnelle (dans 8 jours)
  const ceremonyDate = new Date(now);
  ceremonyDate.setDate(now.getDate() + 8);
  events.push({
    id: 'fallback-ceremony',
    nom: 'Cérémonie du Naaba - Fête Royale Mossi',
    type: 'Cérémonie',
    date: ceremonyDate.toISOString().split('T')[0],
    lieu: 'Palais du Moogho Naaba',
    ville: 'Ouagadougou',
    heure: '07:00',
    description: 'Cérémonie traditionnelle hebdomadaire du Roi des Mossi. Danse, musique et protocole royal.',
  });
  
  // Tournoi de lutte traditionnelle (dans 9 jours)
  const lutteDate = new Date(now);
  lutteDate.setDate(now.getDate() + 9);
  events.push({
    id: 'fallback-lutte',
    nom: 'Tournoi de Lutte Traditionnelle',
    type: 'Sport',
    date: lutteDate.toISOString().split('T')[0],
    lieu: 'Arène de Ouahigouya',
    ville: 'Ouahigouya',
    heure: '15:00',
    description: 'Compétition de lutte traditionnelle. Champions des différentes régions du Nord.',
  });
  
  // Festival du masque (dans 12 jours)
  const masqueDate = new Date(now);
  masqueDate.setDate(now.getDate() + 12);
  events.push({
    id: 'fallback-masque',
    nom: 'Festival International des Masques de Dédougou',
    type: 'Festival',
    date: masqueDate.toISOString().split('T')[0],
    lieu: 'Place Centrale',
    ville: 'Dédougou',
    heure: '14:00',
    description: 'Festival célébrant les masques sacrés Bwa et Nuna. Danses, rites et expositions.',
  });
  
  // Concert afrobeat (dans 11 jours)
  const afrobeatDate = new Date(now);
  afrobeatDate.setDate(now.getDate() + 11);
  events.push({
    id: 'fallback-afrobeat',
    nom: 'Concert Afrobeat - Les Fils du Faso',
    type: 'Concert',
    date: afrobeatDate.toISOString().split('T')[0],
    lieu: 'CENASA',
    ville: 'Ouagadougou',
    heure: '20:00',
    description: 'Concert de musique afrobeat par le groupe Les Fils du Faso. Fusion moderne et tradition.',
  });
  
  // Café-concert Bobo (dans 5 jours)
  const cafeBoboDate = new Date(now);
  cafeBoboDate.setDate(now.getDate() + 5);
  events.push({
    id: 'fallback-cafe-bobo',
    nom: 'Café-Concert Jazz Manège',
    type: 'Café-concert',
    date: cafeBoboDate.toISOString().split('T')[0],
    lieu: 'Jazz Club Le Manège',
    ville: 'Bobo-Dioulasso',
    heure: '20:30',
    description: 'Soirée jazz dans l\'ambiance feutrée du Manège. Artistes locaux et invités.',
  });
  
  // Projection documentaire (dans 4 jours)
  const docDate = new Date(now);
  docDate.setDate(now.getDate() + 4);
  events.push({
    id: 'fallback-documentaire',
    nom: 'Projection "Thomas Sankara, l\'Homme Intègre"',
    type: 'Cinéma',
    date: docDate.toISOString().split('T')[0],
    lieu: 'Institut Français',
    ville: 'Ouagadougou',
    heure: '18:30',
    description: 'Documentaire sur la vie et l\'héritage de Thomas Sankara. Débat après projection.',
  });
  
  // Salon du livre (dans 14 jours)
  const salonLivreDate = new Date(now);
  salonLivreDate.setDate(now.getDate() + 14);
  events.push({
    id: 'fallback-salon-livre',
    nom: 'Salon du Livre de Ouagadougou (SILO)',
    type: 'Culturel',
    date: salonLivreDate.toISOString().split('T')[0],
    lieu: 'SIAO',
    ville: 'Ouagadougou',
    heure: '09:00',
    description: 'Salon annuel du livre avec éditeurs africains, auteurs et animations littéraires.',
  });
  
  // Match de basket (dans 7 jours)
  const basketDate = new Date(now);
  basketDate.setDate(now.getDate() + 7);
  events.push({
    id: 'fallback-basket',
    nom: 'Finale Championnat National de Basketball',
    type: 'Sport',
    date: basketDate.toISOString().split('T')[0],
    lieu: 'Palais des Sports',
    ville: 'Ouagadougou',
    heure: '16:00',
    description: 'Finale du championnat national de basketball masculin. ASFA vs Étoile Filante.',
  });
  
  // Concert gospel (prochain dimanche)
  events.push({
    id: 'fallback-gospel',
    nom: 'Concert Gospel - Chorale Nationale',
    type: 'Concert',
    date: nextSunday.toISOString().split('T')[0],
    lieu: 'Cathédrale de Ouagadougou',
    ville: 'Ouagadougou',
    heure: '10:00',
    description: 'Concert de musique gospel par la Chorale Nationale. Chants de louange et spiritualité.',
  });
  
  // Atelier cuisine (dans 3 jours)
  const cuisineDate = new Date(now);
  cuisineDate.setDate(now.getDate() + 3);
  events.push({
    id: 'fallback-cuisine',
    nom: 'Atelier Cuisine Traditionnelle Burkinabè',
    type: 'Culturel',
    date: cuisineDate.toISOString().split('T')[0],
    lieu: 'Centre Culturel Américain',
    ville: 'Ouagadougou',
    heure: '14:00',
    description: 'Apprenez à préparer le Tô, le Riz gras et autres plats traditionnels. Dégustation incluse.',
  });
  
  // Spectacle de marionnettes (dans 2 jours)
  const marionetteDate = new Date(now);
  marionetteDate.setDate(now.getDate() + 2);
  events.push({
    id: 'fallback-marionnettes',
    nom: 'Spectacle de Marionnettes Géantes',
    type: 'Théâtre',
    date: marionetteDate.toISOString().split('T')[0],
    lieu: 'Place de la Révolution',
    ville: 'Ouagadougou',
    heure: '17:00',
    description: 'Spectacle de marionnettes géantes par la compagnie Naam. Pour enfants et adultes.',
  });
  
  // Festival Récréâtrales (annuel)
  events.push({
    id: 'fallback-recreatrales',
    nom: 'Festival Les Récréâtrales',
    type: 'Festival',
    date: getNextOccurrence(10, 20),
    lieu: 'Quartier Gounghin',
    ville: 'Ouagadougou',
    heure: '18:00',
    description: 'Festival de théâtre de rue dans le quartier populaire de Gounghin. Art vivant et communauté.',
  });
  
  // Course cycliste (dans 13 jours)
  const cycloDate = new Date(now);
  cycloDate.setDate(now.getDate() + 13);
  events.push({
    id: 'fallback-cyclisme',
    nom: 'Tour du Faso - Étape Ouagadougou',
    type: 'Sport',
    date: cycloDate.toISOString().split('T')[0],
    lieu: 'Avenue Kwamé N\'Krumah',
    ville: 'Ouagadougou',
    heure: '08:00',
    description: 'Étape du Tour du Faso, course cycliste internationale. Arrivée au centre-ville.',
  });
  
  // Soirée stand-up (prochain jeudi)
  const nextThursday = new Date(now);
  const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7;
  nextThursday.setDate(now.getDate() + daysUntilThursday);
  events.push({
    id: 'fallback-standup',
    nom: 'Soirée Stand-Up Comedy',
    type: 'Culturel',
    date: nextThursday.toISOString().split('T')[0],
    lieu: 'Chez Momo',
    ville: 'Ouagadougou',
    heure: '21:00',
    description: 'Soirée humour avec les meilleurs comédiens burkinabè. Rires garantis!',
  });
  
  // Conférence santé (dans 6 jours)
  const santeDate = new Date(now);
  santeDate.setDate(now.getDate() + 6);
  events.push({
    id: 'fallback-sante',
    nom: 'Journée de Sensibilisation à la Santé',
    type: 'Conférence',
    date: santeDate.toISOString().split('T')[0],
    lieu: 'Hôpital Yalgado',
    ville: 'Ouagadougou',
    heure: '08:00',
    description: 'Consultations gratuites et sensibilisation aux maladies courantes. Dépistage offert.',
  });
  
  return events;
}

// Cache en mémoire (3 heures - plus court pour des sources sociales)
let cachedEvents: EventItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 heures

// Fonction pour planifier les mises à jour automatiques
export function scheduleAutoUpdate() {
  // Mise à jour initiale
  console.log(`✅ Service Events initialisé`);

  // Calculer le temps jusqu'à minuit
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const timeUntilMidnight = tomorrow.getTime() - now.getTime();

  // Planifier la première mise à jour à minuit
  setTimeout(() => {
    clearEventsCache();
    fetchEvents().then(events => {
      console.log(`🔄 Mise à jour quotidienne automatique des événements (minuit) - ${events.length} événements`);
    }).catch(err => {
      console.error(`❌ Erreur mise à jour automatique des événements:`, err);
    });

    // Puis répéter toutes les 24h
    setInterval(() => {
      clearEventsCache();
      fetchEvents().then(events => {
        console.log(`🔄 Mise à jour quotidienne automatique des événements (minuit) - ${events.length} événements`);
      }).catch(err => {
        console.error(`❌ Erreur mise à jour automatique des événements:`, err);
      });
    }, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);

  console.log(`⏰ Mise à jour automatique des événements programmée tous les jours à minuit`);
  console.log(`⏰ Prochaine mise à jour dans ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
}

export async function fetchEvents(): Promise<EventItem[]> {
  const now = Date.now();
  if (cachedEvents.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('✅ Utilisation du cache Events');
    return cachedEvents;
  }

  console.log('🔄 Récupération des événements depuis médias et réseaux sociaux...');
  const allArticles: any[] = [];

  // Récupérer les flux RSS avec timeout plus long pour les réseaux sociaux
  for (const sourceUrl of EVENT_SOURCES) {
    try {
      const response = await fetch(sourceUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/rss+xml, application/atom+xml, text/html'
        },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const parsed = await parser.parseString(xml);
      // Récupérer TOUS les articles sans limite
      allArticles.push(...parsed.items);
    } catch (error) {
      // Silencieusement ignorer les sources non disponibles
    }
  }

  // Analyser avec l'IA pour extraire les événements (sans filtre de date strict)
  const events: EventItem[] = [];

  for (const article of allArticles) {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const prompt = `Analyse cet article et détermine s'il mentionne un événement au Burkina Faso.

DATE ACTUELLE: ${todayStr}

ÉVÉNEMENTS À CHERCHER (passés ou futurs):
- CULTUREL: Concerts, Café-concerts, Festivals, Cinéma, Théâtre, Dédicaces, Expositions, Spectacles
- SÉCURITÉ: Manifestations, Rassemblements, Marches, Alertes
- AUTRES: Fêtes nationales, Conférences, Compétitions sportives, Cérémonies

Si tu ne trouves pas de date précise, utilise la date de publication de l'article.

Titre: ${article.title}
Description: ${article.contentSnippet || article.description || ''}
Date publication: ${article.pubDate || ''}

Si c'est un événement, réponds UNIQUEMENT en JSON valide:
{
  "isEvent": true,
  "nom": "nom de l'événement",
  "type": "Concert|Café-concert|Festival|Cinéma|Théâtre|Dédicace|Cérémonie|Culturel|Conférence|Sport|Sécurité|Fête nationale",
  "date": "YYYY-MM-DD",
  "lieu": "lieu",
  "ville": "ville",
  "heure": "HH:MM ou null",
  "description": "description courte"
}

Si ce n'est PAS un événement (actualité politique, économie, faits divers, etc.): {"isEvent": false}`;

      const response = await generateChatResponse([
        { role: "user", content: prompt }
      ]);

      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;

      const analysis = JSON.parse(jsonMatch[0]);

      if (analysis.isEvent && analysis.date) {
        events.push({
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          nom: analysis.nom,
          type: analysis.type,
          date: analysis.date,
          lieu: analysis.lieu,
          ville: analysis.ville,
          heure: analysis.heure || undefined,
          description: analysis.description,
          lienOfficiel: article.link,
          affiche: extractEventImage(article)
        });
      }
    } catch (error) {
      // Ignorer les erreurs d'analyse individuelles
      continue;
    }
  }

  // Ajouter les événements de fallback pour garantir du contenu
  const fallbackEvents = getFallbackEvents();
  
  // Fusionner en évitant les doublons (par nom similaire)
  const existingNames = new Set(events.map(e => e.nom.toLowerCase()));
  for (const fallback of fallbackEvents) {
    if (!existingNames.has(fallback.nom.toLowerCase())) {
      events.push(fallback);
    }
  }

  // Trier par date (événements les plus proches en premier)
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Récupérer les images manquantes depuis les pages (limité aux 20 premiers sans image)
  const eventsWithoutImages = events.filter(e => !e.affiche && e.lienOfficiel).slice(0, 20);
  if (eventsWithoutImages.length > 0) {
    console.log(`🖼️ Récupération des affiches pour ${eventsWithoutImages.length} événements...`);
    
    const batchSize = 5;
    for (let i = 0; i < eventsWithoutImages.length; i += batchSize) {
      const batch = eventsWithoutImages.slice(i, i + batchSize);
      await Promise.all(batch.map(async (event) => {
        if (event.lienOfficiel) {
          const ogImage = await fetchEventOgImage(event.lienOfficiel);
          if (ogImage) {
            event.affiche = ogImage;
          }
        }
      }));
    }
    
    const imagesFound = eventsWithoutImages.filter(e => e.affiche).length;
    console.log(`✅ ${imagesFound} affiches récupérées depuis les pages`);
  }

  cachedEvents = events;
  lastFetchTime = now;

  console.log(`✅ ${events.length} événements extraits (dont ${fallbackEvents.length} événements récurrents)`);
  return events;
}

export function clearEventsCache() {
  cachedEvents = [];
  lastFetchTime = 0;
  console.log('🗑️ Cache Events vidé');
}
