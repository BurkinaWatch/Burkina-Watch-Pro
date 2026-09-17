import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createElement, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useInterfaceMode } from '@/lib/interfaceMode';
import { getWebAppUrl } from '@/lib/webApp';

export default function WebInterfaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectMode } = useInterfaceMode();
  const [hasError, setHasError] = useState(false);
  const webUrl = getWebAppUrl();

  async function useSimpleInterface() {
    await selectMode('simple');
    router.replace('/(tabs)');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top }]}>
        <View style={styles.toolbarCopy}>
          <Text style={[styles.toolbarTitle, { color: colors.foreground }]}>BurkinaWatch Web</Text>
          <Text style={[styles.toolbarSubtitle, { color: colors.mutedForeground }]}>Interface complète du site</Text>
        </View>
        <Pressable
          onPress={() => void useSimpleInterface()}
          style={[styles.switchButton, { borderColor: colors.primary }]}
          testID="button-switch-simple-interface"
        >
          <Feather name="smartphone" size={14} color={colors.primary} />
          <Text style={[styles.switchText, { color: colors.primary }]}>Mobile</Text>
        </Pressable>
      </View>
      {!webUrl || hasError ? (
        <View style={styles.error}>
          <Feather name="wifi-off" size={28} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Le site Web n’est pas disponible</Text>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            Configurez l’adresse du site Web puis réessayez. L’interface mobile reste disponible.
          </Text>
          <Pressable onPress={() => setHasError(false)} style={[styles.retry, { backgroundColor: colors.primary }]}>
            <Text style={[styles.retryText, { color: colors.primaryForeground }]}>Réessayer</Text>
          </Pressable>
        </View>
      ) : Platform.OS === 'web' ? (
        <View style={styles.webContent}>
          {createElement('iframe', {
            src: webUrl,
            title: 'Interface Web BurkinaWatch',
            style: { border: '0', height: '100%', width: '100%' },
          })}
        </View>
      ) : (
        <WebView
          source={{ uri: webUrl }}
          style={styles.webContent}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.loading, { backgroundColor: colors.background }]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Chargement du site Web…</Text>
            </View>
          )}
          onError={() => setHasError(true)}
          javaScriptEnabled
          domStorageEnabled
          allowsBackForwardNavigationGestures
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toolbar: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 10, minHeight: 62, paddingBottom: 9, paddingHorizontal: 14 },
  toolbarCopy: { flex: 1, gap: 2 },
  toolbarTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  toolbarSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  switchButton: { alignItems: 'center', borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 7 },
  switchText: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  webContent: { flex: 1 },
  loading: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center' },
  loadingText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  error: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center', padding: 28 },
  errorTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retry: { borderRadius: 10, marginTop: 4, paddingHorizontal: 18, paddingVertical: 11 },
  retryText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});