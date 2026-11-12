import React, { useState, useMemo } from 'react';
import { HADITH_DATA } from '../data/hadis';
import { Search, Filter, ScrollText, AlertTriangle } from 'lucide-react';

/** Tema HADIS: perkamen krim + cokelat tua + emas (beda dari Al-Qur'an hijau & Doa biru-teal) */
export default function Hadis() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNarrator, setSelectedNarrator] = useState<string>('Semua');

  const narrators = ['Semua', ...Array.from(new Set(HADITH_DATA.map(h => h.narrator)))].sort();

  const filteredHadiths = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return HADITH_DATA.filter(hadith => {
      const matchesSearch = hadith.text.toLowerCase().includes(q) || hadith.topic.toLowerCase().includes(q) || hadith.arab.includes(searchQuery);
      const matchesNarrator = selectedNarrator === 'Semua' || hadith.narrator === selectedNarrator;
      return matchesSearch && matchesNarrator;
    });
  }, [searchQuery, selectedNarrator]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      <header className="p-4 bg-gradient-to-br from-[#7A4B22] to-[#4E2E12] text-[#FFF3DC] border-[1.5px] border-[#3A210C] rounded-2xl shadow-[3px_3px_0px_#3A210C] flex items-center gap-3">
        <div className="w-11 h-11 bg-[#E6C27A] border-[1.5px] border-[#3A210C] rounded-xl flex items-center justify-center text-[#3A210C] shrink-0">
          <ScrollText className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#FFF3DC]">Kumpulan Hadis</h1>
          <p className="text-[#F0D9A8] text-xs font-medium mt-0.5">Hadis pilihan lengkap dengan teks Arab dan terjemahan</p>
        </div>
        <div className="wi-arab text-2xl text-[#E6C27A] ml-auto hidden sm:block" lang="ar">حَدِيث</div>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A4B22]" />
          <input
            type="text"
            placeholder="Cari hadis, topik, atau teks Arab..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border-2 border-[#7A4B22] bg-[#FFF8E8] text-[#3A210C] placeholder:text-[#8F7556] font-semibold shadow-[2px_2px_0_#3A210C] focus:outline-none"
          />
        </div>
        <div className="relative shrink-0">
          <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7A4B22]" />
          <select
            value={selectedNarrator}
            onChange={(e) => setSelectedNarrator(e.target.value)}
            className="pl-7 pr-6 py-2 text-xs font-bold appearance-none min-w-[110px] cursor-pointer rounded-xl border-2 border-[#7A4B22] bg-[#FFF8E8] text-[#3A210C] shadow-[2px_2px_0_#3A210C]"
          >
            {narrators.map(n => (<option key={n} value={n}>{n}</option>))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredHadiths.length > 0 ? (
          filteredHadiths.map(hadith => (
            <article
              key={hadith.id}
              className="relative rounded-2xl border-[1.5px] border-[#7A4B22] bg-[#FBF0D9] shadow-[3px_3px_0_#3A210C] overflow-hidden"
            >
              <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-b from-[#C99A4B] to-[#7A4B22]" aria-hidden="true" />
              <div className="pl-5 pr-4 py-3.5">
                <div className="flex justify-between items-center mb-2.5 gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[#7A4B22] text-[#FFF3DC] px-2 py-0.5 rounded-full">
                    HR. {hadith.narrator}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide bg-[#E6C27A] text-[#3A210C] border border-[#7A4B22] px-2 py-0.5 rounded-full">
                    {hadith.topic}
                  </span>
                </div>
                <p className="wi-arab text-right text-[22px] sm:text-[26px] leading-[2.1] text-[#2E1A08] select-text" dir="rtl" lang="ar">
                  {hadith.arab}
                </p>
                <div className="mt-2.5 pt-2.5 border-t border-dashed border-[#C99A4B]">
                  <p className="text-[#4E2E12] leading-relaxed text-[13px] sm:text-sm font-medium">"{hadith.text}"</p>
                </div>
                {hadith.verify && (
                  <p className="mt-2 text-[10.5px] font-semibold text-[#8A4B00] inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Periksa kembali derajat dan rujukan sebelum dikutip
                  </p>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl border-[1.5px] border-[#7A4B22] bg-[#FBF0D9]">
            <ScrollText className="w-8 h-8 text-[#7A4B22] mx-auto mb-2" />
            <p className="text-[#4E2E12] font-bold text-xs">Tidak ada hadis yang cocok dengan pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
}
