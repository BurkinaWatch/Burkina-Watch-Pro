const DB_NAME = 'burkina_watch_offline';
const DB_VERSION = 2;
const STORE_NAME = 'pending_signalements';
const PHARMACIES_STORE = 'pharmacies_cache';
const URGENCES_STORE = 'urgences_cache';
const SIGNALEMENTS_STORE = 'signalements_cache';
const METADATA_STORE = 'metadata';

export interface OfflineSignalement {
  id: string;
  titre: string;
  description: string;
  categorie: string;
  latitude: number;
  longitude: number;
  adresse?: string;
  urgence: string;
  anonyme: boolean;
  images?: string[];
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    if (typeof indexedDB === 'undefined') {
      console.warn('IndexedDB not available');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(PHARMACIES_STORE)) {
          db.createObjectStore(PHARMACIES_STORE, { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains(URGENCES_STORE)) {
          db.createObjectStore(URGENCES_STORE, { keyPath: 'id', autoIncrement: true });
        }
        
        if (!db.objectStoreNames.contains(SIGNALEMENTS_STORE)) {
          db.createObjectStore(SIGNALEMENTS_STORE, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  async saveSignalement(signalement: Omit<OfflineSignalement, 'id' | 'createdAt' | 'syncStatus' | 'retryCount'>): Promise<OfflineSignalement> {
    await this.init();
    
    const offlineSignalement: OfflineSignalement = {
      ...signalement,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      syncStatus: 'pending',
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(offlineSignalement);

      request.onsuccess = () => resolve(offlineSignalement);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSignalements(): Promise<OfflineSignalement[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('syncStatus');
      const request = index.getAll(IDBKeyRange.only('pending'));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSignalements(): Promise<OfflineSignalement[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSignalementStatus(id: string, status: OfflineSignalement['syncStatus'], retryCount?: number): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const signalement = getRequest.result;
        if (signalement) {
          signalement.syncStatus = status;
          if (retryCount !== undefined) {
            signalement.retryCount = retryCount;
          }
          const updateRequest = store.put(signalement);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteSignalement(id: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingCount(): Promise<number> {
    const pending = await this.getPendingSignalements();
    return pending.length;
  }

  async cachePharmacies(pharmacies: any[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([PHARMACIES_STORE, METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(PHARMACIES_STORE);
    const metaStore = transaction.objectStore(METADATA_STORE);
    
    store.clear();
    pharmacies.forEach((p, index) => store.add({ ...p, id: index + 1 }));
    metaStore.put({ key: 'pharmacies_lastSync', value: new Date().toISOString() });
    
    console.log(`[OfflineDB] Cached ${pharmacies.length} pharmacies`);
  }

  async getCachedPharmacies(): Promise<any[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PHARMACIES_STORE], 'readonly');
      const store = transaction.objectStore(PHARMACIES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheUrgences(urgences: any[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([URGENCES_STORE, METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(URGENCES_STORE);
    const metaStore = transaction.objectStore(METADATA_STORE);
    
    store.clear();
    urgences.forEach((u, index) => store.add({ ...u, id: index + 1 }));
    metaStore.put({ key: 'urgences_lastSync', value: new Date().toISOString() });
    
    console.log(`[OfflineDB] Cached ${urgences.length} urgences`);
  }

  async getCachedUrgences(): Promise<any[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([URGENCES_STORE], 'readonly');
      const store = transaction.objectStore(URGENCES_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async cacheSignalements(signalements: any[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([SIGNALEMENTS_STORE, METADATA_STORE], 'readwrite');
    const store = transaction.objectStore(SIGNALEMENTS_STORE);
    const metaStore = transaction.objectStore(METADATA_STORE);
    
    store.clear();
    signalements.forEach(s => store.add(s));
    metaStore.put({ key: 'signalements_lastSync', value: new Date().toISOString() });
    
    console.log(`[OfflineDB] Cached ${signalements.length} signalements`);
  }

  async getCachedSignalements(): Promise<any[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SIGNALEMENTS_STORE], 'readonly');
      const store = transaction.objectStore(SIGNALEMENTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSyncTime(storeName: string): Promise<string | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.get(`${storeName}_lastSync`);

      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => resolve(null);
    });
  }

  async getStorageSize(): Promise<string> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
        return `${usedMB} Mo`;
      }
      return 'Non disponible';
    } catch {
      return 'Non disponible';
    }
  }
}

export const offlineStorage = new OfflineStorageService();

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onOnlineStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
