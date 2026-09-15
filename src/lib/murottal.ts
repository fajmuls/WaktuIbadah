import { ReciterOption } from '../types';

export interface SurahMeta {
  number: number;
  name: string;
  arabic: string;
  translation: string;
  verses: number;
  place: 'Mekah' | 'Madinah';
}

export const SURAH_LIST: SurahMeta[] = [
  { number: 1, name: 'Al-Fatihah', arabic: 'الفاتحة', translation: 'Pembukaan', verses: 7, place: 'Mekah' },
  { number: 2, name: 'Al-Baqarah', arabic: 'البقرة', translation: 'Sapi Betina', verses: 286, place: 'Madinah' },
  { number: 3, name: 'Ali \'Imran', arabic: 'آل عمران', translation: 'Keluarga Imran', verses: 200, place: 'Madinah' },
  { number: 4, name: 'An-Nisa\'', arabic: 'النساء', translation: 'Wanita', verses: 176, place: 'Madinah' },
  { number: 5, name: 'Al-Ma\'idah', arabic: 'المائدة', translation: 'Jamuan Hidangan', verses: 120, place: 'Madinah' },
  { number: 6, name: 'Al-An\'am', arabic: 'الأنعام', translation: 'Binatang Ternak', verses: 165, place: 'Mekah' },
  { number: 7, name: 'Al-A\'raf', arabic: 'الأعراف', translation: 'Tempat Tertinggi', verses: 206, place: 'Mekah' },
  { number: 8, name: 'Al-Anfal', arabic: 'الأنفال', translation: 'Rampasan Perang', verses: 75, place: 'Madinah' },
  { number: 9, name: 'At-Taubah', arabic: 'التوبة', translation: 'Pengampunan', verses: 129, place: 'Madinah' },
  { number: 10, name: 'Yunus', arabic: 'يونس', translation: 'Nabi Yunus', verses: 109, place: 'Mekah' },
  { number: 11, name: 'Hud', arabic: 'هود', translation: 'Nabi Hud', verses: 123, place: 'Mekah' },
  { number: 12, name: 'Yusuf', arabic: 'يوسف', translation: 'Nabi Yusuf', verses: 111, place: 'Mekah' },
  { number: 13, name: 'Ar-Ra\'d', arabic: 'الرعد', translation: 'Guruh', verses: 43, place: 'Madinah' },
  { number: 14, name: 'Ibrahim', arabic: 'إبراهيم', translation: 'Nabi Ibrahim', verses: 52, place: 'Mekah' },
  { number: 15, name: 'Al-Hijr', arabic: 'الحجر', translation: 'Gunung Al Hijr', verses: 99, place: 'Mekah' },
  { number: 16, name: 'An-Nahl', arabic: 'النحل', translation: 'Lebah', verses: 128, place: 'Mekah' },
  { number: 17, name: 'Al-Isra\'', arabic: 'الإسراء', translation: 'Perjalanan Malam', verses: 111, place: 'Mekah' },
  { number: 18, name: 'Al-Kahf', arabic: 'الكهف', translation: 'Gua', verses: 110, place: 'Mekah' },
  { number: 19, name: 'Maryam', arabic: 'مريم', translation: 'Siti Maryam', verses: 98, place: 'Mekah' },
  { number: 20, name: 'Ta Ha', arabic: 'طه', translation: 'Ta Ha', verses: 135, place: 'Mekah' },
  { number: 21, name: 'Al-Anbiya\'', arabic: 'الأنبياء', translation: 'Para Nabi', verses: 112, place: 'Mekah' },
  { number: 22, name: 'Al-Hajj', arabic: 'الحج', translation: 'Haji', verses: 78, place: 'Madinah' },
  { number: 23, name: 'Al-Mu\'minun', arabic: 'المؤمنون', translation: 'Orang-Orang Mukmin', verses: 118, place: 'Mekah' },
  { number: 24, name: 'An-Nur', arabic: 'النور', translation: 'Cahaya', verses: 64, place: 'Madinah' },
  { number: 25, name: 'Al-Furqan', arabic: 'الفرقان', translation: 'Pembeda', verses: 77, place: 'Mekah' },
  { number: 26, name: 'Asy-Syu\'ara\'', arabic: 'الشعراء', translation: 'Para Penyair', verses: 227, place: 'Mekah' },
  { number: 27, name: 'An-Naml', arabic: 'النمل', translation: 'Semut', verses: 93, place: 'Mekah' },
  { number: 28, name: 'Al-Qasas', arabic: 'القصص', translation: 'Cerita-Cerita', verses: 88, place: 'Mekah' },
  { number: 29, name: 'Al-\'Ankabut', arabic: 'العنكبوت', translation: 'Laba-Laba', verses: 69, place: 'Mekah' },
  { number: 30, name: 'Ar-Rum', arabic: 'الروم', translation: 'Bangsa Romawi', verses: 60, place: 'Mekah' },
  { number: 31, name: 'Luqman', arabic: 'لقمان', translation: 'Keluarga Luqman', verses: 34, place: 'Mekah' },
  { number: 32, name: 'As-Sajdah', arabic: 'السجدة', translation: 'Sujud', verses: 30, place: 'Mekah' },
  { number: 33, name: 'Al-Ahzab', arabic: 'الأحزاب', translation: 'Golongan yang Bersekutu', verses: 73, place: 'Madinah' },
  { number: 34, name: 'Saba\'', arabic: 'سبأ', translation: 'Kaum Saba\'', verses: 54, place: 'Mekah' },
  { number: 35, name: 'Fatir', arabic: 'فاطر', translation: 'Pencipta', verses: 45, place: 'Mekah' },
  { number: 36, name: 'Ya Sin', arabic: 'يس', translation: 'Ya Sin', verses: 83, place: 'Mekah' },
  { number: 37, name: 'As-Saffat', arabic: 'الصافات', translation: 'Barisan-Barisan', verses: 182, place: 'Mekah' },
  { number: 38, name: 'Sad', arabic: 'ص', translation: 'Sad', verses: 88, place: 'Mekah' },
  { number: 39, name: 'Az-Zumar', arabic: 'الزمر', translation: 'Rombongan-Rombongan', verses: 75, place: 'Mekah' },
  { number: 40, name: 'Ghafir', arabic: 'غافر', translation: 'Maha Pengampun', verses: 85, place: 'Mekah' },
  { number: 41, name: 'Fussilat', arabic: 'فصلت', translation: 'Yang Dijelaskan', verses: 54, place: 'Mekah' },
  { number: 42, name: 'Asy-Syura', arabic: 'الشورى', translation: 'Musyawarah', verses: 53, place: 'Mekah' },
  { number: 43, name: 'Az-Zukhruf', arabic: 'الزخرف', translation: 'Perhiasan', verses: 89, place: 'Mekah' },
  { number: 44, name: 'Ad-Dukhan', arabic: 'الدخان', translation: 'Kabut', verses: 59, place: 'Mekah' },
  { number: 45, name: 'Al-Jasiyah', arabic: 'الجاثية', translation: 'Yang Berlutut', verses: 37, place: 'Mekah' },
  { number: 46, name: 'Al-Ahqaf', arabic: 'الأحقاف', translation: 'Bukit Pasir', verses: 35, place: 'Mekah' },
  { number: 47, name: 'Muhammad', arabic: 'محمد', translation: 'Nabi Muhammad', verses: 38, place: 'Madinah' },
  { number: 48, name: 'Al-Fath', arabic: 'الفتح', translation: 'Kemenangan', verses: 29, place: 'Madinah' },
  { number: 49, name: 'Al-Hujurat', arabic: 'الحجرات', translation: 'Kamar-Kamar', verses: 18, place: 'Madinah' },
  { number: 50, name: 'Qaf', arabic: 'ق', translation: 'Qaf', verses: 45, place: 'Mekah' },
  { number: 51, name: 'Az-Zariyat', arabic: 'الذاريات', translation: 'Angin yang Menerbangkan', verses: 60, place: 'Mekah' },
  { number: 52, name: 'At-Tur', arabic: 'الطور', translation: 'Bukit Tur', verses: 49, place: 'Mekah' },
  { number: 53, name: 'An-Najm', arabic: 'النجم', translation: 'Bintang', verses: 62, place: 'Mekah' },
  { number: 54, name: 'Al-Qamar', arabic: 'القمر', translation: 'Bulan', verses: 55, place: 'Mekah' },
  { number: 55, name: 'Ar-Rahman', arabic: 'الرحمن', translation: 'Maha Pemurah', verses: 78, place: 'Madinah' },
  { number: 56, name: 'Al-Waqi\'ah', arabic: 'الواقعة', translation: 'Hari Kiamat', verses: 96, place: 'Mekah' },
  { number: 57, name: 'Al-Hadid', arabic: 'الحديد', translation: 'Besi', verses: 29, place: 'Madinah' },
  { number: 58, name: 'Al-Mujadilah', arabic: 'المجادلة', translation: 'Gugatan', verses: 22, place: 'Madinah' },
  { number: 59, name: 'Al-Hasyr', arabic: 'الحشر', translation: 'Pengusiran', verses: 24, place: 'Madinah' },
  { number: 60, name: 'Al-Mumtahanah', arabic: 'الممتحنة', translation: 'Wanita yang Diuji', verses: 13, place: 'Madinah' },
  { number: 61, name: 'As-Saff', arabic: 'الصف', translation: 'Barisan', verses: 14, place: 'Madinah' },
  { number: 62, name: 'Al-Jumu\'ah', arabic: 'الجمعة', translation: 'Hari Jum\'at', verses: 11, place: 'Madinah' },
  { number: 63, name: 'Al-Munafiqun', arabic: 'المنافقون', translation: 'Orang Munafik', verses: 11, place: 'Madinah' },
  { number: 64, name: 'At-Taghabun', arabic: 'التغابن', translation: 'Hari Dinampakkan Kesalahan', verses: 18, place: 'Madinah' },
  { number: 65, name: 'At-Talaq', arabic: 'الطلاق', translation: 'Talak', verses: 12, place: 'Madinah' },
  { number: 66, name: 'At-Tahrim', arabic: 'التحريم', translation: 'Pengharaman', verses: 12, place: 'Madinah' },
  { number: 67, name: 'Al-Mulk', arabic: 'الملك', translation: 'Kerajaan', verses: 30, place: 'Mekah' },
  { number: 68, name: 'Al-Qalam', arabic: 'القلم', translation: 'Pena', verses: 52, place: 'Mekah' },
  { number: 69, name: 'Al-Haqqah', arabic: 'الحاقة', translation: 'Hari Kiamat', verses: 52, place: 'Mekah' },
  { number: 70, name: 'Al-Ma\'arij', arabic: 'المعارج', translation: 'Tempat Naik', verses: 44, place: 'Mekah' },
  { number: 71, name: 'Nuh', arabic: 'نوح', translation: 'Nabi Nuh', verses: 28, place: 'Mekah' },
  { number: 72, name: 'Al-Jinn', arabic: 'الجن', translation: 'Jin', verses: 28, place: 'Mekah' },
  { number: 73, name: 'Al-Muzzammil', arabic: 'المزمل', translation: 'Orang yang Berselimut', verses: 20, place: 'Mekah' },
  { number: 74, name: 'Al-Muddassir', arabic: 'المدثر', translation: 'Orang yang Berkemul', verses: 56, place: 'Mekah' },
  { number: 75, name: 'Al-Qiyamah', arabic: 'القيامة', translation: 'Hari Kiamat', verses: 40, place: 'Mekah' },
  { number: 76, name: 'Al-Insan', arabic: 'الإنسان', translation: 'Manusia', verses: 31, place: 'Madinah' },
  { number: 77, name: 'Al-Mursalat', arabic: 'المرسلات', translation: 'Malaikat yang Diutus', verses: 50, place: 'Mekah' },
  { number: 78, name: 'An-Naba\'', arabic: 'النبأ', translation: 'Berita Besar', verses: 40, place: 'Mekah' },
  { number: 79, name: 'An-Nazi\'at', arabic: 'النازعات', translation: 'Malaikat yang Mencabut', verses: 46, place: 'Mekah' },
  { number: 80, name: '\'Abasa', arabic: 'عبس', translation: 'Bermuka Masam', verses: 42, place: 'Mekah' },
  { number: 81, name: 'At-Takwir', arabic: 'التكوير', translation: 'Menggulung', verses: 29, place: 'Mekah' },
  { number: 82, name: 'Al-Infitar', arabic: 'الانفطار', translation: 'Terbelah', verses: 19, place: 'Mekah' },
  { number: 83, name: 'Al-Mutaffifin', arabic: 'المطففين', translation: 'Orang-Orang Curang', verses: 36, place: 'Mekah' },
  { number: 84, name: 'Al-Insyiqaq', arabic: 'الانشقاق', translation: 'Terbelah', verses: 25, place: 'Mekah' },
  { number: 85, name: 'Al-Buruj', arabic: 'البروج', translation: 'Gugusan Bintang', verses: 22, place: 'Mekah' },
  { number: 86, name: 'At-Tariq', arabic: 'الطارق', translation: 'Yang Datang di Malam Hari', verses: 17, place: 'Mekah' },
  { number: 87, name: 'Al-A\'la', arabic: 'الأعلى', translation: 'Yang Paling Tinggi', verses: 19, place: 'Mekah' },
  { number: 88, name: 'Al-Ghasyiyah', arabic: 'الغاشية', translation: 'Hari Pembalasan', verses: 26, place: 'Mekah' },
  { number: 89, name: 'Al-Fajr', arabic: 'الفجر', translation: 'Fajar', verses: 30, place: 'Mekah' },
  { number: 90, name: 'Al-Balad', arabic: 'البلد', translation: 'Negeri', verses: 20, place: 'Mekah' },
  { number: 91, name: 'Asy-Syams', arabic: 'الشمس', translation: 'Matahari', verses: 15, place: 'Mekah' },
  { number: 92, name: 'Al-Lail', arabic: 'الليل', translation: 'Malam', verses: 21, place: 'Mekah' },
  { number: 93, name: 'Ad-Duha', arabic: 'الضحى', translation: 'Waktu Dhuha', verses: 11, place: 'Mekah' },
  { number: 94, name: 'Al-Insyirah', arabic: 'الشرح', translation: 'Kelapangan', verses: 8, place: 'Mekah' },
  { number: 95, name: 'At-Tin', arabic: 'التين', translation: 'Buah Tin', verses: 8, place: 'Mekah' },
  { number: 96, name: 'Al-\'Alaq', arabic: 'العلق', translation: 'Segumpal Darah', verses: 19, place: 'Mekah' },
  { number: 97, name: 'Al-Qadr', arabic: 'القدر', translation: 'Kemuliaan', verses: 5, place: 'Mekah' },
  { number: 98, name: 'Al-Bayyinah', arabic: 'البينة', translation: 'Bukti Nyata', verses: 8, place: 'Madinah' },
  { number: 99, name: 'Az-Zalzalah', arabic: 'الزلزلة', translation: 'Kegoncangan', verses: 8, place: 'Madinah' },
  { number: 100, name: 'Al-\'Adiyat', arabic: 'العاديات', translation: 'Kuda yang Berlari Kencang', verses: 11, place: 'Mekah' },
  { number: 101, name: 'Al-Qari\'ah', arabic: 'القارعة', translation: 'Hari Kiamat', verses: 11, place: 'Mekah' },
  { number: 102, name: 'At-Takasur', arabic: 'التكاثر', translation: 'Bermegah-Megahan', verses: 8, place: 'Mekah' },
  { number: 103, name: 'Al-\'Asr', arabic: 'العصر', translation: 'Masa / Waktu', verses: 3, place: 'Mekah' },
  { number: 104, name: 'Al-Humazah', arabic: 'الهمزة', translation: 'Pengumpat', verses: 9, place: 'Mekah' },
  { number: 105, name: 'Al-Fil', arabic: 'الفيل', translation: 'Gajah', verses: 5, place: 'Mekah' },
  { number: 106, name: 'Quraisy', arabic: 'قريش', translation: 'Suku Quraisy', verses: 4, place: 'Mekah' },
  { number: 107, name: 'Al-Ma\'un', arabic: 'الماعون', translation: 'Barang-Barang yang Berguna', verses: 7, place: 'Mekah' },
  { number: 108, name: 'Al-Kausar', arabic: 'الكوثر', translation: 'Nikmat yang Berlimpah', verses: 3, place: 'Mekah' },
  { number: 109, name: 'Al-Kafirun', arabic: 'الكافرون', translation: 'Orang-Orang Kafir', verses: 6, place: 'Mekah' },
  { number: 110, name: 'An-Nasr', arabic: 'النصر', translation: 'Pertolongan', verses: 3, place: 'Madinah' },
  { number: 111, name: 'Al-Lahab', arabic: 'المسد', translation: 'Gejolak Api', verses: 5, place: 'Mekah' },
  { number: 112, name: 'Al-Ikhlas', arabic: 'الإخلاص', translation: 'Ikhlas', verses: 4, place: 'Mekah' },
  { number: 113, name: 'Al-Falaq', arabic: 'الفلق', translation: 'Waktu Subuh', verses: 5, place: 'Mekah' },
  { number: 114, name: 'An-Nas', arabic: 'الناس', translation: 'Manusia', verses: 6, place: 'Mekah' }
];

export const RECITERS: ReciterOption[] = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', arabicName: 'مشاري راشد العفاسي', style: 'Tartil Merdu' },
  { id: 'ar.abdurrahmaansudais', name: 'Abdurrahman As-Sudais', arabicName: 'عبد الرحمن السديس', style: 'Imam Masjidil Haram' },
  { id: 'ar.mahermuaiqly', name: 'Maher Al-Muaiqly', arabicName: 'ماهر المعيقلي', style: 'Khusyuk & Tenang' },
  { id: 'ar.saadalghamidi', name: 'Saad Al-Ghamidi', arabicName: 'سعد الغامدي', style: 'Tartil Lembut' },
  { id: 'ar.abdullahbasfar', name: 'Abdullah Basfar', arabicName: 'عبد الله بصفر', style: 'Tartil Jelas Tajwid' }
];

export function getAudioUrlForSurah(surahNumber: number, reciterId: string = 'ar.alafasy'): string {
  // Islamic Network High Speed Audio CDN
  return `https://cdn.islamic.network/quran/audio-surah/128/${reciterId}/${surahNumber}.mp3`;
}

// Global Audio Singleton Controller for continuous background playback & sleep timer
class MurottalController {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<() => void> = new Set();
  
  public surahNumber: number = 1;
  public reciterId: string = 'ar.alafasy';
  public isPlaying: boolean = false;
  public currentTime: number = 0;
  public duration: number = 0;
  public autoplayNext: boolean = true;
  public isLoopCurrent: boolean = false;
  
  // Sleep Timer
  public sleepTimerSecondsRemaining: number | null = null;
  public sleepTimerMode: 'none' | '15' | '30' | '45' | '60' | 'surah_end' | 'custom' = 'none';
  private timerInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.setupAudioListeners();
      this.setupMediaSession();
    }
  }

  private setupAudioListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notify();
      this.updateMediaSessionState();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notify();
      this.updateMediaSessionState();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.currentTime = this.audio.currentTime;
        this.duration = this.audio.duration || 0;
        this.notify();
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio) {
        this.duration = this.audio.duration || 0;
        this.notify();
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.sleepTimerMode === 'surah_end') {
        this.stopSleepTimer();
        this.pause();
        return;
      }

      if (this.isLoopCurrent) {
        if (this.audio) {
          this.audio.currentTime = 0;
          this.audio.play().catch(console.warn);
        }
      } else if (this.autoplayNext) {
        this.playNextSurah();
      } else {
        this.isPlaying = false;
        this.notify();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn("Murottal Audio error, trying fallback:", e);
      // Fallback url
      if (this.audio && this.audio.src.includes('islamic.network')) {
        const padded = String(this.surahNumber).padStart(3, '0');
        this.audio.src = `https://server8.mp3quran.net/afs/${padded}.mp3`;
        this.audio.play().catch(console.warn);
      }
    });
  }

  private setupMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.playPreviousSurah());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.playNextSurah());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime && this.audio) {
          this.audio.currentTime = details.seekTime;
        }
      });
    }
  }

  private updateMediaSessionMetadata() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      const surah = SURAH_LIST.find(s => s.number === this.surahNumber) || SURAH_LIST[0];
      const reciter = RECITERS.find(r => r.id === this.reciterId) || RECITERS[0];
      
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `QS. ${surah.number}. ${surah.name} (${surah.arabic})`,
        artist: `${reciter.name} • ${surah.verses} Ayat`,
        album: 'Murottal WaktuIbadah',
        artwork: [
          { src: 'https://files.catbox.moe/3b6dqo.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    }
  }

  private updateMediaSessionState() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = this.isPlaying ? 'playing' : 'paused';
    }
  }

  public setSurah(surahNumber: number, autoPlay: boolean = true) {
    if (surahNumber < 1) surahNumber = 1;
    if (surahNumber > 114) surahNumber = 114;
    this.surahNumber = surahNumber;

    const url = getAudioUrlForSurah(surahNumber, this.reciterId);
    if (this.audio) {
      this.audio.src = url;
      this.audio.load();
      this.updateMediaSessionMetadata();
      if (autoPlay) {
        this.audio.play().catch(err => {
          console.warn("Audio autoplay blocked:", err);
          this.isPlaying = false;
          this.notify();
        });
      }
    }
    this.notify();
  }

  public setReciter(reciterId: string) {
    this.reciterId = reciterId;
    const wasPlaying = this.isPlaying;
    const currentPos = this.currentTime;
    const url = getAudioUrlForSurah(this.surahNumber, reciterId);
    if (this.audio) {
      this.audio.src = url;
      this.audio.load();
      this.updateMediaSessionMetadata();
      if (wasPlaying) {
        this.audio.play().then(() => {
          if (this.audio && currentPos > 0) {
            this.audio.currentTime = currentPos;
          }
        }).catch(console.warn);
      }
    }
    this.notify();
  }

  public play() {
    if (!this.audio) return;
    if (!this.audio.src) {
      this.setSurah(this.surahNumber, true);
      return;
    }
    this.audio.play().catch(console.warn);
    this.updateMediaSessionMetadata();
  }

  public pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number) {
    if (this.audio) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.duration));
    }
  }

  public playNextSurah() {
    const next = this.surahNumber >= 114 ? 1 : this.surahNumber + 1;
    this.setSurah(next, true);
  }

  public playPreviousSurah() {
    // If more than 3 seconds in, restart current surah; else go to prev
    if (this.currentTime > 3) {
      this.seek(0);
      return;
    }
    const prev = this.surahNumber <= 1 ? 114 : this.surahNumber - 1;
    this.setSurah(prev, true);
  }

  // --- Sleep Timer Methods ---
  public setSleepTimer(mode: 'none' | '15' | '30' | '45' | '60' | 'surah_end' | 'custom', customMinutes?: number) {
    this.stopSleepTimer();
    this.sleepTimerMode = mode;

    if (mode === 'none') {
      this.sleepTimerSecondsRemaining = null;
      this.notify();
      return;
    }

    if (mode === 'surah_end') {
      this.sleepTimerSecondsRemaining = null;
      this.notify();
      return;
    }

    let minutes = 15;
    if (mode === '15') minutes = 15;
    if (mode === '30') minutes = 30;
    if (mode === '45') minutes = 45;
    if (mode === '60') minutes = 60;
    if (mode === 'custom' && customMinutes) minutes = customMinutes;

    this.sleepTimerSecondsRemaining = minutes * 60;
    this.notify();

    this.timerInterval = setInterval(() => {
      if (this.sleepTimerSecondsRemaining !== null && this.sleepTimerSecondsRemaining > 0) {
        this.sleepTimerSecondsRemaining -= 1;
        this.notify();

        if (this.sleepTimerSecondsRemaining <= 0) {
          this.triggerSleepTimerFinished();
        }
      }
    }, 1000);
  }

  public stopSleepTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.sleepTimerSecondsRemaining = null;
    this.sleepTimerMode = 'none';
    this.notify();
  }

  private triggerSleepTimerFinished() {
    this.stopSleepTimer();
    // Smooth volume fade out
    if (this.audio) {
      let currentVol = this.audio.volume;
      const fadeInterval = setInterval(() => {
        if (!this.audio) {
          clearInterval(fadeInterval);
          return;
        }
        if (currentVol > 0.1) {
          currentVol -= 0.1;
          this.audio.volume = Math.max(0, currentVol);
        } else {
          clearInterval(fadeInterval);
          this.audio.pause();
          this.audio.volume = 1;
          this.isPlaying = false;
          this.notify();
        }
      }, 150);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb());
  }

  public getSurahMeta(): SurahMeta {
    return SURAH_LIST.find(s => s.number === this.surahNumber) || SURAH_LIST[0];
  }

  public getReciterMeta(): ReciterOption {
    return RECITERS.find(r => r.id === this.reciterId) || RECITERS[0];
  }
}

export const murottalPlayer = new MurottalController();
