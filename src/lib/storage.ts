import { User, Task, Schedule, PrayerLog, PrayerName, FocusSession, Reflection, AppVersion, QuranLog, FavoriteAyah, FavoriteHadith, ReminderSettings, SurahItem, AyatItem, QuranKhatamTarget, AdminReviewConfig, WebsiteReview, ReadingHancaItem } from "../types";

const KEYS = {
  USER: "wi_user",
  TASKS: "wi_tasks",
  SCHEDULES: "wi_schedules",
  PRAYERS: "wi_prayers",
  FOCUS: "wi_focus",
  REFLECTIONS: "wi_reflections",
  VERSION: "wi_version",
  PRAYER_CACHE: "wi_prayer_cache",
  QURAN_LOGS: "wi_quran_logs",
  FAVORITE_AYAHS: "wi_favorite_ayahs",
  FAVORITE_HADITHS: "wi_favorite_hadiths",
  OFFLINE_SURAHS: "wi_offline_surahs",
  REMINDER_SETTINGS: "wi_reminder_settings",
  KHATAM_TARGET: "wi_khatam_target",
  ADMIN_REVIEW: "wi_admin_review_config",
  NOTIFICATION_VERIFIED: "wi_notification_verified",
  WEBSITE_REVIEWS: "wi_website_reviews",
  BACKGROUND_SYNC_ALLOWED: "wi_bg_sync_allowed",
  BACKGROUND_SYNC_DISMISSED: "wi_bg_sync_dismissed",
  ADMIN_AUTHENTICATED: "wi_admin_authenticated",
  AUTO_DOA_MODAL: "wi_auto_doa_modal",
  SELECTED_CITY: "wi_selected_city",
  THEME_MODE: "wi_theme_mode",
  QURAN_WHITE_THEME: "wi_quran_white_theme",
  LAST_READ_AYAH: "wi_last_read_ayah",
  READING_HANCAS: "wi_reading_hancas",
  TAJWEED_ENABLED: "wi_tajweed_enabled",
};

export const CURRENT_VERSION = "2.9.0";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  reminderType: 'sound_and_vibrate',
  alarmTone: 'azan_makkah',
  reminderPrayers: true,
  reminderImsak: true,
  reminderDeadlines: true,
  reminderSchedule: true,
  reminderPuasa: true,
  preReminderMinutes: 10,
  silentNotifications: false,
};

// --- Generic Storage Helpers ---
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return defaultValue;
  }
}

let autoSyncTimer: any = null;
function triggerAutoSync() {
  if (typeof window !== 'undefined') {
    if (autoSyncTimer) clearTimeout(autoSyncTimer);
    autoSyncTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('wi_auto_cloud_sync'));
    }, 1200);
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if ([KEYS.USER, KEYS.TASKS, KEYS.SCHEDULES, KEYS.PRAYERS, KEYS.QURAN_LOGS, KEYS.FAVORITE_AYAHS, KEYS.FAVORITE_HADITHS, KEYS.KHATAM_TARGET, KEYS.REMINDER_SETTINGS].includes(key)) {
      triggerAutoSync();
    }
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
}

// --- Specific Getters and Setters ---

export const storage = {
  getUser: () => getItem<User | null>(KEYS.USER, null),
  setUser: (user: User) => setItem(KEYS.USER, user),
  
  getTasks: () => getItem<Task[]>(KEYS.TASKS, []),
  setTasks: (tasks: Task[]) => setItem(KEYS.TASKS, tasks),
  addTask: (task: Task) => setItem(KEYS.TASKS, [...storage.getTasks(), task]),
  updateTask: (task: Task) => setItem(KEYS.TASKS, storage.getTasks().map(t => t.id === task.id ? task : t)),
  deleteTask: (id: string) => setItem(KEYS.TASKS, storage.getTasks().filter(t => t.id !== id)),
  toggleTask: (id: string): Task[] => {
    const tasks = storage.getTasks().map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === 'Selesai' ? ('Belum mulai' as const) : ('Selesai' as const)
        };
      }
      return t;
    });
    storage.setTasks(tasks);
    return tasks;
  },

  getSchedules: () => getItem<Schedule[]>(KEYS.SCHEDULES, []),
  setSchedules: (schedules: Schedule[]) => setItem(KEYS.SCHEDULES, schedules),
  addSchedule: (schedule: Schedule) => setItem(KEYS.SCHEDULES, [...storage.getSchedules(), schedule]),
  updateSchedule: (schedule: Schedule) => setItem(KEYS.SCHEDULES, storage.getSchedules().map(s => s.id === schedule.id ? schedule : s)),
  deleteSchedule: (id: string) => setItem(KEYS.SCHEDULES, storage.getSchedules().filter(s => s.id !== id)),

  getPrayerLogs: () => getItem<PrayerLog[]>(KEYS.PRAYERS, []),
  setPrayerLogs: (logs: PrayerLog[]) => setItem(KEYS.PRAYERS, logs),
  getPrayerLog: (date: string): PrayerLog => {
    const found = storage.getPrayerLogs().find(p => p.date === date);
    if (found) {
      return {
        ...found,
        sunnahPrayers: found.sunnahPrayers || { Dhuha: false, Tahajud: false, Witir: false }
      };
    }
    return {
      date,
      prayers: { Subuh: false, Zuhur: false, Asar: false, Magrib: false, Isya: false },
      sunnahPrayers: { Dhuha: false, Tahajud: false, Witir: false }
    };
  },
  updatePrayerLog: (log: PrayerLog) => {
    const logs = storage.getPrayerLogs();
    const index = logs.findIndex(p => p.date === log.date);
    if (index >= 0) {
      logs[index] = log;
    } else {
      logs.push(log);
    }
    storage.setPrayerLogs(logs);
  },
  togglePrayer: (date: string, prayerKey: string): PrayerLog => {
    const current = storage.getPrayerLog(date);
    const validKeys: PrayerName[] = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'];
    const targetKey = validKeys.find(k => k.toLowerCase() === prayerKey.toLowerCase()) || ('Subuh' as PrayerName);
    
    const updated: PrayerLog = {
      ...current,
      prayers: {
        ...current.prayers,
        [targetKey]: !current.prayers[targetKey]
      }
    };
    storage.updatePrayerLog(updated);
    return updated;
  },

  getFocusSessions: () => getItem<FocusSession[]>(KEYS.FOCUS, []),
  addFocusSession: (session: FocusSession) => setItem(KEYS.FOCUS, [...storage.getFocusSessions(), session]),

  getReflections: () => getItem<Reflection[]>(KEYS.REFLECTIONS, []),
  getReflection: (date: string) => storage.getReflections().find(r => r.date === date),
  updateReflection: (reflection: Reflection) => {
    const reflections = storage.getReflections();
    const index = reflections.findIndex(r => r.date === reflection.date);
    if (index >= 0) {
      reflections[index] = reflection;
    } else {
      reflections.push(reflection);
    }
    setItem(KEYS.REFLECTIONS, reflections);
  },

  getVersion: () => getItem<AppVersion>(KEYS.VERSION, { version: CURRENT_VERSION, lastUpdated: new Date().toISOString() }),
  updateVersion: () => setItem(KEYS.VERSION, { version: CURRENT_VERSION, lastUpdated: new Date().toISOString() }),

  getPrayerCache: () => getItem<any>(KEYS.PRAYER_CACHE, null),
  setPrayerCache: (data: any) => setItem(KEYS.PRAYER_CACHE, data),

  // Quran Tilawah Logs
  getQuranLogs: () => getItem<QuranLog[]>(KEYS.QURAN_LOGS, []),
  setQuranLogs: (logs: QuranLog[]) => setItem(KEYS.QURAN_LOGS, logs),
  addQuranLog: (log: QuranLog) => {
    const logs = storage.getQuranLogs();
    setItem(KEYS.QURAN_LOGS, [log, ...logs]);
  },
  deleteQuranLog: (id: string) => {
    const logs = storage.getQuranLogs().filter(l => l.id !== id);
    setItem(KEYS.QURAN_LOGS, logs);
  },
  getQuranLogsByDate: (date: string) => {
    return storage.getQuranLogs().filter(l => l.date === date);
  },

  // Favorite Ayahs
  getFavoriteAyahs: () => getItem<FavoriteAyah[]>(KEYS.FAVORITE_AYAHS, []),
  addFavoriteAyah: (ayah: FavoriteAyah) => {
    const list = storage.getFavoriteAyahs();
    if (!list.some(a => a.id === ayah.id)) {
      setItem(KEYS.FAVORITE_AYAHS, [ayah, ...list]);
    }
  },
  removeFavoriteAyah: (id: string) => {
    const list = storage.getFavoriteAyahs().filter(a => a.id !== id);
    setItem(KEYS.FAVORITE_AYAHS, list);
  },
  isAyahFavorite: (id: string) => {
    return storage.getFavoriteAyahs().some(a => a.id === id);
  },

  // Favorite Hadiths
  getFavoriteHadiths: () => getItem<FavoriteHadith[]>(KEYS.FAVORITE_HADITHS, []),
  addFavoriteHadith: (hadith: FavoriteHadith) => {
    const list = storage.getFavoriteHadiths();
    if (!list.some(h => h.id === hadith.id)) {
      setItem(KEYS.FAVORITE_HADITHS, [hadith, ...list]);
    }
  },
  removeFavoriteHadith: (id: string) => {
    const list = storage.getFavoriteHadiths().filter(h => h.id !== id);
    setItem(KEYS.FAVORITE_HADITHS, list);
  },
  isHadithFavorite: (id: string) => {
    return storage.getFavoriteHadiths().some(h => h.id === id);
  },

  // Offline Surahs
  getOfflineSurahs: () => getItem<Record<string, { surah: SurahItem; ayahs: AyatItem[]; savedAt: string }>>(KEYS.OFFLINE_SURAHS, {}),
  saveOfflineSurah: (surah: SurahItem, ayahs: AyatItem[]) => {
    const current = storage.getOfflineSurahs();
    current[surah.nomor.toString()] = {
      surah,
      ayahs,
      savedAt: new Date().toISOString()
    };
    setItem(KEYS.OFFLINE_SURAHS, current);
  },
  removeOfflineSurah: (surahNumber: number) => {
    const current = storage.getOfflineSurahs();
    delete current[surahNumber.toString()];
    setItem(KEYS.OFFLINE_SURAHS, current);
  },
  isSurahOffline: (surahNumber: number) => {
    const current = storage.getOfflineSurahs();
    return !!current[surahNumber.toString()];
  },
  getOfflineSurahData: (surahNumber: number) => {
    const current = storage.getOfflineSurahs();
    return current[surahNumber.toString()] || null;
  },

  // Reminder Settings
  getReminderSettings: () => getItem<ReminderSettings>(KEYS.REMINDER_SETTINGS, DEFAULT_REMINDER_SETTINGS),
  setReminderSettings: (settings: ReminderSettings) => setItem(KEYS.REMINDER_SETTINGS, settings),

  // Khatam Target
  getKhatamTarget: () => getItem<QuranKhatamTarget | null>(KEYS.KHATAM_TARGET, null),
  setKhatamTarget: (target: QuranKhatamTarget | null) => setItem(KEYS.KHATAM_TARGET, target),

  // Ayah Bookmark Update
  updateFavoriteAyah: (ayah: FavoriteAyah) => {
    const list = storage.getFavoriteAyahs();
    const index = list.findIndex(a => a.id === ayah.id);
    if (index >= 0) {
      list[index] = ayah;
      setItem(KEYS.FAVORITE_AYAHS, [...list]);
    } else {
      storage.addFavoriteAyah(ayah);
    }
  },

  // Admin Review Config (Dual Mode: Website Review & GForm)
  getAdminReviewConfig: () => getItem<AdminReviewConfig>(KEYS.ADMIN_REVIEW, {
    isEnabled: true,
    reviewMode: 'website',
    gformUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc7z8w4qD3xN0mK9vL5b1Y8T_sample/viewform',
    title: 'Evaluasi Proyek PAI: Penggunaan Aplikasi WaktuIbadah',
    description: 'Bantu evaluasi efektivitas aplikasi WaktuIbadah untuk perkuliahan dan ibadah dengan mengisi kuesioner singkat ini.',
    updatedAt: new Date().toISOString()
  }),
  setAdminReviewConfig: (config: AdminReviewConfig) => {
    setItem(KEYS.ADMIN_REVIEW, config);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_admin_review_updated', { detail: config }));
    }
  },

  // Website Reviews (5-Star System)
  getWebsiteReviews: (): WebsiteReview[] => {
    const list = getItem<WebsiteReview[]>(KEYS.WEBSITE_REVIEWS, []);
    if (list.length === 0) {
      // Seed default initial respondent reviews for nice chart visualization
      const defaultReviews: WebsiteReview[] = [
        {
          id: 'seed-rev-1',
          userName: 'Ahmad Fauzi (Teknik Informatika)',
          rating: 5,
          ratingLabel: 'Sangat Membantu',
          comment: 'Sangat membantu menyeimbangkan tugas kuliah dan sholat tepat waktu. Suara adzannya jernih dan otomatis.',
          prayerAspectRating: 5,
          scheduleAspectRating: 5,
          submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]
        },
        {
          id: 'seed-rev-2',
          userName: 'Siti Nurhaliza (Manajemen)',
          rating: 5,
          ratingLabel: 'Sangat Membantu',
          comment: 'Tampilan bersih tanpa distraksi, fitur murottal dan jadwal bebas bentrok sangat memudahkan kegiatan sehari-hari.',
          prayerAspectRating: 5,
          scheduleAspectRating: 4,
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0]
        },
        {
          id: 'seed-rev-3',
          userName: 'Budi Santoso (Sistem Informasi)',
          rating: 4,
          ratingLabel: 'Membantu',
          comment: 'Pengingat adzan di HP sangat berguna saat sedang praktikum. Sangat rekomendasi untuk mahasiswa.',
          prayerAspectRating: 5,
          scheduleAspectRating: 4,
          submittedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
          date: new Date().toISOString().split('T')[0]
        },
        {
          id: 'seed-rev-4',
          userName: 'Nadia Putri (Pendidikan Agama Islam)',
          rating: 5,
          ratingLabel: 'Sangat Membantu',
          comment: 'Proyek website ini sangat relevan untuk kebutuhan ibadah dan kuliah. Evaluasi 5 bintang penuh!',
          prayerAspectRating: 5,
          scheduleAspectRating: 5,
          submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          date: new Date().toISOString().split('T')[0]
        },
        {
          id: 'seed-rev-5',
          userName: 'Rian Hidayat (Ilmu Komputer)',
          rating: 3,
          ratingLabel: 'Cukup Membantu',
          comment: 'Bagus dan bermanfaat. Akan lebih mantap jika ada sinkronisasi cloud.',
          prayerAspectRating: 4,
          scheduleAspectRating: 3,
          submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          date: new Date().toISOString().split('T')[0]
        }
      ];
      setItem(KEYS.WEBSITE_REVIEWS, defaultReviews);
      return defaultReviews;
    }
    return list;
  },
  addWebsiteReview: (review: WebsiteReview) => {
    const list = storage.getWebsiteReviews();
    const updated = [review, ...list];
    setItem(KEYS.WEBSITE_REVIEWS, updated);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_website_review_added', { detail: review }));
    }
  },
  hasUserReviewed: (userName?: string): boolean => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('wi_five_prayers_reviewed') === 'true' || localStorage.getItem('wi_rating_submitted') === 'true') {
        return true;
      }
    }
    const list = storage.getWebsiteReviews();
    // Non-seed reviews created by users have id starting with 'rev-'
    if (list.some(r => r.id.startsWith('rev-'))) return true;
    if (!userName) return false;
    return list.some(r => r.id.startsWith('rev-') || r.userName.toLowerCase().trim() === userName.toLowerCase().trim());
  },

  // Background Sync Permission & State
  isBackgroundSyncAllowed: () => getItem<boolean>(KEYS.BACKGROUND_SYNC_ALLOWED, false),
  setBackgroundSyncAllowed: (allowed: boolean) => setItem(KEYS.BACKGROUND_SYNC_ALLOWED, allowed),
  isBackgroundSyncDismissed: () => getItem<boolean>(KEYS.BACKGROUND_SYNC_DISMISSED, false),
  setBackgroundSyncDismissed: (dismissed: boolean) => setItem(KEYS.BACKGROUND_SYNC_DISMISSED, dismissed),

  // Persistent Admin Authentication
  isAdminAuthenticated: () => getItem<boolean>(KEYS.ADMIN_AUTHENTICATED, false),
  setAdminAuthenticated: (auth: boolean) => setItem(KEYS.ADMIN_AUTHENTICATED, auth),

  // Notification verification status
  isNotificationVerified: () => getItem<boolean>(KEYS.NOTIFICATION_VERIFIED, false),
  setNotificationVerified: (verified: boolean) => setItem(KEYS.NOTIFICATION_VERIFIED, verified),

  // Auto Doa Setelah Salat Modal
  getAutoDoaModal: () => getItem<boolean>(KEYS.AUTO_DOA_MODAL, true),
  setAutoDoaModal: (enabled: boolean) => setItem(KEYS.AUTO_DOA_MODAL, enabled),

  // Indonesian City & Timezone Selection
  getSelectedCity: () => getItem<string>(KEYS.SELECTED_CITY, "Jakarta"),
  setSelectedCity: (city: string) => {
    setItem(KEYS.SELECTED_CITY, city);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_city_changed', { detail: city }));
    }
  },

  // Manual Theme Mode ('light' | 'dark' | 'system')
  getThemeMode: (): 'light' | 'dark' | 'system' => getItem<'light' | 'dark' | 'system'>(KEYS.THEME_MODE, 'light'),
  setThemeMode: (mode: 'light' | 'dark' | 'system') => {
    setItem(KEYS.THEME_MODE, mode);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_theme_changed', { detail: mode }));
    }
  },

  // Forced White Theme for Quran Reading
  isQuranWhiteTheme: () => getItem<boolean>(KEYS.QURAN_WHITE_THEME, true),
  setQuranWhiteTheme: (enabled: boolean) => setItem(KEYS.QURAN_WHITE_THEME, enabled),

  // Tajweed Highlighting Standard Kemenag
  getTajweedEnabled: () => getItem<boolean>(KEYS.TAJWEED_ENABLED, true),
  setTajweedEnabled: (enabled: boolean) => {
    setItem(KEYS.TAJWEED_ENABLED, enabled);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_tajweed_changed', { detail: enabled }));
    }
  },

  // Last Read Ayah Marker (1 single active position)
  getLastReadAyah: () => getItem<{ surahNumber: number; surahName: string; ayahNumber: number; date: string } | null>(KEYS.LAST_READ_AYAH, null),
  setLastReadAyah: (data: { surahNumber: number; surahName: string; ayahNumber: number; date: string }) => {
    setItem(KEYS.LAST_READ_AYAH, data);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_last_read_updated', { detail: data }));
    }
  },
  clearLastReadAyah: () => {
    localStorage.removeItem(KEYS.LAST_READ_AYAH);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_last_read_updated', { detail: null }));
    }
  },

  // Multi-Hanca Bookmark Sets (Bisa punya beberapa set: Tilawah Harian, Tahfidz, Tadabbur, dsb.)
  getReadingHancas: (): ReadingHancaItem[] => {
    const list = getItem<ReadingHancaItem[]>(KEYS.READING_HANCAS, []);
    // Migration: jika belum ada hanca tapi ada last_read_ayah, buat default 'Tilawah Utama'
    if (list.length === 0) {
      const last = getItem<{ surahNumber: number; surahName: string; ayahNumber: number; date: string } | null>(KEYS.LAST_READ_AYAH, null);
      if (last) {
        const initialHanca: ReadingHancaItem = {
          id: 'default-hanca',
          name: 'Tilawah Harian',
          surahNumber: last.surahNumber,
          surahName: last.surahName,
          ayahNumber: last.ayahNumber,
          updatedAt: last.date
        };
        setItem(KEYS.READING_HANCAS, [initialHanca]);
        return [initialHanca];
      }
    }
    return list;
  },
  saveReadingHanca: (hanca: ReadingHancaItem) => {
    const list = getItem<ReadingHancaItem[]>(KEYS.READING_HANCAS, []);
    const idx = list.findIndex(h => h.id === hanca.id);
    if (idx >= 0) {
      list[idx] = hanca;
    } else {
      list.unshift(hanca);
    }
    setItem(KEYS.READING_HANCAS, list);
    // Juga update active last read marker
    storage.setLastReadAyah({
      surahNumber: hanca.surahNumber,
      surahName: hanca.surahName,
      ayahNumber: hanca.ayahNumber,
      date: hanca.updatedAt
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_hanca_updated', { detail: list }));
    }
  },
  deleteReadingHanca: (id: string) => {
    const list = getItem<ReadingHancaItem[]>(KEYS.READING_HANCAS, []).filter(h => h.id !== id);
    setItem(KEYS.READING_HANCAS, list);
    if (list.length > 0) {
      const first = list[0];
      storage.setLastReadAyah({
        surahNumber: first.surahNumber,
        surahName: first.surahName,
        ayahNumber: first.ayahNumber,
        date: first.updatedAt
      });
    } else {
      storage.clearLastReadAyah();
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_hanca_updated', { detail: list }));
    }
  },
  unbookmarkAyah: (surahNumber: number, ayahNumber: number) => {
    const list = getItem<ReadingHancaItem[]>(KEYS.READING_HANCAS, []);
    const filtered = list.filter(h => !(h.surahNumber === surahNumber && h.ayahNumber === ayahNumber));
    setItem(KEYS.READING_HANCAS, filtered);
    const last = getItem<{ surahNumber: number; surahName: string; ayahNumber: number; date: string } | null>(KEYS.LAST_READ_AYAH, null);
    if (last && last.surahNumber === surahNumber && last.ayahNumber === ayahNumber) {
      if (filtered.length > 0) {
        storage.setLastReadAyah({
          surahNumber: filtered[0].surahNumber,
          surahName: filtered[0].surahName,
          ayahNumber: filtered[0].ayahNumber,
          date: filtered[0].updatedAt
        });
      } else {
        storage.clearLastReadAyah();
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wi_hanca_updated', { detail: filtered }));
    }
  },

  // Export & Import Backup JSON Data
  exportAllData: (): Record<string, any> => {
    const backup: Record<string, any> = {
      app: 'WaktuIbadah',
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      keys: {}
    };
    Object.values(KEYS).forEach((key) => {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try {
          backup.keys[key] = JSON.parse(val);
        } catch {
          backup.keys[key] = val;
        }
      }
    });
    return backup;
  },

  importAllData: (backupObj: any): boolean => {
    if (!backupObj || typeof backupObj !== 'object' || !backupObj.keys) {
      return false;
    }
    try {
      Object.entries(backupObj.keys).forEach(([key, val]) => {
        if (key.startsWith('wi_')) {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        }
      });
      return true;
    } catch (e) {
      console.error('Failed to import backup data:', e);
      return false;
    }
  },

  clearAll: () => localStorage.clear(),
};
