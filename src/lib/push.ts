/**
 * Web Push client.
 *
 * Alur kerja:
 *  1. Pengguna menekan tombol (gesture) -> enablePush()
 *  2. Browser meminta izin -> membuat PushSubscription (pakai kunci publik VAPID)
 *  3. Langganan + preferensi + jadwal dikirim ke /api/push/subscribe (disimpan di Firestore)
 *  4. Server (cron tiap menit) mengirim push tepat waktu -> sw.js menampilkan notifikasi,
 *     walaupun aplikasi/tab sudah ditutup.
 */
import { storage } from './storage';
import { addDays, format } from 'date-fns';

const VAPID_PUBLIC_KEY: string = ((import.meta as any).env?.VITE_VAPID_PUBLIC_KEY as string) || '';
const ACTIVE_FLAG = 'wi_push_active';

export type DevicePlatform = 'android' | 'ios' | 'desktop';

export type PushSupport =
  | 'supported'
  | 'ios-needs-install' // iPhone/iPad: Web Push hanya jalan bila sudah "Tambah ke Layar Utama"
  | 'not-configured' // VITE_VAPID_PUBLIC_KEY belum diisi
  | 'unsupported';

export interface PushStatus {
  support: PushSupport;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  standalone: boolean;
  platform: DevicePlatform;
}

export interface PushResult {
  ok: boolean;
  reason?: 'denied' | 'dismissed' | 'ios-needs-install' | 'not-configured' | 'unsupported' | 'server' | 'no-profile';
  message?: string;
}

// ---------------------------------------------------------------------------
// Deteksi perangkat
// ---------------------------------------------------------------------------
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iPadOS13 = navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS13;
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    (navigator as any).standalone === true
  );
}

export function getPlatform(): DevicePlatform {
  if (isIOS()) return 'ios';
  if (/Android/i.test(navigator.userAgent || '')) return 'android';
  return 'desktop';
}

export function getPushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported';
  if (isIOS() && !isStandalone()) return 'ios-needs-install';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported';
  }
  if (!VAPID_PUBLIC_KEY) return 'not-configured';
  return 'supported';
}

export function isPushActive(): boolean {
  try {
    return localStorage.getItem(ACTIVE_FLAG) === '1';
  } catch {
    return false;
  }
}

function setPushActive(v: boolean) {
  try {
    if (v) localStorage.setItem(ACTIVE_FLAG, '1');
    else localStorage.removeItem(ACTIVE_FLAG);
  } catch {
    /* abaikan */
  }
}

// ---------------------------------------------------------------------------
// Utilitas
// ---------------------------------------------------------------------------
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  // Pastikan SW terdaftar lalu tunggu aktif
  let reg = await navigator.serviceWorker.getRegistration('/');
  if (!reg) reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  return navigator.serviceWorker.ready;
}

async function postJson(path: string, body: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok && data?.ok !== false, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: 'Tidak bisa terhubung ke server. Periksa internet Anda.' } };
  }
}

/** Susun data yang dikirim ke server dari localStorage. */
function buildPayload(sub: PushSubscription) {
  const user = storage.getUser();
  const rs = storage.getReminderSettings();
  const cache = storage.getPrayerCache();

  const today = format(new Date(), 'yyyy-MM-dd');
  const until = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const schedules = storage
    .getSchedules()
    .filter((s) => s.date >= today && s.date <= until && !s.completed)
    .map((s) => ({ id: s.id, title: s.title, date: s.date, startTime: s.startTime, completed: s.completed }));

  const tasks = storage
    .getTasks()
    .filter((t) => t.status !== 'Selesai' && t.deadline >= today && t.deadline <= until)
    .map((t) => ({ id: t.id, title: t.title, deadline: t.deadline, deadlineTime: t.deadlineTime, status: t.status }));

  return {
    subscription: sub.toJSON(),
    profile: {
      name: user?.name || '',
      cityId: user?.location?.cityId || cache?.cityId || '1301',
      cityName: user?.location?.city || cache?.location || '',
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta',
    },
    prefs: {
      prayers: rs.reminderPrayers !== false,
      imsak: rs.reminderImsak === true,
      puasa: rs.reminderPuasa !== false,
      schedule: rs.reminderSchedule !== false,
      deadlines: rs.reminderDeadlines !== false,
      preMinutes: rs.preReminderMinutes ?? 10,
      silent: rs.silentNotifications === true,
      reminderType: rs.reminderType,
    },
    schedules,
    tasks,
    device: { platform: getPlatform(), standalone: isStandalone() },
  };
}

// ---------------------------------------------------------------------------
// API publik
// ---------------------------------------------------------------------------
export async function getPushStatus(): Promise<PushStatus> {
  const support = getPushSupport();
  const permission: PushStatus['permission'] = 'Notification' in window ? Notification.permission : 'unsupported';
  let subscribed = false;
  if (support === 'supported') {
    try {
      const reg = await navigator.serviceWorker.getRegistration('/');
      subscribed = !!(await reg?.pushManager.getSubscription()) && isPushActive();
    } catch {
      subscribed = false;
    }
  }
  return { support, permission, subscribed, standalone: isStandalone(), platform: getPlatform() };
}

/**
 * Aktifkan notifikasi push. HARUS dipanggil dari klik/tap pengguna
 * (syarat Safari/iOS dan agar Chrome tidak memblokir pop-up izin).
 */
export async function enablePush(): Promise<PushResult> {
  const support = getPushSupport();
  if (support === 'ios-needs-install') {
    return { ok: false, reason: 'ios-needs-install', message: 'Di iPhone/iPad, pasang dulu aplikasi ke Layar Utama, lalu buka dari ikonnya.' };
  }
  if (support === 'not-configured') {
    return { ok: false, reason: 'not-configured', message: 'Server notifikasi belum dikonfigurasi (VITE_VAPID_PUBLIC_KEY kosong).' };
  }
  if (support === 'unsupported') {
    return { ok: false, reason: 'unsupported', message: 'Browser ini tidak mendukung notifikasi push. Coba Chrome (Android/PC) atau pasang sebagai aplikasi.' };
  }

  const user = storage.getUser();
  if (!user?.name) return { ok: false, reason: 'no-profile', message: 'Selesaikan pendaftaran nama terlebih dahulu.' };

  let permission = Notification.permission;
  if (permission === 'default') permission = await Notification.requestPermission();
  if (permission === 'denied') {
    return { ok: false, reason: 'denied', message: 'Izin notifikasi diblokir. Buka pengaturan situs/aplikasi di HP Anda lalu izinkan Notifikasi.' };
  }
  if (permission !== 'granted') return { ok: false, reason: 'dismissed', message: 'Izin notifikasi belum diberikan.' };

  try {
    const reg = await getRegistration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });
    }
    const r = await postJson('/api/push/subscribe', buildPayload(sub));
    if (!r.ok) {
      return { ok: false, reason: 'server', message: r.data?.error || `Server menolak (kode ${r.status}).` };
    }
    setPushActive(true);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'server', message: e?.message || 'Gagal membuat langganan notifikasi.' };
  }
}

/** Matikan notifikasi push di perangkat ini. */
export async function disablePush(): Promise<void> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await postJson('/api/push/unsubscribe', { endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
  } catch {
    /* abaikan */
  } finally {
    setPushActive(false);
  }
}

let syncTimer: number | null = null;

/** Kirim ulang preferensi/jadwal ke server (dipanggil saat data berubah). Diam-diam bila belum aktif. */
export function syncPushSoon(delayMs = 1500): void {
  if (!isPushActive()) return;
  if (syncTimer) window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => {
    syncPushNow().catch(() => {});
  }, delayMs);
}

export async function syncPushNow(): Promise<boolean> {
  if (!isPushActive() || getPushSupport() !== 'supported') return false;
  if (Notification.permission !== 'granted') {
    setPushActive(false);
    return false;
  }
  try {
    const reg = await getRegistration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      // Langganan hilang (mis. kedaluwarsa): buat ulang tanpa perlu gesture karena izin sudah ada
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });
    }
    const r = await postJson('/api/push/subscribe', buildPayload(sub));
    return r.ok;
  } catch {
    return false;
  }
}

/** Minta server mengirim notifikasi uji ke perangkat ini. */
export async function sendServerTestPush(): Promise<PushResult> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return { ok: false, reason: 'server', message: 'Perangkat ini belum berlangganan. Aktifkan notifikasi dulu.' };
    const r = await postJson('/api/push/test', { endpoint: sub.endpoint });
    if (!r.ok) return { ok: false, reason: 'server', message: r.data?.error || `Server menolak (kode ${r.status}).` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: 'server', message: e?.message || 'Gagal mengirim uji notifikasi.' };
  }
}
