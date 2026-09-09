import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { formatRelativeDate, Signalement } from '@/lib/api';

export function SignalementCard({
  item,
  onPress,
}: {
  item: Signalement;
  onPress?: () => void;
}) {
  const colors = useColors();
  const title = item.titre || item.title || 'Signalement citoyen';
  const category = item.categorie || item.category || 'Communauté';
  const status = item.statut || item.status || 'Publié';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
      testID={`signalement-${item.id}`}
    >
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: colors.muted }]}>
          <Feather name="alert-triangle" size={17} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{category} · {formatRelativeDate(item.createdAt)}</Text>
        </View>
        <View style={[styles.status, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.statusText, { color: colors.secondaryForeground }]}>{status}</Text>
        </View>
      </View>
      {item.description ? (
        <Text numberOfLines={2} style={[styles.description, { color: colors.mutedForeground }]}>{item.description}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, gap: 12, padding: 14 },
  top: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  icon: { alignItems: 'center', borderRadius: 12, height: 38, justifyContent: 'center', width: 38 },
  copy: { flex: 1 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  status: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
});