import React, { useEffect, useState } from 'react';
import { storage } from '../lib/storage';
import { User, Task, Schedule, PrayerName } from '../types';
import { format, differenceInMinutes, parse } from 'date-fns';
import { id } from 'date-fns/locale';
import { getPrayerStatus, fetchPrayerTimes, PrayerData, getCachedPrayerData } from '../lib/prayer-times';
import { MapPin, Sun, Sunrise, Sunset, Moon, Circle, AlertCircle, Calendar, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatTimeString } from '../lib/utils';

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

  useEffect(() => {
    const loadedUser = storage.getUser();
    setUser(loadedUser);
    
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
    } else {
      // Prompt user to enable location but default to Jakarta if not
      if (navigator.geolocation && !isFetchingLocation && !prayerData) {
        // We do not auto-prompt here aggressively to avoid blocking, user can click the refresh button.
        // We just fetch Jakarta first.
      }
    }

    const data = await fetchPrayerTimes(lat, lng);
    setPrayerData(data);
    updateNextPrayer(data);
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
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
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

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16">
      
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
                {prayerData.hijri.day} {prayerData.hijri.month} {prayerData.hijri.year} H
              </span>
            )}
          </p>
        </div>
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shadow-sm">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Prayer Focus UI */}
      <section className="bg-primary text-white rounded-2xl p-5 shadow-lg shadow-primary/20 relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2 text-primary-light bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
            <MapPin className="w-3 h-3" />
            {isFetchingLocation ? 'Mencari lokasi...' : (prayerData?.location || 'Jakarta, Indonesia')}
            <button onClick={handleRefreshLocation} className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1">
              <RefreshCcw className={`w-3 h-3 ${isFetchingLocation ? 'animate-spin' : ''}`} />
              <span className="sr-only">Refresh Lokasi</span>
            </button>
          </div>
          
          {prayerData && (
            <div className="text-right">
              <div className="text-xs text-primary-light">Imsak {formatTimeString(prayerData.imsak, user?.timeFormat || '24h')}</div>
              <div className="text-xs text-primary-light mt-0.5">Iftar {formatTimeString(prayerData.times.Magrib, user?.timeFormat || '24h')}</div>
            </div>
          )}
        </div>

        {currentPrayer && (
          <div className="text-center mb-2">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full mb-4">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
               <span className="text-sm font-medium">Sekarang: <strong>{currentPrayer.prayer}</strong></span>
            </div>
          </div>
        )}

        {nextPrayer && (
          <div className="text-center mb-6">
            <h2 className="text-primary-light font-medium text-sm mb-2">Salat Berikutnya</h2>
            <div className="text-4xl font-bold tracking-tight mb-2 flex items-center justify-center gap-3">
              {prayerIcons[nextPrayer.prayer]}
              {nextPrayer.prayer}
            </div>
            <div className="text-lg opacity-90 font-medium">
              {formatTimeString(nextPrayer.time, user?.timeFormat || '24h')} {nextPrayer.isTomorrow && <span className="text-sm">(Besok)</span>}
            </div>
            {minutesToNext > 0 && minutesToNext < 120 && (
              <div className="mt-3 inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                Dalam {minutesToNext} menit
              </div>
            )}
          </div>
        )}

        {/* Swipeable Prayer Times */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar snap-x">
          {prayerData && prayersList.map((p) => {
            const isNext = nextPrayer?.prayer === p && !nextPrayer?.isTomorrow;
            const isCurrent = currentPrayer?.prayer === p;
            const isPassed = !isNext && !isCurrent && parse(prayerData.times[p], 'HH:mm', new Date()) < new Date();
            
            return (
              <motion.div 
                key={p}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`snap-center flex flex-col items-center justify-center min-w-[70px] p-2 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-green-500 text-white border-green-400 shadow-lg'
                    : isNext 
                      ? 'bg-white text-primary border-white shadow-lg' 
                      : isPassed
                        ? 'bg-white/5 border-white/10 text-white/50'
                        : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <div className="mb-1 opacity-80">{prayerIcons[p]}</div>
                <span className="text-[10px] font-bold">{p}</span>
                <span className={`text-xs mt-0.5 ${isNext || isCurrent ? 'font-bold' : 'font-medium'}`}>{formatTimeString(prayerData.times[p], user?.timeFormat || '24h')}</span>
              </motion.div>
            );
          })}
        </div>
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
              {schedules.map(schedule => (
                <div key={schedule.id} className="flex gap-4 items-center p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="text-center min-w-[60px]">
                    <div className="text-sm font-bold text-text-main">{schedule.startTime}</div>
                  </div>
                  <div className="w-1 bg-gray-200 h-10 rounded-full" />
                  <div>
                    <div className="font-semibold text-text-main">{schedule.title}</div>
                    <div className="text-xs text-primary bg-primary/10 inline-block px-2 py-0.5 rounded-full mt-1">
                      {schedule.category}
                    </div>
                  </div>
                </div>
              ))}
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
    </div>
  );
}
