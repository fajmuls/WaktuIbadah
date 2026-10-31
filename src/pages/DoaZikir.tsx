import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Search, BookOpen, Clock, Copy, Check, CheckCircle2, 
  RotateCcw, Heart, Share2, Layers, Bookmark, ArrowRight 
} from 'lucide-react';
import { ALL_DOA_ITEMS, WIRID_SESUDAH_SALAT, DOA_HARIAN, DOA_BELAJAR, PrayerItem } from '../data/prayers-data';
import { playDhikrTapSound, playSaveSuccessSound, playToggleSound } from '../lib/audio';

export default function DoaZikir() {
  const [activeTab, setActiveTab] = useState<'all' | 'wirid_salat' | 'harian' | 'belajar'>('wirid_salat');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ [id: string]: number }>({});
  const [expandedItems, setExpandedItems] = useState<{ [id: string]: boolean }>({
    'wirid-1': true,
    'wirid-5': true,
    'wirid-10': true,
  });

  const filteredItems = useMemo(() => {
    let list = ALL_DOA_ITEMS;
    if (activeTab !== 'all') {
      list = list.filter(item => item.category === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) ||
        (item.subTitle && item.subTitle.toLowerCase().includes(q)) ||
        item.latin.toLowerCase().includes(q) ||
        item.translation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, searchQuery]);

  const handleTabChange = (tab: 'all' | 'wirid_salat' | 'harian' | 'belajar') => {
    playToggleSound();
    setActiveTab(tab);
  };

  const handleIncrement = (id: string, maxTarget?: number) => {
    playDhikrTapSound();
    setCounts(prev => {
      const current = prev[id] || 0;
      const next = current + 1;
      if (maxTarget && next === maxTarget) {
        playSaveSuccessSound();
      }
      return { ...prev, [id]: next };
    });
  };

  const handleReset = (id: string) => {
    playDhikrTapSound();
    setCounts(prev => ({ ...prev, [id]: 0 }));
  };

  const handleCopy = (item: PrayerItem) => {
    const text = `${item.title}\n\n${item.arabic}\n\n${item.latin}\n\nArtinya:\n"${item.translation}"`;
    navigator.clipboard.writeText(text);
    playSaveSuccessSound();
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    playToggleSound();
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* Memphis Header */}
      <div className="p-3.5 sm:p-5 bg-white border-2 sm:border-[2.5px] border-[#121212] rounded-2xl shadow-[3px_3px_0px_#121212] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-400 to-green-500 border-2 border-[#121212] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#121212] shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#121212]" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black uppercase tracking-tight text-[#121212]">
              Kumpulan Doa & Zikir
            </h1>
            <p className="text-xs font-bold text-gray-600 mt-0.5">
              Panduan wirid sesudah salat fardhu, doa harian, dan doa belajar
            </p>
          </div>
        </div>

        {/* Quick Stats or Count Info */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="memphis-badge bg-gradient-to-r from-emerald-400 to-teal-400 text-black py-1 px-3">
            {ALL_DOA_ITEMS.length} Doa Terverifikasi
          </span>
        </div>
      </div>

      {/* Search Bar & Category Filter Tabs */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari doa, wirid, arti, atau lafal Latin..."
            className="memphis-input w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full hide-scrollbar">
          <button
            onClick={() => handleTabChange('wirid_salat')}
            className={`memphis-btn px-3 py-1.5 text-xs uppercase tracking-wider shrink-0 transition-all ${
              activeTab === 'wirid_salat'
                ? 'memphis-btn-green text-white font-black'
                : 'memphis-btn-white text-gray-700 font-bold'
            }`}
          >
            Wirid Salat ({WIRID_SESUDAH_SALAT.length})
          </button>
          <button
            onClick={() => handleTabChange('harian')}
            className={`memphis-btn px-3 py-1.5 text-xs uppercase tracking-wider shrink-0 transition-all ${
              activeTab === 'harian'
                ? 'memphis-btn-green text-white font-black'
                : 'memphis-btn-white text-gray-700 font-bold'
            }`}
          >
            Doa Harian ({DOA_HARIAN.length})
          </button>
          <button
            onClick={() => handleTabChange('belajar')}
            className={`memphis-btn px-3 py-1.5 text-xs uppercase tracking-wider shrink-0 transition-all ${
              activeTab === 'belajar'
                ? 'memphis-btn-green text-white font-black'
                : 'memphis-btn-white text-gray-700 font-bold'
            }`}
          >
            Doa Belajar ({DOA_BELAJAR.length})
          </button>
          <button
            onClick={() => handleTabChange('all')}
            className={`memphis-btn px-3 py-1.5 text-xs uppercase tracking-wider shrink-0 transition-all ${
              activeTab === 'all'
                ? 'memphis-btn-green text-white font-black'
                : 'memphis-btn-white text-gray-700 font-bold'
            }`}
          >
            Semua ({ALL_DOA_ITEMS.length})
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_#121212]">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-black uppercase text-gray-600">
              Tidak ada doa yang cocok dengan pencarian "{searchQuery}"
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveTab('wirid_salat'); }}
              className="mt-3 memphis-btn memphis-btn-white px-3 py-1 text-xs"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const count = counts[item.id] || 0;
            const hasTarget = item.targetCount !== undefined && item.targetCount > 1;
            const isTargetReached = hasTarget && count >= (item.targetCount || 0);
            const isExpanded = expandedItems[item.id] !== false;

            return (
              <div
                key={item.id}
                className={`memphis-card p-3.5 sm:p-5 transition-all ${
                  isTargetReached ? 'border-emerald-700 bg-emerald-50/40' : 'bg-white'
                }`}
              >
                {/* Header item */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-black text-white text-[11px] sm:text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-black text-xs sm:text-sm text-[#121212]">
                          {item.title}
                        </h2>
                        {item.category === 'wirid_salat' && (
                          <span className="memphis-badge bg-gradient-to-r from-emerald-400 to-teal-400 text-black text-[8px] py-0.5 px-1.5">
                            Wirid Fardhu
                          </span>
                        )}
                        {item.category === 'belajar' && (
                          <span className="memphis-badge bg-[#00F0FF] text-black text-[8px] py-0.5 px-1.5">
                            Kuliah & Ujian
                          </span>
                        )}
                      </div>
                      {item.subTitle && (
                        <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-0.5">
                          {item.subTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(item)}
                      title="Salin Teks Doa"
                      className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-100 shadow-[1px_1px_0px_#121212]"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-700" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-1.5 rounded-lg border-2 border-black bg-white hover:bg-gray-100 shadow-[1px_1px_0px_#121212] text-xs font-black"
                    >
                      {isExpanded ? 'Sembunyikan' : 'Buka Terjemahan'}
                    </button>
                  </div>
                </div>

                {/* Arabic Text Block */}
                <div className="mt-3 p-3 sm:p-4 bg-[#FFFDF8] rounded-xl border border-black/40">
                  <p className="text-right font-serif text-lg sm:text-2xl leading-loose sm:leading-loose text-[#121212] select-text">
                    {item.arabic}
                  </p>
                </div>

                {/* Latin & Translation */}
                {isExpanded && (
                  <div className="mt-3 space-y-2 text-xs sm:text-sm">
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-300">
                      <p className="font-bold text-emerald-900 italic text-[11px] sm:text-xs">
                        {item.latin}
                      </p>
                    </div>
                    <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-gray-800 text-[11px] sm:text-xs leading-relaxed">
                        <strong className="text-black">Artinya:</strong> "{item.translation}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Interactive Counter for Target-based items */}
                {hasTarget && (
                  <div className="mt-3.5 pt-3 border-t border-black/10 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-700">
                        Target Dzikir: {item.targetCount}x
                      </span>
                      {isTargetReached && (
                        <span className="memphis-badge bg-emerald-600 text-white text-[9px] gap-1 py-0.5">
                          <CheckCircle2 className="w-3 h-3 stroke-[3]" /> Target Tercapai
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReset(item.id)}
                        className="text-[11px] font-bold text-gray-400 hover:text-red-500 hover:underline px-2"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleIncrement(item.id, item.targetCount)}
                        className={`memphis-btn px-4 py-1.5 text-xs font-black uppercase tracking-wider ${
                          isTargetReached
                            ? 'bg-emerald-600 text-white'
                            : 'memphis-btn-green text-white'
                        }`}
                      >
                        Hitung ({count} / {item.targetCount})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
