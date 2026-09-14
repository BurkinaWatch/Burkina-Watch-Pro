import { Platform } from 'react-native';

function normalizeOrigin(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol).toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function getApiOrigin(): string | null {
  if (Platform.OS === 'web') return null;

  return normalizeOrigin(
    process.env.EXPO_PUBLIC_API_URL ?? process.env.EXPO_PUBLIC_DOMAIN,
  );
}

export function getApiUrl(path: string): string {
  const origin = getApiOrigin();
  if (!origin) {
    throw new Error(
      'Le serveur BurkinaWatch n’est pas configuré pour cette version de l’application.',
    );
  }

  return `${origin}/api${path}`;
}