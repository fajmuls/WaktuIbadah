import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { User } from '../types';
import { ArrowRight, Clock, ShieldCheck, Cloud, KeyRound, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { checkCloudProfile, connectCloudProfile, CloudProfileSummary } from '../lib/cloud-sync';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<User> & { pin?: string }>({
    name: '',
    pin: '',
    target: '',
    reminderEnabled: false,
    useFocusMode: true,
  });

  const [checkingCloud, setCheckingCloud] = useState(false);
  const [cloudProfile, setCloudProfile] = useState<CloudProfileSummary | null>(null);
  const [pinError, setPinError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  // Check cloud whenever name changes (debounced)
  useEffect(() => {
    const trimmed = (formData.name || '').trim();
    if (trimmed.length < 2) {
      setCloudProfile(null);
      setPinError('');
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingCloud(true);
      try {
        const result = await checkCloudProfile(trimmed);
        setCloudProfile(result);
        if (result.exists && !result.hasPin) {
          setSyncNotice('Profil ditemukan di cloud tanpa PIN. Data Anda akan langsung disinkronkan.');
        } else if (result.exists && result.hasPin) {
          setSyncNotice('Profil ditemukan di cloud dan dilindungi PIN. Masukkan PIN 4 digit untuk membuka data.');
        } else {
          setSyncNotice('');
        }
      } catch (err) {
        console.error('Error checking cloud profile:', err);
      } finally {
        setCheckingCloud(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.name]);

  const handleNext = async () => {
    setPinError('');

    // If step 1 and cloud profile exists with PIN, validate PIN before proceeding
    if (step === 1) {
      const studentName = (formData.name || '').trim();
      const enteredPin = (formData.pin || '').trim();

      if (cloudProfile?.exists) {
        if (cloudProfile.hasPin && (!enteredPin || enteredPin.length !== 4)) {
          setPinError('Profil ini memiliki PIN keamanan. Masukkan 4 digit PIN yang terdaftar di perangkat lain.');
          return;
        }

        // Try connecting directly to cloud profile!
        setIsSyncing(true);
        try {
          const res = await connectCloudProfile(studentName, enteredPin);
          if (res.success) {
            // Cloud profile loaded! Skip to complete immediately to save student's time
            if (userNeedsNotification()) {
              Notification.requestPermission();
            }
            onComplete();
            return;
          }
        } catch (err: any) {
          setPinError(err.message || 'Gagal menyambungkan ke profil cloud. Pastikan PIN benar.');
          setIsSyncing(false);
          return;
        } finally {
          setIsSyncing(false);
        }
      }

      setStep(2);
      return;
    }

    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSyncing(true);
      const studentName = (formData.name || '').trim() || 'Mahasiswa';
      const cleanPin = (formData.pin || '').trim();

      const user: User = {
        name: studentName,
        target: formData.target || 'Mengatur waktu kuliah dan menjaga salat tepat waktu',
        reminderEnabled: formData.reminderEnabled || false,
        useFocusMode: formData.useFocusMode !== false,
        pin: cleanPin.length === 4 ? cleanPin : undefined,
        isOnboarded: true,
      };
      storage.setUser(user);

      // Connect or create in Firestore Cloud
      try {
        await connectCloudProfile(studentName, cleanPin);
      } catch (err) {
        console.warn('Initial cloud profile setup failed (can retry in settings):', err);
      }

      // Request notification permission if enabled
      if (user.reminderEnabled && 'Notification' in window) {
        Notification.requestPermission();
      }

      setIsSyncing(false);
      onComplete();
    }
  };

  const userNeedsNotification = () => {
    return 'Notification' in window && Notification.permission !== 'granted';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-950/5 border border-gray-100 dark:border-gray-700">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/80 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10">
            <Clock className="w-8 h-8" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-1">
          WaktuIbadah
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
          Satu Akun Nama untuk Semua Perangkat (Multi-Device Sync)
        </p>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Nama Mahasiswa
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Contoh: Ahmad Fauzi"
                  autoFocus
                />
                {checkingCloud && (
                  <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin absolute right-3.5 top-3.5" />
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Gunakan nama yang sama di HP atau Laptop lain untuk membuka data yang sama otomatis.
              </p>
            </div>

            {/* Cloud Profile Detected Notification */}
            {cloudProfile?.exists && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200 font-bold">
                  <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Profil Cloud Ditemukan!</span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed">
                  {cloudProfile.hasPin 
                    ? 'Akun ini dilindungi PIN 4 digit. Masukkan PIN Anda di bawah untuk langsung menyinkronkan seluruh jadwal, tugas & ibadah.' 
                    : 'Akun ini ditemukan di cloud. Klik "Buka Data Saya" untuk langsung tersambung.'}
                </p>
              </div>
            )}

            {/* 4-Digit PIN Security Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  PIN Keamanan 4 Digit {cloudProfile?.hasPin ? '(Wajib)' : '(Opsional)'}
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Anti Bentrok Nama
                </span>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input 
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={formData.pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setFormData({ ...formData, pin: val });
                    setPinError('');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold tracking-widest text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  placeholder="Misal: 1234"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Menjaga data Anda tetap aman jika ada mahasiswa lain yang kebetulan memiliki nama sama.
              </p>
            </div>

            {pinError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Target Utama Penggunaan Aplikasi
              </label>
              <textarea 
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all min-h-[110px]"
                placeholder="Misal: Mengatur jadwal praktikum dan kuliah agar tidak terlambat sholat fardhu."
                autoFocus
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pengingat Waktu Salat & Azan</h3>
                <p className="text-xs text-gray-400">Alarm suara azan lokal dan getaran haptic saat masuk waktu</p>
              </div>
              <input 
                type="checkbox" 
                checked={formData.reminderEnabled}
                onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sinkronisasi Cloud Otomatis</h3>
                <p className="text-xs text-gray-400">Simpan jadwal kuliah, checklist salat, dan tilawah ke cloud</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Aktif
              </span>
            </div>
          </div>
        )}

        <button 
          onClick={handleNext}
          disabled={(step === 1 && !formData.name?.trim()) || isSyncing}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isSyncing ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Menghubungkan ke Cloud...
            </span>
          ) : cloudProfile?.exists && step === 1 ? (
            <span className="flex items-center gap-2">
              Buka Data Saya di Perangkat Ini <ArrowRight className="w-4 h-4" />
            </span>
          ) : step < 3 ? (
            <span className="flex items-center gap-2">
              Lanjut <ArrowRight className="w-4 h-4" />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Mulai Gunakan WaktuIbadah <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
        
        <div className="flex justify-center gap-2 mt-6">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-emerald-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}
