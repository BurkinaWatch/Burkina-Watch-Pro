
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import Parser from 'rss-parser';

const geminiApiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const geminiClient = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['dc:creator', 'creator']
    ]
  }
});

export interface AnalyzedArticle {
  id: string;
  titre: string;
  resume: string;
  categorie: string;
  source: string;
  lien: string;
  date: string;
  pertinence: number;
  motsCles: string[];
}

// Configuration des sources médias
const MEDIA_SOURCES = [
  {
    url: 'https://www.aib.bf/feed/',
    source: 'AIB',
    type: 'Officiel'
  },
  {
    url: 'https://lefaso.net/spip.php?page=backend',
    source: 'Lefaso.net',
    type: 'Média'
  },
  {
    url: 'https://burkina24.com/feed/',
    source: 'Burkina24',
    type: 'Média'
  },
  {
    url: 'https://www.sidwaya.info/feed/',
    source: 'Sidwaya',
    type: 'Officiel'
  }
];

// Catégories détectables
const CATEGORIES = [
  "Sécurité",
  "Routes",
  "Santé",
  "Gouvernement",
  "Social",
  "Économie",
  "Culture",
  "Éducation",
  "Environnement",
  "Justice"
];

// Cache des articles analysés (6 heures)
let cachedArticles: AnalyzedArticle[] = [];
let lastAnalysisTime = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 heures

/**
 * Nettoie le texte des balises HTML et caractères indésirables
 */
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Supprimer HTML
    .replace(/&[a-z]+;/gi, ' ') // Supprimer entités HTML
    .replace(/\s+/g, ' ') // Normaliser espaces
    .replace(/lire la suite|read more|cliquez ici|click here/gi, '') // Supprimer CTA
    .trim()
    .substring(0, 500); // Limiter à 500 caractères
}

/**
 * Analyse un article avec l'IA pour extraire catégorie, résumé et pertinence
 */
async function analyzeArticleWithAI(titre: string, description: string): Promise<{
  categorie: string;
  resume: string;
  pertinence: number;
  motsCles: string[];
}> {
  const prompt = `Tu es un assistant IA pour analyser les actualités du Burkina Faso.

Analyse cet article et réponds UNIQUEMENT en JSON valide :

Titre: ${titre}
Description: ${description}

Détermine:
1. La catégorie principale parmi: ${CATEGORIES.join(', ')}
2. Un résumé en 2-3 phrases maximum (français simple)
3. La pertinence pour les citoyens (0-100)
4. 3-5 mots-clés pertinents

Format de réponse (JSON uniquement):
{
  "categorie": "Sécurité",
  "resume": "Résumé court et clair...",
  "pertinence": 85,
  "motsCles": ["mot1", "mot2", "mot3"]
}`;

  try {
    // Essayer Gemini en premier
    if (geminiClient) {
      const model = geminiClient.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 300,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extraire le JSON de la réponse
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          categorie: parsed.categorie || "Général",
          resume: parsed.resume || description.substring(0, 150),
          pertinence: parsed.pertinence || 50,
          motsCles: parsed.motsCles || []
        };
      }
    }

    // Fallback sur Groq
    if (groqClient) {
      const completion = await groqClient.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      });

      const text = completion.choices[0]?.message?.content || "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          categorie: parsed.categorie || "Général",
          resume: parsed.resume || description.substring(0, 150),
          pertinence: parsed.pertinence || 50,
          motsCles: parsed.motsCles || []
        };
      }
    }
  } catch (error) {
    console.error("❌ Erreur analyse IA:", error);
  }

  // Fallback sans IA
  return {
    categorie: detectCategoryByKeywords(titre + " " + description),
    resume: description.substring(0, 150) + "...",
    pertinence: 50,
    motsCles: extractKeywords(titre)
  };
}

/**
 * Détecte la catégorie par mots-clés (fallback)
 */
function detectCategoryByKeywords(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.match(/police|gendarme|terrorisme|attaque|sécurité|criminalité/)) return "Sécurité";
  if (lowerText.match(/route|autoroute|trafic|circulation|accident/)) return "Routes";
  if (lowerText.match(/santé|hôpital|maladie|vaccin|covid|médecin/)) return "Santé";
  if (lowerText.match(/gouvernement|président|ministre|assemblée|décret/)) return "Gouvernement";
  if (lowerText.match(/société|population|citoyens|communauté/)) return "Social";
  if (lowerText.match(/économie|budget|commerce|entreprise|finance/)) return "Économie";
  if (lowerText.match(/culture|festival|artiste|musique|cinéma/)) return "Culture";
  if (lowerText.match(/école|université|éducation|étudiant|formation/)) return "Éducation";
  if (lowerText.match(/environnement|climat|eau|forêt|pollution/)) return "Environnement";
  
  return "Général";
}

/**
 * Extrait des mots-clés simples
 */
function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 4 && !['cette', 'dans', 'pour', 'avec', 'sans'].includes(w));
  
  return [...new Set(words)].slice(0, 5);
}

/**
 * Récupère et analyse les articles
 */
export async function fetchAndAnalyzeArticles(): Promise<AnalyzedArticle[]> {
  const now = Date.now();
  
  // Vérifier le cache
  if (cachedArticles.length > 0 && (now - lastAnalysisTime) < CACHE_DURATION) {
    console.log('✅ Utilisation du cache d\'articles analysés');
    return cachedArticles;
  }

  console.log('🔄 Récupération et analyse des articles...');
  const analyzedArticles: AnalyzedArticle[] = [];

  // Récupérer les flux RSS
  const promises = MEDIA_SOURCES.map(async (source) => {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'BurkinaWatch/2.0' },
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        console.warn(`⚠️ Erreur HTTP ${response.status} pour ${source.source}`);
        return [];
      }

      const xml = await response.text();
      const parsed = await parser.parseString(xml);

      // Analyser les 5 articles les plus récents de chaque source
      const articles = await Promise.all(
        parsed.items.slice(0, 5).map(async (item, index) => {
          const titre = cleanText(item.title || 'Sans titre');
          const description = cleanText(item.contentSnippet || item.content || item.description || '');

          // Analyser avec l'IA
          const analysis = await analyzeArticleWithAI(titre, description);

          return {
            id: `${source.source}-${Date.now()}-${index}`,
            titre,
            resume: analysis.resume,
            categorie: analysis.categorie,
            source: source.source,
            lien: item.link || '',
            date: item.pubDate || item.isoDate || new Date().toISOString(),
            pertinence: analysis.pertinence,
            motsCles: analysis.motsCles
          };
        })
      );

      return articles;
    } catch (error) {
      console.error(`❌ Erreur pour ${source.source}:`, error);
      return [];
    }
  });

  const results = await Promise.allSettled(promises);
  
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      analyzedArticles.push(...result.value);
    }
  });

  // Trier par pertinence et date
  analyzedArticles.sort((a, b) => {
    const pertDiff = b.pertinence - a.pertinence;
    if (pertDiff !== 0) return pertDiff;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Filtrer les articles peu pertinents (< 40)
  const filtered = analyzedArticles.filter(a => a.pertinence >= 40);

  // Mettre à jour le cache
  cachedArticles = filtered;
  lastAnalysisTime = now;

  console.log(`✅ ${filtered.length} articles analysés et filtrés`);
  return filtered;
}

/**
 * Vide le cache
 */
export function clearAnalysisCache() {
  cachedArticles = [];
  lastAnalysisTime = 0;
  console.log('🗑️ Cache d\'analyse vidé');
}

/**
 * Vérifie si l'IA est disponible
 */
export function isAIAnalysisAvailable(): boolean {
  return !!(geminiClient || groqClient);
}
