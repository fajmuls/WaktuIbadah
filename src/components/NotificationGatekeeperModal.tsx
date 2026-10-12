import React, { useState, useEffect } from 'react';
import { 
  Bell, BellRing, Volume2, ShieldCheck, AlertTriangle, 
  CheckCircle2, Smartphone, Laptop, Sparkles, RefreshCw, X, ChevronRight, HelpCircle
} from 'lucide-react';
import { storage } from '../lib/storage';
import { registerPWA, showPWANotification, getPWAStatus, PWAStatus } from '../lib/pwa-service';
import { testAlarmTone, stopAlarmSound, vibrateSuccess } from '../lib/audio';

interface NotificationGatekeeperModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function NotificationGatekeeperModal({ forceOpen = false, onClose }: NotificationGatekeeperModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'intro' | 'testing' | 'verify' | 'guide'>('intro');
  const [pwaStatus, setPwaStatus] = useState<PWAStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'pending' | 'success' | 'failed'>('pending');

  useEffect(() => {
    checkStatus();
    const isVerified = storage.isNotificationVerified();
    if (forceOpen || !isVerified) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const checkStatus = async () => {
    const status = await getPWAStatus();
    setPwaStatus(status);
  };

  const handleRunDiagnosticTest = async () => {
    setIsTesting(true);
    setStep('testing');

    try {
      // 1. Ensure Service Worker is registered
      await registerPWA();
      
      // 2. Play Loud Azan Sound & strong vibration
      testAlarmTone('azan_makkah', 'sound_and_vibrate', 8000);

      // 3. Trigger Real Mobile Notification via Service Worker
      const notificationSuccess = await showPWANotification(
        '🕌 Tes Notifikasi & Adzan WaktuIbadah',
        {
          body: 'Alhamdulillah! Notifikasi di perangkat Anda berfungsi sempurna untuk pengingat waktu salat.',
          tag: 'test-direct-notification',
          vibrate: [600, 250, 600, 250, 900]
        }
      );

      await checkStatus();
      setIsTesting(false);
      setStep('verify');
    } catch (err) {
      console.error("Diagnostic notification test error:", err);
      setIsTesting(false);
      setStep('verify');
    }
  };

  const handleConfirmSuccess = () => {
    stopAlarmSound();
    storage.setNotificationVerified(true);
    vibrateSuccess();
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleReportFailed = () => {
    stopAlarmSound();
    setStep('guide');
  };

  const handleDismissModal = () => {
    stopAlarmSound();
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 dark:border-emerald-900/60 overflow-hidden relative">
        {/* Islamic Subtle Accent */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close button only available if already verified once or force-opened from settings */}
        {storage.isNotificationVerified() && (
          <button 
            onClick={handleDismissModal}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verifikasi Sistem Pengingat
            </span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Uji Coba Notifikasi & Suara Azan
            </h2>
          </div>
        </div>

        {/* STEP 1: INTRO & DIAGNOSTIC */}
        {step === 'intro' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Agar pengingat waktu salat dan alarm berbunyi tepat waktu di handphone atau laptop Anda (bahkan saat tab tertutup/layar mati), sistem perlu memverifikasi izin notifikasi dan mesin audio perangkat Anda.
            </p>

            {/* Diagnostic Box */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 rounded-2xl p-3.5 border border-emerald-100 dark:border-emerald-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Service Worker (Latar Belakang HP):
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {pwaStatus?.isSupported ? 'Tersedia (/sw.js)' : 'Mendukung'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-emerald-600" />
                  Status Izin Notifikasi:
                </span>
                <span className={`font-bold ${
                  pwaStatus?.permission === 'granted' 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : pwaStatus?.permission === 'denied'
                      ? 'text-rose-600'
                      : 'text-amber-600'
                }`}>
                  {pwaStatus?.permission === 'granted' ? 'Diizinkan' : pwaStatus?.permission === 'denied' ? 'Diblokir Browser' : 'Perlu Izin'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  Audio & Getar Azan:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  Suara Azan Keras + Haptik
                </span>
              </div>
            </div>

            <button
              onClick={handleRunDiagnosticTest}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <BellRing className="w-4 h-4" />
              <span>Uji Coba Notifikasi & Suara Sekarang</span>
            </button>

            <p className="text-[11px] text-center text-gray-400">
              *Ketuk "Izinkan" jika peramban HP Anda menampilkan dialog izin pop-up.
            </p>
          </div>
        )}

        {/* STEP 2: TESTING PROGRESS */}
        {step === 'testing' && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex items-center justify-center animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Mengirim Notifikasi Uji Coba...
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Memutar suara azan keras dan memicu getaran ke HP Anda.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: VERIFICATION CONFIRMATION */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-xs">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Apakah Notifikasi Banner & Suara Azan Muncul?
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Periksa panel notifikasi atas HP / bilah status laptop Anda. Apakah ada pesan "Tes Notifikasi & Adzan WaktuIbadah" dan suara terdengar?
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleConfirmSuccess}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ya, Muncul Sempurna (Lanjutkan)</span>
              </button>

              <button
                onClick={handleReportFailed}
                className="w-full py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Tidak Muncul / Perlu Panduan Pengaturan HP</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: MOBILE TROUBLESHOOTING GUIDE */}
        {step === 'guide' && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/50 space-y-1">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Penyebab Notifikasi Tidak Muncul di HP:</span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300/90 leading-relaxed">
                Di peramban seluler (Chrome/Samsung Internet/Safari), sistem proteksi sering memblokir notifikasi dan pemutaran suara otomatis tanpa izin manual.
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Buka Izin di Address Bar Peramban
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
                  Ketuk ikon gembok 🔒 atau pengaturan di kiri bilah alamat URL peramban Anda ➔ pilih <strong>Izin / Setelan Situs</strong> ➔ aktifkan <strong>Notifikasi (Izinkan)</strong> dan <strong>Suara</strong>.
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Periksa Volume Dering & Jangan Ganggu (DND)
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
                  Pastikan HP tidak dalam mode Silent/Mute total dan mode Do Not Disturb dinonaktifkan untuk pengujian alarm.
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  Instal Aplikasi ke Layar Utama (PWA)
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-[11px] leading-relaxed">
                  Ketuk menu titik tiga ⋮ di peramban Anda ➔ pilih <strong>"Tambahkan ke Layar Utama"</strong>. Sebagai PWA terinstal, Android akan memprioritaskan alarm di layar kunci.
                </p>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={handleRunDiagnosticTest}
                className="flex-1 py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Tes Ulang</span>
              </button>

              <button
                onClick={handleConfirmSuccess}
                className="py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl font-bold text-xs transition-colors"
              >
                Lewati & Masuk
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
