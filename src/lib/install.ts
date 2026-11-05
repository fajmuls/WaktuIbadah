/**
 * Pemasangan PWA ("Install app").
 * Chrome/Edge/Samsung menembakkan event `beforeinstallprompt` sekali saja saat halaman dimuat,
 * jadi harus ditangkap sedini mungkin (dipanggil dari main.tsx sebelum React render).
 */
import { isIOS, isStandalone } from './push';

type DeferredPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: DeferredPrompt | null = null;
const listeners = new Set<() => void>();
const SNOOZE_KEY = 'wi_install_snooze_until';
const notify = () => listeners.forEach((cb) => cb());

export function initInstallPrompt(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as DeferredPrompt;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export function subscribeInstall(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function canPromptInstall(): boolean {
  return deferred !== null;
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferred) return 'unavailable';
  const d = deferred;
  deferred = null; // event hanya bisa dipakai sekali
  try {
    await d.prompt();
    const choice = await d.userChoice;
    notify();
    return choice.outcome;
  } catch {
    notify();
    return 'dismissed';
  }
}

export function shouldRecommendInstall(): boolean {
  if (isStandalone()) return false;
  try {
    const until = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    return Date.now() > until;
  } catch {
    return true;
  }
}

/** Tunda ajakan pasang selama beberapa hari (bukan selamanya). */
export function snoozeInstall(days = 3): void {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * 86400000));
  } catch {
    /* abaikan */
  }
}

export { isIOS, isStandalone };
