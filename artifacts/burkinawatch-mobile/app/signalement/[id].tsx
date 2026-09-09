import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { requestJson, Signalement } from '@/lib/api';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/Screen';

export default function SignalementDetailScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery<Signalement>({
    queryKey: ['mobile-signalement', id],
    queryFn: () => requestJson<Signalement>(`/signalements/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
    retry: 1,
  });
  const item = query.data;
  return (
    <Screen title="Détail du signalement" subtitle="Information citoyenne vérifiée" showBack>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && !item ? <EmptyState title="Signalement introuvable" description="Ce contenu n’est plus disponible ou n’a pas encore été publié." icon="search" /> : null}
      {item ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heading}>
            <View style={[styles.icon, { backgroundColor: colors.muted }]}><Feather name="alert-triangle" size={20} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.title, { color: colors.foreground }]}>{item.titre || item.title || 'Signalement citoyen'}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.categorie || item.category || 'Communauté'}</Text></View>
          </View>
          <Text style={[styles.body, { color: colors.foreground }]}>{item.description || 'Aucune description supplémentaire.'}</Text>
          <View style={[styles.status, { backgroundColor: colors.secondary }]}><Text style={[styles.statusText, { color: colors.secondaryForeground }]}>{item.statut || item.status || 'Publié'}</Text></View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 19, borderWidth: 1, gap: 18, padding: 18 },
  heading: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  icon: { alignItems: 'center', borderRadius: 13, height: 44, justifyContent: 'center', width: 44 },
  copy: { flex: 1 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 24 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 },
  status: { alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
});