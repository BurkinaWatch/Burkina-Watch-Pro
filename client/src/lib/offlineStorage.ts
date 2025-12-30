const DB_NAME = 'burkina_watch_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_signalements';

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
}

export const offlineStorage = new OfflineStorageService();
