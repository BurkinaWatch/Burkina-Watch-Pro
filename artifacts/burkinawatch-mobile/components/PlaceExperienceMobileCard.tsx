import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Feather } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { requestJson } from '@/lib/api';

type ConfigResponse = {
  config: { enabled: boolean; dwellThresholdSeconds: number };
  readiness: {
    enabled: boolean;
    locationPermissionGranted: boolean;
    pushSubscriptionActive: boolean;
  };
};

type PresenceResponse = {
  checkInEligible?: boolean;
  visit?: { id: string };
  place?: { name?: string };
};

export function PlaceExperienceMobileCard() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const lastPresenceAt = useRef(0);
  const [busy, setBusy] = useState(false);
  const [eligibleVisit, setEligibleVisit] = useState<(PresenceResponse['visit'] & { placeName?: string }) | null>(null);
  const configQuery = useQuery<ConfigResponse>({
    queryKey: ['/api/place-experience/config'],
    queryFn: () => requestJson<ConfigResponse>('/place-experience/config'),
    staleTime: 60_000,
  });

  useEffect(() => {
    const readiness = configQuery.data?.readiness;
    if (!readiness?.enabled || !readiness.locationPermissionGranted || !readiness.pushSubscriptionActive) return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    void Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 60_000,
        distanceInterval: 0,
      },
      (position) => {
        const now = Date.now();
        if (cancelled || now - lastPresenceAt.current < 60_000) return;
        lastPresenceAt.current = now;
        void requestJson<PresenceResponse>('/place-experience/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            speedMps: position.coords.speed ?? 0,
          }),
        }).then((result) => {
          if (result.checkInEligible && result.visit) {
            setEligibleVisit({ ...result.visit, placeName: result.place?.name });
          }
        }).catch(() => undefined);
      },
    ).then((value) => {
      if (cancelled) value.remove();
      else subscription = value;
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [configQuery.data?.readiness]);

  async function toggle(enabled: boolean) {
    setBusy(true);
    try {
      if (!enabled) {
        await requestJson('/place-experience/consent', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enabled: false,
            locationPermissionGranted: Boolean(configQuery.data?.readiness.locationPermissionGranted),
          }),
        });
        setEligibleVisit(null);
        await queryClient.invalidateQueries({ queryKey: ['/api/place-experience/config'] });
        return;
      }

      const locationPermission = await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status !== Location.PermissionStatus.GRANTED) {
        throw new Error('Autorisez la localisation pour BurkinaWatch dans les réglages.');
      }
      const notificationPermission = await Notifications.requestPermissionsAsync();
      if (notificationPermission.status !== Notifications.PermissionStatus.GRANTED) {
        throw new Error('Autorisez les notifications pour recevoir la question du lieu.');
      }
      if (Constants.appOwnership === 'expo') {
        // Expo Go can provide a token without a project id.
      }
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
      await requestJson('/push/native-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.data }),
      });
      await requestJson('/place-experience/consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, locationPermissionGranted: true }),
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/place-experience/config'] });
    } catch (error) {
      Alert.alert('Activation impossible', error instanceof Error ? error.message : 'Vérifiez vos permissions puis réessayez.');
    } finally {
      setBusy(false);
    }
  }

  async function respond(perception: 'SAFE' | 'UNCERTAIN' | 'UNSAFE') {
    if (!eligibleVisit) return;
    try {
      await requestJson(`/place-experience/visits/${eligibleVisit.id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perception }),
      });
      setEligibleVisit(null);
    } catch {
      Alert.alert('Réponse non enregistrée', 'Réessayez lorsque la connexion sera disponible.');
    }
  }

  async function defer() {
    if (!eligibleVisit) return;
    try {
      await requestJson(`/place-experience/visits/${eligibleVisit.id}/defer`, { method: 'POST' });
      setEligibleVisit(null);
    } catch {
      Alert.alert('Report impossible', 'Réessayez lorsque la connexion sera disponible.');
    }
  }

  if (!configQuery.data) return null;
  const enabled = configQuery.data.readiness.enabled;
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="place-experience-mobile-card">
      <View style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: colors.muted }]}>
          <Feather name="map-pin" size={18} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]}>Expérience du lieu</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Présence volontaire, sans trajectoire complète ni garantie de sécurité. Délai : {Math.round(configQuery.data.config.dwellThresholdSeconds / 60)} min.
          </Text>
        </View>
      </View>
      <Pressable
        disabled={busy || !configQuery.data.config.enabled}
        onPress={() => void toggle(!enabled)}
        style={[styles.button, { backgroundColor: enabled ? colors.muted : colors.primary, opacity: busy ? 0.6 : 1 }]}
        testID="button-toggle-place-experience"
      >
        <Feather name={enabled ? 'pause-circle' : 'play-circle'} size={17} color={enabled ? colors.foreground : colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: enabled ? colors.foreground : colors.primaryForeground }]}>
          {busy ? 'Activation…' : enabled ? 'Désactiver' : 'Activer avec localisation et notifications'}
        </Text>
      </Pressable>
      {eligibleVisit ? (
        <View style={[styles.prompt, { backgroundColor: colors.muted }]}>
          <Text style={[styles.promptTitle, { color: colors.foreground }]}>Comment avez-vous vécu {eligibleVisit.placeName || 'ce lieu'} ?</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Une perception citoyenne, pas un incident.</Text>
          <View style={styles.actions}>
            {(['SAFE', 'UNCERTAIN', 'UNSAFE'] as const).map((value) => (
              <Pressable key={value} onPress={() => void respond(value)} style={[styles.choice, { borderColor: colors.border }]} testID={`place-experience-${value.toLowerCase()}`}>
                <Text style={[styles.choiceText, { color: colors.foreground }]}>{value}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => void defer()} style={styles.later}>
              <Text style={[styles.choiceText, { color: colors.primary }]}>Plus tard</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, gap: 13, padding: 16 },
  heading: { alignItems: 'flex-start', flexDirection: 'row', gap: 11 },
  icon: { alignItems: 'center', borderRadius: 11, height: 36, justifyContent: 'center', width: 36 },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  button: { alignItems: 'center', borderRadius: 11, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  buttonText: { fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'center' },
  prompt: { borderRadius: 11, gap: 5, padding: 11 },
  promptTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  choice: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 7 },
  choiceText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  later: { justifyContent: 'center', paddingHorizontal: 5 },
});