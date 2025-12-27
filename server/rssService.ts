
import Parser from 'rss-parser';

interface BulletinItem {
  id: string;
  source: string;
  titre: string;
  description: string;
  lien: string;
  date: string;
  categorie?: string;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['dc:creator', 'creator']
    ]
  }
});

// Configuration des flux RSS des médias burkinabè et africains fiables
const RSS_FEEDS = [
  // Sources officielles burkinabè
  {
    url: 'https://www.aib.bf/feed/',
    source: 'AIB',
    categorie: 'Officiel'
  },
  {
    url: 'https://www.sidwaya.info/feed/',
    source: 'Sidwaya',
    categorie: 'Officiel'
  },
  // Médias burkinabè majeurs
  {
    url: 'https://lefaso.net/spip.php?page=backend',
    source: 'Lefaso.net',
    categorie: 'Média'
  },
  {
    url: 'https://burkina24.com/feed/',
    source: 'Burkina24',
    categorie: 'Média'
  },
  {
    url: 'https://www.fasozine.com/feed/',
    source: 'Fasozine',
    categorie: 'Média'
  },
  {
    url: 'https://www.leconomistedufaso.bf/feed/',
    source: 'L\'Economiste du Faso',
    categorie: 'Économie'
  },
  {
    url: 'https://www.wakatsera.com/feed/',
    source: 'Wakatsera',
    categorie: 'Média'
  },
  {
    url: 'https://www.libreinfo.net/feed/',
    source: 'Libre Info',
    categorie: 'Média'
  },
  {
    url: 'https://www.infowakat.net/feed/',
    source: 'InfoWakat',
    categorie: 'Média'
  },
  {
    url: 'https://netafrique.net/feed/',
    source: 'NetAfrique',
    categorie: 'Média'
  },
  // Sources africaines et internationales (Afrique de l'Ouest)
  {
    url: 'https://www.bbc.com/afrique/rss/afrique.xml',
    source: 'BBC Afrique',
    categorie: 'International'
  },
  {
    url: 'https://www.jeuneafrique.com/feeds/rss/',
    source: 'Jeune Afrique',
    categorie: 'International'
  },
  {
    url: 'https://www.voaafrique.com/api/ztkoetiv',
    source: 'VOA Afrique',
    categorie: 'International'
  },
  // Sources régionales (CEDEAO/Sahel)
  {
    url: 'https://maliactu.net/feed/',
    source: 'MaliActu',
    categorie: 'Régional'
  },
  {
    url: 'https://www.nigerdiaspora.net/feed/',
    source: 'Niger Diaspora',
    categorie: 'Régional'
  },
  {
    url: 'https://news.abidjan.net/rss/',
    source: 'Abidjan.net',
    categorie: 'Régional'
  }
];

// Cache en mémoire (30 minutes)
let cachedBulletins: BulletinItem[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function fetchBulletins(): Promise<BulletinItem[]> {
  // Vérifier le cache
  const now = Date.now();
  if (cachedBulletins.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
    console.log('✅ Utilisation du cache RSS');
    return cachedBulletins;
  }

  console.log('🔄 Récupération des flux RSS...');
  const allItems: BulletinItem[] = [];

  // Récupérer tous les flux en parallèle
  const promises = RSS_FEEDS.map(async (feed) => {
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'BurkinaWatch/1.0'
        },
        signal: AbortSignal.timeout(10000) // Timeout 10s
      });

      if (!response.ok) {
        console.warn(`⚠️ Erreur HTTP ${response.status} pour ${feed.source}`);
        return [];
      }

      const xml = await response.text();
      const parsed = await parser.parseString(xml);

      return parsed.items.map((item, index) => ({
        id: `${feed.source}-${index}-${Date.now()}`,
        source: feed.source,
        titre: item.title || 'Sans titre',
        description: item.contentSnippet || item.content || item.description || '',
        lien: item.link || '',
        date: item.pubDate || item.isoDate || new Date().toISOString(),
        categorie: feed.categorie
      }));
    } catch (error) {
      console.error(`❌ Erreur pour ${feed.source}:`, error);
      return [];
    }
  });

  const results = await Promise.allSettled(promises);
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    } else {
      console.error(`❌ Échec pour ${RSS_FEEDS[index].source}:`, result.reason);
    }
  });

  // Trier par date (plus récent en premier)
  allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Mettre à jour le cache
  cachedBulletins = allItems;
  lastFetchTime = now;

  console.log(`✅ ${allItems.length} bulletins récupérés`);
  return allItems;
}

export function clearCache() {
  cachedBulletins = [];
  lastFetchTime = 0;
  console.log('🗑️ Cache RSS vidé');
}
