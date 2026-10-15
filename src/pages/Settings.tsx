import React, { useState, useEffect } from 'react';
import { storage, CURRENT_VERSION } from '../lib/storage';
import { User, AppVersion, ReminderSettings } from '../types';
import { 
  User as UserIcon, Bell, Trash2, Info, ChevronRight, Check, 
  Clock, Vibrate, Volume2, Sparkles, Shield, Moon, CheckCircle2,
  Calendar, BookOpen, AlertTriangle, Lock, Play, Cloud, KeyRound,
  ShieldCheck, RefreshCw, Smartphone, Laptop, ArrowRightLeft, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { playAlarmSound, playPrayerAzan, stopAlarmSound, vibratePrayerAlarm } from '../lib/audio';
import { showPWANotification, requestNotificationPermission } from '../lib/pwa-service';
import { 
  syncAllToCloud, syncAllFromCloud, updateProfilePin, 
  connectCloudProfile, checkCloudProfile 
} from '../lib/cloud-sync';

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(storage.getReminderSettings());
  const [stopAlarmFn, setStopAlarmFn] = useState<(() => void) | null>(null);
  const navigate = useNavigate();

  // Cloud Sync states
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // PIN settings state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Switch account state
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [switchName, setSwitchName] = useState('');
  const [switchPin, setSwitchPin] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    const loadedUser = storage.getUser();
    setUser(loadedUser);
    if (loadedUser) setNameInput(loadedUser.name);
    
    // Refresh version
    setVersion(storage.getVersion());
  }, []);

  const handleToggleMasterReminder = () => {
    if (user) {
      const updated = { ...user, reminderEnabled: !user.reminderEnabled };
      storage.setUser(updated);
      setUser(updated);
      
      if (updated.reminderEnabled && 'Notification' in window) {
        Notification.requestPermission();
      }
    }
  };

  const updateReminderSetting = <K extends keyof ReminderSettings>(key: K, value: ReminderSettings[K]) => {
    const updated = { ...reminderSettings, [key]: value };
    setReminderSettings(updated);
    storage.setReminderSettings(updated);
  };

  const handleTestAlarm = async () => {
    if (stopAlarmFn) {
      stopAlarmFn();
      setStopAlarmFn(null);
    } else {
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      
      const canVibrate = reminderSettings.reminderType !== 'sound_only';
      const canSound = reminderSettings.reminderType !== 'vibrate_only';

      if (canVibrate) {
        vibratePrayerAlarm();
      }

      if (canSound) {
        const stop = playAlarmSound(reminderSettings.alarmTone, reminderSettings.reminderType);
        setStopAlarmFn(() => stop);
      } else {
        setTimeout(() => setStopAlarmFn(null), 1500);
      }
    }
  };

  const handleTestPrayerAzan = (prayer: 'Subuh' | 'Zuhur') => {
    if (stopAlarmFn) {
      stopAlarmFn();
      setStopAlarmFn(null);
    } else {
      const stop = playPrayerAzan(prayer, reminderSettings.reminderType);
      setStopAlarmFn(() => stop);
    }
  };

  const handleClearData = () => {
    if (confirm('PERINGATAN: Apakah kamu yakin ingin menghapus seluruh data lokal (jadwal, catatan tilawah, ayat favorit)? Tindakan ini tidak dapat dibatalkan.')) {
      storage.clearAll();
      navigate('/');
      window.location.reload();
    }
  };

  // --- Cloud Sync Operations ---
  const handlePushToCloud = async () => {
    if (!user?.name) return;
    setIsSyncingToCloud(true);
    setSyncMessage(null);
    try {
      const ok = await syncAllToCloud();
      if (ok) {
        setSyncMessage({
          text: 'Seluruh data aplikasi (jadwal, tugas, salat sunnah & fardhu, tilawah) berhasil diunggah ke cloud!',
          type: 'success'
        });
      } else {
        setSyncMessage({ text: 'Gagal mengunggah data ke cloud.', type: 'error' });
      }
    } catch (err: any) {
      setSyncMessage({ text: err.message || 'Gagal sinkronisasi ke cloud.', type: 'error' });
    } finally {
      setIsSyncingToCloud(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handlePullFromCloud = async () => {
    if (!user?.name) return;
    setIsPullingCloud(true);
    setSyncMessage(null);
    try {
      const ok = await syncAllFromCloud();
      if (ok) {
        const refreshedUser = storage.getUser();
        setUser(refreshedUser);
        setSyncMessage({
          text: 'Data terbaru dari perangkat lain berhasil disinkronkan ke perangkat ini!',
          type: 'success'
        });
      } else {
        setSyncMessage({ text: 'Tidak ada data cloud baru yang ditemukan.', type: 'info' });
      }
    } catch (err: any) {
      setSyncMessage({ text: err.message || 'Gagal menarik data cloud.', type: 'error' });
    } finally {
      setIsPullingCloud(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const cleanPin = pinInput.trim();
    if (cleanPin && !/^\d{4}$/.test(cleanPin)) {
      setPinError('PIN harus berupa 4 digit angka.');
      return;
    }

    if (!user?.name) return;

    try {
      await updateProfilePin(user.name, cleanPin);
      setUser({ ...user, pin: cleanPin });
      setShowPinModal(false);
      setPinInput('');
      setSyncMessage({
        text: cleanPin ? 'PIN 4 digit berhasil diatur! Akun Anda kini aman dari bentrok nama.' : 'PIN keamanan dinonaktifkan.',
        type: 'success'
      });
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (err: any) {
      setPinError(err.message || 'Gagal memperbarui PIN.');
    }
  };

  const handleSwitchAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwitchError('');
    const targetName = switchName.trim();
    if (!targetName) {
      setSwitchError('Masukkan nama mahasiswa akun yang ingin dibuka.');
      return;
    }

    setIsSwitching(true);
    try {
      const res = await connectCloudProfile(targetName, switchPin.trim());
      if (res.success) {
        setUser(storage.getUser());
        setShowSwitchModal(false);
        setSwitchName('');
        setSwitchPin('');
        setSyncMessage({ text: res.message, type: 'success' });
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch (err: any) {
      setSwitchError(err.message || 'Gagal menyambungkan ke akun. Periksa nama dan PIN.');
    } finally {
      setIsSwitching(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300 max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Pengaturan Aplikasi
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
          Atur sinkronisasi multi-device, profil, sistem pengingat salat & getaran HP
        </p>
      </div>

      {syncMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200 ${
          syncMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            : syncMessage.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            : 'bg-blue-50 dark:bg-blue-950/70 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{syncMessage.text}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xs overflow-hidden">
        
        {/* Profil */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-gray-400">Nama Pengguna (Terkunci)</h3>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Akun Mahasiswa Tetap
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-bold text-base text-gray-900 dark:text-white">{user.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== SINKRONISASI MULTI-DEVICE & CLOUD FIRESTORE ==================== */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    Sinkronisasi Multi-Device
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Firestore Cloud
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Buka data yang sama di berbagai device tanpa ribet login.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSwitchModal(true)}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 shrink-0"
              title="Sambungkan perangkat lain atau ganti nama akun"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ganti Akun</span>
            </button>
          </div>

          {/* Device & Security Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">PIN Keamanan 4 Digit</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {user.pin ? '•••• (Aktif - Anti Bentrok)' : 'Belum Diatur (Disarankan)'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setPinInput(user.pin || '');
                  setShowPinModal(true);
                }}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {user.pin ? 'Ubah' : 'Atur'}
              </button>
            </div>

            <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Status Koneksi Perangkat</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  HP & Laptop Terhubung
                </span>
              </div>
            </div>
          </div>

          {/* Quick Sync Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              onClick={handlePushToCloud}
              disabled={isSyncingToCloud || isPullingCloud}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSyncingToCloud ? 'animate-bounce' : ''}`} />
              <span>{isSyncingToCloud ? 'Mengunggah ke Cloud...' : 'Kirim Data ke Cloud'}</span>
            </button>

            <button
              onClick={handlePullFromCloud}
              disabled={isSyncingToCloud || isPullingCloud}
              className="py-2.5 px-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPullingCloud ? 'animate-spin' : ''}`} />
              <span>{isPullingCloud ? 'Menarik Data...' : 'Tarik Data dari Cloud'}</span>
            </button>
          </div>

          {/* Multi-Device Explainer Card */}
          <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
            <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-1">
              <Laptop className="w-3.5 h-3.5 text-emerald-600" />
              Cara Menggunakan di Perangkat Lain:
            </p>
            Di laptop atau HP lain, buka website ini dan masukkan nama yang sama persis: <strong>"{user.name}"</strong>{user.pin ? <> beserta PIN 4 digit Anda <strong>({user.pin})</strong></> : ''}. Seluruh jadwal kuliah, checklist salat sunnah & fardhu, dan tilawah Anda akan otomatis tersinkronkan!
          </div>
        </div>

        {/* Master Notifikasi Toggle */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/60 text-amber-500 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Master Pengingat</h3>
              <p className="text-xs text-gray-400">Aktifkan jadwal notifikasi salat & agenda</p>
            </div>
          </div>
          <button 
            onClick={handleToggleMasterReminder}
            className={`w-12 h-6 rounded-full transition-colors relative ${user.reminderEnabled ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-xs ${user.reminderEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Reminder Details (Only shown if reminder is enabled) */}
        {user.reminderEnabled && (
          <div className="bg-gray-50/60 dark:bg-gray-900/40 p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 space-y-4">
            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Opsi Suara & Getaran HP (Haptic)
            </h4>

            {/* Mode Pengingat Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                Tipe Sinyal Pengingat
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sound_and_vibrate', label: 'Suara & Getar', icon: Volume2 },
                  { id: 'vibrate_only', label: 'Hanya Getar', icon: Vibrate },
                  { id: 'sound_only', label: 'Hanya Suara', icon: Volume2 },
                ].map(opt => {
                  const isSelected = reminderSettings.reminderType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateReminderSetting('reminderType', opt.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'border-emerald-600 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500'
                          : 'border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-500'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      <span className="text-[11px] font-bold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alarm Tone Type Selector */}
            {reminderSettings.reminderType !== 'vibrate_only' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                  Pilihan Nada Alarm
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'azan_makkah', label: 'Azan Makkah' },
                    { id: 'chime_peaceful', label: 'Chime Damai' },
                    { id: 'beep_classic', label: 'Beep Klasik' },
                  ].map(tone => {
                    const isSelected = reminderSettings.alarmTone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => updateReminderSetting('alarmTone', tone.id as any)}
                        className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                            : 'border-gray-200 dark:border-gray-700 text-gray-500'
                        }`}
                      >
                        {tone.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Specific Reminders: Imsak & Puasa Sunnah */}
            <div className="space-y-2 pt-2 border-t border-gray-200/60 dark:border-gray-700">
              <div className="flex items-center justify-between py-1">
                <div>
                  <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200">Pengingat Waktu Imsak & Sahur</h5>
                  <p className="text-[11px] text-gray-400">Peringatan sebelum fajar tiba</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={reminderSettings.reminderImsak !== false}
                  onChange={(e) => updateReminderSetting('reminderImsak', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-1">
                <div>
                  <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200">Pengingat Puasa Sunnah</h5>
                  <p className="text-[11px] text-gray-400">Notifikasi malam sebelum Senin, Kamis & Ayyamul Bidh</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={reminderSettings.reminderPuasa !== false}
                  onChange={(e) => updateReminderSetting('reminderPuasa', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            {/* Test Alarm & Real Azan Audio Buttons */}
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  onClick={() => handleTestPrayerAzan('Subuh')}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{stopAlarmFn ? 'Hentikan Audio' : 'Uji Azan Subuh (Lokal)'}</span>
                </button>

                <button 
                  onClick={() => handleTestPrayerAzan('Zuhur')}
                  className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{stopAlarmFn ? 'Hentikan Audio' : 'Uji Azan Fardhu (Lokal)'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button 
                  onClick={handleTestAlarm}
                  className="w-full py-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2"
                >
                  <Vibrate className="w-3.5 h-3.5" />
                  <span>{stopAlarmFn ? 'Hentikan Uji Alarm' : 'Uji Getaran & Nada HP'}</span>
                </button>

                <button 
                  onClick={async () => {
                    await requestNotificationPermission();
                    showPWANotification('Uji Notifikasi PWA Latar Belakang', {
                      body: 'Notifikasi Service Worker WaktuIbadah aktif & siap memicu adzan saat layar mati/terkunci.',
                      tag: 'test-pwa-notification'
                    });
                  }}
                  className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Uji Notifikasi PWA Latar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Format Waktu */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 text-blue-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Format Tampilan Waktu</h3>
              <p className="text-xs text-gray-400">Format jam 12 Jam (AM/PM) atau 24 Jam</p>
            </div>
          </div>
          <select 
            value={user.timeFormat || '24h'}
            onChange={(e) => {
              const updated = { ...user, timeFormat: e.target.value as '12h' | '24h' };
              storage.setUser(updated);
              setUser(updated);
            }}
            className="p-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none focus:border-emerald-500"
          >
            <option value="24h">24 Jam (14:30)</option>
            <option value="12h">12 Jam (02:30 PM)</option>
          </select>
        </div>

        {/* Reset / Hapus Data */}
        <button 
          onClick={handleClearData}
          className="w-full p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950 text-red-500 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-red-600">Hapus Data & Riwayat Lokal</h3>
              <p className="text-xs text-red-400">Reset seluruh progress, jadwal, dan tilawah</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-red-300" />
        </button>

        {/* Info Versi Aplikasi Terupdate v2.0.0 */}
        <div className="p-4 sm:p-5 bg-gray-50/70 dark:bg-gray-900/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center justify-center font-bold text-xs">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Versi Aplikasi</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  WaktuIbadah v{CURRENT_VERSION}
                  <span className="text-[10px] ml-2 text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-bold">
                    Terbaru
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin')}
              className="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-2xs"
            >
              Admin Dashboard
            </button>
          </div>

          {/* Changelog Card for Version 2.0.0 */}
          <div className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs space-y-2 text-gray-600 dark:text-gray-300">
            <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Catatan Pembaruan v{CURRENT_VERSION} (Rilis Utama Multi-Device):
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400 pl-1">
              <li><strong>Sinkronisasi Multi-Device Otomatis Berbasis Nama</strong>: Anda dapat membuka database dan seluruh data ibadah serta jadwal yang sama persis di HP maupun Laptop cukup dengan menggunakan nama yang sama tanpa perlu login email/password yang rumit.</li>
              <li><strong>PIN Keamanan 4 Digit Opsional</strong>: Mencegah bentrok data jika ada mahasiswa lain yang kebetulan memiliki nama yang persis sama di perangkat berbeda.</li>
              <li><strong>Sinkronisasi Seluruh Data Aplikasi (All Data Sync)</strong>: Seluruh jadwal kuliah & agenda, tugas & countdown deadline, riwayat salat 5 waktu & salat sunnah (Dhuha, Tahajud, Witir), tilawah Qur'an, dan target khatam tersinkronkan penuh ke Firestore cloud.</li>
              <li><strong>Database Ulasan Terpusat untuk Admin</strong>: Penilaian bintang dan ulasan kini otomatis masuk ke database Firestore sehingga admin dapat memantau respons dari berbagai mahasiswa dengan nama berbeda di dashboard secara real-time.</li>
            </ul>
          </div>

          {/* Saran Pembaruan & Fitur Bermanfaat Berikutnya */}
          <div className="mt-3 p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-xs space-y-1.5">
            <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Saran Update Bermanfaat & Temuan Pengembangan Berikutnya:
            </p>
            <ul className="space-y-1 text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
              <li>• <strong>Offline Sync Queue (Background Auto-Retry)</strong>: Penyimpanan antrian offline yang otomatis mengirimkan perubahan ke Firestore begitu perangkat kembali terhubung internet.</li>
              <li>• <strong>Indikator Banner Konflik Jadwal vs Waktu Azan Cloud-Aware</strong>: Jika ada perubahan jadwal kuliah mendadak di laptop, alarm azan di HP otomatis menyesuaikan tanpa perlu membuka aplikasi ulang.</li>
              <li>• <strong>Ekspor Rekap Evaluasi & Laporan Ibadah PDF Siap Cetak</strong>: Pembuatan dokumen rekapitulasi penilaian dan capaian ibadah mahasiswa dalam format PDF resmi untuk tugas proyek PAI.</li>
            </ul>
          </div>
        </div>

      </div>
      
      {/* ==================== MODAL ATUR / UBAH PIN ==================== */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-emerald-100 dark:border-emerald-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  {user.pin ? 'Ubah PIN Keamanan' : 'Atur PIN 4 Digit'}
                </h3>
                <p className="text-xs text-gray-400">Proteksi akun dari nama mahasiswa yang sama</p>
              </div>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  PIN 4 Digit (Angka)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setPinError('');
                  }}
                  placeholder="Misal: 1234 (atau kosongkan untuk nonaktif)"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-center text-lg font-bold tracking-widest text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-center">
                  Kosongkan jika ingin menonaktifkan proteksi PIN.
                </p>
              </div>

              {pinError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                  {pinError}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Simpan PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL GANTI / SAMBUNGKAN AKUN ==================== */}
      {showSwitchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-emerald-100 dark:border-emerald-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">
                  Sambungkan Akun Mahasiswa
                </h3>
                <p className="text-xs text-gray-400">Buka database akun dari perangkat lain</p>
              </div>
            </div>

            <form onSubmit={handleSwitchAccount} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nama Mahasiswa
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={switchName}
                  onChange={(e) => {
                    setSwitchName(e.target.value);
                    setSwitchError('');
                  }}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  PIN 4 Digit (Jika Diproteksi)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={switchPin}
                  onChange={(e) => {
                    setSwitchPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setSwitchError('');
                  }}
                  placeholder="Misal: 1234"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold tracking-widest text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {switchError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
                  {switchError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSwitching}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSwitching ? 'Menyambungkan...' : 'Buka Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="text-center pt-2">
        <p className="text-[11px] text-gray-400">
          WaktuIbadah • Aplikasi Asisten Ibadah & Manajemen Waktu Mahasiswa Muslim
        </p>
      </div>

    </div>
  );
}
