import Parser from "rss-parser";

export type PublicPracticalSourceConfig = {
  name: string;
  url: string;
  format?: "rss" | "json";
  defaultPlaceType?: string;
};

export type PublicPracticalItem = {
  id: string;
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string | null;
};

export type PublicPracticalPlace = {
  id: string;
  osmId: string;
  osmType: string;
  placeType: string;
  name: string;
  latitude: string;
  longitude: string;
  address: string | null;
  quartier: string | null;
  ville: string | null;
  region: string | null;
  telephone: string | null;
  email: string | null;
  website: string | null;
  horaires: string | null;
  imageUrl: string | null;
  tags: Record<string, unknown>;
  source: string;
  confidenceScore: string;
  confirmations: number;
  reports: number;
  verificationStatus: "pending";
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
};

type PublicSourcePayload = {
  places: PublicPracticalPlace[];
  items: PublicPracticalItem[];
};

type CachedSource = PublicSourcePayload & {
  expiresAt: number;
};

const parser = new Parser();
const sourceCache = new Map<string, CachedSource>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_SOURCES = 8;
const MAX_ITEMS_PER_SOURCE = 100;

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function stripHtml(value: unknown): string {
  return text(value)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR");
}

function numberValue(value: unknown): number | null {
  const parsed = Number.parseFloat(text(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function validSourceUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLocaleLowerCase();
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (hostname === "localhost" || hostname === "::1" || hostname.startsWith("127.") || hostname.startsWith("10.")) {
      return null;
    }
    if (hostname.startsWith("192.168.") || hostname.startsWith("172.16.") || hostname.startsWith("172.17.") || hostname.startsWith("172.18.")) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function configuredSources(): PublicPracticalSourceConfig[] {
  const raw = process.env.BURKINAWATCH_PUBLIC_SOURCES;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .slice(0, MAX_SOURCES)
      .flatMap((entry): PublicPracticalSourceConfig[] => {
        if (!entry || typeof entry !== "object") return [];
        const name = text((entry as Record<string, unknown>).name);
        const url = text((entry as Record<string, unknown>).url);
        if (!name || !validSourceUrl(url)) return [];
        const format = (entry as Record<string, unknown>).format === "json" ? "json" : "rss";
        return [{
          name,
          url,
          format,
          defaultPlaceType: text((entry as Record<string, unknown>).defaultPlaceType) || "shop",
        }];
      });
  } catch {
    console.error("[PUBLIC SOURCES] BURKINAWATCH_PUBLIC_SOURCES doit être un tableau JSON valide");
    return [];
  }
}

function recordValue(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = text(record[key]);
    if (value) return value;
  }
  return "";
}

function coordinates(record: Record<string, unknown>): [number, number] | null {
  const latitude = numberValue(record.latitude ?? record.lat ?? record["geo:lat"] ?? record["geo_lat"]);
  const longitude = numberValue(record.longitude ?? record.lng ?? record.lon ?? record["geo:long"] ?? record["geo_lng"]);
  if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return [latitude, longitude];
}

function sourceItem(
  source: PublicPracticalSourceConfig,
  raw: Record<string, unknown>,
  index: number,
): { item: PublicPracticalItem; place: PublicPracticalPlace | null } {
  const now = new Date().toISOString();
  const title = recordValue(raw, "title", "name", "label") || `${source.name} — information ${index + 1}`;
  const description = stripHtml(recordValue(raw, "description", "summary", "content", "content:encoded", "text"));
  const sourceUrl = recordValue(raw, "url", "link", "website") || source.url;
  const externalId = recordValue(raw, "id", "guid", "externalId") || sourceUrl || `${source.name}-${index}`;
  const id = `public-${normalize(source.name).replace(/[^a-z0-9]+/g, "-")}-${normalize(externalId).replace(/[^a-z0-9]+/g, "-").slice(-80)}`;
  const publishedAt = recordValue(raw, "publishedAt", "published", "pubDate", "isoDate", "date") || null;
  const item: PublicPracticalItem = {
    id,
    title,
    description: description || "Information publiée par une source externe. Vérifiez les détails auprès de la source.",
    sourceName: source.name,
    sourceUrl,
    publishedAt,
  };

  const point = coordinates(raw);
  if (!point) return { item, place: null };

  const address = recordValue(raw, "address", "adresse", "location");
  const telephone = recordValue(raw, "telephone", "phone", "tel");
  const website = recordValue(raw, "website", "site", "url") || null;
  const place: PublicPracticalPlace = {
    id,
    osmId: `public:${source.name}:${externalId}`,
    osmType: "public",
    placeType: recordValue(raw, "placeType", "type", "category") || source.defaultPlaceType || "shop",
    name: title,
    latitude: String(point[0]),
    longitude: String(point[1]),
    address: address || null,
    quartier: recordValue(raw, "quartier", "neighborhood") || null,
    ville: recordValue(raw, "ville", "city", "town") || null,
    region: recordValue(raw, "region") || null,
    telephone: telephone || null,
    email: recordValue(raw, "email") || null,
    website,
    horaires: recordValue(raw, "horaires", "opening_hours", "openingHours") || null,
    imageUrl: recordValue(raw, "imageUrl", "image", "photo") || null,
    tags: {
      description,
      sourceUrl,
      sourceName: source.name,
      externalId,
      ...(recordValue(raw, "brand") ? { brand: recordValue(raw, "brand") } : {}),
    },
    source: `PUBLIC:${source.name}`,
    confidenceScore: "0.40",
    confirmations: 0,
    reports: 0,
    verificationStatus: "pending",
    lastSyncedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  return { item, place };
}

async function fetchSource(source: PublicPracticalSourceConfig): Promise<PublicSourcePayload> {
  const cached = sourceCache.get(source.url);
  if (cached && cached.expiresAt > Date.now()) {
    return { places: cached.places, items: cached.items };
  }

  const url = validSourceUrl(source.url);
  if (!url) return { places: [], items: [] };

  const response = await fetch(url, {
    headers: {
      Accept: source.format === "json" ? "application/json" : "application/rss+xml, application/atom+xml, application/xml, text/xml",
      "User-Agent": "BurkinaWatch/1.0 (public-source-reader)",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const rawItems: Record<string, unknown>[] = [];
  if (source.format === "json") {
    const payload = await response.json() as unknown;
    const records = Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object"
        ? ((payload as Record<string, unknown>).items || (payload as Record<string, unknown>).results || (payload as Record<string, unknown>).places || [])
        : [];
    if (Array.isArray(records)) {
      rawItems.push(...records.filter((record): record is Record<string, unknown> => Boolean(record) && typeof record === "object").slice(0, MAX_ITEMS_PER_SOURCE));
    }
  } else {
    const feed = await parser.parseString(await response.text());
    rawItems.push(...feed.items.slice(0, MAX_ITEMS_PER_SOURCE).map((item) => item as unknown as Record<string, unknown>));
  }

  const parsed = rawItems.map((item, index) => sourceItem(source, item, index));
  const result = {
    places: parsed.flatMap(({ place }) => place ? [place] : []),
    items: parsed.map(({ item }) => item),
  };
  sourceCache.set(source.url, { ...result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}

export async function fetchPublicPracticalSources(search = "") {
  const sources = configuredSources();
  if (!sources.length) return { places: [], items: [], sources: [] };

  const results = await Promise.allSettled(sources.map((source) => fetchSource(source)));
  const places = results.flatMap((result) => result.status === "fulfilled" ? result.value.places : []);
  const items = results.flatMap((result) => result.status === "fulfilled" ? result.value.items : []);
  const terms = normalize(search).split(/\s+/).filter((term) => term.length > 1);
  const matches = (value: string) => !terms.length || terms.every((term) => normalize(value).includes(term));

  return {
    places: places.filter((place) => matches([place.name, place.address, JSON.stringify(place.tags)].filter(Boolean).join(" "))),
    items: items.filter((item) => matches([item.title, item.description, item.sourceName].join(" "))),
    sources: sources.map((source, index) => ({
      name: source.name,
      url: source.url,
      status: results[index]?.status === "fulfilled" ? "ok" : "unavailable",
    })),
  };
}