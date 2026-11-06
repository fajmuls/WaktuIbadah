import React, { useState } from 'react';
import { Bookmark, X, Plus, Trash2, Check, Clock, Sparkles } from 'lucide-react';
import { SurahItem, AyatItem, ReadingHancaItem } from '../types';
import { storage } from '../lib/storage';
import { playQuranSound, vibrateSuccess } from '../lib/audio';

interface HancaBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  surah: SurahItem;
  ayah: AyatItem;
  onSuccess?: () => void;
}

export const HancaBookmarkModal: React.FC<HancaBookmarkModalProps> = ({
  isOpen,
  onClose,
  surah,
  ayah,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [hancas, setHancas] = useState<ReadingHancaItem[]>(() => storage.getReadingHancas());
  const [newHancaName, setNewHancaName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Check if this ayah is already bookmarked in any hanca
  const matchedHanca = hancas.find(
    h => h.surahNumber === surah.nomor && h.ayahNumber === ayah.nomorAyat
  );

  const handleSelectHanca = (hanca: ReadingHancaItem) => {
    const updated: ReadingHancaItem = {
      ...hanca,
      surahNumber: surah.nomor,
      surahName: surah.namaLatin,
      ayahNumber: ayah.nomorAyat,
      updatedAt: new Date().toISOString()
    };
    storage.saveReadingHanca(updated);
    playQuranSound('bookmark_saved');
    vibrateSuccess();
    setHancas(storage.getReadingHancas());
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleCreateNewHanca = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newHancaName.trim() || `Hanca ${hancas.length + 1}`;
    const newHanca: ReadingHancaItem = {
      id: `hanca-${Date.now()}`,
      name,
      surahNumber: surah.nomor,
      surahName: surah.namaLatin,
      ayahNumber: ayah.nomorAyat,
      updatedAt: new Date().toISOString()
    };
    storage.saveReadingHanca(newHanca);
    playQuranSound('bookmark_saved');
    vibrateSuccess();
    setNewHancaName('');
    setIsCreatingNew(false);
    setHancas(storage.getReadingHancas());
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleUnbookmark = () => {
    storage.unbookmarkAyah(surah.nomor, ayah.nomorAyat);
    playQuranSound('bookmark_removed');
    vibrateSuccess();
    setHancas(storage.getReadingHancas());
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Tandai Terakhir Dibaca (Hanca)"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <Bookmark className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Tandai Terakhir Dibaca (Hanca)
              </h3>
              <p className="text-[11px] text-gray-500">
                QS. {surah.namaLatin} : Ayat {ayah.nomorAyat}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If already matched/bookmarked */}
        {matchedHanca ? (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Ditandai pada: {matchedHanca.name}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
              Ayat ini saat ini merupakan batas penanda bacaan Anda. Anda dapat menghapus tanda bacaan ini kapan saja.
            </p>
            <button
              onClick={handleUnbookmark}
              className="w-full py-2 bg-red-500 hover:bg-red-600 active:scale-[0.99] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Tanda (Unbookmark)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <span className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Pilih Target Hanca untuk Ditandai:
            </span>

            {/* List of existing Hancas */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {hancas.map((hanca) => (
                <button
                  key={hanca.id}
                  onClick={() => handleSelectHanca(hanca)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-gray-50 dark:bg-slate-800/60 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-left transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white block group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                      {hanca.name}
                    </span>
                    <span className="text-[10px] text-gray-500 block truncate">
                      Sebelumnya: QS {hanca.surahName} : {hanca.ayahNumber}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 group-hover:underline shrink-0">
                    Tandai Di Sini &rarr;
                  </span>
                </button>
              ))}
            </div>

            {/* Create new Hanca toggle */}
            {!isCreatingNew ? (
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-slate-700 hover:border-emerald-500 text-gray-600 dark:text-gray-400 hover:text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Buat Set Hanca Baru</span>
              </button>
            ) : (
              <form onSubmit={handleCreateNewHanca} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2.5">
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                  Nama Set Hanca Baru
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tahfidz Juz 30, Tilawah Malam..."
                  value={newHancaName}
                  onChange={(e) => setNewHancaName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Simpan Penanda
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
