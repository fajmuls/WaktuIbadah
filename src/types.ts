export interface User {
  name: string;
  target: string;
  reminderEnabled: boolean;
  useFocusMode: boolean;
  isOnboarded: boolean;
  pin?: string; // 4-digit PIN for collision avoidance across devices
  cloudSyncEnabled?: boolean;
  lastCloudSync?: string;
  theme?: string;
  timeFormat?: '24h' | '12h';
  soundEnabled?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    cityId?: string;
  };
}

export interface ReminderSettings {
  reminderType: 'sound_and_vibrate' | 'sound_only' | 'vibrate_only';
  alarmTone: 'azan_makkah' | 'chime_peaceful' | 'beep_classic';
  reminderPrayers: boolean;
  reminderImsak: boolean;
  reminderDeadlines: boolean;
  reminderSchedule: boolean;
  reminderPuasa: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline: string; // YYYY-MM-DD
  deadlineTime?: string; // HH:mm, default 23:59
  priority: 'Rendah' | 'Sedang' | 'Tinggi';
  status: 'Belum mulai' | 'Sedang dikerjakan' | 'Selesai';
  createdAt: string;
}

export type ScheduleCategory = 'Kuliah' | 'Tugas' | 'Ibadah' | 'Istirahat' | 'Pribadi' | 'Lainnya';

export interface Schedule {
  id: string;
  title: string;
  category: ScheduleCategory;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export type PrayerName = 'Subuh' | 'Zuhur' | 'Asar' | 'Magrib' | 'Isya';
export type SunnahPrayerName = 'Dhuha' | 'Tahajud' | 'Witir';

export interface PrayerLog {
  date: string; // YYYY-MM-DD
  prayers: Record<PrayerName, boolean>;
  sunnahPrayers?: Record<SunnahPrayerName, boolean>;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  duration: number; // in minutes
  completedAt: string;
}

export interface Reflection {
  date: string;
  q1: string; // berjalan sesuai rencana?
  q2: string; // paling mengganggu?
  q3: string; // ibadah teratur?
  q4: string; // perbaiki besok?
}

export interface AppVersion {
  version: string;
  lastUpdated: string;
}

export interface SurahItem {
  nomor: number;
  nama: string;
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi: string;
  audioFull?: Record<string, string>;
}

export interface AyatItem {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio?: Record<string, string>;
}

export interface HadithArbain {
  no: string;
  judul: string;
  arab: string;
  indo: string;
}

export interface DoaItem {
  id: string;
  judul: string;
  doa: string;
  latin: string;
  artinya: string;
  source: string;
}

export interface AsmaulHusnaItem {
  id: number;
  arab: string;
  latin: string;
  indo: string;
}

export interface QuranLog {
  id: string;
  date: string; // YYYY-MM-DD
  surahNumber: number;
  surahName: string;
  startAyat: number;
  endAyat: number;
  totalAyat: number;
  completedAt: string;
  notes?: string;
}

export type AyahBookmarkCategory = 'Hafalan' | 'Doa' | 'Motivasi' | 'Tadabbur';
export type AyahBookmarkColor = 'emerald' | 'amber' | 'blue' | 'purple';

export interface FavoriteAyah {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  arab: string;
  latin: string;
  translation: string;
  addedAt: string;
  category?: AyahBookmarkCategory;
  color?: AyahBookmarkColor;
  note?: string; // Catatan Tadabbur pribadi
}

export interface FavoriteHadith {
  id: string;
  source?: 'arbain' | 'perawi';
  perawiName?: string;
  no: string;
  judul?: string;
  arab: string;
  indo: string;
  addedAt: string;
}

export interface HadithPerawiInfo {
  name: string;
  slug: string;
  total: number;
}

export interface QuranKhatamTarget {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  targetDays: number;
  targetType: 'ayat' | 'halaman' | 'juz';
  totalUnits: number; // 6236 (ayat) or 604 (halaman) or 30 (juz)
  targetEndDate: string; // YYYY-MM-DD
  dailyTargetUnits: number;
  notes?: string;
  isCompleted?: boolean;
  createdAt: string;
}

export interface ReciterOption {
  id: string;
  name: string;
  arabicName: string;
  style: string;
}

export interface MurottalState {
  surahNumber: number;
  surahName: string;
  surahArabic: string;
  reciterId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  autoplayNext: boolean;
  sleepTimerMinutes: number | null; // null if off, or remaining seconds
  sleepTimerTarget: number | null; // timestamp when it should stop
  sleepTimerMode: 'none' | '15' | '30' | '45' | '60' | 'surah_end' | 'custom';
  playbackRate?: number; // 0.75, 1.0, 1.25, 1.5
}

export interface PrayerConflictInfo {
  prayerName: string;
  prayerTime: string;
  scheduleTitle: string;
  scheduleStartTime: string;
  scheduleEndTime: string;
  conflictType: 'overlap' | 'approaching';
  suggestion: string;
}

export type ReviewSystemMode = 'website' | 'gform' | 'both';

export interface AdminReviewConfig {
  isEnabled: boolean;
  reviewMode: ReviewSystemMode; // 'website' | 'gform' | 'both'
  gformUrl: string;
  title: string;
  description: string;
  updatedAt: string;
}

export type StarRatingValue = 1 | 2 | 3 | 4 | 5;

export interface WebsiteReview {
  id: string;
  userName: string;
  rating: StarRatingValue;
  ratingLabel: 'Tidak Membantu' | 'Kurang Membantu' | 'Cukup Membantu' | 'Membantu' | 'Sangat Membantu';
  comment: string;
  prayerAspectRating?: number; // 1-5
  scheduleAspectRating?: number; // 1-5
  submittedAt: string;
  date: string; // YYYY-MM-DD
}

