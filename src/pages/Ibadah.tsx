import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { PrayerLog, PrayerName, SunnahPrayerName, User, QuranLog } from '../types';
import { format, subDays, addDays, isFriday } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Check, Clock, Heart, BookOpen, ChevronLeft, ChevronRight, 
  Plus, CheckCircle2, Sparkles, Sun, Moon, Star, Calendar as CalendarIcon,
  ShieldAlert, Lock
} from 'lucide-react';
import { getPrayerTimesForToday, fetchPrayerTimes, PrayerData, getCachedPrayerData } from '../lib/prayer-times';
import { formatTimeString } from '../lib/utils';
import { vibrateSuccess, playPrayerCompletedSound, playToggleSound } from '../lib/audio';
import { QuranLogModal } from '../components/QuranLogModal';
import { DoaSetelahSalatModal } from '../components/DoaSetelahSalatModal';
import { MonthlyCalendarGrid } from '../components/MonthlyCalendarGrid';
import { Link } from 'react-router-dom';

export default function Ibadah() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [currentTimeStr, setCurrentTimeStr] = useState(format(new Date(), 'HH:mm'));

  const [log, setLog] = useState<PrayerLog>({ 
    date: selectedDate, 
    prayers: { Subuh: false, Zuhur: false, Asar: false, Magrib: false, Isya: false },
    sunnahPrayers: { Dhuha: false, Tahajud: false, Witir: false }
  });
  const [prayerData, setPrayerData] = useState<PrayerData | null>(getCachedPrayerData());
  const [quranLogs, setQuranLogs] = useState<QuranLog[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDoaModalOpen, setIsDoaModalOpen] = useState(false);
  const [lastCheckedPrayer, setLastCheckedPrayer] = useState<string | undefined>(undefined);
  const [futureAlertMessage, setFutureAlertMessage] = useState<string | null>(null);

  // Update clock minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeStr(format(new Date(), 'HH:mm')), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadedUser = storage.getUser();
    setUser(loadedUser);
    setLog(storage.getPrayerLog(selectedDate));
    setQuranLogs(storage.getQuranLogsByDate(selectedDate));
    
    if (selectedDate === todayStr) {
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
  }, [selectedDate, todayStr]);

  const prayers: PrayerName[] = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'];
  const times = prayerData ? prayerData.times : getPrayerTimesForToday();

  // Check if selected date is a Friday
  const selectedDateObj = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);
  const isSelectedFriday = isFriday(selectedDateObj);
  const isMaleUser = user?.gender === 'male' || user?.gender === 'Laki-laki';

  // Helper to get display label for Zuhur (Salat Jumat for male users on Friday)
  const getPrayerDisplayLabel = (prayer: PrayerName) => {
    if (prayer === 'Zuhur' && isSelectedFriday && isMaleUser) {
      return 'Salat Jumat';
    }
    return `Salat ${prayer}`;
  };

  // Check whether a prayer is in the future
  const isPrayerInFuture = (prayer: PrayerName) => {
    if (selectedDate > todayStr) return true;
    if (selectedDate === todayStr) {
      const scheduledTime = times[prayer] || '12:00';
      return currentTimeStr < scheduledTime;
    }
    // Past dates (selectedDate < todayStr) are never future, can backfill / qadha
    return false;
  };

  const handleToggle = (prayer: PrayerName) => {
    const isCompleted = !log.prayers[prayer];
    const prayerTime = times[prayer] || '12:00';
    const isFuture = isPrayerInFuture(prayer);

    // Lock future prayer
    if (isCompleted && isFuture) {
      const msg = selectedDate > todayStr 
        ? `Tanggal ${format(new Date(selectedDate), 'd MMMM yyyy', { locale: id })} belum tiba. Anda belum dapat menceklis salat hari mendatang.`
        : `Waktu ${getPrayerDisplayLabel(prayer)} (${prayerTime} WIB) belum masuk saat ini.`;
      setFutureAlertMessage(msg);
      setTimeout(() => setFutureAlertMessage(null), 3500);
      return;
    }

    if (user?.soundEnabled !== false) {
      if (isCompleted) {
        playPrayerCompletedSound();
      } else {
        playToggleSound();
      }
    }

    const updatedLog = storage.togglePrayer(selectedDate, prayer);
    setLog(updatedLog);

    // If prayer completed, prompt Wirid & Doa Modal if enabled
    if (isCompleted) {
      setLastCheckedPrayer(getPrayerDisplayLabel(prayer));
      if (storage.getAutoDoaModal()) {
        setTimeout(() => {
          setIsDoaModalOpen(true);
        }, 400);
      }
    }

    // If all 5 prayers completed today, notify review listener
    if (Object.values(updatedLog.prayers).every(Boolean) && selectedDate === todayStr) {
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
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    const newSunnahTimes = { ...(log.sunnahTimesRecords || {}) };
    if (isCompleted) {
      newSunnahTimes[sunnah] = newSunnahTimes[sunnah] || nowTime;
    } else {
      delete newSunnahTimes[sunnah];
    }

    const newLog = {
      ...log,
      sunnahPrayers: newSunnah,
      sunnahTimesRecords: newSunnahTimes
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

  const completedCount = Object.values(log.prayers).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 5) * 100);

  // Date shifting helpers
  const handlePrevDay = () => {
    const d = subDays(new Date(`${selectedDate}T12:00:00`), 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const d = addDays(new Date(`${selectedDate}T12:00:00`), 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  const handleGoToday = () => {
    setSelectedDate(todayStr);
  };

  // Horizontal strip of dates centered on selected date (-4 to +4)
  const calendarStripDays = useMemo(() => {
    const center = new Date(`${selectedDate}T12:00:00`);
    return [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(offset => {
      const d = addDays(center, offset);
      const dStr = format(d, 'yyyy-MM-dd');
      return {
        dateStr: dStr,
        dayName: format(d, 'EEE', { locale: id }),
        dayNum: format(d, 'd'),
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
        isFutureDate: dStr > todayStr,
      };
    });
  }, [selectedDate, todayStr]);

  return (
    <div className="space-y-3.5 pb-20 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">
      
      {/* Alert Banner for locked future prayers */}
      {futureAlertMessage && (
        <div className="p-3 bg-amber-500 text-black border-[1.5px] border-[#121212] rounded-xl shadow-[2px_2px_0px_#121212] flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-1 duration-200">
          <Lock className="w-4 h-4 shrink-0" />
          <span>{futureAlertMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="p-3 bg-white border-[1.5px] border-[#121212] rounded-xl shadow-[2px_2px_0px_#121212] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#121212] truncate">
            Pencatatan Ibadah
          </h1>
          <p className="text-gray-600 text-[11px] font-medium truncate mt-0.5">
            Pantau salat 5 waktu dan tilawah harian (bisa isi hari lalu)
          </p>
        </div>

        {/* Quick Doa modal button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsDoaModalOpen(true)}
            className="px-2.5 py-1.5 bg-emerald-400 text-black border-[1.5px] border-black rounded-lg text-xs font-bold shadow-[1px_1px_0px_#121212] flex items-center gap-1 active:translate-y-0.5"
            title="Buka Wirid & Doa Setelah Salat"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Wirid Salat</span>
          </button>
        </div>
      </div>

      {/* Full Monthly Calendar Grid (Ahad - Sabtu) */}
      <MonthlyCalendarGrid
        selectedDate={selectedDate}
        onSelectDate={(newDate) => {
          setSelectedDate(newDate);
        }}
        title="Pilih tanggal untuk melihat dan mencatat ibadah"
      />

      {/* Daily Progress Status Banner */}
      <div className="bg-white border-[1.5px] border-black rounded-xl p-3 shadow-[2px_2px_0px_#121212]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg border-[1.5px] border-black flex items-center justify-center font-bold text-xs shadow-[1px_1px_0px_#121212] shrink-0 ${
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
              <p className="text-[10px] text-gray-500 font-medium truncate">
                {selectedDate < todayStr 
                  ? 'Mencatat ibadah qadha / hari sebelumnya' 
                  : completedCount === 5 
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
        <div className="w-full bg-gray-100 border-[1.5px] border-black h-2 rounded-full overflow-hidden flex gap-0.5 p-0.5 shadow-[1px_1px_0px_#121212]">
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

      {/* Prayer Checklist */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold text-gray-700">
            {format(selectedDateObj, 'EEEE, d MMMM yyyy', { locale: id })}
          </h3>
          {selectedDate < todayStr && (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
              Mode Qadha / Hari Lalu
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-1.5">
          {prayers.map(prayer => {
            const isCompleted = !!log.prayers[prayer];
            const prayerTime = times[prayer] || '12:00';
            const isFuture = isPrayerInFuture(prayer);
            const prayerLabel = getPrayerDisplayLabel(prayer);

            return (
              <button
                key={prayer}
                onClick={() => handleToggle(prayer)}
                className={`w-full h-13 sm:h-14 flex items-center justify-between px-3 rounded-xl border-[1.5px] border-black transition-all text-left ${
                  isCompleted 
                    ? 'bg-emerald-100 shadow-[1.5px_1.5px_0px_#121212]' 
                    : isFuture
                      ? 'bg-gray-50 border-gray-400 opacity-65 cursor-pointer shadow-[1px_1px_0px_#121212]'
                      : 'bg-white shadow-[1.5px_1.5px_0px_#121212] hover:bg-emerald-50/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* 24px Checkbox */}
                  <div className={`w-5.5 h-5.5 rounded-lg border-[1.5px] border-black flex items-center justify-center shrink-0 transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500 text-white shadow-[1px_1px_0px_#121212]' 
                      : isFuture
                        ? 'bg-gray-100 text-gray-400 border-gray-400'
                        : 'bg-white'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isFuture ? (
                      <Lock className="w-3 h-3 text-gray-400" />
                    ) : null}
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold tracking-tight text-black truncate">
                        {prayerLabel}
                      </h4>
                      {prayer === 'Zuhur' && isSelectedFriday && isMaleUser && (
                        <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                          Jumat
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-600 font-medium">
                      Pukul {formatTimeString(prayerTime, user?.timeFormat || '24h')} WIB
                    </span>
                  </div>
                </div>
                
                <div className="text-xs font-bold shrink-0">
                  {isCompleted ? (
                    <span className="bg-emerald-500 text-white text-[9.5px] font-bold px-2 py-0.5 rounded border border-black shadow-[1px_1px_0px_#121212]">
                      Sudah Salat
                    </span>
                  ) : isFuture ? (
                    <span className="bg-gray-200 text-gray-600 text-[9.5px] font-semibold px-2 py-0.5 rounded border border-gray-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Belum Tiba</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 hover:text-black">
                      Ketuk untuk ceklis
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
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-xs sm:text-sm text-black">
              Salat Sunnah Pilihan
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-gray-500">
            Amalan pelengkap harian
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {sunnahPrayersList.map(({ id: sunnahId, name, waktu, keutamaan, rakaat, icon: IconComponent }) => {
            const isCompleted = !!log.sunnahPrayers?.[sunnahId];
            return (
              <button
                key={sunnahId}
                onClick={() => handleToggleSunnah(sunnahId)}
                className={`p-2.5 rounded-xl border-[1.5px] border-black text-left transition-all flex flex-col justify-between gap-1.5 ${
                  isCompleted 
                    ? 'bg-amber-100 shadow-[1.5px_1.5px_0px_#121212]' 
                    : 'bg-white shadow-[1.5px_1.5px_0px_#121212] hover:bg-amber-50/40'
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-md bg-amber-400/30 border border-black flex items-center justify-center shrink-0">
                      <IconComponent className="w-3.5 h-3.5 text-amber-900" />
                    </div>
                    <span className="text-xs font-bold text-black">{name}</span>
                  </div>
                  <div className={`w-4.5 h-4.5 rounded border border-black flex items-center justify-center ${
                    isCompleted ? 'bg-emerald-500 text-white' : 'bg-white'
                  }`}>
                    {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <div className="text-[10px] space-y-0.5">
                  <p className="text-gray-500 font-medium truncate">{waktu}</p>
                  <p className="text-amber-900 font-semibold truncate">{keutamaan}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tilawah Al-Qur'an Tracker Card */}
      <div className="bg-white border-[1.5px] border-black rounded-xl p-3 shadow-[2px_2px_0px_#121212] space-y-2.5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-xs sm:text-sm text-black">
              Tilawah Al-Qur'an ({format(selectedDateObj, 'd MMM', { locale: id })})
            </h3>
          </div>
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="px-2 py-1 bg-emerald-400 text-black border border-black rounded-lg text-[10.5px] font-bold flex items-center gap-1 shadow-[1px_1px_0px_#121212]"
          >
            <Plus className="w-3 h-3" />
            <span>Catat Bacaan</span>
          </button>
        </div>

        {quranLogs.length > 0 ? (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {quranLogs.map((item) => (
              <div
                key={item.id}
                className="p-2 bg-emerald-50/60 border border-black/20 rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-black">{item.surahName}</span>
                  <span className="text-gray-600 text-[11px] ml-1.5">
                    Ayat {item.ayatStart} - {item.ayatEnd}
                  </span>
                </div>
                <span className="text-[10px] bg-white border border-black/20 px-1.5 py-0.5 rounded font-bold">
                  {item.pagesRead ? `${item.pagesRead} Halaman` : `${item.ayatEnd - item.ayatStart + 1} Ayat`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-2 text-xs text-gray-500 italic">
            Belum ada catatan tilawah untuk tanggal ini.
          </p>
        )}
      </div>

      {/* Quran Log Modal */}
      {isLogModalOpen && (
        <QuranLogModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          date={selectedDate}
          onSave={() => setQuranLogs(storage.getQuranLogsByDate(selectedDate))}
        />
      )}

      {/* Doa & Wirid Setelah Salat Modal */}
      {isDoaModalOpen && (
        <DoaSetelahSalatModal
          isOpen={isDoaModalOpen}
          onClose={() => setIsDoaModalOpen(false)}
          dateStr={selectedDate}
          prayerName={lastCheckedPrayer}
        />
      )}
    </div>
  );
}
