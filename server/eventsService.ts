
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

// Sources pour les événements
const EVENT_SOURCES = [
  'https://www.aib.bf/feed/',
  'https://lefaso.net/spip.php?page=backend',
  'https://burkina24.com/feed/',
  'https://www.sidwaya.info/feed/'
];

// Cache en mémoire (1 heure)
let cachedEvents: EventItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure

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

  // Analyser avec l'IA pour extraire les événements
  const events: EventItem[] = [];

  for (const article of allArticles) {
    try {
      const prompt = `Analyse cet article et détermine s'il mentionne un événement au Burkina Faso (concert, fête, compétition, conférence, fermeture de route, etc.).

Titre: ${article.title}
Description: ${article.contentSnippet || article.description || ''}

Si c'est un événement, réponds UNIQUEMENT au format JSON strict suivant (sans texte additionnel):
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

Si ce n'est PAS un événement, réponds: {"isEvent": false}`;

      const response = await generateChatResponse([
        { role: "user", content: prompt }
      ]);

      const jsonMatch = response.message.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;

      const analysis = JSON.parse(jsonMatch[0]);

      if (analysis.isEvent) {
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

  // Trier par date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  cachedEvents = events;
  lastFetchTime = now;

  console.log(`✅ ${events.length} événements extraits`);
  return events;
}

export function clearEventsCache() {
  cachedEvents = [];
  lastFetchTime = 0;
  console.log('🗑️ Cache Events vidé');
}
