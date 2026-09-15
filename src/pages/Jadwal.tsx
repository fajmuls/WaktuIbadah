import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { Schedule, ScheduleCategory, PrayerConflictInfo } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Plus, X, Clock, Calendar as CalendarIcon, Tag, Check, 
  AlertTriangle, Info, Sparkles, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCachedPrayerData, getPrayerTimesForToday } from '../lib/prayer-times';
import { checkSchedulePrayerConflicts, getAllScheduleConflicts } from '../lib/schedule-prayer-conflict';

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
    storage.updateSchedule({ ...schedule, completed: !schedule.completed });
    loadSchedules();
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus jadwal ini?')) {
      storage.deleteSchedule(id);
      loadSchedules();
    }
  };

  const categories: ScheduleCategory[] = ['Kuliah', 'Tugas', 'Ibadah', 'Istirahat', 'Pribadi', 'Lainnya'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Jadwal & Agenda Kuliah</h1>
          <p className="text-text-muted text-sm mt-1">Sinkronisasi otomatis dengan deteksi bentrok waktu salat fardhu</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="hidden md:flex bg-primary text-white p-2 px-4 rounded-xl items-center gap-2 font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" /> Tambah Aktivitas
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold">{formData.id ? 'Edit' : 'Tambah'} Aktivitas</h2>
              <p className="text-xs text-text-muted">Aplikasi otomatis menganalisis keselarasan jadwal dengan waktu salat</p>
            </div>
            <button onClick={() => { setShowForm(false); if(isNew) navigate('/jadwal'); }} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Aktivitas / Mata Kuliah</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="Misal: Praktikum Algoritma / Kuliah PAI"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Jam Mulai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input 
                    type="time" 
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full p-3 pl-9 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jam Selesai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input 
                    type="time" 
                    required
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full p-3 pl-9 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tanggal</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full p-3 pl-9 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kategori</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, category: cat})}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      formData.category === cat 
                      ? 'bg-primary text-white border-primary shadow-xs' 
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* REAL-TIME CONFLICT ALERT IN FORM */}
            {formConflicts.length > 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Peringatan Deteksi Bentrok Waktu Salat ({formConflicts.map(c => `${c.prayerName} ${c.prayerTime}`).join(', ')})</span>
                </div>
                {formConflicts.map((conf, idx) => (
                  <div key={idx} className="bg-white/80 dark:bg-gray-900/80 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/60 text-xs space-y-1">
                    <p className="font-semibold text-amber-950 dark:text-amber-300">
                      ⚠️ Waktu salat <strong>{conf.prayerName} ({conf.prayerTime})</strong> {conf.conflictType === 'overlap' ? 'berada tepat di rentang waktu jadwal ini' : 'sangat berdekatan dengan jam mulai/selesai'}.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-[11px] leading-relaxed">
                      💡 <strong>Saran Jeda Ibadah:</strong> {conf.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/60 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Jadwal ini selaras & tidak bertabrakan dengan waktu salat fardhu.</span>
              </div>
            )}

            <button type="submit" className="w-full py-4 mt-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
              Simpan Jadwal
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Date Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
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
                  className={`flex flex-col items-center justify-center min-w-[70px] py-3 rounded-2xl border transition-all ${
                    isSelected 
                      ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                      : isToday 
                        ? 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10'
                        : 'bg-surface border-gray-100 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs mb-1 font-medium">{format(d, 'EEE', { locale: id })}</span>
                  <span className="text-xl font-bold">{format(d, 'd')}</span>
                </button>
              );
            })}
          </div>

          {/* DAY CONFLICT SUMMARY BANNER */}
          {dayConflicts.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200">
                    Perhatian: {dayConflicts.length} Jadwal Hari Ini Bersinggungan Dengan Waktu Salat
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                    Silakan cek rekomendasi jeda ibadah di bawah agar tetap dapat menunaikan salat tepat waktu di sela perkuliahan/tugas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-surface rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800 min-h-[400px]">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-secondary" />
              {format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: id })}
            </h3>

            {currentSchedules.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-6 sm:ml-8 space-y-6 pb-6">
                {currentSchedules.map((schedule) => {
                  const conflicts = checkSchedulePrayerConflicts(schedule, prayerTimes);
                  const hasConflict = conflicts.length > 0;

                  return (
                    <div key={schedule.id} className="relative pl-6 sm:pl-8 group">
                      {/* Timeline Node */}
                      <button 
                        onClick={() => handleToggleComplete(schedule)}
                        className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors ${
                          schedule.completed ? 'border-primary bg-primary text-white' : 'border-gray-300 group-hover:border-primary'
                        }`}
                      >
                        {schedule.completed && <Check className="w-3 h-3" />}
                      </button>

                      <div className={`bg-gray-50 dark:bg-gray-800/80 border ${hasConflict ? 'border-amber-300/80 dark:border-amber-800/80' : 'border-gray-100 dark:border-gray-700/80'} rounded-2xl p-4 transition-all ${schedule.completed ? 'opacity-60' : 'hover:shadow-md'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg text-primary">{schedule.startTime}</span>
                            <span className="text-text-muted text-sm">- {schedule.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => { setFormData(schedule); setShowForm(true); }}
                              className="text-xs text-blue-600 font-medium hover:underline bg-blue-50 dark:bg-blue-950/60 px-2 py-1 rounded-md"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(schedule.id)}
                              className="text-xs text-red-600 font-medium hover:underline bg-red-50 dark:bg-red-950/60 px-2 py-1 rounded-md"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                        
                        <h4 className={`text-base sm:text-lg font-semibold mb-1 ${schedule.completed ? 'line-through text-gray-500' : 'text-text-main'}`}>
                          {schedule.title}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium">{schedule.category}</span>
                          </div>

                          {/* CONFLICT BADGE */}
                          {hasConflict && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Bentrok {conflicts.map(c => `${c.prayerName} (${c.prayerTime})`).join(', ')}
                            </span>
                          )}
                        </div>

                        {/* CONFLICT SUGGESTION CARD */}
                        {hasConflict && (
                          <div className="mt-3 p-3 bg-amber-50/90 dark:bg-amber-950/50 rounded-xl border border-amber-200/80 dark:border-amber-900/60 space-y-1">
                            {conflicts.map((c, i) => (
                              <div key={i} className="text-xs text-amber-950 dark:text-amber-200">
                                <span className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-400 mb-0.5">
                                  <Sparkles className="w-3 h-3" />
                                  Saran Jeda Ibadah ({c.prayerName}):
                                </span>
                                <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
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
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium mb-4">Belum ada aktivitas hari ini.</p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary/20 transition-colors"
                >
                  Tambah Aktivitas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
