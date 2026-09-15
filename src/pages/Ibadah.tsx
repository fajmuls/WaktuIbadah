import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { PrayerLog, PrayerName, User, QuranLog } from '../types';
import { format, subDays, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Check, Clock, Heart, BookOpen, ChevronLeft, ChevronRight, Plus, CheckCircle2 } from 'lucide-react';
import { getPrayerTimesForToday, fetchPrayerTimes, PrayerData, getCachedPrayerData } from '../lib/prayer-times';
import { formatTimeString } from '../lib/utils';
import { vibrateSuccess } from '../lib/audio';
import { QuranLogModal } from '../components/QuranLogModal';
import { Link } from 'react-router-dom';

export default function Ibadah() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [log, setLog] = useState<PrayerLog>({ date: selectedDate, prayers: { Subuh: false, Zuhur: false, Asar: false, Magrib: false, Isya: false } });
  const [prayerData, setPrayerData] = useState<PrayerData | null>(getCachedPrayerData());
  const [quranLogs, setQuranLogs] = useState<QuranLog[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  useEffect(() => {
    const loadedUser = storage.getUser();
    setUser(loadedUser);
    setLog(storage.getPrayerLog(selectedDate));
    setQuranLogs(storage.getQuranLogsByDate(selectedDate));
    
    if (selectedDate === format(new Date(), 'yyyy-MM-dd')) {
      if (loadedUser?.location?.cityId) {
        // Cached or loaded
      } else if (loadedUser?.location) {
        const lat = loadedUser.location.latitude;
        const lng = loadedUser.location.longitude;
        fetchPrayerTimes(lat, lng).then(data => setPrayerData(data));
      } else {
        fetchPrayerTimes(-6.2088, 106.8456).then(data => setPrayerData(data));
      }
    }
  }, [selectedDate]);

  const handleToggle = (prayer: PrayerName) => {
    const isCompleted = !log.prayers[prayer];
    if (isCompleted && user?.soundEnabled !== false) {
      vibrateSuccess();
    }
    const newLog = {
      ...log,
      prayers: { ...log.prayers, [prayer]: isCompleted }
    };
    setLog(newLog);
    storage.updatePrayerLog(newLog);
  };

  const prayers: PrayerName[] = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'];
  const times = prayerData ? prayerData.times : getPrayerTimesForToday();
  const completedCount = Object.values(log.prayers).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  // Quick 5 date pills
  const datePills = [-3, -2, -1, 0, 1].map(offset => {
    const d = addDays(new Date(), offset);
    return {
      dateStr: format(d, 'yyyy-MM-dd'),
      dayName: offset === 0 ? 'Hari ini' : format(d, 'EEE', { locale: id }),
      dayNum: format(d, 'd'),
      isToday: offset === 0,
    };
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Pencatatan Ibadah
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Pantau salat 5 waktu dan tilawah Al-Qur'an harianmu
          </p>
        </div>

        {/* Date manual input picker */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Date Quick Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 hide-scrollbar">
        {datePills.map(p => {
          const isSelected = selectedDate === p.dateStr;
          return (
            <button
              key={p.dateStr}
              onClick={() => setSelectedDate(p.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[68px] py-2 px-1 rounded-2xl border transition-all ${
                isSelected 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 font-bold' 
                  : p.isToday 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] mb-0.5 opacity-90">{p.dayName}</span>
              <span className="text-base font-bold">{p.dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Daily Progress Status Banner - Enhanced Visibility */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              completedCount === 5 
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {progressPercent}%
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {completedCount === 5 ? 'Alhamdulillah, Salat Lengkap!' : `${completedCount} dari 5 Waktu Salat`}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {completedCount === 5 
                  ? 'Semoga seluruh amalan salat diterima oleh Allah SWT' 
                  : 'Centang kotak waktu salat setelah menunaikannya'}
              </p>
            </div>
          </div>

          <Link
            to="/progres"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
          >
            Lihat Grafik
          </Link>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden flex gap-1 p-0.5">
          {prayers.map((p, i) => (
            <div
              key={p}
              className={`flex-1 h-full rounded-full transition-all duration-300 ${
                log.prayers[p] ? 'bg-emerald-500' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Prayer Checklist with High Visibility */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          Daftar Salat 5 Waktu ({format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: id })})
        </h3>
        
        <div className="grid grid-cols-1 gap-2">
          {prayers.map(prayer => {
            const isCompleted = log.prayers[prayer];
            return (
              <button
                key={prayer}
                onClick={() => handleToggle(prayer)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                  isCompleted 
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* High-visibility Checkbox Circle */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-emerald-600 text-white shadow-xs scale-105' 
                      : 'border-2 border-gray-300 dark:border-gray-600 text-transparent group-hover:border-emerald-400'
                  }`}>
                    <Check className={`w-5 h-5 stroke-[3] ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  
                  <div>
                    <h4 className={`text-sm font-bold transition-colors ${
                      isCompleted ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white'
                    }`}>
                      {prayer}
                    </h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Pukul {formatTimeString(times[prayer], user?.timeFormat || '24h')} WIB
                    </span>
                  </div>
                </div>
                
                <div className="text-xs font-bold">
                  {isCompleted ? (
                    <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/80 px-2.5 py-1 rounded-lg">
                      Sudah Salat
                    </span>
                  ) : (
                    <span className="text-gray-400 group-hover:text-gray-600 px-2 py-1">
                      Klik untuk centang
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tilawah Al-Qur'an Tracker on Selected Date */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Tilawah Al-Qur'an
              </h3>
              <p className="text-[11px] text-gray-400">
                Catatan bacaan ayat di tanggal ini
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Catatan</span>
          </button>
        </div>

        {quranLogs.length === 0 ? (
          <div className="text-center py-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Belum ada catatan tilawah untuk tanggal ini.
            </p>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              + Catat Ayat yang Telah Dibaca
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {quranLogs.map((q) => (
              <div
                key={q.id}
                className="p-3 bg-gray-50 dark:bg-gray-900/70 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      Surah {q.surahName}
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                      Ayat {q.startAyah} s/d {q.endAyah}
                    </span>
                  </div>
                  {q.notes && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 italic">
                      "{q.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    +{q.totalAyahs} Ayat
                  </span>
                  <button
                    onClick={() => {
                      storage.deleteQuranLog(q.id);
                      setQuranLogs(storage.getQuranLogsByDate(selectedDate));
                    }}
                    className="block text-[10px] text-red-500 hover:underline mt-0.5"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tilawah Log Modal */}
      <QuranLogModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setQuranLogs(storage.getQuranLogsByDate(selectedDate));
        }}
        surahNumber={1}
        surahName="Al-Fatihah"
        totalAyah={7}
        suggestedStart={1}
        suggestedEnd={7}
        onLogSaved={() => {
          setQuranLogs(storage.getQuranLogsByDate(selectedDate));
        }}
      />
    </div>
  );
}
