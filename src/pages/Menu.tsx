import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { storage } from '../lib/storage';
import YouTubeEmbed from '../components/YouTubeEmbed';
import { YOUTUBE_VIDEO_ID } from '../lib/site';

// Bespoke SVG Icons for Menu Categories
const DoaMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <path d="M6 19C4 16 3 13 4 10C5 7 8 8 9 10L10 13M18 19C20 16 21 13 20 10C19 7 16 8 15 10L14 13" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 13C10 16.5 11 20 12 21C13 20 14 16.5 14 13" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="7" r="1.5" fill="currentColor" />
  </svg>
);

const QuranMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <path d="M4 19.5C6 18.5 9 18.5 12 20C15 18.5 18 18.5 20 19.5V5.5C18 4.5 15 4.5 12 6C9 4.5 6 4.5 4 5.5V19.5Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 6V20" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const WidgetMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <rect x="3" y="3" width="8" height="8" rx="2" strokeWidth="1.8" />
    <rect x="13" y="3" width="8" height="5" rx="2" strokeWidth="1.8" />
    <rect x="13" y="10" width="8" height="11" rx="2" strokeWidth="1.8" />
    <rect x="3" y="13" width="8" height="8" rx="2" strokeWidth="1.8" />
    <path d="M6 7L7.5 8.5L9.5 5.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ToolsMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth="1.8" />
  </svg>
);

const CalendarMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <rect x="3" y="4" width="18" height="17" rx="2" strokeWidth="1.8" />
    <path d="M16 2V6M8 2V6M3 9.5H21" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="8" cy="14" r="1" fill="currentColor" />
    <circle cx="12" cy="14" r="1" fill="currentColor" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
  </svg>
);

const QiblaMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
    <polygon points="12 4 14.5 10.5 20 12 14.5 13.5 12 20 9.5 13.5 4 12 9.5 10.5 12 4" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const FocusMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <circle cx="12" cy="13" r="8" strokeWidth="1.8" />
    <path d="M12 9V13L15 15" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 2H14" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ReflectionMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.8" />
    <polyline points="14 2 14 8 20 8" strokeWidth="1.8" />
    <line x1="9" y1="13" x2="15" y2="13" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="9" y1="17" x2="13" y2="17" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const AdminMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="1.8" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="1.8" />
  </svg>
);

const SettingsMenuSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor">
    <line x1="4" y1="21" x2="4" y2="14" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="4" y1="10" x2="4" y2="3" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="12" y1="21" x2="12" y2="12" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="12" y1="8" x2="12" y2="3" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="20" y1="21" x2="20" y2="16" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="20" y1="12" x2="20" y2="3" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="1" y1="14" x2="7" y2="14" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="9" y1="8" x2="15" y2="8" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="17" y1="16" x2="23" y2="16" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export default function Menu() {
  const user = storage.getUser();

  const menuItems = [
    { 
      label: "Widget Layar & Wallpaper", 
      icon: WidgetMenuSvg, 
      path: '/widget', 
      desc: 'Ceklis cepat 5 waktu salat & tugas (bisa resize & pop-out)', 
      bg: 'bg-gradient-to-br from-amber-300 to-orange-400', 
      color: 'text-black',
      badge: 'v2.9'
    },
    { 
      label: "Doa & Zikir Lengkap", 
      icon: DoaMenuSvg, 
      path: '/doa', 
      desc: 'Wirid sesudah salat fardhu, doa harian & belajar', 
      bg: 'bg-emerald-500 text-white', 
      color: 'text-white' 
    },
    { 
      label: "Al-Qur'an & Hadits", 
      icon: QuranMenuSvg, 
      path: '/quran', 
      desc: '114 Surat, Juz 1-30, Multi-hanca & Murottal auto-scroll', 
      bg: 'bg-teal-500 text-white', 
      color: 'text-white' 
    },
    { 
      label: 'Tools & Bantuan Islami', 
      icon: ToolsMenuSvg, 
      path: '/tools', 
      desc: 'Asmaul Husna, konversi Hijriah, dan panduan ibadah', 
      bg: 'bg-cyan-500 text-black', 
      color: 'text-black' 
    },
    { 
      label: 'Kalender Islami', 
      icon: CalendarMenuSvg, 
      path: '/kalender', 
      desc: 'Kalender Hijriah & pengingat puasa sunnah', 
      bg: 'bg-pink-500 text-white', 
      color: 'text-white' 
    },
    { 
      label: 'Arah Kiblat', 
      icon: QiblaMenuSvg, 
      path: '/qibla', 
      desc: 'Kompas penunjuk arah Kakbah presisi', 
      bg: 'bg-emerald-600 text-white', 
      color: 'text-white' 
    },
    { 
      label: 'Focus Mode (Pomodoro)', 
      icon: FocusMenuSvg, 
      path: '/focus', 
      desc: 'Timer fokus untuk produktivitas ibadah & kuliah', 
      bg: 'bg-orange-500 text-white', 
      color: 'text-white' 
    },
    { 
      label: 'Refleksi Harian', 
      icon: ReflectionMenuSvg, 
      path: '/reflection', 
      desc: 'Evaluasi ibadah dan produktivitas harian', 
      bg: 'bg-teal-600 text-white', 
      color: 'text-white' 
    },
    { 
      label: 'Admin Dashboard (PAI)', 
      icon: AdminMenuSvg, 
      path: '/admin', 
      desc: 'Kelola evaluasi review & rekapitulasi data', 
      bg: 'bg-slate-900 text-[#6EE7B7]', 
      color: 'text-[#6EE7B7]' 
    },
    { 
      label: 'Pengaturan & Versi v2.10.0', 
      icon: SettingsMenuSvg, 
      path: '/settings', 
      desc: 'Notifikasi azan, suara qari, tema, & cloud sync', 
      bg: 'bg-emerald-700 text-white', 
      color: 'text-white' 
    },
  ];

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300 max-w-2xl mx-auto pb-20 w-full max-w-full overflow-x-hidden">
      
      {/* Profile Header (Clean Memphis Card) */}
      <div className="p-3.5 sm:p-4.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 border-[1.5px] border-[#121212] rounded-2xl shadow-[2px_2px_0px_#121212] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#121212] text-[#6EE7B7] rounded-xl border-[1.5px] border-black flex items-center justify-center font-bold text-base sm:text-lg shadow-[1.5px_1.5px_0px_#121212] shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'M'}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-[#121212] truncate">
              {user?.name || 'Mahasiswa Muslim'}
            </h1>
            <p className="text-[10.5px] sm:text-xs font-medium text-[#121212]/80 truncate">
              {user?.target || 'Menyeimbangkan Kuliah & Ibadah'}
            </p>
          </div>
        </div>

        <Link
          to="/settings"
          className="border-[1.5px] border-[#121212] bg-white text-[#121212] px-2.5 py-1 text-[11px] font-semibold rounded-lg shadow-[1.5px_1.5px_0px_#121212] hover:bg-gray-100 transition-colors shrink-0"
        >
          Pengaturan
        </Link>
      </div>

      {YOUTUBE_VIDEO_ID && <YouTubeEmbed videoId={YOUTUBE_VIDEO_ID} title="Kenali WaktuIbadah dalam 2 menit" />}

      {/* Menu Navigation Grid */}
      <div className="grid gap-2 sm:gap-2.5">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-[1.5px] border-[#121212] dark:border-slate-700 rounded-xl shadow-[2px_2px_0px_#121212] flex items-center gap-3 hover:translate-x-0.5 transition-all group overflow-hidden"
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-[1.5px] border-[#121212] dark:border-slate-700 flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#121212] ${item.bg}`}>
              <item.icon />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition-colors">
                  {item.label}
                </h3>
                {item.badge && (
                  <span className="text-[9px] font-extrabold uppercase bg-amber-400 text-black px-1.5 py-0.2 rounded border border-black shrink-0">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-normal text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {item.desc}
              </p>
            </div>

            <div className="w-6 h-6 rounded-lg border-[1.5px] border-[#121212] dark:border-slate-700 flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 shadow-[1px_1px_0px_#121212] shrink-0">
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
