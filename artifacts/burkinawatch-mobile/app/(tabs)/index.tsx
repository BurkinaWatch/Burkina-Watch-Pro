import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { requestJson, Signalement, Stats } from '@/lib/api';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/Brand';
import { SignalementCard } from '@/components/SignalementCard';

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
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.primaryForeground }]}>LA VIGILANCE CITOYENNE</Text>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Votre Burkina, notre regard.</Text>
          <Text style={[styles.heroBody, { color: colors.primaryForeground }]}>Retrouvez les alertes, services et contributions de la communauté.</Text>
        </View>
        <Feather name="shield" size={58} color={colors.primaryForeground} />
      </View>

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
  hero: { alignItems: 'center', borderRadius: 24, flexDirection: 'row', gap: 16, justifyContent: 'space-between', overflow: 'hidden', padding: 22 },
  heroCopy: { flex: 1 },
  kicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.3, opacity: 0.8 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 27, letterSpacing: -0.8, lineHeight: 32, marginTop: 8 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 9, opacity: 0.86 },
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