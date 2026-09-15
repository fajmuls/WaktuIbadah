import React, { useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Target, CheckCircle2, Heart, Clock } from 'lucide-react';

export default function Progress() {
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksTotal: 0,
    prayerConsistency: 0,
    focusSessions: 0,
    activityCount: 0
  });

  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    // Calculate stats
    const tasks = storage.getTasks();
    const completedTasks = tasks.filter(t => t.status === 'Selesai');
    
    const prayers = storage.getPrayerLogs();
    const totalPrayers = prayers.reduce((acc, log) => acc + Object.values(log.prayers).filter(Boolean).length, 0);
    const maxPrayers = prayers.length > 0 ? prayers.length * 5 : 5;
    
    const focus = storage.getFocusSessions();
    const schedules = storage.getSchedules();
    const completedSchedules = schedules.filter(s => s.completed);

    setStats({
      tasksCompleted: completedTasks.length,
      tasksTotal: tasks.length,
      prayerConsistency: prayers.length > 0 ? Math.round((totalPrayers / maxPrayers) * 100) : 0,
      focusSessions: focus.length,
      activityCount: completedSchedules.length
    });

    // Prepare weekly chart data
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const dayTasks = tasks.filter(t => t.status === 'Selesai' && t.createdAt?.startsWith(dateStr)).length; // Assuming completion date roughly correlates for simplicity, or we can just show prayer count
      
      const dayPrayerLog = storage.getPrayerLog(dateStr);
      const dayPrayers = Object.values(dayPrayerLog.prayers).filter(Boolean).length;

      data.push({
        name: format(d, 'EEE', { locale: id }),
        ibadah: dayPrayers,
        tugas: dayTasks // Simplified
      });
    }
    setWeeklyData(data);

  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Progress Mingguan</h1>
        <p className="text-text-muted text-sm mt-1">Evaluasi kebiasaan dan produktivitasmu</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-3">
            <Heart className="w-5 h-5" />
          </div>
          <p className="text-sm text-text-muted font-medium mb-1">Konsistensi Salat</p>
          <p className="text-2xl font-bold">{stats.prayerConsistency}%</p>
        </div>
        
        <div className="bg-surface p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm text-text-muted font-medium mb-1">Tugas Selesai</p>
          <p className="text-2xl font-bold">{stats.tasksCompleted} <span className="text-sm text-gray-400 font-normal">/ {stats.tasksTotal}</span></p>
        </div>

        <div className="bg-surface p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-sm text-text-muted font-medium mb-1">Sesi Fokus</p>
          <p className="text-2xl font-bold">{stats.focusSessions} <span className="text-sm text-gray-400 font-normal">sesi</span></p>
        </div>
        
        <div className="bg-surface p-4 rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-3">
            <Target className="w-5 h-5" />
          </div>
          <p className="text-sm text-text-muted font-medium mb-1">Aktivitas Selesai</p>
          <p className="text-2xl font-bold">{stats.activityCount}</p>
        </div>
      </div>

      <div className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-lg mb-6">Aktivitas 7 Hari Terakhir</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="ibadah" name="Salat (Waktu)" fill="#22c55e" radius={[4, 4, 4, 4]} barSize={12} />
              <Bar dataKey="tugas" name="Tugas Selesai" fill="#3b82f6" radius={[4, 4, 4, 4]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10 flex gap-4 items-start">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
          💡
        </div>
        <div>
          <h4 className="font-bold text-text-main mb-1">Insight Mingguan</h4>
          <p className="text-sm text-text-muted leading-relaxed">
            {stats.prayerConsistency > 80 
              ? "Luar biasa! Konsistensi ibadahmu sangat baik minggu ini. Pertahankan kebiasaan positif ini." 
              : "Jangan lupa untuk selalu menyempatkan ibadah di sela-sela waktu belajar. Sedikit demi sedikit akan menjadi kebiasaan."}
          </p>
        </div>
      </div>

    </div>
  );
}
