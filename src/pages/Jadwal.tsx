import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { Schedule, ScheduleCategory, PrayerConflictInfo } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Plus, X, Clock, Calendar as CalendarIcon, Tag, Check, 
  AlertTriangle, Info, Sparkles, ShieldAlert, CheckCircle2,
  CalendarPlus, Download, ExternalLink
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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showForm, setShowForm] = useState(isNew);
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<Schedule>>({
    title: '',
    category: 'Kuliah',
    startTime: '08:00',
    endTime: '09:30',
    date: format(new Date(), 'yyyy-MM-dd'),
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

  // Check conflicts for all schedules of the selected date
  const dayConflicts = useMemo(() => {
    if (Object.keys(prayerTimes).length === 0) return [];
    return getAllScheduleConflicts(currentSchedules, prayerTimes);
  }, [currentSchedules, prayerTimes]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    const newSchedule: Schedule = {
      id: formData.id || crypto.randomUUID(),
      title: formData.title!,
      category: formData.category as ScheduleCategory,
      startTime: formData.startTime!,
      endTime: formData.endTime!,
      date: formData.date!,
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

  const categories: ScheduleCategory[] = ['Kuliah', 'Tugas', 'Ibadah', 'Istirahat', 'Pribadi', 'Lainnya'];

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16 w-full max-w-full overflow-x-hidden">
      
      {/* Memphis Header */}
      <div className="p-3.5 sm:p-4 bg-white border-2 border-[#121212] rounded-2xl shadow-[3px_3px_0px_#121212] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#121212]">
            Jadwal & Agenda Kuliah
          </h1>
          <p className="text-gray-600 text-xs font-bold mt-0.5">
            Sinkronisasi otomatis dengan deteksi bentrok waktu salat fardhu
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {schedules.length > 0 && (
            <button
              onClick={() => {
                downloadICSFile(schedules, prayerTimes, `jadwal-kuliah-${selectedDate}.ics`);
                vibrateSuccess();
              }}
              className="memphis-btn memphis-btn-white px-3 py-1.5 text-xs font-black uppercase tracking-wider gap-1.5"
              title="Ekspor seluruh jadwal ke Google Calendar / Apple Calendar (.ics) dengan pengingat jeda salat"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor .ics</span>
            </button>
          )}

          {!showForm && (
            <button 
              onClick={() => setShowForm(true)}
              className="memphis-btn memphis-btn-green px-3.5 py-1.5 text-xs font-black uppercase tracking-wider gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> 
              <span>Tambah Jadwal</span>
            </button>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="memphis-card p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center border-b-2 border-black pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
                {formData.id ? 'Edit' : 'Tambah'} Aktivitas Kuliah
              </h2>
              <p className="text-[11px] font-bold text-gray-500">
                Aplikasi otomatis menganalisis keselarasan jadwal dengan waktu salat
              </p>
            </div>
            <button 
              onClick={() => { setShowForm(false); if(isNew) navigate('/jadwal'); }} 
              className="w-8 h-8 rounded-lg border-2 border-black bg-white flex items-center justify-center font-black shadow-[2px_2px_0px_#121212] hover:bg-red-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">
                Nama Aktivitas / Mata Kuliah
              </label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-2.5 memphis-input text-xs sm:text-sm"
                placeholder="Misal: Praktikum Algoritma / Kuliah PAI"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">Jam Mulai</label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    type="time" 
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full p-2.5 pl-8 memphis-input text-xs sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">Jam Selesai</label>
                <div className="relative">
                  <Clock className="absolute left-2.5 top-3 w-4 h-4 text-gray-400" />
                  <input 
                    type="time" 
                    required
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full p-2.5 pl-8 memphis-input text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1">Tanggal</label>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full p-2.5 pl-8 memphis-input text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5">Kategori</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat})}
                    className={`memphis-btn px-2.5 py-1 text-[11px] uppercase font-black ${
                      formData.category === cat 
                      ? 'memphis-btn-green' 
                      : 'memphis-btn-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* REAL-TIME CONFLICT ALERT IN FORM */}
            {formConflicts.length > 0 ? (
              <div className="p-3 bg-amber-100 border-2 border-black rounded-xl space-y-1.5 shadow-[2px_2px_0px_#121212]">
                <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Peringatan Bentrok Waktu Salat ({formConflicts.map(c => `${c.prayerName} ${c.prayerTime}`).join(', ')})</span>
                </div>
                {formConflicts.map((conf, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-black text-xs space-y-0.5">
                    <p className="font-bold text-amber-950 text-[11px]">
                      ⚠️ Waktu salat <strong>{conf.prayerName} ({conf.prayerTime})</strong> {conf.conflictType === 'overlap' ? 'berada di rentang jadwal ini' : 'sangat berdekatan'}.
                    </p>
                    <p className="text-gray-800 text-[10px] font-semibold leading-relaxed">
                      💡 <strong>Saran:</strong> {conf.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-100 border-2 border-black rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-950 shadow-[2px_2px_0px_#121212]">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Jadwal ini selaras & tidak bertabrakan dengan waktu salat fardhu.</span>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3 mt-3 memphis-btn memphis-btn-green text-xs sm:text-sm uppercase tracking-wider"
            >
              Simpan Jadwal Kuliah
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Date Selector (Memphis Compact Fit) */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full hide-scrollbar">
            {[-2, -1, 0, 1, 2, 3].map(offset => {
              const d = new Date();
              d.setDate(d.getDate() + offset);
              const dateStr = format(d, 'yyyy-MM-dd');
              const isSelected = selectedDate === dateStr;
              const isToday = offset === 0;
              
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[54px] sm:min-w-[66px] py-2 px-1 rounded-xl border-2 border-black transition-all ${
                    isSelected 
                      ? 'bg-gradient-to-br from-emerald-400 via-teal-300 to-green-400 text-black font-black shadow-[3px_3px_0px_#121212] -translate-y-0.5' 
                      : isToday 
                        ? 'bg-emerald-50 text-emerald-900 font-bold shadow-[2px_2px_0px_#121212]'
                        : 'bg-white text-gray-700 font-bold shadow-[2px_2px_0px_#121212] hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[10px] mb-0.5 uppercase tracking-wider">{format(d, 'EEE', { locale: id })}</span>
                  <span className="text-base sm:text-lg font-black">{format(d, 'd')}</span>
                </button>
              );
            })}
          </div>

          {/* DAY CONFLICT SUMMARY BANNER */}
          {dayConflicts.length > 0 && (
            <div className="bg-amber-100 border-2 border-black rounded-xl p-3 shadow-[3px_3px_0px_#121212] flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white border border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#121212]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm text-amber-950">
                  Perhatian: {dayConflicts.length} Jadwal Hari Ini Bersinggungan Dengan Waktu Salat
                </h4>
                <p className="text-[11px] font-semibold text-amber-900 mt-0.5">
                  Cek rekomendasi jeda ibadah di bawah agar tetap salat tepat waktu di sela perkuliahan.
                </p>
              </div>
            </div>
          )}

          {/* Timeline in Memphis Card */}
          <div className="memphis-card p-3.5 sm:p-5 min-h-[360px]">
            <h3 className="font-black text-sm sm:text-base uppercase tracking-tight mb-4 flex items-center gap-2 border-b-2 border-black pb-2">
              <CalendarIcon className="w-4 h-4 stroke-[2.5]" />
              {format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: id })}
            </h3>

            {currentSchedules.length > 0 ? (
              <div className="relative border-l-2 border-black ml-4 sm:ml-6 space-y-4 pb-4">
                {currentSchedules.map((schedule) => {
                  const conflicts = checkSchedulePrayerConflicts(schedule, prayerTimes);
                  const hasConflict = conflicts.length > 0;

                  return (
                    <div key={schedule.id} className="relative pl-4 sm:pl-6 group">
                      {/* Timeline Node */}
                      <button 
                        onClick={() => handleToggleComplete(schedule)}
                        className={`absolute -left-[10px] top-1 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center transition-all ${
                          schedule.completed ? 'bg-[#10B981] text-white shadow-[1px_1px_0px_#121212]' : 'bg-white hover:bg-gray-100'
                        }`}
                        title={schedule.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                      >
                        {schedule.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className={`border-2 border-black rounded-xl p-3 transition-all ${
                        hasConflict ? 'bg-amber-50 shadow-[3px_3px_0px_#121212]' : 'bg-[#FFFDF8] shadow-[2.5px_2.5px_0px_#121212]'
                      } ${schedule.completed ? 'opacity-65' : ''}`}>
                        <div className="flex justify-between items-start mb-1.5 gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm sm:text-base text-black">{schedule.startTime}</span>
                            <span className="text-gray-500 font-bold text-xs">- {schedule.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={generateGoogleCalendarUrl(schedule, conflicts)}
                              target="_blank"
                              rel="noreferrer"
                              className="memphis-btn memphis-btn-white px-2 py-0.5 text-[10px] uppercase font-black gap-1"
                              title="Buka / Tambahkan langsung ke Google Calendar"
                            >
                              <CalendarPlus className="w-3 h-3" />
                              <span className="hidden sm:inline">G-Cal</span>
                            </a>
                            <button 
                              onClick={() => { setFormData(schedule); setShowForm(true); }}
                              className="memphis-btn memphis-btn-white px-2 py-0.5 text-[10px] uppercase font-black text-blue-700"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(schedule.id)}
                              className="memphis-btn memphis-btn-white px-2 py-0.5 text-[10px] uppercase font-black text-red-600"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                        
                        <h4 className={`text-xs sm:text-sm font-black mb-1 ${schedule.completed ? 'line-through text-gray-500' : 'text-black'}`}>
                          {schedule.title}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className="memphis-badge bg-[#00F0FF] text-black text-[9px]">
                            {schedule.category}
                          </span>

                          {/* CONFLICT BADGE */}
                          {hasConflict && (
                            <span className="memphis-badge bg-[#FF4B91] text-white text-[9px] flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Bentrok {conflicts.map(c => `${c.prayerName} (${c.prayerTime})`).join(', ')}
                            </span>
                          )}
                        </div>

                        {/* CONFLICT SUGGESTION CARD */}
                        {hasConflict && (
                          <div className="mt-2.5 p-2.5 bg-white rounded-lg border border-black space-y-1">
                            {conflicts.map((c, i) => (
                              <div key={i} className="text-[11px] text-amber-950">
                                <span className="font-bold flex items-center gap-1 text-amber-900 mb-0.5">
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  Saran Jeda Ibadah ({c.prayerName}):
                                </span>
                                <p className="text-[10px] text-gray-800 leading-relaxed font-medium">
                                  {c.suggestion}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-14 h-14 bg-emerald-100 border-2 border-black rounded-2xl flex items-center justify-center mb-3 shadow-[2px_2px_0px_#121212]">
                  <CalendarIcon className="w-7 h-7 text-emerald-800" />
                </div>
                <p className="text-gray-600 font-bold text-xs mb-3">Belum ada aktivitas pada tanggal ini.</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="memphis-btn memphis-btn-green px-4 py-1.5 text-xs uppercase tracking-wider"
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
