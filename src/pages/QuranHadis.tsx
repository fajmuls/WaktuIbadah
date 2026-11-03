import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  BookOpen, Search, Play, Pause, Volume2, Bookmark, Check, Copy, 
  ChevronRight, X, Sparkles, Heart, Download, CheckCircle2,
  Trash2, ExternalLink, Share2, Compass, Headphones, Moon,
  Quote, Tag, Eye
} from 'lucide-react';
import { SurahItem, AyatItem, HadithArbain, FavoriteAyah, FavoriteHadith } from '../types';
import { storage } from '../lib/storage';
import { vibrateSuccess, playQuranSound } from '../lib/audio';
import { murottalPlayer } from '../lib/murottal';
import { QuranLogModal } from '../components/QuranLogModal';
import { KhatamCalculatorModal } from '../components/KhatamCalculatorModal';
import { TadabburBookmarkModal } from '../components/TadabburBookmarkModal';
import { getSurahAyahs } from '../lib/quran-api';

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
    <div className="space-y-4 pb-20 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* Memphis Header */}
      <header className="p-3.5 sm:p-4 bg-white border-2 border-[#121212] rounded-2xl shadow-[3px_3px_0px_#121212] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#121212]">
            Al-Qur'an & Hadis
          </h1>
          <p className="text-gray-600 text-xs font-bold mt-0.5">
            Baca firman Allah & hadits dengan penanda nomor ayat, audio murottal, dan penyimpanan offline
          </p>
        </div>

        {/* Tab Toggle (Memphis Style) */}
        <div className="flex p-1 rounded-xl border-2 border-black bg-white shadow-[2px_2px_0px_#121212] self-start sm:self-auto overflow-x-auto max-w-full gap-1">
          <button
            onClick={() => handleTabChange('quran')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'quran'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 text-black shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Al-Qur'an
          </button>
          <button
            onClick={() => handleTabChange('hadis')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'hadis'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 text-black shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Hadits Arba'in
          </button>
          <button
            onClick={() => handleTabChange('favorit')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'favorit'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 text-black shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>Tersimpan ({favoriteAyahs.length + favoriteHadiths.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('doa')}
            className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'doa'
                ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 text-black shadow-xs'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            Doa
          </button>
          <button
            onClick={() => setIsKhatamModalOpen(true)}
            className="memphis-btn memphis-btn-white px-2 py-0.5 text-[10px] uppercase font-black gap-1 whitespace-nowrap"
          >
            <Sparkles className="w-3 h-3 text-teal-600" />
            <span>Target Khatam</span>
          </button>
          <button
            onClick={() => {
              murottalPlayer.togglePlay();
              vibrateSuccess();
            }}
            className="memphis-btn memphis-btn-green px-2 py-0.5 text-[10px] uppercase font-black gap-1 whitespace-nowrap"
          >
            <Headphones className="w-3 h-3" />
            <span>Murottal</span>
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
              <div className="memphis-card p-3 sm:p-3.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-[3px_3px_0px_#121212]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-black text-[#6EE7B7] rounded-xl border border-black flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-black uppercase tracking-tight">
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
                  className="memphis-btn memphis-btn-white px-3 py-1 text-xs font-black uppercase tracking-wider self-start sm:self-auto"
                >
                  Hitungan Target
                </button>
              </div>
            );
          })()}

          {/* Last Read & Quick Surah Banner (Compact Mobile Scale) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Last read card */}
            <div className="memphis-card p-3 sm:p-4 bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white shadow-[3px_3px_0px_#121212] flex items-center justify-between">
              <div>
                <span className="memphis-badge bg-white text-black text-[9px] mb-1">
                  Terakhir Dibaca
                </span>
                {lastReadSurah ? (
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">
                      Surah {lastReadSurah.name}
                    </h3>
                    <p className="text-[11px] font-bold text-emerald-200 mt-0.5">
                      {lastReadSurah.lastAyah ? `Sampai Ayat ke-${lastReadSurah.lastAyah}` : 'Klik untuk melanjutkan'}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">Al-Fatihah</h3>
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
                className="memphis-btn memphis-btn-white px-2.5 py-1 text-xs font-black uppercase tracking-wider shrink-0"
              >
                Lanjut
              </button>
            </div>

            {/* Quick Surat Pilihan & Offline Shortcuts */}
            <div className="md:col-span-2 memphis-card p-3 sm:p-4 shadow-[3px_3px_0px_#121212] flex flex-col justify-center">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-wider">
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
                      className={`memphis-btn px-2.5 py-1 text-[11px] uppercase font-black gap-1 ${
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
              placeholder="Cari surat atau nomor surat (contoh: Al-Baqarah, Yasin, 18)..."
              value={quranSearch}
              onChange={(e) => setQuranSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 memphis-input text-xs sm:text-sm"
            />
          </div>

          {/* Surah List (Memphis Cards) */}
          {isLoadingSurahs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl border-2 border-black animate-pulse" />
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
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-400 border border-black text-black font-black flex items-center justify-center text-xs shrink-0 shadow-[1px_1px_0px_#121212]">
                        {surah.nomor}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate">
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
                                <Eye className="w-3.5 h-3.5" />
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
              ) : ayahs.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 mx-auto flex items-center justify-center font-bold text-lg">
                    📖
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    Ayat belum tampil atau terjadi kendala jaringan
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Sistem multi-sumber cadangan siap memuat ulang teks ayat surat {selectedSurah.namaLatin}.
                  </p>
                  <button
                    onClick={() => openSurah(selectedSurah)}
                    className="mt-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 inline-flex items-center gap-2"
                  >
                    <span>Muat Ulang Ayat Sekarang</span>
                  </button>
                </div>
              ) : (
                ayahs.map((ayah) => {
                  const ayahId = `${selectedSurah.nomor}:${ayah.nomorAyat}`;
                  const isFav = storage.isAyahFavorite(ayahId);
                  const isLastRead = lastReadMarker?.surahNumber === selectedSurah.nomor && lastReadMarker?.ayahNumber === ayah.nomorAyat;

                  return (
                    <div
                      key={ayah.nomorAyat}
                      id={`ayah-${ayah.nomorAyat}`}
                      className={`p-4 sm:p-5 rounded-2xl border-2 border-[#121212] shadow-[3px_3px_0px_#121212] space-y-3.5 transition-all ${
                        isLastRead 
                          ? 'bg-[#E6FFFA] border-emerald-800' 
                          : 'bg-[#FFFDF8] text-[#121212]'
                      }`}
                    >
                      {/* Ayah Action Row */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-[#121212] text-[#6EE7B7] text-xs font-black flex items-center justify-center shrink-0">
                            {ayah.nomorAyat}
                          </span>
                          
                          {/* BUTTON 1: Tandai Terakhir Baca (Single active marker) */}
                          <button
                            onClick={() => handleMarkAyahRead(ayah.nomorAyat)}
                            className={`px-2.5 py-1 rounded-lg border-2 border-black text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                              isLastRead
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[2px_2px_0px_#121212]'
                                : 'bg-white hover:bg-emerald-50 text-gray-800 shadow-[1.5px_1.5px_0px_#121212]'
                            }`}
                            title="Set sebagai posisi terakhir dibaca"
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isLastRead ? 'fill-white' : ''}`} />
                            <span>{isLastRead ? '📌 Terakhir Dibaca' : 'Tandai Baca'}</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* BUTTON 2: Simpan Favorit & Catatan Tadabbur */}
                          {(() => {
                            const b = favoriteAyahs.find(f => f.id === ayahId);
                            const categoryColorClasses: Record<string, string> = {
                              Hafalan: 'bg-emerald-400 text-black border-black',
                              Doa: 'bg-[#FFE600] text-black border-black',
                              Motivasi: 'bg-[#00F0FF] text-black border-black',
                              Tadabbur: 'bg-[#FF4B91] text-white border-black'
                            };

                            if (b) {
                              const badgeStyle = categoryColorClasses[b.category || 'Tadabbur'] || categoryColorClasses.Tadabbur;
                              return (
                                <button
                                  onClick={() => setBookmarkModalTarget({ surah: selectedSurah, ayah })}
                                  className={`px-2.5 py-1 rounded-lg border-2 text-[11px] font-black flex items-center gap-1 transition-transform active:scale-95 shadow-[1.5px_1.5px_0px_#121212] ${badgeStyle}`}
                                  title="Edit Kategori & Catatan Tadabbur"
                                >
                                  <Heart className="w-3.5 h-3.5 fill-current" />
                                  <span>⭐ {b.category || 'Favorit'}</span>
                                </button>
                              );
                            }

                            return (
                              <button
                                onClick={() => setBookmarkModalTarget({ surah: selectedSurah, ayah })}
                                className="memphis-btn memphis-btn-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wider gap-1"
                                title="Simpan ke Ayat Favorit"
                              >
                                <Heart className="w-3.5 h-3.5 text-rose-500" />
                                <span>Simpan Favorit</span>
                              </button>
                            );
                          })()}

                          {/* Audio Player */}
                          {ayah.audio?.['05'] && (
                            <button
                              onClick={() => toggleAudio(ayah.audio!['05'])}
                              className="memphis-btn memphis-btn-white px-2 py-1 text-[11px] font-black uppercase gap-1"
                            >
                              {playingAudio === ayah.audio['05'] ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 text-[#121212]" />
                                  <span>Dengar</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Arabic Text WITH AUTHENTIC CIRCULAR AYAH NUMBER INDICATOR AT THE END OF AYAH */}
                      <div className="text-right font-serif text-2xl sm:text-3xl leading-[2.5] sm:leading-[2.8] text-[#121212] font-bold pr-2" dir="rtl">
                        <span>{ayah.teksArab}</span>
                        {/* Circular Ayat Indicator Ornament (ayah number in Arabic digits) */}
                        <span 
                          className="inline-flex items-center justify-center mx-2 w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-emerald-400 to-teal-400 text-black text-xs font-serif font-black shadow-[1.5px_1.5px_0px_#121212] select-none align-middle"
                          title={`Ayat ${ayah.nomorAyat}`}
                        >
                          <span>{toArabicNumerals(ayah.nomorAyat)}</span>
                        </span>
                      </div>

                      {/* Latin Transliteration */}
                      <p className="text-xs text-emerald-900 font-bold italic bg-emerald-50/80 p-2 rounded-lg border border-emerald-300">
                        {ayah.teksLatin}
                      </p>

                      {/* Indonesian Translation */}
                      <p className="text-xs sm:text-sm text-[#121212] font-semibold leading-relaxed">
                        {ayah.teksIndonesia}
                      </p>

                      {/* Catatan Tadabbur Pribadi (Jika ada) */}
                      {(() => {
                        const b = favoriteAyahs.find(f => f.id === ayahId);
                        if (b && b.note) {
                          return (
                            <div className="p-2.5 bg-purple-50 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_#121212] flex items-start gap-2 text-xs">
                              <Quote className="w-3.5 h-3.5 text-purple-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-black text-[10px] text-purple-900 block uppercase tracking-wider">
                                  Catatan Tadabbur ({b.category || 'Tadabbur'}):
                                </span>
                                <p className="text-[#121212] font-bold italic mt-0.5">
                                  "{b.note}"
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
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
