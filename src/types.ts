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

export interface PatchNoteItem {
  version: string;
  releaseDate: string;
  title: string;
  highlights: string[];
  soundPackUpdates: string[];
  uiOverhaul: string[];
  recommendations: string[];
}

export const APP_PATCH_NOTES: PatchNoteItem[] = [
  {
    version: '2.2.0',
    releaseDate: '31 Oktober 2026',
    title: 'Modul Doa & Zikir Lengkap, Modal 5 Waktu Salat, Background Memphis Polkadot, & Mobile Audio Policy',
    highlights: [
      'Menu Khusus Doa & Zikir: Halaman katalog baru (/doa) berisikan wirid dzikir dan doa setelah salat fardhu lengkap dengan teks Arab, transliterasi, terjemahan, dan counter tasbih taktil.',
      'Koleksi Doa Harian: Dilengkapi kumpulan doa harian penting (makan, tidur, keluar rumah, bepergian, menuntut ilmu dan ujian).',
      'Modal Doa Setelah Salat Otomatis: Selebrasi capaian saat ke-5 salat harian tercapai dengan opsi sakelar jangan tampilkan otomatis lagi.',
      'Logo Resmi & Icon Aplikasi: Icon WaktuIbadah asli terintegrasi penuh di favicon, apple-touch-icon, header sidebar PC, mobile top bar, dan splash screen pembuka.',
      'Background Memphis Polkadot: Tekstur polkadot retro klasik menghiasi latar belakang antarmuka secara elegan.',
      'Kalibrasi Warna Hijau Emerald: Warna hijau disesuaikan lebih teduh dan berimbang (rich emerald green) serasi dengan dashboard.',
      'Banner Fallback Autoplay Audio Mobile: Deteksi kebijakan pemblokiran audio browser HP dengan banner alert satu sentuhan untuk membunyikan suara Azan.',
      'Penyelarasan Zona Waktu Salat Indonesia: Pilihan kota-kota rujukan Indonesia (WIB, WITA, WIT) dengan GPS auto-detect fallback.'
    ],
    soundPackUpdates: [
      'Fallback banner penembus kebijakan autoplay browser mobile untuk suara adzan',
      'Efek suara capaian paska menuntaskan 5 waktu salat fardhu harian'
    ],
    uiOverhaul: [
      'Background texture polkadot Memphis bergradasi lembut',
      'SVG Memphis button icon badges dengan ragam geometri retro',
      'Modal responsif penuh Doa Setelah Salat dengan fitur salin doa instan'
    ],
    recommendations: [
      'Saran #1: Integrasikan fitur Target Khatam Ramadan & pengingat baca Al-Quran per waktu salat fardhu',
      'Saran #2: Tambahkan mode offline Audio Murottal per ayat atau per juz dengan IndexedDB caching',
      'Saran #3: Buat widget kalender Hijriah dinamis lengkap dengan jadwal puasa sunnah Ayyamul Bidh'
    ]
  },
  {
    version: '2.1.0',
    releaseDate: '31 Oktober 2026',
    title: 'Pembaruan UI Memphis Konsisten, Multi-tone Green Gradients & Animasi Opening',
    highlights: [
      'Penerapan Menyeluruh Memphis Design: Jadwal, Iqra, Progres, Al-Quran, dan Hadits kini bersatu padu menggunakan Memphis Classic Style (black solid borders, offset dropshadows, tactile tap response).',
      'Gradasi Multi-Tone Hijau: Menggantikan warna kuning dengan perpaduan gradasi hijau emerald, mint, dan teal bernuansa segar khas dashboard.',
      'Opening Website & Splash Screen: Logo Icon WaktuIbadah beranimasi melompat taktil (bouncing Memphis style) 2.6 detik sebelum membuka antarmuka utama.',
      'Suara Azan Otomatis & Notifikasi Sinkron: Azan Subuh (Shubuh.mp3) dan 4 salat fardhu (Fardhu.mp3) berbunyi serentak dengan Web Notifications dan in-app banner tanpa harus instalasi PWA.',
      'Perbaikan Tombol Jadwal & FAB: Menghilangkan tombol ganda Tambah Aktivitas di PC dan tombol melayang (FAB) di HP.',
      'Optimalisasi Mobile Responsif: Rasio elemen dan font diperkecil 1.4x - 1.5x lebih fit-screen tanpa adanya celah scroll ke samping (zero horizontal overflow).'
    ],
    soundPackUpdates: [
      'Pengintegrasian audio file Shubuh.mp3 khusus salat Subuh dan Fardhu.mp3 untuk Zuhur, Asar, Magrib, dan Isya',
      'Notifikasi audio browser otomatis tersinkron langsung ke dashboard saat waktu salat tiba'
    ],
    uiOverhaul: [
      'Pembersihan badge versi: Versi aplikasi kini secara eksklusif hanya dapat dilihat di halaman Pengaturan',
      'Desain minimalis fit-screen untuk HP pada Jadwal, Ibadah, Al-Quran, Progres, dan Menu',
      'Memphis Card Green Gradient berkarakter retro modern'
    ],
    recommendations: [
      'Saran #1: Tambahkan fitur Bookmark Terakhir Baca otomatis tersinkron ke cloud agar posisi tilawah antar-device tidak hilang',
      'Saran #2: Tambahkan Quick Widget Jadwal Kuliah Hari Ini di lockscreen/homescreen via PWA Shortcut',
      'Saran #3: Buat fitur mode senyap otomatis (Mute Azan / Do Not Disturb) saat mendeteksi jadwal kuliah sedang aktif'
    ]
  },
  {
    version: '2.0.0',
    releaseDate: '31 Oktober 2026',
    title: 'Pembaruan Akbar: Memphis Design System & Local Audio Pack',
    highlights: [
      'Desain UI Memphis Classic: Garis tepi hitam tegas (bold solid borders), offset shadow retro, dan palet warna berdaya kontras tinggi.',
      'Audio Pack Lokal Penuh: 26 efek suara asli diintegrasikan langsung untuk sentuhan tombol, tasbih dzikir, tilawah Qur\'an, adzan, dan perubahan status tugas/jadwal.',
      'PWA Background Notifications: Pengingat salat dan deadline tugas tetap andal muncul via Web Notifications API & Service Worker.',
      'Sinkronisasi Multi-Device Tanpa Login Rumit: Database terhubung otomatis via Nama Mahasiswa dengan opsional PIN 4-digit proteksi.',
      'Ulasan & Evaluasi Terpusat: Review 5-bintang tersinkron otomatis ke Firestore cloud dan dapat dipantau oleh Admin.'
    ],
    soundPackUpdates: [
      'UI Tap, Toggle, dan Tab Switch dengan latensi nol dari audio lokal',
      'Efek suara khusus adzan per waktu salat (Subuh, Zuhur, Asar, Magrib, Isya, Imsak)',
      'Haptic feedback getar smartphone presisi mendampingi setiap sentuhan',
      'Musik relaksasi ambient instrumental 90s loop untuk sesi fokus dan tilawah'
    ],
    uiOverhaul: [
      'Memphis Card, Memphis Button, dan Memphis Input di seluruh halaman aplikasi',
      'Efek tombol taktil dengan perpindahan koordinat 2px saat ditekan',
      'Badge status retro geometri dan indikator cloud sync memphis-badge'
    ],
    recommendations: [
      'Saran #1: Tambahkan Offline Sync Queue dengan background auto-retry saat koneksi internet pulih',
      'Saran #2: Banner dynamic alert jika ada perubahan jadwal kuliah mendadak dari perangkat lain',
      'Saran #3: Fitur cetak rekap ibadah & evaluasi PDF resmi untuk tugas proyek PAI'
    ]
  }
];

