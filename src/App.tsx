import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useEffect, useState, useRef } from 'react';
import { storage, CURRENT_VERSION } from './lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import { getPrayerTimesForToday, getCachedPrayerData, getSunnahFastingInfo } from './lib/prayer-times';
import { format, addDays } from 'date-fns';
import { playAlarmSound, vibratePrayerAlarm } from './lib/audio';

// Pages
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Jadwal from './pages/Jadwal';
import Tugas from './pages/Tugas';
import Ibadah from './pages/Ibadah';
import Progress from './pages/Progress';
import Menu from './pages/Menu';
import FocusMode from './pages/FocusMode';
import Reflection from './pages/Reflection';
import Settings from './pages/Settings';
import Tips from './pages/Tips';
import QuranHadis from './pages/QuranHadis';
import Tools from './pages/Tools';

import Kalender from './pages/Kalender';
import Qibla from './pages/Qibla';

const SplashScreen = () => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="fixed inset-0 bg-primary flex flex-col items-center justify-center z-50"
  >
    <motion.img 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      src="https://files.catbox.moe/3b6dqo.png" 
      alt="WaktuIbadah Logo" 
      className="w-32 h-32 rounded-2xl shadow-2xl mb-6"
    />
    <motion.h1 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="text-white text-3xl font-bold tracking-tight"
    >
      WaktuIbadah
    </motion.h1>
  </motion.div>
);

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const notifiedTimes = useRef<Set<string>>(new Set());

  useEffect(() => {
    const user = storage.getUser();
    if (user && user.isOnboarded) {
      setHasOnboarded(true);
    }
    
    // Auto update version in storage if app code is newer
    const currentStorageVersion = storage.getVersion();
    if (currentStorageVersion.version !== CURRENT_VERSION) {
       storage.updateVersion();
    }
    
    setIsReady(true);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800);

    const checkAlarms = () => {
      const currentUser = storage.getUser();
      if (!currentUser?.reminderEnabled) return;

      const reminderSettings = storage.getReminderSettings();
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');
      const today = format(now, 'yyyy-MM-dd');
      
      const cached = getCachedPrayerData();
      const times = cached?.times || getPrayerTimesForToday();

      // Trigger Helper: sound and vibration based on user settings
      const triggerAlarmEffect = () => {
        if (reminderSettings.reminderType !== 'sound_only') {
          vibratePrayerAlarm();
        }
        if (currentUser.soundEnabled !== false && reminderSettings.reminderType !== 'vibrate_only') {
          playAlarmSound(reminderSettings.alarmTone, reminderSettings.reminderType);
        }
      };

      // 1. Check Prayers (Subuh, Zuhur, Asar, Magrib, Isya)
      if (reminderSettings.reminderPrayers !== false) {
        const prayerList = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'] as const;
        for (const prayer of prayerList) {
          const prayerTime = times[prayer];
          if (prayerTime === currentHHMM && !notifiedTimes.current.has(`prayer-${prayer}-${today}`)) {
            notifiedTimes.current.add(`prayer-${prayer}-${today}`);
            triggerAlarmEffect();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Waktu Salat ${prayer} Tiba`, {
                body: `Allahu Akbar! Saatnya menunaikan ibadah salat ${prayer}.`,
                icon: 'https://files.catbox.moe/3b6dqo.png'
              });
            }
          }
        }
      }

      // 2. Check Imsak Reminder
      if (reminderSettings.reminderImsak && times['Imsak']) {
        if (times['Imsak'] === currentHHMM && !notifiedTimes.current.has(`imsak-${today}`)) {
          notifiedTimes.current.add(`imsak-${today}`);
          triggerAlarmEffect();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Waktu Imsak Telah Tiba`, {
              body: `Waktu Imsak (${times['Imsak']}). Segera selesaikan santap sahur sebelum adzan Subuh.`,
              icon: 'https://files.catbox.moe/3b6dqo.png'
            });
          }
        }
      }

      // 3. Check Sunnah Fasting Reminder (every night at 20:00 / 8 PM)
      if (reminderSettings.reminderPuasa && currentHHMM === '20:00' && !notifiedTimes.current.has(`puasa-${today}`)) {
        notifiedTimes.current.add(`puasa-${today}`);
        const fastingInfo = getSunnahFastingInfo(cached?.hijri?.day || "1", now);
        if (fastingInfo && fastingInfo.isPuasaTomorrow) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Pengingat Puasa Sunnah`, {
              body: `${fastingInfo.name}. ${fastingInfo.desc}`,
              icon: 'https://files.catbox.moe/3b6dqo.png'
            });
          }
        }
      }

      // 4. Check Schedules
      if (reminderSettings.reminderSchedule !== false) {
        const schedules = storage.getSchedules().filter(s => s.date === today);
        for (const s of schedules) {
          if (s.startTime === currentHHMM && !notifiedTimes.current.has(`schedule-${s.id}`)) {
            notifiedTimes.current.add(`schedule-${s.id}`);
            triggerAlarmEffect();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Jadwal: ${s.title}`, {
                body: `Aktivitas ${s.title} dimulai sekarang.`,
                icon: 'https://files.catbox.moe/3b6dqo.png'
              });
            }
          }
        }
      }
    };

    const alarmInterval = setInterval(checkAlarms, 25000); // Check every 25s
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    return () => {
      clearTimeout(timer);
      clearInterval(alarmInterval);
    };
  }, []);

  if (!isReady) return null;

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>

      {!showSplash && (
        <BrowserRouter>
          <Routes>
            {!hasOnboarded ? (
              <Route path="*" element={<Onboarding onComplete={() => setHasOnboarded(true)} />} />
            ) : (
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/jadwal" element={<Jadwal />} />
                <Route path="/jadwal/baru" element={<Jadwal isNew />} />
                <Route path="/tugas" element={<Tugas />} />
                <Route path="/tugas/baru" element={<Tugas isNew />} />
                <Route path="/ibadah" element={<Ibadah />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/quran-hadis" element={<QuranHadis />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/focus" element={<FocusMode />} />
                <Route path="/reflection" element={<Reflection />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/tips" element={<Tips />} />
                <Route path="/kalender" element={<Kalender />} />
                <Route path="/qibla" element={<Qibla />} />
                
                {/* Fallback to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            )}
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}
