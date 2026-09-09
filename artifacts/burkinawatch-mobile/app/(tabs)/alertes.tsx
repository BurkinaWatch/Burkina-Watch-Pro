import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { requestJson } from '@/lib/api';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/Brand';

type NotificationItem = { id: string | number; title?: string; message?: string; createdAt?: string; read?: boolean };

export default function AlertsScreen() {
  const colors = useColors();
  const router = useRouter();
  const notifications = useQuery<NotificationItem[]>({
    queryKey: ['mobile-notifications'],
    queryFn: () => requestJson<NotificationItem[]>('/notifications'),
    staleTime: 30_000,
    retry: 0,
  });

  return (
    <Screen title="Alertes" subtitle="Les nouvelles importantes, au même endroit" refreshing={notifications.isRefetching} onRefresh={() => void notifications.refetch()}>
      <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.bannerIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="bell" size={19} color={colors.secondaryForeground} />
        </View>
        <View style={styles.bannerCopy}>
          <Text style={[styles.bannerTitle, { color: colors.foreground }]}>Restez informé</Text>
          <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>Les alertes personnelles se synchronisent avec votre compte BurkinaWatch.</Text>
        </View>
      </View>
      <SectionTitle eyebrow="VOTRE FIL" title="Notifications" />
      {notifications.isLoading ? <LoadingState label="Synchronisation…" /> : null}
      {notifications.isError ? (
        <View style={styles.errorWrap}>
          <ErrorState onRetry={() => void notifications.refetch()} />
          <Pressable onPress={() => router.push('/connexion')} testID="button-notification-login">
            <Text style={[styles.loginLink, { color: colors.primary }]}>Se connecter pour retrouver mes alertes</Text>
          </Pressable>
        </View>
      ) : null}
      {!notifications.isLoading && !notifications.isError && !notifications.data?.length ? (
        <EmptyState title="Aucune notification" description="Vous verrez ici les mises à jour de vos signalements et les alertes importantes." icon="bell-off" />
      ) : null}
      {notifications.data?.map((notification) => (
        <View key={String(notification.id)} style={[styles.notification, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name={notification.read ? 'check-circle' : 'bell'} size={18} color={colors.primary} />
          <View style={styles.bannerCopy}>
            <Text style={[styles.notificationTitle, { color: colors.foreground }]}>{notification.title || 'Mise à jour BurkinaWatch'}</Text>
            <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>{notification.message || 'Une mise à jour est disponible.'}</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 15 },
  bannerIcon: { alignItems: 'center', borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  bannerCopy: { flex: 1 },
  bannerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  bannerText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 4 },
  errorWrap: { alignItems: 'center', gap: 12 },
  loginLink: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  notification: { alignItems: 'flex-start', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 15 },
  notificationTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});