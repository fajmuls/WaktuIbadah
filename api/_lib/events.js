// Logika murni (tanpa jaringan/database) untuk menentukan notifikasi apa saja
// yang harus dikirim pada hari tertentu. Mudah diuji: lihat scripts/test-events.mjs

import { addDaysYmd, hhmmToMinutes, localToUtcMs, weekdayOfYmd } from './time.js';

const safeId = (id) => String(id ?? '').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60);

export const PRAYERS = ['Subuh', 'Zuhur', 'Asar', 'Magrib', 'Isya'];

/** Toleransi keterlambatan cron (menit). Lewat dari ini, notifikasi dilewati. */
export const GRACE_MINUTES = 5;

export const DEFAULT_PREFS = {
  prayers: true,
  imsak: false,
  puasa: true,
  schedule: true,
  deadlines: true,
  preMinutes: 10, // 0 = matikan pengingat sebelum waktu salat
  scheduleLeadMinutes: 10,
  silent: false, // true = tanpa suara & getar
  reminderType: 'sound_and_vibrate',
};

export function normalizePrefs(raw) {
  const p = { ...DEFAULT_PREFS, ...(raw && typeof raw === 'object' ? raw : {}) };
  const clampInt = (v, min, max, fallback) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  return {
    prayers: p.prayers !== false,
    imsak: p.imsak === true,
    puasa: p.puasa !== false,
    schedule: p.schedule !== false,
    deadlines: p.deadlines !== false,
    preMinutes: clampInt(p.preMinutes, 0, 60, 10),
    scheduleLeadMinutes: clampInt(p.scheduleLeadMinutes, 0, 120, 10),
    silent: p.silent === true,
    reminderType: ['sound_and_vibrate', 'sound_only', 'vibrate_only'].includes(p.reminderType)
      ? p.reminderType
      : 'sound_and_vibrate',
  };
}

function vibrationFor(prefs, kind) {
  if (prefs.reminderType === 'sound_only') return undefined; // pakai getar bawaan sistem
  return kind === 'prayer' ? [800, 300, 800, 300, 1200] : [300, 150, 300];
}

function makePayload(prefs, base) {
  const payload = { url: '/', ...base, silent: prefs.silent === true };
  const vib = vibrationFor(prefs, base.kind);
  if (vib) payload.vibrate = vib;
  return payload;
}

function isPuasaTomorrow(tomorrowYmd, tomorrowHijriDay) {
  const wd = weekdayOfYmd(tomorrowYmd); // 1 = Senin, 4 = Kamis
  if (wd === 1) return { name: 'Puasa Sunnah Hari Senin', desc: 'Besok adalah hari Senin. Niatkan puasa sunnah malam ini dan siapkan sahur.' };
  if (wd === 4) return { name: 'Puasa Sunnah Hari Kamis', desc: 'Besok adalah hari Kamis. Niatkan puasa sunnah malam ini dan siapkan sahur.' };
  if ([13, 14, 15].includes(Number(tomorrowHijriDay))) {
    return { name: `Puasa Ayyamul Bidh (${tomorrowHijriDay} Hijriyah)`, desc: 'Besok puasa sunnah Ayyamul Bidh. Siapkan sahur.' };
  }
  return null;
}

/**
 * Bangun daftar seluruh notifikasi untuk satu hari lokal.
 * @param {object} sub  dokumen langganan (prefs, schedules, tasks, tz)
 * @param {string} ymd  tanggal lokal "YYYY-MM-DD"
 * @param {{times:Record<string,string>, imsak?:string}} day  waktu salat hari itu
 * @param {{tomorrowHijriDay?: number|string}} [extra]
 * @returns {Array<{key:string, atMs:number, payload:object}>}
 */
export function buildDayEvents(sub, ymd, day, extra = {}) {
  const tz = sub.tz;
  const prefs = normalizePrefs(sub.prefs);
  const events = [];
  const push = (key, minutes, payload) => {
    if (minutes == null || minutes < 0 || minutes >= 24 * 60) return;
    events.push({ key: `${ymd}:${key}`, atMs: localToUtcMs(ymd, minutes, tz), payload: makePayload(prefs, payload) });
  };

  // 1. Waktu salat + pengingat sebelum waktu salat
  if (prefs.prayers && day?.times) {
    for (const name of PRAYERS) {
      const hhmm = day.times[name];
      const min = hhmmToMinutes(hhmm);
      if (min == null) continue;
      push(`prayer:${name}`, min, {
        kind: 'prayer',
        prayer: name,
        title: `Waktu Salat ${name} Telah Tiba`,
        body: `Allahu Akbar! Saatnya menunaikan salat ${name} (${hhmm}).`,
        tag: `prayer-${name}`,
        url: '/ibadah',
        requireInteraction: true,
      });
      if (prefs.preMinutes > 0) {
        push(`pre:${name}`, min - prefs.preMinutes, {
          kind: 'pre',
          prayer: name,
          title: `${prefs.preMinutes} menit lagi masuk waktu ${name}`,
          body: `Bersiap-siap untuk salat ${name} (${hhmm}). Ambil wudu dan sempurnakan persiapan.`,
          tag: `pre-${name}`,
          url: '/ibadah',
        });
      }
    }
  }

  // 2. Imsak
  if (prefs.imsak && day?.imsak) {
    push('imsak', hhmmToMinutes(day.imsak), {
      kind: 'imsak',
      title: 'Waktu Imsak Telah Tiba',
      body: `Waktu Imsak (${day.imsak}). Segera selesaikan santap sahur sebelum azan Subuh.`,
      tag: 'imsak',
    });
  }

  // 3. Puasa sunnah (pukul 20:00 untuk esok hari)
  if (prefs.puasa) {
    const info = isPuasaTomorrow(addDaysYmd(ymd, 1), extra.tomorrowHijriDay);
    if (info) {
      push('puasa', 20 * 60, {
        kind: 'puasa',
        title: 'Pengingat Puasa Sunnah',
        body: `${info.name}. ${info.desc}`,
        tag: 'puasa',
      });
    }
  }

  // 4. Jadwal kuliah/aktivitas
  if (prefs.schedule && Array.isArray(sub.schedules)) {
    for (const s of sub.schedules) {
      if (!s || s.date !== ymd || s.completed) continue;
      const start = hhmmToMinutes(s.startTime);
      if (start == null) continue;
      const title = String(s.title || 'Jadwal').slice(0, 80);
      if (prefs.scheduleLeadMinutes > 0) {
        push(`sch-pre:${safeId(s.id)}`, start - prefs.scheduleLeadMinutes, {
          kind: 'schedule',
          title: `Sebentar lagi: ${title}`,
          body: `Dimulai ${prefs.scheduleLeadMinutes} menit lagi (${s.startTime}).`,
          tag: `sch-pre-${safeId(s.id)}`,
          url: '/jadwal',
        });
      }
      push(`sch:${safeId(s.id)}`, start, {
        kind: 'schedule',
        title: `Jadwal dimulai: ${title}`,
        body: `Aktivitas ${title} dimulai sekarang (${s.startTime}).`,
        tag: `sch-${safeId(s.id)}`,
        url: '/jadwal',
      });
    }
  }

  // 5. Tenggat tugas
  if (prefs.deadlines && Array.isArray(sub.tasks)) {
    for (const t of sub.tasks) {
      if (!t || t.deadline !== ymd || t.status === 'Selesai') continue;
      const title = String(t.title || 'Tugas').slice(0, 80);
      push(`task-day:${safeId(t.id)}`, 7 * 60, {
        kind: 'task',
        title: `Tenggat hari ini: ${title}`,
        body: `Tugas ini berakhir hari ini pukul ${t.deadlineTime || '23:59'}.`,
        tag: `task-day-${safeId(t.id)}`,
        url: '/tugas',
      });
      const dl = hhmmToMinutes(t.deadlineTime || '23:59');
      if (dl != null && dl - 60 > 7 * 60) {
        push(`task-1h:${safeId(t.id)}`, dl - 60, {
          kind: 'task',
          title: `1 jam lagi tenggat: ${title}`,
          body: `Segera selesaikan sebelum ${t.deadlineTime || '23:59'}.`,
          tag: `task-1h-${safeId(t.id)}`,
          url: '/tugas',
        });
      }
    }
  }

  events.sort((a, b) => a.atMs - b.atMs);
  return events;
}

/** Event yang jatuh tempo sekarang (belum terkirim, masih dalam toleransi). */
export function pickDue(events, sent, nowMs, graceMin = GRACE_MINUTES) {
  const already = sent || {};
  return events.filter(
    (e) => e.atMs <= nowMs && nowMs - e.atMs <= graceMin * 60000 && !already[e.key]
  );
}

/** Waktu (ms) paling awal kapan langganan ini perlu diproses lagi. */
export function computeNextRunAt(events, sent, nowMs, ymd, tz, graceMin = GRACE_MINUTES) {
  const already = sent || {};
  let next = null;
  for (const e of events) {
    if (already[e.key]) continue;
    // Yang masih dalam toleransi atau akan datang dihitung
    if (e.atMs + graceMin * 60000 < nowMs) continue;
    if (next == null || e.atMs < next) next = e.atMs;
  }
  // Bangun lagi tepat lewat tengah malam (data hari baru) bila tak ada event lagi
  const nextMidnight = localToUtcMs(addDaysYmd(ymd, 1), 2, tz); // 00:02 esok hari
  if (next == null || next > nextMidnight) next = nextMidnight;
  return next;
}
