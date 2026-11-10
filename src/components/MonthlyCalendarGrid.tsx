import React, { useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths 
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';
import { playButtonTapSound } from '../lib/audio';

export interface CalendarDayBadge {
  count?: number;        // Jumlah fardhu selesai (0..5)
  isAllDone?: boolean;    // 5 fardhu selesai penuh
  hasSunnah?: boolean;    // Ada salat sunnah dikerjakan
  hasDhuha?: boolean;     // Ada salat Dhuha dikerjakan
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

          // Determine cell styling based on date type and worship completeness
          const isPast = dayStr < todayStr;
          let cellBgClass = 'bg-[#F4F7F2] dark:bg-slate-900/60 border-black/20 text-gray-700 dark:text-gray-300';

          if (isCurrentMonth) {
            if (isFullPrayer && hasSunnah) {
              // Full 5 fardhu + Dhuha/Sunnah: Rich Zamrud Green with Gold ring
              cellBgClass = 'bg-emerald-600 dark:bg-emerald-600 text-white font-black border-[1.5px] border-black shadow-[1.5px_1.5px_0px_#121212] ring-2 ring-amber-400';
            } else if (isFullPrayer) {
              // Full 5 fardhu: Emerald Green
              cellBgClass = 'bg-emerald-500 dark:bg-emerald-600 text-white font-extrabold border-[1.5px] border-black shadow-[1.5px_1.5px_0px_#121212]';
            } else if (hasSunnah) {
              // Sunnah/Dhuha only
              cellBgClass = 'bg-amber-200 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 font-bold border-[1.5px] border-black shadow-[1.5px_1.5px_0px_#121212]';
            } else if (hasPartialPrayer) {
              // 1 to 4 fardhu prayers
              cellBgClass = 'bg-emerald-200/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 font-bold border-[1.5px] border-black/80 shadow-[1px_1px_0px_#121212]';
            } else if (hasSchedule) {
              // Only schedule / agenda
              cellBgClass = 'bg-sky-100 dark:bg-sky-950/60 text-sky-950 dark:text-sky-100 font-semibold border-[1.5px] border-black/60 shadow-[1px_1px_0px_#121212]';
            } else if (isPast) {
              // Past day without prayers recorded: Muted Sage Warm box (not stark white)
              cellBgClass = 'bg-[#E5EBE3] dark:bg-slate-800/80 text-gray-600 dark:text-gray-400 border-[1.5px] border-black/40';
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
              className={`relative h-11 sm:h-12 rounded-xl flex flex-col items-center justify-between p-1 transition-all ${cellBgClass} ${borderStateClass} ${
                isFuture && !isSelected && !isToday ? 'opacity-80' : ''
              }`}
            >
              {/* Header row inside cell: Today pill on left, Sunnah star on right */}
              <div className="w-full flex items-center justify-between min-h-[10px] px-0.5 pointer-events-none">
                {isToday ? (
                  <span className="text-[7.5px] font-black uppercase tracking-tighter bg-emerald-600 text-white px-1 py-0.2 rounded-sm shadow-xs leading-none border border-black">
                    KINI
                  </span>
                ) : <span />}

                {hasSunnah && isCurrentMonth && (
                  <span 
                    className="text-[10px] leading-none text-amber-400 font-black select-none filter drop-shadow-[0.5px_0.5px_0px_#000]"
                    title="Salat Dhuha / Sunnah dikerjakan"
                  >
                    ⭐
                  </span>
                )}
              </div>

              {/* Day Number */}
              <span className={`text-xs sm:text-sm leading-none tabular-nums font-black ${
                isToday ? 'underline decoration-2' : ''
              }`}>
                {format(dayDate, 'd')}
              </span>

              {/* Status Indicator Badges & Dots */}
              <div className="flex items-center justify-center gap-0.5 min-h-[11px] w-full pointer-events-none">
                {isFullPrayer && (
                  <span className="text-[7.5px] font-black leading-none bg-black text-emerald-300 px-1 py-0.2 rounded-xs">
                    5/5 ✓
                  </span>
                )}
                {hasPartialPrayer && (
                  <span className="text-[7.5px] font-bold leading-none bg-black/10 dark:bg-white/20 text-current px-0.5 rounded-xs">
                    {badge?.count}/5
                  </span>
                )}
                {badge?.hasQuran && (
                  <span className="text-[8.5px] leading-none" title="Tilawah Al-Qur'an tercatat">
                    📖
                  </span>
                )}
                {hasSchedule && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 border border-black inline-block" title="Ada jadwal agenda" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend Information below grid */}
      <div className="mt-3 pt-2.5 border-t border-black/20 dark:border-slate-800 flex flex-wrap items-center justify-between gap-y-1.5 gap-x-3 text-[10.5px] font-bold text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-black inline-block shadow-xs" />
          <span>Fardhu Lengkap (5/5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-200 border border-black inline-block shadow-xs" />
          <span>Fardhu Parsial (1-4/5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-[#E5EBE3] border border-black/50 inline-block shadow-xs" />
          <span>Hari Terlewat</span>
        </div>
        <div className="flex items-center gap-1">
          <span>⭐</span>
          <span>Dhuha / Sunnah</span>
        </div>
        <div className="flex items-center gap-1">
          <span>📖</span>
          <span>Tilawah</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 border border-black inline-block" />
          <span>Agenda</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendarGrid;
