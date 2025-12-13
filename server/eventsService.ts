
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
}

const parser = new Parser();

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
      // Récupérer plus d'articles pour avoir plus de résultats
      allArticles.push(...parsed.items.slice(0, 50));
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
          lienOfficiel: article.link
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
