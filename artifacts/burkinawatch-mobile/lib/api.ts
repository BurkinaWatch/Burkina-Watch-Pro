import { Platform } from 'react-native';

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
): Promise<T> {
  const apiUrl = Platform.OS === 'web' ? `/api${path}` : `${origin}/api${path}`;
  const response = await fetch(apiUrl, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}`);
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