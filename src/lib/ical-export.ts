import { Schedule, PrayerConflictInfo } from '../types';
import { checkSchedulePrayerConflicts } from './schedule-prayer-conflict';

function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function formatDateToICS(dateStr: string, timeStr: string): string {
  // dateStr is YYYY-MM-DD, timeStr is HH:mm
  const [yyyy, mm, dd] = dateStr.split('-');
  const [hh, min] = timeStr.split(':');
  return `${yyyy}${mm}${dd}T${hh}${min}00`;
}

/**
 * Generate iCalendar (.ics) content for schedules with prayer conflict buffer info
 */
export function generateICSContent(
  schedules: Schedule[],
  prayerTimes: Record<string, string>
): string {
  const now = new Date();
  const dtStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  let icsString = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WaktuIbadah//Jadwal Kuliah & Shalat Mahasiswa//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Jadwal Kuliah Bebas Bentrok Salat',
    'X-WR-TIMEZONE:Asia/Jakarta'
  ];

  schedules.forEach((schedule) => {
    const conflicts = Object.keys(prayerTimes).length > 0 
      ? checkSchedulePrayerConflicts(schedule, prayerTimes)
      : [];
    const hasConflict = conflicts.length > 0;

    const dtStart = formatDateToICS(schedule.date, schedule.startTime);
    const dtEnd = formatDateToICS(schedule.date, schedule.endTime);

    let summary = `[${schedule.category}] ${schedule.title}`;
    if (hasConflict) {
      summary += ` (⚠️ Jeda ${conflicts.map(c => c.prayerName).join('/')})`;
    }

    let description = `Aktivitas: ${schedule.title}\\nKategori: ${schedule.category}\\nWaktu: ${schedule.startTime} - ${schedule.endTime}`;
    if (hasConflict) {
      description += `\\n\\n⚠️ PERINGATAN BENTROK WAKTU SALAT:\\n`;
      conflicts.forEach(c => {
        description += `• ${c.prayerName} (${c.prayerTime}): ${c.suggestion}\\n`;
      });
      description += `\\nDisarankan berkoordinasi untuk jeda wudu dan salat tepat waktu.`;
    }

    icsString.push(
      'BEGIN:VEVENT',
      `UID:${schedule.id}@waktuibadah.app`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${description.replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      // 15 min reminder alarm
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Pengingat ${schedule.title}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  icsString.push('END:VCALENDAR');
  return icsString.join('\r\n');
}

/**
 * Trigger download of .ics file to user's device
 */
export function downloadICSFile(schedules: Schedule[], prayerTimes: Record<string, string>, filename: string = 'jadwal-kuliah-waktuibadah.ics') {
  const content = generateICSContent(schedules, prayerTimes);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar Web URL for individual schedule
 */
export function generateGoogleCalendarUrl(
  schedule: Schedule,
  conflicts: PrayerConflictInfo[] = []
): string {
  const dtStart = formatDateToICS(schedule.date, schedule.startTime);
  const dtEnd = formatDateToICS(schedule.date, schedule.endTime);

  let title = `[${schedule.category}] ${schedule.title}`;
  if (conflicts.length > 0) {
    title += ` (⚠️ Jeda ${conflicts.map(c => c.prayerName).join('/')})`;
  }

  let details = `Mata Kuliah / Aktivitas: ${schedule.title}\nKategori: ${schedule.category}\nJam: ${schedule.startTime} - ${schedule.endTime}`;
  if (conflicts.length > 0) {
    details += `\n\n⚠️ Pengingat Jeda Salat:\n` + conflicts.map(c => `• ${c.prayerName} (${c.prayerTime}): ${c.suggestion}`).join('\n');
  }

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${dtStart}/${dtEnd}`,
    details: details,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
