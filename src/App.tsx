import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useEffect, useState, useRef } from 'react';
import { storage, CURRENT_VERSION } from './lib/storage';
import { motion, AnimatePresence } from 'motion/react';
import { getPrayerTimesForToday, getCachedPrayerData, getSunnahFastingInfo } from './lib/prayer-times';
import { format, addDays } from 'date-fns';
import { playAlarmSound, playPrayerAzan, stopAlarmSound, vibratePrayerAlarm } from './lib/audio';
import { showPWANotification } from './lib/pwa-service';
import { testFirestoreConnection, syncAllFromCloud, syncAllToCloud, subscribeToStudentProfile } from './lib/cloud-sync';

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
import Hadis from './pages/Hadis';
import DoaZikir from './pages/DoaZikir';
import Tools from './pages/Tools';
import AdminDashboard from './pages/AdminDashboard';
import Kalender from './pages/Kalender';
import Qibla from './pages/Qibla';

// Modals
import { BackgroundSyncModal } from './components/BackgroundSyncModal';
import { WebsiteReviewModal } from './components/WebsiteReviewModal';

const SplashScreen = () => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="fixed inset-0 bg-[#FFFDF8] flex flex-col items-center justify-center z-50 p-4"
  >
    {/* Geometric Memphis background accents */}
    <div className="absolute inset-0 memphis-pattern-dots opacity-20 pointer-events-none" />
    <div className="absolute top-8 left-8 w-12 h-12 rounded-full border-2 border-black bg-[#00F0FF] shadow-[2px_2px_0px_#121212]" />
    <div className="absolute bottom-10 right-10 w-10 h-10 border-2 border-black bg-[#FF4B91] rotate-12 shadow-[2px_2px_0px_#121212]" />
    <div className="absolute top-16 right-12 w-8 h-8 rounded-lg border-2 border-black bg-[#10B981] shadow-[2px_2px_0px_#121212]" />

    {/* Memphis bordered bouncing container with jumping animation */}
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ 
        scale: [0.75, 1.08, 0.94, 1.05, 1],
        opacity: 1,
        x: [0, -35, 35, -18, 18, 0],
        y: [0, -40, 16, -22, 12, 0],
        rotate: [0, -10, 10, -6, 6, 0]
      }}
      transition={{ 
        duration: 2.6, 
        ease: "easeInOut",
        times: [0, 0.25, 0.5, 0.75, 1]
      }}
      className="p-3 sm:p-4 rounded-3xl border-[3.5px] border-[#121212] bg-gradient-to-br from-emerald-400 via-teal-400 to-green-500 shadow-[6px_6px_0px_#121212] flex flex-col items-center justify-center relative"
    >
      <img 
        src="/icon-waktuibadah.png" 
        alt="WaktuIbadah Logo" 
        className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded-2xl drop-shadow-md"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://files.catbox.moe/3b6dqo.png";
        }}
      />
    </motion.div>

    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="mt-6 text-center"
    >
      <div className="inline-block bg-[#121212] text-white px-4 py-1.5 rounded-xl border-2 border-[#121212] shadow-[3px_3px_0px_#10B981] mb-2">
        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
          WaktuIbadah
        </h1>
      </div>
      <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">
        Pengingat Salat & Jadwal Terpadu
      </p>
    </motion.div>
  </motion.div>
);

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [activeAzanAlert, setActiveAzanAlert] = useState<{ prayer: string; time: string } | null>(null);
  const notifiedTimes = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Validate Firestore connection on boot
    testFirestoreConnection().catch(console.error);

    const user = storage.getUser();
    if (user && user.isOnboarded) {
      setHasOnboarded(true);

      // Multi-device sync: pull latest data on boot and listen to cloud updates
      if (user.name) {
        syncAllFromCloud(user.name).catch(console.error);
        const unsub = subscribeToStudentProfile(user.name);
        // Clean up on unmount
        if (unsub) {
          window.addEventListener('beforeunload', () => unsub());
        }
      }
    }
    
    // Auto update version in storage if app code is newer
    const currentStorageVersion = storage.getVersion();
    if (currentStorageVersion.version !== CURRENT_VERSION) {
       storage.updateVersion();
    }
    
    setIsReady(true);

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2600);

    // Auto-sync local state changes to Firestore Cloud
    const handleAutoCloudSync = () => {
      const u = storage.getUser();
      if (u?.name) {
        syncAllToCloud().catch(console.error);
      }
    };
    window.addEventListener('wi_auto_cloud_sync', handleAutoCloudSync);

    // Check if user has completed all 5 prayers today
    const checkFivePrayersReview = () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const prayerLog = storage.getPrayerLog(today);
      const isAllDone = Object.values(prayerLog.prayers).every(Boolean);
      const hasReviewed = localStorage.getItem('wi_five_prayers_reviewed') === 'true';
      const reviewConfig = storage.getAdminReviewConfig();
      if (isAllDone && !hasReviewed && reviewConfig.isEnabled) {
        setIsReviewOpen(true);
      }
    };
    
    // Check review prompt shortly after app loads
    const reviewTimer = setTimeout(checkFivePrayersReview, 2500);

    const handleReviewTrigger = () => {
      checkFivePrayersReview();
    };
    window.addEventListener('wi_check_five_prayers_review', handleReviewTrigger);

    const checkAlarms = () => {
      const currentUser = storage.getUser();
      if (!currentUser?.reminderEnabled) return;

      const reminderSettings = storage.getReminderSettings();
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');
      const today = format(now, 'yyyy-MM-dd');
      
      const cached = getCachedPrayerData();
      const times = cached?.times || getPrayerTimesForToday();

      // Trigger Helper: sound and vibration with custom Azan URLs
      const triggerAlarmEffect = (prayerName?: string) => {
        if (reminderSettings.reminderType !== 'sound_only') {
          vibratePrayerAlarm();
        }
        if (currentUser.soundEnabled !== false && reminderSettings.reminderType !== 'vibrate_only') {
          if (prayerName) {
            playPrayerAzan(prayerName, reminderSettings.reminderType);
          } else {
            playAlarmSound(reminderSettings.alarmTone, reminderSettings.reminderType);
          }
        }
      };

      // 1. Check Prayers (Subuh, Zuhur, Asar, Magrib, Isya)
      if (reminderSettings.reminderPrayers !== false) {
        const prayerList = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'] as const;
        for (const prayer of prayerList) {
          const prayerTime = times[prayer];
          if (prayerTime === currentHHMM && !notifiedTimes.current.has(`prayer-${prayer}-${today}`)) {
            notifiedTimes.current.add(`prayer-${prayer}-${today}`);
            setActiveAzanAlert({ prayer, time: prayerTime });
            triggerAlarmEffect(prayer);
            showPWANotification(`Waktu Salat ${prayer} Tiba`, {
              body: `Allahu Akbar! Saatnya menunaikan ibadah salat ${prayer}.`,
              tag: `prayer-${prayer}-${today}`,
            });
          }
        }
      }

      // 2. Check Imsak Reminder
      if (reminderSettings.reminderImsak && times['Imsak']) {
        if (times['Imsak'] === currentHHMM && !notifiedTimes.current.has(`imsak-${today}`)) {
          notifiedTimes.current.add(`imsak-${today}`);
          triggerAlarmEffect();
          showPWANotification(`Waktu Imsak Telah Tiba`, {
            body: `Waktu Imsak (${times['Imsak']}). Segera selesaikan santap sahur sebelum adzan Subuh.`,
            tag: `imsak-${today}`,
          });
        }
      }

      // 3. Check Sunnah Fasting Reminder (every night at 20:00 / 8 PM)
      if (reminderSettings.reminderPuasa && currentHHMM === '20:00' && !notifiedTimes.current.has(`puasa-${today}`)) {
        notifiedTimes.current.add(`puasa-${today}`);
        const fastingInfo = getSunnahFastingInfo(cached?.hijri?.day || "1", now);
        if (fastingInfo && fastingInfo.isPuasaTomorrow) {
          showPWANotification(`Pengingat Puasa Sunnah`, {
            body: `${fastingInfo.name}. ${fastingInfo.desc}`,
            tag: `puasa-${today}`,
          });
        }
      }

      // 4. Check Schedules
      if (reminderSettings.reminderSchedule !== false) {
        const schedules = storage.getSchedules().filter(s => s.date === today);
        for (const s of schedules) {
          if (s.startTime === currentHHMM && !notifiedTimes.current.has(`schedule-${s.id}`)) {
            notifiedTimes.current.add(`schedule-${s.id}`);
            triggerAlarmEffect();
            showPWANotification(`Jadwal: ${s.title}`, {
              body: `Aktivitas ${s.title} dimulai sekarang.`,
              tag: `schedule-${s.id}`,
            });
          }
        }
      }
    };

    const alarmInterval = setInterval(checkAlarms, 25000); // Check every 25s
    
    // Check immediately when user switches tabs or wakes device from lock screen
    const handleVisibilityWake = () => {
      if (document.visibilityState === 'visible') {
        checkAlarms();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityWake);
    window.addEventListener('focus', handleVisibilityWake);

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    return () => {
      clearTimeout(timer);
      clearInterval(alarmInterval);
      window.removeEventListener('wi_auto_cloud_sync', handleAutoCloudSync);
      document.removeEventListener('visibilitychange', handleVisibilityWake);
      window.removeEventListener('focus', handleVisibilityWake);
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
                <Route path="/quran" element={<QuranHadis />} />
                <Route path="/quran-hadis" element={<QuranHadis />} />
                <Route path="/hadis" element={<Hadis />} />
                <Route path="/doa" element={<DoaZikir />} />
                <Route path="/tools" element={<Tools />} />
                <Route path="/focus" element={<FocusMode />} />
                <Route path="/reflection" element={<Reflection />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/tips" element={<Tips />} />
                <Route path="/kalender" element={<Kalender />} />
                <Route path="/qibla" element={<Qibla />} />
                <Route path="/admin" element={<AdminDashboard />} />
                
                {/* Fallback to Dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            )}
          </Routes>

          {/* Live In-App Azan Notification Banner (Functional even without PWA installed & Mobile Autoplay Policy Ready) */}
          {activeAzanAlert && (
            <div className="fixed top-3 left-3 right-3 sm:top-5 sm:left-auto sm:right-5 sm:max-w-md z-50 memphis-card p-3 sm:p-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 shadow-[4px_4px_0px_#121212] flex items-center justify-between gap-3 animate-bounce">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#121212] text-[#6EE7B7] flex items-center justify-center font-black text-xl border-2 border-black shrink-0">
                  🕌
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black uppercase text-[#121212] truncate">
                    Waktu Salat {activeAzanAlert.prayer} Tiba!
                  </h4>
                  <p className="text-[10px] sm:text-[11px] font-bold text-[#121212]/80 truncate">
                    Ketuk untuk pastikan suara aktif ({activeAzanAlert.time})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    const isSubuh = activeAzanAlert.prayer.toLowerCase().includes('subuh');
                    playPrayerAzan(isSubuh);
                  }}
                  className="memphis-btn bg-white hover:bg-emerald-50 text-black px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
                  title="Bunyikan Suara Azan"
                >
                  Bunyikan
                </button>
                <button
                  onClick={() => {
                    stopAlarmSound();
                    setActiveAzanAlert(null);
                  }}
                  className="memphis-btn bg-black text-white hover:bg-gray-800 px-2 py-1 text-[10px] font-black uppercase tracking-wider"
                >
                  Hening
                </button>
              </div>
            </div>
          )}

          {/* Polite Battery-Efficient Background Sync Prompt Modal */}
          <BackgroundSyncModal />

          {/* Automatic 5-Star Website Review Modal after 5 prayers */}
          <WebsiteReviewModal
            isOpen={isReviewOpen}
            onClose={() => setIsReviewOpen(false)}
          />
        </BrowserRouter>
      )}
    </>
  );
}
