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
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-main">Kumpulan Hadis</h1>
          <p className="text-text-muted text-xs font-medium mt-0.5">Jelajahi dan pelajari 50 hadis pilihan</p>
        </div>
      </header>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari hadis atau topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm"
          />
        </div>
        <div className="relative shrink-0">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={selectedNarrator}
            onChange={(e) => setSelectedNarrator(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-primary appearance-none text-sm font-medium text-text-main min-w-[120px]"
          >
            {narrators.map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hadith List */}
      <div className="space-y-3">
        {filteredHadiths.length > 0 ? (
          filteredHadiths.map(hadith => (
            <div key={hadith.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2 gap-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  HR. {hadith.narrator}
                </span>
                <span className="text-xs text-text-muted font-medium bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                  {hadith.topic}
                </span>
              </div>
              <p className="text-text-main font-medium leading-relaxed text-sm">
                "{hadith.text}"
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-10 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-text-muted text-sm">Tidak ada hadis yang cocok dengan pencarian.</p>
          </div>
        )}
      </div>
    </div>
  );
}
