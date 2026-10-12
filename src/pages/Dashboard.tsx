import React, { useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import { User, Task, Schedule, PrayerName } from '../types';
import { format, differenceInMinutes, parse } from 'date-fns';
import { id } from 'date-fns/locale';
import { getPrayerStatus, fetchPrayerTimes, PrayerData, getCachedPrayerData, getSunnahFastingInfo } from '../lib/prayer-times';
import { 
  MapPin, Sun, Sunrise, Sunset, Moon, Circle, AlertCircle, Calendar, 
  RefreshCcw, Sparkles, BookOpen, ChevronRight, Compass, AlertTriangle,
  Volume2, VolumeX, Bell, ShieldCheck, Heart, Quote, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatTimeString } from '../lib/utils';
import { CitySelectorModal } from '../components/CitySelectorModal';
import { checkSchedulePrayerConflicts } from '../lib/schedule-prayer-conflict';
import { AdminReviewBanner } from '../components/AdminReviewBanner';
import { NotificationGatekeeperModal } from '../components/NotificationGatekeeperModal';
import { testAlarmTone, stopAlarmSound, vibratePrayerAlarm, vibrateSuccess } from '../lib/audio';

const DAILY_WISDOM = [
  { text: "Waktu Bagaikan Pedang. Jika kamu tidak memotongnya, maka ia yang akan memotongmu.", source: "Imam Syafi'i" },
  { text: "Dua kenikmatan yang sering dilupakan oleh kebanyakan manusia adalah kesehatan dan waktu luang.", source: "HR. Bukhari" },
  { text: "Barangsiapa yang hari ini lebih baik dari kemarin, maka ia beruntung.", source: "Ali bin Abi Thalib" },
  { text: "Jangan menunda amal hari ini untuk esok hari.", source: "Umar bin Khattab" },
  { text: "Waktu yang telah berlalu tidak akan pernah kembali lagi.", source: "Pepatah Arab" }
];

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  
  const [prayerData, setPrayerData] = useState<PrayerData | null>(getCachedPrayerData());
  const [currentPrayer, setCurrentPrayer] = useState<{ prayer: PrayerName, time: string } | null>(() => {
    const cached = getCachedPrayerData();
    return cached ? getPrayerStatus(cached.times).currentPrayer : null;
  });
  const [nextPrayer, setNextPrayer] = useState<{ prayer: PrayerName, time: string, isTomorrow: boolean } | null>(() => {
    const cached = getCachedPrayerData();
    return cached ? getPrayerStatus(cached.times).nextPrayer : null;
  });
  const [minutesToNext, setMinutesToNext] = useState<number>(() => {
    const cached = getCachedPrayerData();
    if (!cached) return 0;
    const next = getPrayerStatus(cached.times).nextPrayer;
    if (!next) return 0;
    const now = new Date();
    const nextTime = parse(next.time, 'HH:mm', new Date());
    if (next.isTomorrow) nextTime.setDate(nextTime.getDate() + 1);
    return differenceInMinutes(nextTime, now);
  });
  
  const [prayerLogs, setPrayerLogs] = useState(storage.getPrayerLog(format(new Date(), 'yyyy-MM-dd')));
  const [wisdomOfTheDay, setWisdomOfTheDay] = useState(DAILY_WISDOM[0]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [todayQuranLogs, setTodayQuranLogs] = useState(storage.getQuranLogsByDate(format(new Date(), 'yyyy-MM-dd')));
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [isGatekeeperOpen, setIsGatekeeperOpen] = useState(false);
  const [dailyHadith, setDailyHadith] = useState<any>(null);

  useEffect(() => {
    const loadedUser = storage.getUser();
    setUser(loadedUser);
    setTodayQuranLogs(storage.getQuranLogsByDate(format(new Date(), 'yyyy-MM-dd')));

    // Fetch Daily Hadits from MyQuran API
    fetch('https://api.myquran.com/v2/hadits/arbain/semua')
      .then(r => r.json())
      .then(json => {
        if (json.status && Array.isArray(json.data) && json.data.length > 0) {
          const dayIdx = new Date().getDate() % json.data.length;
          setDailyHadith(json.data[dayIdx]);
        }
      })
      .catch(console.warn);
    
    // Daily wisdom based on day of year
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    setWisdomOfTheDay(DAILY_WISDOM[dayOfYear % DAILY_WISDOM.length]);

    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Load tasks
    const allTasks = storage.getTasks();
    const activeTasks = allTasks.filter(t => t.status !== 'Selesai' && t.deadline <= today);
    activeTasks.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    setTasks(activeTasks.slice(0, 3)); 

    // Load schedules
    const allSchedules = storage.getSchedules();
    const todaySchedules = allSchedules.filter(s => s.date === today);
    todaySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
    setSchedules(todaySchedules.slice(0, 3)); 

    loadPrayerData(loadedUser);

    const interval = setInterval(() => {
      if (prayerData) {
        updateNextPrayer(prayerData);
      }
    }, 60000); 

    return () => clearInterval(interval);
  }, []);

  const loadPrayerData = async (currentUser: User | null) => {
    let lat = -6.2088; // Default Jakarta
    let lng = 106.8456;

    if (currentUser?.location) {
      lat = currentUser.location.latitude;
      lng = currentUser.location.longitude;
      const data = await fetchPrayerTimes(lat, lng);
      setPrayerData(data);
      updateNextPrayer(data);
    } else {
      // Prompt user to enable location
      if (navigator.geolocation && !isFetchingLocation) {
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const newLat = position.coords.latitude;
            const newLng = position.coords.longitude;
            const currentUserState = currentUser || storage.getUser() || { name: 'User' };
            const updatedUser = { ...currentUserState, location: { latitude: newLat, longitude: newLng } };
            storage.setUser(updatedUser as User);
            setUser(updatedUser as User);
            
            const data = await fetchPrayerTimes(newLat, newLng, true);
            setPrayerData(data);
            updateNextPrayer(data);
            setIsFetchingLocation(false);
          },
          async (error) => {
            console.warn("Location prompt rejected or failed, falling back to Jakarta");
            setIsFetchingLocation(false);
            const data = await fetchPrayerTimes(lat, lng);
            setPrayerData(data);
            updateNextPrayer(data);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else {
        const data = await fetchPrayerTimes(lat, lng);
        setPrayerData(data);
        updateNextPrayer(data);
      }
    }
  };

  const updateNextPrayer = (data: PrayerData) => {
    const { currentPrayer, nextPrayer } = getPrayerStatus(data.times);
    setCurrentPrayer(currentPrayer);
    setNextPrayer(nextPrayer);
    
    if (nextPrayer) {
      const now = new Date();
      const nextTime = parse(nextPrayer.time, 'HH:mm', new Date());
      if (nextPrayer.isTomorrow) nextTime.setDate(nextTime.getDate() + 1);
      
      setMinutesToNext(differenceInMinutes(nextTime, now));
    }
  };

  const handleRefreshLocation = () => {
    if (navigator.geolocation) {
      setIsFetchingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const currentUserState = user || storage.getUser() || { name: 'User' };
          const updatedUser = { ...currentUserState, location: { latitude: lat, longitude: lng } };
          storage.setUser(updatedUser as User);
          setUser(updatedUser as User);
          
          const data = await fetchPrayerTimes(lat, lng, true); // force refresh bypass cache
          setPrayerData(data);
          updateNextPrayer(data);
          setIsFetchingLocation(false);
        },
        (error) => {
          console.error(error);
          setIsFetchingLocation(false);
          if (error.code === 1) {
            alert("Izin lokasi ditolak. Jika Anda melihat ini di dalam AI Studio, pratinjau mungkin memblokir akses lokasi. Silakan klik ikon 'Open in new tab' di pojok kanan atas pratinjau lalu coba lagi.");
          } else {
            alert("Gagal mendapatkan lokasi. Pastikan GPS perangkat Anda aktif dan jaringan stabil.");
          }
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
      );
    } else {
      alert("Peramban Anda tidak mendukung pelacakan lokasi.");
    }
  };

  const prayerIcons = {
    Subuh: <Sunrise className="w-5 h-5" />,
    Zuhur: <Sun className="w-5 h-5 text-amber-300" />,
    Asar: <Sun className="w-5 h-5 opacity-70" />,
    Magrib: <Sunset className="w-5 h-5 text-orange-300" />,
    Isya: <Moon className="w-5 h-5" />
  };

  const prayersList: PrayerName[] = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'];

  const handleTestLoudAzan = () => {
    if (isTestingSound) {
      stopAlarmSound();
      setIsTestingSound(false);
    } else {
      setIsTestingSound(true);
      vibratePrayerAlarm();
      testAlarmTone('azan_makkah', 'sound_and_vibrate', 7000);
      setTimeout(() => {
        setIsTestingSound(false);
      }, 7000);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16">
      
      {/* Admin Review Banner (Google Form Evaluation) */}
      <AdminReviewBanner />

      {/* Header section */}
      <header className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-xl font-bold text-text-main">
            Assalamu'alaikum, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-text-muted mt-1 font-medium text-xs flex items-center gap-2">
            {format(new Date(), 'EEEE, d MMM yyyy', { locale: id })}
            {prayerData && (
              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[10px] font-bold">
                {prayerData.hijri.day} {prayerData.hijri.month} {prayerData.hijri.year.replace(/\s*H\s*$/i, '')} H
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="text-[11px] font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors"
            title="Akses Admin Dashboard (Token: fajrul22)"
          >
            Admin
          </Link>
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* PRAYER FOCUS HERO SECTION WITH GRAND MOSQUE VECTOR BACKGROUND */}
      <section className="bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-900/25 relative overflow-hidden border border-emerald-700/60">
        
        {/* GRAND MOSQUE SILHOUETTE VECTOR ART BACKGROUND */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <svg className="absolute bottom-0 left-0 right-0 w-full h-44 text-emerald-300 fill-current" viewBox="0 0 1200 320" preserveAspectRatio="none">
            {/* Mosque minarets, grand central domes, and architectural arches */}
            <path d="M0,320 L0,220 L35,220 L35,130 L45,130 L45,90 L50,70 L55,90 L55,130 L65,130 L65,220 L160,220 C160,150 215,130 255,130 C295,130 350,150 350,220 L440,220 L440,110 L450,110 L450,60 L455,40 L460,60 L460,110 L470,110 L470,220 L540,220 C540,120 640,80 700,80 C760,80 860,120 860,220 L930,220 L930,120 L940,120 L940,70 L945,50 L950,70 L950,120 L960,120 L960,220 L1050,220 C1050,160 1105,140 1145,140 L1200,140 L1200,320 Z" />
            <circle cx="455" cy="35" r="4" />
            <circle cx="945" cy="45" r="4" />
            <circle cx="700" cy="72" r="5" />
          </svg>
          {/* Subtle Ambient Twinkling Stars */}
          <div className="absolute top-4 left-1/4 w-1.5 h-1.5 bg-amber-200 rounded-full animate-ping" />
          <div className="absolute top-10 right-1/4 w-1 h-1 bg-white rounded-full opacity-60" />
          <div className="absolute top-6 left-2/3 w-1.5 h-1.5 bg-emerald-200 rounded-full opacity-70" />
        </div>

        {/* Ambient Top Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-32 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Control Bar: Location & Quick Sound / Notification Buttons */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 mb-4 border-b border-white/10 pb-3">
          <button 
            onClick={() => setIsCityModalOpen(true)}
            className="flex items-center gap-1.5 text-emerald-100 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-colors text-left group shadow-xs"
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-300" />
            <span className="truncate max-w-[170px]">
              {isFetchingLocation ? 'Mencari lokasi...' : (prayerData?.location || 'Pilih Kota')}
            </span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white group-hover:bg-white/30 ml-0.5">Ubah</span>
          </button>
          
          {/* Quick Sound Effect & Notification Test Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTestLoudAzan}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                isTestingSound 
                  ? 'bg-amber-400 text-emerald-950 ring-2 ring-amber-300 animate-pulse'
                  : 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-md'
              }`}
              title="Putar pengujian audio suara azan dengan volume keras dan getaran"
            >
              {isTestingSound ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
              <span>{isTestingSound ? 'Hentikan Azan' : 'Tes Suara Azan (Keras)'}</span>
            </button>

            <button
              onClick={() => setIsGatekeeperOpen(true)}
              className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-full text-xs font-bold transition-all flex items-center gap-1 backdrop-blur-md shadow-sm"
              title="Uji keterhubungan notifikasi di HP/Laptop"
            >
              <Bell className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Tes Notifikasi</span>
            </button>
          </div>
        </div>

        {/* Current Active Prayer Indicator */}
        {currentPrayer && (
          <div className="relative z-10 text-center mb-1">
            <div className="inline-flex items-center gap-2 bg-emerald-500/30 border border-emerald-400/40 px-4 py-1 rounded-full shadow-xs backdrop-blur-md">
               <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
               <span className="text-xs font-semibold text-emerald-100">Sekarang Waktu: <strong className="text-white text-sm">{currentPrayer.prayer}</strong></span>
            </div>
          </div>
        )}

        {/* Next Prayer Countdown Hero */}
        {nextPrayer && (
          <div className="relative z-10 text-center my-3 sm:my-4">
            <h2 className="text-emerald-200 font-medium text-xs mb-1 uppercase tracking-wider">
              Menjelang Salat Fardhu Berikutnya
            </h2>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-1 flex items-center justify-center gap-2.5">
              <span className="text-amber-300">{prayerIcons[nextPrayer.prayer]}</span>
              <span>{nextPrayer.prayer}</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-100">
              Pukul {formatTimeString(nextPrayer.time, user?.timeFormat || '24h')} {nextPrayer.isTomorrow && <span className="text-xs font-normal">(Besok)</span>}
            </div>
            {minutesToNext > 0 && minutesToNext < 180 && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-400/25 border border-amber-300/40 text-amber-200 px-3.5 py-0.5 rounded-full text-xs font-bold backdrop-blur-md animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>Masuk dalam {minutesToNext} menit lagi</span>
              </div>
            )}
          </div>
        )}

        {/* PERFECTLY CENTERED 5-COLUMN PRAYER TIMES GRID */}
        <div className="relative z-10 pt-2">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 max-w-xl mx-auto w-full items-stretch justify-center">
            {prayerData && prayersList.map((p) => {
              const isNext = nextPrayer?.prayer === p && !nextPrayer?.isTomorrow;
              const isCurrent = currentPrayer?.prayer === p;
              const isPassed = !isNext && !isCurrent && parse(prayerData.times[p], 'HH:mm', new Date()) < new Date();
              
              return (
                <motion.div 
                  key={p}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-emerald-300 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-300/60'
                      : isNext 
                        ? 'bg-white text-emerald-950 border-white shadow-xl ring-2 ring-white/80' 
                        : isPassed
                          ? 'bg-white/5 border-white/10 text-white/45'
                          : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  }`}
                >
                  <div className={`mb-1 ${isNext ? 'text-emerald-800' : 'opacity-90'}`}>
                    {prayerIcons[p]}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold block ${isNext ? 'text-emerald-950' : ''}`}>
                    {p}
                  </span>
                  <span className={`text-xs sm:text-sm mt-0.5 ${isNext || isCurrent ? 'font-extrabold text-amber-900 dark:text-emerald-950' : 'font-medium'}`}>
                    {formatTimeString(prayerData.times[p], user?.timeFormat || '24h')}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {prayerData && (
            <div className="flex justify-center items-center gap-4 text-[11px] text-emerald-200 mt-3 pt-2 border-t border-white/10">
              <span>Imsak: <strong>{formatTimeString(prayerData.imsak, user?.timeFormat || '24h')}</strong></span>
              <span>•</span>
              <span>Terbit: <strong>{formatTimeString(prayerData.times.Subuh, user?.timeFormat || '24h')}</strong></span>
              <span>•</span>
              <span>Magrib/Buka: <strong>{formatTimeString(prayerData.times.Magrib, user?.timeFormat || '24h')}</strong></span>
            </div>
          )}
        </div>
      </section>

      {/* HADITS PILIHAN HARI INI (API MYQURAN) */}
      {dailyHadith && (
        <section className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-900/50 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                <Quote className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Hadits Pilihan Hari Ini (API MyQuran)
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                  Hadits #{dailyHadith.no}: {dailyHadith.judul}
                </h4>
              </div>
            </div>

            <Link
              to="/quran-hadis?tab=hadis"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>42 Hadits</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="text-right font-serif text-lg leading-loose text-gray-900 dark:text-gray-100 my-1" dir="rtl">
            {dailyHadith.arab}
          </div>

          <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-100/80 dark:border-emerald-900/40 leading-relaxed">
            "{dailyHadith.indo}"
          </p>
        </section>
      )}

      {/* Notification Gatekeeper Modal (Auto-tests or opens on demand) */}
      <NotificationGatekeeperModal
        forceOpen={isGatekeeperOpen}
        onClose={() => setIsGatekeeperOpen(false)}
      />

      {/* Sunnah Fasting Information (if applicable) */}
      {(() => {
        const fasting = prayerData ? getSunnahFastingInfo(prayerData.hijri.day) : null;
        if (!fasting) return null;
        return (
          <section className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950/40 dark:to-teal-900/30 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm text-sm font-bold">
                🌙
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                    {fasting.isPuasaToday ? 'Hari Ini' : 'Besok'}
                  </span>
                  <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 truncate">
                    {fasting.name}
                  </h3>
                </div>
                <p className="text-xs text-emerald-900/80 dark:text-emerald-200/90 mt-1 leading-relaxed">
                  {fasting.desc}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 italic mt-1 bg-white/60 dark:bg-black/20 p-2 rounded-lg">
                  "{fasting.niat}"
                </p>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Daily Quran Tilawah Summary */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tilawah Qur'an Hari Ini</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
              {todayQuranLogs.length > 0 
                ? `${todayQuranLogs.length} Sesi Dibaca (${todayQuranLogs.reduce((acc, l) => acc + (l.endAyah - l.startAyah + 1), 0)} Ayat)` 
                : 'Belum ada catatan membaca hari ini'}
            </div>
          </div>
        </div>
        <Link 
          to="/quran" 
          className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 rounded-xl transition-colors"
        >
          <span>{todayQuranLogs.length > 0 ? 'Lanjut' : 'Mulai'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* Daily Wisdom */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 flex gap-3 items-start">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-sm">
          💡
        </div>
        <div>
          <h3 className="text-xs font-bold text-secondary mb-1">Daily Wisdom</h3>
          <p className="text-text-main italic text-xs leading-relaxed mb-1.5">"{wisdomOfTheDay.text}"</p>
          <p className="text-[10px] text-text-muted font-medium">— {wisdomOfTheDay.source}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aktivitas Terdekat */}
        <section className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-secondary" />
              Jadwal Hari Ini
            </h3>
            <Link to="/jadwal" className="text-sm text-primary font-medium hover:underline">Semua</Link>
          </div>
          
          {schedules.length > 0 ? (
            <div className="space-y-3">
              {schedules.map(schedule => {
                const conflicts = prayerData?.times 
                  ? checkSchedulePrayerConflicts(schedule, prayerData.times)
                  : [];
                const hasConflict = conflicts.length > 0;

                return (
                  <div key={schedule.id} className="flex gap-3.5 items-start p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700/60">
                    <div className="text-center min-w-[54px] pt-0.5">
                      <div className="text-sm font-bold text-text-main">{schedule.startTime}</div>
                      <div className="text-[10px] text-text-muted">{schedule.endTime}</div>
                    </div>
                    <div className="w-1 bg-gray-200 dark:bg-gray-700 h-10 rounded-full shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-text-main truncate">{schedule.title}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          {schedule.category}
                        </span>
                        {hasConflict && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                            Bentrok {conflicts[0].prayerName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-text-muted text-sm mb-2">Belum ada aktivitas.</p>
              <Link to="/jadwal/baru" className="text-primary font-semibold text-sm hover:underline">+ Tambah</Link>
            </div>
          )}
        </section>

        {/* Tugas Terdekat */}
        <section className="bg-surface rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Tugas Mendekat
            </h3>
            <Link to="/tugas" className="text-sm text-primary font-medium hover:underline">Semua</Link>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="flex gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <Circle className="w-5 h-5 text-gray-300 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-text-main line-clamp-1">{task.title}</div>
                    <div className="flex gap-2 items-center mt-1">
                      <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-md">
                        {format(new Date(task.deadline), 'dd MMM', { locale: id })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-4 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
             <p className="text-text-muted text-sm mb-2">Semua tugas aman.</p>
             <Link to="/tugas/baru" className="text-primary font-semibold text-sm hover:underline">+ Tambah</Link>
           </div>
          )}
        </section>
      </div>

      {/* Manual City Selector Modal */}
      <CitySelectorModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        currentCityId={prayerData?.cityId || '1301'}
        onCitySelected={async () => {
          const cached = getCachedPrayerData();
          if (cached) {
            setPrayerData(cached);
            updateNextPrayer(cached);
          }
        }}
      />
    </div>
  );
}
