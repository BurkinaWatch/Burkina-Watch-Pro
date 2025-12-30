import { offlineStorage, OfflineSignalement } from './offlineStorage';
import { apiRequest } from './queryClient';
import { queryClient } from './queryClient';

const MAX_RETRY_COUNT = 3;
const SYNC_INTERVAL = 30000;

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  subscribe(callback: (status: SyncStatus) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(status: SyncStatus) {
    this.listeners.forEach(callback => callback(status));
  }

  async syncPendingSignalements(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0, pending: 0 };
    }

    if (!navigator.onLine) {
      const pending = await offlineStorage.getPendingCount();
      return { synced: 0, failed: 0, pending };
    }

    this.isSyncing = true;
    this.notifyListeners({ isSyncing: true, pendingCount: 0 });

    let synced = 0;
    let failed = 0;

    try {
      const pendingSignalements = await offlineStorage.getPendingSignalements();

      for (const signalement of pendingSignalements) {
        try {
          await offlineStorage.updateSignalementStatus(signalement.id, 'syncing');

          const payload = {
            titre: signalement.titre,
            description: signalement.description,
            categorie: signalement.categorie,
            latitude: String(signalement.latitude),
            longitude: String(signalement.longitude),
            localisation: signalement.adresse || "",
            niveauUrgence: signalement.urgence,
            isAnonymous: signalement.anonyme,
            isSOS: false,
            medias: signalement.images || [],
          };

          await apiRequest('POST', '/api/signalements', payload);
          await offlineStorage.deleteSignalement(signalement.id);
          synced++;
        } catch (error) {
          console.error(`Failed to sync signalement ${signalement.id}:`, error);
          
          const newRetryCount = signalement.retryCount + 1;
          if (newRetryCount >= MAX_RETRY_COUNT) {
            await offlineStorage.updateSignalementStatus(signalement.id, 'failed', newRetryCount);
          } else {
            await offlineStorage.updateSignalementStatus(signalement.id, 'pending', newRetryCount);
          }
          failed++;
        }
      }

      if (synced > 0) {
        queryClient.invalidateQueries({ queryKey: ['/api/signalements'] });
      }
    } finally {
      this.isSyncing = false;
      const pendingCount = await offlineStorage.getPendingCount();
      this.notifyListeners({ isSyncing: false, pendingCount });
    }

    return { synced, failed, pending: await offlineStorage.getPendingCount() };
  }

  startAutoSync() {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingSignalements();
      }
    }, SYNC_INTERVAL);

    window.addEventListener('online', this.handleOnline);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    window.removeEventListener('online', this.handleOnline);
  }

  private handleOnline = () => {
    setTimeout(() => {
      this.syncPendingSignalements();
    }, 2000);
  };

  async retryFailed(): Promise<void> {
    const all = await offlineStorage.getAllSignalements();
    const failed = all.filter(s => s.syncStatus === 'failed');
    
    for (const signalement of failed) {
      await offlineStorage.updateSignalementStatus(signalement.id, 'pending', 0);
    }

    await this.syncPendingSignalements();
  }
}

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
}

export interface SyncResult {
  synced: number;
  failed: number;
  pending: number;
}

export const syncService = new SyncService();
