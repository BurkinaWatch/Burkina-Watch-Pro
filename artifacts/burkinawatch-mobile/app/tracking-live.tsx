import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { requestJson } from '@/lib/api';
import { Screen } from '@/components/Screen';

type TrackingSession = {
  isActive?: boolean;
  signalStatus?: 'active' | 'signal_lost' | 'stopped';
  lastLocationAt?: string | null;
  lastLocation?: {
    latitude: string;
    longitude: string;
    accuracy: string | null;
    timestamp: string;
  } | null;
};

type StopTrackingResponse = {
  whatsappUrls?: string[];
  address?: string;
};

export default function TrackingLiveScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [permission, setPermission] = useState<Location.PermissionStatus | null>(null);
  const [position, setPosition] = useState<Location.LocationObject | null>(null);
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopWatching = useCallback(() => {
    subscription.current?.remove();
    subscription.current = null;
  }, []);

  const sendLocation = useCallback(async (location: Location.LocationObject) => {
    setPosition(location);
    await requestJson('/tracking/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: String(location.coords.latitude),
        longitude: String(location.coords.longitude),
      }),
    });
  }, []);

  const startWatching = useCallback(async () => {
    stopWatching();
    subscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30_000,
        distanceInterval: 0,
      },
      (location) => {
        void sendLocation(location).catch(() => {
          setError('La position actuelle n’a pas pu être synchronisée. Le suivi reste actif.');
        });
      },
    );
  }, [sendLocation, stopWatching]);

  const refreshSession = useCallback(async () => {
    try {
      const currentSession = await requestJson<TrackingSession>('/tracking/session');
      setSession(currentSession);
      setIsTracking(Boolean(currentSession.isActive));
    } catch {
      setSession(null);
      setIsTracking(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    void refreshSession();
    const refreshTimer = setInterval(() => {
      void refreshSession();
    }, 30_000);

    return () => {
      clearInterval(refreshTimer);
      stopWatching();
    };
  }, [isAuthenticated, refreshSession, stopWatching]);

  async function startTracking() {
    if (!isAuthenticated) {
      router.push('/connexion');
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      if (Platform.OS !== 'web' && !(await Location.hasServicesEnabledAsync())) {
        throw new Error('Activez la localisation de votre téléphone puis réessayez.');
      }

      const permissionResult = await Location.requestForegroundPermissionsAsync();
      setPermission(permissionResult.status);
      if (permissionResult.status !== Location.PermissionStatus.GRANTED) {
        throw new Error('Autorisez la localisation pour BurkinaWatch dans les réglages de votre téléphone.');
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await requestJson('/tracking/start', { method: 'POST' });
      await sendLocation(current);
      await startWatching();
      setIsTracking(true);
      await refreshSession();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Impossible de démarrer le suivi.');
      setIsTracking(false);
    } finally {
      setIsBusy(false);
    }
  }

  async function stopTracking() {
    setIsBusy(true);
    setError(null);

    try {
      const response = await requestJson<StopTrackingResponse>('/tracking/stop', { method: 'POST' });
      stopWatching();
      setIsTracking(false);
      setSession(null);
      setPosition(null);

      const urls = response.whatsappUrls ?? [];
      if (urls.length > 0) {
        await Linking.openURL(urls[0]);
        Alert.alert('Suivi arrêté', `La position finale est prête à être partagée avec vos contacts d’urgence.`);
      } else {
        Alert.alert('Suivi arrêté', 'La session de localisation est terminée.');
      }
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : 'Impossible d’arrêter le suivi.');
    } finally {
      setIsBusy(false);
    }
  }

  function openSettings() {
    void Linking.openSettings().catch(() => {
      Alert.alert('Réglages requis', 'Ouvrez les réglages de votre téléphone et autorisez la localisation pour BurkinaWatch.');
    });
  }

  return (
    <Screen title="Suivi en direct" subtitle="Sécurité et traçabilité" showBack>
      <View style={[styles.intro, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: colors.muted }]}>
          <Feather name="map-pin" size={22} color={colors.primary} />
        </View>
        <Text style={[styles.introText, { color: colors.mutedForeground }]}>
          Le suivi enregistre votre position toutes les 30 secondes. En cas d’incident, cette trajectoire peut aider les secours à vous retrouver rapidement.
        </Text>
      </View>

      {isTracking && session?.signalStatus === 'signal_lost' ? (
        <View style={[styles.signalLost, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive }]}>
          <Feather name="wifi-off" size={20} color={colors.destructive} />
          <View style={styles.signalLostCopy}>
            <Text style={[styles.signalLostTitle, { color: colors.destructive }]}>Signal perdu</Text>
            <Text style={[styles.signalLostText, { color: colors.foreground }]}>
              Le suivi reste actif. Aucune nouvelle position n’a été reçue depuis plus de 5 minutes.
            </Text>
            {session.lastLocation ? (
              <Text style={[styles.signalLostText, { color: colors.mutedForeground }]}>
                Dernière position connue : {Number(session.lastLocation.latitude).toFixed(5)}, {Number(session.lastLocation.longitude).toFixed(5)}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {!isAuthenticated ? (
        <View style={[styles.notice, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="lock" size={20} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>
            Connectez-vous pour démarrer un suivi de localisation sécurisé.
          </Text>
          <Pressable onPress={() => router.push('/connexion')} style={[styles.secondaryButton, { borderColor: colors.primary }]}>
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Se connecter</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? (
        <View style={[styles.error, { backgroundColor: colors.destructive }]}>
          <Feather name="alert-circle" size={20} color={colors.destructiveForeground} />
          <Text style={[styles.errorText, { color: colors.destructiveForeground }]}>{error}</Text>
          {permission === Location.PermissionStatus.DENIED ? (
            <Pressable onPress={openSettings} style={styles.settingsButton}>
              <Text style={[styles.settingsButtonText, { color: colors.destructive }]}>{Platform.OS === 'web' ? 'Réessayer' : 'Ouvrir les réglages'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {position ? (
        <View style={[styles.position, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="navigation" size={18} color={colors.primary} />
          <View style={styles.positionCopy}>
            <Text style={[styles.positionTitle, { color: colors.foreground }]}>Position synchronisée</Text>
            <Text style={[styles.positionText, { color: colors.mutedForeground }]}>
              {position.coords.latitude.toFixed(5)}, {position.coords.longitude.toFixed(5)}
            </Text>
          </View>
        </View>
      ) : null}

      {isTracking ? (
        <Pressable
          onPress={() => void stopTracking()}
          disabled={isBusy}
          style={({ pressed }) => [styles.dangerButton, { backgroundColor: colors.destructive, opacity: pressed || isBusy ? 0.75 : 1 }]}
          testID="button-stop-tracking"
        >
          {isBusy ? <ActivityIndicator color={colors.destructiveForeground} /> : <Feather name="stop-circle" size={19} color={colors.destructiveForeground} />}
          <Text style={[styles.buttonText, { color: colors.destructiveForeground }]}>{isBusy ? 'Arrêt en cours…' : 'Arrêter le suivi'}</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => void startTracking()}
          disabled={isBusy || !isAuthenticated}
          style={({ pressed }) => [styles.startButton, { backgroundColor: colors.primary, opacity: pressed || isBusy || !isAuthenticated ? 0.7 : 1 }]}
          testID="button-start-tracking"
        >
          {isBusy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="map-pin" size={19} color={colors.primaryForeground} />}
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{isBusy ? 'Autorisation en cours…' : 'Démarrer le suivi'}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 16 },
  icon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  introText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  notice: { alignItems: 'center', borderRadius: 16, borderWidth: 1, gap: 11, padding: 18 },
  noticeText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  secondaryButton: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  secondaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  error: { alignItems: 'center', borderRadius: 14, gap: 10, padding: 15 },
  errorText: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18, textAlign: 'center' },
  signalLost: { borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 15 },
  signalLostCopy: { flex: 1, gap: 4 },
  signalLostTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  signalLostText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  settingsButton: { backgroundColor: 'white', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 9 },
  settingsButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  position: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 14 },
  positionCopy: { flex: 1 },
  positionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  positionText: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  startButton: { alignItems: 'center', borderRadius: 13, flexDirection: 'row', gap: 9, justifyContent: 'center', paddingVertical: 14 },
  dangerButton: { alignItems: 'center', borderRadius: 13, flexDirection: 'row', gap: 9, justifyContent: 'center', paddingVertical: 14 },
  buttonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});