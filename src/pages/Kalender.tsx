import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { storage } from '../lib/storage';

export default function Kalender() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hijriDates, setHijriDates] = useState<Record<string, { day: string, month: string }>>({});
  const [todayHijriText, setTodayHijriText] = useState<string>('');

  useEffect(() => {
    // Fetch today's official Hijri date from MyQuran Cal API
    const fetchTodayHijri = async () => {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const res = await fetch(`https://api.myquran.com/v2/cal/hijr/${todayStr}`);
        if (res.ok) {
          const json = await res.json();
          if (json.status && json.data?.date?.[1]) {
            setTodayHijriText(`${json.data.date[0]}, ${json.data.date[1]}`);
          }
        }
      } catch (err) {
        console.warn("MyQuran Hijri fetch error:", err);
      }
    };
    fetchTodayHijri();
  }, []);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const fetchHijriForMonth = async (month: number, year: number) => {
    try {
      const res = await fetch(`https://api.aladhan.com/v1/gToHCalendar/${month}/${year}`);
      if (res.ok) {
        const json = await res.json();
        const map: Record<string, { day: string, month: string }> = {};
        json.data.forEach((item: any) => {
          map[item.gregorian.date] = {
            day: item.hijri.day,
            month: item.hijri.month.en
          };
        });
        setHijriDates(prev => ({ ...prev, ...map }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const m = parseInt(format(currentDate, 'MM'));
    const y = parseInt(format(currentDate, 'yyyy'));
    fetchHijriForMonth(m, y);
  }, [currentDate]);

  const initAuth = async () => {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');
    
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setToken(credential.accessToken);
        fetchEvents(credential.accessToken);
      }
    } catch (error) {
      console.error("Auth error", error);
    }
    setIsLoading(false);
  };

  const fetchEvents = async (accessToken: string) => {
    setIsSyncing(true);
    try {
      const timeMin = startDate.toISOString();
      const timeMax = endDate.toISOString();
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.items) {
        setEvents(data.items);
      }
    } catch (err) {
      console.error(err);
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    if (token) {
      fetchEvents(token);
    }
  }, [currentDate]);

  // Important Islamic Dates 2026/2027 roughly mapped by user request. 
  // We use Hijri mapping for accurate tracking, but to answer user: "kapan Idul Fitri" we check if hijri month is Shawwal day 1.
  
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Kalender Islami</h1>
          <p className="text-text-muted text-sm mt-1">Hijriah & Masehi terintegrasi</p>
        </div>
        
        {!token ? (
          <button 
            onClick={initAuth} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <CalendarIcon className="w-4 h-4" />
            {isLoading ? 'Menghubungkan...' : 'Sinkron Google Calendar'}
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-bold">
            <CalendarIcon className="w-4 h-4" />
            Terhubung
            <button onClick={() => fetchEvents(token)} className="ml-2 p-1 hover:bg-green-100 rounded-full transition-colors">
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {todayHijriText && (
        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">Hari Ini (MyQuran API)</span>
            <span className="text-base font-bold text-text-main">{todayHijriText}</span>
          </div>
          <Link
            to="/tools"
            className="text-xs font-bold bg-primary text-white px-3.5 py-2 rounded-xl shadow-sm hover:bg-primary/90 transition-colors"
          >
            Konversi Hijriyah
          </Link>
        </div>
      )}

      <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-bold text-text-main">
            {format(currentDate, 'MMMM yyyy', { locale: id })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
            <div key={day} className="text-center text-xs font-bold text-text-muted py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {Array.from({ length: startDate.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}
          
          {days.map(day => {
            const dateStr = format(day, 'dd-MM-yyyy');
            const isToday = isSameDay(day, new Date());
            const hijri = hijriDates[dateStr];
            const dayEvents = events.filter(e => e.start?.dateTime?.startsWith(format(day, 'yyyy-MM-dd')) || e.start?.date === format(day, 'yyyy-MM-dd'));
            
            const isEid = hijri?.month === 'Shawwāl' && hijri?.day === '1';
            const isRamadan = hijri?.month === 'Ramaḍān' && hijri?.day === '1';

            return (
              <div 
                key={day.toISOString()} 
                className={`relative min-h-[60px] md:min-h-[80px] p-1 md:p-2 border rounded-xl flex flex-col items-center justify-start transition-colors ${
                  isToday ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/30 bg-white'
                } ${isEid || isRamadan ? 'bg-amber-50 border-amber-200' : ''}`}
              >
                <span className={`text-sm md:text-base font-bold ${isToday ? 'text-primary' : 'text-text-main'}`}>
                  {format(day, 'd')}
                </span>
                
                {hijri && (
                  <span className="text-[9px] md:text-[10px] font-medium text-text-muted mt-0.5 text-center leading-tight">
                    {hijri.day} {hijri.month.substring(0, 3)}
                  </span>
                )}

                {(isEid || isRamadan) && (
                  <span className="text-[8px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded-sm font-bold mt-1 max-w-full truncate text-center line-clamp-1">
                    {isEid ? 'Idul Fitri' : 'Awal Ramadan'}
                  </span>
                )}

                <div className="mt-auto pt-1 flex gap-1 flex-wrap justify-center w-full">
                  {dayEvents.slice(0, 2).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
      </div>
      
      {token && (
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" />
            Agenda Google Calendar
          </h3>
          {events.length > 0 ? (
             <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
               {events.map(e => (
                 <div key={e.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                   <div className="font-bold text-text-main">{e.summary}</div>
                   <div className="text-text-muted mt-1 text-xs">
                     {e.start.dateTime ? format(new Date(e.start.dateTime), 'd MMM yyyy, HH:mm') : format(new Date(e.start.date), 'd MMM yyyy')}
                   </div>
                 </div>
               ))}
             </div>
          ) : (
             <div className="text-center py-6 text-text-muted text-sm">
               Belum ada agenda di bulan ini.
             </div>
          )}
        </div>
      )}

    </div>
  );
}
