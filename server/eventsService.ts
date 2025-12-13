
import Parser from 'rss-parser';
import { generateChatResponse } from "./aiService";

interface EventItem {
  id: string;
  nom: string;
  type: "Fête nationale" | "Culturel" | "Concert" | "Conférence" | "Sport" | "Infrastructure";
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

// Sources pour les événements - Flux RSS, médias locaux, etc.
const EVENT_SOURCES = [
  // Agences de presse et médias nationaux
  'https://www.aib.bf/feed/',
  'https://lefaso.net/spip.php?page=backend',
  'https://burkina24.com/feed/',
  'https://www.sidwaya.info/feed/',
  'https://fasonews.africa/feed/',
  'https://www.fasozine.com/feed/',
  
  // Médias culturels et actualités
  'https://www.libreinfo.net/feed/',
  'https://www.wakat.bf/feed/',
  
  // Chaînes TV et radio (flux web si disponibles)
  'https://www.rtb.bf/feed/',
  
  // Médias régionaux
  'https://www.leconomistedufaso.bf/feed/',
  'https://www.journaldufaso.com/feed/'
];

// Cache en mémoire (6 heures pour réduire les appels API)
let cachedEvents: EventItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 heures

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

  console.log('🔄 Récupération des événements...');
  const allArticles: any[] = [];

  // Récupérer les flux RSS
  for (const sourceUrl of EVENT_SOURCES) {
    try {
      const response = await fetch(sourceUrl, {
        headers: { 'User-Agent': 'BurkinaWatch/1.0' },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) continue;

      const xml = await response.text();
      const parsed = await parser.parseString(xml);
      allArticles.push(...parsed.items.slice(0, 20));
    } catch (error) {
      console.error(`❌ Erreur source ${sourceUrl}:`, error);
    }
  }

  // Date du jour (début de journée)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Analyser avec l'IA pour extraire les événements
  const events: EventItem[] = [];

  for (const article of allArticles) {
    try {
      const prompt = `Analyse cet article et détermine s'il mentionne un événement FUTUR ou D'AUJOURD'HUI au Burkina Faso (concert, fête, compétition, conférence, fermeture de route, etc.).

IMPORTANT: Ignore les événements passés. N'extrais que les événements qui se déroulent aujourd'hui ou dans le futur.

Titre: ${article.title}
Description: ${article.contentSnippet || article.description || ''}
Date de publication: ${article.pubDate || ''}

Si c'est un événement FUTUR ou D'AUJOURD'HUI, réponds UNIQUEMENT au format JSON strict suivant (sans texte additionnel):
{
  "isEvent": true,
  "nom": "nom de l'événement",
  "type": "Fête nationale|Culturel|Concert|Conférence|Sport|Infrastructure",
  "date": "YYYY-MM-DD",
  "lieu": "lieu précis",
  "ville": "ville",
  "heure": "HH:MM ou null",
  "description": "description courte"
}

Si ce n'est PAS un événement ou si c'est un événement PASSÉ, réponds: {"isEvent": false}`;

      const response = await generateChatResponse([
        { role: "user", content: prompt }
      ]);

      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;

      const analysis = JSON.parse(jsonMatch[0]);

      if (analysis.isEvent && analysis.date) {
        const eventDate = new Date(analysis.date);
        eventDate.setHours(0, 0, 0, 0);
        
        // Filtrer les événements passés
        if (eventDate >= today) {
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
      }
    } catch (error) {
      // Ignorer les erreurs d'analyse individuelles
      continue;
    }
  }

  // Trier par date (événements les plus proches en premier)
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  cachedEvents = events;
  lastFetchTime = now;

  console.log(`✅ ${events.length} événements futurs extraits`);
  return events;
}

export function clearEventsCache() {
  cachedEvents = [];
  lastFetchTime = 0;
  console.log('🗑️ Cache Events vidé');
}
