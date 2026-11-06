import React, { useState, useEffect, useMemo } from 'react';
import { 
  Check, Clock, CheckCircle2, Circle, Plus, Sparkles, 
  RefreshCw, Maximize2, Minimize2, ExternalLink, Moon, Sun, 
  Calendar, Layers, Volume2
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { storage } from '../lib/storage';
import { getPrayerTimesForToday, getCachedPrayerData, getNextPrayer } from '../lib/prayer-times';
import { Task, PrayerLog } from '../types';
import { vibrateSuccess, playButtonTapSound, playSaveSuccessSound } from '../lib/audio';

export default function WidgetPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sizeMode, setSizeMode] = useState<'mini' | 'medium' | 'full'>('medium');
  const [isGlass, setIsGlass] = useState(true);
  
  const todayStr = format(currentTime, 'yyyy-MM-dd');
  const [prayerLog, setPrayerLog] = useState<PrayerLog>(() => storage.getPrayerLog(todayStr));
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to external storage updates
  useEffect(() => {
    const syncData = () => {
      setPrayerLog(storage.getPrayerLog(todayStr));
      setTasks(storage.getTasks());
    };
    window.addEventListener('storage', syncData);
    window.addEventListener('wi_cloud_synced', syncData);
    return () => {
      window.removeEventListener('storage', syncData);
      window.removeEventListener('wi_cloud_synced', syncData);
    };
  }, [todayStr]);

  const prayerTimes = useMemo(() => {
    const cached = getCachedPrayerData();
    return cached?.times || getPrayerTimesForToday();
  }, []);

  const nextPrayer = useMemo(() => {
    return getNextPrayer(prayerTimes, currentTime);
  }, [prayerTimes, currentTime]);

  const prayersList: Array<{ key: keyof PrayerLog['prayers']; name: string; time: string }> = [
    { key: 'Subuh', name: 'Subuh', time: prayerTimes['Subuh'] || '04:30' },
    { key: 'Zuhur', name: 'Zuhur', time: prayerTimes['Zuhur'] || '12:00' },
    { key: 'Asar', name: 'Asar', time: prayerTimes['Asar'] || '15:15' },
    { key: 'Magrib', name: 'Magrib', time: prayerTimes['Magrib'] || '18:05' },
    { key: 'Isya', name: 'Isya', time: prayerTimes['Isya'] || '19:15' },
  ];

  const handleTogglePrayer = (key: keyof PrayerLog['prayers']) => {
    vibrateSuccess();
    playButtonTapSound();
    const updated = storage.togglePrayer(todayStr, key);
    setPrayerLog(updated);
  };

  const handleToggleTask = (taskId: string) => {
    vibrateSuccess();
    playButtonTapSound();
    storage.toggleTask(taskId);
    setTasks(storage.getTasks());
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: quickTaskTitle.trim(),
      priority: 'Sedang',
      deadline: todayStr,
      status: 'Belum mulai',
      createdAt: new Date().toISOString()
    };
    storage.addTask(newTask);
    playSaveSuccessSound();
    setTasks(storage.getTasks());
    setQuickTaskTitle('');
    setIsAddingTask(false);
  };

  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.status !== 'Selesai' || t.deadline === todayStr).slice(0, 6);
  }, [tasks, todayStr]);

  const completedPrayersCount = Object.values(prayerLog.prayers).filter(Boolean).length;

  return (
    <div className={`min-h-screen p-3 sm:p-5 flex flex-col items-center justify-center select-none ${
      isGlass 
        ? 'bg-slate-950/80 backdrop-blur-md text-white' 
        : 'bg-[#FFFDF8] dark:bg-slate-950 text-[#121212] dark:text-slate-100'
    }`}>
      {/* Widget Container - Resizable via sizeMode */}
      <div className={`w-full transition-all duration-300 rounded-3xl border-[1.5px] border-[#121212] dark:border-slate-700 shadow-[4px_4px_0px_#121212] overflow-hidden ${
        sizeMode === 'mini' 
          ? 'max-w-xs p-3.5 bg-white/95 dark:bg-slate-900/95 space-y-3' 
          : sizeMode === 'medium'
            ? 'max-w-sm p-4 sm:p-5 bg-white/95 dark:bg-slate-900/95 space-y-4'
            : 'max-w-md p-5 bg-white/95 dark:bg-slate-900/95 space-y-5'
      }`}>
        
        {/* Top Header: Clock, Next Prayer & Size Controls */}
        <div className="flex items-start justify-between gap-2 border-b border-gray-200 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-gray-900 dark:text-white">
                {format(currentTime, 'HH:mm')}
              </span>
              <span className="text-[11px] font-bold text-gray-500 uppercase">
                {format(currentTime, 'ss')}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {format(currentTime, 'EEEE, d MMM yyyy', { locale: id })}
            </p>
          </div>

          {/* Widget Controls: Resizing & Background Toggle */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSizeMode(m => m === 'mini' ? 'medium' : m === 'medium' ? 'full' : 'mini')}
              className="p-1.5 rounded-lg border border-black/20 hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase transition-all"
              title="Ubah Ukuran Widget (Mini / Sedang / Penuh)"
            >
              {sizeMode}
            </button>
            <button
              onClick={() => setIsGlass(v => !v)}
              className="p-1.5 rounded-lg border border-black/20 hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all"
              title="Toggle Latar Wallpaper / Solid"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg border border-black/20 hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all"
              title="Buka Aplikasi Penuh"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Next Prayer Countdown Strip */}
        <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-[1.5px] border-[#121212] shadow-[2px_2px_0px_#121212] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-black/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                Salat Berikutnya
              </span>
              <span className="text-xs font-bold truncate block">
                {nextPrayer.name} ({nextPrayer.time})
              </span>
            </div>
          </div>
          <span className="text-xs font-extrabold bg-black text-[#6EE7B7] px-2 py-0.5 rounded-lg shrink-0">
            {nextPrayer.countdown}
          </span>
        </div>

        {/* SECTION 1: 5-DAILY PRAYERS CHECKLIST */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Salat Fardhu 5 Waktu</span>
            </span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-extrabold">
              {completedPrayersCount}/5 Selesai
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {prayersList.map(({ key, name, time }) => {
              const isDone = !!prayerLog.prayers[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTogglePrayer(key)}
                  className={`p-1.5 sm:p-2 rounded-xl border-[1.5px] transition-all flex flex-col items-center justify-center gap-1 ${
                    isDone
                      ? 'bg-emerald-600 border-[#121212] text-white shadow-[1.5px_1.5px_0px_#121212] scale-[1.02]'
                      : 'bg-white dark:bg-slate-800 border-[#121212] dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-emerald-500 shadow-[1.5px_1.5px_0px_#121212]'
                  }`}
                  title={`${name} (${time}) - Klik untuk ceklis`}
                >
                  <span className="text-[10px] font-bold block">{name}</span>
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                    isDone ? 'bg-white text-emerald-700' : 'bg-gray-100 dark:bg-slate-700 text-transparent'
                  }`}>
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isDone ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  <span className="text-[8.5px] font-semibold opacity-75 tabular-nums">{time}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: TODAY'S TASKS LIST (Hidden in 'mini' mode for compact size) */}
        {sizeMode !== 'mini' && (
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                <span>Daftar Tugas Hari Ini</span>
              </span>
              <button
                onClick={() => setIsAddingTask(v => !v)}
                className="text-[10px] text-emerald-600 hover:underline font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah</span>
              </button>
            </div>

            {/* Quick add form */}
            {isAddingTask && (
              <form onSubmit={handleAddQuickTask} className="flex gap-1.5 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Nama tugas baru..."
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-black/20 bg-gray-50 dark:bg-slate-800 text-xs text-gray-900 dark:text-white outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Simpan
                </button>
              </form>
            )}

            {todayTasks.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic text-center py-2">
                Tidak ada tugas mendesak hari ini. Tetap semangat! ✨
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {todayTasks.map((t) => {
                  const isDone = t.status === 'Selesai';
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleToggleTask(t.id)}
                      className={`p-2 rounded-xl border-[1.5px] border-[#121212] dark:border-slate-700 cursor-pointer flex items-center justify-between gap-2 transition-all ${
                        isDone
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 opacity-70 shadow-none'
                          : 'bg-white dark:bg-slate-800 shadow-[1.5px_1.5px_0px_#121212]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-400'
                        }`}>
                          {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`text-xs truncate ${
                          isDone ? 'line-through text-gray-400 dark:text-gray-500 font-normal' : 'font-bold text-gray-900 dark:text-white'
                        }`}>
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 font-semibold uppercase shrink-0">
                        {t.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer info & Pin guide */}
        <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-400">
          <span>WaktuIbadah Desktop/Wallpaper Widget</span>
          <span>Tekan F11 untuk layar penuh</span>
        </div>
      </div>
    </div>
  );
}
