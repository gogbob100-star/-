// IndexedDB Offline Sync Queue Service for Robust Offline-First Capabilities

import { Novel } from '../types/novel';

const DB_NAME = 'RawiOfflineDB';
const DB_VERSION = 1;
const STORE_QUEUE = 'syncQueue';
const STORE_NOVELS = 'localNovels';

export interface SyncQueueItem {
  id?: number;
  novelId: string;
  novelData: Novel;
  timestamp: string;
}

export function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB.'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_NOVELS)) {
        db.createObjectStore(STORE_NOVELS, { keyPath: 'id' });
      }
    };
  });
}

// Enqueue a modification when offline or when network fails
export async function enqueueOfflineChange(novel: Novel): Promise<void> {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_QUEUE);

    const item: SyncQueueItem = {
      novelId: novel.id,
      novelData: novel,
      timestamp: new Date().toISOString(),
    };

    store.add(item);

    // Also save snapshot locally
    await saveLocalNovelSnapshot(novel);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to enqueue offline change in IndexedDB:', err);
  }
}

// Save local snapshot fallback
export async function saveLocalNovelSnapshot(novel: Novel): Promise<void> {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction(STORE_NOVELS, 'readwrite');
    const store = tx.objectStore(STORE_NOVELS);

    store.put({
      id: novel.id,
      novelData: novel,
      updatedAt: new Date().toISOString(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save local novel snapshot:', err);
  }
}

// Get local novel snapshot fallback
export async function getLocalNovelSnapshot(novelId: string): Promise<Novel | null> {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction(STORE_NOVELS, 'readonly');
    const store = tx.objectStore(STORE_NOVELS);
    const request = store.get(novelId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const res = request.result;
        resolve(res ? res.novelData : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to get local novel snapshot:', err);
    return null;
  }
}

// Get pending queue items count
export async function getPendingQueueCount(): Promise<number> {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction(STORE_QUEUE, 'readonly');
    const store = tx.objectStore(STORE_QUEUE);
    const request = store.count();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return 0;
  }
}

// Process pending queue and sync to Firestore
export async function processOfflineQueue(
  syncFunction: (novel: Novel) => Promise<void>
): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0;
  }

  try {
    const db = await initOfflineDB();
    const tx = db.transaction(STORE_QUEUE, 'readwrite');
    const store = tx.objectStore(STORE_QUEUE);
    const getAllRequest = store.getAll();
    const keysRequest = store.getAllKeys();

    const items: SyncQueueItem[] = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });

    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      keysRequest.onsuccess = () => resolve(keysRequest.result);
      keysRequest.onerror = () => reject(keysRequest.error);
    });

    if (!items || items.length === 0) return 0;

    let syncedCount = 0;
    // Map latest novel state per novelId to avoid redundant multiple network writes
    const latestNovelsMap = new Map<string, Novel>();
    items.forEach((item) => {
      latestNovelsMap.set(item.novelId, item.novelData);
    });

    for (const [novelId, novel] of latestNovelsMap.entries()) {
      try {
        await syncFunction(novel);
        syncedCount++;
      } catch (err) {
        console.warn(`Failed to sync novel ${novelId} from offline queue:`, err);
        // Stop processing further if offline network dropped during sync
        break;
      }
    }

    // Clear queue upon successful sync
    const clearTx = db.transaction(STORE_QUEUE, 'readwrite');
    const clearStore = clearTx.objectStore(STORE_QUEUE);
    clearStore.clear();

    return syncedCount;
  } catch (err) {
    console.warn('Error processing offline sync queue:', err);
    return 0;
  }
}
