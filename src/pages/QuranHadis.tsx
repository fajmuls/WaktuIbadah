import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BookOpen, Search, Play, Pause, Volume2, Bookmark, Check, Copy, 
  ChevronRight, X, Sparkles, Heart, Download, CheckCircle2,
  Trash2, ExternalLink, Share2, Compass, Headphones, Moon
} from 'lucide-react';
import { SurahItem, AyatItem, HadithArbain, FavoriteAyah, FavoriteHadith } from '../types';
import { storage } from '../lib/storage';
import { vibrateSuccess } from '../lib/audio';
import { murottalPlayer } from '../lib/murottal';
import { QuranLogModal } from '../components/QuranLogModal';
import { KhatamCalculatorModal } from '../components/KhatamCalculatorModal';

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
  const [lastReadSurah, setLastReadSurah] = useState<{ number: number; name: string; lastAyah?: number } | null>(() => {
    try {
      const saved = localStorage.getItem('wi_last_read');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

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

  // --- FAVORITES STATE ---
  const [favoriteAyahs, setFavoriteAyahs] = useState<FavoriteAyah[]>(storage.getFavoriteAyahs());
  const [favoriteHadiths, setFavoriteHadiths] = useState<FavoriteHadith[]>(storage.getFavoriteHadiths());
  const [favSubTab, setFavSubTab] = useState<'ayah' | 'hadith'>('ayah');

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

  // Open Surah Detail with Offline Caching check
  const openSurah = async (surah: SurahItem, targetAyah?: number) => {
    setSelectedSurah(surah);
    setIsLoadingAyahs(true);
    setAyahs([]);

    // Check offline cache first
    const offlineData = storage.getOfflineSurahData(surah.nomor);
    if (offlineData && offlineData.ayahs && offlineData.ayahs.length > 0) {
      setAyahs(offlineData.ayahs);
      setIsLoadingAyahs(false);
      // Save last read
      const record = { number: surah.nomor, name: surah.namaLatin, lastAyah: targetAyah || 1 };
      setLastReadSurah(record);
      localStorage.setItem('wi_last_read', JSON.stringify(record));
      return;
    }

    try {
      const res = await fetch(`https://equran.id/api/v2/surat/${surah.nomor}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.ayat) {
          setAyahs(json.data.ayat);
        }
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
        // Fetch and save
        try {
          const res = await fetch(`https://equran.id/api/v2/surat/${surah.nomor}`);
          if (res.ok) {
            const json = await res.json();
            if (json.data?.ayat) {
              storage.saveOfflineSurah(surah, json.data.ayat);
              setOfflineSurahsMap(storage.getOfflineSurahs());
              vibrateSuccess();
            }
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
      storage.removeFavoriteAyah(ayahId);
    } else {
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

  // Quick read bookmark
  const handleMarkAyahRead = (ayahNumber: number) => {
    if (!selectedSurah) return;
    setLogModalProps({
      surahNumber: selectedSurah.nomor,
      surahName: selectedSurah.namaLatin,
      totalAyah: selectedSurah.jumlahAyat,
      startAyah: 1,
      endAyah: ayahNumber
    });
    setIsLogModalOpen(true);
  };

  // Audio Handler
  const toggleAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      audioRef.current?.pause();
      setPlayingAudio(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
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
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Al-Qur'an & Hadis
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Baca firman Allah & hadits dengan penanda nomor ayat, audio murottal, dan penyimpanan offline
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => handleTabChange('quran')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'quran'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            Al-Qur'an
          </button>
          <button
            onClick={() => handleTabChange('hadis')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'hadis'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            Hadits Arba'in
          </button>
          <button
            onClick={() => handleTabChange('favorit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'favorit'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>Tersimpan ({favoriteAyahs.length + favoriteHadiths.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('doa')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'doa'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            Doa Kemenag
          </button>
          <button
            onClick={() => setIsKhatamModalOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 whitespace-nowrap shadow-xs ml-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Target Khatam</span>
          </button>
          <button
            onClick={() => {
              murottalPlayer.togglePlay();
              vibrateSuccess();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap shadow-xs ml-1"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Putar Murottal 30 Juz</span>
          </button>
        </div>
      </header>

      {/* ======================= TAB 1: AL-QUR'AN ======================= */}
      {activeTab === 'quran' && (
        <div className="space-y-4">
          {/* Quick Target Khatam Banner */}
          {(() => {
            const target = storage.getKhatamTarget();
            if (!target) return null;
            const relevantLogs = storage.getQuranLogs().filter(q => q.date >= target.startDate);
            const totalRead = relevantLogs.reduce((acc, q) => acc + (q.totalAyat || 0), 0);
            const pct = Math.min(100, Math.round((totalRead / 6236) * 100));
            return (
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800/80 rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-600 text-white rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                        {target.title}
                      </span>
                      <span className="text-[10px] font-semibold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded-md">
                        {pct}% Tercapai
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
                      Sudah dibaca <strong>{totalRead}</strong> dari 6.236 Ayat (~{(totalRead / 208).toFixed(1)} Juz)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsKhatamModalOpen(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors self-start sm:self-auto shadow-xs"
                >
                  Lihat Hitungan Target
                </button>
              </div>
            );
          })()}

          {/* Last Read & Quick Surah Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Last read card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md inline-block mb-1.5">
                  Terakhir Dibaca
                </span>
                {lastReadSurah ? (
                  <div>
                    <h3 className="text-base font-bold">
                      Surah {lastReadSurah.name}
                    </h3>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      {lastReadSurah.lastAyah ? `Sampai Ayat ke-${lastReadSurah.lastAyah}` : 'Klik untuk melanjutkan baca'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-bold">Al-Fatihah</h3>
                    <p className="text-xs text-emerald-100 mt-0.5">Mulai membaca surat pertama</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  const num = lastReadSurah?.number || 1;
                  const surahObj = surahs.find(s => s.nomor === num);
                  if (surahObj) openSurah(surahObj, lastReadSurah?.lastAyah);
                }}
                className="px-3 py-1.5 bg-white text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors shadow-xs shrink-0"
              >
                Lanjut Baca
              </button>
            </div>

            {/* Quick Surat Pilihan & Offline Shortcuts */}
            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-xs flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Surat Sering Dibaca (Bisa Offline)
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {Object.keys(offlineSurahsMap).length} Tersimpan Offline
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSurahs.map((ps) => {
                  const isSaved = !!offlineSurahsMap[ps.no.toString()];
                  return (
                    <button
                      key={ps.no}
                      onClick={() => {
                        const s = surahs.find(item => item.nomor === ps.no);
                        if (s) openSurah(s);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                        isSaved
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      <span>{ps.name}</span>
                      {isSaved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari surat atau nomor surat (contoh: Al-Baqarah, Yasin, 18)..."
              value={quranSearch}
              onChange={(e) => setQuranSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs sm:text-sm text-gray-900 dark:text-white shadow-xs transition-all"
            />
          </div>

          {/* Surah List */}
          {isLoadingSurahs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredSurahs.map((surah) => {
                const isOffline = !!offlineSurahsMap[surah.nomor.toString()];
                return (
                  <div
                    key={surah.nomor}
                    onClick={() => openSurah(surah)}
                    className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-xs hover:shadow-md hover:border-emerald-400/50 transition-all cursor-pointer group flex items-center justify-between relative"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center border border-emerald-100 dark:border-emerald-900 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-xs">
                        {surah.nomor}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors text-xs sm:text-sm">
                            {surah.namaLatin}
                          </h3>
                          {isOffline && (
                            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1 py-0.2 rounded font-semibold">
                              Offline
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {surah.arti} • {surah.jumlahAyat} Ayat
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          murottalPlayer.setSurah(surah.nomor, true);
                          vibrateSuccess();
                        }}
                        className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
                        title={`Putar Audio QS ${surah.namaLatin}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div className="text-right">
                        <span className="font-serif text-base font-bold text-gray-700 dark:text-gray-200">
                          {surah.nama}
                        </span>
                        <span className="block text-[10px] text-gray-400 capitalize">
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
            <div>
              {favoriteAyahs.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Belum ada ayat favorit</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Buka surat di Al-Qur'an dan klik ikon hati pada ayat yang ingin Anda simpan.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteAyahs.map((fav) => (
                    <div
                      key={fav.id}
                      className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg">
                          Surah {fav.surahName} : Ayat {fav.ayahNumber}
                        </span>
                        <button
                          onClick={() => {
                            storage.removeFavoriteAyah(fav.id);
                            setFavoriteAyahs(storage.getFavoriteAyahs());
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Hapus dari tersimpan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Arabic with end-of-ayah circular indicator */}
                      <div className="text-right font-serif text-xl sm:text-2xl leading-[2.5] text-gray-900 dark:text-gray-100 pr-1" dir="rtl">
                        <span>{fav.arab}</span>
                        <span className="inline-flex items-center justify-center mx-2 w-7 h-7 rounded-full border border-emerald-500/70 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-serif font-bold align-middle">
                          {toArabicNumerals(fav.ayahNumber)}
                        </span>
                      </div>

                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium italic">
                        {fav.latin}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl">
                        "{fav.translation}"
                      </p>
                    </div>
                  ))}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-emerald-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-base">
                  {selectedSurah.nomor}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {selectedSurah.namaLatin} ({selectedSurah.nama})
                  </h3>
                  <p className="text-xs text-white/80">
                    {selectedSurah.arti} • {selectedSurah.jumlahAyat} Ayat • {selectedSurah.tempatTurun}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Offline Cache Button */}
                <button
                  onClick={(e) => handleToggleOfflineSurah(selectedSurah, e)}
                  className={`p-2 rounded-xl transition-colors ${
                    storage.isSurahOffline(selectedSurah.nomor)
                      ? 'bg-amber-400 text-emerald-950 font-bold'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                  title={storage.isSurahOffline(selectedSurah.nomor) ? "Tersimpan Offline" : "Simpan untuk Dibaca Tanpa Kuota"}
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Audio Murottal */}
                {selectedSurah.audioFull?.['05'] && (
                  <button
                    onClick={() => toggleAudio(selectedSurah.audioFull!['05'])}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                    title={playingAudio === selectedSurah.audioFull['05'] ? 'Jeda Audio' : 'Putar Murottal'}
                  >
                    {playingAudio === selectedSurah.audioFull['05'] ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                )}

                {/* Catat Tilawah Quick Button */}
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
                  className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold flex items-center gap-1"
                  title="Catat Tilawah"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Catat Tilawah</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setSelectedSurah(null);
                    if (audioRef.current) audioRef.current.pause();
                    setPlayingAudio(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ayah List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Bismillah banner (unless At-Taubah #9) */}
              {selectedSurah.nomor !== 9 && selectedSurah.nomor !== 1 && (
                <div className="text-center py-3 text-xl sm:text-2xl font-serif font-bold text-emerald-700 dark:text-emerald-400">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}

              {isLoadingAyahs ? (
                <div className="space-y-4 py-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                ayahs.map((ayah) => {
                  const ayahId = `${selectedSurah.nomor}:${ayah.nomorAyat}`;
                  const isFav = storage.isAyahFavorite(ayahId);

                  return (
                    <div
                      key={ayah.nomorAyat}
                      id={`ayah-${ayah.nomorAyat}`}
                      className="bg-gray-50/70 dark:bg-gray-800/60 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700/70 space-y-3.5"
                    >
                      {/* Ayah Action Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">
                            {ayah.nomorAyat}
                          </span>
                          <button
                            onClick={() => handleMarkAyahRead(ayah.nomorAyat)}
                            className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="Tandai telah dibaca s/d ayat ini"
                          >
                            <Bookmark className="w-3 h-3" />
                            <span>Tandai Baca</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Favorite Ayah */}
                          <button
                            onClick={() => handleToggleFavoriteAyah(ayah)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isFav 
                                ? 'text-red-500 bg-red-50 dark:bg-red-950/50' 
                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={isFav ? "Hapus dari Favorit" : "Simpan Ayat"}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500' : ''}`} />
                          </button>

                          {/* Audio */}
                          {ayah.audio?.['05'] && (
                            <button
                              onClick={() => toggleAudio(ayah.audio!['05'])}
                              className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-emerald-600 flex items-center gap-1 p-1 rounded-md"
                            >
                              {playingAudio === ayah.audio['05'] ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Dengar</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Arabic Text WITH AUTHENTIC CIRCULAR AYAH NUMBER INDICATOR AT THE END OF AYAH */}
                      <div className="text-right font-serif text-2xl sm:text-3xl leading-[2.5] sm:leading-[2.8] text-gray-900 dark:text-gray-100 pr-2" dir="rtl">
                        <span>{ayah.teksArab}</span>
                        {/* Circular Ayat Indicator Ornament (ayah number in Arabic digits) */}
                        <span 
                          className="inline-flex items-center justify-center mx-2 w-8 h-8 rounded-full border-2 border-emerald-600/70 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-sm font-serif font-bold shadow-xs select-none align-middle"
                          title={`Ayat ${ayah.nomorAyat}`}
                        >
                          <span className="text-xs">{toArabicNumerals(ayah.nomorAyat)}</span>
                        </span>
                      </div>

                      {/* Latin Transliteration */}
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium italic">
                        {ayah.teksLatin}
                      </p>

                      {/* Indonesian Translation */}
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        {ayah.teksIndonesia}
                      </p>
                    </div>
                  );
                })
              )}
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
    </div>
  );
}
