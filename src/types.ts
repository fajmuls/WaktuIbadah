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
  createdAt?: string; // ISO, waktu pertama kali mendaftar
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    cityId?: string;
  };
  gender?: 'male' | 'female' | 'Laki-laki' | 'Perempuan';
  autoPromptWirid?: boolean;
  tajweedEnabled?: boolean;
}

export interface ReminderSettings {
  reminderType: 'sound_and_vibrate' | 'sound_only' | 'vibrate_only';
  alarmTone: 'azan_makkah' | 'chime_peaceful' | 'beep_classic';
  reminderPrayers: boolean;
  reminderImsak: boolean;
  reminderDeadlines: boolean;
  reminderSchedule: boolean;
  reminderPuasa: boolean;
  /** Pengingat X menit sebelum waktu salat (0 = mati). */
  preReminderMinutes?: number;
  /** Bisukan notifikasi push (tanpa suara & getar). */
  silentNotifications?: boolean;
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
  prayerTimesRecords?: Record<string, string>; // HH:mm timestamp for each prayer
  sunnahPrayers?: Record<SunnahPrayerName, boolean>;
  sunnahTimesRecords?: Record<string, string>; // HH:mm timestamp for sunnah
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

export interface ReadingHancaItem {
  id: string;
  name: string; // e.g. 'Tilawah Harian', 'Tahfidz Juz 30', 'Khatam Ramadan'
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  updatedAt: string;
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
    version: '2.15.0',
    releaseDate: '12 November 2026',
    title: 'Integrasi Menu Kumpulan Hadis pada Navigation Bar Mobile & Pemisahan Kartu Menu Utama',
    highlights: [
      'Penambahan Tab Hadis Mobile: Menu Kumpulan Hadis Shahih kini dapat diakses 1-klik langsung melalui navigation bar di bagian bawah layar HP/smartphone.',
      'Optimasi Layout Navigation Bar Grid (7 Item): Menyelaraskan proporsi ikon dan label navigasi (Home, Jadwal, Ibadah, Qur\'an, Hadis, Doa, Menu) agar muat sempurna tanpa terpotong di layar HP berukuran kecil maupun besar.',
      'Pemisahan Kartu Menu Utama: Kartu "Al-Qur\'an 30 Juz" dan "Kumpulan Hadits Shahih" kini hadir sebagai kartu terpisah di halaman Menu utama untuk aksesibilitas maksimal.',
      'Visual Feedback Active State Memphis: Lencana pill aktif yang responsif dengan bayangan khas Memphis retro pada tab Hadis.'
    ],
    soundPackUpdates: [
      'Audio tap khas WaktuIbadah berbunyi responsif saat berpindah ke tab Hadis di mobile'
    ],
    uiOverhaul: [
      'Bottom navigation bar mobile lebih lengkap dengan 7 tab navigasi utama yang jelas, kontras, dan ramah ibu jari'
    ],
    recommendations: [
      'Buka aplikasi di perangkat HP / smartphone untuk mencoba menekan tab Hadis secara langsung dari navigation bar.',
      'Buka menu Pengaturan > Patch Notes untuk memverifikasi riwayat pembaruan versi 2.15.0.'
    ]
  },
  {
    version: '2.14.1',
    releaseDate: '11 November 2026',
    title: 'Perbaikan Firestore Security Rules (Izin Profil Mahasiswa Nama Singkat/1 Karakter) & Pencegahan Redundant Auto-Sync Loop',
    highlights: [
      'Perbaikan Fatal Error Izin Firestore Rules: Memperbaiki aturan izin tulis dan perbarui pada koleksi student_profiles sehingga nama pengguna singkat (1 karakter seperti "d") maupun nama lengkap dapat tersimpan dan tersinkronisasi mulus ke Firestore tanpa galat Missing or insufficient permissions.',
      'Optimalisasi Validasi PIN dan Dokumen Test: Menstandarkan validasi PIN 4 digit/kosong serta menambahkan izin baca pada dokumen pengujian koneksi (/test/{docId}).',
      'Pencegahan Infinite Auto-Sync Loop: Menambahkan penjaga kesamaan state (deep equality check) pada setItem storage dan penyelarasan sinkronisasi akun, mencegah pemanggilan syncAllToCloud berulang kali yang membebani jaringan dan kuota Firestore.',
      'Penyelarasan Skema Intermediate (firebase-blueprint.json): Memperbarui minLength nama mahasiswa menjadi 1 karakter agar konsisten dengan kebutuhan pengujian dan penggunaan riil.'
    ],
    soundPackUpdates: [
      'Audio feedback notifikasi dan sinkronisasi cloud tetap responsif tanpa tumpang tindih'
    ],
    uiOverhaul: [
      'Indikator sinkronisasi cloud stabil tanpa status error berkedip'
    ],
    recommendations: [
      'Uji coba mengetikkan nama singkat atau mengubah data di Pengaturan > Akun, lalu pantau indikator sinkronisasi cloud untuk memastikan data tersimpan lancar tanpa pesan error.',
      'Buka Admin Dashboard untuk memeriksa bahwa akun profil mahasiswa baru langsung tampil di daftar pengguna terdaftar.'
    ]
  },
  {
    version: '2.13.0',
    releaseDate: '10 November 2026',
    title: 'Perombakan UI Kalender Sage-Zamrud, Kartu Template Rutin Memphis, Pencatatan Timestamp Jam Salat Otomatis/Manual, & Grafik Analitik Tren Ibadah',
    highlights: [
      'UI Kalender Sage-Zamrud Kompak: Redesain grid kalender dengan tema Hijau Sage, Aksen Zamrud, dan Memphis border 1.5px tegas. Tanggal terlewat (past dates) memiliki pembeda warna latar (hijau zamrud 5/5, sage 1-4/5, muted abu-sage 0/5) tanpa kotak polos berlebih.',
      'Pencatatan Timestamp Jam Salat: Setiap kali salat fardhu atau sunnah dicentang, jam pengerjaan (HH:mm) otomatis tercatat. Pengguna dapat mengubah jam secara manual via picker jam.',
      'Redesain Halaman Jadwal & Template Rutin 1-Klik: Kartu template rutin (Dhuha, Tilawah, Tahajud) & strip kalender mini diselaraskan dengan estetika Memphis Sage-Zamrud yang bersih dan ergonomis.',
      'Grafik Analitik Tren Ibadah Detail: Halaman Progress kini menyajikan grafik sebaran jam salat harian, tren ketepatan waktu, dan konsistensi ibadah sunnah (Dhuha & Tahajud) serta tilawah.',
      'Pembersihan Data Responden Dummy Firestore: Menghapus total dokumen ulasan/profil dummy dari Firestore sehingga Admin Dashboard murni menampilkan pengguna riil.'
    ],
    soundPackUpdates: [
      'Audio feedback taktil saat mengubah timestamp jam salat manual dan membuat jadwal rutin'
    ],
    uiOverhaul: [
      'Visualisasi Kalender Sage-Zamrud dengan indikator bintang emas Dhuha, badge 5/5, dan icon tilawah',
      'Modal picker jam pengerjaan salat manual pada kartu rincian kalender & ibadah',
      'Kartu template rutin 1-klik Memphis dengan aksen zamrud & sage'
    ],
    recommendations: [
      'Uji coba mencentang Salat Subuh atau Dhuha, ketuk jam yang tercatat untuk mengubah jam manual, lalu periksa visualisasinya di Kalender dan Halaman Progress.'
    ]
  },
  {
    version: '2.12.1',
    releaseDate: '10 November 2026',
    title: 'Perbaikan Total Firestore Rules, Pembersihan Responden Dummy Ahmad Fauzi & Siti Nurhaliza, dan Indikator Kalender Ibadah Real-Time',
    highlights: [
      'Perbaikan Izin Akses Firestore Rules: Memisahkan operasi get dan list pada aturan student_profiles dan website_reviews, menuntaskan galat Missing or insufficient permissions saat memuat pengguna terdaftar di Admin Dashboard.',
      'Pembersihan Total Responden Dummy: Menghapus 5 template responden Ahmad Fauzi & Siti Nurhaliza dari kode sumber sehingga dashboard hanya menyajikan data pengguna riil dari Firestore.',
      'Indikator Kalender Ibadah Presisi: Kotak tanggal hari ini dan tanggal terpilih tidak lagi menghapus status ibadah. Status 5 fardhu lengkap tetap berlatar hijau, ikon bintang emas (⭐) Dhuha selalu muncul, dan titik tilawah tetap terlihat.',
      'Sinkronisasi Real-Time Antar Halaman: Penambahan custom event wi_data_updated menjamin perubahan checklist salat fardhu dan Dhuha langsung terrefleksi di kalender seketika.'
    ],
    soundPackUpdates: [
      'Penyegaran audio feedback saat sinkronisasi data cloud Firestore',
    ],
    uiOverhaul: [
      'Desain highlight tanggal hari ini dan tanggal terpilih pada kalender tanpa menghilangkan warna capaian ibadah',
      'Pembersihan daftar responden di Admin Dashboard hanya menampilkan data riil',
    ],
    recommendations: [
      'Lakukan uji coba registrasi akun baru dan checklist Dhuha untuk memverifikasi penampilan bintang emas di kalender dan kemunculan nama di Admin Dashboard.',
      'Gunakan tombol Hapus Akun pada Admin Dashboard untuk mengeliminasi profil uji coba yang tidak dibutuhkan sebelum presentasi penguji.'
    ]
  },
  {
    version: '2.12.0',
    releaseDate: '10 November 2026',
    title: 'Indikator Warna Kalender Ibadah & Sunnah Dhuha, Penjadwalan Simpel Template Rutin 1-Klik, 1-Tap Hanca Bookmark Al-Qur\'an, Tajwid Non-Destruktif, Admin Dashboard Firestore Direct & PWA Builder 100%',
    highlights: [
      'Visualisasi Kalender Ibadah & Salat Sunnah: Kotak tanggal memiliki kode warna adaptif (hijau pastel fardhu 5 waktu lengkap, dot hitung parsial) serta aksen sudut emas dan ikon bintang untuk salat Dhuha & Tahajud yang dikerjakan.',
      'Rincian Detail Ibadah Tanggal Kalender: Mengetuk tanggal pada kalender langsung membuka rincian lengkap salat fardhu, salat sunnah (Dhuha & Tahajud), catatan tilawah Al-Qur\'an, dan agenda kegiatan hari tersebut.',
      'Perombakan Jadwal Simpel & Mobile-Friendly: UI Jadwal disederhanakan tanpa button-overload dengan touch target ergonomis serta tombol cepat template ibadah rutin 1-klik (Rutin Dhuha, Rutin Tilawah, Rutin Tahajud) yang langsung sinkron ke Firestore.',
      'Al-Qur\'an 1-Tap Bookmark = Hanca Terakhir: Tombol bookmark pada setiap ayat kini langsung menyematkan ayat sebagai penanda Hanca terakhir dibaca tanpa form berbelit-belit, lengkap dengan audio taktil dan indikator aktif.',
      'Penyederhanaan Favorit Ayat: Ikon bintang/hati 1-sentuhan untuk menandai dan menghapus ayat favorit pengguna secara instan.',
      'Pewarnaan Tajwid Bersih & Non-Destruktif: Mode tajwid secara bawaan (default) dinonaktifkan agar tulisan Arab tampil murni dan sambungan huruf (ligatur) tidak terpotong. Pilihan pengaturan Tajwid Dasar dan Tajwid Lengkap (membedakan Idgham Bighunnah vs Bilaghunnah).',
      'Admin Dashboard Terhubung Langsung ke Firestore: Mengatasi kendala galat "server mengembalikan kode 200" dengan mekanisme dual-fetch langsung ke Firestore client SDK (student_profiles & website_reviews).',
      'Fitur Hapus Akun & Pembersihan Data Dummy: Admin dapat menghapus akun palsu/dummy langsung dari Admin Dashboard ke Firestore dengan konfirmasi aman.',
      'Sistem Logout dengan Peringatan PIN: Tombol keluar akun di Pengaturan dilengkapi peringatan proteksi bagi akun yang belum mengatur PIN 4-digit.',
      'Ulasan Website Bebas & Otomatis: Dialog ulasan muncul otomatis setelah 7 hari penggunaan aktif atau setelah hari pertama menuntaskan salat 5 waktu, dengan kotak isian mandiri tanpa template kaku.',
      'PWA Builder Standard Compliance: Format manifest.webmanifest dan manifest.json diperbarui memenuhi standar evaluasi 100% PWA Builder.'
    ],
    soundPackUpdates: [
      'Efek suara khusus penyimpanan bookmark hanca terakhir dan penghapusan favorit Al-Qur\'an',
      'Audio konfirmasi taktil saat pembuatan jadwal rutin 1-klik'
    ],
    uiOverhaul: [
      'Kotak tanggal kalender multi-indikator dengan pembeda warna fardhu lengkap dan aksen emas Dhuha',
      'Kartu template rutin 1-klik di halaman Jadwal',
      'Pilihan Tajwid di modal pengaturan baca Al-Qur\'an (Tanpa Tajwid, Tajwid Dasar, Tajwid Lengkap)',
      'Modal konfirmasi hapus data mahasiswa pada Admin Dashboard'
    ],
    recommendations: [
      'Saran #1 (Penting Sebelum Sidang): Pastikan seluruh responden mahasiswa menyetel PIN 4-Digit di profil untuk mencegah tumpang-tindih data cloud pada saat demonstrasi multi-perangkat.',
      'Saran #2: Gunakan tombol "Ekspor .ics" di halaman Jadwal untuk memasukkan agenda kuliah dan pengingat salat ke aplikasi Google Calendar ponsel penguji.',
      'Saran #3: Buat cadangan data (Backup JSON) di Pengaturan sebelum hari evaluasi tugas akhir PAI.'
    ]
  },
  {
    version: '2.11.0',
    releaseDate: '9 November 2026',
    title: 'Checklist Salat 5 Waktu di Dashboard (Home), Grid Kalender Bulanan Asli (Ahad-Sabtu), Manajemen Akun & PIN Mahasiswa di Panel Admin, Pustaka Doa Harian, & Audio Azan Handal',
    highlights: [
      'Checklist Salat 5 Waktu di Dashboard (Home): 5 kartu horizontal ringkas tepat di bawah jadwal salat untuk ceklis cepat salat fardhu harian yang tersinkron penuh dua arah dengan tab Ibadah.',
      'Proteksi Salat Masa Depan di Home & Ibadah: Salat pada waktu yang belum masuk atau hari esok otomatis terkunci dengan label status "Waktu belum tiba 🔒" untuk mencegah salah centang.',
      'Grid Kalender Bulanan Penuh (Ahad - Sabtu): Kalender berformat asli dengan navigasi bulan lengkap di tab Jadwal dan Ibadah, memungkinkan peninjauan dan pengisian ibadah lampau (qadha).',
      'Panel Admin Akun Mahasiswa & Pemulihan PIN: Tabel akun cloud mahasiswa terdaftar lengkap dengan Nama, Waktu Registrasi, dan PIN 4 Digit untuk mempermudah bantuan pemulihan akun.',
      'Perbaikan Wirid & Penambahan Doa Harian: Menghilangkan nomor duplikat pada judul wirid sesudah salat dan menambahkan doa harian penting (doa orang tua, sapu jagad, sebelum/sesudah belajar, dll).',
      'Penyelarasan Notifikasi & Audio Azan: URL audio azan Subuh dan Fardhu diperkuat dengan fallback CDN terpercaya serta aksi checklist notifikasi senyap yang langsung terupdate.',
      'Perapian Tipografi Al-Qur\'an & Performa Ringan: Jeda vertikal ayat Al-Qur\'an dirapikan untuk layar ponsel dan durasi animasi dioptimalkan lebih cepat dan gesit.'
    ],
    soundPackUpdates: [
      'Audio azan Subuh dan Fardhu terkonfigurasi dengan URL CDN stabil dan responsif'
    ],
    uiOverhaul: [
      '5 Kartu checklist salat horizontal di Dashboard dengan gaya Memphis tipis 1.5px',
      'Tampilan kalender bulanan penuh dengan kolom Ahad sampai Sabtu',
      'Tabel daftar mahasiswa di Admin Dashboard dengan fitur salin PIN cepat'
    ],
    recommendations: [
      'Saran Fitur Utama Selanjutnya: Pengingat Notifikasi Berulang Jika Belum Salat (Reminder Nudge setiap 15 menit pasca-azan hingga waktu habis)',
      'Saran UI/UX & QoL: Opsi cetak / unduh rekap kehadiran dan checklist salat bulanan dalam format PDF untuk laporan tugas kuliah PAI',
      'Saran Pencegahan & Perbaikan Bug: Penambahan service worker periodic background sync untuk perangkat yang membatasi background network'
    ]
  },
  {
    version: '2.10.0',
    releaseDate: '7 November 2026',
    title: 'Azan Otomatis Tanpa Tombol Dengar, Tombol Heningkan Azan, Checklist Senyap Latar Belakang (Tanpa Buka Web), Pengingat Pra-Azan 10/30 Menit, Getaran Haptik Ritmis, & Wallpaper Floating Pop-Out Widget',
    highlights: [
      'Azan Otomatis Tanpa Perlu Tekan Tombol: Jika pengguna mengaktifkan audio azan di awal, audio azan langsung melantun otomatis ketika waktu salat tiba tanpa mewajibkan menekan tombol "Dengar Azan".',
      'Tombol Aksi Notifikasi Interaktif Mandiri: Notifikasi azan kini dilengkapi tombol "Heningkan Azan 🔕" dan "Tutup" yang mengeksekusi langsung tanpa membuka atau mengganggu jendela aplikasi.',
      'Checklist Salat Senyap Tanpa Buka Web (Zero-Window Open): Pada notifikasi evaluasi 30 menit setelah salat, menekan tombol "Sudah Salat ✅" langsung mencatat ibadah ke IndexedDB dan localStorage secara senyap di latar belakang tanpa membuka aplikasi.',
      'Dialog Pengaturan Pra-Azan di Awal (10 & 30 Menit): Pilihan persiapan sebelum azan langsung disajikan di awal aplikasi untuk pengguna baru maupun pengguna lama yang belum mengaturnya.',
      'Getaran Ritmis Haptik Nyata: Pola getaran haptik [200ms, 100ms, 200ms, 100ms, 300ms, 100ms, 500ms] aktif pada push notification dan peringatan azan pada perangkat yang mendukung.',
      'Wallpaper Pop-Out Widget Glassmorphism: Mode widget mengambang berlatar kaca transparan yang dapat disematkan di atas wallpaper desktop atau layar ponsel dengan fitur Always-on-Top / Picture-in-Picture.'
    ],
    soundPackUpdates: [
      'Audio azan Subuh dan Fardhu berbunyi otomatis dan dapat diheningkan langsung lewat tombol push notification tanpa membuka jendela web'
    ],
    uiOverhaul: [
      'Modal Pengaturan Awal Pengingat Azan v2.10.0 dengan desain Memphis modern 1.5px',
      'Tampilan Wallpaper Pop-Out Widget dengan glassmorphism lembut dan dukungan jendela mandiri tanpa reload',
      'Notifikasi konfirmasi senyap bersuara tenang yang tidak mengganggu aktivitas pengguna'
    ],
    recommendations: [
      'Saran Fitur Utama Selanjutnya: Pemutar Murottal Kontinu dengan mode Uji Hafalan (sembunyikan baris kata Arab bertahap untuk latihan tahfidz mandiri)',
      'Saran UI/UX & QoL: Opsi download seluruh audio Al-Qur\'an sekaligus dalam satu klik (One-Click Bulk Audio Download) dengan estimasi ukuran penyimpanan offline',
      'Saran Pencegahan & Perbaikan Bug: Penanganan sinkronisasi zona waktu otomatis ketika pengguna berpindah zona waktu WIB, WITA, dan WIT tanpa perlu me-reset kota'
    ]
  },
  {
    version: '2.9.0',
    releaseDate: '6 November 2026',
    title: 'Widget Desktop & Pop-Out, Navigasi Kalender Geser, Kunci Salat Mendatang, Tajwid Warna Kemenag, Salat Jumat Otomatis, & Dialog Wirid Sesudah Salat',
    highlights: [
      'Widget Desktop Pop-Out & PWA Shortcuts: Mode jendela desktop terpisah (Window Pop-Out / Picture-in-Picture) untuk disematkan di sudut layar laptop/PC tanpa reload atau share link rusak.',
      'Navigasi Kalender Geser (Strip Hari) di Jadwal & Ibadah: Tombol panah geser (< dan >) dan pemilih tanggal ringkas untuk melihat dan mencatat ibadah hari-hari sebelumnya (qadha/backfill).',
      'Penguncian Cerdas Salat Mendatang: Salat fardhu pada hari yang belum tiba atau jam yang belum masuk otomatis terkunci dengan label status "Waktu belum tiba", mencegah salah ceklis sebelum waktunya.',
      'Dialog Ajakan Wirid & Doa Setelah Salat: Pop-up otomatis pengingat wirid sesudah mencentang salat fardhu apa pun, lengkap dengan tombol "Jangan ingatkan lagi" dan pengaturan aktif/nonaktif di Setting.',
      'Tajwid Berwarna Standar Kemenag RI: Teks ayat suci Al-Qur\'an kini dapat ditampilkan dengan warna tajwid resmi Kemenag (Ghunnah hijau, Ikhfa kuning, Idgham cyan, Iqlab ungu, Qalqalah merah, Mad merah tua) dengan sakelar on/off di pengaturan baca.',
      'Penyesuaian Otomatis Salat Jumat: Pengguna ikhwan (Laki-laki) otomatis melihat label "Salat Jumat" pada hari Jumat menggantikan nama Zuhur.',
      'Eliminasi Double Sound & Audio Noise: Memperbaiki benturan suara ganda (suara klik global + suara buka surah) saat membuka surah Al-Qur\'an agar pembacaan tenang dan nyaman.',
      'Anti-Overlap & Tipografi Responsif: Memperbaiki judul dan kartu yang sebelumnya tertimpa atau terpotong pada layar ponsel kecil (Kumpulan Doa & Zikir, Widget Layar, dan heading pencatatan ibadah).',
      'Izin Notifikasi Awal di Onboarding: Meminta izin notifikasi secara transparan sejak awal setup agar jadwal azan dan pengingat langsung siap berbunyi.'
    ],
    soundPackUpdates: [
      'Penyelarasan audio pembuka Al-Qur\'an agar tidak bertabrakan dengan feedback klik tombol global'
    ],
    uiOverhaul: [
      'Strip kalender geser horizontal di halaman Jadwal dan Ibadah dengan tombol lompat Hari Ini',
      'Ukuran judul pencatatan ibadah diperhalus agar proporsional dan tidak mendominasi layar ponsel',
      'Font judul surah pada daftar Al-Qur\'an dibuat lebih ramping (unbold) untuk tampilan clean look',
      'Jendela pop-out widget dengan ukuran ideal 360x560px siap pakai'
    ],
    recommendations: [
      'Saran Fitur Selanjutnya: Mode Uji Hafalan (sembunyikan kata/ayat bertahap untuk muraja\'ah mandiri)',
      'Saran UI/UX & QoL: Opsi download seluruh audio Al-Qur\'an sekaligus dalam satu klik untuk penggunaan offline total tanpa kuota',
      'Saran Perbaikan Bug: Penanganan sinkronisasi zona waktu otomatis ketika pengguna bepergian melintasi zona WIB, WITA, dan WIT'
    ]
  },
  {
    version: '2.8.0',
    releaseDate: '6 November 2026',
    title: 'Mode Widget Salat & Tugas Minimalis, Notifikasi Check-in +30 Menit, Pemutaran Azan, Memphis Modern Tipis 1.5px, & QoL Murottal Auto-Scroll',
    highlights: [
      'Mode Widget Minimalis Terpisah (/widget) & Floating In-App: Widget interaktif yang bisa di-resize untuk ceklis 5 waktu salat dan tugas harian tanpa perlu membuka menu panjang.',
      'Notifikasi Check-in 30 Menit Pasca-Salat: Pengingat cerdas 30 menit setelah azan dengan tombol aksi sekali ketuk "Sudah Salat" yang langsung mencatat salat otomatis ke aplikasi.',
      'Perbaikan Pemutaran Azan Push & In-App: Mengetuk notifikasi azan atau tombol "Dengar Azan" langsung memutar audio azan Subuh/Fardhu secara andal.',
      'Gaya Memphis Modern Tipis 1.5px: Menyelaraskan border hitam 1.5px elegan dan bayangan tipis pada modul Al-Qur\'an dan Doa Zikir agar serasi dengan ciri khas WaktuIbadah.',
      'Perombakan Menu Doa & Zikir: Tampilan baru yang lebih simpel, bersih, dan rapi menyerupai Qur\'an dengan penghitung tasbih interaktif.',
      'Perapian Tipografi Halaman Menu: Menghilangkan kesan brutalist bold yang terlalu tebal, diganti dengan hierarki font-semibold yang nyaman dipandang beserta ikon SVG kategori.',
      'Bilah Navigasi Bawah SVG Kustom: Ikon-ikon navigasi bawah kini menggunakan grafis vektor SVG asli yang tajam dan presisi.',
      'Fitur QoL Murottal Auto-Scroll & Highlighting: Layar pembaca Al-Qur\'an secara otomatis menyorot dan menggulir ke ayat yang sedang dilantunkan qari, dilengkapi pemutar kontinu.',
      'Pilihan Suara Qari Ternama: Pilihan lantunan qari antara Syaikh Misyari Rasyid Al-Afasy, Syaikh Abdurrahman As-Sudais, dan Syaikh Sa\'ad Al-Ghamidi.',
      'Tema Membaca Kertas Sepia / Parchment: Opsi warna latar membaca ketiga bernuansa kertas mushaf hangat untuk kenyamanan mata di malam hari.'
    ],
    soundPackUpdates: [
      'Pemutaran azan Subuh dan Fardhu terintegrasi langsung dengan aksi notifikasi browser Web Push'
    ],
    uiOverhaul: [
      'Widget salat & tugas minimalis dengan 3 level ukuran (Mini, Sedang, Penuh)',
      'Bilah navigasi bawah dengan ikon SVG vektor murni yang responsif',
      'Penyelarasan border tipis 1.5px di seluruh kartu Qur\'an dan Doa Zikir'
    ],
    recommendations: [
      'Saran Fitur Terdekat: Mode Uji Hafalan (fitur blur/sembunyikan ayat untuk latihan tahfidz mandiri)',
      'Saran UI/UX: Animasi page-flip lembut pada mode mushaf continuous per halaman',
      'Saran QoL: Generator kartu kutipan ayat Al-Qur\'an estetik untuk dibagikan ke status WhatsApp/Instagram',
      'Saran Perbaikan: Optimasi penghematan daya background worker saat perangkat dalam mode baterai lemah'
    ]
  },
  {
    version: '2.7.0',
    releaseDate: '6 November 2026',
    title: 'Desain Baru Al-Qur\'an Bersih (Clean Look), Ornamen Bintang Islami SVG, Indeks 30 Juz, Sistem Multi-Hanca, & Baris Aksi 4 Tombol Ringkas',
    highlights: [
      'Desain Baru Al-Qur\'an Bersih (Clean Look): Tampilan daftar surah dengan kaligrafi Arab otentik dan ornamen bintang segi-8 Islami (Rub el Hizb) SVG.',
      'Navigasi 3 Tab Terpadu: Tab SURAH, tab JUZ (indeks lengkap 30 Juz dengan lompatan ayat langsung), dan tab BOOKMARK (Sistem Multi-Hanca).',
      'Sistem Multi-Hanca Bernama: Menandai batas terakhir membaca Al-Qur\'an ke dalam beberapa set (contoh: Tilawah Harian, Tahfidz Juz 30, Tadabbur) dengan tombol cepat lanjut baca dan kemampuan unbookmark/hapus tanda kapan saja.',
      'Tampilan Membaca Zebra-Striping: Latar ayat bergantian lembut (krem gading dan putih bersih) yang nyaman di mata.',
      'Tab Bar Geser Horizontal Surah: Pilihan berpindah surah langsung di bagian atas pembaca (misal 1. Al-Fatihah, 2. Al-Baqarah, 3. Ali \'Imran).',
      'Baris Aksi Ayat Kompak 4 Tombol: Tombol Putar Audio, Tafsir Kemenag RI, Simpan Favorit, dan Tandai Hanca tersusun rapi di sisi kanan tanpa menghalangi ayat suci.',
      'Pengaturan Pembaca Cepat 5 Level Huruf: Sakelar Teks Latin, Terjemahan, dan 5 preset ukuran font Arab (A--, A-, A, A+, A++) yang bisa diperkecil hingga ukuran paling ringkas.',
      'Perbaikan Sakelar Tema: Mode Terang/Gelap/Sistem kini aktif seketika dan tersinkronisasi di seluruh aplikasi.'
    ],
    soundPackUpdates: [
      'Dukungan unduh audio murottal per surah untuk pemutaran offline dengan penanda status unduhan yang jelas'
    ],
    uiOverhaul: [
      'Ornamen bintang segi-8 Islami murni berbasis vektor SVG tajam pada nomor surah, nomor juz, dan nomor ayat',
      'Header Al-Qur\'an elegan bergaya mushaf dengan bingkai nama surah, jenis wahyu, dan total ayat',
      'Penyesuaian tata letak responsif ponsel satu tangan yang ergonomis'
    ],
    recommendations: [
      'Saran Fitur Terdekat: Pemutar audio kontinu otomatis gulir (auto-scroll) mengikuti ayat yang sedang dibacakan qari',
      'Saran UI/UX: Tambahkan tema warna kertas kuno (sepia / parchment) untuk kenyamanan membaca di malam hari',
      'Saran QoL: Pencarian cerdas ayat Al-Qur\'an berdasarkan kata kunci terjemahan bahasa Indonesia',
      'Saran Perbaikan: Indikator persentase progres unduhan murottal saat mengunduh surat berukuran besar'
    ]
  },
  {
    version: '2.6.0',
    releaseDate: '6 November 2026',
    title: 'Notifikasi Push Server untuk Semua Pengguna, Pengaturan 5 Tab, & Pembaca Al-Qur\'an Ringkas',
    highlights: [
      'Notifikasi Web Push dari server: azan, pengingat salat, jadwal kuliah, dan tenggat tugas muncul walau aplikasi ditutup.',
      'Setiap kali aplikasi dibuka dan notifikasi belum aktif, pengguna diajak mengaktifkan dengan satu ketukan, lalu memilih Suara + getar, Getar saja, atau Senyap.',
      'Pengaturan dirapikan menjadi 5 tab: Akun, Notifikasi, Ibadah, Tampilan, dan Data.',
      'Header daftar Al-Qur\'an dan pembaca dibuat ringkas: tab 4 kolom sama lebar, menu Aa untuk mode baca, ukuran huruf, layar penuh, offline, dan tilawah.',
      'Teks Latin dan terjemahan hanya diatur di Pengaturan (tidak ada tombol di halaman baca).'
    ],
    soundPackUpdates: [
      'Pilihan cara notifikasi berbunyi: Suara + getar, Getar saja, atau Senyap'
    ],
    uiOverhaul: [
      'Border, bayangan, dan huruf tebal diseragamkan lebih tipis dan ringkas di seluruh aplikasi',
      'Perbaikan bayangan kartu yang terpotong di sisi kanan sehingga tata letak seimbang kiri-kanan'
    ],
    recommendations: [
      'Saran: amankan profil dan PIN dengan Firebase Auth atau API server',
      'Saran: tambahkan widget waktu salat berikutnya'
    ]
  },
  {
    version: '2.5.0',
    releaseDate: '5 November 2026',
    title: 'Perombakan UI Al-Qur\'an Minimalis Clean, Justify Alignment Mushaf, Perbaikan Bug Un-Favorite Ayat, & Dokumentasi Vercel Deployment',
    highlights: [
      'Perombakan Visual Al-Qur\'an Minimalis: Menghapus outline border tebal dan bayangan hitam tebal di modul Al-Qur\'an, diganti dengan gaya clean, tipis, dan modern.',
      'Justify Alignment Mode Mushaf Kontinu: Teks Arab Al-Qur\'an pada tampilan per halaman tersusun rata kiri-kanan (text-justify) yang seimbang dan indah.',
      'Perbaikan Bug Hapus Ayat Favorit: Mengetuk ikon Hati (⭐/❤️) secara langsung menambah/menghapus ayat dari daftar Favorit tanpa masalah tersimpan terus.',
      'Penyederhanaan Header & Pengaturan Teks: Menghilangkan tombol mata pada header Al-Qur\'an; sakelar Teks Latin, Terjemahan, dan Arab kini dipusatkan di menu Pengaturan.',
      'Panduan Vercel & Environment Variables: Dokumentasi lengkap Vercel Redis (Upstash), SITE_URL, CRON_SECRET, ADMIN_TOKEN, dan penjadwalan cron-job.org per menit.'
    ],
    soundPackUpdates: [
      'Menghilangkan efek suara otomatis yang bising saat membuka surat Al-Qur\'an'
    ],
    uiOverhaul: [
      'Desain kartu ayat Al-Qur\'an tipis, clean, dan elegan',
      'Teks Arab menggunakan bobot font seimbang (font-normal) yang nyaman di mata',
      'Penyederhanaan sticky header Al-Qur\'an tanpa tombol terpotong'
    ],
    recommendations: [
      'Saran UI/UX: Tambahkan fitur penanda Juz (Juz 1-30) dengan tab navigasi cepat',
      'Saran QoL: Pilihan Qari Murottal tambahan (Misyari Rasyid, Abdul Basit, Sudais)',
      'Saran Perbaikan: Integrasi PWA Push Notification langsung via Upstash KV Vercel'
    ]
  },
  {
    version: '2.4.0',
    releaseDate: '5 November 2026',
    title: 'Mode Per Halaman Mushaf Kontinu, Bottom Sheet Tafsir Kemenag RI, Mode Fullscreen Reader, & Export/Import Data Backup',
    highlights: [
      'Mode Per Halaman Mushaf Kontinu: Pilihan membaca Al-Qur\'an ala Mushaf mengalir sambung dengan nomor ayat melingkar di akhir ayat.',
      'Bottom Sheet Tafsir Kemenag RI: Ketuk teks ayat Al-Qur\'an mana saja untuk membaca analisis Tafsir Ringkas Kemenag RI per ayat.',
      'Mode Fullscreen Reader: Opsi menyembunyikan header dan bottom navigation bar untuk kenyamanan membaca tanpa distraksi.',
      'Sakelar Kontrol Teks Fleksibel: Pengaturan lengkap untuk menampilkan Teks Arab saja, Arab+Latin, Arab+Terjemahan, atau Teks Lengkap.',
      'Export & Import Backup JSON Data: Tombol unduh dan pulihkan file cadangan .json di halaman Pengaturan untuk migrasi data tanpa cloud.',
      'IndexedDB Murottal Offline Caching: Audio murottal per ayat yang pernah diputar disimpan secara otomatis untuk pemutaran offline.'
    ],
    soundPackUpdates: [
      'Pemutaran audio murottal otomatis menggunakan cache IndexedDB jika tersedia offline'
    ],
    uiOverhaul: [
      'Tampilan Mushaf Kontinu berlatar hangat khas kertas Al-Qur\'an',
      'Bottom Sheet Tafsir Kemenag interaktif beranimasi slide-up',
      'Tombol Fullscreen dedicated di header sticky Al-Qur\'an'
    ],
    recommendations: [
      'Saran UI/UX: Pencarian kata kunci ayat Al-Qur\'an langsung dari baris Mushaf',
      'Saran QoL: PWA Widget pengingat azan berikutnya di layar HP',
      'Saran Perbaikan: Pemutaran audio murottal otomatis berlanjut antar surat (Continuous Auto-next Surah)'
    ]
  },
  {
    version: '2.3.1',
    releaseDate: '5 November 2026',
    title: 'Optimasi UI/UX Mobile (360px-412px), Perbaikan Firestore Rules, & Sticky Header Al-Qur\'an Ringkas',
    highlights: [
      'Penyelarasan Tampilan Mobile (360-412px): Border presisi 1.5px dan bayangan offset 2px Memphis style di seluruh aplikasi.',
      'Bottom Navigation Ringkas (60px): Indikator tab aktif berupa pil warna lembut dengan label 10-11px tanpa teks terpotong.',
      'Header Al-Qur\'an Sticky Single-Row (64px): Kontrol ukuran huruf (A-/A+), sakelar Latin/Terjemahan, dan murottal audio ringkas.',
      'Tombol Aksi Ayat 32px Icon-Only: 📌 Tandai Baca, ⭐ Favorit, dan 🔊 Dengar tanpa teks panjang terpotong di layar HP.',
      'Penataan Ulang Card & Button: Penyusunan ulang badge PIN & Ubah PIN, kartu waktu salat ringkas, dan chip tanggal Jadwal 52x60px.',
      'Perbaikan Firestore Rules Permissions: Mengizinkan nama profil 1 karakter dan query list publik review tanpa error permisis.'
    ],
    soundPackUpdates: [
      'Volume murottal dan efek suara UI diselaraskan secara responsif'
    ],
    uiOverhaul: [
      'Pembersihan elemen terpotong pada pil tanggal, tab Al-Qur\'an, dan tab Doa',
      'Integrasi tombol Admin tersamar di bagian paling bawah halaman Pengaturan',
      'Kartu ayat Al-Qur\'an berlatar terang dengan angka ayat Arab melingkar inline'
    ],
    recommendations: [
      'Saran UI/UX: Integrasi fitur Pencarian Ayat & Tafsir Ringkas Kemenag per kata',
      'Saran QoL: Sediakan mode offline PWA countdown widget waktu salat berikutnya',
      'Saran Bugfix/Perbaikan: Sediakan fitur backup/restore data lokal via file JSON terenkripsi'
    ]
  },
  {
    version: '2.3.0',
    releaseDate: '3 November 2026',
    title: 'Permission Gatekeeper Notifikasi, Kalibrasi Volume Audio, Tema Manual & Latar Putih Al-Qur\'an',
    highlights: [
      'Notification Permission Gatekeeper Modal: Permintaan izin notifikasi interaktif sebelum pengguna masuk ke dashboard utama.',
      'Notifikasi Browser Tanpa Install PWA: Pengingat waktu salat dan suara Azan berbunyi otomatis dari web browser biasa.',
      'Kalibrasi Volume Audio UI: Efek suara tombol (tap, toggle, tab switch, dzikir) dikecilkan menjadi lembut (~25% volume) agar nyaman, sementara suara Azan tetap 100% keras.',
      'Latar Putih Khusus Al-Qur\'an: Tampilan pembacaan ayat dan surat Al-Qur\'an selalu berlatar putih bersih dengan teks Arab hitam kontras tinggi agar tidak terpengaruh tema gelap otomatis HP.',
      'Pemisahan Fitur Penanda Ayat: Dua tombol berbeda: "Tandai Terakhir Baca" (1 posisi aktif) dan "Simpan Ayat Favorit" (koleksi banyak ayat).',
      'Sakelar Tema Manual di Pengaturan: Pilihan Mode Terang, Mode Gelap, dan Mode Sistem dengan kontrol terpisah untuk tema Al-Qur\'an.'
    ],
    soundPackUpdates: [
      'Volume suara tombol UI diredam lembut (25% gain) untuk kenyamanan pendengaran',
      'Suara Azan Subuh, Fardhu, dan pengujian alarm tetap 100% lantang'
    ],
    uiOverhaul: [
      'Notification Permission Modal beranimasi Memphis',
      'Tampilan ayat Al-Qur\'an dipastikan berlatar putih bersih dengan kontras huruf Arab maksimal',
      'Aksi dua tombol spesial pada setiap ayat: Tandai Terakhir Baca & Simpan Favorit'
    ],
    recommendations: [
      'Saran #1: Integrasikan fitur pencarian tafsir ringkas Kemenag RI per ayat Al-Qur\'an',
      'Saran #2: Tambahkan statistik durasi tilawah harian dalam grafik mingguan',
      'Saran #3: Buat widget pengingat zikir pagi dan petang otomatis sesuai jam lokal'
    ]
  },
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

