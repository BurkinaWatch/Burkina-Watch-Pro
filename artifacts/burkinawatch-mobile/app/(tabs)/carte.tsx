import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { requestJson, Signalement } from '@/lib/api';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/Brand';

const services = [
  { label: 'Urgences', icon: 'phone-call' as const, category: 'urgences' },
  { label: 'Pharmacies', icon: 'plus-square' as const, category: 'pharmacies' },
  { label: 'Hôpitaux', icon: 'heart' as const, category: 'hopitaux' },
  { label: 'Stations', icon: 'truck' as const, category: 'stations' },
  { label: 'Gares', icon: 'navigation' as const, category: 'gares' },
  { label: 'Marchés', icon: 'shopping-bag' as const, category: 'marches' },
];

export default function MapScreen() {
  const colors = useColors();
  const router = useRouter();
  const [locationStatus, setLocationStatus] = useState('Autoriser la localisation pour situer les alertes.');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const signalements = useQuery<Signalement[]>({
    queryKey: ['mobile-map-signalements'],
    queryFn: () => requestJson<Signalement[]>('/signalements'),
    staleTime: 30_000,
    retry: 1,
  });

  async function locate() {
    if (Platform.OS === 'web') {
      setLocationStatus('La localisation est disponible dans l’application mobile native.');
      return;
    }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setLocationStatus('Permission refusée. Vous pouvez la réactiver dans les réglages.');
      return;
    }
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setLocation(current);
    setLocationStatus('Position active — les résultats restent liés aux données BurkinaWatch.');
  }

  return (
    <Screen title="Carte & services" subtitle="Retrouver les ressources autour de vous">
      <View style={[styles.mapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.mapVisual, { backgroundColor: colors.muted }]}>
          <View style={[styles.mapRoad, styles.roadOne, { backgroundColor: colors.background }]} />
          <View style={[styles.mapRoad, styles.roadTwo, { backgroundColor: colors.background }]} />
          <View style={[styles.mapRoad, styles.roadThree, { backgroundColor: colors.background }]} />
          <View style={[styles.pin, { backgroundColor: colors.destructive, borderColor: colors.background }]}>
            <Feather name="shield" size={18} color={colors.destructiveForeground} />
          </View>
          <Text style={[styles.mapLabel, { color: colors.mutedForeground }]}>Alertes BurkinaWatch</Text>
        </View>
        <Pressable onPress={() => void locate()} style={[styles.locationButton, { backgroundColor: colors.primary }]} testID="button-enable-location">
          <Feather name="crosshair" size={17} color={colors.primaryForeground} />
          <Text style={[styles.locationText, { color: colors.primaryForeground }]}>Utiliser ma position</Text>
        </Pressable>
        <Text style={[styles.locationStatus, { color: colors.mutedForeground }]}>{locationStatus}</Text>
        {location ? <Text style={[styles.coordinates, { color: colors.primary }]}>{location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}</Text> : null}
      </View>

      <View>
        <SectionTitle eyebrow="À PROXIMITÉ" title="Services du Faso" action="Tout voir" onAction={() => router.push('/services')} />
        <View style={styles.serviceGrid}>
          {services.map((service) => (
            <Pressable key={service.category} onPress={() => router.push({ pathname: '/services', params: { category: service.category } })} style={[styles.service, { backgroundColor: colors.card, borderColor: colors.border }]} testID={`service-${service.category}`}>
              <Feather name={service.icon} size={20} color={colors.primary} />
              <Text style={[styles.serviceText, { color: colors.foreground }]}>{service.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <SectionTitle eyebrow="SIGNALÉMENTS" title="Autour de vous" />
        {signalements.isLoading ? <LoadingState /> : null}
        {signalements.isError ? <ErrorState onRetry={() => void signalements.refetch()} /> : null}
        {!signalements.isLoading && !signalements.isError && !signalements.data?.length ? <EmptyState title="Pas encore de point sur la carte" description="Les signalements publiés par la communauté apparaîtront ici." icon="map" /> : null}
        {!signalements.isLoading && !signalements.isError && signalements.data?.length ? <Text style={[styles.resultText, { color: colors.mutedForeground }]}>{signalements.data.length} signalement(s) disponible(s) depuis le serveur.</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', padding: 12 },
  mapVisual: { borderRadius: 14, height: 210, overflow: 'hidden', position: 'relative' },
  mapRoad: { borderRadius: 99, height: 16, position: 'absolute', transform: [{ rotate: '22deg' }], width: '120%' },
  roadOne: { left: -40, top: 50 },
  roadTwo: { left: -30, top: 125, transform: [{ rotate: '-28deg' }] },
  roadThree: { left: 45, top: 15, transform: [{ rotate: '82deg' }] },
  pin: { alignItems: 'center', borderRadius: 99, borderWidth: 3, height: 45, justifyContent: 'center', left: '48%', position: 'absolute', top: '41%', width: 45 },
  mapLabel: { bottom: 12, fontFamily: 'Inter_500Medium', fontSize: 11, left: 12, position: 'absolute' },
  locationButton: { alignItems: 'center', borderRadius: 11, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 12, paddingVertical: 13 },
  locationText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  locationStatus: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 9, textAlign: 'center' },
  coordinates: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 4, textAlign: 'center' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  service: { alignItems: 'center', borderRadius: 14, borderWidth: 1, gap: 8, justifyContent: 'center', minHeight: 82, padding: 10, width: '31%' },
  serviceText: { fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'center' },
  resultText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
});