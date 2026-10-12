import React, { useState, useEffect } from 'react';
import { 
  Bookmark, X, Save, Trash2, Sparkles, Heart, BookOpen, 
  Check, Quote, Tag
} from 'lucide-react';
import { FavoriteAyah, AyahBookmarkCategory, AyahBookmarkColor, AyatItem, SurahItem } from '../types';
import { storage } from '../lib/storage';
import { vibrateSuccess } from '../lib/audio';

interface TadabburBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  surah: SurahItem | null;
  ayah: AyatItem | null;
  onSaved: () => void;
}

const CATEGORIES: Array<{
  id: AyahBookmarkCategory;
  name: string;
  color: AyahBookmarkColor;
  bgLight: string;
  borderLight: string;
  textLight: string;
  desc: string;
}> = [
  { 
    id: 'Hafalan', 
    name: 'Hafalan (Tahfidz)', 
    color: 'emerald', 
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/60', 
    borderLight: 'border-emerald-300 dark:border-emerald-700', 
    textLight: 'text-emerald-800 dark:text-emerald-300',
    desc: 'Target ayat yang sedang dihafal atau dimuraja\'ah'
  },
  { 
    id: 'Doa', 
    name: 'Doa & Munajat', 
    color: 'amber', 
    bgLight: 'bg-amber-50 dark:bg-amber-950/60', 
    borderLight: 'border-amber-300 dark:border-amber-700', 
    textLight: 'text-amber-800 dark:text-amber-300',
    desc: 'Doa mustajab dari Al-Qur\'an untuk dibaca setiap hari'
  },
  { 
    id: 'Motivasi', 
    name: 'Motivasi & Penguat Hati', 
    color: 'blue', 
    bgLight: 'bg-blue-50 dark:bg-blue-950/60', 
    borderLight: 'border-blue-300 dark:border-blue-700', 
    textLight: 'text-blue-800 dark:text-blue-300',
    desc: 'Ayat pelecut semangat belajar dan penenang saat lelah'
  },
  { 
    id: 'Tadabbur', 
    name: 'Tadabbur & Renungan', 
    color: 'purple', 
    bgLight: 'bg-purple-50 dark:bg-purple-950/60', 
    borderLight: 'border-purple-300 dark:border-purple-700', 
    textLight: 'text-purple-800 dark:text-purple-300',
    desc: 'Hikmah dan perenungan mendalam atas ayat Allah'
  },
];

export function TadabburBookmarkModal({
  isOpen,
  onClose,
  surah,
  ayah,
  onSaved
}: TadabburBookmarkModalProps) {
  const [category, setCategory] = useState<AyahBookmarkCategory>('Tadabbur');
  const [note, setNote] = useState('');
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    if (surah && ayah) {
      const ayahId = `${surah.nomor}:${ayah.nomorAyat}`;
      const favorites = storage.getFavoriteAyahs();
      const existing = favorites.find(a => a.id === ayahId);
      if (existing) {
        setIsExisting(true);
        setCategory(existing.category || 'Tadabbur');
        setNote(existing.note || '');
      } else {
        setIsExisting(false);
        setCategory('Tadabbur');
        setNote('');
      }
    }
  }, [surah, ayah, isOpen]);

  if (!isOpen || !surah || !ayah) return null;

  const currentCategoryMeta = CATEGORIES.find(c => c.id === category) || CATEGORIES[3];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const ayahId = `${surah.nomor}:${ayah.nomorAyat}`;
    const newBookmark: FavoriteAyah = {
      id: ayahId,
      surahNumber: surah.nomor,
      surahName: surah.namaLatin,
      ayahNumber: ayah.nomorAyat,
      arab: ayah.teksArab,
      latin: ayah.teksLatin,
      translation: ayah.teksIndonesia,
      category: category,
      color: currentCategoryMeta.color,
      note: note.trim(),
      addedAt: new Date().toISOString()
    };

    if (isExisting) {
      storage.updateFavoriteAyah(newBookmark);
    } else {
      storage.addFavoriteAyah(newBookmark);
    }

    vibrateSuccess();
    onSaved();
    onClose();
  };

  const handleDelete = () => {
    const ayahId = `${surah.nomor}:${ayah.nomorAyat}`;
    storage.removeFavoriteAyah(ayahId);
    vibrateSuccess();
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                Bookmark & Mode Tadabbur
              </h3>
              <p className="text-xs text-gray-400">
                QS. {surah.namaLatin} Ayat {ayah.nomorAyat}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ayah Snippet preview */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-2">
          <div className="text-right font-serif text-lg leading-loose text-gray-900 dark:text-gray-100" dir="rtl">
            {ayah.teksArab}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-2">
            "{ayah.teksIndonesia}"
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Category Chips Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-600" />
              <span>Pilih Kategori Penanda (Warna Khusus):</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? `${cat.bgLight} ${cat.borderLight} ring-2 ring-purple-500/30 shadow-xs`
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${isSelected ? cat.textLight : 'text-gray-800 dark:text-gray-200'}`}>
                        {cat.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-gray-400 line-clamp-1">
                      {cat.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personal Tadabbur Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-purple-600" />
              <span>Catatan Tadabbur & Refleksi Pribadi (Opsional):</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Mengingatkan saya untuk selalu sabar saat menghadapi tugas berat, atau target selesai hafal minggu ini..."
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-purple-500 placeholder:text-gray-400 text-gray-900 dark:text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {isExisting && (
              <button
                type="button"
                onClick={handleDelete}
                className="py-3 px-3.5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5 shrink-0"
                title="Hapus bookmark ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus</span>
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>{isExisting ? 'Perbarui Bookmark & Tadabbur' : 'Simpan Bookmark Berwarna'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
