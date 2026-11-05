// Uji logika penjadwalan notifikasi (tanpa jaringan). Jalankan: node scripts/test-events.mjs
import assert from 'node:assert/strict';
import { buildDayEvents, pickDue, computeNextRunAt, normalizePrefs } from '../api/_lib/events.js';
import { localParts, localToUtcMs, hhmmToMinutes } from '../api/_lib/time.js';

let passed = 0;
const t = (name, fn) => { fn(); passed++; console.log('  ok -', name); };

const day = { times: { Subuh: '04:35', Zuhur: '11:55', Asar: '15:12', Magrib: '17:58', Isya: '19:08' }, imsak: '04:25' };
const sub = {
  tz: 'Asia/Jakarta',
  prefs: { preMinutes: 10, imsak: true, silent: false },
  schedules: [{ id: 's1', title: 'Kalkulus', date: '2026-11-05', startTime: '08:00' }],
  tasks: [{ id: 't1', title: 'Laporan', deadline: '2026-11-05', deadlineTime: '23:00', status: 'Belum mulai' }],
};

t('konversi zona waktu WIB (UTC+7)', () => {
  const ms = localToUtcMs('2026-11-05', hhmmToMinutes('04:35'), 'Asia/Jakarta');
  assert.equal(new Date(ms).toISOString(), '2026-11-04T21:35:00.000Z');
  const p = localParts(ms, 'Asia/Jakarta');
  assert.equal(p.ymd, '2026-11-05'); assert.equal(p.minutes, 4 * 60 + 35);
});

t('zona waktu WITA (UTC+8) berbeda 1 jam dari WIB', () => {
  const wib = localToUtcMs('2026-11-05', 12 * 60, 'Asia/Jakarta');
  const wita = localToUtcMs('2026-11-05', 12 * 60, 'Asia/Makassar');
  assert.equal(wib - wita, 3600000);
});

const events = buildDayEvents(sub, '2026-11-05', day, { tomorrowHijriDay: 14 });

t('membuat 5 salat + 5 pengingat + imsak + puasa + jadwal(2) + tugas(2)', () => {
  const kinds = events.map((e) => e.payload.kind);
  assert.equal(kinds.filter((k) => k === 'prayer').length, 5);
  assert.equal(kinds.filter((k) => k === 'pre').length, 5);
  assert.equal(kinds.filter((k) => k === 'imsak').length, 1);
  assert.equal(kinds.filter((k) => k === 'puasa').length, 1); // besok 6 Nov 2026 = Jumat, tapi hijriah 14 -> Ayyamul Bidh
  assert.equal(kinds.filter((k) => k === 'schedule').length, 2);
  assert.equal(kinds.filter((k) => k === 'task').length, 2);
});

t('azan Subuh jatuh tempo pada menit yang tepat, tidak sebelum/sesudah toleransi', () => {
  const subuh = events.find((e) => e.key === '2026-11-05:prayer:Subuh');
  assert.equal(pickDue(events, {}, subuh.atMs - 1000).some((e) => e.key === subuh.key), false);
  assert.equal(pickDue(events, {}, subuh.atMs).some((e) => e.key === subuh.key), true);
  assert.equal(pickDue(events, {}, subuh.atMs + 4 * 60000).some((e) => e.key === subuh.key), true);
  assert.equal(pickDue(events, {}, subuh.atMs + 6 * 60000).some((e) => e.key === subuh.key), false);
});

t('tidak mengirim dua kali (dedup lewat sent)', () => {
  const subuh = events.find((e) => e.key === '2026-11-05:prayer:Subuh');
  assert.equal(pickDue(events, { [subuh.key]: 1 }, subuh.atMs).some((e) => e.key === subuh.key), false);
});

t('nextRunAt menunjuk event berikutnya, lalu tengah malam bila habis', () => {
  const now = localToUtcMs('2026-11-05', 4 * 60 + 36, 'Asia/Jakarta');
  const sent = Object.fromEntries(events.filter((e) => e.atMs <= now).map((e) => [e.key, 1]));
  const next = computeNextRunAt(events, sent, now, '2026-11-05', 'Asia/Jakarta');
  assert.equal(localParts(next, 'Asia/Jakarta').minutes, 7 * 60); // pengingat tenggat tugas 07:00 (lebih awal dari Kalkulus 07:50)
  const late = localToUtcMs('2026-11-05', 23 * 60 + 30, 'Asia/Jakarta');
  const sentAll = Object.fromEntries(events.map((e) => [e.key, 1]));
  const nm = computeNextRunAt(events, sentAll, late, '2026-11-05', 'Asia/Jakarta');
  const p = localParts(nm, 'Asia/Jakarta');
  assert.equal(p.ymd, '2026-11-06'); assert.equal(p.minutes, 2);
});

t('prefs silent=true => payload silent, tanpa getar bawaan dibatalkan oleh SW', () => {
  const s = buildDayEvents({ ...sub, prefs: { silent: true } }, '2026-11-05', day);
  assert.ok(s.every((e) => e.payload.silent === true));
});

t('prefs prayers=false => tidak ada notifikasi salat', () => {
  const s = buildDayEvents({ ...sub, prefs: { prayers: false } }, '2026-11-05', day);
  assert.equal(s.filter((e) => e.payload.kind === 'prayer').length, 0);
});

t('normalizePrefs membatasi nilai tidak wajar', () => {
  const p = normalizePrefs({ preMinutes: 9999, scheduleLeadMinutes: -5, reminderType: 'aneh' });
  assert.equal(p.preMinutes, 60); assert.equal(p.scheduleLeadMinutes, 0); assert.equal(p.reminderType, 'sound_and_vibrate');
});

console.log(`\n${passed} tes lulus.`);
