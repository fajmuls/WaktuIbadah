import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { Schedule, ScheduleCategory } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Plus, X, Clock, Calendar as CalendarIcon, Tag, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface JadwalProps {
  isNew?: boolean;
}

export default function Jadwal({ isNew = false }: JadwalProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showForm, setShowForm] = useState(isNew);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Partial<Schedule>>({
    title: '',
    category: 'Kuliah',
    startTime: '08:00',
    endTime: '09:00',
    date: format(new Date(), 'yyyy-MM-dd'),
    completed: false
  });

  useEffect(() => {
    loadSchedules();
    if (isNew) {
      setShowForm(true);
    }
  }, [isNew]);

  const loadSchedules = () => {
    const all = storage.getSchedules();
    setSchedules(all);
  };

  const currentSchedules = schedules
    .filter(s => s.date === selectedDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

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
      endTime: '09:00',
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
          <h1 className="text-2xl font-bold text-text-main">Jadwal Harian</h1>
          <p className="text-text-muted text-sm mt-1">Rencanakan aktivitasmu dengan baik</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="hidden md:flex bg-primary text-white p-2 px-4 rounded-xl items-center gap-2 font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" /> Tambah
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{formData.id ? 'Edit' : 'Tambah'} Aktivitas</h2>
            <button onClick={() => { setShowForm(false); if(isNew) navigate('/jadwal'); }} className="text-gray-400 hover:text-gray-600 p-2 bg-gray-50 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nama Aktivitas</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="Misal: Kelas PAI"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Mulai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input 
                    type="time" 
                    required
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                    className="w-full p-3 pl-9 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Selesai</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <input 
                    type="time" 
                    required
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full p-3 pl-9 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50"
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
                  className="w-full p-3 pl-9 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50"
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
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

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

          {/* Timeline */}
          <div className="bg-surface rounded-3xl p-2 sm:p-6 shadow-sm border border-gray-100 min-h-[400px]">
            <h3 className="font-bold text-lg px-4 pt-4 sm:p-0 mb-6 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-secondary" />
              {format(new Date(selectedDate), 'EEEE, d MMMM yyyy', { locale: id })}
            </h3>

            {currentSchedules.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 ml-6 sm:ml-8 space-y-8 pb-8">
                {currentSchedules.map((schedule) => (
                  <div key={schedule.id} className="relative pl-6 sm:pl-8 group">
                    {/* Timeline Node */}
                    <button 
                      onClick={() => handleToggleComplete(schedule)}
                      className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white transition-colors ${
                        schedule.completed ? 'border-primary bg-primary text-white' : 'border-gray-300 group-hover:border-primary'
                      }`}
                    >
                      {schedule.completed && <Check className="w-3 h-3" />}
                    </button>

                    <div className={`bg-gray-50 border border-gray-100 rounded-2xl p-4 transition-all ${schedule.completed ? 'opacity-60' : 'hover:shadow-md'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-primary">{schedule.startTime}</span>
                          <span className="text-text-muted text-sm">- {schedule.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => { setFormData(schedule); setShowForm(true); }}
                            className="text-xs text-blue-600 font-medium hover:underline bg-blue-50 px-2 py-1 rounded-md"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(schedule.id)}
                            className="text-xs text-red-600 font-medium hover:underline bg-red-50 px-2 py-1 rounded-md"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                      
                      <h4 className={`text-lg font-semibold mb-1 ${schedule.completed ? 'line-through text-gray-500' : 'text-text-main'}`}>
                        {schedule.title}
                      </h4>
                      <div className="flex items-center gap-1 mt-2">
                        <Tag className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">{schedule.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
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
