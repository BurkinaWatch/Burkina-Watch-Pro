import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image, Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useColors } from '@/hooks/useColors';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/Screen';
import { requestJson } from '@/lib/api';
import { cachePracticalPlaces, readCachedPracticalPlaces } from '@/lib/storage';

type MobilePlace = {
  [key: string]: unknown;
  id?: string | number;
  placeId?: string | number;
  name?: string;
  nom?: string;
  title?: string;
  nomCourt?: string;
  description?: string;
  type?: string;
  categorie?: string;
  category?: string;
  operateur?: string;
  societe?: string;
  marque?: string;
  religion?: string;
  compagnie?: string;
  depart?: string;
  arrivee?: string;
  latitude?: string | number;
  longitude?: string | number;
  address?: string;
  adresse?: string;
  quartier?: string;
  ville?: string;
  telephone?: string;
  phone?: string;
  telephoneSecondaire?: string;
  email?: string;
  website?: string;
  horaires?: string;
  opening_hours?: string;
  services?: string[];
  carburants?: string[];
  domaines?: string[];
  attributions?: string[];
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

type ApiResponse = MobilePlace[] | Record<string, unknown>;

type SecurityContextItem = {
  id?: string | number;
  title?: string;
  label?: string;
  description?: string;
  source?: string;
  sourceName?: string;
  origin?: string;
  freshness?: string;
  freshnessLabel?: string;
  updatedAt?: string;
  createdAt?: string;
};

type SecurityContext = {
  perceptions?: SecurityContextItem[];
  signals?: SecurityContextItem[];
  incidents?: SecurityContextItem[];
  insufficientData?: boolean;
  hasRecentData?: boolean;
};

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

function normalizePlaces(data: ApiResponse, endpoint: string): MobilePlace[] {
  if (Array.isArray(data)) return data;
  const endpointKeys: Record<string, string[]> = {
    '/telephonie': ['agences'],
    '/sonabel-onea': ['agences'],
    '/mairies-prefectures': ['institutions'],
    '/ministeres': ['ministeres', 'institutions'],
    '/lieux-de-culte': ['lieux'],
    '/universites': ['universites', 'etablissements'],
    '/cimetieres': ['cimetieres'],
    '/cinema/info': ['cinemas'],
    '/transport': ['gares', 'trajets'],
  };
  const keys = [
    ...(endpointKeys[endpoint] || []),
    'places',
    'pharmacies',
    'boutiques',
    'banques',
    'stations',
    'restaurants',
    'marches',
    'agences',
    'institutions',
    'lieux',
    'universites',
    'etablissements',
    'cimetieres',
    'cinemas',
  ];
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) return value.filter((item): item is MobilePlace => Boolean(item && typeof item === 'object'));
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
  return place.name || place.nom || place.title || place.nomCourt ||
    String(tags.name || tags['name:fr'] || tags.operator || 'Lieu sans nom');
}

function getPhone(place: MobilePlace) {
  const tags = place.tags || {};
  return place.telephone || place.phone || place.telephoneSecondaire ||
    (typeof tags.phone === 'string' ? tags.phone : null);
}

function getImage(place: MobilePlace) {
  const tags = place.tags || {};
  return place.imageUrl || place.image || (typeof tags.photoUrl === 'string' ? tags.photoUrl : null) || (typeof tags.image === 'string' ? tags.image : null);
}

function getUpdatedLabel(place: MobilePlace) {
  const rawDate = place.updatedAt || place.lastSyncedAt || place.lastUpdated;
  if (!rawDate) return null;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : `Mise à jour : ${date.toLocaleDateString('fr-FR')}`;
}

function getAddress(place: MobilePlace) {
  return place.address || place.adresse ||
    [place.quartier, place.ville].filter((value): value is string => typeof value === 'string' && Boolean(value)).join(', ');
}

function getExtraDetails(place: MobilePlace) {
  const details: string[] = [];
  if (place.type) details.push(place.type);
  if (place.categorie) details.push(place.categorie);
  if (place.operateur) details.push(place.operateur);
  if (place.societe) details.push(place.societe);
  if (place.marque) details.push(place.marque);
  if (place.religion) details.push(place.religion);
  if (place.depart || place.arrivee) {
    details.push(`Trajet : ${place.depart || 'Départ'} → ${place.arrivee || 'Arrivée'}`);
  }
  if (place.compagnie) details.push(`Compagnie : ${place.compagnie}`);
  for (const values of [place.services, place.carburants, place.domaines]) {
    if (Array.isArray(values) && values.length) details.push(values.join(' · '));
  }
  if (place.description) details.push(place.description);
  return details;
}

function contextItems(value: unknown): SecurityContextItem[] {
  return Array.isArray(value) ? value.filter((item): item is SecurityContextItem => Boolean(item && typeof item === 'object')) : [];
}

function contextSource(item: SecurityContextItem) {
  return item.source || item.sourceName || item.origin || 'Source non précisée';
}

function contextFreshness(item: SecurityContextItem) {
  if (item.freshnessLabel || item.freshness) return item.freshnessLabel || item.freshness;
  const date = item.updatedAt || item.createdAt;
  if (!date) return 'Fraîcheur inconnue';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? 'Fraîcheur inconnue' : `Actualisé le ${parsed.toLocaleDateString('fr-FR')}`;
}

function SecurityContextCard({ placeId, colors }: { placeId: string; colors: ReturnType<typeof useColors> }) {
  const contextQuery = useQuery<SecurityContext>({
    queryKey: ['mobile-place-security-context', placeId],
    queryFn: () => requestJson<SecurityContext>(`/place-experience/context/${encodeURIComponent(placeId)}`),
    staleTime: 60 * 1000,
    retry: 1,
  });
  const sections = [
    { key: 'perceptions', label: 'Perceptions', icon: 'eye' as const, items: contextItems(contextQuery.data?.perceptions) },
    { key: 'signals', label: 'Signaux', icon: 'radio' as const, items: contextItems(contextQuery.data?.signals) },
    { key: 'incidents', label: 'Incidents', icon: 'alert-triangle' as const, items: contextItems(contextQuery.data?.incidents) },
  ];

  return (
    <View style={[styles.securityContext, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      <View style={styles.securityHeading}>
        <Feather name="shield" size={15} color={colors.primary} />
        <Text style={[styles.securityTitle, { color: colors.foreground }]}>Contexte de sécurité</Text>
      </View>
      {contextQuery.isLoading ? <Text style={[styles.contextMeta, { color: colors.mutedForeground }]}>Chargement du contexte…</Text> : null}
      {contextQuery.isError ? <Text style={[styles.contextMeta, { color: colors.mutedForeground }]}>Contexte indisponible pour le moment.</Text> : null}
      {!contextQuery.isLoading && !contextQuery.isError ? sections.map((section) => section.items.length ? (
        <View key={section.key} style={styles.contextSection}>
          <View style={styles.contextSectionTitle}>
            <Feather name={section.icon} size={13} color={colors.primary} />
            <Text style={[styles.contextLabel, { color: colors.foreground }]}>{section.label}</Text>
          </View>
          {section.items.map((item, index) => (
            <View key={String(item.id || index)} style={[styles.contextItem, { borderLeftColor: colors.primary }]}>
              <Text style={[styles.contextItemTitle, { color: colors.foreground }]}>{item.title || item.label || 'Information de sécurité'}</Text>
              {item.description ? <Text style={[styles.contextMeta, { color: colors.mutedForeground }]}>{item.description}</Text> : null}
              <Text style={[styles.contextMeta, { color: colors.mutedForeground }]}>
                Source : {contextSource(item)} · {contextFreshness(item)}
              </Text>
            </View>
          ))}
        </View>
      ) : null) : null}
      {!contextQuery.isLoading && !contextQuery.isError &&
      (contextQuery.data?.insufficientData || contextQuery.data?.hasRecentData === false ||
        sections.every((section) => section.items.length === 0)) ? (
        <Text style={[styles.insufficientData, { color: colors.mutedForeground }]}>
          Peu de données récentes disponibles.
        </Text>
      ) : null}
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        Contexte indicatif, temporel et non garanti. Il ne constitue pas une garantie de sécurité ni un score de sécurité.
      </Text>
    </View>
  );
}

export default function MobilePlaceResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ endpoint?: string; title?: string; filter?: string }>();
  const endpoint = params.endpoint || '/places?placeType=shop&limit=500';
  const title = params.title || 'Résultats';
  const query = useQuery<ApiResponse>({
    queryKey: ['mobile-practical-places', endpoint],
    queryFn: async () => {
      try {
        const data = await requestJson<ApiResponse>(endpoint);
        await cachePracticalPlaces(endpoint, data);
        return data;
      } catch (error) {
        const cached = await readCachedPracticalPlaces(endpoint);
        if (cached) return cached as ApiResponse;
        throw error;
      }
    },
    retry: 1,
  });
  const places = useMemo(() => normalizePlaces(query.data || [], endpoint), [endpoint, query.data]);
  const supportsPlaceVerification = endpoint.startsWith('/places');

  return (
    <Screen
      title={title}
      subtitle="Même catalogue de services que le site Web BurkinaWatch"
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
          const updatedLabel = getUpdatedLabel(place);
           const address = getAddress(place);
           const extraDetails = getExtraDetails(place);
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
                 {extraDetails.map((detail, detailIndex) => (
                   <Text key={`${id}-detail-${detailIndex}`} style={[styles.detail, { color: colors.mutedForeground }]}>{detail}</Text>
                 ))}
                 {place.horaires || place.opening_hours ? <Text style={[styles.detail, { color: colors.mutedForeground }]}>{place.horaires || place.opening_hours}</Text> : null}
                 {place.email ? <Text style={[styles.detail, { color: colors.mutedForeground }]}>{place.email}</Text> : null}
                 {place.website ? <Text style={[styles.detail, { color: colors.mutedForeground }]}>{place.website}</Text> : null}
                {updatedLabel ? <Text style={[styles.detail, { color: colors.mutedForeground }]}>{updatedLabel}</Text> : null}
                 {supportsPlaceVerification ? <SecurityContextCard placeId={id} colors={colors} /> : null}
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
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/tracking-live',
                        params: {
                          destinationName: name,
                          destinationAddress: address || '',
                          destinationLatitude: String(latitude),
                          destinationLongitude: String(longitude),
                        },
                      })
                    }
                    style={[styles.protectAction, { backgroundColor: colors.primary }]}
                  >
                    <Feather name="shield" size={14} color={colors.primaryForeground} />
                    <Text style={[styles.protectActionText, { color: colors.primaryForeground }]}>Protéger mon déplacement</Text>
                  </Pressable>
                  <Pressable onPress={() => void Share.share({ title: name, message: `${name}${address ? ` — ${address}` : ''}` })} style={[styles.action, { borderColor: colors.border }]}>
                    <Feather name="share-2" size={14} color={colors.primary} />
                    <Text style={[styles.actionText, { color: colors.foreground }]}>Partager</Text>
                  </Pressable>
                </View>
                 {supportsPlaceVerification ? (
                   <View style={styles.validationRow}>
                     <Pressable onPress={() => void requestJson(`/places/${id}/confirm`, { method: 'POST' })} accessibilityRole="button">
                       <Text style={[styles.validationText, { color: colors.primary }]}>✓ Confirmer</Text>
                     </Pressable>
                     <Pressable onPress={() => void requestJson(`/places/${id}/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment: 'Fermeture ou problème signalé depuis la fiche mobile.' }) })} accessibilityRole="button">
                       <Text style={[styles.validationText, { color: colors.destructive }]}>⚠ Signaler</Text>
                     </Pressable>
                   </View>
                 ) : null}
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
  securityContext: { borderRadius: 12, borderWidth: 1, gap: 8, padding: 10 },
  securityHeading: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  securityTitle: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  contextSection: { gap: 6 },
  contextSectionTitle: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  contextLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  contextItem: { borderLeftWidth: 2, gap: 2, paddingLeft: 7 },
  contextItemTitle: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  contextMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  disclaimer: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14 },
  insufficientData: { borderRadius: 8, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, paddingVertical: 2 },
  freshness: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 4 },
  recent: { backgroundColor: '#dcfce7' },
  confirm: { backgroundColor: '#fef3c7' },
  old: { backgroundColor: '#f1f5f9' },
  contested: { backgroundColor: '#fee2e2' },
  freshnessText: { color: '#334155', fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  action: { alignItems: 'center', borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingVertical: 7 },
  actionText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  protectAction: { alignItems: 'center', borderRadius: 9, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 8, width: '100%' },
  protectActionText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 11, textAlign: 'center' },
  validationRow: { borderTopColor: '#e2e8f0', borderTopWidth: 1, flexDirection: 'row', gap: 16, paddingTop: 9 },
  validationText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  filterNotice: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 10 },
  filterText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16 },
  backLink: { alignItems: 'center', flexDirection: 'row', gap: 7, justifyContent: 'center', paddingVertical: 12 },
  backLinkText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});