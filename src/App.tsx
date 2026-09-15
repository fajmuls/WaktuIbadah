import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useEffect, useState, useRef } from 'react';
import { storage } from './lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import { getPrayerTimesForToday } from './lib/prayer-times';
import { format } from 'date-fns';
import { playAlarmSound } from './lib/audio';

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
import Hadis from './pages/Hadis';

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
    setIsReady(true);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Show splash for 2 seconds

    const checkAlarms = () => {
      const currentUser = storage.getUser();
      if (!currentUser?.reminderEnabled) return;
      
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');
      const today = format(now, 'yyyy-MM-dd');
      
      // Check Prayers
      const prayerTimes = getPrayerTimesForToday();
      for (const [prayer, time] of Object.entries(prayerTimes)) {
        if (time === currentHHMM && !notifiedTimes.current.has(`prayer-${prayer}-${today}`)) {
          notifiedTimes.current.add(`prayer-${prayer}-${today}`);
          if (currentUser.soundEnabled !== false) playAlarmSound();
          if (Notification.permission === 'granted') {
            new Notification(`Waktu Salat ${prayer}`, {
              body: `Saatnya menunaikan ibadah salat ${prayer}.`,
              icon: 'https://files.catbox.moe/3b6dqo.png'
            });
          }
        }
      }
      
      // Check Schedules
      const schedules = storage.getSchedules().filter(s => s.date === today);
      for (const s of schedules) {
        if (s.startTime === currentHHMM && !notifiedTimes.current.has(`schedule-${s.id}`)) {
          notifiedTimes.current.add(`schedule-${s.id}`);
          if (currentUser.soundEnabled !== false) playAlarmSound();
          if (Notification.permission === 'granted') {
            new Notification(`Jadwal: ${s.title}`, {
              body: `Aktivitas ${s.title} dimulai sekarang.`,
              icon: 'https://files.catbox.moe/3b6dqo.png'
            });
          }
        }
      }
    };

    const alarmInterval = setInterval(checkAlarms, 30000); // Check every 30s
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
                <Route path="/focus" element={<FocusMode />} />
                <Route path="/reflection" element={<Reflection />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/tips" element={<Tips />} />
                <Route path="/hadis" element={<Hadis />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            )}
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}
