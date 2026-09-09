import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

const logo = require('../assets/images/icon.png');

export function BrandHeader({
  title,
  subtitle,
  showBack = false,
}: {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      <View style={styles.brandRow}>
        {showBack ? (
          <Pressable
            accessibilityLabel="Retour"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.iconButton}
            testID="button-back"
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        ) : null}
        <Image source={logo} resizeMode="contain" style={styles.logo} />
        <View style={styles.heading}>
          <Text style={[styles.brandName, { color: colors.foreground }]}>
            BurkinaWatch
          </Text>
          {title ? (
            <Text style={[styles.title, { color: colors.foreground }]}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionCopy}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            {eyebrow}
          </Text>
        ) : null}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {title}
        </Text>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} testID="button-section-action">
          <Text style={[styles.action, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  logo: { height: 42, width: 64 },
  heading: { flex: 1 },
  brandName: { fontFamily: 'Inter_700Bold', fontSize: 19, letterSpacing: -0.4 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginTop: 2 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  iconButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 32 },
  sectionHeading: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionCopy: { flex: 1 },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, letterSpacing: -0.5, marginTop: 3 },
  action: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});