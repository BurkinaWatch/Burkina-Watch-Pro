import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType?: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    effectiveType: undefined,
  });

  const updateNetworkInfo = useCallback(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    setStatus(prev => ({
      ...prev,
      effectiveType: connection?.effectiveType,
    }));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        isOnline: true,
        wasOffline: !prev.isOnline ? true : prev.wasOffline,
        effectiveType: prev.effectiveType,
      }));
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [updateNetworkInfo]);

  return status;
}

export function useOnlineCallback(callback: () => void) {
  const { isOnline, wasOffline } = useNetworkStatus();

  useEffect(() => {
    if (isOnline && wasOffline) {
      callback();
    }
  }, [isOnline, wasOffline, callback]);
}
