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

          // Determine cell styling based on worship completeness
          let cellBgClass = 'bg-gray-50/70 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-800 dark:text-gray-200 border-transparent hover:border-gray-300';

          if (isSelected) {
            cellBgClass = 'bg-[#FCD34D] text-[#121212] font-black border-[1.5px] border-[#121212] shadow-[2px_2px_0px_#121212] z-10 scale-[1.02]';
          } else if (isToday) {
            cellBgClass = 'bg-emerald-600 text-white font-black border-[1.5px] border-emerald-800 shadow-xs';
          } else if (isCurrentMonth) {
            if (isFullPrayer && hasSunnah) {
              // Full 5 fardhu prayers + Dhuha/Sunnah: Rich green background with golden accent ring
              cellBgClass = 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-100 ring-1 ring-amber-400 shadow-xs';
            } else if (isFullPrayer) {
              // Full 5 fardhu prayers: Soft emerald background
              cellBgClass = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200';
            } else if (hasSunnah) {
              // Sunnah/Dhuha only
              cellBgClass = 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200';
            } else if (hasPartialPrayer) {
              // 1 to 4 fardhu prayers
              cellBgClass = 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/50 text-gray-800 dark:text-gray-200';
            } else if (hasSchedule) {
              // Only schedule / agenda
              cellBgClass = 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-gray-800 dark:text-gray-200';
            }
          } else {
            cellBgClass = 'text-gray-300 dark:text-gray-600 hover:text-gray-500';
          }

          return (
            <button
              key={dayStr}
              type="button"
              onClick={() => {
                playButtonTapSound();
                onSelectDate(dayStr);
              }}
              className={`relative h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all border ${cellBgClass} ${
                isFuture && !isSelected && !isToday ? 'opacity-70' : ''
              }`}
            >
              {/* Corner Star for Dhuha / Sunnah */}
              {hasSunnah && isCurrentMonth && !isSelected && !isToday && (
                <span 
                  className="absolute top-0.5 right-1 text-[8px] leading-none text-amber-500 font-extrabold select-none"
                  title="Salat Dhuha / Sunnah dikerjakan"
                >
                  ⭐
                </span>
              )}

              {/* Day Number */}
              <span className="text-xs sm:text-sm leading-none tabular-nums font-bold">
                {format(dayDate, 'd')}
              </span>

              {/* Status Indicator Dots */}
              <div className="flex items-center justify-center gap-0.5 mt-1 h-1.5">
                {isFullPrayer && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-700' : isToday ? 'bg-white' : 'bg-emerald-500'}`} />
                )}
                {hasPartialPrayer && (
                  <span className={`text-[8.5px] leading-none font-bold tabular-nums ${isSelected ? 'text-[#121212]' : isToday ? 'text-white' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {badge?.count}/5
                  </span>
                )}
                {badge?.hasQuran && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-900' : isToday ? 'bg-amber-200' : 'bg-indigo-500'}`} title="Tilawah Al-Qur'an" />
                )}
                {hasSchedule && (
                  <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-800' : isToday ? 'bg-white' : 'bg-blue-500'}`} title="Ada agenda kuliah" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend Information below grid */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-y-1 gap-x-3 text-[10px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-400 inline-block" />
          <span>Fardhu Lengkap (5/5)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]">⭐</span>
          <span>Dhuha / Sunnah</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
          <span>Tilawah</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
          <span>Kuliah/Agenda</span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCalendarGrid;
