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

    // If all 5 prayers are completed today, notify review listener
    if (Object.values(newLog.prayers).every(Boolean) && selectedDate === format(new Date(), 'yyyy-MM-dd')) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('wi_check_five_prayers_review'));
      }, 600);
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
      <div className="p-3.5 sm:p-4 bg-white border-2 border-[#121212] rounded-2xl shadow-[3px_3px_0px_#121212] flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#121212]">
            Pencatatan Ibadah
          </h1>
          <p className="text-gray-600 text-xs font-bold mt-0.5">
            Pantau salat 5 waktu dan tilawah Al-Qur'an harianmu
          </p>
        </div>

        {/* Date manual input picker */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="memphis-input px-2.5 py-1 text-xs font-black"
          />
        </div>
      </div>

      {/* Date Quick Selector (Memphis Compact Fit) */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full hide-scrollbar">
        {datePills.map(p => {
          const isSelected = selectedDate === p.dateStr;
          return (
            <button
              key={p.dateStr}
              onClick={() => setSelectedDate(p.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[54px] sm:min-w-[64px] py-1.5 px-1 rounded-xl border-2 border-black transition-all ${
                isSelected 
                  ? 'bg-gradient-to-br from-emerald-400 via-teal-300 to-green-400 text-black font-black shadow-[3px_3px_0px_#121212] -translate-y-0.5' 
                  : p.isToday 
                    ? 'bg-emerald-50 text-emerald-900 font-bold shadow-[2px_2px_0px_#121212]'
                    : 'bg-white text-gray-700 font-bold shadow-[2px_2px_0px_#121212] hover:bg-gray-50'
              }`}
            >
              <span className="text-[10px] mb-0.5 uppercase tracking-wider">{p.dayName}</span>
              <span className="text-base sm:text-lg font-black">{p.dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Daily Progress Status Banner (Memphis Card) */}
      <div className="memphis-card p-3 sm:p-4 shadow-[3px_3px_0px_#121212]">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-black flex items-center justify-center font-black text-xs sm:text-sm shadow-[1.5px_1.5px_0px_#121212] ${
              completedCount === 5 
                ? 'bg-gradient-to-br from-emerald-400 to-teal-400 text-black' 
                : 'bg-white text-black'
            }`}>
              {progressPercent}%
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-black">
                {completedCount === 5 ? 'Alhamdulillah, Salat Lengkap!' : `${completedCount} dari 5 Waktu Salat`}
              </h3>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-500">
                {completedCount === 5 
                  ? 'Semoga seluruh amalan salat diterima oleh Allah SWT' 
                  : 'Centang kotak waktu salat setelah menunaikannya'}
              </p>
            </div>
          </div>

          <Link
            to="/progress"
            className="memphis-btn memphis-btn-white px-2.5 py-1 text-[10px] uppercase font-black shrink-0"
          >
            Grafik
          </Link>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 border-2 border-black h-3 rounded-full overflow-hidden flex gap-1 p-0.5 shadow-[1px_1px_0px_#121212]">
          {prayers.map((p) => (
            <div
              key={p}
              className={`flex-1 h-full rounded-full transition-all duration-300 ${
                log.prayers[p] ? 'bg-[#10B981]' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Prayer Checklist with Memphis Style */}
      <div className="space-y-1.5 sm:space-y-2">
        <h3 className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-wider px-1">
          Daftar Salat 5 Waktu ({format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: id })})
        </h3>
        
        <div className="grid grid-cols-1 gap-2">
          {prayers.map(prayer => {
            const isCompleted = log.prayers[prayer];
            return (
              <button
                key={prayer}
                onClick={() => handleToggle(prayer)}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border-2 border-black transition-all text-left group ${
                  isCompleted 
                    ? 'bg-emerald-100 shadow-[2px_2px_0px_#121212]' 
                    : 'bg-white shadow-[2px_2px_0px_#121212] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border-2 border-black flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-[#10B981] text-white shadow-[1px_1px_0px_#121212]' 
                      : 'bg-white text-transparent'
                  }`}>
                    <Check className={`w-4 h-4 stroke-[3] ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                  
                  <div>
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-black">
                      {prayer}
                    </h4>
                    <span className="text-[10px] sm:text-[11px] text-gray-500 font-bold">
                      Pukul {formatTimeString(times[prayer], user?.timeFormat || '24h')} WIB
                    </span>
                  </div>
                </div>
                
                <div className="text-xs font-black">
                  {isCompleted ? (
                    <span className="memphis-badge bg-[#10B981] text-white text-[9px]">
                      Sudah Salat
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold">
                      Klik centang
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Salat Sunnah Pilihan Tracker (Memphis Style) */}
      <div className="memphis-card p-3 sm:p-4 space-y-2.5 shadow-[3px_3px_0px_#121212]">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-black text-black flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-black">
                  Salat Sunnah Pilihan
                </h3>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-500">
                Pantau salat Dhuha, Tahajud, dan Witir di sela kuliah
              </p>
            </div>
          </div>

          <span className="memphis-badge bg-gradient-to-r from-emerald-400 to-teal-400 text-black text-[9px]">
            {Object.values(log.sunnahPrayers || {}).filter(Boolean).length} / 3 Selesai
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {sunnahPrayersList.map((sunnah) => {
            const isCompleted = !!(log.sunnahPrayers && log.sunnahPrayers[sunnah.id]);
            const Icon = sunnah.icon;

            return (
              <button
                key={sunnah.id}
                onClick={() => handleToggleSunnah(sunnah.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border-2 border-black transition-all text-left ${
                  isCompleted
                    ? 'bg-emerald-100 shadow-[2px_2px_0px_#121212]'
                    : 'bg-[#FFFDF8] shadow-[1.5px_1.5px_0px_#121212] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-lg border-2 border-black flex items-center justify-center shrink-0 ${
                    isCompleted 
                      ? 'bg-[#10B981] text-white shadow-[1px_1px_0px_#121212]' 
                      : 'bg-white text-transparent'
                  }`}>
                    <Check className={`w-4 h-4 stroke-[3] ${isCompleted ? 'opacity-100' : 'opacity-0'}`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-black shrink-0" />
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-black truncate">
                        {sunnah.name}
                      </h4>
                      <span className="memphis-badge bg-[#00F0FF] text-black text-[8px] py-0 px-1">
                        {sunnah.rakaat}
                      </span>
                    </div>

                    <p className="text-[10px] text-gray-600 font-semibold truncate mt-0.5">
                      🕒 {sunnah.waktu} • {sunnah.keutamaan}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-black shrink-0 ml-2">
                  {isCompleted ? (
                    <span className="memphis-badge bg-[#10B981] text-white text-[8px]">
                      Ditunaikan
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold">
                      Centang
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
    </div>
  );
}
