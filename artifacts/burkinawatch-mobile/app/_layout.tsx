import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { AuthProvider } from '@/lib/auth';
import { getAccessToken } from '@/lib/session';
import { getApiOrigin } from '@/lib/apiConfig';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
setBaseUrl(getApiOrigin());
setAuthTokenGetter(getAccessToken);
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient();

const appFonts = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="feed" options={{ headerShown: false }} />
      <Stack.Screen name="signaler" options={{ headerShown: false }} />
      <Stack.Screen name="sos" options={{ headerShown: false }} />
      <Stack.Screen name="services" options={{ headerShown: false }} />
      <Stack.Screen name="burkina-pratique" options={{ headerShown: false }} />
      <Stack.Screen name="place-results" options={{ headerShown: false }} />
      <Stack.Screen name="tracking-live" options={{ headerShown: false }} />
      <Stack.Screen name="connexion" options={{ headerShown: false }} />
      <Stack.Screen name="signalement/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Expo Web's font loader can reject after its 12s FontFaceObserver timeout
  // when the preview cannot resolve the Google font assets. Native builds
  // still load the bundled Inter files; Web uses its CSS fallback stack.
  const [fontsLoaded, fontError] = useFonts(Platform.OS === 'web' ? {} : appFonts);
  const [startupTimedOut, setStartupTimedOut] = React.useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStartupTimedOut(true), 1500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError || startupTimedOut) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, startupTimedOut]);

  if (!fontsLoaded && !fontError && !startupTimedOut) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
