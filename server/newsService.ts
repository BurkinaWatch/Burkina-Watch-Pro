import Parser from "rss-parser";

interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  date: string;
}

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "BurkinaWatch/1.0 (News Aggregator)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

const NEWS_SOURCES = [
  {
    name: "Présidence du Faso",
    url: "https://www.presidencedufaso.bf/feed/",
    fallbackUrl: null,
  },
  {
    name: "SIG",
    url: "https://www.sig.gov.bf/?type=9818",
    fallbackUrl: null,
  },
  {
    name: "Lefaso.net",
    url: "https://lefaso.net/spip.php?page=backend",
    fallbackUrl: null,
  },
  {
    name: "Burkina24",
    url: "https://burkina24.com/feed/",
    fallbackUrl: null,
  },
];

let cachedNews: NewsItem[] = [];
let lastFetch: Date | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "fallback-1",
    title: "Conseil des ministres - Comptes-rendus hebdomadaires disponibles",
    source: "Présidence du Faso",
    url: "https://www.presidencedufaso.bf/2025/",
    date: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "Actions du Gouvernement - Actualités et réformes en cours",
    source: "SIG",
    url: "https://www.sig.gov.bf/",
    date: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    title: "La patrie ou la mort, nous vaincrons - Actualités nationales",
    source: "AIB",
    url: "https://www.aib.media/",
    date: new Date().toISOString(),
  },
  {
    id: "fallback-4",
    title: "Burkina Faso : Développement socio-économique et sécuritaire",
    source: "Gouvernement",
    url: "https://www.presidencedufaso.bf/actualites/",
    date: new Date().toISOString(),
  },
  {
    id: "fallback-5",
    title: "Transition politique : Avancées et perspectives 2025",
    source: "Présidence du Faso",
    url: "https://www.presidencedufaso.bf/",
    date: new Date().toISOString(),
  },
];

async function fetchFromSource(source: { name: string; url: string }): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items || []).slice(0, 5).map((item, index) => ({
      id: `${source.name.toLowerCase().replace(/\s+/g, "-")}-${index}`,
      title: item.title || "Sans titre",
      source: source.name,
      url: item.link || source.url,
      date: item.pubDate || new Date().toISOString(),
    }));
  } catch (error) {
    console.warn(`[NewsService] Failed to fetch from ${source.name}:`, error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

export async function getOfficialNews(): Promise<NewsItem[]> {
  if (cachedNews.length > 0 && lastFetch && Date.now() - lastFetch.getTime() < CACHE_DURATION) {
    return cachedNews;
  }

  console.log("[NewsService] Fetching official news from government sources...");

  const results = await Promise.allSettled(
    NEWS_SOURCES.map((source) => fetchFromSource(source))
  );

  const allNews: NewsItem[] = [];
  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allNews.push(...result.value);
    }
  });

  if (allNews.length > 0) {
    cachedNews = allNews.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 10);
    lastFetch = new Date();
    console.log(`[NewsService] Fetched ${cachedNews.length} news items`);
  } else {
    console.log("[NewsService] No news fetched, using fallback data");
    cachedNews = FALLBACK_NEWS;
    lastFetch = new Date();
  }

  return cachedNews;
}

export function clearNewsCache(): void {
  cachedNews = [];
  lastFetch = null;
}
