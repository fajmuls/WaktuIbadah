/* WaktuIbadah Service Worker
 * - Menerima Web Push dari server (notifikasi tetap muncul walau aplikasi/tab ditutup)
 * - Menangani klik notifikasi & aksi interaktif di background (Heningkan Azan & Sudah Salat)
 * - Cache ringan agar aplikasi bisa dibuka offline
 *
 * CATATAN: file ini SENGAJA ditulis manual. Jangan tambahkan plugin yang
 * menghasilkan sw.js otomatis (mis. vite-plugin-pwa generateSW), karena akan
 * menimpa file ini dan menghapus handler 'push' di bawah.
 */

const VERSION = 'v2.10.1';
const SHELL_CACHE = `waktuibadah-shell-${VERSION}`;
const ASSET_CACHE = `waktuibadah-assets-${VERSION}`;

const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/badge-96.png',
];

// Helper IndexedDB untuk menyimpan aksi interaktif background saat aplikasi tertutup
function recordPrayerOffline(prayer, dateStr) {
  return new Promise((resolve) => {
    try {
      const openReq = indexedDB.open('waktuibadah_bg', 1);
      openReq.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('pending_actions')) {
          db.createObjectStore('pending_actions', { keyPath: 'id', autoIncrement: true });
        }
      };
      openReq.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('pending_actions', 'readwrite');
        const store = tx.objectStore('pending_actions');
        store.add({
          action: 'sudah_salat',
          prayer: prayer,
          date: dateStr,
          timestamp: Date.now()
        });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      };
      openReq.onerror = () => resolve(false);
    } catch (err) {
      resolve(false);
    }
  });
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('waktuibadah-') && k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// ---------------------------------------------------------------------------
// Fetch: cache sederhana (tidak menyentuh /api, audio, atau request Range)
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname === '/sw.js') return;
  if (req.headers.has('range') || req.destination === 'audio' || req.destination === 'video') return;

  // Halaman (navigasi): coba jaringan dulu, jatuh ke cache bila offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put('/', copy)).catch(() => {});
          return res;
        })
        .catch(async () => (await caches.match('/')) || Response.error())
    );
    return;
  }

  // Aset statis: stale-while-revalidate
  if (['script', 'style', 'image', 'font'].includes(req.destination)) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

// ---------------------------------------------------------------------------
// Web Push
// Payload JSON dari server (api/_lib/dispatch.js):
// { title, body, tag, url, kind, prayer, silent, vibrate, requireInteraction }
// ---------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || 'WaktuIbadah';
  const isAzan = payload.kind === 'prayer';
  const isCheckin = payload.kind === 'post_prayer_checkin';
  const isPreAzan = payload.kind === 'pre';

  // Tombol aksi interaktif:
  // - Azan: Heningkan Azan dan Tutup (Audio azan berbunyi otomatis)
  // - Checkin: Sudah Salat dan Nanti (Langsung mencatat tanpa membuka aplikasi)
  const notificationActions = isAzan
    ? [
        { action: 'silence_azan', title: 'Heningkan Azan 🔕' },
        { action: 'dismiss', title: 'Tutup' },
      ]
    : isCheckin
      ? [
          { action: 'sudah_salat', title: 'Sudah Salat ✅' },
          { action: 'dismiss', title: 'Nanti' },
        ]
      : [
          { action: 'open', title: 'Buka' },
          { action: 'dismiss', title: 'Tutup' },
        ];

  const options = {
    body: payload.body || 'Saatnya menunaikan ibadah.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: payload.tag || 'waktuibadah',
    renotify: true,
    requireInteraction: payload.requireInteraction === true || isAzan || isCheckin,
    silent: payload.silent === true,
    timestamp: Date.now(),
    data: {
      url: payload.url || '/',
      kind: payload.kind || 'general',
      prayer: payload.prayer || null,
    },
    actions: notificationActions,
  };

  // Getar haptic nyata berirama
  if (payload.silent !== true) {
    options.vibrate = Array.isArray(payload.vibrate)
      ? payload.vibrate
      : isAzan
        ? [200, 100, 200, 100, 300, 100, 500]
        : isCheckin
          ? [200, 100, 200]
          : [150, 100, 150];
  }

  event.waitUntil(
    (async () => {
      // Tampilkan notifikasi push di OS
      await self.registration.showNotification(title, options);

      // Kirim pesan ke seluruh window klien aktif agar memutar audio azan lokal bila tab sedang terbuka
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        client.postMessage({ type: 'PUSH_RECEIVED', payload });
      }
    })()
  );
});

// ---------------------------------------------------------------------------
// Klik notifikasi & Aksi Interaktif
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};

  // 1. Aksi Interaktif: Heningkan Azan (Matikan suara seketika tanpa buka web)
  if (event.action === 'silence_azan') {
    event.waitUntil(
      (async () => {
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of windows) {
          client.postMessage({ type: 'SILENCE_AZAN' });
        }
      })()
    );
    return;
  }

  // 2. Aksi Interaktif: Sudah Salat (Langsung catat ke database/storage secara background)
  if (event.action === 'sudah_salat' && data.prayer) {
    event.waitUntil(
      (async () => {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`; // tanggal LOKAL, bukan UTC

        // A. Catat ke IndexedDB agar aman walau tidak ada tab terbuka
        await recordPrayerOffline(data.prayer, todayStr);

        // B. Kirim event broadcast ke tab yang sedang aktif
        const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of windows) {
          client.postMessage({ 
            type: 'CONFIRM_PRAYER_SILENT', 
            prayer: data.prayer,
            date: todayStr
          });
        }

        // C. Tampilkan silent feedback toast di status bar
        await self.registration.showNotification(`Salat ${data.prayer} Tercatat ✅`, {
          body: `Alhamdulillah, salat ${data.prayer} Anda telah berhasil dicatat ke aplikasi.`,
          icon: '/icons/icon-192.png',
          badge: '/icons/badge-96.png',
          tag: 'prayer-confirmed-toast',
          silent: true,
          vibrate: [100, 50, 100]
        });
      })()
    );
    return;
  }

  // 3. Aksi 'open' atau klik langsung pada tubuh notifikasi: fokuskan tab atau buka aplikasi
  let targetPath = data.url || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && client.url !== targetUrl) {
            try {
              await client.navigate(targetUrl);
            } catch (e) {
              /* abaikan */
            }
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })()
  );
});

// Langganan push kedaluwarsa/diganti browser -> minta halaman berlangganan ulang
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
    })()
  );
});
