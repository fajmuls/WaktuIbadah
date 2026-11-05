/**
 * PWA Service Worker & Background Sync Helper
 * Mendaftarkan Service Worker dan menyediakan notifikasi lokal (hanya saat aplikasi terbuka).
 * Notifikasi saat aplikasi TERTUTUP dikirim server lewat Web Push: lihat src/lib/push.ts.
 */

export interface PWAStatus {
  isSupported: boolean;
  isRegistered: boolean;
  permission: NotificationPermission;
  isPeriodicSyncSupported: boolean;
  isStandalone: boolean;
}

/**
 * Register Service Worker for PWA
 */
export async function registerPWA(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

    return registration;
  } catch (error) {
    console.debug('PWA Service Worker registration note:', error);
    return null;
  }
}

/**
 * Get current PWA & Background Sync status for diagnostic display
 */
export async function getPWAStatus(): Promise<PWAStatus> {
  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  let isRegistered = false;
  let isPeriodicSyncSupported = false;

  if (isSupported) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      isRegistered = !!reg;
      if (reg && 'periodicSync' in reg) {
        isPeriodicSyncSupported = true;
      }
    } catch {
      isRegistered = false;
    }
  }

  const permission = typeof window !== 'undefined' && 'Notification' in window 
    ? Notification.permission 
    : 'default';

  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );

  return {
    isSupported,
    isRegistered,
    permission,
    isPeriodicSyncSupported,
    isStandalone,
  };
}

/**
 * Display Notification via ServiceWorker (persists in background/mobile lock screen)
 * with graceful fallback to standard Notification API.
 */
export async function showPWANotification(
  title: string, 
  options: {
    body: string;
    icon?: string;
    tag?: string;
    badge?: string;
    data?: any;
    vibrate?: number[];
  }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return false;
  }

  const notificationOptions: NotificationOptions = {
    body: options.body,
    icon: options.icon || '/icons/icon-192.png',
    badge: options.badge || '/icons/badge-96.png',
    tag: options.tag || 'waktu-ibadah-alarm',
    data: options.data,
    ...(options.vibrate ? { vibrate: options.vibrate } : {}),
  };

  // 1. Try ServiceWorker Registration showNotification (works in background & mobile PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (err) {
      console.debug('ServiceWorker showNotification fallback:', err);
    }
  }

  // 2. Fallback to standard window Notification
  try {
    new Notification(title, notificationOptions);
    return true;
  } catch (err) {
    console.warn('Fallback notification failed:', err);
    return false;
  }
}

/**
 * Explicitly request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}
