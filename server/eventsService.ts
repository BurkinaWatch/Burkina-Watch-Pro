
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

  // Date du jour (début de journée)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Analyser avec l'IA pour extraire les événements
  const events: EventItem[] = [];

  for (const article of allArticles) {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      const prompt = `Analyse cet article et détermine s'il mentionne un événement CONFIRMÉ et FUTUR au Burkina Faso.

DATE ACTUELLE: ${todayStr}

IMPORTANT - NE RETENIR QUE LES ÉVÉNEMENTS:
✓ Confirmés avec date précise ou implicite future
✓ Prenant place AUJOURD'HUI ou APRÈS (pas avant)
✓ Réels et vérifiables (pas hypothétiques ou "à venir")
✓ Avec lieu spécifique, pas vague

CATÉGORIES ÉVÉNEMENTS À CHERCHER:
- CULTUREL: Concerts, Café-concerts, Festivals, Cinéma, Théâtre, Dédicaces, Expositions, Spectacles, Festivals musicaux
- SÉCURITÉ: Manifestations publiques, Rassemblements, Marches, Alertes sécuritaires
- AUTRES: Fêtes nationales, Conférences, Compétitions sportives, Gala, Cérémonie officielle

DÉTECTION DE DATES:
- Interprète "ce weekend", "samedi prochain", "lundi" comme dates futures
- Ignore "hier", "la semaine passée", "l'événement passé"
- Pour les dates implicites, calcule la prochaine occurrence

Titre: ${article.title}
Description: ${article.contentSnippet || article.description || ''}
Date publication: ${article.pubDate || ''}

Si c'est un événement CONFIRMÉ et FUTUR/AUJOURD'HUI, réponds UNIQUEMENT en JSON valide:
{
  "isEvent": true,
  "nom": "nom exact de l'événement",
  "type": "Concert|Café-concert|Festival|Cinéma|Théâtre|Dédicace|Cérémonie|Culturel|Conférence|Sport|Sécurité|Fête nationale",
  "date": "YYYY-MM-DD",
  "lieu": "lieu spécifique",
  "ville": "ville",
  "heure": "HH:MM ou null",
  "description": "description courte 1-2 phrases"
}

SINON (événement passé, vague, ou non confirmé): {"isEvent": false}`;

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
