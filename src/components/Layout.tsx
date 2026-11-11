import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Clock, BarChart2, Menu, Plus, CheckSquare, Settings, BookOpen, Quote, Cloud, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { QuickAddModal } from './QuickAddModal';
import { MurottalPlayerWidget } from './MurottalPlayerWidget';
import { FloatingWidget } from './FloatingWidget';
import { NavHomeIcon, NavJadwalIcon, NavIbadahIcon, NavDoaIcon, NavQuranIcon, NavMenuIcon } from './NavIcons';
import { playButtonTapSound, playTabSwitchSound } from '../lib/audio';
import { storage } from '../lib/storage';

export const Layout = () => {
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [user, setUser] = useState(storage.getUser());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleStorage = () => setUser(storage.getUser());
    window.addEventListener('storage', handleStorage);
    window.addEventListener('wi_cloud_synced', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('wi_cloud_synced', handleStorage);
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest('button') || target.closest('a');
      if (clickable) {
        const currentUser = storage.getUser();
        if (currentUser && currentUser.soundEnabled !== false) {
          if (clickable.getAttribute('data-nav') === 'true' || clickable.tagName === 'A') {
            playTabSwitchSound();
          } else {
            playButtonTapSound();
          }
        }
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const navItems = [
    { label: 'Home', icon: Home, path: '/', color: '#059669' },
    { label: 'Jadwal', icon: Calendar, path: '/jadwal', color: '#00F0FF' },
    { label: 'Ibadah', icon: Clock, path: '/ibadah', color: '#FF4B91' },
    { label: 'Doa & Zikir', icon: Sparkles, path: '/doa', color: '#10B981' },
    { label: 'Progress', icon: BarChart2, path: '/progress', color: '#059669' },
    { label: 'Qur\'an', icon: BookOpen, path: '/quran', color: '#34D399' },
    { label: 'Hadis', icon: Quote, path: '/hadis', color: '#00F0FF' },
    { label: 'Menu', icon: Menu, path: '/menu', color: '#FF4B91' },
  ];

  const mobileNavItems = [
    { label: 'Home', icon: NavHomeIcon, path: '/' },
    { label: 'Jadwal', icon: NavJadwalIcon, path: '/jadwal' },
    { label: 'Ibadah', icon: NavIbadahIcon, path: '/ibadah' },
    { label: 'Doa', icon: NavDoaIcon, path: '/doa' },
    { label: 'Qur\'an', icon: NavQuranIcon, path: '/quran' },
    { label: 'Menu', icon: NavMenuIcon, path: '/menu' },
  ];

  return (
    <div className="min-h-screen bg-transparent dark:bg-slate-950 text-[#121212] dark:text-slate-100 flex overflow-x-hidden w-full max-w-full transition-colors duration-200">
      {/* Desktop Sidebar (Memphis Retro Style) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B4A3B] text-[#FFF8E8] dark:bg-slate-900 border-r-[3px] border-[#C99A4B] dark:border-slate-700 p-5 fixed h-full z-10">
        {/* Brand Header with Official Icon */}
        <div className="flex items-center gap-3 mb-6 p-2.5 bg-[#08372C] border-[1.5px] border-[#C99A4B] rounded-xl">
          <div className="w-10 h-10 bg-white border-[1.5px] border-[#121212] rounded-xl flex items-center justify-center p-0.5 shadow-[2px_2px_0px_#121212] shrink-0 overflow-hidden">
            <img 
              src="/icon-waktuibadah.png" 
              alt="Icon WaktuIbadah" 
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://files.catbox.moe/3b6dqo.png";
              }}
            />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-[#FFF8E8]">WaktuIbadah</h1>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#C99A4B] text-[#0F2F27] px-1.5 py-0.5 rounded">
              Islamic Planner
            </span>
          </div>
        </div>
        
        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-nav="true"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all duration-100",
                  isActive 
                    ? "bg-[#FFF8E8] text-[#0B4A3B] border-[1.5px] border-[#C99A4B] shadow-[2px_2px_0px_#C99A4B] translate-x-1 font-bold" 
                    : "text-[#E9DDBF] dark:text-gray-300 hover:bg-white/10 hover:text-white"
                )
              }
            >
              <item.icon className="w-4 h-4 stroke-[2.5]" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quick Add Button - Hidden when on /jadwal so there is no duplicate button on PC */}
        {location.pathname !== '/jadwal' && (
          <button 
            onClick={() => setQuickAddOpen(true)}
            className="mt-3 memphis-btn memphis-btn-green py-2.5 w-full gap-2 text-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Tambah Agenda
          </button>
        )}

        {/* Cloud Sync Status Indicator */}
        <div 
          onClick={() => navigate('/settings')}
          className="mt-3 p-2.5 bg-[#08372C] dark:bg-slate-800 border-[1.5px] border-[#C99A4B] dark:border-slate-700 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-white/10 transition-all"
          title="Klik untuk membuka Pengaturan Sinkronisasi Multi-Device"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-black"></div>
            <span className="font-bold text-[#FFF8E8] truncate text-[11px]">{user?.name || 'Mahasiswa'}</span>
          </div>
          <span className="text-[9px] bg-[#C99A4B] text-[#0F2F27] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
            Cloud
          </span>
        </div>
      </aside>

      {/* Main Content - Guaranteed No Horizontal Overflow & Compact Mobile Padding */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-8 min-h-screen max-w-5xl mx-auto w-full relative overflow-x-hidden">
        {/* Mobile Top Header with Brand Icon */}
        <div className="md:hidden sticky top-0 z-30 bg-[#0B4A3B] dark:bg-slate-900/95 border-b-0 px-3.5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg border-[1.5px] border-[#C99A4B] bg-[#FFF8E8] p-0.5 overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src="/icon-waktuibadah.png" 
                alt="WaktuIbadah Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://files.catbox.moe/3b6dqo.png";
                }}
              />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-xs tracking-tight text-[#FFF8E8] block leading-none truncate">
                WaktuIbadah
              </span>
              <span className="text-[9.5px] font-semibold text-[#E6C27A] uppercase tracking-wider block mt-0.5 truncate">
                Islamic Planner
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/settings')}
            aria-label="Pengaturan Profil"
            className="border-[1.5px] border-[#C99A4B] bg-[#FFF8E8] text-[#0B4A3B] px-2.5 py-1 text-[11px] font-bold rounded-lg truncate max-w-[120px] active:translate-y-0.5"
          >
            {user?.name || 'Mahasiswa'}
          </button>
        </div>

        <div className="md:hidden wi-zellige sticky top-14 z-30" aria-hidden="true" />
        <div className="p-3 sm:p-5 lg:p-8 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (60px height, equal width items, light Memphis pill active indicator) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#0B4A3B] dark:bg-slate-900 border-t-[3px] border-[#C99A4B] dark:border-slate-800 grid grid-cols-6 items-center px-1 pb-[env(safe-area-inset-bottom,0px)] z-40">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-nav="true"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center h-full w-full py-1 transition-all min-w-0",
                isActive ? "text-[#E6C27A] font-bold" : "text-[#CFE3D6] hover:text-white font-normal"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                  isActive ? "bg-[#FFF8E8] border-[1.5px] border-[#C99A4B] -translate-y-1 shadow-[0_3px_0_#C99A4B]" : ""
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-[#0B4A3B]" : "text-[#E9DDBF]")} isActive={isActive} />
                </div>
                <span className={cn("text-[10px] tracking-tight mt-0.5 truncate max-w-full px-0.5", isActive ? "font-bold text-[#E6C27A]" : "font-medium text-[#CFE3D6]")}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Mobile Floating Action Button REMOVED as requested by user to eliminate duplicate button */}

      <QuickAddModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setQuickAddOpen(false)} 
      />

      {/* Global Murottal Player & Sleep Timer Widget */}
      <MurottalPlayerWidget />

      {/* Floating Check-in Widget for Desktop/Tablet */}
      <FloatingWidget />
    </div>
  );
};
