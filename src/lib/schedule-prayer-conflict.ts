import { Schedule, PrayerConflictInfo } from '../types';

/**
 * Converts HH:mm time string to minutes from midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Checks if a specific schedule time interval conflicts with today's 5 prayer times.
 */
export function checkSchedulePrayerConflicts(
  schedule: Partial<Schedule>,
  prayerTimes: Record<string, string>
): PrayerConflictInfo[] {
  if (!schedule.startTime || !schedule.endTime || !prayerTimes) {
    return [];
  }

  const schedStart = timeToMinutes(schedule.startTime);
  const schedEnd = timeToMinutes(schedule.endTime);

  // If start is after end (overnight), adjust
  const effectiveEnd = schedEnd < schedStart ? schedEnd + 24 * 60 : schedEnd;

  const relevantPrayers = [
    { key: 'Subuh', label: 'Subuh', bufferBefore: 15, bufferAfter: 20 },
    { key: 'Dzuhur', altKey: 'Zuhur', label: 'Dzuhur', bufferBefore: 15, bufferAfter: 30 },
    { key: 'Ashar', altKey: 'Asar', label: 'Ashar', bufferBefore: 15, bufferAfter: 30 },
    { key: 'Maghrib', label: 'Maghrib', bufferBefore: 10, bufferAfter: 25 },
    { key: 'Isya', altKey: "Isya'", label: 'Isya', bufferBefore: 15, bufferAfter: 30 },
  ];

  const conflicts: PrayerConflictInfo[] = [];

  for (const prayer of relevantPrayers) {
    const rawTime = prayerTimes[prayer.key] || (prayer.altKey ? prayerTimes[prayer.altKey] : null);
    if (!rawTime) continue;

    const pMinutes = timeToMinutes(rawTime);

    // Check direct overlap: prayer time is between schedule start and end
    const isDirectOverlap = pMinutes >= schedStart && pMinutes <= effectiveEnd;

    // Check approaching conflict: schedule starts within buffer minutes after prayer time or ends right before
    const isApproaching = (
      (schedStart >= pMinutes && schedStart <= pMinutes + prayer.bufferAfter) ||
      (schedEnd >= pMinutes - prayer.bufferBefore && schedEnd <= pMinutes)
    );

    if (isDirectOverlap || isApproaching) {
      let suggestion = '';
      if (prayer.label === 'Dzuhur') {
        suggestion = `Waktu Dzuhur (${rawTime}) masuk di tengah jadwal. Disarankan salat berjamaah di mushola kampus segera sebelum atau setelah sesi berakhir (jam ${schedule.endTime}).`;
      } else if (prayer.label === 'Ashar') {
        suggestion = `Waktu Ashar (${rawTime}) bertepatan dengan aktivitas. Manfaatkan jeda 10-15 menit untuk salat tepat waktu di sela perkuliahan/tugas.`;
      } else if (prayer.label === 'Maghrib') {
        suggestion = `Waktu Maghrib (${rawTime}) sangat singkat. Sangat dianjurkan izin jeda sejenak untuk menunaikan salat sebelum melanjutkan kegiatan malam.`;
      } else if (prayer.label === 'Subuh') {
        suggestion = `Aktivitas dimulai menjelang/saat Subuh (${rawTime}). Pastikan menunaikan salat Subuh terlebih dahulu sebelum berangkat.`;
      } else {
        suggestion = `Waktu salat ${prayer.label} (${rawTime}) berdekatan dengan jadwal (${schedule.startTime} - ${schedule.endTime}). Rencanakan jeda ibadah di awal waktu.`;
      }

      conflicts.push({
        prayerName: prayer.label,
        prayerTime: rawTime,
        scheduleTitle: schedule.title || 'Aktivitas Kuliah',
        scheduleStartTime: schedule.startTime,
        scheduleEndTime: schedule.endTime,
        conflictType: isDirectOverlap ? 'overlap' : 'approaching',
        suggestion
      });
    }
  }

  return conflicts;
}

/**
 * Scan all schedules for a given date and returns a list of conflicts with prayer times
 */
export function getAllScheduleConflicts(
  schedules: Schedule[],
  prayerTimes: Record<string, string>
): Array<{ schedule: Schedule; conflicts: PrayerConflictInfo[] }> {
  return schedules
    .map(schedule => ({
      schedule,
      conflicts: checkSchedulePrayerConflicts(schedule, prayerTimes)
    }))
    .filter(item => item.conflicts.length > 0);
}
