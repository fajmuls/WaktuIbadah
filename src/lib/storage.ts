import { User, Task, Schedule, PrayerLog, FocusSession, Reflection, AppVersion } from "../types";

const KEYS = {
  USER: "wi_user",
  TASKS: "wi_tasks",
  SCHEDULES: "wi_schedules",
  PRAYERS: "wi_prayers",
  FOCUS: "wi_focus",
  REFLECTIONS: "wi_reflections",
  VERSION: "wi_version",
  PRAYER_CACHE: "wi_prayer_cache",
};

export const CURRENT_VERSION = "1.2.0";

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

  clearAll: () => localStorage.clear(),
};
