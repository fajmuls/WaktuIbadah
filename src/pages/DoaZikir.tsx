import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Search, BookOpen, Clock, Copy, Check, CheckCircle2, 
  RotateCcw, Heart, Share2, Layers, Bookmark, ArrowLeft, X,
  CheckCheck, Flame
} from 'lucide-react';
import { ALL_DOA_ITEMS, WIRID_SESUDAH_SALAT, DOA_HARIAN, DOA_BELAJAR, PrayerItem } from '../data/prayers-data';
import { playDhikrTapSound, playSaveSuccessSound, playButtonTapSound } from '../lib/audio';
import { IslamicStarBadge } from '../components/IslamicStarBadge';

export default function DoaZikir() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'wirid_salat' | 'harian' | 'belajar' | 'all'>('wirid_salat');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
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

  const handleTabChange = (tab: 'wirid_salat' | 'harian' | 'belajar' | 'all') => {
    playButtonTapSound();
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
    playButtonTapSound();
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
    playButtonTapSound();
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3 pb-24 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* Top Banner (Matching Quran & Hadith Top Bar Style) */}
      <div className="bg-gradient-to-br from-[#0E7C9A] to-[#0A4A5E] text-white rounded-2xl border-[1.5px] border-[#08303D] shadow-[3px_3px_0px_#08303D] p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors shrink-0 text-white"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-sky-100" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold truncate text-white">
                Doa & Zikir Harian
              </h1>
              <p className="text-[10px] sm:text-[11px] text-sky-100 truncate">
                Wirid sesudah salat, doa kuliah, dan kumpulan doa pilihan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsSearchVisible(v => !v)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isSearchVisible ? 'bg-white text-[#0f6b52]' : 'hover:bg-white/15 text-white'
              }`}
              title="Cari Doa atau Zikir"
            >
              <Search className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-1 rounded-full">
              {ALL_DOA_ITEMS.length} Doa
            </span>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {isSearchVisible && (
          <div className="relative animate-in slide-in-from-top-2 duration-200">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari doa, wirid, arti terjemahan, atau lafal Latin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-9 py-2 bg-white text-gray-900 rounded-xl text-xs sm:text-sm font-medium outline-none shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="w-7 h-7 absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Horizontal Category Tabs (Underline Memphis style) */}
        <div className="flex border-b border-white/20 pt-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'wirid_salat'}
            onClick={() => handleTabChange('wirid_salat')}
            className={`flex-1 pb-2 text-xs font-bold tracking-wider transition-colors relative uppercase text-center ${
              activeTab === 'wirid_salat' ? 'text-white' : 'text-sky-100 hover:text-white'
            }`}
          >
            WIRID SALAT
            {activeTab === 'wirid_salat' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#7FD3E8] rounded-full" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'harian'}
            onClick={() => handleTabChange('harian')}
            className={`flex-1 pb-2 text-xs font-bold tracking-wider transition-colors relative uppercase text-center ${
              activeTab === 'harian' ? 'text-white' : 'text-sky-100 hover:text-white'
            }`}
          >
            HARIAN
            {activeTab === 'harian' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#7FD3E8] rounded-full" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'belajar'}
            onClick={() => handleTabChange('belajar')}
            className={`flex-1 pb-2 text-xs font-bold tracking-wider transition-colors relative uppercase text-center ${
              activeTab === 'belajar' ? 'text-white' : 'text-sky-100 hover:text-white'
            }`}
          >
            BELAJAR
            {activeTab === 'belajar' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#7FD3E8] rounded-full" />
            )}
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => handleTabChange('all')}
            className={`flex-1 pb-2 text-xs font-bold tracking-wider transition-colors relative uppercase text-center ${
              activeTab === 'all' ? 'text-white' : 'text-sky-100 hover:text-white'
            }`}
          >
            SEMUA
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#7FD3E8] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Main List of Doa & Zikir Items */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border-[1.5px] border-[#121212] dark:border-slate-700 rounded-2xl shadow-[2px_2px_0px_#121212] space-y-2">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Tidak ada doa yang cocok dengan pencarian "{searchQuery}"
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveTab('wirid_salat'); }}
              className="mt-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs"
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
                className={`rounded-2xl border-[1.5px] border-[#0A4A5E] border-l-[7px] border-l-[#1597B3] dark:border-slate-700 shadow-[2px_2px_0px_#08303D] p-3.5 sm:p-4.5 transition-all ${
                  isTargetReached 
                    ? 'bg-[#D9F1E6] dark:bg-emerald-950/40 border-emerald-600' 
                    : 'bg-[#F0F9FB] dark:bg-slate-900'
                }`}
              >
                {/* Header item */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <IslamicStarBadge 
                      number={index + 1} 
                      className="w-8 h-8 sm:w-9 sm:h-9" 
                      active={isTargetReached}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white break-words">
                          {item.title}
                        </h2>
                        {item.category === 'wirid_salat' && (
                          <span className="text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400 shrink-0">
                            Wirid Fardhu
                          </span>
                        )}
                        {item.category === 'belajar' && (
                          <span className="text-[9px] font-bold uppercase bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-400 shrink-0">
                            Kuliah & Ujian
                          </span>
                        )}
                      </div>
                      {item.subTitle && (
                        <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                          {item.subTitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: Copy & Toggle */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopy(item)}
                      title="Salin Teks Doa"
                      className="w-7 h-7 rounded-lg border-[1.5px] border-[#121212] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center shadow-[1px_1px_0px_#121212] transition-colors"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                      )}
                    </button>
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="h-7 px-2.5 rounded-lg border-[1.5px] border-[#121212] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-[11px] font-bold shadow-[1px_1px_0px_#121212] transition-colors text-gray-800 dark:text-gray-200"
                    >
                      {isExpanded ? 'Ringkas' : 'Terjemahan'}
                    </button>
                  </div>
                </div>

                {/* Arabic Text Block */}
                <div className="p-3 sm:p-4 bg-[#DFF1F6] dark:bg-slate-800/70 rounded-xl border border-[#9CCFDD] dark:border-slate-700">
                  <p className="text-right font-serif text-lg sm:text-2xl leading-loose sm:leading-loose text-gray-900 dark:text-white select-text" dir="rtl">
                    {item.arabic}
                  </p>
                </div>

                {/* Latin & Translation */}
                {isExpanded && (
                  <div className="mt-2.5 space-y-1.5 text-xs sm:text-sm">
                    {item.latin && (
                      <p className="text-[12px] sm:text-[13px] text-[#0A4A5E] dark:text-sky-300 italic font-medium">
                        {item.latin}
                      </p>
                    )}
                    {item.translation && (
                      <p className="text-[13px] sm:text-[14px] text-teal-900 dark:text-teal-200 leading-relaxed font-normal">
                        "{item.translation}"
                      </p>
                    )}
                  </div>
                )}

                {/* Interactive Counter for Target-based items (Tasbih) */}
                {hasTarget && (
                  <div className="mt-3 pt-2.5 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Target Zikir: {item.targetCount}x
                      </span>
                      {isTargetReached && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
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
                        className={`px-4 py-1.5 rounded-xl border-[1.5px] border-[#08303D] text-xs font-bold shadow-[2px_2px_0px_#08303D] transition-transform active:scale-95 ${
                          isTargetReached
                            ? 'bg-[#0A4A5E] text-white'
                            : 'bg-[#0E7C9A] hover:bg-[#0A6A85] text-white'
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
