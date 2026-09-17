import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { InterfaceMode, useInterfaceMode } from '@/lib/interfaceMode';

const modeOptions: Array<{
  mode: InterfaceMode;
  title: string;
  description: string;
  icon: 'smartphone' | 'globe';
}> = [
  {
    mode: 'simple',
    title: 'Interface mobile',
    description: 'Une navigation légère, pensée pour les écrans de téléphone et les actions rapides.',
    icon: 'smartphone',
  },
  {
    mode: 'web',
    title: 'Interface du site Web',
    description: 'Le même frontend que BurkinaWatch Web, affiché dans l’application avec tout son contenu.',
    icon: 'globe',
  },
];

export default function InterfaceChoiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, isReady, selectMode } = useInterfaceMode();

  useEffect(() => {
    if (!isReady || !mode) return;
    router.replace(mode === 'web' ? '/web-interface' : '/(tabs)');
  }, [isReady, mode, router]);

  async function chooseMode(nextMode: InterfaceMode) {
    await selectMode(nextMode);
    router.replace(nextMode === 'web' ? '/web-interface' : '/(tabs)');
  }

  if (!isReady || mode) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom + 24,
          paddingTop: Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top + 24,
        },
      ]}
    >
      <View style={styles.brand}>
        <View style={[styles.logo, { backgroundColor: colors.secondary }]}>
          <Feather name="shield" size={25} color={colors.primary} />
        </View>
        <Text style={[styles.brandName, { color: colors.foreground }]}>BurkinaWatch</Text>
        <Text style={[styles.kicker, { color: colors.primary }]}>CHOISISSEZ VOTRE EXPÉRIENCE</Text>
      </View>

      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.foreground }]}>Deux interfaces, un même BurkinaWatch.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Retrouvez les mêmes contenus et choisissez la présentation qui vous convient. Vous pourrez changer de mode depuis l’application.
        </Text>
      </View>

      <View style={styles.options}>
        {modeOptions.map((option) => (
          <Pressable
            key={option.mode}
            onPress={() => void chooseMode(option.mode)}
            style={({ pressed }) => [
              styles.option,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.78 : 1 },
            ]}
            testID={`interface-choice-${option.mode}`}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.muted }]}>
              <Feather name={option.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.optionCopy}>
              <Text style={[styles.optionTitle, { color: colors.foreground }]}>{option.title}</Text>
              <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>{option.description}</Text>
            </View>
            <Feather name="arrow-right" size={18} color={colors.primary} />
          </Pressable>
        ))}
      </View>

      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        Ce choix est mémorisé sur cet appareil. Le contenu et les données restent ceux de BurkinaWatch.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 26, justifyContent: 'center', paddingHorizontal: 22 },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  brand: { alignItems: 'center', gap: 8 },
  logo: { alignItems: 'center', borderRadius: 18, height: 58, justifyContent: 'center', width: 58 },
  brandName: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  kicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.2, marginTop: 2 },
  copy: { gap: 9 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.7, lineHeight: 33, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  options: { gap: 12 },
  option: { alignItems: 'center', borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 15 },
  optionIcon: { alignItems: 'center', borderRadius: 12, height: 44, justifyContent: 'center', width: 44 },
  optionCopy: { flex: 1, gap: 4 },
  optionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  optionDescription: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, textAlign: 'center' },
});