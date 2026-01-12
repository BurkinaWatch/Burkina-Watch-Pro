import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { syncService, SyncStatus } from '@/lib/syncService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isSyncing: false, pendingCount: 0 });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncStatus);
    syncService.startAutoSync();

    const checkPending = async () => {
      const { offlineStorage } = await import('@/lib/offlineStorage');
      const count = await offlineStorage.getPendingCount();
      setSyncStatus(prev => ({ ...prev, pendingCount: count }));
    };
    checkPending();

    return () => {
      unsubscribe();
      syncService.stopAutoSync();
    };
  }, []);

  useEffect(() => {
    if (isOnline && syncStatus.pendingCount === 0 && !syncStatus.isSyncing) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, syncStatus.pendingCount, syncStatus.isSyncing]);

  const handleManualSync = async () => {
    await syncService.syncPendingSignalements();
  };

  const handleRetryFailed = async () => {
    await syncService.retryFailed();
  };

  if (isOnline && syncStatus.pendingCount === 0 && !showSuccess) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 relative"
          data-testid="button-offline-status"
        >
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive hidden sm:inline">Hors ligne</span>
            </>
          ) : syncStatus.isSyncing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm hidden sm:inline">Synchronisation...</span>
            </>
          ) : syncStatus.pendingCount > 0 ? (
            <>
              <Cloud className="w-4 h-4 text-yellow-500" />
              <Badge variant="secondary" className="text-xs">
                {syncStatus.pendingCount}
              </Badge>
            </>
          ) : showSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400 hidden sm:inline">Synchronisé</span>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-destructive" />
            )}
            <span className="font-medium">
              {isOnline ? 'Connecté' : 'Mode hors ligne'}
            </span>
          </div>

          {!isOnline && (
            <p className="text-sm text-muted-foreground">
              Vos signalements seront sauvegardés localement et envoyés automatiquement 
              dès que la connexion sera rétablie.
            </p>
          )}

          {syncStatus.pendingCount > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Signalements en attente</span>
                <Badge variant="outline">{syncStatus.pendingCount}</Badge>
              </div>
              
              {isOnline && (
                <Button 
                  size="sm" 
                  onClick={handleManualSync}
                  disabled={syncStatus.isSyncing}
                  className="w-full gap-2"
                  data-testid="button-manual-sync"
                >
                  {syncStatus.isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      Synchroniser maintenant
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {isOnline && syncStatus.pendingCount === 0 && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Tout est synchronisé</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 rounded-md p-3 shadow-lg">
        <div className="flex items-start gap-3">
          <CloudOff className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Mode hors ligne actif
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Vous pouvez continuer à créer des signalements. Ils seront envoyés automatiquement.
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 -mt-1 -mr-1"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}
