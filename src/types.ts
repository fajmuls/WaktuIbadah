export interface User {
  name: string;
  target: string;
  reminderEnabled: boolean;
  useFocusMode: boolean;
  isOnboarded: boolean;
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

export interface PrayerLog {
  date: string; // YYYY-MM-DD
  prayers: Record<PrayerName, boolean>;
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

export interface FavoriteAyah {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  arab: string;
  latin: string;
  translation: string;
  addedAt: string;
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

