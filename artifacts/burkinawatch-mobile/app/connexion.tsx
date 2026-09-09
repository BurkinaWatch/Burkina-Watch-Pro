import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Screen } from '@/components/Screen';

export default function ConnectionScreen() {
  const colors = useColors();
  const router = useRouter();
  async function openWebLogin() {
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (domain) await Linking.openURL(`https://${domain}/connexion`);
    else router.back();
  }
  return (
    <Screen title="Connexion" subtitle="Retrouver votre identité BurkinaWatch" showBack>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: colors.muted }]}><Feather name="lock" size={23} color={colors.primary} /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>Une connexion sécurisée, sans contournement</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>La version Web utilise une session cookie. L’application mobile attend le contrat d’accès et de renouvellement approuvé par le backend avant d’enregistrer un jeton.</Text>
      </View>
      <Pressable onPress={() => void openWebLogin()} style={[styles.button, { backgroundColor: colors.primary }]} testID="button-open-web-login">
        <Feather name="external-link" size={18} color={colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Ouvrir la connexion Web</Text>
      </Pressable>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>Ce choix évite de partager ou de réutiliser les cookies du navigateur dans l’application native.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 22 },
  icon: { alignItems: 'center', borderRadius: 99, height: 54, justifyContent: 'center', width: 54 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.3, marginTop: 15, textAlign: 'center' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 10, textAlign: 'center' },
  button: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 9, justifyContent: 'center', paddingVertical: 14 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});