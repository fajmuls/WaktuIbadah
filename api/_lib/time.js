// Helper zona waktu tanpa dependensi (memakai Intl bawaan Node).

export const DEFAULT_TZ = 'Asia/Jakarta';

export function safeTz(tz) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

/** Pecah waktu UTC (ms/Date) menjadi komponen waktu lokal di zona `tz`. */
export function localParts(input, tz) {
  const d = input instanceof Date ? input : new Date(input);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: safeTz(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const y = get('year');
  const m = get('month');
  const day = get('day');
  const h = get('hour');
  const min = get('minute');
  const s = get('second');
  const ymd = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  // Hari dalam minggu (0=Minggu) dihitung dari tanggal lokal
  const weekday = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return { y, m, d: day, h, min, s, ymd, minutes: h * 60 + min, weekday };
}

function tzOffsetMs(utcMs, tz) {
  const p = localParts(utcMs, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - utcMs;
}

/** Ubah (tanggal lokal, menit sejak 00:00) menjadi epoch ms UTC. */
export function localToUtcMs(ymd, minutes, tz) {
  const [y, m, d] = ymd.split('-').map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, minutes);
  const off1 = tzOffsetMs(naive, tz);
  let utc = naive - off1;
  const off2 = tzOffsetMs(utc, tz);
  if (off2 !== off1) utc = naive - off2;
  return utc;
}

/** "HH:mm" -> menit sejak 00:00 (null bila tidak valid). */
export function hhmmToMinutes(hhmm) {
  if (typeof hhmm !== 'string') return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

export function addDaysYmd(ymd, days) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function weekdayOfYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
