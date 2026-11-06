import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { PrayerLog, PrayerName, SunnahPrayerName, User, QuranLog } from '../types';
import { format, subDays, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Check, Clock, Heart, BookOpen, ChevronLeft, ChevronRight, Plus, CheckCircle2, Sparkles, Sun, Moon, Star } from 'lucide-react';
import { getPrayerTimesForToday, fetchPrayerTimes, PrayerData, getCachedPrayerData } from '../lib/prayer-times';
import { formatTimeString } from '../lib/utils';
import { vibrateSuccess, playPrayerCompletedSound, playToggleSound } from '../lib/audio';
import { QuranLogModal } from '../components/QuranLogModal';
import { DoaSetelahSalatModal } from '../components/DoaSetelahSalatModal';
import { Link } from 'react-router-dom';

export default function Ibadah() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [log, setLog] = useState<PrayerLog>({ 
    date: selectedDate, 
    prayers: { Subuh: false, Zuhur: false, Asar: false, Magrib: false, Isya: false },
    sunnahPrayers: { Dhuha: false, Tahajud: false, Witir: false }
  });
  const [prayerData, setPrayerData] = useState<PrayerData | null>(getCachedPrayerData());
  const [quranLogs, setQuranLogs] = useState<QuranLog[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDoaModalOpen, setIsDoaModalOpen] = useState(false);

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
    if (user?.soundEnabled !== false) {
      if (isCompleted) {
        playPrayerCompletedSound();
      } else {
        playToggleSound();
      }
    }
    const newLog = {
      ...log,
      prayers: { ...log.prayers, [prayer]: isCompleted }
    };
    setLog(newLog);
    storage.updatePrayerLog(newLog);

    // If all 5 prayers are completed today, open Doa modal & notify review listener
    if (Object.values(newLog.prayers).every(Boolean) && selectedDate === format(new Date(), 'yyyy-MM-dd')) {
      if (storage.getAutoDoaModal()) {
        setTimeout(() => {
          setIsDoaModalOpen(true);
        }, 500);
      }
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('wi_check_five_prayers_review'));
      }, 1200);
    }
  };

  const handleToggleSunnah = (sunnah: SunnahPrayerName) => {
    const currentStatus = log.sunnahPrayers?.[sunnah] || false;
    const isCompleted = !currentStatus;
    if (user?.soundEnabled !== false) {
      if (isCompleted) {
        playPrayerCompletedSound();
      } else {
        playToggleSound();
      }
    }
    const newSunnah = {
      ...(log.sunnahPrayers || { Dhuha: false, Tahajud: false, Witir: false }),
      [sunnah]: isCompleted
    };
    const newLog = {
      ...log,
      sunnahPrayers: newSunnah
    };
    setLog(newLog);
    storage.updatePrayerLog(newLog);
  };

  const sunnahPrayersList: {
    id: SunnahPrayerName;
    name: string;
    waktu: string;
    keutamaan: string;
    rakaat: string;
    icon: any;
  }[] = [
    {
      id: 'Dhuha',
      name: 'Salat Dhuha',
      waktu: 'Pagi hari (~06:30 s/d 11:30 WIB)',
      keutamaan: 'Sedekah seluruh persendian & pembuka rezeki',
      rakaat: '2, 4, s/d 8 Rakaat',
      icon: Sun
    },
    {
      id: 'Tahajud',
      name: 'Salat Tahajud',
      waktu: 'Sepertiga malam terakhir (sesudah tidur)',
      keutamaan: 'Derajat terpuji (Maqaman Mahmuda) & doa mustajab',
      rakaat: 'Minimal 2 Rakaat',
      icon: Moon
    },
    {
      id: 'Witir',
      name: 'Salat Witir',
      waktu: 'Malam hari (penutup ibadah malam)',
      keutamaan: 'Amalan ganjil yang dicintai Allah SWT',
      rakaat: '1 atau 3 Rakaat',
      icon: Star
    }
  ];

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
    <div className="space-y-3.5 sm:space-y-4 pb-20 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      {/* Memphis Header */}
      <div className="p-3 bg-white border-[1.5px] border-[#121212] rounded-xl shadow-[2px_2px_0px_#121212] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#121212] truncate">
            Pencatatan Ibadah
          </h1>
          <p className="text-gray-600 text-[11px] font-medium truncate mt-0.5">
            Pantau salat 5 waktu dan tilawah Al-Qur'an harian
          </p>
        </div>

        {/* Date manual input picker and Doa modal shortcut */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsDoaModalOpen(true)}
            className="px-2.5 py-1.5 bg-emerald-400 text-black border-[1.5px] border-black rounded-lg text-xs font-bold shadow-[1px_1px_0px_#121212] flex items-center gap-1 active:translate-y-0.5"
            title="Buka Wirid & Doa Setelah Salat"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Doa Salat</span>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-[1.5px] border-black rounded-lg px-2 py-1 text-xs font-bold bg-white"
          />
        </div>
      </div>

      {/* Date Quick Selector (Memphis Compact Fit) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full hide-scrollbar">
        {datePills.map(p => {
          const isSelected = selectedDate === p.dateStr;
          return (
            <button
              key={p.dateStr}
              onClick={() => setSelectedDate(p.dateStr)}
              className={`flex flex-col items-center justify-center w-[52px] h-[58px] rounded-xl border-[1.5px] border-black transition-all shrink-0 ${
                isSelected 
                  ? 'bg-gradient-to-br from-emerald-400 via-teal-300 to-green-400 text-black font-bold shadow-[2px_2px_0px_#121212] -translate-y-0.5' 
                  : p.isToday 
                    ? 'bg-emerald-50 text-emerald-900 font-bold shadow-[1.5px_1.5px_0px_#121212]'
                    : 'bg-white text-gray-700 font-bold shadow-[1.5px_1.5px_0px_#121212]'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider">{p.dayName}</span>
              <span className="text-base font-bold mt-0.5">{p.dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Daily Progress Status Banner (Memphis Card) */}
      <div className="bg-white border-[1.5px] border-black rounded-xl p-3 shadow-[2px_2px_0px_#121212]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-lg border-[1.5px] border-black flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#121212] shrink-0 ${
              completedCount === 5 
                ? 'bg-gradient-to-br from-emerald-400 to-teal-400 text-black' 
                : 'bg-white text-black'
            }`}>
              {progressPercent}%
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-black truncate">
                {completedCount === 5 ? 'Alhamdulillah, Salat Lengkap!' : `${completedCount} dari 5 Waktu Salat`}
              </h3>
              <p className="text-[10.5px] text-gray-500 font-medium truncate">
                {completedCount === 5 
                  ? 'Semoga amalan salat diterima oleh Allah SWT' 
                  : 'Centang kotak setelah menunaikan salat'}
              </p>
            </div>
          </div>

          <Link
            to="/progress"
            className="px-2.5 py-1 text-[11px] font-bold bg-white border border-black rounded-lg shadow-[1px_1px_0px_#121212] shrink-0"
          >
            Grafik
          </Link>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 border-[1.5px] border-black h-2.5 rounded-full overflow-hidden flex gap-0.5 p-0.5 shadow-[1px_1px_0px_#121212]">
          {prayers.map((p) => (
            <div
              key={p}
              className={`flex-1 h-full rounded-full transition-all duration-300 ${
                log.prayers[p] ? 'bg-emerald-500' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Prayer Checklist with 56px Rows & 24px Checkbox */}
      <div className="space-y-1.5">
        <h3 className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider px-0.5">
          Salat 5 Waktu ({format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: id })})
        </h3>
        
        <div className="grid grid-cols-1 gap-1.5">
          {prayers.map(prayer => {
            const isCompleted = log.prayers[prayer];
            return (
              <button
                key={prayer}
                onClick={() => handleToggle(prayer)}
                className={`w-full h-[56px] flex items-center justify-between px-3 rounded-xl border-[1.5px] border-black transition-all text-left ${
                  isCompleted 
                    ? 'bg-emerald-100 shadow-[1.5px_1.5px_0px_#121212]' 
                    : 'bg-white shadow-[1.5px_1.5px_0px_#121212]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* 24px Checkbox */}
                  <div className={`w-6 h-6 rounded-lg border-[1.5px] border-black flex items-center justify-center shrink-0 transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500 text-white shadow-[1px_1px_0px_#121212]' 
                      : 'bg-white'
                  }`}>
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold uppercase tracking-tight text-black truncate">
                      {prayer}
                    </h4>
                    <span className="text-[12px] text-gray-600 font-medium">
                      Pukul {formatTimeString(times[prayer], user?.timeFormat || '24h')} WIB
                    </span>
                  </div>
                </div>
                
                <div className="text-xs font-bold shrink-0">
                  {isCompleted && (
                    <span className="bg-emerald-500 text-white text-[9.5px] font-bold px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#121212]">
                      Sudah Salat
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Salat Sunnah Pilihan Tracker */}
      <div className="bg-white border-[1.5px] border-black rounded-xl p-3 space-y-2 shadow-[2px_2px_0px_#121212]">
        <div className="flex items-center justify-between border-b border-black pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-tight text-black truncate">
              Salat Sunnah Pilihan
            </h3>
          </div>

          <span className="bg-emerald-200 border border-black text-black font-bold text-[9.5px] px-2 py-0.5 rounded shrink-0">
            {Object.values(log.sunnahPrayers || {}).filter(Boolean).length} / 3 Selesai
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {sunnahPrayersList.map((sunnah) => {
            const isCompleted = !!(log.sunnahPrayers && log.sunnahPrayers[sunnah.id]);
            const Icon = sunnah.icon;

            return (
              <button
                key={sunnah.id}
                onClick={() => handleToggleSunnah(sunnah.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border-[1.5px] border-black transition-all text-left ${
                  isCompleted
                    ? 'bg-emerald-100 shadow-[1.5px_1.5px_0px_#121212]'
                    : 'bg-[#FFFDF8] shadow-[1.5px_1.5px_0px_#121212]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded-lg border-[1.5px] border-black flex items-center justify-center shrink-0 ${
                    isCompleted 
                      ? 'bg-emerald-500 text-white shadow-[1px_1px_0px_#121212]' 
                      : 'bg-white'
                  }`}>
                    <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Icon className="w-3.5 h-3.5 text-black shrink-0" />
                      <h4 className="text-xs font-bold uppercase tracking-tight text-black truncate">
                        {sunnah.name}
                      </h4>
                      <span className="bg-[#00F0FF] text-black text-[9px] font-bold px-1.5 py-0.2 rounded border border-black shrink-0">
                        {sunnah.rakaat}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-gray-600 font-medium truncate mt-0.5">
                      🕒 {sunnah.waktu}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-bold shrink-0 ml-1">
                  {isCompleted && (
                    <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-black">
                      Selesai
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tilawah Al-Qur'an Tracker (Memphis Card) */}
      <div className="memphis-card p-3 sm:p-4 space-y-2.5 shadow-[3px_3px_0px_#121212]">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-[#6EE7B7] border border-black flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-black">
                Tilawah Al-Qur'an
              </h3>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-500">
                Catatan bacaan ayat di tanggal ini
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLogModalOpen(true)}
            className="memphis-btn memphis-btn-green px-2.5 py-1 text-[10px] uppercase tracking-wider gap-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Catat Ayat</span>
          </button>
        </div>

        {quranLogs.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-black">
            <p className="text-xs text-gray-500 font-bold mb-1.5">
              Belum ada catatan tilawah untuk tanggal ini.
            </p>
            <button
              onClick={() => setIsLogModalOpen(true)}
              className="text-xs font-black text-emerald-700 hover:underline"
            >
              + Catat Ayat yang Telah Dibaca
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {quranLogs.map((q) => (
              <div
                key={q.id}
                className="p-2.5 bg-[#FFFDF8] rounded-xl border-2 border-black flex items-center justify-between shadow-[1.5px_1.5px_0px_#121212]"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xs text-black">
                      Surah {q.surahName}
                    </span>
                    <span className="memphis-badge bg-gradient-to-r from-emerald-400 to-teal-400 text-black text-[8px]">
                      Ayat {q.startAyah} - {q.endAyah}
                    </span>
                  </div>
                  {q.notes && (
                    <p className="text-[10px] text-gray-500 mt-0.5 italic font-medium">
                      "{q.notes}"
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0 ml-3">
                  <span className="text-xs font-black text-emerald-700">
                    +{q.totalAyahs} Ayat
                  </span>
                  <button
                    onClick={() => {
                      storage.deleteQuranLog(q.id);
                      setQuranLogs(storage.getQuranLogsByDate(selectedDate));
                    }}
                    className="block text-[10px] font-black text-red-500 hover:underline mt-0.5"
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

      {/* Doa Setelah Salat Modal */}
      <DoaSetelahSalatModal
        isOpen={isDoaModalOpen}
        onClose={() => setIsDoaModalOpen(false)}
        dateStr={selectedDate}
      />
    </div>
  );
}
