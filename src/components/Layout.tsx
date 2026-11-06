import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Clock, BarChart2, Menu, Plus, CheckSquare, Settings, BookOpen, Quote, Cloud, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { QuickAddModal } from './QuickAddModal';
import { MurottalPlayerWidget } from './MurottalPlayerWidget';
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
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Jadwal', icon: Calendar, path: '/jadwal' },
    { label: 'Ibadah', icon: Clock, path: '/ibadah' },
    { label: 'Doa', icon: Sparkles, path: '/doa' },
    { label: 'Qur\'an', icon: BookOpen, path: '/quran' },
    { label: 'Menu', icon: Menu, path: '/menu' },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#121212] flex overflow-x-hidden w-full max-w-full">
      {/* Desktop Sidebar (Memphis Retro Style) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r-[1.5px] border-[#121212] p-5 fixed h-full z-10 shadow-[4px_0px_0px_#121212]">
        {/* Brand Header with Official Icon */}
        <div className="flex items-center gap-3 mb-6 p-2.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 border-[1.5px] border-[#121212] rounded-xl shadow-[2px_2px_0px_#121212]">
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
            <h1 className="text-base font-bold tracking-tight text-[#121212]">WaktuIbadah</h1>
            <span className="text-[9px] font-bold uppercase tracking-wider bg-[#121212] text-[#6EE7B7] px-1.5 py-0.5 rounded">
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
                    ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 text-[#121212] border-[1.5px] border-[#121212] shadow-[2px_2px_0px_#121212] translate-x-1 font-bold" 
                    : "text-gray-700 hover:bg-emerald-500/10 hover:text-black hover:border-2 hover:border-[#121212]"
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
          className="mt-3 p-2.5 bg-[#FFFDF8] border-[1.5px] border-[#121212] rounded-xl shadow-[2px_2px_0px_#121212] flex items-center justify-between text-xs cursor-pointer hover:bg-emerald-500/10 transition-all"
          title="Klik untuk membuka Pengaturan Sinkronisasi Multi-Device"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-black"></div>
            <span className="font-bold text-[#121212] truncate text-[11px]">{user?.name || 'Mahasiswa'}</span>
          </div>
          <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
            Cloud
          </span>
        </div>
      </aside>

      {/* Main Content - Guaranteed No Horizontal Overflow & Compact Mobile Padding */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-8 min-h-screen max-w-5xl mx-auto w-full relative overflow-x-hidden">
        {/* Mobile Top Header with Brand Icon */}
        <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-[1.5px] border-[#121212] px-3.5 h-14 flex items-center justify-between shadow-[0px_2px_0px_#121212]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg border-[1.5px] border-black bg-white p-0.5 shadow-[1.5px_1.5px_0px_#121212] overflow-hidden flex items-center justify-center shrink-0">
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
              <span className="font-bold text-xs tracking-tight text-[#121212] block leading-none truncate">
                WaktuIbadah
              </span>
              <span className="text-[9.5px] font-medium text-gray-500 uppercase tracking-wider block mt-0.5 truncate">
                Islamic Planner
              </span>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/settings')}
            aria-label="Pengaturan Profil"
            className="border-[1.5px] border-black bg-white px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-[1.5px_1.5px_0px_#121212] truncate max-w-[120px] active:translate-y-0.5"
          >
            {user?.name || 'Mahasiswa'}
          </button>
        </div>

        <div className="p-3 sm:p-5 lg:p-8 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (60px height, equal width items, light Memphis pill active indicator) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t-[1.5px] border-[#121212] grid grid-cols-6 items-center px-1 pb-[env(safe-area-inset-bottom,0px)] z-40 shadow-[0px_-2px_0px_#121212]">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-nav="true"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center h-full w-full py-1 transition-all min-w-0",
                isActive ? "text-emerald-800 font-bold" : "text-gray-600 hover:text-black font-normal"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "flex items-center justify-center px-2.5 py-0.5 rounded-full transition-all",
                  isActive ? "bg-emerald-200 border-[1.5px] border-black shadow-[1px_1px_0px_#121212]" : ""
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "stroke-[2.5] text-emerald-950" : "stroke-[2] text-gray-700")} />
                </div>
                <span className={cn("text-[10.5px] tracking-tight mt-0.5 truncate max-w-full px-0.5", isActive ? "font-bold text-black" : "text-gray-600")}>
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
    </div>
  );
};
