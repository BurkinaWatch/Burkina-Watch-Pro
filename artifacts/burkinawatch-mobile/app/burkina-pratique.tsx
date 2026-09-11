import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/Brand';
import { practicalCategories, practicalQuickLinks, type PracticalItem } from '@/lib/practicalNavigation';
import { buildPracticalRoute, parsePracticalSearch, practicalFilterLabel } from '@/lib/practicalSearch';

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

function PracticalLink({
  item,
  onPress,
  compact = false,
}: {
  item: PracticalItem;
  onPress: () => void;
  compact?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${item.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.category : styles.quickLink,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
      ]}
      testID={`pratique-${item.route.replace(/\//g, '')}-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={item.icon} size={compact ? 17 : 20} color={colors.primary} />
      </View>
      <View style={styles.linkCopy}>
        <Text style={[compact ? styles.categoryLabel : styles.quickLabel, { color: colors.foreground }]}>{item.label}</Text>
        {!compact ? <Text style={[styles.linkDescription, { color: colors.mutedForeground }]}>{item.description}</Text> : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function BurkinaPratiqueScreen() {
  const colors = useColors();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const normalizedQuery = normalize(query);
  const intent = useMemo(() => parsePracticalSearch(query), [query]);
  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    const matches = practicalCategories
      .filter((item) => normalize(`${item.label} ${item.description} ${item.keywords.join(' ')}`).includes(normalizedQuery));
    const intentCategory = intent.matched
      ? practicalCategories.find((item) => item.route === intent.href && (item.label === intent.label || intent.key === 'commerces'))
      : undefined;
    return [...(intentCategory ? [intentCategory] : []), ...matches.filter((item) => item !== intentCategory)].slice(0, 5);
  }, [intent, normalizedQuery]);

  const openRoute = (route: string) => {
    Keyboard.dismiss();
    router.push(route as never);
  };

  const openIntent = () => {
    const route = buildPracticalRoute(intent);
    if (route) openRoute(route);
  };

  return (
    <Screen title="Burkina Pratique" subtitle="Trouver un service, un lieu ou une solution" showBack>
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroAccent} />
        <Text style={[styles.eyebrow, { color: colors.primaryForeground }]}>POUR LA VIE QUOTIDIENNE</Text>
        <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Que cherchez-vous ?</Text>
        <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>
          Une nouvelle porte d’entrée vers les services déjà disponibles dans BurkinaWatch.
        </Text>
      </View>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={19} color={colors.mutedForeground} />
        <TextInput
          accessibilityLabel="Rechercher un service, un lieu ou une solution"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          onSubmitEditing={() => (intent.matched ? openIntent() : results[0] && openRoute(results[0].route))}
          placeholder="Je cherche un service, un lieu ou une solution..."
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="search"
          style={[styles.input, { color: colors.foreground }]}
          testID="input-mobile-burkina-pratique-search"
          value={query}
        />
      </View>

      {normalizedQuery && intent.matched ? (
        <View style={[styles.intentCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="mobile-practical-intent-summary">
          <View style={styles.intentHeader}>
            <Text style={[styles.intentEyebrow, { color: colors.primary }]}>INTENTION COMPRISE</Text>
            <Text style={[styles.intentTitle, { color: colors.foreground }]}>{intent.label}</Text>
          </View>
          {intent.filters.length ? (
            <View style={styles.filterRow}>
              {intent.filters.map((filter) => (
                <View key={filter} style={[styles.filterPill, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.filterText, { color: colors.foreground }]}>{practicalFilterLabel(filter, intent.budget)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <Text style={[styles.intentNote, { color: colors.mutedForeground }]}>
            Les résultats restent ceux de la catégorie existante. Une ouverture ou disponibilité inconnue reste inconnue.
          </Text>
          <Pressable onPress={openIntent} style={[styles.intentButton, { backgroundColor: colors.primary }]} testID="button-mobile-practical-intent">
            <Text style={[styles.intentButtonText, { color: colors.primaryForeground }]}>Voir les résultats existants</Text>
            <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
          </Pressable>
        </View>
      ) : null}

      {normalizedQuery ? (
        <View style={styles.results}>
          {results.length ? results.map((item) => <PracticalLink key={`${item.route}-${item.label}`} item={item} onPress={() => openRoute(item.route)} />) : (
            <Text style={[styles.noResult, { color: colors.mutedForeground }]}>Aucune catégorie correspondante. Essayez « pharmacie », « banque » ou « transport ».</Text>
          )}
        </View>
      ) : null}

      <View>
        <SectionTitle eyebrow="BESOIN MAINTENANT" title="Accès rapides" />
        <View style={styles.quickGrid}>
          {practicalQuickLinks.map((item) => <PracticalLink key={item.label} item={item} onPress={() => openRoute(item.route)} />)}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvrir les services autour de moi"
        onPress={() => openRoute('/carte')}
        style={({ pressed }) => [styles.around, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
        testID="button-mobile-pratique-around-me"
      >
        <View style={[styles.aroundIcon, { backgroundColor: colors.secondaryForeground }]}>
          <Feather name="map-pin" size={20} color={colors.secondary} />
        </View>
        <View style={styles.aroundCopy}>
          <Text style={[styles.aroundTitle, { color: colors.secondaryForeground }]}>Autour de moi</Text>
          <Text style={[styles.aroundBody, { color: colors.secondaryForeground }]}>Ouvrir la carte existante et utiliser ma position.</Text>
        </View>
        <Feather name="arrow-right" size={20} color={colors.secondaryForeground} />
      </Pressable>

      <View>
        <SectionTitle eyebrow="EXPLORER" title="Par catégorie" />
        <View style={styles.categories}>
          {practicalCategories.map((item) => <PracticalLink key={`${item.route}-${item.label}`} compact item={item} onPress={() => openRoute(item.route)} />)}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, overflow: 'hidden', padding: 22, position: 'relative' },
  heroAccent: { backgroundColor: '#f4c430', borderRadius: 99, height: 7, left: 0, position: 'absolute', top: 0, width: 74 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, opacity: 0.8 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.7, marginTop: 9 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 9, maxWidth: 320, opacity: 0.88 },
  searchBox: { alignItems: 'center', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 56, paddingHorizontal: 15 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, minHeight: 54 },
  results: { gap: 8, marginTop: -12 },
  intentCard: { borderRadius: 16, borderWidth: 1, gap: 10, padding: 14 },
  intentHeader: { gap: 4 },
  intentEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.1 },
  intentTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  filterPill: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6 },
  filterText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  intentNote: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  intentButton: { alignItems: 'center', borderRadius: 11, flexDirection: 'row', gap: 7, justifyContent: 'center', paddingVertical: 11 },
  intentButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  noResult: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, paddingHorizontal: 4 },
  quickGrid: { gap: 9 },
  quickLink: { alignItems: 'center', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 11, minHeight: 68, padding: 12 },
  iconWrap: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  linkCopy: { flex: 1 },
  quickLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  linkDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 2 },
  around: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 15 },
  aroundIcon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  aroundCopy: { flex: 1 },
  aroundTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  aroundBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, marginTop: 3 },
  categories: { gap: 8 },
  category: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 54, paddingHorizontal: 11 },
  categoryLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});