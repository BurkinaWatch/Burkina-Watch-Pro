import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORT_DRAFTS_KEY = '@burkinawatch/report-drafts';
const PRACTICAL_SEARCHES_KEY = '@burkinawatch/practical-searches';
const PRACTICAL_PLACES_PREFIX = '@burkinawatch/practical-places/';

export type ReportDraft = {
  id: string;
  title: string;
  description: string;
  category: string;
  photoUri?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
};

export async function readReportDrafts(): Promise<ReportDraft[]> {
  const raw = await AsyncStorage.getItem(REPORT_DRAFTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ReportDraft[];
  } catch {
    return [];
  }
}

export async function saveReportDraft(draft: ReportDraft) {
  const drafts = await readReportDrafts();
  await AsyncStorage.setItem(
    REPORT_DRAFTS_KEY,
    JSON.stringify([draft, ...drafts].slice(0, 20)),
  );
}

export async function readPracticalSearches(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(PRACTICAL_SEARCHES_KEY);
  if (!raw) return [];
  try {
    const values = JSON.parse(raw);
    return Array.isArray(values) ? values.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export async function savePracticalSearch(value: string): Promise<void> {
  const query = value.trim();
  if (!query) return;
  const searches = await readPracticalSearches();
  const next = [query, ...searches.filter((item) => item.toLocaleLowerCase() !== query.toLocaleLowerCase())].slice(0, 5);
  await AsyncStorage.setItem(PRACTICAL_SEARCHES_KEY, JSON.stringify(next));
}

function sanitizePracticalPlaces(data: unknown): unknown {
  if (!Array.isArray(data)) return data;
  return data.map((place) => {
    if (!place || typeof place !== 'object') return place;
    const copy = { ...(place as Record<string, unknown>) };
    delete copy.horaires;
    delete copy.opening_hours;
    if (copy.tags && typeof copy.tags === 'object') {
      const tags = { ...(copy.tags as Record<string, unknown>) };
      delete tags.mobileMoneyStatus;
      delete tags.mobileMoneyCheckedAt;
      delete tags.liquiditeStatus;
      delete tags.liquiditeCheckedAt;
      delete tags.opening_hours;
      delete tags.service_times;
      copy.tags = tags;
    }
    return copy;
  });
}

export async function cachePracticalPlaces(endpoint: string, data: unknown): Promise<void> {
  await AsyncStorage.setItem(
    `${PRACTICAL_PLACES_PREFIX}${endpoint}`,
    JSON.stringify({ savedAt: new Date().toISOString(), data: sanitizePracticalPlaces(data) }),
  );
}

export async function readCachedPracticalPlaces(endpoint: string): Promise<unknown | null> {
  const raw = await AsyncStorage.getItem(`${PRACTICAL_PLACES_PREFIX}${endpoint}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { data?: unknown };
    return parsed.data ?? null;
  } catch {
    return null;
  }
}