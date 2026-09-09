import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Screen } from '@/components/Screen';

const emergencyServices = [
  { label: 'Police nationale', number: '17', icon: 'shield' as const },
  { label: 'Sapeurs-pompiers', number: '18', icon: 'alert-triangle' as const },
  { label: 'Gendarmerie nationale', number: '16', icon: 'radio' as const },
  { label: 'Numéro d’urgence', number: '112', icon: 'phone-call' as const },
];

export default function SosScreen() {
  const colors = useColors();
  const router = useRouter();
  async function call(number: string) {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      Alert.alert('Appel indisponible', `Composez le ${number} depuis votre téléphone.`);
    }
  }
  return (
    <Screen title="SOS" subtitle="Accès immédiat aux secours" showBack>
      <View style={[styles.warning, { backgroundColor: colors.destructive }]}>
        <Feather name="alert-octagon" size={27} color={colors.destructiveForeground} />
        <View style={styles.copy}>
          <Text style={[styles.warningTitle, { color: colors.destructiveForeground }]}>Urgence réelle ?</Text>
          <Text style={[styles.warningText, { color: colors.destructiveForeground }]}>Appelez directement les services compétents. BurkinaWatch ne remplace pas les secours.</Text>
        </View>
      </View>
      <View style={styles.list}>
        {emergencyServices.map((service) => (
          <Pressable key={service.number} onPress={() => void call(service.number)} style={({ pressed }) => [styles.service, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 }]} testID={`button-call-${service.number}`}>
            <View style={[styles.serviceIcon, { backgroundColor: colors.muted }]}><Feather name={service.icon} size={20} color={colors.destructive} /></View>
            <View style={styles.copy}><Text style={[styles.serviceLabel, { color: colors.foreground }]}>{service.label}</Text><Text style={[styles.serviceNumber, { color: colors.mutedForeground }]}>Appeler le {service.number}</Text></View>
            <Feather name="phone" size={19} color={colors.destructive} />
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => router.push('/signaler')} style={[styles.reportButton, { borderColor: colors.primary }]} testID="button-sos-report">
        <Feather name="edit-3" size={18} color={colors.primary} />
        <Text style={[styles.reportText, { color: colors.primary }]}>Décrire un incident non urgent</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', gap: 13, padding: 19 },
  copy: { flex: 1 },
  warningTitle: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  warningText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 5 },
  list: { gap: 10 },
  service: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 14 },
  serviceIcon: { alignItems: 'center', borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  serviceLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  serviceNumber: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  reportButton: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 9, justifyContent: 'center', paddingVertical: 13 },
  reportText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});