import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, Clock, Sparkles, ChevronDown, ChevronUp, Layers, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { storage } from '../lib/storage';
import { getPrayerTimesForToday, getCachedPrayerData, getNextPrayer } from '../lib/prayer-times';
import { PrayerLog, Task } from '../types';
import { vibrateSuccess, playButtonTapSound } from '../lib/audio';

export const FloatingWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const todayStr = format(currentTime, 'yyyy-MM-dd');
  
  const [prayerLog, setPrayerLog] = useState<PrayerLog>(() => storage.getPrayerLog(todayStr));
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleSync = () => {
      setPrayerLog(storage.getPrayerLog(todayStr));
      setTasks(storage.getTasks());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('wi_cloud_synced', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('wi_cloud_synced', handleSync);
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

  const completedCount = Object.values(prayerLog.prayers).filter(Boolean).length;
  const pendingTasks = tasks.filter(t => t.status !== 'Selesai').slice(0, 3);

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

  return (
    <div className="fixed bottom-20 right-4 z-40 hidden sm:block">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border-[1.5px] border-[#121212] dark:border-slate-700 rounded-full shadow-[2px_2px_0px_#121212] hover:scale-105 active:scale-95 transition-all group"
          title="Buka Widget Mini Ceklis Salat & Tugas"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            {nextPrayer.name} {nextPrayer.countdown}
          </span>
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded-full">
            {completedCount}/5 Salat
          </span>
        </button>
      ) : (
        <div className="w-80 bg-white dark:bg-slate-900 rounded-2xl border-[1.5px] border-[#121212] dark:border-slate-700 shadow-[4px_4px_0px_#121212] p-4 space-y-3.5 animate-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Widget Cepat Salat & Tugas
              </span>
              <a
                href="/widget"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-emerald-600 hover:underline font-bold flex items-center gap-0.5"
                title="Buka Jendela Terpisah"
              >
                <span>Pop-out</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5 Prayers Checklist */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300">
              <span>Ceklis Salat Fardhu</span>
              <span className="text-emerald-600 font-extrabold">{completedCount}/5</span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {prayersList.map(({ key, name }) => {
                const isDone = !!prayerLog.prayers[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTogglePrayer(key)}
                    className={`py-1.5 px-1 rounded-lg border-[1.5px] transition-all text-center ${
                      isDone
                        ? 'bg-emerald-600 border-[#121212] text-white shadow-[1px_1px_0px_#121212]'
                        : 'bg-gray-50 dark:bg-slate-800 border-[#121212] dark:border-slate-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-[9.5px] font-bold block">{name}</span>
                    <div className="flex justify-center mt-0.5">
                      <Check className={`w-3 h-3 stroke-[3] ${isDone ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tasks Snippet */}
          {pendingTasks.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                Tugas Tertunda ({pendingTasks.length})
              </span>
              <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                {pendingTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer flex items-center gap-2 text-xs"
                  >
                    <div className="w-3.5 h-3.5 rounded border border-gray-400 flex items-center justify-center shrink-0">
                      {t.status === 'Selesai' && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span className="truncate text-gray-800 dark:text-gray-200 text-[11px]">
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
