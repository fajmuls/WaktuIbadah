/**
 * IndexedDB helper for caching audio murottal files locally.
 * Enables offline listening and instant playback without network overhead.
 */
const DB_NAME = 'WaktuIbadahMurottalCache';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedAudioUrl(url: string): Promise<string> {
  try {
    const db = await openAudioDB();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(url);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (blob) {
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.warn('[MurottalCache] IndexedDB read failed, using network URL:', err);
  }

  // If not cached, fetch audio and store asynchronously in background
  try {
    fetch(url)
      .then(res => res.ok ? res.blob() : null)
      .then(async (blob) => {
        if (!blob) return;
        try {
          const db = await openAudioDB();
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(blob, url);
        } catch (e) {
          console.warn('[MurottalCache] Storing blob failed:', e);
        }
      })
      .catch(() => {});
  } catch {
    /* ignore background fetch errors */
  }

  return url;
}
