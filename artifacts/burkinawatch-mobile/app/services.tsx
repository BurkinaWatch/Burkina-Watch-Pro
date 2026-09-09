import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/Brand';

const serviceGroups = [
  { title: 'Sécurité & mobilité', items: [['Urgences', '/urgences', 'phone-call'], ['Stations-service', '/stations', 'truck'], ['Gares routières', '/gares', 'navigation'], ['Suivi en direct', '/tracking-live', 'radio'], ['Surveillance', '/surveillance', 'video'], ['StreetView citoyen', '/streetview', 'camera'], ['Ouaga 3D', '/ouaga3d', 'box']] },
  { title: 'Vie quotidienne', items: [['Pharmacies de garde', '/pharmacies', 'plus-square'], ['Hôpitaux', '/hopitaux', 'heart'], ['Restaurants', '/restaurants', 'coffee'], ['Hôtels', '/hotels', 'home'], ['Banques', '/banques', 'credit-card'], ['Cimetières', '/cimetieres', 'map-pin']] },
  { title: 'Information & citoyenneté', items: [['Marchés', '/marches', 'shopping-bag'], ['Boutiques', '/boutiques', 'shopping-bag'], ['Marchés & boutiques', '/boutiques-marches', 'grid'], ['Universités', '/universites', 'book-open'], ['Mairies & préfectures', '/mairies-prefectures', 'map'], ['Ministères', '/ministeres', 'briefcase'], ['Bulletin citoyen', '/bulletin', 'file-text'], ['Contribuer', '/contribuer', 'edit-3'], ['Classement', '/leaderboard', 'award']] },
  { title: 'Culture & information', items: [['Cinéma', '/cine', 'film'], ['Événements', '/events', 'calendar'], ['Lieux de culte', '/lieux-de-culte', 'heart'], ['Météo', '/meteo', 'cloud'], ['Sonabel & ONEA', '/sonabel-onea', 'zap'], ['Téléphonie', '/telephonie', 'smartphone']] },
  { title: 'Compte & transparence', items: [['Fil d’actualité', '/feed', 'radio'], ['Notifications', '/notifications', 'bell'], ['Guide', '/guide', 'book-open'], ['À propos', '/a-propos', 'info'], ['Fiabilité', '/fiabilite', 'check-circle'], ['Conditions', '/conditions', 'file-text'], ['Confidentialité', '/confidentialite', 'lock'], ['Connexion', '/connexion', 'log-in']] },
] as const;

export default function ServicesScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  async function openFeature(route: string) {
    if (route === '/urgences') {
      router.push('/sos');
      return;
    }
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) {
      await Linking.openURL(`https://${domain}${route}`);
    } else {
      router.push('/services');
    }
  }
  return (
    <Screen title="Tous les services" subtitle="L’écosystème BurkinaWatch sur mobile" showBack>
      {params.category ? <View style={[styles.filter, { backgroundColor: colors.muted }]}><Feather name="filter" size={15} color={colors.primary} /><Text style={[styles.filterText, { color: colors.foreground }]}>Catégorie sélectionnée : {params.category}</Text></View> : null}
      {serviceGroups.map((group) => (
        <View key={group.title}>
          <SectionTitle eyebrow="BURKINAWATCH" title={group.title} />
          <View style={styles.grid}>
            {group.items.map(([label, route, icon]) => (
              <Pressable key={route} onPress={() => void openFeature(route)} style={({ pressed }) => [styles.item, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]} testID={`service-link-${route.replace('/', '')}`}>
                <Feather name={icon as keyof typeof Feather.glyphMap} size={19} color={colors.primary} />
                <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
                <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Text style={[styles.note, { color: colors.mutedForeground }]}>Les parcours natifs prioritaires restent dans l’application. Les fonctionnalités Web complexes s’ouvrent sur leur route BurkinaWatch existante, sans créer de serveur parallèle ni perdre le contexte produit.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filter: { alignItems: 'center', borderRadius: 11, flexDirection: 'row', gap: 8, padding: 11 },
  filterText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  grid: { gap: 9 },
  item: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 11, padding: 14 },
  label: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});