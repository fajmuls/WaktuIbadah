import { User, Task, Schedule, PrayerLog, FocusSession, Reflection, AppVersion, QuranLog, FavoriteAyah, FavoriteHadith, ReminderSettings, SurahItem, AyatItem } from "../types";

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
};

export const CURRENT_VERSION = "1.4.0";

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

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
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
  getPrayerLog: (date: string) => storage.getPrayerLogs().find(p => p.date === date) || { date, prayers: { Subuh: false, Zuhur: false, Asar: false, Magrib: false, Isya: false } },
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

  clearAll: () => localStorage.clear(),
};
