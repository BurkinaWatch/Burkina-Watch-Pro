
import Parser from 'rss-parser';

interface BulletinItem {
  id: string;
  source: string;
  titre: string;
  description: string;
  lien: string;
  date: string;
  categorie?: string;
  image?: string;
}

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
      ['dc:creator', 'creator'],
      ['content:encoded', 'contentEncoded']
    ]
  }
});

// Cache pour les images extraites des pages (évite de refetch)
const imageCache = new Map<string, string | null>();

// Fonction pour extraire l'image Open Graph depuis la page de l'article
async function fetchOgImage(url: string): Promise<string | undefined> {
  // Vérifier le cache
  if (imageCache.has(url)) {
    const cached = imageCache.get(url);
    return cached || undefined;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BurkinaWatch/1.0 (News Aggregator)'
      },
      signal: AbortSignal.timeout(5000) // Timeout 5s
    });

    if (!response.ok) {
      imageCache.set(url, null);
      return undefined;
    }

    const html = await response.text();
    
    // Chercher og:image (priorité)
    let match = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
    let fallbackImageUrl: string | undefined;
    if (!match) {
      match = html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    }
    
    // Chercher twitter:image comme fallback
    if (!match) {
      match = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    }
    if (!match) {
      match = html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
    }
    
    // Chercher la première grande image dans l'article
    if (!match) {
      const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
      if (imgMatches) {
        for (const imgTag of imgMatches) {
          const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
          if (srcMatch && srcMatch[1]) {
            const src = srcMatch[1];
            // Ignorer les petites icônes et logos
            if (!src.includes('logo') && 
                !src.includes('icon') && 
                !src.includes('avatar') &&
                !src.includes('favicon') &&
                !src.includes('sprite') &&
                (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png') || src.endsWith('.webp'))) {
              fallbackImageUrl = src;
              break;
            }
          }
        }
      }
    }

    const extractedImageUrl = match?.[1] || fallbackImageUrl;
    if (extractedImageUrl) {
      let imageUrl = extractedImageUrl;
      // Convertir URL relative en absolue
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      }
      imageCache.set(url, imageUrl);
      return imageUrl;
    }

    imageCache.set(url, null);
    return undefined;
  } catch (error) {
    imageCache.set(url, null);
    return undefined;
  }
}

function upgradeImageUrl(url: string): string {
  if (!url) return url;
  let upgraded = url.replace(/cache-vignettes\/L\d+xH\d+\//i, 'cache-gd2/');
  if (upgraded !== url) return upgraded;
  upgraded = url.replace(/-\d+x\d+(?=\.\w+$)/, '');
  if (upgraded !== url) return upgraded;
  upgraded = url.replace(/\?w=\d+(&h=\d+)?/, '');
  upgraded = upgraded.replace(/&w=\d+(&h=\d+)?/, '');
  return upgraded;
}

function extractImage(item: any): string | undefined {
  let url: string | undefined;
  if (item.media && item.media.$) url = item.media.$.url;
  if (!url && item.mediaThumbnail && item.mediaThumbnail.$) url = item.mediaThumbnail.$.url;
  if (!url && item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image')) url = item.enclosure.url;
  if (!url) {
    const htmlContent = item.contentEncoded || item.content || item.description || '';
    const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch && imgMatch[1]) url = imgMatch[1];
  }
  if (!url && item['content:encodedSnippet']) {
    const snippetMatch = item['content:encodedSnippet'].match(/<img[^>]+src=["']([^"']+)["']/i);
    if (snippetMatch && snippetMatch[1]) url = snippetMatch[1];
  }
  return url ? upgradeImageUrl(url) : undefined;
}

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

      return parsed.items.map((item: any, index: number) => ({
        id: `${feed.source}-${index}-${Date.now()}`,
        source: feed.source,
        titre: item.title || 'Sans titre',
        description: item.contentSnippet || item.content || item.description || '',
        lien: item.link || '',
        date: item.pubDate || item.isoDate || new Date().toISOString(),
        categorie: feed.categorie,
        image: extractImage(item)
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

  // Récupérer les images manquantes depuis les pages (limité aux 30 premiers articles sans image)
  const itemsWithoutImages = allItems.filter(item => !item.image && item.lien).slice(0, 30);
  if (itemsWithoutImages.length > 0) {
    console.log(`🖼️ Récupération des images pour ${itemsWithoutImages.length} articles...`);
    
    // Traiter en lots de 5 pour ne pas surcharger
    const batchSize = 5;
    for (let i = 0; i < itemsWithoutImages.length; i += batchSize) {
      const batch = itemsWithoutImages.slice(i, i + batchSize);
      await Promise.all(batch.map(async (item) => {
        const ogImage = await fetchOgImage(item.lien);
        if (ogImage) {
          item.image = ogImage;
        }
      }));
    }
    
    const imagesFound = itemsWithoutImages.filter(item => item.image).length;
    console.log(`✅ ${imagesFound} images récupérées depuis les pages`);
  }

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
