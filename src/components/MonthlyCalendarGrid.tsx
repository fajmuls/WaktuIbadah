import React, { useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths 
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { playButtonTapSound } from '../lib/audio';
import { storage } from '../lib/storage';

export interface CalendarDayBadge {
  count?: number;        // Jumlah fardhu selesai (0..5)
  isAllDone?: boolean;    // 5 fardhu selesai penuh
  hasSunnah?: boolean;    // Ada salat sunnah dikerjakan
  hasDhuha?: boolean;     // Ada salat Dhuha dikerjakan
  hasTahajud?: boolean;   // Ada salat Tahajud
  hasWitir?: boolean;     // Ada salat Witir
  hasQuran?: boolean;     // Ada baca Al-Qur'an
  hasItems?: boolean;     // Ada jadwal kegiatan / kuliah
  scheduleCount?: number; // Jumlah agenda
}

interface MonthlyCalendarGridProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  // Status dot indicators for each day
  badgesMap?: Record<string, CalendarDayBadge>;
  title?: string;
  maxSelectableDate?: string; // Optional ceiling date
}


/* ---- Ikon SVG penanda ibadah (kecil, di dalam kotak tanggal) ---- */
const IconFardhu = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3c-2.6 2-4.5 3.2-4.5 6v1h9V9c0-2.8-1.9-4-4.5-6Z" fill="currentColor" fillOpacity=".25" />
    <path d="M6 21V10h12v11M3 21h18M10 21v-4a2 2 0 0 1 4 0v4" />
  </svg>
);
const IconDhuha = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity=".35" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
  </svg>
);
const IconMalam = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" fill="currentColor" fillOpacity=".3" />
  </svg>
);
const IconQuran = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 5.5C6.5 4.5 9.5 4.7 12 6.5c2.5-1.8 5.5-2 8-1v13c-2.5-1-5.5-.8-8 1-2.5-1.8-5.5-2-8-1v-13Z" fill="currentColor" fillOpacity=".25" />
    <path d="M12 6.5v13" />
  </svg>
);

/** Bangun peta lencana kalender dari data lokal (dipakai halaman Ibadah & Kalender). */
export function buildCalendarBadges(): Record<string, CalendarDayBadge> {
  const map: Record<string, CalendarDayBadge> = {};
  storage.getPrayerLogs().forEach((log) => {
    if (!log?.date) return;
    const count = Object.values(log.prayers || {}).filter(Boolean).length;
    const d = Boolean(log.sunnahPrayers?.Dhuha), t = Boolean(log.sunnahPrayers?.Tahajud), w = Boolean(log.sunnahPrayers?.Witir);
    map[log.date] = { ...map[log.date], count, isAllDone: count === 5, hasDhuha: d, hasTahajud: t, hasWitir: w, hasSunnah: d || t || w };
  });
  return map;
}

const DAY_NAMES = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const MonthlyCalendarGrid: React.FC<MonthlyCalendarGridProps> = ({
  selectedDate,
  onSelectDate,
  badgesMap = {},
  title,
}) => {
  const selectedDateObj = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => startOfMonth(selectedDateObj));

  // Sync currentMonth if selectedDate changes
  React.useEffect(() => {
    const d = new Date(`${selectedDate}T12:00:00`);
    if (!isSameMonth(d, currentMonth)) {
      setCurrentMonth(startOfMonth(d));
    }
  }, [selectedDate]);

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Compute 7-column calendar matrix (Ahad=0 to Sabtu=6)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    playButtonTapSound();
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    playButtonTapSound();
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleGoToday = () => {
    playButtonTapSound();
    const now = new Date();
    setCurrentMonth(startOfMonth(now));
    onSelectDate(todayStr);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-[1.5px] border-[#121212] dark:border-slate-700 rounded-2xl shadow-[3px_3px_0px_#121212] dark:shadow-[3px_3px_0px_#000000] p-3.5 sm:p-4 mb-4 select-none">
      {/* Top Header: Month title, Prev/Next buttons, and "Hari Ini" shortcut */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-400 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#121212] dark:text-white capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: id })}
            </h3>
            {title && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-none mt-0.5">
                {title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleGoToday}
            className="px-2 py-1 rounded-lg text-[10px] font-bold border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors"
            title="Lompat ke Hari Ini"
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-7 h-7 rounded-lg border-[1.2px] border-black/30 dark:border-white/30 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-7 h-7 rounded-lg border-[1.2px] border-black/30 dark:border-white/30 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Bulan Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Columns (Ahad - Sabtu) */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {DAY_NAMES.map((dName, idx) => {
          const isAhad = idx === 0;
          const isJumat = idx === 5;
          return (
            <div 
              key={dName} 
              className={`text-[10px] sm:text-[11px] font-bold py-1 ${
                isAhad 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : isJumat 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {dName}
            </div>
          );
        })}
      </div>

      {/* Calendar Date Cells */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dayDate) => {
          const dayStr = format(dayDate, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(dayDate, currentMonth);
          const isToday = isSameDay(dayDate, today);
          const isSelected = dayStr === selectedDate;
          const isFuture = dayStr > todayStr;
          const badge = badgesMap[dayStr];

          const isFullPrayer = badge?.isAllDone;
          const hasSunnah = Boolean(badge?.hasDhuha || badge?.hasSunnah);
          const hasPartialPrayer = Boolean(badge?.count && badge.count > 0 && !isFullPrayer);
          const hasSchedule = Boolean(badge?.hasItems || (badge?.scheduleCount && badge.scheduleCount > 0));

          // Hari ini = hijau zamrud cerah. Hari lampau = hijau lumut/sage (lebih kalem, beda jelas dari hari ini).
          const isPast = dayStr < todayStr;
          let cellBgClass = 'bg-[#F4F7F2] dark:bg-slate-900/60 border-black/20 text-gray-700 dark:text-gray-300';

          if (isCurrentMonth) {
            if (isToday) {
              cellBgClass = isFullPrayer
                ? 'bg-emerald-500 text-white font-black border-[1.5px] border-black shadow-[1.5px_1.5px_0px_#121212]'
                : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-50 font-extrabold border-[1.5px] border-black';
            } else if (isPast) {
              if (isFullPrayer) {
                cellBgClass = 'bg-[#6B8F6A] dark:bg-[#4F6F4E] text-white font-extrabold border-[1.5px] border-[#2F4A2E] shadow-[1px_1px_0px_#2F4A2E]';
              } else if (hasPartialPrayer || hasSunnah) {
                cellBgClass = 'bg-[#BFD3B8] dark:bg-[#33473a] text-[#25402A] dark:text-[#d7e8d2] font-bold border-[1.5px] border-[#5E7F5C]';
              } else {
                cellBgClass = 'bg-[#E3EADF] dark:bg-slate-800/80 text-[#6B7C69] dark:text-gray-400 border-[1.5px] border-[#B9C7B5]';
              }
            } else if (hasSchedule) {
              cellBgClass = 'bg-sky-100 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100 font-semibold border-[1.5px] border-black/50';
            }
          } else {
            cellBgClass = 'bg-gray-100/50 dark:bg-slate-900/30 text-gray-300 dark:text-gray-600 border-dashed border-gray-200 dark:border-slate-800';
          }

          // Outline & elevation for Selected Date & Today
          let borderStateClass = '';
          if (isSelected) {
            borderStateClass = 'ring-2 ring-black dark:ring-white border-[2px] border-black dark:border-white bg-[#FDE68A] text-black dark:text-black font-black shadow-[3px_3px_0px_#121212] z-20 scale-[1.05]';
          } else if (isToday) {
            borderStateClass = 'border-[2px] border-emerald-600 dark:border-emerald-400 ring-2 ring-emerald-400 shadow-[2px_2px_0px_#121212]';
          }

          return (
            <button
              key={dayStr}
              type="button"
              onClick={() => {
                playButtonTapSound();
                onSelectDate(dayStr);
              }}
              className={`relative h-12 sm:h-14 rounded-xl flex flex-col items-center justify-between p-1 transition-all ${cellBgClass} ${borderStateClass} ${
                isFuture && !isSelected && !isToday ? 'opacity-80' : ''
              }`}
            >
              {/* Baris atas: penanda KINI */}
              <div className="w-full flex items-center justify-start min-h-[9px] px-0.5 pointer-events-none">
                {isToday && (
                  <span className="text-[7px] font-black uppercase tracking-tighter bg-emerald-700 text-white px-1 rounded-sm leading-[9px] border border-black">
                    KINI
                  </span>
                )}
              </div>

              {/* Nomor tanggal */}
              <span className={`text-xs sm:text-sm leading-none tabular-nums font-black ${isToday ? 'underline decoration-2' : ''}`}>
                {format(dayDate, 'd')}
              </span>

              {/* Ikon SVG ibadah hari itu */}
              <div className="flex items-center justify-center gap-[2px] min-h-[11px] w-full pointer-events-none">
                {isCurrentMonth && isFullPrayer && <IconFardhu className="w-[11px] h-[11px]" />}
                {isCurrentMonth && hasPartialPrayer && (
                  <span className="text-[7.5px] font-black leading-none">{badge?.count}/5</span>
                )}
                {isCurrentMonth && badge?.hasDhuha && <IconDhuha className="w-[11px] h-[11px] text-amber-500" />}
                {isCurrentMonth && (badge?.hasTahajud || badge?.hasWitir) && <IconMalam className="w-[11px] h-[11px] text-indigo-500" />}
                {isCurrentMonth && badge?.hasQuran && <IconQuran className="w-[11px] h-[11px]" />}
                {isCurrentMonth && hasSchedule && !isFullPrayer && !hasPartialPrayer && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 border border-black inline-block" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-3 pt-2.5 border-t border-black/20 dark:border-slate-800 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10.5px] font-bold text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 border border-black inline-block" />Hari ini</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#6B8F6A] border border-[#2F4A2E] inline-block" />Lampau, 5 waktu lengkap</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#BFD3B8] border border-[#5E7F5C] inline-block" />Lampau, sebagian</div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#E3EADF] border border-[#B9C7B5] inline-block" />Lampau, belum tercatat</div>
        <div className="flex items-center gap-1.5"><IconFardhu className="w-3.5 h-3.5" />Fardu 5/5</div>
        <div className="flex items-center gap-1.5"><IconDhuha className="w-3.5 h-3.5 text-amber-500" />Dhuha</div>
        <div className="flex items-center gap-1.5"><IconMalam className="w-3.5 h-3.5 text-indigo-500" />Tahajud / Witir</div>
        <div className="flex items-center gap-1.5"><IconQuran className="w-3.5 h-3.5" />Tilawah</div>
      </div>
    </div>
  );
};

export default MonthlyCalendarGrid;
