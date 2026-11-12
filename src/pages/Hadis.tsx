import React, { useState, useMemo, useEffect } from 'react';
import { ALL_HADITHS, HadithItem } from '../data/hadis';
import { Search, Filter, ScrollText, AlertTriangle, Heart, Share2, Sparkles, Check, Bookmark } from 'lucide-react';
import { storage } from '../lib/storage';
import { FavoriteHadith } from '../types';
import { vibrateSuccess, playButtonTapSound } from '../lib/audio';
import { SocialShareModal, SocialShareData } from '../components/SocialShareModal';

export default function Hadis() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNarrator, setSelectedNarrator] = useState<string>('Semua');
  const [selectedTopic, setSelectedTopic] = useState<string>('Semua');
  const [favoriteHadiths, setFavoriteHadiths] = useState<FavoriteHadith[]>([]);
  const [shareData, setShareData] = useState<SocialShareData | null>(null);

  useEffect(() => {
    setFavoriteHadiths(storage.getFavoriteHadiths());
    const handleStorageUpdate = () => setFavoriteHadiths(storage.getFavoriteHadiths());
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('wi_data_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('wi_data_updated', handleStorageUpdate);
    };
  }, []);

  // Preset Narrators
  const narrators = useMemo(() => {
    return ['Semua', ...Array.from(new Set(ALL_HADITHS.map(h => h.narrator)))].sort();
  }, []);

  // Preset Topics for Quick Filter Pills
  const topicPills = [
    { label: 'Semua (300+)', value: 'Semua' },
    { label: '⭐ Favorit Saya', value: 'FAVORIT' },
    { label: 'Niat & Keikhlasan', value: 'Niat & Keikhlasan' },
    { label: 'Akhlak & Adab', value: 'Akhlak & Adab' },
    { label: 'Salat & Ibadah', value: 'Salat & Ibadah' },
    { label: 'Ilmu & Menuntut Ilmu', value: 'Ilmu & Menuntut Ilmu' },
    { label: 'Puasa & Ramadhan', value: 'Puasa & Ramadhan' },
    { label: 'Doa & Zikir', value: 'Doa & Zikir' },
    { label: 'Sabar & Syukur', value: 'Sabar & Syukur' },
    { label: 'Sedekah & Harta', value: 'Sedekah & Harta' },
    { label: 'Silaturahmi & Persaudaraan', value: 'Silaturahmi & Persaudaraan' },
    { label: 'Waktu & Konsistensi', value: 'Waktu & Konsistensi' },
    { label: 'Al-Qur\'an', value: 'Al-Qur\'an' },
    { label: 'Taubat & Ampunan', value: 'Taubat & Ampunan' },
    { label: 'Orang Tua & Keluarga', value: 'Orang Tua & Keluarga' },
  ];

  const toggleFavorite = (hadith: HadithItem) => {
    vibrateSuccess();
    playButtonTapSound();
    const hadithIdStr = hadith.id.toString();
    const isFav = favoriteHadiths.some(f => f.id === hadithIdStr);

    if (isFav) {
      storage.removeFavoriteHadith(hadithIdStr);
    } else {
      const favItem: FavoriteHadith = {
        id: hadithIdStr,
        source: 'perawi',
        perawiName: hadith.narrator,
        no: hadith.source,
        judul: hadith.topic,
        arab: hadith.arab,
        indo: hadith.text,
        addedAt: new Date().toISOString()
      };
      storage.addFavoriteHadith(favItem);
    }
    setFavoriteHadiths(storage.getFavoriteHadiths());
  };

  const isBookmarked = (id: number) => {
    return favoriteHadiths.some(f => f.id === id.toString());
  };

  const filteredHadiths = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return ALL_HADITHS.filter(hadith => {
      // Filter by Search Query
      const matchesSearch = !q || 
        hadith.text.toLowerCase().includes(q) || 
        hadith.topic.toLowerCase().includes(q) || 
        hadith.narrator.toLowerCase().includes(q) ||
        hadith.source.toLowerCase().includes(q) ||
        hadith.arab.includes(q);

      // Filter by Narrator
      const matchesNarrator = selectedNarrator === 'Semua' || hadith.narrator === selectedNarrator;

      // Filter by Topic Pill
      let matchesTopic = true;
      if (selectedTopic === 'FAVORIT') {
        matchesTopic = isBookmarked(hadith.id);
      } else if (selectedTopic !== 'Semua') {
        matchesTopic = hadith.topic.toLowerCase().includes(selectedTopic.toLowerCase());
      }

      return matchesSearch && matchesNarrator && matchesTopic;
    });
  }, [searchQuery, selectedNarrator, selectedTopic, favoriteHadiths]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* Header Banner */}
      <header className="p-4 bg-gradient-to-br from-[#7A4B22] via-[#5C3615] to-[#3A210C] text-[#FFF3DC] border-[1.5px] border-[#3A210C] rounded-2xl shadow-[3px_3px_0px_#3A210C] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#E6C27A] border-[1.5px] border-[#3A210C] rounded-xl flex items-center justify-center text-[#3A210C] shrink-0 shadow-[2px_2px_0px_#3A210C]">
            <ScrollText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#FFF3DC]">
              Kumpulan Hadis Shahih ({ALL_HADITHS.length})
            </h1>
            <p className="text-[#F0D9A8] text-xs font-medium mt-0.5">
              300+ Hadis pilihan lengkap rujukan Shahih Bukhari, Muslim, Tirmidzi & perawi utama
            </p>
          </div>
        </div>
        <div className="wi-arab text-2xl text-[#E6C27A] hidden sm:block shrink-0" lang="ar">
          حَدِيث
        </div>
      </header>

      {/* Quick Filter Topic Pills Horizontal Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none max-w-full">
        {topicPills.map(pill => {
          const isActive = selectedTopic === pill.value;
          return (
            <button
              key={pill.value}
              onClick={() => {
                setSelectedTopic(pill.value);
                playButtonTapSound();
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border-[1.5px] border-black whitespace-nowrap transition-all duration-150 shrink-0 ${
                isActive
                  ? 'bg-[#7A4B22] text-[#FFF3DC] shadow-[2px_2px_0px_#3A210C] translate-y-[-1px]'
                  : 'bg-[#FFF8E8] dark:bg-slate-800 text-[#3A210C] dark:text-gray-200 hover:bg-[#FBF0D9]'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Search Input & Perawi Dropdown */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A4B22]" />
          <input
            type="text"
            placeholder="Cari 300+ hadis (cth: niat, Bukhari No. 1, ilmu...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-[#7A4B22] bg-[#FFF8E8] dark:bg-slate-900 text-[#3A210C] dark:text-gray-100 placeholder:text-[#8F7556] font-semibold shadow-[2px_2px_0_#3A210C] focus:outline-none"
          />
        </div>

        <div className="relative shrink-0">
          <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A4B22]" />
          <select
            value={selectedNarrator}
            onChange={(e) => {
              setSelectedNarrator(e.target.value);
              playButtonTapSound();
            }}
            className="pl-7 pr-6 py-2 text-xs font-bold appearance-none min-w-[110px] cursor-pointer rounded-xl border-2 border-[#7A4B22] bg-[#FFF8E8] dark:bg-slate-900 text-[#3A210C] dark:text-gray-100 shadow-[2px_2px_0_#3A210C]"
          >
            {narrators.map(n => (<option key={n} value={n}>{n}</option>))}
          </select>
        </div>
      </div>

      {/* Active Filter Counter Status */}
      <div className="flex items-center justify-between text-xs font-bold text-[#7A4B22] dark:text-emerald-400 px-1">
        <span>Menampilkan {filteredHadiths.length} hadis shahih</span>
        {selectedTopic === 'FAVORIT' && (
          <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-lg border border-amber-400">
            ⭐ {favoriteHadiths.length} Hadis Difavoritkan
          </span>
        )}
      </div>

      {/* Hadith List Container */}
      <div className="space-y-3">
        {filteredHadiths.length > 0 ? (
          filteredHadiths.map(hadith => {
            const faved = isBookmarked(hadith.id);
            return (
              <article
                key={hadith.id}
                className="relative rounded-2xl border-[1.5px] border-[#7A4B22] dark:border-emerald-700 bg-[#FBF0D9] dark:bg-slate-900 shadow-[3px_3px_0_#3A210C] dark:shadow-[3px_3px_0_#0F172A] overflow-hidden"
              >
                <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-[#C99A4B] to-[#7A4B22]" aria-hidden="true" />
                <div className="pl-5 pr-4 py-3.5 space-y-2.5">
                  
                  {/* Card Top Badges & Actions */}
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[#7A4B22] text-[#FFF3DC] px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000]">
                        {hadith.source}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[#E6C27A] text-[#3A210C] border border-[#7A4B22] px-2 py-0.5 rounded-full">
                        {hadith.topic}
                      </span>
                    </div>

                    {/* Action Buttons: Bookmark & Share Poster Card */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleFavorite(hadith)}
                        className={`p-1.5 rounded-xl border-1.5 border-black transition-all ${
                          faved
                            ? 'bg-rose-500 text-white shadow-[1.5px_1.5px_0px_#121212]'
                            : 'bg-[#FFF8E8] dark:bg-slate-800 text-[#7A4B22] dark:text-gray-300 hover:bg-rose-100'
                        }`}
                        title={faved ? "Hapus dari Favorit" : "Simpan ke Favorit"}
                      >
                        <Heart className={`w-4 h-4 ${faved ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => {
                          playButtonTapSound();
                          setShareData({
                            title: hadith.source,
                            arab: hadith.arab,
                            indo: hadith.text,
                            source: `${hadith.source} (HR. ${hadith.narrator})`,
                            topic: hadith.topic,
                            type: 'hadis'
                          });
                        }}
                        className="p-1.5 rounded-xl border-1.5 border-black bg-[#E6C27A] text-[#3A210C] hover:bg-[#d8b368] font-bold shadow-[1.5px_1.5px_0px_#121212] flex items-center gap-1 text-[11px]"
                        title="Bagikan Poster Memphis"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bagikan</span>
                      </button>
                    </div>
                  </div>

                  {/* Arabic Text */}
                  <p className="wi-arab text-right text-[22px] sm:text-[26px] leading-[2.1] text-[#2E1A08] dark:text-amber-100 font-semibold select-text" dir="rtl" lang="ar">
                    {hadith.arab}
                  </p>

                  {/* Indonesian Translation */}
                  <div className="pt-2 border-t border-dashed border-[#C99A4B]">
                    <p className="text-[#4E2E12] dark:text-slate-200 leading-relaxed text-[13px] sm:text-sm font-medium">
                      "{hadith.text}"
                    </p>
                  </div>

                  {hadith.verify && (
                    <p className="mt-1.5 text-[10.5px] font-semibold text-[#8A4B00] dark:text-amber-300 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Rujukan sanad shahih dari kitab utama perawi {hadith.narrator}
                    </p>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl border-[1.5px] border-[#7A4B22] bg-[#FBF0D9] dark:bg-slate-900">
            <ScrollText className="w-8 h-8 text-[#7A4B22] mx-auto mb-2" />
            <p className="text-[#4E2E12] dark:text-slate-200 font-bold text-xs">
              {selectedTopic === 'FAVORIT'
                ? 'Belum ada hadis yang difavoritkan. Ketuk ikon hati ❤️ pada kartu hadis untuk menyimpannya.'
                : 'Tidak ada hadis yang cocok dengan kata kunci atau filter topik ini.'}
            </p>
          </div>
        )}
      </div>

      {/* Social Share Card Poster Generator Modal */}
      <SocialShareModal
        isOpen={!!shareData}
        onClose={() => setShareData(null)}
        data={shareData}
      />
    </div>
  );
}
