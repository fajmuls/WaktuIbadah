import React, { useState, useEffect } from 'react';
import { storage, CURRENT_VERSION } from '../lib/storage';
import { User, AppVersion, ReminderSettings, APP_PATCH_NOTES } from '../types';
import { 
  User as UserIcon, Bell, Trash2, Info, ChevronRight, Check, 
  Clock, Vibrate, Volume2, Sparkles, Shield, Moon, CheckCircle2,
  Calendar, BookOpen, AlertTriangle, Lock, Play, Cloud, KeyRound,
  ShieldCheck, RefreshCw, Smartphone, Laptop, ArrowRightLeft, Send,
  Music, CheckSquare, Layers, HelpCircle, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  playAlarmSound, playPrayerAzan, stopAlarmSound, vibratePrayerAlarm,
  playButtonTapSound, playToggleSound, playSaveSuccessSound, playDhikrTapSound,
  playTaskStateSound, toggleAmbientLoop, isAmbientPlaying, stopAmbientLoop
} from '../lib/audio';
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
  const [isAmbientOn, setIsAmbientOn] = useState(false);
  const [showPatchNotesModal, setShowPatchNotesModal] = useState(false);
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
    setVersion(storage.getVersion());
    setIsAmbientOn(isAmbientPlaying());
  }, []);

  const handleToggleMasterReminder = () => {
    if (user) {
      playToggleSound();
      const updated = { ...user, reminderEnabled: !user.reminderEnabled };
      storage.setUser(updated);
      setUser(updated);
      
      if (updated.reminderEnabled && 'Notification' in window) {
        Notification.requestPermission();
      }
    }
  };

  const updateReminderSetting = <K extends keyof ReminderSettings>(key: K, value: ReminderSettings[K]) => {
    playToggleSound();
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

  const handleToggleAmbient = () => {
    const nowPlaying = toggleAmbientLoop(0.45);
    setIsAmbientOn(nowPlaying);
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
        playSaveSuccessSound();
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
        playSaveSuccessSound();
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
      playSaveSuccessSound();
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
        playSaveSuccessSound();
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
    <div className="space-y-6 pb-24 animate-in fade-in duration-300 max-w-3xl mx-auto">
      
      {/* Memphis Header */}
      <div className="p-4 bg-[#FFE600] border-[2.5px] border-[#121212] rounded-2xl shadow-[4px_4px_0px_#121212] flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#121212]">
              Pengaturan & Sinkronisasi
            </h1>
            <span className="memphis-badge bg-black text-[#FFE600]">
              v{CURRENT_VERSION}
            </span>
          </div>
          <p className="text-xs font-bold text-[#121212]/80 mt-0.5">
            Manajemen multi-device, style Memphis Classic, audio pack asli & notifikasi latar
          </p>
        </div>

        <button
          onClick={() => setShowPatchNotesModal(true)}
          className="memphis-btn memphis-btn-white px-3 py-1.5 text-xs font-black uppercase tracking-wider gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-[#FF4B91]" />
          Catatan Versi v2.0.0
        </button>
      </div>

      {syncMessage && (
        <div className={`p-4 rounded-xl border-[2.5px] border-[#121212] shadow-[3px_3px_0px_#121212] text-xs font-bold flex items-center gap-2.5 ${
          syncMessage.type === 'success' 
            ? 'bg-[#10B981] text-white'
            : syncMessage.type === 'error'
            ? 'bg-[#FF4B91] text-white'
            : 'bg-[#00F0FF] text-[#121212]'
        }`}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Profil & Multi-Device Sync Card */}
      <div className="memphis-card p-5 space-y-5">
        <div className="flex items-center justify-between border-b-[2.5px] border-[#121212] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#00F0FF] border-2 border-[#121212] shadow-[2px_2px_0px_#121212] rounded-xl flex items-center justify-center font-black">
              <UserIcon className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base uppercase tracking-tight">{user.name}</h3>
                {user.pin ? (
                  <span className="memphis-badge bg-[#10B981] text-white text-[9px] py-0.5">
                    <Lock className="w-2.5 h-2.5 mr-1" /> Terproteksi PIN
                  </span>
                ) : (
                  <span className="memphis-badge bg-[#FFE600] text-[#121212] text-[9px] py-0.5">
                    Nama Terbuka
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-gray-500">
                Gunakan nama yang sama di HP/Laptop untuk membuka database yang sama
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPinInput(user.pin || '');
                setShowPinModal(true);
              }}
              className="memphis-btn memphis-btn-white px-3 py-1.5 text-xs font-black uppercase tracking-wider gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {user.pin ? 'Ubah PIN' : 'Pasang PIN'}
            </button>
            <button
              onClick={() => setShowSwitchModal(true)}
              className="memphis-btn memphis-btn-yellow px-3 py-1.5 text-xs font-black uppercase tracking-wider gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Ganti Akun
            </button>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="p-4 bg-[#FFFDF8] border-2 border-[#121212] rounded-xl shadow-[3px_3px_0px_#121212] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-[#10B981] stroke-[2.5]" />
              <span className="font-black text-sm uppercase tracking-wide">Sinkronisasi Firestore Cloud</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500">
              {user.lastCloudSync ? `Terakhir: ${new Date(user.lastCloudSync).toLocaleTimeString('id-ID')}` : 'Belum pernah sync'}
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-600">
            Semua data (jadwal kuliah, tugas countdown, salat fardhu & sunnah, tilawah Qur'an, target khatam) tersimpan aman di Firestore cloud.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handlePushToCloud}
              disabled={isSyncingToCloud}
              className="memphis-btn memphis-btn-primary py-2.5 px-4 text-xs font-black uppercase tracking-wider gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingToCloud ? 'animate-spin' : ''}`} />
              {isSyncingToCloud ? 'Mengunggah Data...' : 'Unggah Data ke Cloud'}
            </button>

            <button
              onClick={handlePullFromCloud}
              disabled={isPullingCloud}
              className="memphis-btn memphis-btn-cyan py-2.5 px-4 text-xs font-black uppercase tracking-wider gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isPullingCloud ? 'animate-spin' : ''}`} />
              {isPullingCloud ? 'Menyinkronkan...' : 'Tarik Data dari Cloud'}
            </button>
          </div>
        </div>
      </div>

      {/* Audio Pack & Sound Effects Testing Rack (New Feature Requested by User) */}
      <div className="memphis-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b-[2.5px] border-[#121212] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFE600] border-2 border-[#121212] shadow-[2px_2px_0px_#121212] rounded-xl flex items-center justify-center font-black">
              <Volume2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight">Audio Pack & Sound Effects Asli</h3>
              <p className="text-xs font-bold text-gray-500">26 Audio Lokal dari Pack WaktuIbadah diaktifkan</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAmbient}
              className={`memphis-btn px-3 py-1.5 text-xs font-black uppercase tracking-wider gap-1.5 ${
                isAmbientOn ? 'memphis-btn-pink' : 'memphis-btn-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              {isAmbientOn ? 'Musik Ambient: ON' : 'Putar Musik Ambient'}
            </button>
          </div>
        </div>

        <p className="text-xs font-semibold text-gray-600">
          Uji langsung kualitas audio lokal yang terpasang pada tombol aplikasi, adzan, dzikir, dan pengingat:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => playButtonTapSound()}
            className="memphis-btn memphis-btn-yellow py-2 text-xs font-black uppercase"
          >
            Button Tap
          </button>
          <button
            onClick={() => playToggleSound()}
            className="memphis-btn memphis-btn-cyan py-2 text-xs font-black uppercase"
          >
            UI Toggle
          </button>
          <button
            onClick={() => playSaveSuccessSound()}
            className="memphis-btn memphis-btn-primary py-2 text-xs font-black uppercase"
          >
            Save Success
          </button>
          <button
            onClick={() => playDhikrTapSound()}
            className="memphis-btn memphis-btn-pink py-2 text-xs font-black uppercase"
          >
            Tasbih Dzikir
          </button>
          <button
            onClick={() => playTaskStateSound('completed')}
            className="memphis-btn memphis-btn-white py-2 text-xs font-black uppercase"
          >
            Tugas Selesai
          </button>
          <button
            onClick={() => playTaskStateSound('urgent')}
            className="memphis-btn memphis-btn-orange py-2 text-xs font-black uppercase"
          >
            Deadline Urgent
          </button>
          <button
            onClick={() => handleTestPrayerAzan('Subuh')}
            className="memphis-btn memphis-btn-white py-2 text-xs font-black uppercase col-span-1"
          >
            {stopAlarmFn ? 'Stop Adzan' : 'Adzan Subuh'}
          </button>
          <button
            onClick={() => handleTestPrayerAzan('Zuhur')}
            className="memphis-btn memphis-btn-yellow py-2 text-xs font-black uppercase col-span-1"
          >
            {stopAlarmFn ? 'Stop Adzan' : 'Adzan Fardhu'}
          </button>
        </div>
      </div>

      {/* PWA & Background Notifications Setup */}
      <div className="memphis-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b-[2.5px] border-[#121212] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF4B91] text-white border-2 border-[#121212] shadow-[2px_2px_0px_#121212] rounded-xl flex items-center justify-center font-black">
              <Bell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight">Notifikasi PWA Latar Belakang</h3>
              <p className="text-xs font-bold text-gray-500">Service Worker & Push Alerts saat Chrome/browser ditutup</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={user.reminderEnabled}
              onChange={handleToggleMasterReminder}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-black after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981] border-2 border-black"></div>
          </label>
        </div>

        <p className="text-xs font-semibold text-gray-600">
          Notifikasi Service Worker WaktuIbadah menggunakan Web Notifications API resmi dengan aksi langsung buka aplikasi dan getaran taktil HP.
        </p>

        {/* Test Background Notification Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={async () => {
              playButtonTapSound();
              const perm = await requestNotificationPermission();
              if (perm === 'granted') {
                showPWANotification('🕌 Waktu Salat Tiba (Uji PWA)', {
                  body: 'Pengingat latar belakang aktif! Suara adzan dan countdown jadwal siap berbunyi.',
                  tag: 'test-pwa-alert',
                  vibrate: [500, 200, 500]
                });
                setSyncMessage({
                  text: 'Notifikasi uji PWA dikirim ke perangkat Anda! Periksa bilah status notifikasi HP/laptop.',
                  type: 'success'
                });
              } else {
                setSyncMessage({
                  text: 'Izin notifikasi belum diberikan di browser. Mohon izinkan notifikasi pada pop-up browser.',
                  type: 'error'
                });
              }
            }}
            className="memphis-btn memphis-btn-yellow py-2.5 px-4 text-xs font-black uppercase tracking-wider gap-2"
          >
            <Bell className="w-4 h-4 stroke-[2.5]" />
            Kirim Uji Notifikasi Latar (PWA)
          </button>

          <button
            onClick={handleTestAlarm}
            className="memphis-btn memphis-btn-cyan py-2.5 px-4 text-xs font-black uppercase tracking-wider gap-2"
          >
            <Vibrate className="w-4 h-4 stroke-[2.5]" />
            {stopAlarmFn ? 'Hentikan Alarm HP' : 'Uji Pola Getar & Nada HP'}
          </button>
        </div>
      </div>

      {/* Version & Admin Dashboard Link */}
      <div className="memphis-card-yellow p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-[#FFE600] rounded-xl flex items-center justify-center font-black">
              <Info className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tight text-[#121212]">
                Versi Aplikasi: v{CURRENT_VERSION}
              </h3>
              <p className="text-xs font-bold text-[#121212]/80">
                WaktuIbadah Memphis Release • Update Berkala Otomatis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPatchNotesModal(true)}
              className="memphis-btn memphis-btn-white px-3 py-1.5 text-xs font-black uppercase tracking-wider"
            >
              Lihat Patch Notes
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="memphis-btn bg-black text-white hover:bg-black/90 px-3 py-1.5 text-xs font-black uppercase tracking-wider"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="memphis-card p-5 border-rose-500 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 text-rose-700 border-2 border-black rounded-xl flex items-center justify-center font-black">
            <Trash2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight text-rose-700">Zona Hati-Hati</h3>
            <p className="text-xs font-bold text-gray-500">Bersihkan cache lokal pada peramban ini</p>
          </div>
        </div>

        <button
          onClick={handleClearData}
          className="memphis-btn bg-rose-600 text-white hover:bg-rose-700 py-2.5 px-4 text-xs font-black uppercase tracking-wider gap-2"
        >
          <Trash2 className="w-4 h-4 stroke-[2.5]" />
          Reset & Hapus Seluruh Data Lokal
        </button>
      </div>

      {/* ==================== MODAL ATUR / UBAH PIN ==================== */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="memphis-card bg-white w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFE600] border-2 border-[#121212] flex items-center justify-center font-black">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight">
                    {user.pin ? 'Ubah PIN Keamanan' : 'Atur PIN 4 Digit'}
                  </h3>
                  <p className="text-[11px] font-bold text-gray-500">Proteksi akun dari nama sama</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPinModal(false)}
                className="w-8 h-8 rounded-lg border-2 border-[#121212] flex items-center justify-center font-black hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
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
                  placeholder="Misal: 1234 (kosongkan = nonaktif)"
                  className="memphis-input w-full px-4 py-3 text-center text-xl font-black tracking-widest"
                />
              </div>

              {pinError && (
                <div className="p-2.5 bg-[#FF4B91] text-white border-2 border-[#121212] rounded-xl text-xs font-bold">
                  {pinError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="memphis-btn memphis-btn-white flex-1 py-2.5 text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="memphis-btn memphis-btn-primary flex-1 py-2.5 text-xs uppercase"
                >
                  Simpan PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL SAMBUNGKAN AKUN ==================== */}
      {showSwitchModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="memphis-card bg-white w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00F0FF] border-2 border-[#121212] flex items-center justify-center font-black">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight">Sambungkan Akun</h3>
                  <p className="text-[11px] font-bold text-gray-500">Buka database nama lain</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSwitchModal(false)}
                className="w-8 h-8 rounded-lg border-2 border-[#121212] flex items-center justify-center font-black hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSwitchAccount} className="space-y-3.5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
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
                  className="memphis-input w-full px-3.5 py-2.5 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1">
                  PIN 4 Digit (Jika Ada)
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
                  className="memphis-input w-full px-3.5 py-2.5 text-xs font-bold tracking-widest"
                />
              </div>

              {switchError && (
                <div className="p-2.5 bg-[#FF4B91] text-white border-2 border-[#121212] rounded-xl text-xs font-bold">
                  {switchError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(false)}
                  className="memphis-btn memphis-btn-white flex-1 py-2.5 text-xs uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSwitching}
                  className="memphis-btn memphis-btn-primary flex-1 py-2.5 text-xs uppercase disabled:opacity-50"
                >
                  {isSwitching ? 'Menyambungkan...' : 'Buka Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL PATCH NOTES / CHANGELOG ==================== */}
      {showPatchNotesModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="memphis-card bg-white w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-[2.5px] border-[#121212] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFE600] border-2 border-[#121212] rounded-xl flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5 text-[#121212]" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight">
                    Catatan Rilis v{APP_PATCH_NOTES[0].version}
                  </h3>
                  <p className="text-xs font-bold text-gray-500">{APP_PATCH_NOTES[0].releaseDate}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPatchNotesModal(false)}
                className="w-8 h-8 rounded-lg border-2 border-[#121212] flex items-center justify-center font-black hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Highlights */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#121212] flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#10B981]" /> Sorotan Pembaruan:
              </h4>
              <ul className="space-y-1.5 text-xs font-semibold text-gray-700 pl-2">
                {APP_PATCH_NOTES[0].highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Audio Pack Details */}
            <div className="p-3.5 bg-[#00F0FF]/20 border-2 border-[#121212] rounded-xl space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#121212] flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" /> Integrasi Audio Pack Lokal:
              </h4>
              <ul className="space-y-1 text-xs font-semibold text-gray-800 pl-2">
                {APP_PATCH_NOTES[0].soundPackUpdates.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#FF4B91] font-black">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggestions & Recommendations for Next Update */}
            <div className="p-3.5 bg-[#FFE600]/30 border-2 border-[#121212] rounded-xl space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#121212] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF6B35]" /> Saran Pembaruan & Temuan Berguna Berikutnya:
              </h4>
              <ul className="space-y-1 text-xs font-semibold text-gray-800 pl-2">
                {APP_PATCH_NOTES[0].recommendations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-black font-black">★</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowPatchNotesModal(false)}
              className="memphis-btn memphis-btn-primary w-full py-2.5 text-xs font-black uppercase tracking-wider"
            >
              Tutup Catatan
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          WaktuIbadah v{CURRENT_VERSION} • Memphis Edition • PWA Offline Ready
        </p>
      </div>

    </div>
  );
}
