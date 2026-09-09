import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type MobileUser = {
  id: string;
  email: string | null;
  isAnonymous: boolean;
  authProvider: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  telephone: string | null;
  bio: string | null;
  ville: string | null;
  metier: string | null;
  role: string | null;
  emailTrackingEnabled: boolean;
  userPoints: number;
  userLevel: string;
  createdAt: string | null;
  updatedAt: string | null;
  claims: { sub: string };
};

export type MobileTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: MobileUser;
};

const ACCESS_TOKEN_KEY = 'burkinawatch.mobile.access-token';
const REFRESH_TOKEN_KEY = 'burkinawatch.mobile.refresh-token';

const domain = process.env.EXPO_PUBLIC_DOMAIN;
const origin = domain ? `https://${domain}` : '';

async function readValue(key: string): Promise<string | null> {
  return Platform.OS === 'web'
    ? AsyncStorage.getItem(key)
    : SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function deleteValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function getAccessToken(): Promise<string | null> {
  return readValue(ACCESS_TOKEN_KEY);
}

async function getRefreshToken(): Promise<string | null> {
  return readValue(REFRESH_TOKEN_KEY);
}

export async function saveMobileSession(tokens: MobileTokenResponse): Promise<void> {
  await Promise.all([
    writeValue(ACCESS_TOKEN_KEY, tokens.accessToken),
    writeValue(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export async function clearMobileSession(): Promise<void> {
  await Promise.all([
    deleteValue(ACCESS_TOKEN_KEY),
    deleteValue(REFRESH_TOKEN_KEY),
  ]);
}

let refreshInFlight: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${origin}/api/auth/mobile/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await clearMobileSession();
        return null;
      }

      const tokens = (await response.json()) as MobileTokenResponse;
      await saveMobileSession(tokens);
      return tokens.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function logoutMobileSession(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) {
      await fetch(`${origin}/api/auth/mobile/logout`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } finally {
    await clearMobileSession();
  }
}