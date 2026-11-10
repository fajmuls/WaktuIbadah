import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, 
  CheckCircle2, Clock, BookOpen, Star, AlertCircle, ChevronDown, Check, Sun, Moon, Edit3, X
} from 'lucide-react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { storage } from '../lib/storage';
import { PrayerLog, Schedule, QuranLog, PrayerName, SunnahPrayerName } from '../types';
import { MonthlyCalendarGrid, CalendarDayBadge } from '../components/MonthlyCalendarGrid';
import { playButtonTapSound } from '../lib/audio';

export default function Kalender() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [todayHijriText, setTodayHijriText] = useState<string>('');

  // Local user records
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([]);
  const [quranLogs, setQuranLogs] = useState<QuranLog[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [editingTimeItem, setEditingTimeItem] = useState<{ isSunnah: boolean; key: string; currentVal: string } | null>(null);
  const [timeInputVal, setTimeInputVal] = useState<string>('');

  useEffect(() => {
    // Load local storage records
    const loadUserData = () => {
      setPrayerLogs(storage.getPrayerLogs());
      setQuranLogs(storage.getQuranLogs());
      setSchedules(storage.getSchedules());
    };

    loadUserData();
    window.addEventListener('storage', loadUserData);
    window.addEventListener('wi_data_updated', loadUserData);
    window.addEventListener('wi_auto_cloud_sync', loadUserData);
    window.addEventListener('wi_cloud_sync_completed', loadUserData);
    window.addEventListener('focus', loadUserData);

    return () => {
      window.removeEventListener('storage', loadUserData);
      window.removeEventListener('wi_data_updated', loadUserData);
      window.removeEventListener('wi_auto_cloud_sync', loadUserData);
      window.removeEventListener('wi_cloud_sync_completed', loadUserData);
      window.removeEventListener('focus', loadUserData);
    };
  }, []);

  useEffect(() => {
    // Fetch today's official Hijri date from MyQuran Cal API
    const fetchTodayHijri = async () => {
      try {
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
  }, [todayStr]);

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
      const curDate = new Date(`${selectedDate}T12:00:00`);
      const timeMin = startOfMonth(curDate).toISOString();
      const timeMax = endOfMonth(curDate).toISOString();
      const res = await fetch(`https://api.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`, {
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

  // Compute Badges for each date in the calendar
  const badgesMap = useMemo(() => {
    const map: Record<string, CalendarDayBadge> = {};

    // Map prayer logs (guarantee today's live status is included)
    const allLogs = [...prayerLogs];
    const todayLog = storage.getPrayerLog(todayStr);
    const existingTodayIdx = allLogs.findIndex(l => l.date === todayStr);
    if (existingTodayIdx >= 0) {
      allLogs[existingTodayIdx] = todayLog;
    } else {
      allLogs.push(todayLog);
    }

    allLogs.forEach((log) => {
      if (!log.date) return;
      const fardhuCount = Object.values(log.prayers || {}).filter(Boolean).length;
      const isAllDone = fardhuCount === 5;
      
      const hasDhuha = Boolean(log.sunnahPrayers?.Dhuha);
      const hasTahajud = Boolean(log.sunnahPrayers?.Tahajud);
      const hasWitir = Boolean(log.sunnahPrayers?.Witir);
      const hasSunnah = hasDhuha || hasTahajud || hasWitir;

      map[log.date] = {
        ...map[log.date],
        count: fardhuCount,
        isAllDone,
        hasDhuha,
        hasSunnah
      };
    });

    // Map quran logs
    quranLogs.forEach((q) => {
      if (!q.date) return;
      map[q.date] = {
        ...map[q.date],
        hasQuran: true
      };
    });

    // Map schedules
    schedules.forEach((s) => {
      if (!s.date) return;
      map[s.date] = {
        ...map[s.date],
        hasItems: true,
        scheduleCount: (map[s.date]?.scheduleCount || 0) + 1
      };
    });

    return map;
  }, [prayerLogs, quranLogs, schedules, todayStr]);

  // Selected date details
  const selectedPrayerLog = useMemo(() => {
    return prayerLogs.find(p => p.date === selectedDate) || storage.getPrayerLog(selectedDate);
  }, [prayerLogs, selectedDate]);

  const selectedQuranLogs = useMemo(() => {
    return quranLogs.filter(q => q.date === selectedDate);
  }, [quranLogs, selectedDate]);

  const selectedSchedules = useMemo(() => {
    return schedules.filter(s => s.date === selectedDate);
  }, [schedules, selectedDate]);

  const selectedEvents = useMemo(() => {
    return events.filter(e => {
      const dt = e.start?.dateTime || e.start?.date || '';
      return dt.startsWith(selectedDate);
    });
  }, [events, selectedDate]);

  const PRAYER_NAMES: PrayerName[] = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'];

  return (
    <div className="space-y-5 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Kalender Ibadah & Agenda</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Pantau ketuntasan salat fardhu, salat sunnah dhuha, tilawah, dan jadwal kuliah
          </p>
        </div>
        
        {!token ? (
          <button 
            onClick={initAuth} 
            disabled={isLoading}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
          >
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            {isLoading ? 'Menghubungkan...' : 'Sinkron Google Calendar'}
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold">
            <CalendarIcon className="w-4 h-4" />
            Google Calendar Aktif
            <button 
              onClick={() => fetchEvents(token)} 
              className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-full transition-colors"
              title="Perbarui Agenda Google"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Hijri Banner */}
      {todayHijriText && (
        <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
              Kalender Hijriah Resmi Hari Ini
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{todayHijriText}</span>
          </div>
          <Link
            to="/tools"
            className="text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl shadow-xs transition-colors shrink-0"
          >
            Konversi Hijriyah
          </Link>
        </div>
      )}

      {/* Main Monthly Calendar with Worship Indicators */}
      <MonthlyCalendarGrid
        selectedDate={selectedDate}
        onSelectDate={(d) => {
          setSelectedDate(d);
          playButtonTapSound();
        }}
        badgesMap={badgesMap}
        title="Pilih tanggal untuk melihat rincian ibadah fardhu, sunnah, dan jadwal"
      />

      {/* Detail Ibadah & Jadwal Tanggal Terpilih */}
      <section className="bg-white dark:bg-slate-900 border-[1.5px] border-[#121212] dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_#121212] dark:shadow-[3px_3px_0px_#000000] space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 border border-black flex items-center justify-center font-bold shrink-0">
              <CalendarIcon className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Rincian Ibadah & Jadwal</span>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {format(new Date(`${selectedDate}T12:00:00`), 'EEEE, d MMMM yyyy', { locale: id })}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link 
              to="/ibadah" 
              className="px-2.5 py-1 text-[11px] font-bold border border-black bg-emerald-300 hover:bg-emerald-400 rounded-lg shadow-xs"
            >
              Catat Ibadah
            </Link>
            <Link 
              to="/jadwal" 
              className="px-2.5 py-1 text-[11px] font-bold border border-black bg-[#FFE600] hover:bg-[#FFE600]/80 rounded-lg shadow-xs"
            >
              + Agenda
            </Link>
          </div>
        </div>

        {/* 1. Salat Fardhu Status */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Salat Fardhu 5 Waktu
            </span>
            <span className="text-[11px] font-bold text-gray-500">
              {selectedPrayerLog ? `${Object.values(selectedPrayerLog.prayers || {}).filter(Boolean).length}/5 selesai` : '0/5 selesai'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {PRAYER_NAMES.map((pName) => {
              const isDone = Boolean(selectedPrayerLog?.prayers?.[pName]);
              const recTime = selectedPrayerLog?.prayerTimesRecords?.[pName];
              return (
                <div 
                  key={pName}
                  onClick={() => {
                    if (isDone) {
                      setEditingTimeItem({ isSunnah: false, key: pName, currentVal: recTime || '12:00' });
                      setTimeInputVal(recTime || '12:00');
                    }
                  }}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer relative group ${
                    isDone 
                      ? 'bg-emerald-600 text-white border-black shadow-[1.5px_1.5px_0px_#121212] font-bold' 
                      : 'bg-[#F4F7F2] dark:bg-slate-800 text-gray-400 dark:text-gray-500 border-black/30 font-medium'
                  }`}
                  title={isDone ? 'Ketuk untuk mengedit jam salat' : 'Belum dikerjakan'}
                >
                  <div className="text-[11px] leading-tight font-black">{pName}</div>
                  <div className="text-[9.5px] mt-0.5 font-bold flex items-center justify-center gap-0.5">
                    {isDone ? (
                      <>
                        <span>{recTime ? `${recTime}` : '✓'}</span>
                        <Edit3 className="w-2.5 h-2.5 opacity-80 group-hover:opacity-100" />
                      </>
                    ) : (
                      'Belum'
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Salat Sunnah (Dhuha & Tahajud) */}
        <div className="space-y-1.5 pt-2 border-t border-black/20 dark:border-slate-800">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-500" />
            Salat Sunnah
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['Dhuha', 'Tahajud', 'Witir'] as SunnahPrayerName[]).map((sName) => {
              const isDone = Boolean(selectedPrayerLog?.sunnahPrayers?.[sName]);
              const recTime = selectedPrayerLog?.sunnahTimesRecords?.[sName];
              return (
                <div
                  key={sName}
                  onClick={() => {
                    if (isDone) {
                      setEditingTimeItem({ isSunnah: true, key: sName, currentVal: recTime || '08:00' });
                      setTimeInputVal(recTime || '08:00');
                    }
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isDone 
                      ? 'bg-amber-300 dark:bg-amber-900/80 border-black text-black dark:text-white font-bold shadow-[1.5px_1.5px_0px_#121212]' 
                      : 'bg-[#F4F7F2] dark:bg-slate-800 border-black/30 text-gray-400'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">{sName === 'Dhuha' ? 'Salat Dhuha' : sName}</div>
                    <div className="text-[10px] font-bold mt-0.5">
                      {isDone ? (recTime ? `⭐ ${recTime}` : '⭐ Dikerjakan') : 'Belum dicatat'}
                    </div>
                  </div>
                  {isDone && <Edit3 className="w-3.5 h-3.5 text-black dark:text-white" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Catatan Tilawah Al-Qur'an */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            Tilawah Al-Qur'an
          </span>
          {selectedQuranLogs.length > 0 ? (
            <div className="space-y-1.5">
              {selectedQuranLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-indigo-900 dark:text-indigo-200">{log.surahName}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">Ayat {log.ayahStart} - {log.ayahEnd}</span>
                  </div>
                  {log.durationMinutes && (
                    <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                      ⏱ {log.durationMinutes} menit
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-gray-400 italic">Belum ada tilawah dicatat pada tanggal ini.</p>
          )}
        </div>

        {/* 4. Jadwal Kuliah & Agenda Hari Ini */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-500" />
            Jadwal Kuliah & Kegiatan ({selectedSchedules.length + selectedEvents.length})
          </span>
          {selectedSchedules.length === 0 && selectedEvents.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic">Tidak ada agenda kuliah atau kegiatan pada tanggal ini.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedSchedules.map((item) => (
                <div key={item.id} className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.completed ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span className={`font-bold ${item.completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {item.title}
                    </span>
                    <span className="text-[10px] bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-bold">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 tabular-nums">
                    {item.startTime} - {item.endTime}
                  </span>
                </div>
              ))}

              {selectedEvents.map((evt) => (
                <div key={evt.id} className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900 dark:text-blue-200">{evt.summary}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">Google Calendar</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal Edit Jam Pengerjaan Salat */}
      {editingTimeItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-[2px] border-black rounded-2xl p-4 sm:p-5 w-full max-w-xs shadow-[4px_4px_0px_#121212] space-y-4">
            <div className="flex items-center justify-between border-b border-black/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-400 border border-black flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4 text-black" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-black dark:text-white">Ubah Jam Salat</h4>
                  <p className="text-[10.5px] font-bold text-gray-500">{editingTimeItem.key} ({selectedDate})</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTimeItem(null)}
                className="w-7 h-7 rounded-lg border border-black flex items-center justify-center font-bold hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingTimeItem.isSunnah) {
                  storage.updateSunnahPrayerTime(selectedDate, editingTimeItem.key, timeInputVal);
                } else {
                  storage.updatePrayerTime(selectedDate, editingTimeItem.key, timeInputVal);
                }
                setPrayerLogs(storage.getPrayerLogs());
                setEditingTimeItem(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-extrabold text-black dark:text-white mb-1">
                  Jam Pengerjaan (HH:mm)
                </label>
                <input
                  type="time"
                  value={timeInputVal}
                  onChange={(e) => setTimeInputVal(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border-[1.5px] border-black rounded-xl text-center font-mono font-black text-lg text-black dark:text-white outline-none shadow-[1.5px_1.5px_0px_#121212]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingTimeItem(null)}
                  className="flex-1 py-2 bg-white dark:bg-slate-800 text-black dark:text-white border-[1.5px] border-black rounded-xl text-xs font-bold shadow-[1.5px_1.5px_0px_#121212]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white border-[1.5px] border-black rounded-xl text-xs font-black shadow-[1.5px_1.5px_0px_#121212]"
                >
                  Simpan Jam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
