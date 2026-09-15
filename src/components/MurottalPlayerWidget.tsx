import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Clock, Moon, Sparkles, ChevronUp, ChevronDown, X, Repeat, 
  Search, Check, Music2, Headphones, ShieldCheck
} from 'lucide-react';
import { 
  murottalPlayer, SURAH_LIST, RECITERS, SurahMeta 
} from '../lib/murottal';
import { vibrateSuccess } from '../lib/audio';

export function MurottalPlayerWidget() {
  const [isPlaying, setIsPlaying] = useState(murottalPlayer.isPlaying);
  const [currentSurahNum, setCurrentSurahNum] = useState(murottalPlayer.surahNumber);
  const [reciterId, setReciterId] = useState(murottalPlayer.reciterId);
  const [currentTime, setCurrentTime] = useState(murottalPlayer.currentTime);
  const [duration, setDuration] = useState(murottalPlayer.duration);
  const [autoplayNext, setAutoplayNext] = useState(murottalPlayer.autoplayNext);
  const [isLoopCurrent, setIsLoopCurrent] = useState(murottalPlayer.isLoopCurrent);
  const [sleepTimerSeconds, setSleepTimerSeconds] = useState<number | null>(murottalPlayer.sleepTimerSecondsRemaining);
  const [sleepTimerMode, setSleepTimerMode] = useState(murottalPlayer.sleepTimerMode);
  
  // UI States
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSurahModalOpen, setIsSurahModalOpen] = useState(false);
  const [surahSearch, setSurahSearch] = useState('');
  const [customTimerInput, setCustomTimerInput] = useState('20');
  const [showCustomTimerInput, setShowCustomTimerInput] = useState(false);

  // Subscribe to audio singleton updates
  useEffect(() => {
    const unsubscribe = murottalPlayer.subscribe(() => {
      setIsPlaying(murottalPlayer.isPlaying);
      setCurrentSurahNum(murottalPlayer.surahNumber);
      setReciterId(murottalPlayer.reciterId);
      setCurrentTime(murottalPlayer.currentTime);
      setDuration(murottalPlayer.duration);
      setAutoplayNext(murottalPlayer.autoplayNext);
      setIsLoopCurrent(murottalPlayer.isLoopCurrent);
      setSleepTimerSeconds(murottalPlayer.sleepTimerSecondsRemaining);
      setSleepTimerMode(murottalPlayer.sleepTimerMode);
    });

    return () => unsubscribe();
  }, []);

  const currentSurah = SURAH_LIST.find(s => s.number === currentSurahNum) || SURAH_LIST[0];
  const currentReciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatSleepTimer = (totalSecs: number | null) => {
    if (totalSecs === null || totalSecs <= 0) return null;
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    murottalPlayer.seek(val);
  };

  const handleSurahSelect = (sNum: number) => {
    murottalPlayer.setSurah(sNum, true);
    setIsSurahModalOpen(false);
    vibrateSuccess();
  };

  const filteredSurahs = SURAH_LIST.filter(s => 
    s.name.toLowerCase().includes(surahSearch.toLowerCase()) ||
    s.translation.toLowerCase().includes(surahSearch.toLowerCase()) ||
    s.number.toString().includes(surahSearch)
  );

  // If not active or never played and closed, we can still show a sleek floating trigger on desktop/mobile
  const isWidgetActive = isPlaying || isExpanded || currentTime > 0;

  return (
    <>
      {/* 1. FLOATING MINI PLAYER (Sticky at Bottom when playing or expanded) */}
      {isWidgetActive && !isExpanded && (
        <div 
          className="fixed bottom-20 md:bottom-6 right-3 left-3 md:left-auto md:right-6 md:w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl shadow-xl z-40 p-3 flex items-center justify-between gap-3 transition-all animate-in slide-in-from-bottom-5"
        >
          {/* Track Info */}
          <div 
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
              <Headphones className="w-5 h-5 text-emerald-100" />
              {isPlaying && (
                <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center gap-0.5">
                  <span className="w-0.5 h-3 bg-white animate-pulse" />
                  <span className="w-0.5 h-4 bg-white animate-pulse delay-75" />
                  <span className="w-0.5 h-2 bg-white animate-pulse delay-150" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900 dark:text-white truncate">
                  QS. {currentSurah.number}. {currentSurah.name}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded shrink-0">
                  {currentSurah.arabic}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="truncate">{currentReciter.name.split(' ')[0]}</span>
                <span>•</span>
                <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                {sleepTimerSeconds !== null && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-1 rounded flex items-center gap-0.5 shrink-0">
                    <Moon className="w-2.5 h-2.5" />
                    {formatSleepTimer(sleepTimerSeconds)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Playback Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => murottalPlayer.playPreviousSurah()}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-emerald-600 rounded-lg"
              title="Surah Sebelumnya"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => murottalPlayer.togglePlay()}
              className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
              title={isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <button
              onClick={() => murottalPlayer.playNextSurah()}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-emerald-600 rounded-lg"
              title="Surah Berikutnya"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(true)}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Buka Pemutar Lengkap"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. FULL EXPANDED PLAYER MODAL */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Pemutar Murottal 30 Juz
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Audio latar belakang dengan Sleep Timer
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Player Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Surah Art Banner */}
              <div className="bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden text-center">
                <div className="absolute top-2 right-2 opacity-10">
                  <Music2 className="w-24 h-24" />
                </div>
                <button
                  onClick={() => setIsSurahModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-semibold backdrop-blur-xs transition-colors mb-3"
                >
                  <Search className="w-3 h-3" />
                  <span>Pilih Surat ({currentSurah.number}/114)</span>
                </button>
                <h2 className="text-2xl font-bold font-arabic mb-1 tracking-wide">
                  {currentSurah.arabic}
                </h2>
                <h3 className="text-lg font-bold text-emerald-100">
                  Surah {currentSurah.name}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  {currentSurah.translation} • {currentSurah.verses} Ayat ({currentSurah.place})
                </p>
              </div>

              {/* Reciter Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
                  Pilihan Qari / Pelantun Ayat:
                </label>
                <select
                  value={reciterId}
                  onChange={(e) => murottalPlayer.setReciter(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {RECITERS.map(reciter => (
                    <option key={reciter.id} value={reciter.id}>
                      {reciter.name} ({reciter.style})
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress Bar & Timestamps */}
              <div className="space-y-1.5">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={() => {
                    const next = !isLoopCurrent;
                    murottalPlayer.isLoopCurrent = next;
                    setIsLoopCurrent(next);
                    vibrateSuccess();
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                    isLoopCurrent 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title="Ulangi Surat Ini Saja"
                >
                  <Repeat className="w-4 h-4" />
                </button>

                <button
                  onClick={() => murottalPlayer.playPreviousSurah()}
                  className="p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors"
                  title="Surah Sebelumnya"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={() => murottalPlayer.togglePlay()}
                  className="w-14 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
                </button>

                <button
                  onClick={() => murottalPlayer.playNextSurah()}
                  className="p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition-colors"
                  title="Surah Selanjutnya"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    const next = !autoplayNext;
                    murottalPlayer.autoplayNext = next;
                    setAutoplayNext(next);
                  }}
                  className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                    autoplayNext 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' 
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title="Lanjut Otomatis ke Surat Berikutnya"
                >
                  <span className="text-[10px] font-bold">Auto</span>
                </button>
              </div>

              {/* SLEEP TIMER SECTION */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      Sleep Timer (Mati Otomatis)
                    </span>
                  </div>
                  {sleepTimerSeconds !== null ? (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatSleepTimer(sleepTimerSeconds)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-gray-500">
                      Nonaktif
                    </span>
                  )}
                </div>

                {/* Sleep Timer Preset Buttons */}
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    onClick={() => {
                      murottalPlayer.setSleepTimer('none');
                      vibrateSuccess();
                    }}
                    className={`py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      sleepTimerMode === 'none'
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    Mati
                  </button>
                  <button
                    onClick={() => {
                      murottalPlayer.setSleepTimer('15');
                      vibrateSuccess();
                    }}
                    className={`py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      sleepTimerMode === '15'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    15 mnt
                  </button>
                  <button
                    onClick={() => {
                      murottalPlayer.setSleepTimer('30');
                      vibrateSuccess();
                    }}
                    className={`py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      sleepTimerMode === '30'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    30 mnt
                  </button>
                  <button
                    onClick={() => {
                      murottalPlayer.setSleepTimer('60');
                      vibrateSuccess();
                    }}
                    className={`py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      sleepTimerMode === '60'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    60 mnt
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => {
                      murottalPlayer.setSleepTimer('surah_end');
                      vibrateSuccess();
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-colors border ${
                      sleepTimerMode === 'surah_end'
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    Sampai Akhir Surat Ini
                  </button>
                  <button
                    onClick={() => setShowCustomTimerInput(!showCustomTimerInput)}
                    className="py-1.5 px-3 rounded-xl text-[11px] font-semibold bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                  >
                    Waktu Khusus
                  </button>
                </div>

                {showCustomTimerInput && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={customTimerInput}
                      onChange={(e) => setCustomTimerInput(e.target.value)}
                      placeholder="Menit"
                      className="w-20 p-1.5 text-xs text-center border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-xs text-gray-500">menit</span>
                    <button
                      onClick={() => {
                        const m = parseInt(customTimerInput, 10);
                        if (!isNaN(m) && m > 0) {
                          murottalPlayer.setSleepTimer('custom', m);
                          setShowCustomTimerInput(false);
                          vibrateSuccess();
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                    >
                      Terapkan
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Didukung kontrol audio layar kunci & latar belakang
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Sembunyikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SURAH SELECTION MODAL */}
      {isSurahModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                  Pilih Surat Al-Qur'an (1 - 114)
                </h3>
                <p className="text-[11px] text-gray-500">Pilih surat untuk langsung diputar</p>
              </div>
              <button
                onClick={() => setIsSurahModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={surahSearch}
                  onChange={(e) => setSurahSearch(e.target.value)}
                  placeholder="Cari nama surat atau nomor..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Surah List */}
            <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
              {filteredSurahs.map(s => {
                const isSelected = s.number === currentSurahNum;
                return (
                  <button
                    key={s.number}
                    onClick={() => handleSurahSelect(s.number)}
                    className={`w-full p-3 rounded-2xl text-left flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                        isSelected 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        {s.number}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-gray-900 dark:text-white truncate">
                          Surah {s.name}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {s.translation} • {s.verses} Ayat
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-arabic font-bold text-sm text-emerald-800 dark:text-emerald-300">
                        {s.arabic}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
