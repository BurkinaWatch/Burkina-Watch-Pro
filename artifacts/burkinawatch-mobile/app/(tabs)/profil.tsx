import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Screen } from '@/components/Screen';

const items = [
  { label: 'Mes signalements', description: 'Suivre vos contributions citoyennes', icon: 'file-text' as const, route: '/feed' },
  { label: 'Classement citoyen', description: 'Découvrir les contributeurs actifs', icon: 'award' as const, route: '/services' },
  { label: 'Préférences', description: 'Notifications et confidentialité', icon: 'sliders' as const, route: '/alertes' },
  { label: 'À propos & aide', description: 'Guide, fiabilité et conditions', icon: 'info' as const, route: '/services' },
] as const;

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  return (
    <Screen title="Profil" subtitle="Votre espace BurkinaWatch">
      <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primaryForeground }]}>
          <Feather name="user" size={25} color={colors.primary} />
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.profileTitle, { color: colors.primaryForeground }]}>Mode invité</Text>
          <Text style={[styles.profileText, { color: colors.primaryForeground }]}>Connectez-vous pour retrouver votre activité sur tous vos appareils.</Text>
        </View>
      </View>
      <Pressable onPress={() => router.push('/connexion')} style={[styles.signIn, { borderColor: colors.primary }]} testID="button-sign-in">
        <Feather name="log-in" size={18} color={colors.primary} />
        <Text style={[styles.signInText, { color: colors.primary }]}>Se connecter à BurkinaWatch</Text>
      </Pressable>
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
        L’application mobile n’utilise pas les cookies du Web et n’invente pas de jeton d’accès. Le contrat d’authentification mobile sera branché dès qu’il sera exposé par l’API.
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
  items: { gap: 10 },
  item: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  itemIcon: { alignItems: 'center', borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  itemTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  itemText: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});