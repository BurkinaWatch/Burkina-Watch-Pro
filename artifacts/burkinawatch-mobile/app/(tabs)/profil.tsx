import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { getGetMobileSessionsQueryKey, useGetMobileSessions } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/lib/auth';

const items = [
  { label: 'Mes signalements', description: 'Suivre vos contributions citoyennes', icon: 'file-text' as const, route: '/feed' },
  { label: 'Classement citoyen', description: 'Découvrir les contributeurs actifs', icon: 'award' as const, route: '/services' },
  { label: 'Préférences', description: 'Notifications et confidentialité', icon: 'sliders' as const, route: '/alertes' },
  { label: 'À propos & aide', description: 'Guide, fiabilité et conditions', icon: 'info' as const, route: '/services' },
] as const;

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, signOut, revokeAllSessions } = useAuth();
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const { data: mobileSessionsData, isLoading: mobileSessionsLoading, isError: mobileSessionsError } = useGetMobileSessions({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetMobileSessionsQueryKey(),
    },
  });
  const mobileSessions = mobileSessionsData?.sessions ?? [];
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Sentinelle';

  function confirmRevokeAllSessions() {
    if (isRevokingSessions) return;

    Alert.alert(
      'Révoquer toutes les sessions ?',
      'Tous les appareils mobiles seront déconnectés. Cette action est utile si vous avez perdu un téléphone.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: () => {
            setIsRevokingSessions(true);
            void revokeAllSessions()
              .catch(() => {
                Alert.alert(
                  'Révocation impossible',
                  'Vérifiez votre connexion puis réessayez.',
                );
              })
              .finally(() => setIsRevokingSessions(false));
          },
        },
      ],
    );
  }

  return (
    <Screen title="Profil" subtitle="Votre espace BurkinaWatch">
      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryForeground }]}>
          <Feather name="user" size={25} color={colors.primary} />
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.profileTitle, { color: colors.primaryForeground }]}>{isLoading ? 'Chargement…' : isAuthenticated ? displayName : 'Mode invité'}</Text>
          <Text style={[styles.profileText, { color: colors.primaryForeground }]}>{isAuthenticated ? user?.email || 'Compte BurkinaWatch synchronisé' : 'Connectez-vous pour retrouver votre activité sur tous vos appareils.'}</Text>
        </View>
      </View>
      <Pressable onPress={() => isAuthenticated ? void signOut() : router.push('/connexion')} style={[styles.signIn, { borderColor: colors.primary }]} testID={isAuthenticated ? 'button-sign-out' : 'button-sign-in'}>
        <Feather name={isAuthenticated ? 'log-out' : 'log-in'} size={18} color={colors.primary} />
        <Text style={[styles.signInText, { color: colors.primary }]}>{isAuthenticated ? 'Se déconnecter' : 'Se connecter à BurkinaWatch'}</Text>
      </Pressable>
      {isAuthenticated && (
        <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.securityCopy}>
            <Text style={[styles.securityTitle, { color: colors.foreground }]}>Sécurité du compte</Text>
            <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
              Consultez les appareils mobiles encore connectés avant de révoquer toutes les sessions.
            </Text>
          </View>
          <View style={[styles.sessionsList, { borderTopColor: colors.border }]} testID="mobile-sessions-list">
            <Text style={[styles.sessionsTitle, { color: colors.foreground }]}>Appareils actifs</Text>
            {mobileSessionsLoading ? (
              <Text style={[styles.sessionState, { color: colors.mutedForeground }]}>Chargement des sessions…</Text>
            ) : mobileSessionsError ? (
              <Text style={[styles.sessionState, { color: colors.mutedForeground }]}>Sessions indisponibles pour le moment.</Text>
            ) : mobileSessions.length === 0 ? (
              <Text style={[styles.sessionState, { color: colors.mutedForeground }]}>Aucun appareil mobile actif.</Text>
            ) : (
              mobileSessions.map((session) => (
                <View key={session.id} style={[styles.sessionRow, { borderColor: colors.border }]} testID={`mobile-session-${session.id}`}>
                  <View style={[styles.sessionIcon, { backgroundColor: colors.muted }]}>
                    <Feather name="smartphone" size={17} color={colors.primary} />
                  </View>
                  <View style={styles.profileCopy}>
                    <Text style={[styles.sessionName, { color: colors.foreground }]}>{session.device} · {session.browser}</Text>
                    <Text style={[styles.sessionDetail, { color: colors.mutedForeground }]}>
                      Créée le {new Date(session.createdAt).toLocaleString('fr-FR')}
                    </Text>
                    <Text style={[styles.sessionDetail, { color: colors.mutedForeground }]}>
                      Expire le {new Date(session.expiresAt).toLocaleString('fr-FR')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
          <Pressable
            onPress={confirmRevokeAllSessions}
            disabled={isRevokingSessions}
            style={[styles.revokeButton, { borderColor: colors.destructive, opacity: isRevokingSessions ? 0.55 : 1 }]}
            testID="button-revoke-all-sessions"
          >
            <Feather name="shield-off" size={17} color={colors.destructive} />
            <Text style={[styles.revokeButtonText, { color: colors.destructive }]}>
              {isRevokingSessions ? 'Révocation…' : 'Révoquer toutes les sessions'}
            </Text>
          </Pressable>
        </View>
      )}
      <View style={styles.items}>
        {items.map((item) => (
          <Pressable key={item.label} onPress={() => router.push(item.route)} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]} testID={`profile-${item.label}`}>
            <View style={[styles.itemIcon, { backgroundColor: colors.muted }]}>
              <Feather name={item.icon} size={18} color={colors.primary} />
            </View>
            <View style={styles.profileCopy}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.itemText, { color: colors.mutedForeground }]}>{item.description}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        L’application mobile n’utilise pas les cookies du Web. Les alertes et le profil sont associés à la même identité serveur que la version Web.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { alignItems: 'center', borderRadius: 22, flexDirection: 'row', gap: 14, padding: 20 },
  avatar: { alignItems: 'center', borderRadius: 99, height: 52, justifyContent: 'center', width: 52 },
  profileCopy: { flex: 1 },
  profileTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  profileText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 5 },
  signIn: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 9, justifyContent: 'center', paddingVertical: 13 },
  signInText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  securityCard: { borderRadius: 16, borderWidth: 1, gap: 14, padding: 16 },
  securityCopy: { gap: 4 },
  securityTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  securityText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  sessionsList: { borderTopWidth: 1, gap: 9, paddingTop: 13 },
  sessionsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  sessionState: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  sessionRow: { alignItems: 'flex-start', borderRadius: 11, borderWidth: 1, flexDirection: 'row', gap: 9, padding: 10 },
  sessionIcon: { alignItems: 'center', borderRadius: 9, height: 32, justifyContent: 'center', width: 32 },
  sessionName: { fontFamily: 'Inter_600SemiBold', fontSize: 12, lineHeight: 17 },
  sessionDetail: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  revokeButton: { alignItems: 'center', borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 11 },
  revokeButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  items: { gap: 10 },
  item: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  itemIcon: { alignItems: 'center', borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  itemTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  itemText: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});