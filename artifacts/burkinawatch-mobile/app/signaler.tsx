import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Screen } from '@/components/Screen';
import { ReportDraft, saveReportDraft } from '@/lib/storage';

const categories = ['Sécurité', 'Route', 'Santé', 'Service public', 'Autre'];

export default function ReportScreen() {
  const colors = useColors();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [photoUri, setPhotoUri] = useState<string>();
  const [location, setLocation] = useState<Location.LocationObject>();
  const [status, setStatus] = useState('');

  async function addPhoto() {
    const permission = Platform.OS === 'web' ? { granted: true } : await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Accès à la caméra', 'Autorisez la caméra pour joindre une photo à votre signalement.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
  }

  async function addLocation() {
    if (Platform.OS === 'web') {
      setStatus('La géolocalisation est disponible dans l’application native.');
      return;
    }
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setStatus('Localisation refusée — vous pouvez publier sans position.');
      return;
    }
    setLocation(await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    setStatus('Position ajoutée au brouillon.');
  }

  async function saveDraft() {
    if (!title.trim() || !description.trim()) {
      setStatus('Ajoutez un titre et une description pour enregistrer le brouillon.');
      return;
    }
    const draft: ReportDraft = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      description: description.trim(),
      category,
      photoUri,
      latitude: location?.coords.latitude,
      longitude: location?.coords.longitude,
      createdAt: new Date().toISOString(),
    };
    await saveReportDraft(draft);
    setStatus('Brouillon enregistré sur cet appareil. L’envoi serveur attend le contrat mobile sécurisé.');
  }

  return (
    <Screen title="Nouveau signalement" subtitle="Décrire, localiser, contribuer" showBack>
      <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="shield" size={19} color={colors.primary} />
        <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Ne partagez pas de données personnelles. Les signalements sont modérés avant publication.</Text>
      </View>
      <View style={styles.form}>
        <Text style={[styles.label, { color: colors.foreground }]}>Titre</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Ex. route bloquée à Ouagadougou" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground }]} testID="input-report-title" />
        <Text style={[styles.label, { color: colors.foreground }]}>Catégorie</Text>
        <View style={styles.chips}>
          {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, { backgroundColor: category === item ? colors.primary : colors.card, borderColor: category === item ? colors.primary : colors.border }]}><Text style={[styles.chipText, { color: category === item ? colors.primaryForeground : colors.mutedForeground }]}>{item}</Text></Pressable>)}
        </View>
        <Text style={[styles.label, { color: colors.foreground }]}>Description</Text>
        <TextInput value={description} onChangeText={setDescription} multiline numberOfLines={5} placeholder="Que se passe-t-il ?" placeholderTextColor={colors.mutedForeground} style={[styles.input, styles.textarea, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground }]} testID="input-report-description" />
        <View style={styles.tools}>
          <Pressable onPress={() => void addPhoto()} style={[styles.tool, { backgroundColor: colors.card, borderColor: colors.border }]} testID="button-report-photo"><Feather name="camera" size={18} color={colors.primary} /><Text style={[styles.toolText, { color: colors.foreground }]}>Photo</Text></Pressable>
          <Pressable onPress={() => void addLocation()} style={[styles.tool, { backgroundColor: colors.card, borderColor: colors.border }]} testID="button-report-location"><Feather name="map-pin" size={18} color={colors.primary} /><Text style={[styles.toolText, { color: colors.foreground }]}>Position</Text></Pressable>
        </View>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.preview} /> : null}
        {status ? <Text style={[styles.status, { color: colors.primary }]}>{status}</Text> : null}
        <Pressable onPress={() => void saveDraft()} style={({ pressed }) => [styles.submit, { backgroundColor: colors.destructive, opacity: pressed ? 0.8 : 1 }]} testID="button-save-report"><Feather name="save" size={18} color={colors.destructiveForeground} /><Text style={[styles.submitText, { color: colors.destructiveForeground }]}>Enregistrer le brouillon</Text></Pressable>
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>La publication directe sera activée uniquement après validation d’un contrat API mobile avec contrôle d’identité et de propriété.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { alignItems: 'flex-start', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 14 },
  noticeText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  form: { gap: 10 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 5 },
  input: { borderRadius: 11, borderWidth: 1, fontFamily: 'Inter_400Regular', fontSize: 14, minHeight: 48, paddingHorizontal: 13, paddingVertical: 12 },
  textarea: { minHeight: 120, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  tools: { flexDirection: 'row', gap: 10, marginTop: 3 },
  tool: { alignItems: 'center', borderRadius: 11, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 12 },
  toolText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  preview: { borderRadius: 14, height: 180, width: '100%' },
  status: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  submit: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 9, justifyContent: 'center', marginTop: 5, paddingVertical: 14 },
  submitText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  helper: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17, textAlign: 'center' },
});