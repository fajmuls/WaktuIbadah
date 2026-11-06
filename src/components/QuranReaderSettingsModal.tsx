import React from 'react';
import { X, Type, BookOpen, Layers, Maximize2, Minimize2, Check, Headphones, Palette, Compass } from 'lucide-react';

export interface QuranReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showLatin: boolean;
  toggleShowLatin: () => void;
  showTranslation: boolean;
  toggleShowTranslation: () => void;
  quranFontSize: number;
  setFontSizePreset: (size: number) => void;
  readingMode: 'card' | 'mushaf';
  toggleReadingMode: (mode: 'card' | 'mushaf') => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  readerTheme: 'default' | 'sepia' | 'dark';
  setReaderTheme: (theme: 'default' | 'sepia' | 'dark') => void;
  selectedQari: string;
  setSelectedQari: (qariId: string) => void;
  autoScroll: boolean;
  toggleAutoScroll: () => void;
  tajweedEnabled: boolean;
  toggleTajweed: () => void;
}

export const FONT_PRESETS = [
  { label: 'A--', size: 17, name: 'Sangat Kecil' },
  { label: 'A-', size: 21, name: 'Kecil' },
  { label: 'A', size: 25, name: 'Normal' },
  { label: 'A+', size: 30, name: 'Besar' },
  { label: 'A++', size: 36, name: 'Sangat Besar' },
];

export const QARI_LIST = [
  { id: '05', name: 'Misyari Rasyid Al-Afasy', desc: 'Merdu & Populer' },
  { id: '01', name: 'Abdurrahman As-Sudais', desc: 'Imam Masjidil Haram' },
  { id: '04', name: "Sa'ad Al-Ghamidi", desc: 'Tenang & Khusyuk' },
];

export const QuranReaderSettingsModal: React.FC<QuranReaderSettingsModalProps> = ({
  isOpen,
  onClose,
  showLatin,
  toggleShowLatin,
  showTranslation,
  toggleShowTranslation,
  quranFontSize,
  setFontSizePreset,
  readingMode,
  toggleReadingMode,
  isFullscreen,
  toggleFullscreen,
  readerTheme,
  setReaderTheme,
  selectedQari,
  setSelectedQari,
  autoScroll,
  toggleAutoScroll,
  tajweedEnabled,
  toggleTajweed
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border-[1.5px] border-[#121212] dark:border-slate-700 shadow-[4px_4px_0px_#121212] p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Pengaturan Pembaca Al-Qur'an"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-[1.5px] border-[#121212] flex items-center justify-center shadow-[1.5px_1.5px_0px_#121212]">
              <Type className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#121212] dark:text-white">
                Pengaturan Pembaca Qur'an
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                Sesuaikan font, tema kitab, qari murottal & auto-scroll
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border-[1.5px] border-[#121212] dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 flex items-center justify-center transition-colors shadow-[1px_1px_0px_#121212]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Tema Warna Kertas Kuno (Parchment/Sepia), Putih, Gelap */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
            <Palette className="w-3.5 h-3.5 text-amber-600" />
            <span>Tema Warna Membaca</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setReaderTheme('default')}
              className={`p-2 rounded-xl border-[1.5px] text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                readerTheme === 'default'
                  ? 'border-[#121212] bg-white text-black shadow-[2px_2px_0px_#121212]'
                  : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white border border-gray-400" />
              <span>Putih Bersih</span>
            </button>

            <button
              type="button"
              onClick={() => setReaderTheme('sepia')}
              className={`p-2 rounded-xl border-[1.5px] text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                readerTheme === 'sepia'
                  ? 'border-[#121212] bg-[#F4EEDD] text-[#3E2F1B] shadow-[2px_2px_0px_#121212]'
                  : 'border-gray-200 dark:border-slate-700 bg-[#FBF8EF] text-amber-900'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-[#EADECA] border border-amber-800" />
              <span>Kertas Kuno</span>
            </button>

            <button
              type="button"
              onClick={() => setReaderTheme('dark')}
              className={`p-2 rounded-xl border-[1.5px] text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                readerTheme === 'dark'
                  ? 'border-[#121212] bg-slate-900 text-white shadow-[2px_2px_0px_#121212]'
                  : 'border-gray-200 dark:border-slate-700 bg-slate-800 text-gray-300'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-slate-950 border border-slate-600" />
              <span>Mode Gelap</span>
            </button>
          </div>
        </div>

        {/* 2. Ukuran Font Arab (5 discrete buttons: A--, A-, A, A+, A++) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
            Ukuran Tulisan Arab
          </label>
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl border-[1.5px] border-[#121212] shadow-[1.5px_1.5px_0px_#121212]">
            {FONT_PRESETS.map((preset) => {
              const isActive = quranFontSize === preset.size;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFontSizePreset(preset.size)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs border border-black'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                  title={preset.name}
                >
                  <span className="leading-none">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Pilihan Qari Murottal */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200">
            <Headphones className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pilihan Suara Qari</span>
          </label>
          <div className="space-y-1.5">
            {QARI_LIST.map((qari) => {
              const isSelected = selectedQari === qari.id;
              return (
                <button
                  key={qari.id}
                  type="button"
                  onClick={() => setSelectedQari(qari.id)}
                  className={`w-full p-2.5 rounded-xl border-[1.5px] text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-[#121212] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 shadow-[2px_2px_0px_#121212]'
                      : 'border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{qari.name}</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{qari.desc}</span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Auto-Scroll Murottal Toggle */}
        <div className="flex items-center justify-between py-1 px-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border-[1.5px] border-[#121212]">
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white block">
              Auto-Scroll & Sorot Murottal
            </span>
            <span className="text-[10px] text-gray-600 dark:text-gray-400">
              Layar otomatis menggulir & menyorot ayat yang diputar
            </span>
          </div>
          <button
            type="button"
            onClick={toggleAutoScroll}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border border-black ${
              autoScroll ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-700'
            }`}
            aria-label="Toggle Auto Scroll"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                autoScroll ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 5. Mode Pembaca: Per Ayat vs Mushaf */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
            Tata Letak Pembaca
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => toggleReadingMode('card')}
              className={`p-2 rounded-xl border-[1.5px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                readingMode === 'card'
                  ? 'border-[#121212] bg-emerald-100 dark:bg-emerald-900/60 text-[#121212] dark:text-white shadow-[2px_2px_0px_#121212]'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Per Ayat</span>
            </button>
            <button
              type="button"
              onClick={() => toggleReadingMode('mushaf')}
              className={`p-2 rounded-xl border-[1.5px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                readingMode === 'mushaf'
                  ? 'border-[#121212] bg-emerald-100 dark:bg-emerald-900/60 text-[#121212] dark:text-white shadow-[2px_2px_0px_#121212]'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mushaf Kontinu</span>
            </button>
          </div>
        </div>

        {/* 6. Teks Toggles (Latin & Terjemahan) */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Teks Transliterasi Latin
            </span>
            <button
              type="button"
              onClick={toggleShowLatin}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border border-black ${
                showLatin ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle Latin"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  showLatin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Terjemahan Bahasa Indonesia
            </span>
            <button
              type="button"
              onClick={toggleShowTranslation}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border border-black ${
                showTranslation ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-700'
              }`}
              aria-label="Toggle Terjemahan"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  showTranslation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Tajwid Berwarna Kemenag RI */}
          <div className="py-2 border-t border-gray-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                  Warna Tajwid Standar Kemenag
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  Pemberian warna kaidah tajwid pada lafaz ayat
                </span>
              </div>
              <button
                type="button"
                onClick={toggleTajweed}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 border border-black ${
                  tajweedEnabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle Tajwid"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    tajweedEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Kemenag Tajweed Legend */}
            {tajweedEnabled && (
              <div className="p-2 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 grid grid-cols-3 gap-1.5 text-[9.5px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Ghunnah</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Ikhfa</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Idgham</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Iqlab</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Qalqalah</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Mad</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7. Fullscreen button */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-full py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold border-[1.5px] border-[#121212] shadow-[1.5px_1.5px_0px_#121212] flex items-center justify-center gap-2 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
