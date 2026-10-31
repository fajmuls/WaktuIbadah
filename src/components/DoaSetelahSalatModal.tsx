import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, Copy, ChevronDown, ChevronUp, Bell, CheckCircle2, BookmarkCheck } from 'lucide-react';
import { WIRID_SESUDAH_SALAT, PrayerItem } from '../data/prayers-data';
import { storage } from '../lib/storage';
import { playSaveSuccessSound, playDhikrTapSound, playToggleSound } from '../lib/audio';

interface DoaSetelahSalatModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr?: string;
}

export const DoaSetelahSalatModal: React.FC<DoaSetelahSalatModalProps> = ({
  isOpen,
  onClose,
  dateStr,
}) => {
  const [autoShow, setAutoShow] = useState<boolean>(storage.getAutoDoaModal());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCounts, setActiveCounts] = useState<{ [id: string]: number }>({
    'wirid-1': 0,
    'wirid-2': 0,
    'wirid-6': 0,
    'wirid-7': 0,
    'wirid-8': 0,
  });
  const [expandedId, setExpandedId] = useState<string | null>('wirid-10');

  if (!isOpen) return null;

  const handleToggleAutoShow = (e: React.ChangeEvent<HTMLInputElement>) => {
    playToggleSound();
    const newValue = e.target.checked;
    setAutoShow(newValue);
    storage.setAutoDoaModal(newValue);
  };

  const handleIncrementCount = (id: string, maxTarget?: number) => {
    playDhikrTapSound();
    setActiveCounts(prev => {
      const current = prev[id] || 0;
      const next = current + 1;
      if (maxTarget && next === maxTarget) {
        playSaveSuccessSound();
      }
      return { ...prev, [id]: next };
    });
  };

  const handleResetCount = (id: string) => {
    playDhikrTapSound();
    setActiveCounts(prev => ({ ...prev, [id]: 0 }));
  };

  const handleCopyText = (item: PrayerItem) => {
    const textToCopy = `${item.title}\n\n${item.arabic}\n\n${item.latin}\n\nArtinya:\n"${item.translation}"`;
    navigator.clipboard.writeText(textToCopy);
    playSaveSuccessSound();
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const fullText = WIRID_SESUDAH_SALAT.map(w => 
      `=== ${w.title} ===\n${w.arabic}\n${w.latin}\nArtinya: ${w.translation}\n`
    ).join('\n\n');
    navigator.clipboard.writeText(fullText);
    playSaveSuccessSound();
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="w-full max-w-2xl bg-[#FFFDF8] border-[3px] border-[#121212] rounded-2xl sm:rounded-3xl shadow-[5px_5px_0px_#121212] overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 border-b-[2.5px] border-[#121212] flex items-center justify-between text-[#121212] relative overflow-hidden">
            <div className="flex items-center gap-3 z-10">
              <div className="w-11 h-11 bg-white border-2 border-[#121212] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#121212] shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="memphis-badge bg-black text-[#6EE7B7] text-[9px] px-2 py-0.5">
                    Alhamdulillah
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#121212]/80">
                    5 Waktu Selesai
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#121212] mt-0.5">
                  Wirid & Doa Setelah Salat
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 bg-white border-2 border-[#121212] rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#121212] hover:bg-gray-100 font-black text-sm z-10 shrink-0"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader / Quick Actions */}
          <div className="px-4 py-2.5 bg-white border-b-2 border-[#121212] flex items-center justify-between flex-wrap gap-2 text-xs">
            <p className="text-gray-600 font-bold text-[11px]">
              Panduan dzikir dan doa ma'tsur sesudah salat fardhu
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAll}
                className="memphis-btn memphis-btn-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider gap-1.5"
              >
                {copiedId === 'all' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Salin Semua
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content Scrollable List */}
          <div className="p-3 sm:p-5 overflow-y-auto space-y-3.5 flex-1 divide-y-2 divide-transparent">
            {WIRID_SESUDAH_SALAT.map((item, index) => {
              const count = activeCounts[item.id] || 0;
              const hasTarget = item.targetCount !== undefined && item.targetCount > 1;
              const isTargetReached = hasTarget && count >= (item.targetCount || 0);
              const isExpanded = expandedId === item.id || hasTarget;

              return (
                <div
                  key={item.id}
                  className={`memphis-card p-3.5 sm:p-4 transition-all duration-150 ${
                    isTargetReached ? 'border-emerald-700 bg-emerald-50/50' : 'bg-white'
                  }`}
                >
                  {/* Top Bar item */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-black text-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-black text-xs sm:text-sm text-[#121212]">
                          {item.title}
                        </h3>
                        {item.subTitle && (
                          <p className="text-[10px] font-bold text-gray-500">
                            {item.subTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyText(item)}
                        title="Salin teks doa"
                        className="p-1 rounded-md border border-black hover:bg-gray-100 text-gray-700"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {!hasTarget && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="p-1 rounded-md border border-black hover:bg-gray-100 text-gray-700"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Arabic text with beautiful font styling */}
                  <div className="mt-2.5 p-3 bg-[#FFFDF8] rounded-xl border border-black/30">
                    <p className="text-right font-serif text-lg sm:text-xl leading-loose sm:leading-loose text-[#121212] select-text">
                      {item.arabic}
                    </p>
                  </div>

                  {/* Latin & Translation */}
                  {isExpanded && (
                    <div className="mt-2 space-y-1.5 text-xs">
                      <p className="font-semibold text-emerald-800 text-[11px] italic bg-emerald-50/60 p-2 rounded-lg border border-emerald-200">
                        {item.latin}
                      </p>
                      <p className="text-gray-700 text-[11px] leading-relaxed">
                        <strong className="text-black">Artinya:</strong> "{item.translation}"
                      </p>
                    </div>
                  )}

                  {/* Interactive Counter for Target-based Wirid (Istighfar 3x, Tasbih 33x, dll) */}
                  {hasTarget && (
                    <div className="mt-3 pt-2.5 border-t border-black/10 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase text-gray-600">
                          Target: {item.targetCount}x
                        </span>
                        {isTargetReached && (
                          <span className="memphis-badge bg-emerald-500 text-white text-[9px] gap-1 py-0.5">
                            <CheckCircle2 className="w-3 h-3 stroke-[3]" /> Selesai
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResetCount(item.id)}
                          className="text-[10px] font-bold text-gray-400 hover:text-red-500 hover:underline"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleIncrementCount(item.id, item.targetCount)}
                          className={`memphis-btn px-4 py-1.5 text-xs font-black uppercase tracking-wider gap-1.5 ${
                            isTargetReached 
                              ? 'bg-emerald-600 text-white' 
                              : 'memphis-btn-green text-white'
                          }`}
                        >
                          <span>Hitung: {count} / {item.targetCount}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Bar with Persistent Toggle Option */}
          <div className="p-3.5 sm:p-4 bg-white border-t-[2.5px] border-[#121212] flex flex-col sm:flex-row items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-800 select-none">
              <input
                type="checkbox"
                checked={autoShow}
                onChange={handleToggleAutoShow}
                className="w-4 h-4 accent-emerald-600 rounded border-2 border-black"
              />
              <span>Tampilkan otomatis modal ini saat 5 salat selesai</span>
            </label>

            <button
              onClick={onClose}
              className="memphis-btn memphis-btn-green w-full sm:w-auto px-6 py-2 text-xs font-black uppercase tracking-wider"
            >
              Tutup & Lanjutkan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
