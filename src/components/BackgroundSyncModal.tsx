import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bell, Zap, X, Check, BatteryCharging } from 'lucide-react';
import { storage } from '../lib/storage';
import { vibrateSuccess } from '../lib/audio';
import { requestNotificationPermission } from '../lib/pwa-service';

export const BackgroundSyncModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only prompt if user is logged in, has not allowed background sync yet, and hasn't dismissed it
    const user = storage.getUser();
    if (user && user.isOnboarded) {
      const isAllowed = storage.isBackgroundSyncAllowed();
      const isDismissed = storage.isBackgroundSyncDismissed();
      if (!isAllowed && !isDismissed) {
        // Small delay so user sees dashboard first
        const t = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const handleAllow = async () => {
    storage.setBackgroundSyncAllowed(true);
    storage.setBackgroundSyncDismissed(true);
    vibrateSuccess();

    // Request notification permission if not yet decided
    if ('Notification' in window && Notification.permission === 'default') {
      await requestNotificationPermission();
    }

    setIsOpen(false);
  };

  const handleDismiss = () => {
    storage.setBackgroundSyncDismissed(true);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-emerald-100 dark:border-emerald-900/40 space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
            <Zap className="w-6 h-6" />
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Optimalisasi Latar Belakang
          </span>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mt-0.5">
            Izinkan Berjalan di Latar Belakang?
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
            Agar ponsel Anda tetap menerima <strong>lantunan suara adzan tepat waktu</strong>, pembaruan <strong>jadwal kuliah</strong>, dan <strong>tracking sholat fardhu</strong> secara otomatis meskipun layar ponsel mati atau Anda sedang membuka aplikasi lain.
          </p>
        </div>

        {/* Efficiency highlight card */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
            <BatteryCharging className="w-4 h-4 text-emerald-600" />
            <span>Sangat Ringan & Hemat Baterai HP</span>
          </div>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
            Dirancang dengan algoritma efisien (siklus hemat daya), tidak membebani memori smartphone dan tidak boros baterai.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={handleAllow}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Izinkan Berjalan Latar Belakang</span>
          </button>
          <button
            onClick={handleDismiss}
            className="py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-semibold transition-colors"
          >
            Nanti Saja
          </button>
        </div>

      </div>
    </div>
  );
};
