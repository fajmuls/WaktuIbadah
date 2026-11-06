import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BookOpen, Search, Play, Pause, Volume2, Bookmark, Check, Copy, 
  ChevronRight, X, Sparkles, Heart, Download, CheckCircle2,
  Trash2, ExternalLink, Share2, Compass, Headphones, Moon,
  Quote, Tag, Eye, Maximize2, Minimize2, FileText, Layers
} from 'lucide-react';
import { SurahItem, AyatItem, HadithArbain, FavoriteAyah, FavoriteHadith } from '../types';
import { storage } from '../lib/storage';
import { vibrateSuccess, playQuranSound } from '../lib/audio';
import { murottalPlayer } from '../lib/murottal';
import { QuranLogModal } from '../components/QuranLogModal';
import { KhatamCalculatorModal } from '../components/KhatamCalculatorModal';
import { TadabburBookmarkModal } from '../components/TadabburBookmarkModal';
import { getSurahAyahs, getSurahTafsir } from '../lib/quran-api';
import { getCachedAudioUrl } from '../lib/murottal-cache';

// Helper to convert western digits to authentic Arabic numerals (١, ٢, ٣...)
export const toArabicNumerals = (num: number | string): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicDigits[parseInt(d, 10)] || d).join('');
};

export default function QuranHadis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'quran' | 'hadis' | 'favorit' | 'doa') || 'quran';
  const [activeTab, setActiveTab] = useState<'quran' | 'hadis' | 'favorit' | 'doa'>(initialTab);
  const [isKhatamModalOpen, setIsKhatamModalOpen] = useState(false);

  const handleTabChange = (tab: 'quran' | 'hadis' | 'favorit' | 'doa') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // --- QURAN STATE ---
  const [surahs, setSurahs] = useState<SurahItem[]>([]);
  const [isLoadingSurahs, setIsLoadingSurahs] = useState(true);
  const [quranSearch, setQuranSearch] = useState('');
  const [selectedSurah, setSelectedSurah] = useState<SurahItem | null>(null);
  const [ayahs, setAyahs] = useState<AyatItem[]>([]);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [offlineSurahsMap, setOfflineSurahsMap] = useState<Record<string, any>>(storage.getOfflineSurahs());
  
  // Last read position
  const [lastReadMarker, setLastReadMarker] = useState<{ surahNumber: number; surahName: string; ayahNumber: number; date: string } | null>(() => storage.getLastReadAyah());
  const [lastReadSurah, setLastReadSurah] = useState<{ number: number; name: string; lastAyah?: number } | null>(() => {
    try {
      const saved = localStorage.getItem('wi_last_read');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Font size, visibility & mode controls
  const [quranFontSize, setQuranFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('wi_quran_font_size');
    return saved ? Number(saved) : 26;
  });
  const [readingMode, setReadingMode] = useState<'card' | 'mushaf'>(() => {
    const saved = localStorage.getItem('wi_quran_reading_mode');
    return (saved as 'card' | 'mushaf') || 'card';
  });
  const [showArabic, setShowArabic] = useState<boolean>(() => {
    const saved = localStorage.getItem('wi_quran_show_arabic');
    return saved !== null ? saved === 'true' : true;
  });
  const [showLatin, setShowLatin] = useState<boolean>(() => {
    const saved = localStorage.getItem('wi_quran_show_latin');
    return saved !== null ? saved === 'true' : true;
  });
  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    const saved = localStorage.getItem('wi_quran_show_translation');
    return saved !== null ? saved === 'true' : true;
  });
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showReaderMenu, setShowReaderMenu] = useState(false);

  // Tafsir Bottom Sheet Drawer State
  const [tafsirMap, setTafsirMap] = useState<Record<number, string>>({});
  const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
  const [selectedTafsir, setSelectedTafsir] = useState<{ surah: SurahItem; ayah: AyatItem; tafsirText: string } | null>(null);

  const toggleReadingMode = (mode: 'card' | 'mushaf') => {
    setReadingMode(mode);
    localStorage.setItem('wi_quran_reading_mode', mode);
  };

  const toggleShowArabic = () => {
    const next = !showArabic;
    setShowArabic(next);
    localStorage.setItem('wi_quran_show_arabic', String(next));
  };

  const changeFontSize = (delta: number) => {
    const next = Math.min(34, Math.max(22, quranFontSize + delta));
    setQuranFontSize(next);
    localStorage.setItem('wi_quran_font_size', String(next));
  };

  const toggleShowLatin = () => {
    const next = !showLatin;
    setShowLatin(next);
    localStorage.setItem('wi_quran_show_latin', String(next));
  };

  const toggleShowTranslation = () => {
    const next = !showTranslation;
    setShowTranslation(next);
    localStorage.setItem('wi_quran_show_translation', String(next));
  };

  const handleOpenTafsir = async (surah: SurahItem, ayah: AyatItem) => {
    setIsLoadingTafsir(true);
    let currentTafsirMap = tafsirMap;
    if (Object.keys(currentTafsirMap).length === 0) {
      currentTafsirMap = await getSurahTafsir(surah.nomor);
      setTafsirMap(currentTafsirMap);
    }
    const text = currentTafsirMap[ayah.nomorAyat] || 'Penjelasan tafsir ringkas Kemenag RI untuk ayat ini sedang diproses atau tidak tersedia.';
    setSelectedTafsir({ surah, ayah, tafsirText: text });
    setIsLoadingTafsir(false);
  };

  // Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalProps, setLogModalProps] = useState<{
    surahNumber: number;
    surahName: string;
    totalAyah: number;
    startAyah: number;
    endAyah: number;
  }>({
    surahNumber: 1,
    surahName: 'Al-Fatihah',
    totalAyah: 7,
    startAyah: 1,
    endAyah: 7
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- HADIS STATE ---
  const [hadiths, setHadiths] = useState<HadithArbain[]>([]);
  const [isLoadingHadiths, setIsLoadingHadiths] = useState(true);
  const [hadisSearch, setHadisSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- FAVORITES & TADABBUR STATE ---
  const [favoriteAyahs, setFavoriteAyahs] = useState<FavoriteAyah[]>(storage.getFavoriteAyahs());
  const [favoriteHadiths, setFavoriteHadiths] = useState<FavoriteHadith[]>(storage.getFavoriteHadiths());
  const [favSubTab, setFavSubTab] = useState<'ayah' | 'hadith'>('ayah');
  const [favCategoryFilter, setFavCategoryFilter] = useState<string>('Semua');
  const [bookmarkModalTarget, setBookmarkModalTarget] = useState<{ surah: SurahItem; ayah: AyatItem } | null>(null);

  // --- DOA STATE ---
  const [doas, setDoas] = useState<Array<{ id: string; doa: string; ayat: string; latin: string; artinya: string }>>([]);
  const [isLoadingDoas, setIsLoadingDoas] = useState(false);
  const [doaSearch, setDoaSearch] = useState('');

  // 1. Fetch Surah List
  useEffect(() => {
    let isMounted = true;
    const fetchSurahs = async () => {
      try {
        const res = await fetch('https://equran.id/api/v2/surat');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.data) {
            setSurahs(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load surah list:", err);
      } finally {
        if (isMounted) setIsLoadingSurahs(false);
      }
    };
    fetchSurahs();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Hadits Arbain from MyQuran API
  useEffect(() => {
    let isMounted = true;
    const fetchArbain = async () => {
      try {
        const res = await fetch('https://api.myquran.com/v2/hadits/arbain/semua');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.status && Array.isArray(json.data)) {
            setHadiths(json.data);
          }
        }
      } catch (err) {
        console.error("Failed to load MyQuran Arbain hadiths:", err);
      } finally {
        if (isMounted) setIsLoadingHadiths(false);
      }
    };
    fetchArbain();
    return () => { isMounted = false; };
  }, []);

  // 3. Fetch Doa Kemenag from MyQuran API when Doa tab clicked
  useEffect(() => {
    if (activeTab === 'doa' && doas.length === 0) {
      setIsLoadingDoas(true);
      fetch('https://api.myquran.com/v2/doa/semua')
        .then(res => res.json())
        .then(json => {
          if (json.status && Array.isArray(json.data)) {
            setDoas(json.data);
          }
        })
        .catch(err => console.warn("Error fetching doas:", err))
        .finally(() => setIsLoadingDoas(false));
    }
  }, [activeTab]);

  // Open Surah Detail with resilient multi-tier fallback
  const openSurah = async (surah: SurahItem, targetAyah?: number) => {
    playQuranSound('open');
    setSelectedSurah(surah);
    setIsLoadingAyahs(true);
    setAyahs([]);
    setTafsirMap({});

    try {
      const result = await getSurahAyahs(surah.nomor);
      if (result.success && result.ayahs.length > 0) {
        setAyahs(result.ayahs);
      } else {
        console.warn(`Could not load ayahs for surah ${surah.nomor}`);
      }
    } catch (err) {
      console.error("Failed to fetch surah detail:", err);
    } finally {
      setIsLoadingAyahs(false);
    }

    // Save last read
    const record = { number: surah.nomor, name: surah.namaLatin, lastAyah: targetAyah || 1 };
    setLastReadSurah(record);
    localStorage.setItem('wi_last_read', JSON.stringify(record));
  };

  // Auto-scroll to target ayah on load
  useEffect(() => {
    if (selectedSurah && ayahs.length > 0 && lastReadSurah?.lastAyah) {
      const el = document.getElementById(`ayah-${lastReadSurah.lastAyah}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
      }
    }
  }, [selectedSurah, ayahs]);

  // Toggle Offline Storage for a Surah
  const handleToggleOfflineSurah = async (surah: SurahItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSaved = storage.isSurahOffline(surah.nomor);

    if (isSaved) {
      storage.removeOfflineSurah(surah.nomor);
      setOfflineSurahsMap(storage.getOfflineSurahs());
      vibrateSuccess();
    } else {
      // If ayahs are already loaded in current view:
      if (selectedSurah?.nomor === surah.nomor && ayahs.length > 0) {
        storage.saveOfflineSurah(surah, ayahs);
        setOfflineSurahsMap(storage.getOfflineSurahs());
        vibrateSuccess();
      } else {
        // Fetch and save via resilient loader
        try {
          const result = await getSurahAyahs(surah.nomor);
          if (result.success && result.ayahs.length > 0) {
            storage.saveOfflineSurah(surah, result.ayahs);
            setOfflineSurahsMap(storage.getOfflineSurahs());
            vibrateSuccess();
          }
        } catch (err) {
          console.error("Failed to download surah for offline:", err);
        }
      }
    }
  };

  // Toggle Favorite Ayah
  const handleToggleFavoriteAyah = (ayah: AyatItem) => {
    if (!selectedSurah) return;
    const ayahId = `${selectedSurah.nomor}:${ayah.nomorAyat}`;
    const isFav = storage.isAyahFavorite(ayahId);

    if (isFav) {
      playQuranSound('bookmark_removed');
      storage.removeFavoriteAyah(ayahId);
    } else {
      playQuranSound('bookmark_saved');
      storage.addFavoriteAyah({
        id: ayahId,
        surahNumber: selectedSurah.nomor,
        surahName: selectedSurah.namaLatin,
        ayahNumber: ayah.nomorAyat,
        arab: ayah.teksArab,
        latin: ayah.teksLatin,
        translation: ayah.teksIndonesia,
        addedAt: new Date().toISOString()
      });
      vibrateSuccess();
    }
    setFavoriteAyahs(storage.getFavoriteAyahs());
  };

  // Toggle Favorite Hadith
  const handleToggleFavoriteHadith = (hadith: HadithArbain) => {
    const isFav = storage.isHadithFavorite(hadith.no);
    if (isFav) {
      storage.removeFavoriteHadith(hadith.no);
    } else {
      storage.addFavoriteHadith({
        id: hadith.no,
        no: hadith.no,
        judul: hadith.judul,
        arab: hadith.arab,
        indo: hadith.indo,
        addedAt: new Date().toISOString()
      });
      vibrateSuccess();
    }
    setFavoriteHadiths(storage.getFavoriteHadiths());
  };

  // Quick last read marker
  const handleMarkAyahRead = (ayahNumber: number) => {
    if (!selectedSurah) return;
    const data = {
      surahNumber: selectedSurah.nomor,
      surahName: selectedSurah.namaLatin,
      ayahNumber: ayahNumber,
      date: new Date().toISOString()
    };
    storage.setLastReadAyah(data);
    setLastReadMarker(data);
    playQuranSound('bookmark_saved');
    vibrateSuccess();
  };

  // Audio Handler with IndexedDB caching
  const toggleAudio = async (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const cachedUrl = await getCachedAudioUrl(audioUrl);
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      audio.play().catch(e => console.warn("Audio play blocked", e));
      setPlayingAudio(audioUrl);
      audio.onended = () => setPlayingAudio(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Copy Hadith Text
  const handleCopyHadith = (h: HadithArbain | FavoriteHadith) => {
    const text = `Hadits Arba'in No. ${h.no}: ${h.judul}\n\n${h.arab}\n\nArtinya:\n"${h.indo}"\n\n(Dikutip dari WaktuIbadah - API MyQuran)`;
    navigator.clipboard.writeText(text);
    setCopiedId(h.no);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Lists
  const filteredSurahs = useMemo(() => {
    if (!quranSearch.trim()) return surahs;
    const query = quranSearch.toLowerCase();
    return surahs.filter(s => 
      s.namaLatin.toLowerCase().includes(query) ||
      s.arti.toLowerCase().includes(query) ||
      s.nomor.toString() === query
    );
  }, [surahs, quranSearch]);

  const filteredHadiths = useMemo(() => {
    if (!hadisSearch.trim()) return hadiths;
    const query = hadisSearch.toLowerCase();
    return hadiths.filter(h => 
      h.judul.toLowerCase().includes(query) ||
      h.indo.toLowerCase().includes(query) ||
      h.no.toString() === query
    );
  }, [hadiths, hadisSearch]);

  const filteredDoas = useMemo(() => {
    if (!doaSearch.trim()) return doas;
    const query = doaSearch.toLowerCase();
    return doas.filter(d =>
      d.doa.toLowerCase().includes(query) ||
      d.artinya.toLowerCase().includes(query)
    );
  }, [doas, doaSearch]);

  // Frequently read surahs shortcuts
  const popularSurahs = [
    { no: 36, name: 'Yasin' },
    { no: 18, name: 'Al-Kahf' },
    { no: 67, name: 'Al-Mulk' },
    { no: 56, name: 'Al-Waqi\'ah' },
    { no: 112, name: 'Al-Ikhlas' },
  ];

  return (
    <div className="space-y-3 pb-20 animate-in fade-in duration-300 w-full max-w-full">
      {/* Header ringkas */}
      <header className="memphis-card p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-[#121212] leading-tight">Al-Qur'an & Hadis</h1>
            <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">Baca, dengarkan murottal, dan simpan offline</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsKhatamModalOpen(true)}
              className="memphis-btn memphis-btn-white h-8 px-2.5 text-[11px] gap-1 whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>Khatam</span>
            </button>
            <button
              onClick={() => {
                murottalPlayer.togglePlay();
                vibrateSuccess();
              }}
              className="memphis-btn memphis-btn-green h-8 px-2.5 text-[11px] gap-1 whitespace-nowrap"
            >
              <Headphones className="w-3 h-3" />
              <span>Murottal</span>
            </button>
          </div>
        </div>

        {/* Tab (4 kolom sama lebar, tidak terpotong) */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl border-[1.5px] border-black bg-[#FFFDF8]" role="tablist" aria-label="Bagian Al-Qur'an">
          <button
            role="tab"
            aria-selected={activeTab === 'quran'}
            onClick={() => handleTabChange('quran')}
            className={`h-8 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 min-w-0 px-1 ${
              activeTab === 'quran' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="truncate">Al-Qur'an</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'hadis'}
            onClick={() => handleTabChange('hadis')}
            className={`h-8 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 min-w-0 px-1 ${
              activeTab === 'hadis' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="truncate">Hadits</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'favorit'}
            onClick={() => handleTabChange('favorit')}
            className={`h-8 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 min-w-0 px-1 ${
              activeTab === 'favorit' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            <Heart className="w-3 h-3 text-red-500 fill-red-500 shrink-0" /><span className="truncate">Tersimpan</span>{(favoriteAyahs.length + favoriteHadiths.length) > 0 && <span className="text-[10px] opacity-80">({favoriteAyahs.length + favoriteHadiths.length})</span>}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'doa'}
            onClick={() => handleTabChange('doa')}
            className={`h-8 rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 min-w-0 px-1 ${
              activeTab === 'doa' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-black'
            }`}
          >
            <span className="truncate">Doa</span>
          </button>
        </div>
      </header>

      {/* ======================= TAB 1: AL-QUR'AN ======================= */}
      {activeTab === 'quran' && (
        <div className="space-y-3.5">
          {/* Quick Target Khatam Banner */}
          {(() => {
            const target = storage.getKhatamTarget();
            if (!target) return null;
            const relevantLogs = storage.getQuranLogs().filter(q => q.date >= target.startDate);
            const totalRead = relevantLogs.reduce((acc, q) => acc + (q.totalAyat || 0), 0);
            const pct = Math.min(100, Math.round((totalRead / 6236) * 100));
            return (
              <div className="memphis-card p-3 sm:p-3.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 border-[1.5px] border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-[2px_2px_0px_#121212]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-black text-[#6EE7B7] rounded-xl border border-black flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-black tracking-tight">
                        {target.title}
                      </span>
                      <span className="memphis-badge bg-black text-white text-[9px]">
                        {pct}%
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] font-bold text-black/80 mt-0.5">
                      Sudah dibaca <strong>{totalRead}</strong> dari 6.236 Ayat (~{(totalRead / 208).toFixed(1)} Juz)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsKhatamModalOpen(true)}
                  className="memphis-btn memphis-btn-white px-3 py-1 text-xs font-bold self-start sm:self-auto"
                >
                  Hitungan Target
                </button>
              </div>
            );
          })()}

          {/* Last Read & Quick Surah Banner (Compact Mobile Scale) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Last read card */}
            <div className="memphis-card p-3 sm:p-4 bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white shadow-[2px_2px_0px_#121212] flex items-center justify-between">
              <div>
                <span className="memphis-badge bg-white text-black text-[9px] mb-1">
                  Terakhir Dibaca
                </span>
                {lastReadSurah ? (
                  <div>
                    <h3 className="text-sm sm:text-base font-bold tracking-tight">
                      Surah {lastReadSurah.name}
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-200 mt-0.5">
                      {lastReadSurah.lastAyah ? `Sampai Ayat ke-${lastReadSurah.lastAyah}` : 'Klik untuk melanjutkan'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm sm:text-base font-bold tracking-tight">Al-Fatihah</h3>
                    <p className="text-[11px] font-bold text-emerald-200 mt-0.5">Mulai membaca surat pertama</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  const num = lastReadSurah?.number || 1;
                  const surahObj = surahs.find(s => s.nomor === num);
                  if (surahObj) openSurah(surahObj, lastReadSurah?.lastAyah);
                }}
                className="memphis-btn memphis-btn-white px-2.5 py-1 text-xs font-bold shrink-0"
              >
                Lanjut
              </button>
            </div>

            {/* Quick Surat Pilihan & Offline Shortcuts */}
            <div className="md:col-span-2 memphis-card p-3 sm:p-4 shadow-[2px_2px_0px_#121212] flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Surat Sering Dibaca (Bisa Offline)
                </span>
                <span className="memphis-badge bg-emerald-100 text-emerald-800 text-[9px]">
                  {Object.keys(offlineSurahsMap).length} Offline
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularSurahs.map((ps) => {
                  const isSaved = !!offlineSurahsMap[ps.no.toString()];
                  return (
                    <button
                      key={ps.no}
                      onClick={() => {
                        const s = surahs.find(item => item.nomor === ps.no);
                        if (s) openSurah(s);
                      }}
                      className={`memphis-btn px-2.5 py-1 text-[11px] uppercase font-bold gap-1 ${
                        isSaved
                          ? 'memphis-btn-green'
                          : 'memphis-btn-white'
                      }`}
                    >
                      <span>{ps.name}</span>
                      {isSaved && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari surat atau nomor..."
              value={quranSearch}
              onChange={(e) => setQuranSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border-[1.5px] border-black rounded-xl text-xs sm:text-sm font-medium"
            />
          </div>

          {/* Surah List (Memphis Cards) */}
          {isLoadingSurahs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl border-[1.5px] border-black animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {filteredSurahs.map((surah) => {
                const isOffline = !!offlineSurahsMap[surah.nomor.toString()];
                return (
                  <div
                    key={surah.nomor}
                    onClick={() => openSurah(surah)}
                    className="memphis-card p-2.5 sm:p-3 shadow-[2px_2px_0px_#121212] hover:translate-x-0.5 transition-all cursor-pointer flex items-center justify-between relative group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 border border-black text-black font-bold flex items-center justify-center text-xs shrink-0 shadow-[1px_1px_0px_#121212]">
                        {surah.nomor}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-xs sm:text-sm tracking-tight text-black truncate">
                            {surah.namaLatin}
                          </h3>
                          {isOffline && (
                            <span className="memphis-badge bg-[#10B981] text-white text-[8px] py-0 px-1">
                              Off
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 truncate">
                          {surah.arti} • {surah.jumlahAyat} Ayat
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          murottalPlayer.setSurah(surah.nomor, true);
                          vibrateSuccess();
                        }}
                        className="memphis-btn memphis-btn-white p-1.5 text-black"
                        title={`Putar Audio QS ${surah.namaLatin}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-right">
                        <span className="font-serif text-sm sm:text-base font-bold text-black block">
                          {surah.nama}
                        </span>
                        <span className="block text-[9px] font-bold text-gray-500 capitalize">
                          {surah.tempatTurun}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: HADITS ARBA'IN ======================= */}
      {activeTab === 'hadis' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm">
                42 Hadits Pilihan Arba'in An-Nawawi
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Koleksi hadits pokok hukum dan akhlak Islam dari sumber resmi API MyQuran.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari hadits berdasarkan judul atau terjemahan (contoh: Niat, Malu, Wara)..."
              value={hadisSearch}
              onChange={(e) => setHadisSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs sm:text-sm text-gray-900 dark:text-white shadow-xs transition-all"
            />
          </div>

          {/* Hadits List */}
          {isLoadingHadiths ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHadiths.map((h) => {
                const isFav = storage.isHadithFavorite(h.no);
                return (
                  <div
                    key={h.no}
                    className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-700 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-lg">
                          Hadits #{h.no}
                        </span>
                        <h4 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                          {h.judul}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleFavoriteHadith(h)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isFav 
                              ? 'text-red-500 bg-red-50 dark:bg-red-950/40' 
                              : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={isFav ? "Hapus dari Favorit" : "Simpan ke Favorit"}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleCopyHadith(h)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Salin Hadits"
                        >
                          {copiedId === h.no ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Arabic Text */}
                    <div className="text-right font-serif text-lg sm:text-xl leading-loose text-gray-900 dark:text-gray-100 my-3 px-1" dir="rtl">
                      {h.arab}
                    </div>

                    {/* Indonesian Translation */}
                    <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 mr-1">Artinya:</span>
                      "{h.indo}"
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: FAVORIT & TERSIMPAN ======================= */}
      {activeTab === 'favorit' && (
        <div className="space-y-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setFavSubTab('ayah')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                favSubTab === 'ayah'
                  ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Ayat Al-Qur'an ({favoriteAyahs.length})
            </button>
            <button
              onClick={() => setFavSubTab('hadith')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                favSubTab === 'hadith'
                  ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Hadits Tersimpan ({favoriteHadiths.length})
            </button>
          </div>

          {favSubTab === 'ayah' && (
            <div className="space-y-4">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
                {['Semua', 'Hafalan', 'Doa', 'Motivasi', 'Tadabbur'].map((cat) => {
                  const count = cat === 'Semua' 
                    ? favoriteAyahs.length 
                    : favoriteAyahs.filter(a => (a.category || 'Tadabbur') === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setFavCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                        favCategoryFilter === cat
                          ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="ml-1.5 opacity-80 text-[10px]">({count})</span>
                    </button>
                  );
                })}
              </div>

              {favoriteAyahs.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Belum ada ayat bertanda</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Buka surat di Al-Qur'an dan klik tombol bookmark untuk menandai ayat dengan kategori warna & catatan tadabbur.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteAyahs
                    .filter(fav => favCategoryFilter === 'Semua' || (fav.category || 'Tadabbur') === favCategoryFilter)
                    .map((fav) => {
                      const categoryBadgeColor: Record<string, string> = {
                        Hafalan: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
                        Doa: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
                        Motivasi: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
                        Tadabbur: 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
                      };
                      const badgeClass = categoryBadgeColor[fav.category || 'Tadabbur'] || categoryBadgeColor.Tadabbur;

                      return (
                        <div
                          key={fav.id}
                          className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-3 transition-all hover:border-purple-300/60"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">
                                QS. {fav.surahName} : Ayat {fav.ayahNumber}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClass}`}>
                                {fav.category || 'Tadabbur'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  const surahObj = surahs.find(s => s.nomor === fav.surahNumber);
                                  if (surahObj) {
                                    openSurah(surahObj, fav.ayahNumber);
                                  }
                                }}
                                className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold hover:bg-purple-100 transition-colors flex items-center gap-1"
                                title="Buka dan baca ayat ini di surah"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Buka Surah</span>
                              </button>
                              <button
                                onClick={() => {
                                  storage.removeFavoriteAyah(fav.id);
                                  setFavoriteAyahs(storage.getFavoriteAyahs());
                                  vibrateSuccess();
                                }}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-lg"
                                title="Hapus dari tersimpan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Arabic with end-of-ayah circular indicator */}
                          <div className="text-right font-serif text-xl sm:text-2xl leading-[2.5] text-gray-900 dark:text-gray-100 pr-1" dir="rtl">
                            <span>{fav.arab}</span>
                            <span className="inline-flex items-center justify-center mx-2 w-7 h-7 rounded-full border border-purple-500/70 bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-serif font-bold align-middle">
                              {toArabicNumerals(fav.ayahNumber)}
                            </span>
                          </div>

                          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium italic">
                            {fav.latin}
                          </p>
                          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl">
                            "{fav.translation}"
                          </p>

                          {/* Personal Tadabbur Note if present */}
                          {fav.note && (
                            <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-900/60 flex items-start gap-2 text-xs">
                              <Quote className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-[10px] text-purple-800 dark:text-purple-300 block uppercase tracking-wider">
                                  Catatan Tadabbur Pribadi:
                                </span>
                                <p className="text-gray-800 dark:text-gray-200 italic mt-0.5 leading-relaxed">
                                  "{fav.note}"
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {favSubTab === 'hadith' && (
            <div>
              {favoriteHadiths.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Belum ada hadits favorit</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Buka tab Hadits Arba'in dan klik ikon hati pada hadits yang ingin Anda simpan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteHadiths.map((h) => (
                    <div
                      key={h.id}
                      className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg">
                          Hadits #{h.no}: {h.judul}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyHadith(h)}
                            className="text-gray-400 hover:text-emerald-600 p-1"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              storage.removeFavoriteHadith(h.id);
                              setFavoriteHadiths(storage.getFavoriteHadiths());
                            }}
                            className="text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right font-serif text-lg sm:text-xl leading-loose text-gray-900 dark:text-gray-100 my-2" dir="rtl">
                        {h.arab}
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl">
                        "{h.indo}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 4: DOA KEMENAG ======================= */}
      {activeTab === 'doa' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari doa (contoh: bepergian, makan, orang tua, tidur)..."
              value={doaSearch}
              onChange={(e) => setDoaSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs sm:text-sm text-gray-900 dark:text-white shadow-xs transition-all"
            />
          </div>

          {isLoadingDoas ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDoas.slice(0, 50).map((d, index) => (
                <div
                  key={d.id || index}
                  className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-2"
                >
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                    {d.doa}
                  </h4>
                  <div className="text-right font-serif text-lg leading-loose text-gray-900 dark:text-gray-100" dir="rtl">
                    {d.ayat}
                  </div>
                  {d.latin && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 italic">
                      {d.latin}
                    </p>
                  )}
                  <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl">
                    "{d.artinya}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= SURAH DETAIL MODAL ======================= */}
      {selectedSurah && (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200 ${
          isFullscreen ? 'p-0' : ''
        }`}>
          <div className={`bg-[#FAF9F5] dark:bg-slate-900 w-full h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ${
            isFullscreen ? 'max-w-none' : 'max-w-2xl'
          }`}>
            
            {/* Header ringkas: tutup, judul, putar, menu tampilan */}
            <div className="relative h-14 px-3 border-b border-emerald-800 bg-emerald-700 text-white flex items-center justify-between gap-2 shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => {
                    setSelectedSurah(null);
                    if (audioRef.current) audioRef.current.pause();
                    setPlayingAudio(null);
                    setIsFullscreen(false);
                    setShowReaderMenu(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 active:scale-95 transition-all"
                  aria-label="Tutup bacaan"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-sm font-bold truncate">{selectedSurah.namaLatin}</h3>
                    <span className="text-xs text-white/70 font-serif shrink-0">{selectedSurah.nama}</span>
                  </div>
                  <p className="text-[11px] text-white/80 truncate">
                    {selectedSurah.jumlahAyat} ayat • {selectedSurah.tempatTurun}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {selectedSurah.audioFull?.['05'] && (
                  <button
                    onClick={() => toggleAudio(selectedSurah.audioFull!['05'])}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
                    aria-label={playingAudio === selectedSurah.audioFull['05'] ? 'Jeda murottal' : 'Putar murottal surat'}
                  >
                    {playingAudio === selectedSurah.audioFull['05'] ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
                <button
                  onClick={() => setShowReaderMenu((v) => !v)}
                  aria-label="Pengaturan tampilan baca"
                  aria-expanded={showReaderMenu}
                  className={`h-9 px-3 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                    showReaderMenu ? 'bg-white text-emerald-800' : 'bg-white/15 hover:bg-white/25 text-white'
                  }`}
                >
                  Aa
                </button>
              </div>

              {showReaderMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowReaderMenu(false)} />
                  <div className="absolute right-2 top-[calc(100%+6px)] z-40 w-64 rounded-xl bg-white text-gray-900 shadow-xl border border-gray-200 p-3 space-y-3">
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold">Mode baca</span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {([['card', 'Per ayat'], ['mushaf', 'Mushaf']] as const).map(([id, label]) => (
                          <button
                            key={id}
                            onClick={() => toggleReadingMode(id)}
                            aria-pressed={readingMode === id}
                            className={`h-8 rounded-lg text-xs font-bold border ${
                              readingMode === id ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-gray-700 border-gray-300'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold">Ukuran huruf Arab</span>
                      <div className="flex items-center justify-between gap-2">
                        <button onClick={() => changeFontSize(-2)} aria-label="Kecilkan huruf" className="w-9 h-8 rounded-lg border border-gray-300 text-xs font-bold">A-</button>
                        <span className="text-xs font-semibold text-gray-600">{quranFontSize}px</span>
                        <button onClick={() => changeFontSize(2)} aria-label="Besarkan huruf" className="w-9 h-8 rounded-lg border border-gray-300 text-sm font-bold">A+</button>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => setIsFullscreen((v) => !v)}
                        className="w-full h-9 px-2 rounded-lg hover:bg-gray-50 text-xs font-semibold flex items-center gap-2"
                      >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        {isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
                      </button>
                      <button
                        onClick={(e) => handleToggleOfflineSurah(selectedSurah, e)}
                        className="w-full h-9 px-2 rounded-lg hover:bg-gray-50 text-xs font-semibold flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        {storage.isSurahOffline(selectedSurah.nomor) ? 'Hapus dari offline' : 'Simpan offline'}
                      </button>
                      <button
                        onClick={() => {
                          setShowReaderMenu(false);
                          setLogModalProps({
                            surahNumber: selectedSurah.nomor,
                            surahName: selectedSurah.namaLatin,
                            totalAyah: selectedSurah.jumlahAyat,
                            startAyah: 1,
                            endAyah: selectedSurah.jumlahAyat
                          });
                          setIsLogModalOpen(true);
                        }}
                        className="w-full h-9 px-2 rounded-lg hover:bg-gray-50 text-xs font-semibold flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        Catat tilawah
                      </button>
                    </div>

                    <p className="text-[11px] text-gray-500 leading-snug">Teks Latin dan terjemahan diatur di menu Pengaturan.</p>
                  </div>
                </>
              )}
            </div>

            {/* Content Container (Ayah List or Continuous Mushaf View) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 pb-24">
              {/* Bismillah banner (unless At-Taubah #9 and Al-Fatihah #1) */}
              {selectedSurah.nomor !== 9 && selectedSurah.nomor !== 1 && (
                <div className="text-center py-2 text-lg sm:text-2xl font-serif font-normal text-emerald-800 dark:text-emerald-400">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}

              {isLoadingAyahs ? (
                <div className="space-y-3 py-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : ayahs.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center font-bold text-base">
                    📖
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Ayat belum tampil atau kendala koneksi
                  </h4>
                  <button
                    onClick={() => openSurah(selectedSurah)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 inline-flex items-center gap-2"
                  >
                    <span>Muat Ulang Ayat</span>
                  </button>
                </div>
              ) : readingMode === 'mushaf' ? (
                /* ======================= MODE PER HALAMAN MUSHAF KONTINU (TEXT-JUSTIFY) ======================= */
                <div className="space-y-4">
                  <div className="p-4 sm:p-7 bg-[#FFFDF8] dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-2xl shadow-xs space-y-4">
                    <div className="text-center pb-3 border-b border-emerald-100 dark:border-slate-700 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">📖 Mushaf Al-Qur'an</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {selectedSurah.namaLatin} ({selectedSurah.jumlahAyat} Ayat)
                      </span>
                      <span className="text-[11px] text-gray-400">Ketuk ayat untuk Tafsir</span>
                    </div>

                    {/* Continuous Arabic Text Paragraph with Text Justify Alignment */}
                    {showArabic && (
                      <div 
                        className="text-justify font-serif font-normal text-gray-900 dark:text-gray-100 leading-[2.6] sm:leading-[3.0] tracking-wide"
                        style={{ fontSize: `${quranFontSize}px` }}
                        dir="rtl"
                      >
                        {ayahs.map((a) => (
                          <React.Fragment key={a.nomorAyat}>
                            <span 
                              onClick={() => handleOpenTafsir(selectedSurah, a)}
                              className="hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 rounded px-1 transition-colors cursor-pointer"
                              title={`Ketuk untuk membaca Tafsir Kemenag RI Ayat ${a.nomorAyat}`}
                            >
                              {a.teksArab}
                            </span>
                            {/* Circular Ornament Badge at End of Verse */}
                            <button
                              type="button"
                              onClick={() => handleOpenTafsir(selectedSurah, a)}
                              className="inline-flex items-center justify-center mx-1.5 w-6 h-6 rounded-full border border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-[10.5px] font-serif font-medium select-none align-middle hover:scale-110 active:scale-95 transition-all shadow-xs"
                              title={`Tafsir Ayat ${a.nomorAyat}`}
                            >
                              {toArabicNumerals(a.nomorAyat)}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* Transliteration & Translation Section per Ayah in Mushaf Mode */}
                    {(showLatin || showTranslation) && (
                      <div className="pt-4 border-t border-emerald-100 dark:border-slate-700 space-y-3">
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          Terjemahan & Transliterasi Ayat:
                        </p>
                        {ayahs.map((a) => (
                          <div 
                            key={a.nomorAyat} 
                            onClick={() => handleOpenTafsir(selectedSurah, a)}
                            className="p-2.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1 cursor-pointer hover:border-emerald-500 transition-colors"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                Ayat {a.nomorAyat}
                              </span>
                              <span className="text-[10px] text-gray-400 italic">Ketuk untuk Tafsir RI</span>
                            </div>
                            {showLatin && a.teksLatin && (
                              <p className="text-[12px] text-emerald-900 dark:text-emerald-300 italic font-medium">
                                {a.teksLatin}
                              </p>
                            )}
                            {showTranslation && a.teksIndonesia && (
                              <p className="text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed">
                                {a.teksIndonesia}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* ======================= MODE PER AYAT (KARTU CLEAN & MINIMALIST) ======================= */
                ayahs.map((ayah) => {
                  const ayahId = `${selectedSurah.nomor}:${ayah.nomorAyat}`;
                  const isFav = storage.isAyahFavorite(ayahId);
                  const isLastRead = lastReadMarker?.surahNumber === selectedSurah.nomor && lastReadMarker?.ayahNumber === ayah.nomorAyat;
                  const favoriteEntry = favoriteAyahs.find(f => f.id === ayahId);

                  return (
                    <div
                      key={ayah.nomorAyat}
                      id={`ayah-${ayah.nomorAyat}`}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all space-y-2.5 ${
                        isLastRead 
                          ? 'bg-[#E6FFFA] dark:bg-teal-950/30 border-emerald-500 shadow-xs' 
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-emerald-300 text-gray-900 dark:text-gray-100 shadow-xs'
                      }`}
                    >
                      {/* Ayah Header Action Row */}
                      <div className="flex items-center justify-between gap-2">
                        {/* Number Badge & Tafsir Trigger */}
                        <div className="flex items-center gap-1.5">
                          <span className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                            {ayah.nomorAyat}
                          </span>
                          <button
                            onClick={() => handleOpenTafsir(selectedSurah, ayah)}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all active:scale-95"
                            title="Baca Tafsir Kemenag RI"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Tafsir</span>
                          </button>
                        </div>

                        {/* Action Buttons: Bookmark (Tandai Baca), Heart (Favorit Instant), Audio */}
                        <div className="flex items-center gap-1.5">
                          {/* 1. Bookmark / Last Read */}
                          <button
                            onClick={() => handleMarkAyahRead(ayah.nomorAyat)}
                            className={`w-8 h-8 rounded-lg border text-xs font-medium flex items-center justify-center transition-all ${
                              isLastRead
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-emerald-50 text-gray-700 dark:text-gray-300'
                            }`}
                            title={isLastRead ? "Posisi Terakhir Dibaca" : "Tandai Terakhir Dibaca"}
                            aria-label="Tandai Terakhir Dibaca"
                          >
                            <Bookmark className={`w-4 h-4 ${isLastRead ? 'fill-white' : ''}`} />
                          </button>

                          {/* 2. Instant Favorite / Heart (Toggles add/remove from tab Favorit!) */}
                          <button
                            onClick={() => handleToggleFavoriteAyah(ayah)}
                            className={`w-8 h-8 rounded-lg border text-xs font-medium flex items-center justify-center transition-all ${
                              favoriteEntry
                                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 shadow-xs'
                                : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-rose-50 text-gray-600 dark:text-gray-300'
                            }`}
                            title={favoriteEntry ? "Hapus dari Ayat Favorit" : "Simpan ke Ayat Favorit"}
                            aria-label="Simpan Favorit"
                          >
                            <Heart className={`w-4 h-4 ${favoriteEntry ? 'fill-current text-rose-600' : ''}`} />
                          </button>

                          {/* 3. Audio Play/Pause */}
                          {ayah.audio?.['05'] && (
                            <button
                              onClick={() => toggleAudio(ayah.audio!['05'])}
                              className={`w-8 h-8 rounded-lg border text-xs font-medium flex items-center justify-center transition-all ${
                                playingAudio === ayah.audio['05']
                                  ? 'bg-emerald-600 text-white border-emerald-700'
                                  : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-emerald-50 text-gray-700 dark:text-gray-300'
                              }`}
                              title={playingAudio === ayah.audio['05'] ? "Hentikan Audio" : "Dengar Audio Ayat"}
                              aria-label="Dengar Audio Ayat"
                            >
                              {playingAudio === ayah.audio['05'] ? (
                                <Pause className="w-4 h-4 text-white" />
                              ) : (
                                <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Arabic Text (clean font-serif text, non-giant size driven by quranFontSize, right-aligned) */}
                      {showArabic && (
                        <div 
                          onClick={() => handleOpenTafsir(selectedSurah, ayah)}
                          className="text-right font-serif font-normal text-gray-900 dark:text-white leading-[2.2] pr-1 cursor-pointer hover:bg-emerald-50/40 rounded transition-colors" 
                          style={{ fontSize: `${quranFontSize}px` }}
                          dir="rtl"
                          title="Ketuk untuk membaca Tafsir Kemenag RI"
                        >
                          <span>{ayah.teksArab}</span>
                          {/* Inline Ayah Number Badge Indicator */}
                          <span 
                            className="inline-flex items-center justify-center mx-1.5 w-5 h-5 rounded-full border border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 text-[10px] font-serif font-medium select-none align-middle"
                            title={`Ayat ${ayah.nomorAyat}`}
                          >
                            {toArabicNumerals(ayah.nomorAyat)}
                          </span>
                        </div>
                      )}

                      {/* Latin Transliteration (13px italic without heavy box) */}
                      {showLatin && (
                        <p className="text-[13px] text-emerald-800 dark:text-emerald-300 italic font-medium bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-lg border-l-2 border-emerald-500">
                          {ayah.teksLatin}
                        </p>
                      )}

                      {/* Indonesian Translation (14px contrast text) */}
                      {showTranslation && (
                        <p className="text-[14px] text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
                          {ayah.teksIndonesia}
                        </p>
                      )}

                      {/* Personal Tadabbur Note if exists */}
                      {favoriteEntry?.note && (
                        <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800 text-xs flex items-start gap-1.5">
                          <Quote className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[10px] text-purple-900 dark:text-purple-300 block uppercase">
                              Catatan Tadabbur ({favoriteEntry.category}):
                            </span>
                            <p className="text-gray-900 dark:text-gray-100 italic text-[12px]">
                              "{favoriteEntry.note}"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Fixed Mini Audio Player when audio is playing */}
            {playingAudio && (
              <div className="fixed bottom-[60px] left-0 right-0 z-40 bg-emerald-900 text-white p-2.5 px-4 flex items-center justify-between border-t border-emerald-700 h-14 shadow-lg animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center animate-pulse">
                    <Volume2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="font-bold truncate text-white">Memutar Audio Murottal</p>
                    <p className="text-[11px] text-emerald-200 truncate">{selectedSurah.namaLatin}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (audioRef.current) audioRef.current.pause();
                    setPlayingAudio(null);
                  }}
                  className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg border border-black shadow-xs active:scale-95 flex items-center gap-1"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Hentikan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= TAFSIR KEMENAG RI BOTTOM SHEET ======================= */}
      {selectedTafsir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end justify-center animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-t-3xl border-t-2 border-x-2 border-black flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            
            {/* Tafsir Drawer Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-800 bg-emerald-700 text-white flex items-center justify-between rounded-t-3xl shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedTafsir.ayah.nomorAyat}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base truncate">
                    Tafsir Kemenag RI — {selectedTafsir.surah.namaLatin} Ayat {selectedTafsir.ayah.nomorAyat}
                  </h3>
                  <p className="text-[11px] text-emerald-100 truncate">
                    {selectedSurah?.arti} • {selectedSurah?.tempatTurun}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTafsir(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 active:scale-95 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tafsir Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
              {/* Ayah Arabic */}
              <div className="p-3 bg-[#FFFDF8] dark:bg-slate-800 border border-black rounded-xl space-y-2">
                <div className="text-right font-serif font-bold text-xl sm:text-2xl leading-relaxed text-gray-900 dark:text-white" dir="rtl">
                  {selectedTafsir.ayah.teksArab}
                </div>
                {selectedTafsir.ayah.teksLatin && (
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 italic">
                    {selectedTafsir.ayah.teksLatin}
                  </p>
                )}
                {selectedTafsir.ayah.teksIndonesia && (
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    "{selectedTafsir.ayah.teksIndonesia}"
                  </p>
                )}
              </div>

              {/* Tafsir Paragraph */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Penjelasan Tafsir Ringkas:</span>
                </h4>
                {isLoadingTafsir ? (
                  <div className="space-y-2 animate-pulse py-4">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-4/6" />
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/70 dark:bg-slate-800/80 rounded-xl border border-amber-300 dark:border-slate-700 text-gray-900 dark:text-gray-100 leading-relaxed space-y-2">
                    <p className="whitespace-pre-line leading-relaxed font-normal text-xs sm:text-sm">
                      {selectedTafsir.tafsirText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tafsir Drawer Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => {
                  handleMarkAyahRead(selectedTafsir.ayah.nomorAyat);
                  setSelectedTafsir(null);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold border border-black shadow-xs flex items-center gap-1"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Tandai Terakhir Baca</span>
              </button>

              <button
                onClick={() => setSelectedTafsir(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold border border-black hover:bg-gray-300 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tilawah Logger Modal */}
      <QuranLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        surahNumber={logModalProps.surahNumber}
        surahName={logModalProps.surahName}
        totalAyah={logModalProps.totalAyah}
        suggestedStart={logModalProps.startAyah}
        suggestedEnd={logModalProps.endAyah}
      />

      {/* Khatam Target Calculator Modal */}
      <KhatamCalculatorModal
        isOpen={isKhatamModalOpen}
        onClose={() => setIsKhatamModalOpen(false)}
        onOpenLogModal={() => setIsLogModalOpen(true)}
      />

      {/* Tadabbur Bookmark Modal */}
      <TadabburBookmarkModal
        isOpen={!!bookmarkModalTarget}
        onClose={() => setBookmarkModalTarget(null)}
        surah={bookmarkModalTarget?.surah || null}
        ayah={bookmarkModalTarget?.ayah || null}
        onSaved={() => setFavoriteAyahs(storage.getFavoriteAyahs())}
      />
    </div>
  );
}
