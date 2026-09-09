import AsyncStorage from '@react-native-async-storage/async-storage';

const REPORT_DRAFTS_KEY = '@burkinawatch/report-drafts';

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