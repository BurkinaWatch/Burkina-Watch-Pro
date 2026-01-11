import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { offlineStorage } from '@/lib/offlineStorage';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineCache() {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const [cachedPharmacies, cachedUrgences, cachedSignalements] = await Promise.all([
          offlineStorage.getCachedPharmacies(),
          offlineStorage.getCachedUrgences(),
          offlineStorage.getCachedSignalements(),
        ]);

        if (cachedPharmacies.length > 0) {
          queryClient.setQueryData(['/api/pharmacies'], cachedPharmacies);
        }
        if (cachedUrgences.length > 0) {
          queryClient.setQueryData(['/api/urgences'], cachedUrgences);
        }
        if (cachedSignalements.length > 0) {
          queryClient.setQueryData(['/api/signalements'], cachedSignalements);
        }
      } catch (error) {
        console.error('[OfflineCache] Failed to load cached data:', error);
      }
    };

    loadCachedData();
  }, [queryClient]);

  const { data: pharmacies } = useQuery({
    queryKey: ['/api/pharmacies'],
    staleTime: 1000 * 60 * 60,
  });

  const { data: urgences } = useQuery({
    queryKey: ['/api/urgences'],
    staleTime: 1000 * 60 * 60,
  });

  const { data: signalements } = useQuery<any[]>({
    queryKey: ['/api/signalements'],
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (isOnline && pharmacies && Array.isArray(pharmacies)) {
      offlineStorage.cachePharmacies(pharmacies).catch(console.error);
    }
  }, [pharmacies, isOnline]);

  useEffect(() => {
    if (isOnline && urgences && Array.isArray(urgences)) {
      offlineStorage.cacheUrgences(urgences).catch(console.error);
    }
  }, [urgences, isOnline]);

  useEffect(() => {
    if (isOnline && signalements && Array.isArray(signalements)) {
      offlineStorage.cacheSignalements(signalements.slice(0, 50)).catch(console.error);
    }
  }, [signalements, isOnline]);
}

export async function getOfflineData(type: 'pharmacies' | 'urgences' | 'signalements') {
  switch (type) {
    case 'pharmacies':
      return offlineStorage.getCachedPharmacies();
    case 'urgences':
      return offlineStorage.getCachedUrgences();
    case 'signalements':
      return offlineStorage.getCachedSignalements();
    default:
      return [];
  }
}
