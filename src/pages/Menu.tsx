import React from 'react';
import { Link } from 'react-router-dom';
import { Timer, BookOpen, Settings as SettingsIcon, Lightbulb, ChevronRight, Compass, Calendar, Sparkles } from 'lucide-react';
import { storage } from '../lib/storage';

export default function Menu() {
  const user = storage.getUser();

  const menuItems = [
    { label: "Al-Qur'an & Hadits", icon: BookOpen, path: '/quran', desc: '114 Surat & 42 Hadits Arba\'in (MyQuran)', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Tools & Bantuan Islami', icon: Sparkles, path: '/tools', desc: 'Doa harian, Asmaul Husna & Konversi Hijriyah', color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Kalender Islami', icon: Calendar, path: '/kalender', desc: 'Kalender Hijriah & Google Sync', color: 'text-rose-500', bg: 'bg-rose-50' },
    { label: 'Arah Kiblat', icon: Compass, path: '/qibla', desc: 'Kompas penunjuk arah Kakbah presisi', color: 'text-teal-500', bg: 'bg-teal-50' },
    { label: 'Focus Mode', icon: Timer, path: '/focus', desc: 'Timer pomodoro untuk produktivitas ibadah & kerja', color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Refleksi Harian', icon: BookOpen, path: '/reflection', desc: 'Evaluasi ibadah dan produktivitas hari ini', color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Tips Islami', icon: Lightbulb, path: '/tips', desc: 'Motivasi dan panduan harian', color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Pengaturan', icon: SettingsIcon, path: '/settings', desc: 'Tema, audio, lokasi, dan versi aplikasi', color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl shadow-sm border border-primary/20">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-main">{user?.name}</h1>
          <p className="text-text-muted text-sm">{user?.target}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center p-4 bg-surface rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all active:scale-[0.98] group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${item.bg} ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-text-main group-hover:text-primary transition-colors">{item.label}</h3>
              <p className="text-sm text-text-muted">{item.desc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

    </div>
  );
}
