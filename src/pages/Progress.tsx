import React, { useEffect, useState, useMemo } from 'react';
import { storage } from '../lib/storage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { 
  format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, 
  startOfMonth, endOfMonth, isSameDay, isToday, addMonths, subMonths, parseISO 
} from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  Target, CheckCircle2, Heart, Clock, BookOpen, Calendar, 
  ChevronLeft, ChevronRight, Check, Award, Sparkles, Filter 
} from 'lucide-react';
import { QuranLog, PrayerLog } from '../types';

export default function Progress() {
  const [filterMode, setFilterMode] = useState<'harian' | 'mingguan' | 'bulanan' | 'kalender'>('kalender');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Data states
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([]);
  const [quranLogs, setQuranLogs] = useState<QuranLog[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  // Load storage data
  useEffect(() => {
    setPrayerLogs(storage.getPrayerLogs());
    setQuranLogs(storage.getQuranLogs());
    setTasks(storage.getTasks());
  }, []);

  // Compute overall stats
  const stats = useMemo(() => {
    const totalPrayers = prayerLogs.reduce(
      (acc, log) => acc + Object.values(log.prayers).filter(Boolean).length,
      0
    );
    const maxPrayers = prayerLogs.length > 0 ? prayerLogs.length * 5 : 5;
    const consistency = prayerLogs.length > 0 ? Math.round((totalPrayers / maxPrayers) * 100) : 0;

    const totalAyat = quranLogs.reduce((acc, q) => acc + (q.totalAyat || 0), 0);
    const completedTasks = tasks.filter(t => t.status === 'Selesai').length;

    return {
      consistency,
      totalAyat,
      totalSurahRead: new Set(quranLogs.map(q => q.surahNumber)).size,
      completedTasks,
      totalTasks: tasks.length,
      focusSessions: storage.getFocusSessions().length
    };
  }, [prayerLogs, quranLogs, tasks]);

  // Chart data: 7 days for weekly
  const weeklyChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const pLog = storage.getPrayerLog(dateStr);
      const prayersDone = Object.values(pLog.prayers).filter(Boolean).length;
      
      const qLogs = storage.getQuranLogsByDate(dateStr);
      const ayahsDone = qLogs.reduce((acc, q) => acc + (q.totalAyat || 0), 0);

      data.push({
        date: format(d, 'dd MMM', { locale: id }),
        dayName: format(d, 'EEE', { locale: id }),
        salat: prayersDone,
        ayat: ayahsDone
      });
    }
    return data;
  }, [prayerLogs, quranLogs]);

  // Chart data: 30 days for monthly
  const monthlyChartData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i -= 2) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      
      const pLog = storage.getPrayerLog(dateStr);
      const prayersDone = Object.values(pLog.prayers).filter(Boolean).length;
      
      const qLogs = storage.getQuranLogsByDate(dateStr);
      const ayahsDone = qLogs.reduce((acc, q) => acc + (q.totalAyat || 0), 0);

      data.push({
        date: format(d, 'dd/MM'),
        salat: prayersDone,
        ayat: ayahsDone
      });
    }
    return data;
  }, [prayerLogs, quranLogs]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentCalendarMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentCalendarMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentCalendarMonth]);

  // Selected date details
  const selectedDatePrayers = useMemo(() => {
    return storage.getPrayerLog(selectedCalendarDate);
  }, [selectedCalendarDate, prayerLogs]);

  const selectedDateQuranLogs = useMemo(() => {
    return storage.getQuranLogsByDate(selectedCalendarDate);
  }, [selectedCalendarDate, quranLogs]);

  const selectedDateTotalAyat = selectedDateQuranLogs.reduce((acc, q) => acc + (q.totalAyat || 0), 0);
  const selectedDatePrayerCount = Object.values(selectedDatePrayers.prayers).filter(Boolean).length;

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Evaluasi & Progres Ibadah
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">
            Pelacakan lengkap salat 5 waktu dan tilawah Al-Qur'an berbasis kalender harian
          </p>
        </div>

        {/* View Filter Pill */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterMode('kalender')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterMode === 'kalender'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kalender Ibadah</span>
          </button>
          <button
            onClick={() => setFilterMode('mingguan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterMode === 'mingguan'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            Mingguan
          </button>
          <button
            onClick={() => setFilterMode('bulanan')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterMode === 'bulanan'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setFilterMode('harian')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterMode === 'harian'
                ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
            }`}
          >
            Ringkasan
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-2">
            <Heart className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Konsistensi Salat</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.consistency}%</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="w-8 h-8 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Tilawah Al-Qur'an</p>
          <p className="text-xl font-bold text-teal-700 dark:text-teal-300 mt-0.5">
            {stats.totalAyat} <span className="text-xs font-normal text-gray-400">Ayat</span>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="w-8 h-8 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Tugas Selesai</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {stats.completedTasks} <span className="text-xs font-normal text-gray-400">/ {stats.totalTasks}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
          <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Sesi Fokus</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.focusSessions} <span className="text-xs font-normal text-gray-400">kali</span></p>
        </div>
      </div>

      {/* ======================= KALENDER IBADAH & TILAWAH ======================= */}
      {filterMode === 'kalender' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-xs">
            {/* Calendar Header Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white capitalize">
                    {format(currentCalendarMonth, 'MMMM yyyy', { locale: id })}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Klik tanggal untuk melihat rincian salat & ayat yang dibaca
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentCalendarMonth(subMonths(currentCalendarMonth, 1))}
                  className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => {
                    setCurrentCalendarMonth(new Date());
                    setSelectedCalendarDate(format(new Date(), 'yyyy-MM-dd'));
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setCurrentCalendarMonth(addMonths(currentCalendarMonth, 1))}
                  className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Weekdays Label */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Ahad'].map((day) => (
                <div key={day} className="text-[11px] font-bold text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {calendarDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isSelected = selectedCalendarDate === dateStr;
                const isCurrentMonth = day.getMonth() === currentCalendarMonth.getMonth();
                const dayToday = isToday(day);

                // Fetch day's data
                const dayPrayer = storage.getPrayerLog(dateStr);
                const prayersDone = Object.values(dayPrayer.prayers).filter(Boolean).length;
                const dayQuran = storage.getQuranLogsByDate(dateStr);
                const ayahsRead = dayQuran.reduce((acc, q) => acc + (q.totalAyat || 0), 0);

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={`min-h-[58px] sm:min-h-[66px] p-1.5 rounded-xl text-left border flex flex-col justify-between transition-all relative ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                        : isCurrentMonth
                          ? 'border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/80 hover:border-emerald-300'
                          : 'border-transparent bg-gray-50/50 dark:bg-gray-800/20 opacity-40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        dayToday 
                          ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]' 
                          : isSelected 
                            ? 'text-emerald-800 dark:text-emerald-300' 
                            : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {format(day, 'd')}
                      </span>

                      {/* Prayer Badge indicator */}
                      {prayersDone > 0 && (
                        <span className={`text-[9px] font-bold px-1 rounded ${
                          prayersDone === 5 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {prayersDone}/5
                        </span>
                      )}
                    </div>

                    {/* Quran Badge indicator if any */}
                    <div className="mt-1">
                      {ayahsRead > 0 && (
                        <div className="flex items-center gap-0.5 text-[9px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-1 py-0.5 rounded truncate">
                          <BookOpen className="w-2.5 h-2.5 shrink-0" />
                          <span>{ayahsRead} ay</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed breakdown for selectedCalendarDate */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Rincian Tanggal Terpilih
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {format(new Date(selectedCalendarDate), 'EEEE, d MMMM yyyy', { locale: id })}
                </h3>
              </div>

              <div className="flex gap-2">
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold">
                  Salat: {selectedDatePrayerCount} / 5 Waktu
                </span>
                <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-xl text-xs font-bold">
                  Tilawah: {selectedDateTotalAyat} Ayat
                </span>
              </div>
            </div>

            {/* 1. Status 5 Waktu Salat */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Status Salat 5 Waktu
              </h4>
              <div className="grid grid-cols-5 gap-2 text-center">
                {(['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'] as const).map(p => {
                  const done = selectedDatePrayers.prayers[p];
                  return (
                    <div
                      key={p}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        done
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                          : 'bg-gray-50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800 text-gray-400'
                      }`}
                    >
                      <div className={`w-5 h-5 mx-auto rounded-full flex items-center justify-center text-xs mb-1 ${
                        done ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold block">{p}</span>
                      <span className="text-[10px]">{done ? 'Selesai' : 'Belum'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Rincian Bacaan Al-Qur'an */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Rincian Tilawah Al-Qur'an
              </h4>

              {selectedDateQuranLogs.length === 0 ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tidak ada catatan tilawah Al-Qur'an pada tanggal ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDateQuranLogs.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 bg-teal-50/50 dark:bg-teal-950/30 rounded-2xl border border-teal-100 dark:border-teal-900/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold text-xs">
                          {q.surahNumber}
                        </div>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                            Surah {q.surahName}
                          </h5>
                          <span className="text-xs text-teal-700 dark:text-teal-300 font-semibold">
                            Ayat {q.startAyat} s/d {q.endAyat}
                          </span>
                          {q.notes && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mt-0.5">
                              "{q.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-white dark:bg-teal-900 px-2.5 py-1 rounded-xl shadow-2xs">
                          +{q.totalAyat} Ayat
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= GRAFIK MINGGUAN ======================= */}
      {filterMode === 'mingguan' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  Aktivitas Ibadah 7 Hari Terakhir
                </h3>
                <p className="text-xs text-gray-400">
                  Perbandingan konsistensi salat 5 waktu dan jumlah ayat Al-Qur'an
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="salat" name="Salat (Waktu /5)" fill="#059669" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="ayat" name="Ayat Qur'an" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ======================= GRAFIK BULANAN ======================= */}
      {filterMode === 'bulanan' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                  Tren 30 Hari Terakhir
                </h3>
                <p className="text-xs text-gray-400">
                  Pantau pertumbuhan tilawah Qur'an dan kestabilan salatmu
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="salat" name="Salat (/5)" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ayat" name="Ayat Tilawah" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ======================= RINGKASAN HARIAN ======================= */}
      {filterMode === 'harian' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 border border-gray-100 dark:border-gray-700 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-gray-900 dark:text-white">
              Pencapaian Tilawah & Target
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold block mb-1">
                  Surat yang Telah Dibaca
                </span>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {stats.totalSurahRead} <span className="text-sm font-normal">Surat</span>
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Dari total 114 surat Al-Qur'an
                </p>
              </div>

              <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-100 dark:border-teal-800">
                <span className="text-xs text-teal-700 dark:text-teal-300 font-bold block mb-1">
                  Total Sesi Tilawah
                </span>
                <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                  {quranLogs.length} <span className="text-sm font-normal">Sesi</span>
                </p>
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                  Rata-rata {quranLogs.length > 0 ? Math.round(stats.totalAyat / quranLogs.length) : 0} ayat per sesi
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insight Card */}
      <div className="bg-emerald-50/80 dark:bg-emerald-950/30 rounded-3xl p-4 sm:p-5 border border-emerald-100 dark:border-emerald-800/80 flex gap-3.5 items-start">
        <div className="w-9 h-9 bg-white dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white mb-0.5">
            Refleksi & Insight Ibadah
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {stats.consistency >= 80 
              ? "Masya Allah! Kedisiplinan salat 5 waktu dan tilawahmu sangat terjaga. Terus istiqomah dan niatkan ikhlas karena Allah SWT." 
              : "Amalan yang paling dicintai Allah adalah amalan yang kontinu meskipun sedikit (HR. Bukhari & Muslim). Luangkan waktu tilawah walau satu halaman setiap habis salat."}
          </p>
        </div>
      </div>
    </div>
  );
}
