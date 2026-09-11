import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useColors } from '@/hooks/useColors';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/Screen';
import { requestJson } from '@/lib/api';

type MobilePlace = {
  id?: string | number;
  placeId?: string | number;
  name?: string;
  nom?: string;
  latitude?: string | number;
  longitude?: string | number;
  address?: string;
  adresse?: string;
  quartier?: string;
  ville?: string;
  telephone?: string;
  phone?: string;
  horaires?: string;
  opening_hours?: string;
  imageUrl?: string;
  image?: string;
  source?: string;
  confidenceScore?: string | number;
  confirmations?: number;
  reports?: number;
  verificationStatus?: string;
  updatedAt?: string;
  lastUpdated?: string;
  lastSyncedAt?: string;
  tags?: Record<string, unknown>;
};

type ApiResponse = MobilePlace[] | { places?: MobilePlace[]; pharmacies?: MobilePlace[]; boutiques?: MobilePlace[]; banques?: MobilePlace[]; stations?: MobilePlace[]; restaurants?: MobilePlace[]; lastUpdated?: string };

const ENDPOINTS: Record<string, string> = {
  pharmacy: '/places/pharmacy?limit=5000',
  hospital: '/places/hospital?limit=500',
  bank: '/banques',
  fuel: '/stations',
  shop: '/boutiques',
  restaurant: '/places?placeType=restaurant&limit=500',
  marketplace: '/marches',
  hotel: '/places?placeType=hotel&limit=500',
  bus_station: '/transport',
  telephony: '/telephonie',
  emergency: '/urgences',
};

function normalizePlaces(data: ApiResponse): MobilePlace[] {
  if (Array.isArray(data)) return data;
  for (const key of ['places', 'pharmacies', 'boutiques', 'banques', 'stations', 'restaurants'] as const) {
    const value = data[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function getFreshness(place: MobilePlace) {
  const rawDate = place.updatedAt || place.lastSyncedAt || place.lastUpdated;
  if (!rawDate) return { label: 'À confirmer', tone: 'confirm' as const };
  const checkedAt = new Date(rawDate);
  if (Number.isNaN(checkedAt.getTime())) return { label: 'À confirmer', tone: 'confirm' as const };
  const ageDays = (Date.now() - checkedAt.getTime()) / (24 * 60 * 60 * 1000);
  if (place.verificationStatus === 'needs_review' || (place.reports || 0) > (place.confirmations || 0)) {
    return { label: 'Information contestée', tone: 'contested' as const };
  }
  if (ageDays > 30) return { label: 'Information ancienne', tone: 'old' as const };
  if (ageDays <= 7 && (place.verificationStatus === 'verified' || (place.confirmations || 0) > 0)) {
    return { label: 'Vérifié récemment', tone: 'recent' as const };
  }
  return { label: 'À confirmer', tone: 'confirm' as const };
}

function getPlaceName(place: MobilePlace) {
  const tags = place.tags || {};
  return place.name || place.nom || String(tags.name || tags['name:fr'] || tags.operator || 'Lieu sans nom');
}

function getPhone(place: MobilePlace) {
  const tags = place.tags || {};
  return place.telephone || place.phone || (typeof tags.phone === 'string' ? tags.phone : null);
}

function getImage(place: MobilePlace) {
  const tags = place.tags || {};
  return place.imageUrl || place.image || (typeof tags.photoUrl === 'string' ? tags.photoUrl : null) || (typeof tags.image === 'string' ? tags.image : null);
}

export default function MobilePlaceResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ endpoint?: string; title?: string; filter?: string }>();
  const endpoint = params.endpoint || '/places?placeType=shop&limit=500';
  const title = params.title || 'Résultats';
  const query = useQuery<ApiResponse>({
    queryKey: ['mobile-practical-places', endpoint],
    queryFn: () => requestJson<ApiResponse>(endpoint),
    retry: 1,
  });
  const places = useMemo(() => normalizePlaces(query.data || []), [query.data]);

  return (
    <Screen
      title={title}
      subtitle="Données existantes de BurkinaWatch"
      showBack
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {params.filter ? (
        <View style={[styles.filterNotice, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="info" size={15} color={colors.primary} />
          <Text style={[styles.filterText, { color: colors.foreground }]}>
            {params.filter} — la disponibilité inconnue reste à confirmer.
          </Text>
        </View>
      ) : null}
      {query.isLoading ? <LoadingState label="Chargement des lieux…" /> : null}
      {query.isError ? <ErrorState onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && !places.length ? (
        <EmptyState title="Aucun lieu disponible" description="Aucune fiche existante ne correspond pour le moment." icon="map-pin" />
      ) : null}
      <View style={styles.list}>
        {places.map((place, index) => {
          const id = String(place.id || place.placeId || index);
          const name = getPlaceName(place);
          const phone = getPhone(place);
          const image = getImage(place);
          const freshness = getFreshness(place);
          const address = place.address || place.adresse || [place.quartier, place.ville].filter(Boolean).join(', ');
          const latitude = Number(place.latitude);
          const longitude = Number(place.longitude);
          return (
            <View key={id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{name}</Text>
                  <View style={[styles.freshness, freshness.tone === 'recent' ? styles.recent : freshness.tone === 'contested' ? styles.contested : freshness.tone === 'old' ? styles.old : styles.confirm]}>
                    <Text style={styles.freshnessText}>{freshness.label}</Text>
                  </View>
                </View>
                {address ? <Text style={[styles.detail, { color: colors.mutedForeground }]}>{address}</Text> : null}
                {place.horaires || place.opening_hours ? <Text style={[styles.detail, { color: colors.mutedForeground }]}>{place.horaires || place.opening_hours}</Text> : null}
                <View style={styles.actions}>
                  {phone ? (
                    <Pressable onPress={() => void Linking.openURL(`tel:${phone}`)} style={[styles.action, { borderColor: colors.border }]}>
                      <Feather name="phone" size={14} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.foreground }]}>Appeler</Text>
                    </Pressable>
                  ) : null}
                  {phone ? (
                    <Pressable onPress={() => void Linking.openURL(`https://wa.me/${phone.replace(/[^\d]/g, '')}`)} style={[styles.action, { borderColor: colors.border }]}>
                      <Feather name="message-circle" size={14} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.foreground }]}>WhatsApp</Text>
                    </Pressable>
                  ) : null}
                  {Number.isFinite(latitude) && Number.isFinite(longitude) ? (
                    <Pressable onPress={() => void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)} style={[styles.action, { borderColor: colors.border }]}>
                      <Feather name="navigation" size={14} color={colors.primary} />
                      <Text style={[styles.actionText, { color: colors.foreground }]}>Itinéraire</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => void Share.share({ title: name, message: `${name}${address ? ` — ${address}` : ''}` })} style={[styles.action, { borderColor: colors.border }]}>
                    <Feather name="share-2" size={14} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.foreground }]}>Partager</Text>
                  </Pressable>
                </View>
                <View style={styles.validationRow}>
                  <Pressable onPress={() => void requestJson(`/places/${id}/confirm`, { method: 'POST' })} accessibilityRole="button">
                    <Text style={[styles.validationText, { color: colors.primary }]}>✓ Confirmer</Text>
                  </Pressable>
                  <Pressable onPress={() => void requestJson(`/places/${id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment: 'Fermeture ou problème signalé depuis la fiche mobile.' }) })} accessibilityRole="button">
                    <Text style={[styles.validationText, { color: colors.destructive }]}>⚠ Signaler</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <Pressable onPress={() => router.push('/burkina-pratique')} style={styles.backLink}>
        <Feather name="compass" size={15} color={colors.primary} />
        <Text style={[styles.backLinkText, { color: colors.primary }]}>Nouvelle recherche Burkina Pratique</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  image: { height: 150, width: '100%' },
  cardBody: { gap: 8, padding: 13 },
  titleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  name: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 15 },
  detail: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 17 },
  freshness: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4 },
  recent: { backgroundColor: '#dcfce7' },
  confirm: { backgroundColor: '#fef3c7' },
  old: { backgroundColor: '#f1f5f9' },
  contested: { backgroundColor: '#fee2e2' },
  freshnessText: { color: '#334155', fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  action: { alignItems: 'center', borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 7 },
  actionText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  validationRow: { borderTopColor: '#e2e8f0', borderTopWidth: 1, flexDirection: 'row', gap: 16, paddingTop: 9 },
  validationText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  filterNotice: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 10 },
  filterText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  backLink: { alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center', paddingVertical: 12 },
  backLinkText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});