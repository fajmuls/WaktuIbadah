import React from 'react';
import { X, Type, BookOpen, Layers, Maximize2, Minimize2, Check } from 'lucide-react';

interface QuranReaderSettingsModalProps {
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
}

export const FONT_PRESETS = [
  { label: 'A--', size: 17, name: 'Sangat Kecil' },
  { label: 'A-', size: 21, name: 'Kecil' },
  { label: 'A', size: 25, name: 'Normal' },
  { label: 'A+', size: 30, name: 'Besar' },
  { label: 'A++', size: 36, name: 'Sangat Besar' },
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
  toggleFullscreen
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Pengaturan Pembaca Al-Qur'an"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Pengaturan Tampilan
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Ukuran Font Arab (5 discrete buttons: A--, A-, A, A+, A++) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
            Ukuran Tulisan Arab
          </label>
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
            {FONT_PRESETS.map((preset) => {
              const isActive = quranFontSize === preset.size;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFontSizePreset(preset.size)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs scale-[1.02]'
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

        {/* 2. Mode Pembaca: Per Ayat vs Mushaf */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
            Mode Tampilan Baca
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => toggleReadingMode('card')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                readingMode === 'card'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Per Ayat</span>
            </button>
            <button
              type="button"
              onClick={() => toggleReadingMode('mushaf')}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                readingMode === 'mushaf'
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-2xs'
                  : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mushaf Kontinu</span>
            </button>
          </div>
        </div>

        {/* 3. Teks Toggles (Latin & Terjemahan) */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Teks Transliterasi Latin
            </span>
            <button
              type="button"
              onClick={toggleShowLatin}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
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
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
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
        </div>

        {/* 4. Fullscreen button */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-full py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span>{isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
