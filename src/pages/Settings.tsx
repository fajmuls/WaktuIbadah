import React, { useState, useEffect } from 'react';
import { storage, CURRENT_VERSION } from '../lib/storage';
import { User, AppVersion, ReminderSettings } from '../types';
import { 
  User as UserIcon, Bell, Trash2, Info, ChevronRight, Check, 
  Clock, Vibrate, Volume2, Sparkles, Shield, Moon, CheckCircle2,
  Calendar, BookOpen, AlertTriangle, Lock, Play
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { playAlarmSound, playPrayerAzan, stopAlarmSound, vibratePrayerAlarm } from '../lib/audio';
import { showPWANotification, requestNotificationPermission } from '../lib/pwa-service';

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [version, setVersion] = useState<AppVersion | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(storage.getReminderSettings());
  const [stopAlarmFn, setStopAlarmFn] = useState<(() => void) | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadedUser = storage.getUser();
    setUser(loadedUser);
    if (loadedUser) setNameInput(loadedUser.name);
    
    // Refresh version
    setVersion(storage.getVersion());
  }, []);

  const handleSaveName = () => {
    if (user && nameInput.trim()) {
      const updated = { ...user, name: nameInput.trim() };
      storage.setUser(updated);
      setUser(updated);
      setIsEditingName(false);
    }
  };

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
        // Just haptic test
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

  if (!user) return null;

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300 max-w-2xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Pengaturan Aplikasi
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
          Atur profil, sistem pengingat salat & getaran, serta info versi aplikasi
        </p>
      </div>

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

        {/* Info Versi Aplikasi Terupdate */}
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

          {/* Changelog Card for Version 1.9.0 */}
          <div className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs space-y-2 text-gray-600 dark:text-gray-300">
            <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Catatan Pembaruan v{CURRENT_VERSION}:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-500 dark:text-gray-400 pl-1">
              <li><strong>Checklist Salat Sunnah (Dhuha, Tahajud, Witir)</strong>: Penambahan kartu salat sunnah terpisah di halaman Ibadah sebelum tilawah Al-Qur'an lengkap dengan panduan waktu afdhol dan respons haptic getar.</li>
              <li><strong>Kejelasan Deadline Tugas & Countdown Real-Time</strong>: Peningkatan visual batas waktu tugas kuliah di Jadwal, Tugas, dan Dashboard dengan indikator sisa hari ("Hari Ini", "Besok", "X Hari Lagi", atau "Terlambat"), prioritas urgensi, dan jam batas pengumpulan.</li>
              <li><strong>Perbaikan Total Bug Suara Azan (MP3 Lokal & Uji Langsung)</strong>: Integrasi file audio azan asli MP3 berkualitas tinggi yang tersimpan lokal di aplikasi untuk Subuh & Fardhu sehingga pengujian suara azan langsung berbunyi jernih tanpa kendala unduhan.</li>
              <li><strong>Penguncian Permanen Identitas Akun Mahasiswa</strong>: Nama pengguna yang dimasukkan saat awal kini terkunci permanen untuk menjaga keaslian data evaluasi dan ulasan proyek PAI.</li>
              <li><strong>Penyempurnaan Banner Evaluasi Rating</strong>: Banner review evaluasi kini otomatis hilang permanen seketika setelah rating bintang diisi, tanpa muncul berulang di bagian atas dashboard.</li>
            </ul>
          </div>

          {/* Saran Pembaruan & Fitur Bermanfaat Berikutnya */}
          <div className="mt-3 p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-xs space-y-1.5">
            <p className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Saran Update Bermanfaat untuk Rilis Berikutnya:
            </p>
            <ul className="space-y-1 text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
              <li>• <strong>Backup & Restore Data Lokal (Export/Import File JSON)</strong>: Memungkinkan mahasiswa memindahkan riwayat ibadah, checklist salat sunnah, dan jadwal tugas antar ponsel tanpa kehilangan data.</li>
              <li>• <strong>Widget Kompas Kiblat Cepat di Halaman Depan</strong>: Kompas kiblat mini terkalibrasi langsung di kartu dashboard tanpa perlu membuka menu terpisah.</li>
              <li>• <strong>Audio Dzikir Pagi-Petang dengan Counter Getar (Al-Ma'tsurat)</strong>: Penghitung zikir digital bergetar untuk menemani perjalanan mahasiswa menuju kampus.</li>
            </ul>
          </div>
        </div>

      </div>
      
      <div className="text-center pt-2">
        <p className="text-[11px] text-gray-400">
          WaktuIbadah • Aplikasi Asisten Ibadah & Manajemen Waktu Mahasiswa Muslim
        </p>
      </div>

    </div>
  );
}
