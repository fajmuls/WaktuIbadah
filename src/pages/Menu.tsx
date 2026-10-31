import React from 'react';
import { Link } from 'react-router-dom';
import { Timer, BookOpen, Settings as SettingsIcon, Lightbulb, ChevronRight, Compass, Calendar, Sparkles, Lock } from 'lucide-react';
import { storage, CURRENT_VERSION } from '../lib/storage';

export default function Menu() {
  const user = storage.getUser();

  const menuItems = [
    { label: "Al-Qur'an & Hadits", icon: BookOpen, path: '/quran', desc: '114 Surat & 42 Hadits Arba\'in (MyQuran)', bg: 'bg-[#FFE600]', color: 'text-black' },
    { label: 'Tools & Bantuan Islami', icon: Sparkles, path: '/tools', desc: 'Doa harian, Asmaul Husna & Konversi Hijriyah', bg: 'bg-[#00F0FF]', color: 'text-black' },
    { label: 'Kalender Islami', icon: Calendar, path: '/kalender', desc: 'Kalender Hijriah & Jadwal Ibadah Bulanan', bg: 'bg-[#FF4B91]', color: 'text-white' },
    { label: 'Arah Kiblat', icon: Compass, path: '/qibla', desc: 'Kompas penunjuk arah Kakbah presisi', bg: 'bg-[#10B981]', color: 'text-white' },
    { label: 'Focus Mode', icon: Timer, path: '/focus', desc: 'Timer pomodoro untuk produktivitas ibadah & kuliah', bg: 'bg-[#FF6B35]', color: 'text-white' },
    { label: 'Refleksi Harian', icon: BookOpen, path: '/reflection', desc: 'Evaluasi ibadah dan produktivitas harian', bg: 'bg-[#FFE600]', color: 'text-black' },
    { label: 'Tips Islami', icon: Lightbulb, path: '/tips', desc: 'Motivasi dan panduan harian mahasiswa', bg: 'bg-[#00F0FF]', color: 'text-black' },
    { label: 'Admin Dashboard (PAI)', icon: Lock, path: '/admin', desc: 'Kelola link formulir evaluasi review & rekapitulasi', bg: 'bg-black', color: 'text-[#FFE600]' },
    { label: 'Pengaturan & Versi', icon: SettingsIcon, path: '/settings', desc: 'PWA Background, Sound Pack, Multi-Device Cloud Sync', bg: 'bg-[#10B981]', color: 'text-white' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto pb-20">
      
      {/* Profile Header (Memphis Card) */}
      <div className="memphis-card-yellow p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-black text-[#FFE600] rounded-2xl border-2 border-black flex items-center justify-center font-black text-2xl shadow-[3px_3px_0px_#121212]">
            {user?.name?.charAt(0).toUpperCase() || 'M'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black uppercase tracking-tight text-black">{user?.name || 'Mahasiswa Muslim'}</h1>
              <span className="memphis-badge bg-black text-white text-[9px]">
                v{CURRENT_VERSION}
              </span>
            </div>
            <p className="text-xs font-bold text-black/80">{user?.target || 'Menyeimbangkan Kuliah & Ibadah'}</p>
          </div>
        </div>

        <Link
          to="/settings"
          className="memphis-btn memphis-btn-white px-3 py-1.5 text-xs font-black uppercase tracking-wider"
        >
          Pengaturan
        </Link>
      </div>

      {/* Menu Navigation Grid */}
      <div className="grid gap-3">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="memphis-card p-4 flex items-center hover:translate-x-1 hover:translate-y-[-1px] transition-all"
          >
            <div className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center mr-4 shrink-0 shadow-[2px_2px_0px_#121212] ${item.bg} ${item.color}`}>
              <item.icon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-sm uppercase tracking-tight text-black">{item.label}</h3>
              <p className="text-xs font-bold text-gray-500 truncate">{item.desc}</p>
            </div>
            <div className="w-8 h-8 rounded-lg border-2 border-black flex items-center justify-center bg-[#FFE600] shadow-[2px_2px_0px_#121212] shrink-0">
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
