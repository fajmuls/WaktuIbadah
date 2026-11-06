/* WaktuIbadah Service Worker
 * - Menerima Web Push dari server (notifikasi tetap muncul walau aplikasi/tab ditutup)
 * - Menangani klik notifikasi
 * - Cache ringan agar aplikasi bisa dibuka offline
 *
 * CATATAN: file ini SENGAJA ditulis manual. Jangan tambahkan plugin yang
 * menghasilkan sw.js otomatis (mis. vite-plugin-pwa generateSW), karena akan
 * menimpa file ini dan menghapus handler 'push' di bawah.
 */

const VERSION = 'v2.0.0';
const SHELL_CACHE = `waktuibadah-shell-${VERSION}`;
const ASSET_CACHE = `waktuibadah-assets-${VERSION}`;

const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/badge-96.png',
];

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

  const notificationActions = isAzan
    ? [
        { action: 'dengar_azan', title: 'Dengar Azan 🔊' },
        { action: 'open', title: 'Buka' },
      ]
    : isCheckin
      ? [
          { action: 'sudah_salat', title: 'Sudah Salat ✅' },
          { action: 'open', title: 'Buka' },
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

  // Getar hanya bila tidak dibisukan (silent:true mematikan suara DAN getar).
  if (payload.silent !== true) {
    options.vibrate = Array.isArray(payload.vibrate)
      ? payload.vibrate
      : isAzan
        ? [800, 300, 800, 300, 1200]
        : isCheckin
          ? [400, 200, 400]
          : [300, 150, 300];
  }

  event.waitUntil(
    (async () => {
      // Selalu tampilkan notifikasi (wajib di iOS/Safari dan Chrome).
      await self.registration.showNotification(title, options);

      // Kirim pesan ke seluruh window klien aktif
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        client.postMessage({ type: 'PUSH_RECEIVED', payload });
      }
    })()
  );
});

// ---------------------------------------------------------------------------
// Klik notifikasi
// ---------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  let targetPath = data.url || '/';

  if (event.action === 'dengar_azan' && data.prayer) {
    targetPath = `/?playAzan=1&prayer=${encodeURIComponent(data.prayer)}`;
  } else if (event.action === 'sudah_salat' && data.prayer) {
    targetPath = `/ibadah?confirmPrayer=${encodeURIComponent(data.prayer)}`;
  }

  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        client.postMessage({ 
          type: 'NOTIFICATION_CLICK', 
          action: event.action, 
          prayer: data.prayer,
          data 
        });
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
