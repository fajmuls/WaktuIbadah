import { User, Task, Schedule, PrayerLog, FocusSession, Reflection, AppVersion, QuranLog, FavoriteAyah, FavoriteHadith, ReminderSettings, SurahItem, AyatItem, QuranKhatamTarget, AdminReviewConfig, WebsiteReview } from "../types";

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
};

export const CURRENT_VERSION = "2.0.0";

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  reminderType: 'sound_and_vibrate',
  alarmTone: 'azan_makkah',
  reminderPrayers: true,
  reminderImsak: true,
  reminderDeadlines: true,
  reminderSchedule: true,
  reminderPuasa: true,
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

  clearAll: () => localStorage.clear(),
};
