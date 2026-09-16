import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/Brand';
import { categoryLabels, categoryRoutes } from '@/lib/practicalNavigation';

const serviceGroups = [
  {
    title: 'Sécurité & mobilité',
    items: [
      ['Urgences', '/urgences', 'phone-call'],
      ['Stations-service', '/stations', 'truck'],
      ['Gares routières', '/gares', 'navigation'],
      ['Suivi en direct', '/tracking-live', 'radio'],
    ],
  },
  {
    title: 'Vie quotidienne',
    items: [
      ['Pharmacies de garde', '/pharmacies', 'plus-square'],
      ['Hôpitaux', '/hopitaux', 'heart'],
      ['Restaurants', '/restaurants', 'coffee'],
      ['Hôtels', '/hotels', 'home'],
      ['Banques', '/banques', 'credit-card'],
    ],
  },
  {
    title: 'Information & citoyenneté',
    items: [
      ['Marchés', '/marches', 'shopping-bag'],
      ['Boutiques', '/boutiques', 'shopping-bag'],
      ['Marchés & boutiques', '/boutiques-marches', 'grid'],
      ['Téléphonie', '/telephonie', 'smartphone'],
      ['Mairies & préfectures', '/mairies-prefectures', 'landmark'],
      ['Ministères', '/ministeres', 'briefcase'],
      ['Lieux de culte', '/lieux-de-culte', 'compass'],
      ['Universités & instituts', '/universites', 'book-open'],
      ['SONABEL & ONEA', '/sonabel-onea', 'zap'],
      ['Programme ciné', '/cine', 'film'],
      ['Cimetières', '/cimetieres', 'map-pin'],
      ['Fil d’actualité', '/feed', 'radio'],
      ['Notifications', '/notifications', 'bell'],
    ],
  },
] as const;

type NativeRoute = '/feed' | '/(tabs)/alertes' | '/connexion' | '/tracking-live' | '/sos';

type NativeDestination =
  | { route: NativeRoute }
  | { endpoint: string; title: string };

const nativeDestinations: Record<string, NativeDestination> = {
  '/urgences': { route: '/sos' },
  '/feed': { route: '/feed' },
  '/notifications': { route: '/(tabs)/alertes' },
  '/connexion': { route: '/connexion' },
  '/tracking-live': { route: '/tracking-live' },
  '/pharmacies': { endpoint: '/places/pharmacy?limit=5000', title: 'Pharmacies' },
  '/hopitaux': { endpoint: '/places/hospital?limit=500', title: 'Hôpitaux & santé' },
  '/banques': { endpoint: '/banques', title: "Retrait d'argent" },
  '/stations': { endpoint: '/stations', title: 'Stations-service' },
  '/boutiques': { endpoint: '/boutiques', title: 'Boutiques & artisans' },
  '/boutiques-marches': { endpoint: '/boutiques', title: 'Boutiques & marchés' },
  '/restaurants': { endpoint: '/places?placeType=restaurant&limit=500', title: 'Restaurants' },
  '/marches': { endpoint: '/marches', title: 'Marchés' },
  '/hotels': { endpoint: '/places?placeType=hotel&limit=500', title: 'Hôtels & auberges' },
  '/gares': { endpoint: '/transport', title: 'Transport' },
  '/telephonie': { endpoint: '/telephonie', title: 'Téléphonie & réparation' },
  '/mairies-prefectures': { endpoint: '/mairies-prefectures', title: 'Mairies & préfectures' },
  '/ministeres': { endpoint: '/ministeres', title: 'Ministères' },
  '/lieux-de-culte': { endpoint: '/lieux-de-culte', title: 'Lieux de culte' },
  '/universites': { endpoint: '/universites', title: 'Universités & instituts' },
  '/sonabel-onea': { endpoint: '/sonabel-onea', title: 'SONABEL & ONEA' },
  '/cine': { endpoint: '/cinema/info', title: 'Programme ciné' },
  '/cimetieres': { endpoint: '/cimetieres', title: 'Cimetières' },
};

export default function ServicesScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();

  const selectedCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const selectedRoute = selectedCategory ? categoryRoutes[selectedCategory] : undefined;
  const selectedLabel = selectedRoute ? categoryLabels[selectedRoute] : undefined;

  function openFeature(route: string) {
    const destination = nativeDestinations[route];
    if (!destination) return;

    if ('route' in destination) {
      router.push(destination.route);
      return;
    }

    router.push({
      pathname: '/place-results',
      params: { endpoint: destination.endpoint, title: destination.title },
    });
  }

  return (
    <Screen title="Services disponibles" subtitle="Les parcours BurkinaWatch intégrés à l’application" showBack>
      <Pressable
        onPress={() => router.push('/burkina-pratique')}
        style={({ pressed }) => [
          styles.pratique,
          { backgroundColor: colors.primary, borderColor: colors.primary, opacity: pressed ? 0.8 : 1 },
        ]}
        testID="service-link-burkina-pratique"
      >
        <View style={styles.pratiqueIcon}>
          <Feather name="compass" size={21} color={colors.primary} />
        </View>
        <View style={styles.pratiqueCopy}>
          <Text style={[styles.pratiqueTitle, { color: colors.primaryForeground }]}>Burkina Pratique</Text>
          <Text style={[styles.pratiqueText, { color: colors.primaryForeground }]}>Chercher un service, un lieu ou une solution.</Text>
        </View>
        <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
      </Pressable>
      {selectedLabel ? (
        <View style={[styles.filter, { backgroundColor: colors.muted, borderColor: colors.primary }]}>
          <Feather name="filter" size={15} color={colors.primary} />
          <Text style={[styles.filterText, { color: colors.foreground }]}>Catégorie sélectionnée : {selectedLabel}</Text>
        </View>
      ) : null}
      {serviceGroups.map((group) => (
        <View key={group.title}>
          <SectionTitle eyebrow="BURKINAWATCH" title={group.title} />
          <View style={styles.grid}>
            {group.items.map(([label, route, icon]) => (
              <Pressable
                key={route}
                onPress={() => openFeature(route)}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir ${label}`}
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor: route === selectedRoute ? colors.muted : colors.card,
                    borderColor: route === selectedRoute ? colors.primary : colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                testID={`service-link-${route.replace('/', '')}`}
              >
                <Feather name={icon as keyof typeof Feather.glyphMap} size={19} color={colors.primary} />
                <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
                <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Text style={[styles.note, { color: colors.mutedForeground }]}>Les services affichés restent dans l’application et utilisent les mêmes données BurkinaWatch. Les pages Web non intégrées ne sont pas proposées ici afin d’éviter les parcours incomplets.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pratique: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 14 },
  pratiqueIcon: { alignItems: 'center', backgroundColor: '#f4c430', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  pratiqueCopy: { flex: 1 },
  pratiqueTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  pratiqueText: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
  filter: { alignItems: 'center', borderRadius: 11, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 11 },
  filterText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  grid: { gap: 9 },
  item: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 14 },
  label: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});