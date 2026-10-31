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
    { label: 'Home', icon: Home, path: '/', color: '#10B981' },
    { label: 'Jadwal', icon: Calendar, path: '/jadwal', color: '#00F0FF' },
    { label: 'Ibadah', icon: Clock, path: '/ibadah', color: '#FF4B91' },
    { label: 'Progress', icon: BarChart2, path: '/progress', color: '#10B981' },
    { label: 'Qur\'an', icon: BookOpen, path: '/quran', color: '#34D399' },
    { label: 'Hadis', icon: Quote, path: '/hadis', color: '#00F0FF' },
    { label: 'Menu', icon: Menu, path: '/menu', color: '#FF4B91' },
  ];

  const mobileNavItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Jadwal', icon: Calendar, path: '/jadwal' },
    { label: 'Ibadah', icon: Clock, path: '/ibadah' },
    { label: 'Qur\'an', icon: BookOpen, path: '/quran' },
    { label: 'Hadis', icon: Quote, path: '/hadis' },
    { label: 'Menu', icon: Menu, path: '/menu' },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#121212] flex overflow-x-hidden w-full max-w-full">
      {/* Desktop Sidebar (Memphis Retro Style) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r-[3px] border-[#121212] p-5 fixed h-full z-10 shadow-[4px_0px_0px_#121212]">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6 p-2.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 border-2 border-[#121212] rounded-xl shadow-[3px_3px_0px_#121212]">
          <div className="w-9 h-9 bg-black text-[#6EE7B7] rounded-lg flex items-center justify-center font-black">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight uppercase">WaktuIbadah</h1>
            <span className="text-[9px] font-black uppercase tracking-wider bg-black text-[#6EE7B7] px-1.5 py-0.5 rounded">
              Islamic Planner
            </span>
          </div>
        </div>
        
        {/* Nav Items */}
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              data-nav="true"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-100",
                  isActive 
                    ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 text-[#121212] border-2 border-[#121212] shadow-[3px_3px_0px_#121212] translate-x-1 font-black" 
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
            className="mt-4 memphis-btn memphis-btn-green py-2.5 w-full gap-2 text-xs uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Tambah Agenda
          </button>
        )}

        {/* Cloud Sync Status Indicator */}
        <div 
          onClick={() => navigate('/settings')}
          className="mt-3 p-2.5 bg-[#FFFDF8] border-2 border-[#121212] rounded-xl shadow-[2px_2px_0px_#121212] flex items-center justify-between text-xs cursor-pointer hover:bg-emerald-500/10 transition-all"
          title="Klik untuk membuka Pengaturan Sinkronisasi Multi-Device"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-black"></div>
            <span className="font-bold text-[#121212] truncate text-[11px]">{user?.name || 'Mahasiswa'}</span>
          </div>
          <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded font-black uppercase tracking-wider shrink-0">
            Cloud
          </span>
        </div>
      </aside>

      {/* Main Content - Guaranteed No Horizontal Overflow & Compact Mobile Padding */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-8 min-h-screen max-w-5xl mx-auto w-full relative overflow-x-hidden">
        <div className="p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (Memphis Style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-[#121212] flex justify-around items-center px-1 py-1.5 pb-[calc(env(safe-area-inset-bottom)+0.4rem)] z-40 shadow-[0px_-3px_0px_#121212]">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-nav="true"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center px-1.5 py-1 rounded-xl transition-all",
                isActive 
                  ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 border-2 border-[#121212] shadow-[2px_2px_0px_#121212] text-black font-black -translate-y-0.5" 
                  : "text-gray-600 hover:text-black font-bold"
              )
            }
          >
            <item.icon className="w-4 h-4 stroke-[2.5]" />
            <span className="text-[9px] uppercase tracking-tight mt-0.5">{item.label}</span>
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
