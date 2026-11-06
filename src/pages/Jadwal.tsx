import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { Schedule, ScheduleCategory, PrayerConflictInfo } from '../types';
import { format, subDays, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Plus, X, Clock, Calendar as CalendarIcon, Tag, Check, 
  AlertTriangle, Info, Sparkles, ShieldAlert, CheckCircle2,
  CalendarPlus, Download, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCachedPrayerData, getPrayerTimesForToday } from '../lib/prayer-times';
import { checkSchedulePrayerConflicts, getAllScheduleConflicts } from '../lib/schedule-prayer-conflict';
import { downloadICSFile, generateGoogleCalendarUrl } from '../lib/ical-export';
import { vibrateSuccess, playScheduleEventSound, playDeleteSound, playToggleSound } from '../lib/audio';

interface JadwalProps {
  isNew?: boolean;
}

export default function Jadwal({ isNew = false }: JadwalProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showForm, setShowForm] = useState(isNew);
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<Schedule>>({
    title: '',
    category: 'Kuliah',
    startTime: '08:00',
    endTime: '09:30',
    date: todayStr,
    completed: false
  });

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
    
    const newSchedule: Schedule = {
      id: formData.id || crypto.randomUUID(),
      title: formData.title!,
      category: formData.category as ScheduleCategory,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      date: formData.date || selectedDate,
      completed: formData.completed || false
    };

    if (formData.id) {
      storage.updateSchedule(newSchedule);
    } else {
      storage.addSchedule(newSchedule);
    }

    playScheduleEventSound('created');
    loadSchedules();
    setShowForm(false);
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
    }
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

  // Scrollable calendar strip centered around selected date
  const calendarStripDays = useMemo(() => {
    return [-4, -3, -2, -1, 0, 1, 2, 3, 4].map(offset => {
      const d = addDays(selectedDateObj, offset);
      const dStr = format(d, 'yyyy-MM-dd');
      return {
        dateStr: dStr,
        dayName: format(d, 'EEE', { locale: id }),
        dayNum: format(d, 'd'),
        isToday: dStr === todayStr,
        isSelected: dStr === selectedDate,
      };
    });
  }, [selectedDateObj, selectedDate, todayStr]);

  const categories: ScheduleCategory[] = ['Kuliah', 'Tugas', 'Ibadah', 'Istirahat', 'Pribadi', 'Lainnya'];

  return (
    <div className="space-y-3.5 pb-16 w-full max-w-full overflow-x-hidden animate-in fade-in duration-300">
      
      {/* Memphis Header */}
      <div className="p-3 bg-white border-[1.5px] border-[#121212] rounded-xl shadow-[2px_2px_0px_#121212] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#121212] truncate">
            Jadwal & Agenda Kuliah
          </h1>
          <p className="text-gray-600 text-[11px] font-medium truncate mt-0.5">
            Deteksi bentrok salat otomatis & sinkronisasi kalender
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {schedules.length > 0 && (
            <button
              onClick={() => {
                downloadICSFile(schedules, prayerTimes, `jadwal-kuliah-${selectedDate}.ics`);
                vibrateSuccess();
              }}
              className="border-[1.5px] border-black bg-white px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-[1px_1px_0px_#121212] flex items-center gap-1 active:translate-y-0.5"
              title="Ekspor .ics ke Google Calendar"
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
              className="border-[1.5px] border-black bg-emerald-400 text-black px-3 py-1 text-xs font-bold rounded-lg shadow-[1px_1px_0px_#121212] flex items-center gap-1 active:translate-y-0.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> 
              <span>Tambah Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="bg-white border-[1.5px] border-black rounded-xl p-3.5 sm:p-5 space-y-3.5 shadow-[2px_2px_0px_#121212]">
          <div className="flex justify-between items-center border-b border-black pb-2.5">
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                {formData.id ? 'Edit' : 'Tambah'} Aktivitas Kuliah
              </h2>
              <p className="text-[10.5px] font-medium text-gray-500">
                Otomatis mendeteksi keselarasan jadwal dengan waktu salat
              </p>
            </div>
            <button 
              onClick={() => { setShowForm(false); if(isNew) navigate('/jadwal'); }} 
              className="w-7 h-7 rounded-lg border-[1.5px] border-black bg-white flex items-center justify-center font-bold shadow-[1px_1px_0px_#121212] hover:bg-red-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">
                Nama Aktivitas / Mata Kuliah
              </label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border-[1.5px] border-black rounded-lg text-xs font-medium"
                placeholder="Misal: Praktikum Algoritma / Kuliah PAI"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">Tanggal</label>
              <input 
                type="date" 
                required
                value={formData.date || selectedDate}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border-[1.5px] border-black rounded-lg text-xs font-medium"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">Jam Mulai</label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="time" 
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full p-2 pl-8 border-[1.5px] border-black rounded-lg text-xs font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">Jam Selesai</label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="time" 
                    required
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full p-2 pl-8 border-[1.5px] border-black rounded-lg text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1">Kategori</label>
              <div className="grid grid-cols-3 gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat})}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-bold transition-all ${
                      formData.category === cat 
                        ? 'bg-black text-white border-black' 
                        : 'bg-white text-gray-700 border-black/40 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* REAL-TIME CONFLICT ALERT IN FORM */}
            {formConflicts.length > 0 ? (
              <div className="p-2.5 bg-amber-100 border-[1.5px] border-black rounded-xl space-y-1 shadow-[1.5px_1.5px_0px_#121212]">
                <div className="flex items-center gap-1.5 text-amber-950 font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Peringatan Bentrok Waktu Salat ({formConflicts.map(c => `${c.prayerName} ${c.prayerTime}`).join(', ')})</span>
                </div>
                {formConflicts.map((conf, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-black text-[11px]">
                    <p className="font-semibold text-amber-950">
                      ⚠️ Waktu salat <strong>{conf.prayerName} ({conf.prayerTime})</strong> berada di rentang jadwal ini.
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 bg-emerald-100 border-[1.5px] border-black rounded-xl flex items-center gap-1.5 text-[11px] font-bold text-emerald-950 shadow-[1px_1px_0px_#121212]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Jadwal selaras & tidak bertabrakan dengan waktu salat fardhu.</span>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full h-10 mt-2 border-[1.5px] border-black bg-emerald-400 text-black font-bold rounded-lg text-xs shadow-[2px_2px_0px_#121212] active:translate-y-0.5"
            >
              Simpan Jadwal Kuliah
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Horizontal Calendar Strip with < > Day Shifting */}
          <div className="bg-white border-[1.5px] border-[#121212] rounded-xl p-2.5 shadow-[2px_2px_0px_#121212] space-y-2">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
              <button
                onClick={handlePrevDay}
                className="p-1.5 rounded-lg border-[1.5px] border-black bg-white hover:bg-gray-100 shadow-[1px_1px_0px_#121212] active:translate-y-0.5 text-black"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                  {format(selectedDateObj, 'EEEE, d MMMM yyyy', { locale: id })}
                </span>
                {selectedDate !== todayStr && (
                  <button
                    onClick={handleGoToday}
                    className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-500 rounded-md shrink-0 hover:bg-emerald-200"
                  >
                    Hari Ini
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-black rounded-lg px-1.5 py-0.5 text-xs font-semibold bg-white w-28 text-gray-700"
                  title="Pilih tanggal kalender"
                />
                <button
                  onClick={handleNextDay}
                  className="p-1.5 rounded-lg border-[1.5px] border-black bg-white hover:bg-gray-100 shadow-[1px_1px_0px_#121212] active:translate-y-0.5 text-black"
                  title="Hari Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Day Strip */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 max-w-full hide-scrollbar">
              {calendarStripDays.map(p => (
                <button
                  key={p.dateStr}
                  onClick={() => setSelectedDate(p.dateStr)}
                  className={`flex flex-col items-center justify-center w-11 sm:w-12 h-13 rounded-xl border-[1.5px] border-black transition-all shrink-0 ${
                    p.isSelected 
                      ? 'bg-gradient-to-br from-emerald-400 via-teal-300 to-green-400 text-black font-bold shadow-[2px_2px_0px_#121212] -translate-y-0.5' 
                      : p.isToday 
                        ? 'bg-emerald-50 text-emerald-900 font-bold shadow-[1px_1px_0px_#121212]'
                        : 'bg-white text-gray-700 font-bold shadow-[1px_1px_0px_#121212]'
                  }`}
                >
                  <span className="text-[9.5px] uppercase tracking-wider">{p.dayName}</span>
                  <span className="text-sm font-bold mt-0.5">{p.dayNum}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Timeline in Memphis Card */}
          <div className="bg-white border-[1.5px] border-black rounded-xl p-3.5 sm:p-4 shadow-[2px_2px_0px_#121212] min-h-[260px]">
            <div className="flex items-center justify-between border-b border-black pb-2 mb-3">
              <h3 className="font-bold text-xs sm:text-sm tracking-tight flex items-center gap-1.5 text-black">
                <CalendarIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Daftar Kegiatan ({currentSchedules.length})</span>
              </h3>
              <span className="text-[11px] text-gray-500 font-semibold">
                {format(selectedDateObj, 'd MMM yyyy', { locale: id })}
              </span>
            </div>

            {currentSchedules.length > 0 ? (
              <div className="relative border-l-[1.5px] border-black ml-3 sm:ml-4 space-y-3 pb-2">
                {currentSchedules.map((schedule) => {
                  const conflicts = checkSchedulePrayerConflicts(schedule, prayerTimes);
                  const hasConflict = conflicts.length > 0;

                  return (
                    <div key={schedule.id} className="relative pl-3.5 sm:pl-5">
                      {/* Timeline Node */}
                      <button 
                        onClick={() => handleToggleComplete(schedule)}
                        className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-[1.5px] border-black flex items-center justify-center transition-all ${
                          schedule.completed ? 'bg-emerald-500 text-white shadow-[1px_1px_0px_#121212]' : 'bg-white'
                        }`}
                        title={schedule.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                      >
                        {schedule.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>

                      <div className={`border-[1.5px] border-black rounded-xl p-2.5 transition-all ${
                        hasConflict ? 'bg-amber-50 shadow-[1.5px_1.5px_0px_#121212]' : 'bg-[#FFFDF8] shadow-[1.5px_1.5px_0px_#121212]'
                      } ${schedule.completed ? 'opacity-60' : ''}`}>
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <div className="flex items-center gap-1 text-xs">
                            <span className="font-bold text-black">{schedule.startTime}</span>
                            <span className="text-gray-500 font-medium">- {schedule.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button 
                              onClick={() => { setFormData(schedule); setShowForm(true); }}
                              className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-white border border-black rounded shadow-[1px_1px_0px_#121212]"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(schedule.id)}
                              className="px-2 py-0.5 text-[10px] font-bold text-red-600 bg-white border border-black rounded shadow-[1px_1px_0px_#121212]"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                        
                        <h4 className={`text-xs font-bold mb-1 ${schedule.completed ? 'line-through text-gray-500' : 'text-black'}`}>
                          {schedule.title}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="bg-[#00F0FF] text-black text-[9.5px] font-bold px-1.5 py-0.2 rounded border border-black">
                            {schedule.category}
                          </span>

                          {hasConflict && (
                            <span className="bg-[#FF4B91] text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded border border-black flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Bentrok {conflicts.map(c => c.prayerName).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <div className="w-9 h-9 bg-emerald-100 border-[1.5px] border-black rounded-xl flex items-center justify-center mb-2 shadow-[1px_1px_0px_#121212]">
                  <CalendarIcon className="w-4.5 h-4.5 text-emerald-800" />
                </div>
                <p className="text-gray-600 font-medium text-xs mb-2">Belum ada aktivitas pada tanggal ini.</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="px-3 py-1 bg-emerald-400 text-black border-[1.5px] border-black rounded-lg text-xs font-bold shadow-[1px_1px_0px_#121212]"
                >
                  + Tambah Jadwal
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
