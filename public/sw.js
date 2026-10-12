// Service Worker for WaktuIbadah PWA
// Provides reliable background notification handling, notification click routing, and periodic sync

const CACHE_NAME = 'waktuibadah-v1.7.0';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[SW] WaktuIbadah Service Worker activated and claimed clients.');
    })
  );
});

// Handle incoming push messages
self.addEventListener('push', (event) => {
  let data = {
    title: '🕌 Waktu Salat Telah Tiba',
    body: 'Saatnya menunaikan salat dan istirahat sejenak dari aktivitas.',
    icon: '/assets/aistudio/logo.png',
    badge: '/assets/aistudio/logo.png',
    tag: 'waktu-ibadah-alarm',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://files.catbox.moe/3b6dqo.png',
    badge: data.badge || 'https://files.catbox.moe/3b6dqo.png',
    vibrate: [500, 200, 500, 200, 800],
    tag: data.tag || 'waktu-ibadah-alarm',
    renotify: true,
    requireInteraction: true,
    data: data.data || { url: '/' },
    actions: [
      { action: 'open_app', title: 'Buka Aplikasi' },
      { action: 'dismiss', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle periodic background sync (Chrome Android)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'prayer-alarm-sync') {
    event.waitUntil(
      self.registration.showNotification('🕌 Pengingat Ibadah Rutin', {
        body: 'Tetap jaga salat 5 waktu dan luangkan waktu untuk tilawah Al-Qur\'an.',
        icon: 'https://files.catbox.moe/3b6dqo.png',
        tag: 'periodic-prayer-sync',
        vibrate: [300, 100, 300]
      })
    );
  }
});
