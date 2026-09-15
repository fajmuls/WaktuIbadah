import React, { useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import { User, Task, Schedule } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getNextPrayer, getPrayerTimesForToday } from '../lib/prayer-times';
import { Clock, CheckCircle2, Circle, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [nextPrayer, setNextPrayer] = useState(getNextPrayer());
  const [prayerLogs, setPrayerLogs] = useState(storage.getPrayerLog(format(new Date(), 'yyyy-MM-dd')));

  useEffect(() => {
    setUser(storage.getUser());
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Load tasks (only pending and today or earlier)
    const allTasks = storage.getTasks();
    const activeTasks = allTasks.filter(t => t.status !== 'Selesai' && t.deadline <= today);
    activeTasks.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    setTasks(activeTasks.slice(0, 3)); // Only show top 3

    // Load schedules for today
    const allSchedules = storage.getSchedules();
    const todaySchedules = allSchedules.filter(s => s.date === today);
    todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setSchedules(todaySchedules.slice(0, 3)); // Only show top 3 next

    // Timer for next prayer
    const interval = setInterval(() => {
      setNextPrayer(getNextPrayer());
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, []);

  const prayerTimes = getPrayerTimesForToday();
  const prayerDoneCount = Object.values(prayerLogs.prayers).filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <header className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            Assalamu'alaikum, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-text-muted mt-1 font-medium text-sm">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}
          </p>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shadow-sm">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Main Focus: Next Prayer */}
      <section className="bg-primary text-white rounded-3xl p-6 shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Clock className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h2 className="text-primary-light font-medium mb-1">Salat Berikutnya</h2>
          <div className="flex items-end gap-3 mb-2">
            <span className="text-4xl font-bold tracking-tight">{nextPrayer.prayer}</span>
            <span className="text-xl font-medium mb-1 opacity-90">{nextPrayer.time}</span>
          </div>
          {nextPrayer.isTomorrow && <p className="text-sm opacity-80">(Besok)</p>}
          
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm font-medium">Ibadah hari ini</div>
            <div className="text-sm font-bold">{prayerDoneCount}/5</div>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-white h-full rounded-full transition-all duration-700"
              style={{ width: `${(prayerDoneCount / 5) * 100}%` }}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aktivitas Terdekat */}
        <section className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Jadwal Hari Ini
            </h3>
            <Link to="/jadwal" className="text-sm text-primary font-medium hover:underline">Lihat Semua</Link>
          </div>
          
          {schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map(schedule => (
                <div key={schedule.id} className="flex gap-4 items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="text-center min-w-[60px]">
                    <div className="text-sm font-bold text-text-main">{schedule.startTime}</div>
                    <div className="text-xs text-text-muted">{schedule.endTime}</div>
                  </div>
                  <div className="w-1 bg-gray-200 h-10 rounded-full" />
                  <div>
                    <div className="font-semibold text-text-main">{schedule.title}</div>
                    <div className="text-xs text-primary bg-primary/10 inline-block px-2 py-0.5 rounded-full mt-1">
                      {schedule.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-text-muted text-sm mb-3">Belum ada aktivitas hari ini.</p>
              <Link to="/jadwal/baru" className="text-primary font-semibold text-sm hover:underline">
                + Tambah Aktivitas
              </Link>
            </div>
          )}
        </section>

        {/* Tugas Terdekat */}
        <section className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Tugas Mendekat
            </h3>
            <Link to="/tugas" className="text-sm text-primary font-medium hover:underline">Lihat Semua</Link>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <Circle className="w-5 h-5 text-gray-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-text-main line-clamp-1">{task.title}</div>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-md">
                        {format(new Date(task.deadline), 'dd MMM', { locale: id })}
                      </span>
                      {task.priority === 'Tinggi' && (
                        <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-md">
                          Prioritas Tinggi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-6 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <p className="text-text-muted text-sm mb-3">Semua tugas aman. Tambahkan tugas baru jika ada.</p>
             <Link to="/tugas/baru" className="text-primary font-semibold text-sm hover:underline">
               + Tambah Tugas
             </Link>
           </div>
          )}
        </section>
      </div>

      {/* Daily Islamic Reminder */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-100">
        <h3 className="text-sm font-bold text-secondary mb-2">💡 Reminder Hari Ini</h3>
        <p className="text-text-main italic">
          "Dua kenikmatan yang sering dilupakan oleh kebanyakan manusia adalah kesehatan dan waktu luang." 
        </p>
        <p className="text-xs text-text-muted mt-2 font-medium">— HR. Bukhari</p>
      </section>

    </div>
  );
}
