import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { offlineStorage } from '@/lib/offlineStorage';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineCache() {
  const { isOnline } = useNetworkStatus();

  const { data: pharmacies } = useQuery({
    queryKey: ['/api/pharmacies'],
    enabled: isOnline,
    staleTime: 1000 * 60 * 60,
  });

  const { data: urgences } = useQuery({
    queryKey: ['/api/urgences'],
    enabled: isOnline,
    staleTime: 1000 * 60 * 60,
  });

  const { data: signalements } = useQuery<any[]>({
    queryKey: ['/api/signalements'],
    enabled: isOnline,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (pharmacies && Array.isArray(pharmacies)) {
      offlineStorage.cachePharmacies(pharmacies).catch(console.error);
    }
  }, [pharmacies]);

  useEffect(() => {
    if (urgences && Array.isArray(urgences)) {
      offlineStorage.cacheUrgences(urgences).catch(console.error);
    }
  }, [urgences]);

  useEffect(() => {
    if (signalements && Array.isArray(signalements)) {
      offlineStorage.cacheSignalements(signalements.slice(0, 50)).catch(console.error);
    }
  }, [signalements]);
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
