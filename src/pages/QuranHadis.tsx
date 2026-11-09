import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Search, Play, Pause, Volume2, Bookmark, Check, Copy, 
  ChevronRight, X, Sparkles, Heart, Download, CheckCircle2,
  Trash2, ExternalLink, Share2, Compass, Headphones, Moon,
  Quote, Tag, Eye, Maximize2, Minimize2, FileText, Layers,
  ArrowLeft, SlidersHorizontal, Settings as SettingsIcon,
  ChevronLeft, Plus, MoreVertical, CheckCheck
} from 'lucide-react';
import { SurahItem, AyatItem, HadithArbain, FavoriteAyah, FavoriteHadith, ReadingHancaItem } from '../types';
import { storage } from '../lib/storage';
import { vibrateSuccess, playQuranSound, playButtonTapSound } from '../lib/audio';
import { murottalPlayer } from '../lib/murottal';
import { QuranLogModal } from '../components/QuranLogModal';
import { KhatamCalculatorModal } from '../components/KhatamCalculatorModal';
import { TadabburBookmarkModal } from '../components/TadabburBookmarkModal';
import { IslamicStarBadge } from '../components/IslamicStarBadge';
import { SurahHeaderFrame } from '../components/SurahHeaderFrame';
import { HancaBookmarkModal } from '../components/HancaBookmarkModal';
import { QuranReaderSettingsModal } from '../components/QuranReaderSettingsModal';
import { QURAN_JUZ_LIST, QuranJuzItem } from '../data/quran-juz';
import { getSurahAyahs, getSurahTafsir } from '../lib/quran-api';
import { getCachedAudioUrl } from '../lib/murottal-cache';
import { renderTajweedHtml } from '../lib/tajweed';

// Helper to convert western digits to authentic Arabic numerals (١, ٢, ٣...)
export const toArabicNumerals = (num: number | string): string => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(d => arabicDigits[parseInt(d, 10)] || d).join('');
};

// Helper to get Juz number for any surah & ayah
export const getJuzForSurahAyah = (surahNumber: number, ayahNumber: number = 1): number => {
  for (let i = QURAN_JUZ_LIST.length - 1; i >= 0; i--) {
    const j = QURAN_JUZ_LIST[i];
    if (surahNumber > j.surahNumber || (surahNumber === j.surahNumber && ayahNumber >= j.startAyah)) {
      return j.juz;
    }
  }
  return 1;
};

export default function QuranHadis() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Quran Primary Tabs: 'surah' | 'juz' | 'bookmark' | 'hadis' | 'doa'
  const paramTab = searchParams.get('tab') as 'surah' | 'juz' | 'bookmark' | 'hadis' | 'doa';
  const initialTab = paramTab || 'surah';
  const [activeTab, setActiveTab] = useState<'surah' | 'juz' | 'bookmark' | 'hadis' | 'doa'>(initialTab);
  
  const [isKhatamModalOpen, setIsKhatamModalOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showExtraMenu, setShowExtraMenu] = useState(false);

  const handleTabChange = (tab: 'surah' | 'juz' | 'bookmark' | 'hadis' | 'doa') => {
    setActiveTab(tab);
    setSearchParams({ tab });
    playButtonTapSound();
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
  const [downloadingSurahNomor, setDownloadingSurahNomor] = useState<number | null>(null);
  
  // Multi-Hanca State
  const [hancas, setHancas] = useState<ReadingHancaItem[]>(() => storage.getReadingHancas());
  const [hancaModalTarget, setHancaModalTarget] = useState<{ surah: SurahItem; ayah: AyatItem } | null>(null);
  const [isCreatingNewHanca, setIsCreatingNewHanca] = useState(false);
  const [newHancaTitle, setNewHancaTitle] = useState('');

  // Font size, visibility & mode controls
  const [quranFontSize, setQuranFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('wi_quran_font_size');
    return saved ? Number(saved) : 25;
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
    return saved !== null ? saved === 'true' : false; // cleaner default: false
  });
  const [showTranslation, setShowTranslation] = useState<boolean>(() => {
    const saved = localStorage.getItem('wi_quran_show_translation');
    return saved !== null ? saved === 'true' : true;
  });
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // New features: Parchment (Sepia) Theme, Qari Selection, and Continuous Auto-Scroll Murottal
  const [readerTheme, setReaderTheme] = useState<'default' | 'sepia' | 'dark'>(() => {
    const saved = localStorage.getItem('wi_quran_theme');
    return (saved as 'default' | 'sepia' | 'dark') || 'default';
  });
  const [selectedQari, setSelectedQari] = useState<string>(() => {
    const saved = localStorage.getItem('wi_quran_qari');
    return saved || '05';
  });
  const [autoScroll, setAutoScroll] = useState<boolean>(() => {
    const saved = localStorage.getItem('wi_quran_autoscroll');
    return saved !== null ? saved === 'true' : true;
  });
  const [playingAyahNumber, setPlayingAyahNumber] = useState<number | null>(null);

  const handleSetReaderTheme = (theme: 'default' | 'sepia' | 'dark') => {
    setReaderTheme(theme);
    localStorage.setItem('wi_quran_theme', theme);
  };

  const handleSetSelectedQari = (qariId: string) => {
    setSelectedQari(qariId);
    localStorage.setItem('wi_quran_qari', qariId);
  };

  const toggleAutoScroll = () => {
    const next = !autoScroll;
    setAutoScroll(next);
    localStorage.setItem('wi_quran_autoscroll', String(next));
  };

  const [tajweedEnabled, setTajweedEnabled] = useState<boolean>(() => storage.getTajweedEnabled());

  const toggleTajweed = () => {
    const next = !tajweedEnabled;
    setTajweedEnabled(next);
    storage.setTajweedEnabled(next);
  };

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

  const setFontSizePreset = (size: number) => {
    setQuranFontSize(size);
    localStorage.setItem('wi_quran_font_size', String(size));
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
  const surahTabsContainerRef = useRef<HTMLDivElement | null>(null);

  // --- HADIS & DOA STATE ---
  const [hadiths, setHadiths] = useState<HadithArbain[]>([]);
  const [isLoadingHadiths, setIsLoadingHadiths] = useState(false);
  const [hadisSearch, setHadisSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [favoriteAyahs, setFavoriteAyahs] = useState<FavoriteAyah[]>(storage.getFavoriteAyahs());
  const [favoriteHadiths, setFavoriteHadiths] = useState<FavoriteHadith[]>(storage.getFavoriteHadiths());
  const [bookmarkModalTarget, setBookmarkModalTarget] = useState<{ surah: SurahItem; ayah: AyatItem } | null>(null);

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

  // Listen to Hanca changes
  useEffect(() => {
    const handleHancaChange = () => {
      setHancas(storage.getReadingHancas());
    };
    window.addEventListener('wi_hanca_updated', handleHancaChange);
    window.addEventListener('storage', handleHancaChange);
    return () => {
      window.removeEventListener('wi_hanca_updated', handleHancaChange);
      window.removeEventListener('storage', handleHancaChange);
    };
  }, []);

  // Open Surah Detail with resilient multi-tier fallback
  const openSurah = async (surah: SurahItem, targetAyah?: number) => {
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

    // Save recent read record in storage
    const record = { number: surah.nomor, name: surah.namaLatin, lastAyah: targetAyah || 1 };
    localStorage.setItem('wi_last_read', JSON.stringify(record));
  };

  // Scroll active surah chip into view when selectedSurah changes
  useEffect(() => {
    if (selectedSurah && surahTabsContainerRef.current) {
      const activeEl = document.getElementById(`surah-tab-${selectedSurah.nomor}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedSurah]);

  // Auto-scroll to target ayah on load
  useEffect(() => {
    if (selectedSurah && ayahs.length > 0) {
      const savedRecord = localStorage.getItem('wi_last_read');
      const targetAyah = savedRecord ? JSON.parse(savedRecord).lastAyah : 1;
      if (targetAyah && targetAyah > 1) {
        const el = document.getElementById(`ayah-${targetAyah}`);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
        }
      }
    }
  }, [selectedSurah, ayahs]);

  // Toggle Offline Storage for a Surah with visual download state
  const handleToggleOfflineSurah = async (surah: SurahItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isSaved = storage.isSurahOffline(surah.nomor);

    if (isSaved) {
      storage.removeOfflineSurah(surah.nomor);
      setOfflineSurahsMap(storage.getOfflineSurahs());
      vibrateSuccess();
    } else {
      setDownloadingSurahNomor(surah.nomor);
      try {
        if (selectedSurah?.nomor === surah.nomor && ayahs.length > 0) {
          storage.saveOfflineSurah(surah, ayahs);
          setOfflineSurahsMap(storage.getOfflineSurahs());
          vibrateSuccess();
        } else {
          const result = await getSurahAyahs(surah.nomor);
          if (result.success && result.ayahs.length > 0) {
            storage.saveOfflineSurah(surah, result.ayahs);
            setOfflineSurahsMap(storage.getOfflineSurahs());
            vibrateSuccess();
          }
        }
      } catch (err) {
        console.error("Failed to download surah for offline:", err);
      } finally {
        setDownloadingSurahNomor(null);
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

  // Audio Handler with IndexedDB caching
  const toggleAudio = async (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      audioRef.current?.pause();
      setPlayingAudio(null);
      setPlayingAyahNumber(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const cachedUrl = await getCachedAudioUrl(audioUrl);
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      audio.play().catch(e => console.warn("Audio play blocked", e));
      setPlayingAudio(audioUrl);
      audio.onended = () => {
        setPlayingAudio(null);
        setPlayingAyahNumber(null);
      };
    }
  };

  // Play Ayah Murottal with chosen Qari, auto-scroll, and continuous sequential playback
  const playAyahAudio = async (ayahNumber: number, explicitQari?: string) => {
    const targetAyah = ayahs.find(a => a.nomorAyat === ayahNumber);
    if (!targetAyah || !targetAyah.audio) return;
    const qariKey = explicitQari || selectedQari;
    const audioUrl = targetAyah.audio[qariKey] || targetAyah.audio['05'] || Object.values(targetAyah.audio)[0];
    if (!audioUrl) return;

    if (playingAudio === audioUrl) {
      audioRef.current?.pause();
      setPlayingAudio(null);
      setPlayingAyahNumber(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setPlayingAyahNumber(ayahNumber);
    setPlayingAudio(audioUrl);

    // Auto-scroll to currently playing verse
    if (autoScroll) {
      setTimeout(() => {
        const el = document.getElementById(`ayah-${ayahNumber}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }

    try {
      const cachedUrl = await getCachedAudioUrl(audioUrl);
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      audio.play().catch(e => console.warn("Ayah audio play blocked", e));
      audio.onended = () => {
        // Continuous next verse playback
        if (autoScroll) {
          const currentIndex = ayahs.findIndex(a => a.nomorAyat === ayahNumber);
          if (currentIndex !== -1 && currentIndex + 1 < ayahs.length) {
            const nextAyah = ayahs[currentIndex + 1];
            playAyahAudio(nextAyah.nomorAyat, qariKey);
            return;
          }
        }
        setPlayingAudio(null);
        setPlayingAyahNumber(null);
      };
    } catch (err) {
      console.error("Audio playback error:", err);
      setPlayingAudio(null);
      setPlayingAyahNumber(null);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Filtered Surahs
  const filteredSurahs = useMemo(() => {
    if (!quranSearch.trim()) return surahs;
    const query = quranSearch.toLowerCase();
    return surahs.filter(s => 
      s.namaLatin.toLowerCase().includes(query) ||
      s.arti.toLowerCase().includes(query) ||
      s.nomor.toString() === query ||
      s.nama.includes(query)
    );
  }, [surahs, quranSearch]);

  // Filtered Juz
  const filteredJuz = useMemo(() => {
    if (!quranSearch.trim()) return QURAN_JUZ_LIST;
    const query = quranSearch.toLowerCase();
    return QURAN_JUZ_LIST.filter(j => 
      `juz ${j.juz}`.includes(query) ||
      j.juz.toString() === query ||
      j.surahName.toLowerCase().includes(query) ||
      j.description.toLowerCase().includes(query)
    );
  }, [quranSearch]);

  return (
    <div className="space-y-3 pb-24 animate-in fade-in duration-300 w-full max-w-full">
      {/* ======================= TOP BAR (MATCHING SCREENSHOT 1 & 3) ======================= */}
      <div className="bg-[#0f6b52] text-white rounded-2xl border-[1.5px] border-[#121212] shadow-[3px_3px_0px_#121212] p-3 sm:p-4 space-y-3">
        {/* Top Action Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors shrink-0 text-white"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
              <BookOpen className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                Baca Qur'an
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Search Toggle Icon */}
            <button
              onClick={() => setIsSearchVisible(v => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isSearchVisible ? 'bg-white text-[#0f6b52]' : 'hover:bg-white/15 text-white'
              }`}
              title="Cari Surat atau Juz"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Quick Murottal / Sleep Timer */}
            <button
              onClick={() => {
                murottalPlayer.togglePlay();
                vibrateSuccess();
              }}
              className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center text-white transition-colors"
              title="Putar Murottal Latar"
            >
              <Headphones className="w-4 h-4" />
            </button>

            {/* 3-Dots Menu (Khatam Calculator, Log) */}
            <div className="relative">
              <button
                onClick={() => setShowExtraMenu(v => !v)}
                className="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center text-white transition-colors"
                title="Menu Lainnya"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showExtraMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowExtraMenu(false)} />
                  <div className="absolute right-0 top-11 z-40 w-48 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-xl border border-gray-200 dark:border-slate-700 p-2 space-y-1">
                    <button
                      onClick={() => {
                        setShowExtraMenu(false);
                        setIsKhatamModalOpen(true);
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Kalkulator Khatam</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowExtraMenu(false);
                        handleTabChange('hadis');
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Quote className="w-4 h-4 text-cyan-600" />
                      <span>Hadits Arba'in</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowExtraMenu(false);
                        handleTabChange('doa');
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-pink-600" />
                      <span>Doa Harian</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {isSearchVisible && (
          <div className="relative animate-in slide-in-from-top-2 duration-200">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ketik nama surah, nomor (misal 2 atau 36), atau juz..."
              value={quranSearch}
              onChange={(e) => setQuranSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-9 py-2 bg-white text-gray-900 rounded-xl text-xs sm:text-sm font-medium outline-none shadow-inner"
            />
            {quranSearch && (
              <button 
                onClick={() => setQuranSearch('')}
                className="w-7 h-7 absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* 3 Main Horizontal Tabs (SURAH, JUZ, BOOKMARK) */}
        <div className="flex border-b border-white/20 pt-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'surah'}
            onClick={() => handleTabChange('surah')}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold tracking-wider transition-colors relative uppercase text-center ${
              activeTab === 'surah' ? 'text-white' : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            SURAH
            {activeTab === 'surah' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4C4A8] rounded-full" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'juz'}
            onClick={() => handleTabChange('juz')}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold tracking-wider transition-colors relative uppercase text-center ${
              activeTab === 'juz' ? 'text-white' : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            JUZ
            {activeTab === 'juz' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4C4A8] rounded-full" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'bookmark'}
            onClick={() => handleTabChange('bookmark')}
            className={`flex-1 pb-2.5 text-xs sm:text-sm font-bold tracking-wider transition-colors relative uppercase text-center ${
              activeTab === 'bookmark' ? 'text-white' : 'text-emerald-100/70 hover:text-white'
            }`}
          >
            BOOKMARK {hancas.length > 0 && `(${hancas.length})`}
            {activeTab === 'bookmark' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#D4C4A8] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: SURAH LIST ======================= */}
      {activeTab === 'surah' && (
        <div className="space-y-1.5">
          {isLoadingSurahs ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredSurahs.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2">
              <Search className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Surah tidak ditemukan untuk "{quranSearch}"
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border-[1.5px] border-[#121212] dark:border-slate-700 shadow-[2px_2px_0px_#121212] overflow-hidden">
              {filteredSurahs.map((surah) => {
                const isOffline = !!offlineSurahsMap[surah.nomor.toString()];
                const isDownloading = downloadingSurahNomor === surah.nomor;

                return (
                  <div
                    key={surah.nomor}
                    onClick={() => openSurah(surah)}
                    className="p-3 sm:p-3.5 hover:bg-[#F9F8F5] dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    {/* Left: Islamic Star Badge SVG + Surah Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <IslamicStarBadge number={surah.nomor} className="w-9 h-9" />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                          {surah.namaLatin}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wide mt-0.5">
                          {surah.tempatTurun} | {surah.jumlahAyat} AYAT
                        </p>
                      </div>
                    </div>

                    {/* Right: Authentic Arabic Calligraphy + Download Button */}
                    <div className="flex items-center gap-3.5 shrink-0">
                      <span className="font-serif text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 block text-right">
                        {surah.nama}
                      </span>

                      {/* Download / Offline Indicator Icon (matches Screenshot 1) */}
                      <button
                        onClick={(e) => handleToggleOfflineSurah(surah, e)}
                        disabled={isDownloading}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isOffline
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-emerald-600'
                        }`}
                        title={isOffline ? "Surah sudah tersimpan offline (Klik untuk hapus)" : "Unduh surah untuk baca offline"}
                        aria-label="Unduh offline"
                      >
                        {isDownloading ? (
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                        ) : isOffline ? (
                          <Volume2 className="w-5 h-5" />
                        ) : (
                          <Download className="w-5 h-5 stroke-[1.8]" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: JUZ 1 - 30 (MATCHING SCREENSHOT 3) ======================= */}
      {activeTab === 'juz' && (
        <div className="space-y-1.5">
          <div className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-2xl border-[1.5px] border-[#121212] dark:border-slate-700 shadow-[2px_2px_0px_#121212] overflow-hidden">
            {filteredJuz.map((juz) => (
              <div
                key={juz.juz}
                onClick={() => {
                  const targetSurah = surahs.find(s => s.nomor === juz.surahNumber);
                  if (targetSurah) {
                    openSurah(targetSurah, juz.startAyah);
                  }
                }}
                className="p-3 sm:p-3.5 hover:bg-[#F9F8F5] dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
              >
                {/* Left: Star Badge + Juz Title & Starting Verse Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <IslamicStarBadge number={juz.juz} className="w-9 h-9" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                      Juz {juz.juz}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500 uppercase tracking-wide mt-0.5 truncate">
                      {juz.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 3: BOOKMARK / MULTI-HANCA ======================= */}
      {activeTab === 'bookmark' && (
        <div className="space-y-3.5">
          {/* Header Banner: Multi-Hanca Explainer & Add Button */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FCFAF5] dark:bg-slate-800/80 border-[1.5px] border-[#121212] dark:border-slate-700 shadow-[2px_2px_0px_#121212] flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                Penanda Terakhir Baca (Multi-Hanca)
              </h2>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                Simpan beberapa set hanca berbeda (misal Tilawah Harian, Tahfidz, Tadabbur).
              </p>
            </div>
            <button
              onClick={() => setIsCreatingNewHanca(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hanca Baru</span>
            </button>
          </div>

          {/* Form Create New Hanca */}
          {isCreatingNewHanca && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const title = newHancaTitle.trim() || `Hanca ${hancas.length + 1}`;
                const newSet: ReadingHancaItem = {
                  id: `hanca-${Date.now()}`,
                  name: title,
                  surahNumber: 1,
                  surahName: 'Al-Fatihah',
                  ayahNumber: 1,
                  updatedAt: new Date().toISOString()
                };
                storage.saveReadingHanca(newSet);
                setHancas(storage.getReadingHancas());
                setNewHancaTitle('');
                setIsCreatingNewHanca(false);
                vibrateSuccess();
              }}
              className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-emerald-300 dark:border-emerald-800 space-y-2.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  Buat Set Penanda Baru
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewHanca(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Contoh: Hafalan Juz 30, Tilawah Malam..."
                value={newHancaTitle}
                onChange={(e) => setNewHancaTitle(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNewHanca(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Set
                </button>
              </div>
            </form>
          )}

          {/* List of Saved Hancas */}
          {hancas.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2">
              <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-1" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Belum ada penanda hanca tersimpan
              </p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                Saat membaca ayat Al-Qur'an, ketuk ikon penanda (bookmark) pada ayat untuk menyimpan batas bacaan Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {hancas.map((hanca) => (
                <div
                  key={hanca.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-emerald-400 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <Bookmark className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                          {hanca.name}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                          {new Date(hanca.updatedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        storage.deleteReadingHanca(hanca.id);
                        setHancas(storage.getReadingHancas());
                        vibrateSuccess();
                      }}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg"
                      title="Hapus Penanda Ini (Unbookmark)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                      Posisi Terakhir:
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      QS {hanca.surahName} : Ayat {hanca.ayahNumber}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const surahObj = surahs.find(s => s.nomor === hanca.surahNumber);
                      if (surahObj) {
                        openSurah(surahObj, hanca.ayahNumber);
                      }
                    }}
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Lanjut Membaca &rarr;</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick link to Ayat Favorit & Tadabbur */}
          {favoriteAyahs.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
                Ayat Favorit & Catatan Tadabbur ({favoriteAyahs.length})
              </span>
              <div className="space-y-2">
                {favoriteAyahs.slice(0, 3).map(fav => (
                  <div 
                    key={fav.id}
                    onClick={() => {
                      const s = surahs.find(item => item.nomor === fav.surahNumber);
                      if (s) openSurah(s, fav.ayahNumber);
                    }}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-emerald-400 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">
                        QS {fav.surahName} : Ayat {fav.ayahNumber}
                      </span>
                      {fav.note && (
                        <p className="text-[11px] text-gray-500 italic truncate max-w-xs mt-0.5">
                          "{fav.note}"
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600">Buka &rarr;</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 4: HADITS ARBA'IN ======================= */}
      {activeTab === 'hadis' && (
        <div className="space-y-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
            <span className="font-bold text-xs text-emerald-950 dark:text-emerald-100">
              42 Hadits Pilihan Arba'in An-Nawawi (API MyQuran)
            </span>
            <button
              onClick={() => handleTabChange('surah')}
              className="text-xs text-emerald-700 dark:text-emerald-300 font-bold hover:underline"
            >
              &larr; Ke Al-Qur'an
            </button>
          </div>
          {/* List hadis */}
          {isLoadingHadiths ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {hadiths.slice(0, 42).map(h => (
                <div key={h.no} className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Hadits #{h.no}: {h.judul}
                    </span>
                  </div>
                  <p className="text-right font-serif text-lg leading-loose text-gray-900 dark:text-white" dir="rtl">
                    {h.arab}
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-[#F9F8F5] dark:bg-slate-800 p-2.5 rounded-xl">
                    "{h.indo}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 5: DOA KEMENAG ======================= */}
      {activeTab === 'doa' && (
        <div className="space-y-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
            <span className="font-bold text-xs text-emerald-950 dark:text-emerald-100">
              Koleksi Doa Sehari-hari Kemenag RI
            </span>
            <button
              onClick={() => handleTabChange('surah')}
              className="text-xs text-emerald-700 dark:text-emerald-300 font-bold hover:underline"
            >
              &larr; Ke Al-Qur'an
            </button>
          </div>
          {doas.slice(0, 30).map((d, idx) => (
            <div key={d.id || idx} className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-gray-900 dark:text-white">{d.doa}</h4>
              <p className="text-right font-serif text-lg leading-loose text-gray-900 dark:text-white" dir="rtl">
                {d.ayat}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 bg-[#F9F8F5] dark:bg-slate-800 p-2.5 rounded-xl">
                "{d.artinya}"
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ======================= SURAH READER FULLSCREEN / DRAWER ======================= */}
      {selectedSurah && (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200 ${
          isFullscreen ? 'p-0' : ''
        }`}>
          <div className={`w-full h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 ${
            isFullscreen ? 'max-w-none' : 'max-w-2xl'
          } ${
            readerTheme === 'sepia' 
              ? 'bg-[#F4EEDD] text-[#2C2216]' 
              : readerTheme === 'dark' 
                ? 'bg-slate-900 text-slate-100' 
                : 'bg-[#F9F8F5] dark:bg-slate-900 text-[#121212] dark:text-slate-100'
          }`}>
            
            {/* Top Bar: Clean Emerald Header with Back, Title, Audio & Settings Gear (Matches Screenshot 2 & 4) */}
            <div className="h-14 px-3 bg-[#0f6b52] text-white flex items-center justify-between gap-2 shrink-0 sticky top-0 z-20 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => {
                    setSelectedSurah(null);
                    if (audioRef.current) audioRef.current.pause();
                    setPlayingAudio(null);
                    setIsFullscreen(false);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/15 text-white shrink-0 transition-colors"
                  aria-label="Tutup pembaca"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4 text-emerald-200" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate text-white">
                    {selectedSurah.namaLatin}
                  </h3>
                  <p className="text-[10px] text-emerald-100/80 truncate">
                    Surah {selectedSurah.nomor} • Juz {getJuzForSurahAyah(selectedSurah.nomor)}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Download Murottal, Surah Audio Play, and Reader Settings Gear */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Full Surah Murottal Audio */}
                {selectedSurah.audioFull?.['05'] && (
                  <button
                    onClick={() => toggleAudio(selectedSurah.audioFull!['05'])}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                    title={playingAudio === selectedSurah.audioFull['05'] ? 'Jeda Audio Surah' : 'Putar Audio Surah'}
                  >
                    {playingAudio === selectedSurah.audioFull['05'] ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                )}

                {/* Bookmark target surah tilawah modal */}
                <button
                  onClick={() => {
                    setLogModalProps({
                      surahNumber: selectedSurah.nomor,
                      surahName: selectedSurah.namaLatin,
                      totalAyah: selectedSurah.jumlahAyat,
                      startAyah: 1,
                      endAyah: selectedSurah.jumlahAyat
                    });
                    setIsLogModalOpen(true);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                  title="Catat Tilawah"
                >
                  <BookOpen className="w-4 h-4" />
                </button>

                {/* Reader Settings Gear Button */}
                <button
                  onClick={() => setIsReaderSettingsOpen(true)}
                  aria-label="Pengaturan tampilan huruf & teks"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                  title="Pengaturan Huruf & Teks"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-Header Bar: Surah X : Nama on Left, Juz Y on Right (Matches Screenshot 2) */}
            <div className={`px-4 py-2 border-b flex items-center justify-between text-xs font-bold shrink-0 ${
              readerTheme === 'sepia'
                ? 'bg-[#EADECA] text-[#4A3B2C] border-[#D8C7B0]'
                : 'bg-[#F3EDE2] dark:bg-slate-800 border-[#E6DCC8] dark:border-slate-700 text-[#7A5E35] dark:text-[#D4C4A8]'
            }`}>
              <span>Surah {selectedSurah.nomor}: {selectedSurah.namaLatin}</span>
              <span>Juz {getJuzForSurahAyah(selectedSurah.nomor)}</span>
            </div>

            {/* Horizontal Scrollable Surah Tab Strip (Matches Screenshot 4: 1. Al-Fatihah, 2. Al-Baqarah, ...) */}
            <div 
              ref={surahTabsContainerRef}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#0d5944] overflow-x-auto hide-scrollbar border-b border-[#0a4736] shrink-0"
            >
              {surahs.map((s) => {
                const isActive = s.nomor === selectedSurah.nomor;
                return (
                  <button
                    key={s.nomor}
                    id={`surah-tab-${s.nomor}`}
                    onClick={() => {
                      if (s.nomor !== selectedSurah.nomor) {
                        openSurah(s);
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? 'bg-white text-[#0f6b52] shadow-xs scale-100'
                        : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {s.nomor}. {s.namaLatin}
                  </button>
                );
              })}
            </div>

            {/* Content Container (Scrollable) */}
            <div className="flex-1 overflow-y-auto pb-24">
              {/* Decorative Surah Header Frame with Cartouche */}
              <div className="px-3 sm:px-5 pt-2">
                <SurahHeaderFrame surah={selectedSurah} />
              </div>

              {/* Bismillah banner (unless At-Taubah #9 and Al-Fatihah #1) */}
              {selectedSurah.nomor !== 9 && selectedSurah.nomor !== 1 && (
                <div className="text-center py-2 text-xl sm:text-2xl font-serif font-normal text-emerald-900 dark:text-emerald-300">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}

              {isLoadingAyahs ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : ayahs.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3 bg-white dark:bg-slate-800 m-4 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center font-bold text-base">
                    📖
                  </div>
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Ayat belum tampil atau sedang memuat...
                  </h4>
                  <button
                    onClick={() => openSurah(selectedSurah)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 inline-flex items-center gap-2"
                  >
                    <span>Muat Ulang Ayat</span>
                  </button>
                </div>
              ) : readingMode === 'mushaf' ? (
                /* ======================= MODE MUSHAF KONTINU (TEXT-JUSTIFY) ======================= */
                <div className="p-4 sm:p-6 mx-3 my-2 bg-white dark:bg-slate-800 border border-[#E6DCC8] dark:border-slate-700 rounded-2xl shadow-xs space-y-4">
                  <div className="text-center pb-2 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">📖 Mushaf Al-Qur'an</span>
                    <span className="text-[11px] text-gray-400">Ketuk nomor ayat untuk Tafsir</span>
                  </div>

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
                            title={`Tafsir Ayat ${a.nomorAyat}`}
                          >
                            {tajweedEnabled ? (
                              <span dangerouslySetInnerHTML={{ __html: renderTajweedHtml(a.teksArab) }} />
                            ) : (
                              a.teksArab
                            )}
                          </span>
                          {/* Circular Ayah End Ornament */}
                          <button
                            type="button"
                            onClick={() => handleOpenTafsir(selectedSurah, a)}
                            className="inline-flex items-center justify-center mx-1.5 w-6 h-6 rounded-full border border-[#C4A882] dark:border-slate-600 bg-[#FCFAF5] dark:bg-slate-900 text-gray-800 dark:text-gray-200 text-[11px] font-serif font-medium align-middle hover:scale-110 active:scale-95 transition-all shadow-2xs"
                            title={`Tafsir Ayat ${a.nomorAyat}`}
                          >
                            {toArabicNumerals(a.nomorAyat)}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Transliteration & Translation list in mushaf mode */}
                  {(showLatin || showTranslation) && (
                    <div className="pt-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
                      {ayahs.map((a) => (
                        <div 
                          key={a.nomorAyat} 
                          onClick={() => handleOpenTafsir(selectedSurah, a)}
                          className="p-3 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1 cursor-pointer hover:border-emerald-500 transition-colors"
                        >
                          <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                            Ayat {a.nomorAyat}
                          </span>
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
              ) : (
                /* ======================= MODE PER AYAT ZEBRA-STRIPING (MATCHES SCREENSHOT 4) ======================= */
                <div className="divide-y divide-[#EBE4D5] dark:divide-slate-800 border-t border-b border-[#EBE4D5] dark:border-slate-800">
                  {ayahs.map((ayah, index) => {
                    const ayahId = `${selectedSurah.nomor}:${ayah.nomorAyat}`;
                    const isFav = storage.isAyahFavorite(ayahId);
                    const isBookmarkedInHanca = hancas.some(
                      h => h.surahNumber === selectedSurah.nomor && h.ayahNumber === ayah.nomorAyat
                    );
                    
                    // Zebra alternating background or active Murottal reciting highlight
                    const isEven = index % 2 === 1;
                    const isReciting = playingAyahNumber === ayah.nomorAyat;
                    
                    let rowBgClass = '';
                    if (isReciting) {
                      rowBgClass = readerTheme === 'sepia'
                        ? 'bg-[#E7DCBA] ring-2 ring-amber-700/80 border-l-[4px] border-l-amber-700'
                        : 'bg-emerald-50 dark:bg-emerald-950/70 ring-2 ring-emerald-500/80 border-l-[4px] border-l-emerald-600';
                    } else if (readerTheme === 'sepia') {
                      rowBgClass = isEven ? 'bg-[#FAF5E8]' : 'bg-[#F4EEDD]';
                    } else {
                      rowBgClass = isEven 
                        ? 'bg-[#FAF7EE] dark:bg-slate-800/60' 
                        : 'bg-white dark:bg-slate-900';
                    }

                    return (
                      <div
                        key={ayah.nomorAyat}
                        id={`ayah-${ayah.nomorAyat}`}
                        className={`p-3 sm:p-4 transition-all duration-150 ${rowBgClass}`}
                      >
                        {/* Top: Star Badge on Left + Arabic Verse on Right with End Ayah Marker */}
                        <div className="flex items-start justify-between gap-2.5 mb-2">
                          {/* Authentic Islamic 8-Pointed Star Badge */}
                          <div className="pt-0.5 shrink-0">
                            <IslamicStarBadge 
                              number={ayah.nomorAyat} 
                              className="w-7 h-7 sm:w-8 sm:h-8" 
                              active={isBookmarkedInHanca || isReciting}
                            />
                          </div>

                          {/* Arabic Text with Circular End Ayah Marker */}
                          {showArabic && (
                            <div 
                              onClick={() => handleOpenTafsir(selectedSurah, ayah)}
                              className={`flex-1 text-right font-serif font-normal leading-[2.1] sm:leading-[2.4] pr-0.5 cursor-pointer hover:opacity-90 transition-opacity ${
                                readerTheme === 'sepia' ? 'text-[#1F170D]' : 'text-gray-900 dark:text-white'
                              }`} 
                              style={{ fontSize: `${quranFontSize}px` }}
                              dir="rtl"
                              title="Ketuk ayat untuk membaca Tafsir Kemenag RI"
                            >
                              {tajweedEnabled ? (
                                <span dangerouslySetInnerHTML={{ __html: renderTajweedHtml(ayah.teksArab) }} />
                              ) : (
                                <span>{ayah.teksArab}</span>
                              )}
                              {/* End of Verse Circle */}
                              <span 
                                className="inline-flex items-center justify-center mx-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#C4A882] dark:border-slate-600 bg-[#FCFAF5] dark:bg-slate-900 text-gray-800 dark:text-gray-200 text-[10px] sm:text-[11px] font-serif font-medium select-none align-middle"
                                title={`Ayat ${ayah.nomorAyat}`}
                              >
                                {toArabicNumerals(ayah.nomorAyat)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Latin Transliteration if enabled */}
                        {showLatin && ayah.teksLatin && (
                          <p className={`text-[11.5px] sm:text-[12.5px] italic font-medium mb-1 pl-8 sm:pl-10 ${
                            readerTheme === 'sepia' ? 'text-amber-900' : 'text-emerald-800 dark:text-emerald-300'
                          }`}>
                            {ayah.teksLatin}
                          </p>
                        )}

                        {/* Indonesian Translation */}
                        {showTranslation && ayah.teksIndonesia && (
                          <p className={`text-[12px] sm:text-[13px] leading-relaxed font-normal mb-2 pl-8 sm:pl-10 ${
                            readerTheme === 'sepia' ? 'text-[#3E2F1B]' : 'text-teal-800 dark:text-teal-200'
                          }`}>
                            {ayah.teksIndonesia}
                          </p>
                        )}

                        {/* Compact 4-Action Button Cluster on the Right (Play, Tafsir, Favorit, Bookmark) */}
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                          {/* 1. Play Audio (Continuous Qari Voice with Auto-Scroll) */}
                          {ayah.audio && (
                            <button
                              onClick={() => playAyahAudio(ayah.nomorAyat)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                isReciting
                                  ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                  : 'text-gray-500 hover:text-emerald-700 hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                              title={isReciting ? "Jeda Audio" : "Putar Audio Murottal Ayat Ini"}
                            >
                              {isReciting ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* 2. Tafsir Kemenag RI */}
                          <button
                            onClick={() => handleOpenTafsir(selectedSurah, ayah)}
                            className="h-7 px-2 rounded-lg text-gray-500 hover:text-amber-700 hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-semibold flex items-center gap-1 transition-all"
                            title="Baca Tafsir Ringkas Kemenag RI"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Tafsir</span>
                          </button>

                          {/* 3. Favorite / Heart (adds/removes from saved tab) */}
                          <button
                            onClick={() => handleToggleFavoriteAyah(ayah)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isFav
                                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                                : 'text-gray-500 hover:text-rose-600 hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                            title={isFav ? "Hapus dari Favorit" : "Tandai Favorit"}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current text-rose-600' : ''}`} />
                          </button>

                          {/* 4. Bookmark (Multi-Hanca & Unbookmark) */}
                          <button
                            onClick={() => setHancaModalTarget({ surah: selectedSurah, ayah })}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              isBookmarkedInHanca
                                ? 'bg-emerald-700 text-white shadow-2xs'
                                : 'text-gray-500 hover:text-emerald-700 hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                            title={isBookmarkedInHanca ? "Kelola Penanda Hanca (Unbookmark)" : "Tandai Batas Bacaan (Hanca)"}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isBookmarkedInHanca ? 'fill-white' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL HANCA BOOKMARK (TANDAI / UNBOOKMARK) ======================= */}
      {hancaModalTarget && (
        <HancaBookmarkModal
          isOpen={!!hancaModalTarget}
          onClose={() => setHancaModalTarget(null)}
          surah={hancaModalTarget.surah}
          ayah={hancaModalTarget.ayah}
          onSuccess={() => setHancas(storage.getReadingHancas())}
        />
      )}

      {/* ======================= MODAL READER SETTINGS (LATIN, ARTI, PRESET A-- S/D A++, QARI, SEPIA) ======================= */}
      <QuranReaderSettingsModal
        isOpen={isReaderSettingsOpen}
        onClose={() => setIsReaderSettingsOpen(false)}
        showLatin={showLatin}
        toggleShowLatin={toggleShowLatin}
        showTranslation={showTranslation}
        toggleShowTranslation={toggleShowTranslation}
        quranFontSize={quranFontSize}
        setFontSizePreset={setFontSizePreset}
        readingMode={readingMode}
        toggleReadingMode={toggleReadingMode}
        isFullscreen={isFullscreen}
        toggleFullscreen={() => setIsFullscreen(v => !v)}
        readerTheme={readerTheme}
        setReaderTheme={handleSetReaderTheme}
        selectedQari={selectedQari}
        setSelectedQari={handleSetSelectedQari}
        autoScroll={autoScroll}
        toggleAutoScroll={toggleAutoScroll}
        tajweedEnabled={tajweedEnabled}
        toggleTajweed={toggleTajweed}
      />

      {/* ======================= BOTTOM SHEET TAFSIR KEMENAG RI ======================= */}
      {selectedTafsir && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Tafsir Kemenag RI"
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                    Tafsir Ringkas Kemenag RI
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    QS. {selectedTafsir.surah.namaLatin} : Ayat {selectedTafsir.ayah.nomorAyat}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTafsir(null)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-right font-serif text-lg leading-loose text-gray-900 dark:text-white" dir="rtl">
                  {selectedTafsir.ayah.teksArab}
                </p>
                <p className="text-xs text-teal-800 dark:text-teal-200 mt-2 font-normal">
                  "{selectedTafsir.ayah.teksIndonesia}"
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block uppercase tracking-wide">
                  Uraian Tafsir:
                </span>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">
                  {selectedTafsir.tafsirText}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-slate-800 shrink-0">
              <button
                onClick={() => setSelectedTafsir(null)}
                className="w-full py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-colors"
              >
                Tutup Tafsir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <KhatamCalculatorModal
        isOpen={isKhatamModalOpen}
        onClose={() => setIsKhatamModalOpen(false)}
      />

      <QuranLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        {...logModalProps}
      />
    </div>
  );
}
