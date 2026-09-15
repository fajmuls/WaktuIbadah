import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, Search, Play, Pause, Volume2, Bookmark, Check, Copy, ChevronRight, X, Sparkles, Filter } from 'lucide-react';
import { SurahItem, AyatItem, HadithArbain } from '../types';

export default function QuranHadis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'hadis' ? 'hadis' : 'quran';
  const [activeTab, setActiveTab] = useState<'quran' | 'hadis'>(initialTab);

  // Sync tab with URL query
  const handleTabChange = (tab: 'quran' | 'hadis') => {
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
  const [lastReadSurah, setLastReadSurah] = useState<{ number: number; name: string } | null>(() => {
    try {
      const saved = localStorage.getItem('wi_last_read');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- HADIS STATE ---
  const [hadiths, setHadiths] = useState<HadithArbain[]>([]);
  const [isLoadingHadiths, setIsLoadingHadiths] = useState(true);
  const [hadisSearch, setHadisSearch] = useState('');
  const [selectedHadith, setSelectedHadith] = useState<HadithArbain | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // 3. Open Surah Detail
  const openSurah = async (surah: SurahItem) => {
    setSelectedSurah(surah);
    setIsLoadingAyahs(true);
    setAyahs([]);
    
    // Save last read
    const record = { number: surah.nomor, name: surah.namaLatin };
    setLastReadSurah(record);
    localStorage.setItem('wi_last_read', JSON.stringify(record));

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
  const handleCopyHadith = (h: HadithArbain) => {
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

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Al-Qur'an & Hadis</h1>
          <p className="text-text-muted text-sm mt-0.5">
            Baca firman Allah & sabda Rasulullah SAW dari sumber API MyQuran terpercaya
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => handleTabChange('quran')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'quran'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Al-Qur'an (114 Surat)
          </button>
          <button
            onClick={() => handleTabChange('hadis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'hadis'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Hadits Arba'in
          </button>
        </div>
      </header>

      {/* ======================= TAB 1: AL-QUR'AN ======================= */}
      {activeTab === 'quran' && (
        <div className="space-y-6">
          {/* Last Read banner if available */}
          {lastReadSurah && (
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Terakhir Dibaca</span>
                  <h4 className="font-bold text-text-main">Surat {lastReadSurah.name}</h4>
                </div>
              </div>
              <button
                onClick={() => {
                  const target = surahs.find(s => s.nomor === lastReadSurah.number);
                  if (target) openSurah(target);
                }}
                className="text-xs font-bold bg-primary text-white px-3 py-2 rounded-xl shadow-sm hover:bg-primary/90 transition-colors"
              >
                Lanjutkan
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari surat (contoh: Al-Kahf, Yasin, 36)..."
              value={quranSearch}
              onChange={(e) => setQuranSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm shadow-sm transition-all"
            />
          </div>

          {/* Surah List Grid */}
          {isLoadingSurahs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredSurahs.map((surah) => (
                <div
                  key={surah.nomor}
                  onClick={() => openSurah(surah)}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary font-bold flex items-center justify-center border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors text-sm">
                      {surah.nomor}
                    </div>
                    <div>
                      <h3 className="font-bold text-text-main group-hover:text-primary transition-colors text-sm">
                        {surah.namaLatin}
                      </h3>
                      <p className="text-xs text-text-muted">
                        {surah.arti} • {surah.jumlahAyat} Ayat
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-serif text-lg font-bold text-gray-700">
                      {surah.nama}
                    </span>
                    <span className="block text-[10px] text-text-muted font-medium capitalize">
                      {surah.tempatTurun}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 2: HADITS ARBA'IN ======================= */}
      {activeTab === 'hadis' && (
        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">42 Hadits Pilihan Arba'in An-Nawawi</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Koleksi hadits pokok ajaran Islam yang dihimpun oleh Imam An-Nawawi melalui MyQuran API.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari hadits berdasarkan judul atau terjemahan (contoh: Niat, Malu, Wara)..."
              value={hadisSearch}
              onChange={(e) => setHadisSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm shadow-sm transition-all"
            />
          </div>

          {/* Hadits List */}
          {isLoadingHadiths ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHadiths.map((h) => (
                <div
                  key={h.no}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                        Hadits #{h.no}
                      </span>
                      <h4 className="font-bold text-text-main text-sm">{h.judul}</h4>
                    </div>

                    <button
                      onClick={() => handleCopyHadith(h)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-text-muted hover:text-primary transition-colors"
                      title="Salin Hadits"
                    >
                      {copiedId === h.no ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Arabic Text */}
                  <div className="text-right font-serif text-lg leading-loose text-gray-900 my-4 px-2" dir="rtl">
                    {h.arab}
                  </div>

                  {/* Indonesian Translation */}
                  <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs sm:text-sm text-text-main leading-relaxed">
                    <span className="font-bold text-primary mr-1">Artinya:</span>
                    "{h.indo}"
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================= SURAH DETAIL MODAL ======================= */}
      {selectedSurah && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
                  {selectedSurah.nomor}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedSurah.namaLatin} ({selectedSurah.nama})</h3>
                  <p className="text-xs text-white/80">
                    {selectedSurah.arti} • {selectedSurah.jumlahAyat} Ayat • {selectedSurah.tempatTurun}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedSurah.audioFull?.['05'] && (
                  <button
                    onClick={() => toggleAudio(selectedSurah.audioFull!['05'])}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
                    title={playingAudio === selectedSurah.audioFull['05'] ? 'Jeda Audio' : 'Putar Murottal'}
                  >
                    {playingAudio === selectedSurah.audioFull['05'] ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                )}
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Bismillah banner (unless At-Taubah #9) */}
              {selectedSurah.nomor !== 9 && selectedSurah.nomor !== 1 && (
                <div className="text-center py-4 text-xl font-serif font-bold text-primary">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}

              {isLoadingAyahs ? (
                <div className="space-y-4 py-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                ayahs.map((ayah) => (
                  <div
                    key={ayah.nomorAyat}
                    className="bg-gray-50/50 p-4 sm:p-5 rounded-2xl border border-gray-100 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {ayah.nomorAyat}
                      </span>
                      {ayah.audio?.['05'] && (
                        <button
                          onClick={() => toggleAudio(ayah.audio!['05'])}
                          className="text-xs font-medium text-text-muted hover:text-primary flex items-center gap-1.5 p-1 rounded-md"
                        >
                          {playingAudio === ayah.audio['05'] ? (
                            <>
                              <Pause className="w-3.5 h-3.5 text-primary" /> Putar
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" /> Dengar
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Arabic Text */}
                    <p className="text-right font-serif text-2xl leading-[2.4] text-gray-900 pr-2" dir="rtl">
                      {ayah.teksArab}
                    </p>

                    {/* Latin Translation */}
                    <p className="text-xs text-primary/80 font-medium italic">
                      {ayah.teksLatin}
                    </p>

                    {/* Indonesian Translation */}
                    <p className="text-xs sm:text-sm text-text-main leading-relaxed">
                      {ayah.teksIndonesia}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
