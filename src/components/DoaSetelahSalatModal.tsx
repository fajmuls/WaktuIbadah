import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, Copy, ChevronDown, ChevronUp, Bell, CheckCircle2, BookmarkCheck, ArrowRight } from 'lucide-react';
import { WIRID_SESUDAH_SALAT, PrayerItem } from '../data/prayers-data';
import { storage } from '../lib/storage';
import { playSaveSuccessSound, playDhikrTapSound, playToggleSound } from '../lib/audio';
import { Link } from 'react-router-dom';

interface DoaSetelahSalatModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr?: string;
  prayerName?: string;
}

export const DoaSetelahSalatModal: React.FC<DoaSetelahSalatModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  prayerName,
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

  const handleDisableForever = () => {
    playToggleSound();
    setAutoShow(false);
    storage.setAutoDoaModal(false);
    onClose();
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
          className="w-full max-w-2xl bg-[#FFFDF8] border-[1.5px] border-[#121212] rounded-2xl sm:rounded-3xl shadow-[4px_4px_0px_#121212] overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Banner */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 border-b-[1.5px] border-[#121212] flex items-center justify-between text-[#121212] relative overflow-hidden">
            <div className="flex items-center gap-2.5 z-10">
              <div className="w-10 h-10 bg-white border-[1.5px] border-[#121212] rounded-xl flex items-center justify-center shadow-[1.5px_1.5px_0px_#121212] shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-black text-[#6EE7B7] text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Alhamdulillah
                  </span>
                  {prayerName && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#121212]">
                      Salat {prayerName} Selesai
                    </span>
                  )}
                </div>
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-[#121212] mt-0.5">
                  Wirid & Doa Setelah Salat
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 bg-white border-[1.5px] border-[#121212] rounded-xl flex items-center justify-center shadow-[1.5px_1.5px_0px_#121212] hover:bg-gray-100 font-bold text-sm z-10 shrink-0"
              aria-label="Tutup modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subheader / Quick Actions */}
          <div className="px-3.5 py-2 bg-white border-b-[1.5px] border-[#121212] flex items-center justify-between flex-wrap gap-2 text-xs">
            <p className="text-gray-600 font-medium text-[11px]">
              Dzikir ma'tsur sesudah salat fardhu
            </p>
            <div className="flex items-center gap-2">
              <Link
                to="/doa"
                onClick={onClose}
                className="text-[10px] text-emerald-700 hover:underline font-bold flex items-center gap-0.5"
              >
                <span>Halaman Doa Lengkap</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
              <button
                onClick={handleCopyAll}
                className="px-2 py-0.5 border border-black bg-white rounded text-[10px] font-bold flex items-center gap-1 shadow-[1px_1px_0px_#121212]"
              >
                {copiedId === 'all' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    Tersalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Salin Semua
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content Scrollable List */}
          <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
            {WIRID_SESUDAH_SALAT.map((item, index) => {
              const count = activeCounts[item.id] || 0;
              const hasTarget = item.targetCount !== undefined && item.targetCount > 1;
              const isTargetReached = hasTarget && count >= (item.targetCount || 0);
              const isExpanded = expandedId === item.id || hasTarget;

              return (
                <div
                  key={item.id}
                  className={`border-[1.5px] border-[#121212] rounded-xl p-3 transition-all duration-150 shadow-[1.5px_1.5px_0px_#121212] ${
                    isTargetReached ? 'border-emerald-700 bg-emerald-50/60' : 'bg-white'
                  }`}
                >
                  {/* Top Bar item */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-black text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs sm:text-sm text-[#121212] truncate">
                          {item.title}
                        </h3>
                        {item.subTitle && (
                          <p className="text-[10px] font-semibold text-gray-500 truncate">
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
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {!hasTarget && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="p-1 rounded-md border border-black hover:bg-gray-100 text-gray-700"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Arabic text with beautiful font styling */}
                  <div className="mt-2 p-2.5 bg-[#FFFDF8] rounded-lg border border-black/20">
                    <p className="text-right font-serif text-base sm:text-lg leading-loose text-[#121212] select-text">
                      {item.arabic}
                    </p>
                  </div>

                  {/* Latin & Translation */}
                  {isExpanded && (
                    <div className="mt-2 space-y-1 text-xs">
                      <p className="font-medium text-emerald-800 text-[11px] italic bg-emerald-50/60 p-1.5 rounded-lg border border-emerald-200">
                        {item.latin}
                      </p>
                      <p className="text-gray-700 text-[11px] leading-relaxed">
                        <strong className="text-black">Artinya:</strong> "{item.translation}"
                      </p>
                    </div>
                  )}

                  {/* Interactive Counter for Target-based Wirid */}
                  {hasTarget && (
                    <div className="mt-2.5 pt-2 border-t border-black/10 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-gray-600">
                          Target: {item.targetCount}x
                        </span>
                        {isTargetReached && (
                          <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" /> Selesai
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleResetCount(item.id)}
                          className="text-[10px] font-bold text-gray-400 hover:text-red-500"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => handleIncrementCount(item.id, item.targetCount)}
                          className={`px-3 py-1 rounded-lg border border-black text-xs font-bold shadow-[1px_1px_0px_#121212] active:translate-y-0.5 transition-all ${
                            isTargetReached 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-emerald-400 text-black'
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
          <div className="p-3 bg-white border-t-[1.5px] border-[#121212] flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-gray-800 select-none">
              <input
                type="checkbox"
                checked={autoShow}
                onChange={handleToggleAutoShow}
                className="w-3.5 h-3.5 accent-emerald-600 rounded border border-black"
              />
              <span>Ingatkan wirid setiap selesai salat</span>
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDisableForever}
                className="flex-1 sm:flex-initial px-3 py-1.5 border border-black bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg"
                title="Nonaktifkan pengingat wirid otomatis"
              >
                Jangan Ingatkan Lagi
              </button>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-1.5 border-[1.5px] border-black bg-emerald-400 hover:bg-emerald-500 text-black rounded-lg text-xs font-bold shadow-[1.5px_1.5px_0px_#121212]"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
