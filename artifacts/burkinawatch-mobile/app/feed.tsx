import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Signalement, requestJson } from '@/lib/api';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/Screen';
import { SignalementCard } from '@/components/SignalementCard';
import { SectionTitle } from '@/components/Brand';
import { View } from 'react-native';

export default function FeedScreen() {
  const router = useRouter();
  const query = useQuery<Signalement[]>({
    queryKey: ['mobile-feed'],
    queryFn: () => requestJson<Signalement[]>('/signalements'),
    retry: 1,
  });
  return (
    <Screen title="Fil d’actualité" subtitle="Les contributions de la communauté" showBack refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <SectionTitle eyebrow="COMMUNAUTÉ" title="Tous les signalements" />
      {query.isLoading ? <LoadingState label="Chargement du fil…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && !query.data?.length ? <EmptyState title="Le fil est vide" description="Aucun signalement n’est disponible pour le moment." icon="radio" /> : null}
      <View style={{ gap: 10 }}>
        {query.data?.map((item) => <SignalementCard key={String(item.id)} item={item} onPress={() => router.push(`/signalement/${item.id}`)} />)}
      </View>
    </Screen>
  );
}