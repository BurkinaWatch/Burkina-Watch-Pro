import { Platform } from 'react-native';
import { getAccessToken, refreshAccessToken } from '@/lib/session';

export type Signalement = {
  id: number | string;
  titre?: string;
  title?: string;
  description?: string;
  categorie?: string;
  category?: string;
  statut?: string;
  status?: string;
  createdAt?: string;
  latitude?: number;
  longitude?: number;
};

export type Stats = {
  total?: number;
  totalSignalements?: number;
  resolus?: number;
  enCours?: number;
};

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const origin = domain ? `https://${domain}` : '';

export async function requestJson<T>(
  path: string,
  options?: RequestInit,
  allowRefresh = true,
): Promise<T> {
  const apiUrl = Platform.OS === 'web' ? `/api${path}` : `${origin}/api${path}`;
  const accessToken = await getAccessToken();
  const response = await fetch(apiUrl, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers ?? {}),
    },
  });

  if (response.status === 401 && allowRefresh && !path.startsWith('/auth/mobile/')) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) return requestJson<T>(path, options, false);
  }

  if (!response.ok) {
    let message = `API ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message || body.error || message;
    } catch {
      // Preserve the HTTP status when the server did not return JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function formatRelativeDate(value?: string) {
  if (!value) return 'Date inconnue';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}