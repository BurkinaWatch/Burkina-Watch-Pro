import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { requestJson, Signalement, Stats } from '@/lib/api';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/Brand';
import { SignalementCard } from '@/components/SignalementCard';
import heroImage from '@/assets/hero-citizens.png';

const quickActions = [
  { label: 'Signaler', icon: 'plus-circle' as const, route: '/signaler', tone: 'danger' as const },
  { label: 'SOS', icon: 'phone-call' as const, route: '/sos', tone: 'danger' as const },
  { label: 'Services', icon: 'grid' as const, route: '/services', tone: 'primary' as const },
  { label: 'Carte', icon: 'map-pin' as const, route: '/carte', tone: 'secondary' as const },
] as const;

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const signalements = useQuery<Signalement[]>({
    queryKey: ['mobile-signalements'],
    queryFn: () => requestJson<Signalement[]>('/signalements'),
    staleTime: 30_000,
    retry: 1,
  });
  const stats = useQuery<Stats>({
    queryKey: ['mobile-stats'],
    queryFn: () => requestJson<Stats>('/stats'),
    staleTime: 60_000,
    retry: 1,
  });
  const items = signalements.data ?? [];
  const total = stats.data?.total ?? stats.data?.totalSignalements;

  return (
    <Screen refreshing={signalements.isRefetching} onRefresh={() => { void signalements.refetch(); void stats.refetch(); }}>
      <ImageBackground
        source={heroImage}
        resizeMode="cover"
        imageStyle={styles.heroImage}
        style={[styles.hero, { backgroundColor: colors.primary }]}
        accessibilityLabel="Citoyens burkinabè collaborant avec leurs téléphones"
      >
        <View style={[styles.heroWash, { backgroundColor: colors.primary }]} />
        <View style={[styles.heroAccent, { backgroundColor: colors.secondary }]} />
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.primaryForeground }]}>LA VIGILANCE CITOYENNE</Text>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Notre Burkina,{'\n'}secure.</Text>
          <View style={styles.slogan} accessibilityLabel="Voir. Agir. Protéger.">
            <Text style={[styles.sloganWord, { color: colors.destructive }]}>Voir.</Text>
            <Text style={[styles.sloganWord, { color: colors.secondary }]}>Agir.</Text>
            <Text style={[styles.sloganWord, { color: colors.primaryForeground }]}>Protéger.</Text>
          </View>
          <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>Retrouvez les alertes, services et contributions de la communauté.</Text>
        </View>
        <View style={[styles.shield, { borderColor: colors.primaryForeground }]}>
          <Feather name="shield" size={56} color={colors.primaryForeground} />
        </View>
      </ImageBackground>

      <View style={styles.actionsGrid}>
        {quickActions.map((action) => {
          const background = action.tone === 'danger' ? colors.destructive : action.tone === 'secondary' ? colors.secondary : colors.card;
          const foreground = action.tone === 'secondary' ? colors.secondaryForeground : action.tone === 'primary' ? colors.primary : colors.destructiveForeground;
          return (
            <Pressable
              key={action.route}
              onPress={() => router.push(action.route)}
              style={({ pressed }) => [styles.action, { backgroundColor: background, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}
              testID={`quick-${action.label.toLowerCase()}`}
            >
              <Feather name={action.icon} size={21} color={foreground} />
              <Text style={[styles.actionText, { color: foreground }]}>{action.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.stats, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.stat}><Text style={[styles.statValue, { color: colors.foreground }]}>{total ?? '—'}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>signalements</Text></View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}><Text style={[styles.statValue, { color: colors.primary }]}>{stats.data?.resolus ?? '—'}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>résolus</Text></View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}><Text style={[styles.statValue, { color: colors.secondary }]}>{stats.data?.enCours ?? '—'}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>en cours</Text></View>
      </View>

      <View>
        <SectionTitle eyebrow="EN DIRECT" title="Signalements récents" action="Voir tout" onAction={() => router.push('/feed')} />
        {signalements.isLoading ? <LoadingState label="Récupération des signalements…" /> : null}
        {signalements.isError ? <ErrorState onRetry={() => void signalements.refetch()} /> : null}
        {!signalements.isLoading && !signalements.isError && items.length === 0 ? <EmptyState title="Aucun signalement récent" description="Les nouveaux signalements validés apparaîtront ici." icon="check-circle" /> : null}
        {!signalements.isLoading && !signalements.isError ? <View style={styles.list}>{items.slice(0, 4).map((item) => <SignalementCard key={String(item.id)} item={item} onPress={() => router.push(`/signalement/${item.id}`)} />)}</View> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', borderRadius: 24, flexDirection: 'row', gap: 15, justifyContent: 'space-between', minHeight: 184, overflow: 'hidden', padding: 22, paddingLeft: 26, position: 'relative' },
  heroImage: { opacity: 0.22 },
  heroWash: { bottom: 0, left: 0, opacity: 0.84, position: 'absolute', right: 0, top: 0 },
  heroAccent: { borderRadius: 99, height: 7, left: 0, position: 'absolute', top: 0, width: 72 },
  heroCopy: { flex: 1 },
  kicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.3, opacity: 0.8 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.8, lineHeight: 31, marginTop: 8 },
  slogan: { flexDirection: 'row', gap: 5, marginTop: 10 },
  sloganWord: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 8, opacity: 0.86 },
  shield: { alignItems: 'center', borderRadius: 99, borderWidth: 2, height: 84, justifyContent: 'center', width: 84 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: { alignItems: 'center', borderRadius: 15, borderWidth: 1, flexBasis: '47%', flexDirection: 'row', gap: 10, minHeight: 56, paddingHorizontal: 14 },
  actionText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  stats: { alignItems: 'center', borderRadius: 17, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', padding: 16 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  divider: { height: 34, width: StyleSheet.hairlineWidth },
  list: { gap: 10 },
});