import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { Schedule, ScheduleCategory, PrayerConflictInfo } from '../types';
import { format, subDays, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Plus, X, Clock, Calendar as CalendarIcon, Tag, Check, 
  AlertTriangle, Info, Sparkles, ShieldAlert, CheckCircle2,
  CalendarPlus, Download, ExternalLink, ChevronLeft, ChevronRight,
  Sun, BookOpen, Moon, Repeat, Trash2, Edit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCachedPrayerData, getPrayerTimesForToday } from '../lib/prayer-times';
import { checkSchedulePrayerConflicts, getAllScheduleConflicts } from '../lib/schedule-prayer-conflict';
import { downloadICSFile } from '../lib/ical-export';
import { vibrateSuccess, playScheduleEventSound, playDeleteSound, playToggleSound, playSaveSuccessSound } from '../lib/audio';

interface JadwalProps {
  isNew?: boolean;
}

export default function Jadwal({ isNew = false }: JadwalProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showForm, setShowForm] = useState(isNew);
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string>>({});
  const [repeatWeek, setRepeatWeek] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<Schedule>>({
    title: '',
    category: 'Kuliah',
    startTime: '08:00',
    endTime: '09:30',
    date: todayStr,
    completed: false
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadSchedules();
    loadPrayerTimes();
    if (isNew) {
      setShowForm(true);
    }
  }, [isNew]);

  const loadSchedules = () => {
    const all = storage.getSchedules();
    setSchedules(all);
  };

  const loadPrayerTimes = async () => {
    try {
      const cached = getCachedPrayerData();
      if (cached && cached.times) {
        setPrayerTimes(cached.times);
      } else {
        const fresh = await getPrayerTimesForToday();
        if (fresh) {
          setPrayerTimes(fresh);
        }
      }
    } catch (e) {
      console.warn("Failed to load prayer times for conflict check:", e);
    }
  };

  const currentSchedules = schedules
    .filter(s => s.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Check form conflict in real-time
  const formConflicts: PrayerConflictInfo[] = useMemo(() => {
    if (!formData.startTime || !formData.endTime || Object.keys(prayerTimes).length === 0) {
      return [];
    }
    return checkSchedulePrayerConflicts(formData, prayerTimes);
  }, [formData.startTime, formData.endTime, formData.title, prayerTimes]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    const baseSchedule: Schedule = {
      id: formData.id || crypto.randomUUID(),
      title: formData.title!,
      category: formData.category as ScheduleCategory,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      date: formData.date || selectedDate,
      completed: formData.completed || false
    };

    if (formData.id) {
      storage.updateSchedule(baseSchedule);
      showToast('Jadwal berhasil diperbarui!');
    } else {
      if (repeatWeek) {
        // Create for next 7 days
        const baseDate = new Date(`${formData.date || selectedDate}T12:00:00`);
        for (let i = 0; i < 7; i++) {
          const dStr = format(addDays(baseDate, i), 'yyyy-MM-dd');
          storage.addSchedule({
            ...baseSchedule,
            id: crypto.randomUUID(),
            date: dStr
          });
        }
        showToast('Jadwal rutin 7 hari berhasil dibuat!');
      } else {
        storage.addSchedule(baseSchedule);
        showToast('Jadwal berhasil ditambahkan!');
      }
    }

    playSaveSuccessSound();
    vibrateSuccess();
    loadSchedules();
    setShowForm(false);
    setRepeatWeek(false);
    if (isNew) navigate('/jadwal', { replace: true });
    
    // Reset form
    setFormData({
      title: '',
      category: 'Kuliah',
      startTime: '08:00',
      endTime: '09:30',
      date: selectedDate,
      completed: false
    });
  };

  // Quick 1-click routine schedule template adder
  const handleAddQuickRoutine = (type: 'dhuha' | 'tilawah' | 'tahajud', forAllWeek: boolean = false) => {
    let title = '';
    let startTime = '';
    let endTime = '';

    if (type === 'dhuha') {
      title = 'Rutin Salat Dhuha';
      startTime = '08:30';
      endTime = '09:00';
    } else if (type === 'tilawah') {
      title = 'Rutin Tilawah Al-Qur\'an';
      startTime = '18:30';
      endTime = '19:00';
    } else if (type === 'tahajud') {
      title = 'Rutin Qiyamul Lail / Tahajud';
      startTime = '03:30';
      endTime = '04:00';
    }

    const baseDate = new Date(`${selectedDate}T12:00:00`);
    const count = forAllWeek ? 7 : 1;

    for (let i = 0; i < count; i++) {
      const dStr = format(addDays(baseDate, i), 'yyyy-MM-dd');
      // check if exists
      const exists = schedules.some(s => s.date === dStr && s.title === title && s.startTime === startTime);
      if (!exists) {
        storage.addSchedule({
          id: crypto.randomUUID(),
          title,
          category: 'Ibadah',
          startTime,
          endTime,
          date: dStr,
          completed: false
        });
      }
    }

    playSaveSuccessSound();
    vibrateSuccess();
    loadSchedules();
    showToast(forAllWeek ? `7 hari ${title} dijadwalkan!` : `${title} dijadwalkan!`);
  };

  const handleToggleComplete = (schedule: Schedule) => {
    playToggleSound();
    storage.updateSchedule({ ...schedule, completed: !schedule.completed });
    loadSchedules();
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus jadwal ini?')) {
      playDeleteSound();
      storage.deleteSchedule(id);
      loadSchedules();
      showToast('Jadwal dihapus.');
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setFormData(schedule);
    setShowForm(true);
  };

  // Date shifting
  const selectedDateObj = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);

  const handlePrevDay = () => {
    const d = subDays(selectedDateObj, 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const d = addDays(selectedDateObj, 1);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  const handleGoToday = () => {
    setSelectedDate(todayStr);
  };

  // 7-day horizontal carousel strip
  const carouselDays = useMemo(() => {
    return [-3, -2, -1, 0, 1, 2, 3].map(offset => {
      const d = addDays(selectedDateObj, offset);
      const dStr = format(d, 'yyyy-MM-dd');
      const hasSched = schedules.some(s => s.date === dStr);
      return {
        dateStr: dStr,
        dayName: format(d, 'EEE', { locale: id }),
        dayNum: format(d, 'd'),
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
        hasSched
      };
    });
  }, [selectedDateObj, selectedDate, todayStr, schedules]);

  const categories: ScheduleCategory[] = ['Kuliah', 'Ibadah', 'Tugas', 'Istirahat', 'Pribadi', 'Lainnya'];

  return (
    <div className="space-y-4 pb-20 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#10B981] text-white px-4 py-2 rounded-xl text-xs font-bold border-[1.5px] border-black shadow-[3px_3px_0px_#121212] animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-4 bg-white dark:bg-slate-900 border-[1.5px] border-black dark:border-slate-700 rounded-2xl shadow-[3px_3px_0px_#121212] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Jadwal & Agenda
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Atur aktivitas kuliah & rutinitas ibadah harian
          </p>
        </div>

        <div className="flex items-center gap-2">
          {schedules.length > 0 && (
            <button
              onClick={() => {
                downloadICSFile(schedules, prayerTimes, `jadwal-${selectedDate}.ics`);
                vibrateSuccess();
              }}
              className="px-2.5 py-1.5 text-xs font-bold border border-black dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-50 text-gray-700 dark:text-gray-200 flex items-center gap-1 shadow-xs"
              title="Ekspor ke Kalender Ponsel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor .ics</span>
            </button>
          )}

          {!showForm && (
            <button 
              onClick={() => {
                setFormData({
                  title: '',
                  category: 'Kuliah',
                  startTime: '08:00',
                  endTime: '09:30',
                  date: selectedDate,
                  completed: false
                });
                setShowForm(true);
              }}
              className="px-3 py-1.5 text-xs font-bold border border-black rounded-xl bg-emerald-400 hover:bg-emerald-500 text-black flex items-center gap-1.5 shadow-[2px_2px_0px_#121212] active:translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" /> 
              <span>Tambah Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {/* Date Carousel & Navigator */}
      <div className="bg-white dark:bg-slate-900 border-[1.5px] border-black dark:border-slate-700 rounded-2xl p-3 shadow-[2px_2px_0px_#121212] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevDay}
              className="w-7 h-7 rounded-lg border border-gray-300 dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100"
              aria-label="Hari sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white capitalize px-1">
              {format(selectedDateObj, 'EEEE, d MMMM yyyy', { locale: id })}
            </span>
            <button
              type="button"
              onClick={handleNextDay}
              className="w-7 h-7 rounded-lg border border-gray-300 dark:border-slate-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100"
              aria-label="Hari selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedDate !== todayStr && (
            <button
              onClick={handleGoToday}
              className="text-[11px] font-bold px-2.5 py-1 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            >
              Hari Ini
            </button>
          )}
        </div>

        {/* 7-Day Carousel strip */}
        <div className="grid grid-cols-7 gap-1">
          {carouselDays.map((item) => (
            <button
              key={item.dateStr}
              type="button"
              onClick={() => setSelectedDate(item.dateStr)}
              className={`py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                item.isSelected
                  ? 'bg-[#FCD34D] text-black font-black border border-black shadow-xs'
                  : item.isToday
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              <span className="text-[10px] uppercase font-bold">{item.dayName}</span>
              <span className="text-xs sm:text-sm font-black tabular-nums">{item.dayNum}</span>
              {item.hasSched && (
                <span className={`w-1 h-1 rounded-full mt-0.5 ${item.isSelected ? 'bg-black' : item.isToday ? 'bg-white' : 'bg-blue-500'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Routine Templates: 1-Click Fast Routine Creator */}
      <section className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
              Template Jadwal Rutin 1-Klik
            </h3>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
            Untuk {format(selectedDateObj, 'd MMM')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Routine Dhuha */}
          <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">Rutin Dhuha</div>
                <div className="text-[10px] text-gray-500">08:30 - 09:00</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAddQuickRoutine('dhuha', false)}
                className="px-2 py-1 bg-amber-300 hover:bg-amber-400 text-black text-[10px] font-bold rounded-lg border border-black shadow-xs"
                title="Jadwalkan Hari Ini"
              >
                + Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickRoutine('dhuha', true)}
                className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg border border-gray-300"
                title="Jadwalkan 7 Hari Penuh"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Routine Tilawah */}
          <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">Rutin Tilawah</div>
                <div className="text-[10px] text-gray-500">18:30 - 19:00</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAddQuickRoutine('tilawah', false)}
                className="px-2 py-1 bg-indigo-300 hover:bg-indigo-400 text-black text-[10px] font-bold rounded-lg border border-black shadow-xs"
                title="Jadwalkan Hari Ini"
              >
                + Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickRoutine('tilawah', true)}
                className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg border border-gray-300"
                title="Jadwalkan 7 Hari Penuh"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Routine Tahajud */}
          <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-xl p-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">Rutin Tahajud</div>
                <div className="text-[10px] text-gray-500">03:30 - 04:00</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAddQuickRoutine('tahajud', false)}
                className="px-2 py-1 bg-purple-300 hover:bg-purple-400 text-black text-[10px] font-bold rounded-lg border border-black shadow-xs"
                title="Jadwalkan Hari Ini"
              >
                + Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleAddQuickRoutine('tahajud', true)}
                className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-lg border border-gray-300"
                title="Jadwalkan 7 Hari Penuh"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Form Tambah / Edit */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 border-[1.5px] border-black dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4 shadow-[3px_3px_0px_#121212]">
          <div className="flex justify-between items-center border-b border-gray-200 dark:border-slate-800 pb-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {formData.id ? 'Edit' : 'Tambah'} Jadwal Kegiatan
              </h2>
              <p className="text-[11px] text-gray-500">
                Deteksi otomatis waktu salat agar kegiatan tidak bertabrakan dengan azan
              </p>
            </div>
            <button 
              onClick={() => { setShowForm(false); if(isNew) navigate('/jadwal'); }} 
              className="w-7 h-7 rounded-lg border border-black flex items-center justify-center font-bold hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">
                Nama Aktivitas / Kuliah / Ibadah
              </label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-2.5 border border-black dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800"
                placeholder="Misal: Praktikum Algoritma / Mengaji Surah Al-Kahfi"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">Tanggal</label>
                <input 
                  type="date" 
                  required
                  value={formData.date || selectedDate}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full p-2 border border-black dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">Jam Mulai</label>
                <input 
                  type="time" 
                  required
                  value={formData.startTime}
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                  className="w-full p-2 border border-black dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">Jam Selesai</label>
                <input 
                  type="time" 
                  required
                  value={formData.endTime}
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                  className="w-full p-2 border border-black dark:border-slate-700 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-700 dark:text-gray-300">Kategori</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat})}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      formData.category === cat 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {!formData.id && (
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs font-bold text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={repeatWeek}
                  onChange={(e) => setRepeatWeek(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Ulangi kegiatan ini setiap hari selama 7 hari berturut-turut</span>
              </label>
            )}

            {/* Peringatan Bentrok Waktu Salat */}
            {formConflicts.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span>Perhatian Waktu Salat: </span>
                  {formConflicts.map((c, i) => (
                    <span key={i}>Jadwal beririsan dengan waktu salat {c.prayerName} ({c.prayerTime}).</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-3.5 py-2 border border-black rounded-xl text-xs font-bold hover:bg-gray-100"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-4 py-2 border border-black rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-500 text-black shadow-[2px_2px_0px_#121212]"
              >
                Simpan Jadwal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Daftar Jadwal Hari Terpilih */}
      <section className="bg-white dark:bg-slate-900 border-[1.5px] border-black dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#121212] space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              Agenda Hari Ini ({currentSchedules.length})
            </h2>
          </div>
          <span className="text-[11px] font-bold text-gray-500">
            {currentSchedules.filter(s => s.completed).length} selesai
          </span>
        </div>

        {currentSchedules.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <CalendarIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="text-xs font-semibold text-gray-500">
              Belum ada agenda pada {format(selectedDateObj, 'd MMMM yyyy')}.
            </p>
            <button
              onClick={() => {
                setFormData({
                  title: '',
                  category: 'Kuliah',
                  startTime: '08:00',
                  endTime: '09:30',
                  date: selectedDate,
                  completed: false
                });
                setShowForm(true);
              }}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              + Buat Jadwal Baru
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentSchedules.map((schedule) => {
              const conflicts = checkSchedulePrayerConflicts(schedule, prayerTimes);
              return (
                <div 
                  key={schedule.id}
                  className={`p-3 rounded-xl border-[1.2px] transition-all flex items-center justify-between gap-3 ${
                    schedule.completed 
                      ? 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-800 opacity-70' 
                      : 'bg-white dark:bg-slate-800 border-black dark:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(schedule)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        schedule.completed 
                          ? 'bg-emerald-500 border-emerald-600 text-white' 
                          : 'border-gray-400 hover:border-black'
                      }`}
                      title={schedule.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      {schedule.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs sm:text-sm font-bold truncate ${schedule.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {schedule.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          schedule.category === 'Ibadah' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : schedule.category === 'Kuliah'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {schedule.category}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className="tabular-nums font-semibold">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        {conflicts.length > 0 && (
                          <span className="text-amber-600 font-bold flex items-center gap-0.5" title={`Dekat waktu salat ${conflicts[0].prayerName}`}>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Waktu Salat</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEdit(schedule)}
                      className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(schedule.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
