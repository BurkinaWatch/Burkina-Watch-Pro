import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/lib/auth';

export default function ConnectionScreen() {
  const colors = useColors();
  const router = useRouter();
  const { sendCode, signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [step, setStep] = React.useState<'email' | 'code'>('email');
  const [status, setStatus] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function requestCode() {
    if (!email.trim()) {
      setStatus('Saisissez votre adresse email.');
      return;
    }
    setIsSubmitting(true);
    try {
      const message = await sendCode(email.trim().toLowerCase());
      setStatus(message || 'Code envoyé. Consultez votre boîte mail.');
      setStep('code');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Impossible d’envoyer le code.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode() {
    if (!code.trim()) {
      setStatus('Saisissez le code reçu par email.');
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn(email.trim().toLowerCase(), code.trim());
      router.replace('/(tabs)/profil');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Code invalide ou expiré.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen title="Connexion" subtitle="Retrouver votre identité BurkinaWatch" showBack>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.icon, { backgroundColor: colors.muted }]}><Feather name="lock" size={23} color={colors.primary} /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>Une connexion sécurisée</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Recevez un code à usage unique, puis l’application conserve uniquement des jetons mobiles dans le coffre sécurisé de l’appareil.</Text>
      </View>
      {step === 'email' ? (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Adresse email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="vous@exemple.com"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground }]}
            testID="input-login-email"
          />
          <Pressable disabled={isSubmitting} onPress={() => void requestCode()} style={[styles.button, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 }]} testID="button-request-code">
            <Feather name="mail" size={18} color={colors.primaryForeground} />
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{isSubmitting ? 'Envoi…' : 'Recevoir un code'}</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Code reçu par email</Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoComplete="one-time-code"
            keyboardType="number-pad"
            maxLength={6}
            placeholder="123456"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground }]}
            testID="input-login-code"
          />
          <Pressable disabled={isSubmitting} onPress={() => void verifyCode()} style={[styles.button, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 }]} testID="button-verify-code">
            <Feather name="check" size={18} color={colors.primaryForeground} />
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{isSubmitting ? 'Vérification…' : 'Se connecter'}</Text>
          </Pressable>
          <Pressable disabled={isSubmitting} onPress={() => setStep('email')} testID="button-change-email">
            <Text style={[styles.link, { color: colors.primary }]}>Utiliser une autre adresse</Text>
          </Pressable>
        </>
      )}
      {status ? <Text style={[styles.status, { color: colors.primary }]}>{status}</Text> : null}
      <Text style={[styles.note, { color: colors.mutedForeground }]}>Aucun cookie Web n’est partagé. Les permissions, la propriété des signalements et la modération restent vérifiées par le serveur.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderRadius: 20, borderWidth: 1, padding: 22 },
  icon: { alignItems: 'center', borderRadius: 99, height: 54, justifyContent: 'center', width: 54 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.3, marginTop: 15, textAlign: 'center' },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 10, textAlign: 'center' },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 5 },
  input: { borderRadius: 11, borderWidth: 1, fontFamily: 'Inter_400Regular', fontSize: 14, minHeight: 48, paddingHorizontal: 13, paddingVertical: 12 },
  button: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 9, justifyContent: 'center', paddingVertical: 14 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 13, textAlign: 'center' },
  status: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});