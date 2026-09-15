import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { PrayerLog, PrayerName, User } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Check, Clock, Heart } from 'lucide-react';
import { getPrayerTimesForToday, fetchPrayerTimes, PrayerData } from '../lib/prayer-times';
import { formatTimeString } from '../lib/utils';
import { vibrateSuccess } from '../lib/audio';

export default function Ibadah() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [log, setLog] = useState<PrayerLog>({ date: selectedDate, prayers: { Subuh: false, Zuhur: false, Asar: false, Magrib: false, Isya: false } });
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);

  useEffect(() => {
    const loadedUser = storage.getUser();
    setUser(loadedUser);
    setLog(storage.getPrayerLog(selectedDate));
    
    // We only fetch for today to keep it simple, otherwise we'd need to fetch historical data from API
    // For historical days, we just use the cached today's time as an approximation.
    if (selectedDate === format(new Date(), 'yyyy-MM-dd')) {
        let lat = -6.2088;
        let lng = 106.8456;
        if (loadedUser?.location) {
            lat = loadedUser.location.latitude;
            lng = loadedUser.location.longitude;
        }
        fetchPrayerTimes(lat, lng).then(data => setPrayerData(data));
    }
  }, [selectedDate]);

  const handleToggle = (prayer: PrayerName) => {
    const isCompleted = !log.prayers[prayer];
    if (isCompleted && user?.soundEnabled !== false) {
      vibrateSuccess();
    }
    const newLog = {
      ...log,
      prayers: { ...log.prayers, [prayer]: isCompleted }
    };
    setLog(newLog);
    storage.updatePrayerLog(newLog);
  };

  const prayers: PrayerName[] = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'];
  const times = prayerData ? prayerData.times : getPrayerTimesForToday();
  const completedCount = Object.values(log.prayers).filter(Boolean).length;
  
  // Calculate messages softly
  let message = '';
  if (completedCount === 5) {
    message = 'Alhamdulillah, salat wajib hari ini lengkap. Pertahankan!';
  } else if (completedCount > 0) {
    message = `Kamu sudah mencatat ${completedCount} waktu salat. Semoga bisa lebih baik lagi!`;
  } else {
    message = 'Belum ada catatan ibadah hari ini. Yuk, mulai catat agar lebih disiplin.';
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Ibadah</h1>
          <p className="text-text-muted text-sm mt-1">Jaga salatmu di sela kesibukan</p>
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar">
        {[-2, -1, 0].map(offset => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          const dateStr = format(d, 'yyyy-MM-dd');
          const isSelected = selectedDate === dateStr;
          const isToday = offset === 0;
          
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center justify-center min-w-[80px] py-3 rounded-2xl border transition-all ${
                isSelected 
                  ? 'bg-primary text-white border-primary shadow-md shadow-primary/20' 
                  : isToday 
                    ? 'bg-primary/5 border-primary/20 text-primary hover:bg-primary/10'
                    : 'bg-surface border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="text-xs mb-1 font-medium">{isToday ? 'Hari ini' : format(d, 'EEE', { locale: id })}</span>
              <span className="text-xl font-bold">{format(d, 'd')}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100">
        
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className={`w-8 h-8 ${completedCount === 5 ? 'text-green-500 fill-green-500' : 'text-green-400'}`} />
          </div>
          <h3 className="text-lg font-bold text-text-main mb-2">Progress Harian</h3>
          <p className="text-text-muted text-sm max-w-xs mx-auto">{message}</p>
          
          <div className="flex justify-center gap-2 mt-6">
            {prayers.map((p, i) => (
              <div 
                key={p}
                className={`w-10 h-2 rounded-full transition-all duration-500 ${
                  i < completedCount ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {prayers.map(prayer => {
            const isCompleted = log.prayers[prayer];
            return (
              <button
                key={prayer}
                onClick={() => handleToggle(prayer)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isCompleted 
                    ? 'bg-primary/5 border-primary/30' 
                    : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isCompleted ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {isCompleted ? <Check className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div className="text-left">
                    <h4 className={`text-lg font-bold ${isCompleted ? 'text-primary' : 'text-text-main'}`}>
                      {prayer}
                    </h4>
                    <span className="text-sm text-text-muted font-medium">{formatTimeString(times[prayer], user?.timeFormat || '24h')}</span>
                  </div>
                </div>
                
                <div className="text-sm font-medium">
                  {isCompleted ? (
                    <span className="text-primary bg-primary/10 px-3 py-1 rounded-full">Selesai</span>
                  ) : (
                    <span className="text-gray-400">Belum dicatat</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
