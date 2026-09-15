import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Calendar, Clock, BarChart2, Menu, Plus, CheckSquare, Settings, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { QuickAddModal } from './QuickAddModal';
import { playClickSound } from '../lib/audio';
import { storage } from '../lib/storage';

export const Layout = () => {
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        const user = storage.getUser();
        if (user && user.soundEnabled !== false) {
          playClickSound();
        }
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Jadwal', icon: Calendar, path: '/jadwal' },
    { label: 'Ibadah', icon: Clock, path: '/ibadah' },
    { label: 'Progress', icon: BarChart2, path: '/progress' },
    { label: 'Hadis', icon: BookOpen, path: '/hadis' },
    { label: 'Menu', icon: Menu, path: '/menu' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-gray-100 p-6 fixed h-full z-10">
        <div className="flex items-center gap-2 mb-10">
          <Clock className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-primary">WaktuIbadah</h1>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                  isActive 
                    ? "bg-primary text-white font-medium shadow-md shadow-primary/20" 
                    : "text-text-muted hover:bg-gray-50 hover:text-primary"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button 
          onClick={() => setQuickAddOpen(true)}
          className="mt-4 flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-xl font-medium shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tambah
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-0 min-h-screen max-w-5xl mx-auto w-full relative">
        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-100 flex justify-around items-center p-2 pb-[env(safe-area-inset-bottom)] z-40">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all",
                isActive ? "text-primary" : "text-gray-400 hover:text-primary"
              )
            }
          >
            <item.icon className={cn("w-6 h-6 mb-1")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Mobile Floating Action Button */}
      <button
        onClick={() => setQuickAddOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/30 z-40 active:scale-95 transition-transform"
        aria-label="Tambah Aktivitas"
      >
        <Plus className="w-6 h-6" />
      </button>

      <QuickAddModal 
        isOpen={isQuickAddOpen} 
        onClose={() => setQuickAddOpen(false)} 
      />
    </div>
  );
};
