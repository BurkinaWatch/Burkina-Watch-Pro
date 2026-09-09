import { PropsWithChildren } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BrandHeader } from '@/components/Brand';

export function Screen({
  children,
  title,
  subtitle,
  showBack = false,
  refreshing = false,
  onRefresh,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}>) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top }}>
        <BrandHeader title={title} subtitle={subtitle} showBack={showBack} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description, icon = 'inbox' }: { title: string; description: string; icon?: keyof typeof Feather.glyphMap }) {
  const colors = useColors();
  return (
    <View style={[styles.state, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Feather name={icon} size={24} color={colors.mutedForeground} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.stateText, { color: colors.mutedForeground }]}>{description}</Text>
    </View>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.state, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Feather name="wifi-off" size={24} color={colors.destructive} />
      <Text style={[styles.stateTitle, { color: colors.foreground }]}>Service indisponible</Text>
      <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
        Vérifiez votre connexion puis réessayez. Aucun contenu local inventé n’est affiché.
      </Text>
      <Pressable onPress={onRetry} style={[styles.retry, { backgroundColor: colors.primary }]} testID="button-retry">
        <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 22, paddingHorizontal: 20, paddingTop: 20 },
  state: { alignItems: 'center', borderRadius: 16, borderWidth: 1, gap: 8, justifyContent: 'center', minHeight: 150, padding: 22, width: '100%' },
  stateTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, textAlign: 'center' },
  stateText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retry: { borderRadius: 10, marginTop: 4, paddingHorizontal: 18, paddingVertical: 11 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});