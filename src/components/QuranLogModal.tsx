import React, { useState } from 'react';
import { BookOpen, Check, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { storage } from '../lib/storage';
import { vibrateSuccess } from '../lib/audio';

interface QuranLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  surahNumber: number;
  surahName: string;
  totalAyah: number;
  suggestedStart?: number;
  suggestedEnd?: number;
  onLogSaved?: () => void;
}

export const QuranLogModal: React.FC<QuranLogModalProps> = ({
  isOpen,
  onClose,
  surahNumber,
  surahName,
  totalAyah,
  suggestedStart = 1,
  suggestedEnd = 1,
  onLogSaved,
}) => {
  const [startAyah, setStartAyah] = useState<number>(suggestedStart);
  const [endAyah, setEndAyah] = useState<number>(suggestedEnd || totalAyah);
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = Math.max(1, Math.min(startAyah, totalAyah));
    const end = Math.max(start, Math.min(endAyah, totalAyah));

    storage.addQuranLog({
      id: `qlog_${Date.now()}`,
      date,
      surahNumber,
      surahName,
      startAyat: start,
      endAyat: end,
      totalAyat: end - start + 1,
      completedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    });

    // Also update last read position
    localStorage.setItem('wi_last_read', JSON.stringify({
      number: surahNumber,
      name: surahName,
      lastAyah: end,
      date
    }));

    vibrateSuccess();
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onLogSaved) onLogSaved();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Catat Tilawah Qur'an
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Surah {surahName} ({totalAyah} Ayat)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
              <Check className="w-6 h-6" />
            </div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">Tilawah Berhasil Dicatat!</p>
            <p className="text-xs text-gray-500 mt-1">Data otomatis tersinkron ke progres ibadah.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Tanggal Membaca
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Dari Ayat
                </label>
                <input
                  type="number"
                  min={1}
                  max={totalAyah}
                  value={startAyah}
                  onChange={(e) => setStartAyah(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                  Sampai Ayat
                </label>
                <input
                  type="number"
                  min={startAyah}
                  max={totalAyah}
                  value={endAyah}
                  onChange={(e) => setEndAyah(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>Total dibaca:</span>
              <span className="font-bold">{Math.max(0, endAyah - startAyah + 1)} Ayat</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                Catatan / Refleksi (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Tadabbur ayat 1-10 setelah Subuh"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
              >
                Simpan Tilawah
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
