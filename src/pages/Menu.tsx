import React from 'react';
import { Link } from 'react-router-dom';
import { Timer, BookOpen, Settings as SettingsIcon, Lightbulb, ChevronRight, Compass, Calendar, Sparkles, Lock } from 'lucide-react';
import { storage } from '../lib/storage';

export default function Menu() {
  const user = storage.getUser();

  const menuItems = [
    { label: "Doa & Zikir Lengkap", icon: Sparkles, path: '/doa', desc: 'Wirid sesudah salat fardhu, doa harian & belajar', bg: 'bg-gradient-to-br from-emerald-500 to-green-600', color: 'text-white' },
    { label: "Al-Qur'an & Hadits", icon: BookOpen, path: '/quran', desc: '114 Surat & 42 Hadits Arba\'in (MyQuran)', bg: 'bg-gradient-to-br from-emerald-400 via-teal-300 to-green-400', color: 'text-black' },
    { label: 'Tools & Bantuan Islami', icon: Sparkles, path: '/tools', desc: 'Doa harian, Asmaul Husna & Konversi Hijriyah', bg: 'bg-[#00F0FF]', color: 'text-black' },
    { label: 'Kalender Islami', icon: Calendar, path: '/kalender', desc: 'Kalender Hijriah & Jadwal Ibadah Bulanan', bg: 'bg-[#FF4B91]', color: 'text-white' },
    { label: 'Arah Kiblat', icon: Compass, path: '/qibla', desc: 'Kompas penunjuk arah Kakbah presisi', bg: 'bg-[#10B981]', color: 'text-white' },
    { label: 'Focus Mode', icon: Timer, path: '/focus', desc: 'Timer pomodoro untuk produktivitas ibadah & kuliah', bg: 'bg-[#FF6B35]', color: 'text-white' },
    { label: 'Refleksi Harian', icon: BookOpen, path: '/reflection', desc: 'Evaluasi ibadah dan produktivitas harian', bg: 'bg-gradient-to-br from-emerald-300 to-teal-500', color: 'text-black' },
    { label: 'Tips Islami', icon: Lightbulb, path: '/tips', desc: 'Motivasi dan panduan harian mahasiswa', bg: 'bg-[#00F0FF]', color: 'text-black' },
    { label: 'Admin Dashboard (PAI)', icon: Lock, path: '/admin', desc: 'Kelola link formulir evaluasi review & rekapitulasi', bg: 'bg-black', color: 'text-[#6EE7B7]' },
    { label: 'Pengaturan & Versi', icon: SettingsIcon, path: '/settings', desc: 'PWA Background, Sound Pack, Multi-Device Cloud Sync', bg: 'bg-[#10B981]', color: 'text-white' },
  ];

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300 max-w-2xl mx-auto pb-20 w-full max-w-full overflow-x-hidden">
      
      {/* Profile Header (Memphis Green Gradient Card) */}
      <div className="p-3.5 sm:p-5 bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 border-2 border-black rounded-2xl shadow-[3px_3px_0px_#121212] flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black text-[#6EE7B7] rounded-xl border-2 border-black flex items-center justify-center font-black text-lg sm:text-xl shadow-[2px_2px_0px_#121212] shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'M'}
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-black truncate">
              {user?.name || 'Mahasiswa Muslim'}
            </h1>
            <p className="text-[10px] sm:text-xs font-bold text-black/80 truncate">
              {user?.target || 'Menyeimbangkan Kuliah & Ibadah'}
            </p>
          </div>
        </div>

        <Link
          to="/settings"
          className="memphis-btn memphis-btn-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wider shrink-0"
        >
          Pengaturan
        </Link>
      </div>

      {/* Menu Navigation Grid (Scaled Down & Fit-Screen for Mobile) */}
      <div className="grid gap-2 sm:gap-2.5">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="memphis-card p-2.5 sm:p-3.5 flex items-center shadow-[2px_2px_0px_#121212] hover:translate-x-0.5 transition-all overflow-hidden"
          >
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl border border-black flex items-center justify-center mr-2.5 sm:mr-3 shrink-0 shadow-[1.5px_1.5px_0px_#121212] ${item.bg} ${item.color}`}>
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-xs sm:text-sm uppercase tracking-tight text-black truncate">{item.label}</h3>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 truncate">{item.desc}</p>
            </div>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg border border-black flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-400 text-black shadow-[1.5px_1.5px_0px_#121212] shrink-0 ml-2">
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
