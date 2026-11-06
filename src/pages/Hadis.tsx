import React, { useState, useMemo } from 'react';
import { HADITH_DATA } from '../data/hadis';
import { Search, Filter, BookOpen } from 'lucide-react';

export default function Hadis() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNarrator, setSelectedNarrator] = useState<string>('Semua');

  const narrators = ['Semua', ...Array.from(new Set(HADITH_DATA.map(h => h.narrator)))].sort();

  const filteredHadiths = useMemo(() => {
    return HADITH_DATA.filter(hadith => {
      const matchesSearch = hadith.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            hadith.topic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesNarrator = selectedNarrator === 'Semua' || hadith.narrator === selectedNarrator;
      return matchesSearch && matchesNarrator;
    });
  }, [searchQuery, selectedNarrator]);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* Memphis Header */}
      <header className="p-3.5 sm:p-4 bg-white border-[1.5px] border-[#121212] rounded-2xl shadow-[2px_2px_0px_#121212] flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-400 via-teal-300 to-green-400 border-[1.5px] border-black rounded-xl flex items-center justify-center text-black font-bold shadow-[2px_2px_0px_#121212] shrink-0">
          <BookOpen className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#121212]">
            Kumpulan Hadis
          </h1>
          <p className="text-gray-600 text-xs font-bold mt-0.5">
            Jelajahi dan pelajari hadis pilihan perawi terpercaya
          </p>
        </div>
      </header>

      {/* Search & Filter (Memphis Style) */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari hadis atau topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 memphis-input text-xs sm:text-sm"
          />
        </div>
        <div className="relative shrink-0">
          <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={selectedNarrator}
            onChange={(e) => setSelectedNarrator(e.target.value)}
            className="pl-7 pr-6 py-2 memphis-input text-xs font-bold appearance-none min-w-[100px] cursor-pointer"
          >
            {narrators.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hadith List (Memphis Cards) */}
      <div className="space-y-2.5">
        {filteredHadiths.length > 0 ? (
          filteredHadiths.map(hadith => (
            <div key={hadith.id} className="memphis-card p-3 sm:p-4 shadow-[2.5px_2.5px_0px_#121212] hover:translate-x-0.5 transition-all">
              <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                <span className="memphis-badge bg-[#00F0FF] text-black text-[9px]">
                  HR. {hadith.narrator}
                </span>
                <span className="memphis-badge bg-gradient-to-r from-emerald-400 to-teal-400 text-black text-[9px]">
                  {hadith.topic}
                </span>
              </div>
              <p className="text-black font-bold leading-relaxed text-xs sm:text-sm italic">
                "{hadith.text}"
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-12 px-4 memphis-card bg-[#FFFDF8]">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 font-bold text-xs">Tidak ada hadis yang cocok dengan pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
}
