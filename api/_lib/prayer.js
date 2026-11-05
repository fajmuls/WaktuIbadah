// Mengambil jadwal salat (data MyQuran/Kemenag) di sisi server, dengan cache
// di memori + Firestore supaya tidak menembak API setiap menit.

const MYQURAN = 'https://api.myquran.com/v2';
const mem = new Map();

async function fetchJson(url, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} dari ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** @returns {Promise<{times:Record<string,string>, imsak:string}>} */
export async function getDayTimes(db, cityId, ymd) {
  const id = String(cityId || '1301');
  const key = `${id}_${ymd}`;
  if (mem.has(key)) return mem.get(key);

  const ref = db.collection('prayer_cache').doc(key);
  const cached = await ref.get();
  if (cached.exists) {
    const v = cached.data();
    mem.set(key, v);
    return v;
  }

  const [y, m, d] = ymd.split('-');
  const json = await fetchJson(`${MYQURAN}/sholat/jadwal/${id}/${y}/${m}/${d}`);
  const j = json?.data?.jadwal;
  if (!json?.status || !j) throw new Error('Format jadwal MyQuran tidak valid');

  const value = {
    times: { Subuh: j.subuh, Zuhur: j.dzuhur, Asar: j.ashar, Magrib: j.maghrib, Isya: j.isya },
    imsak: j.imsak || null,
    fetchedAt: Date.now(),
  };
  mem.set(key, value);
  await ref.set(value).catch(() => {});
  return value;
}

/** Tanggal Hijriah (angka hari) untuk tanggal Masehi tertentu. */
export async function getHijriDay(db, ymd) {
  const key = `hijri_${ymd}`;
  if (mem.has(key)) return mem.get(key).day;

  const ref = db.collection('prayer_cache').doc(key);
  const cached = await ref.get();
  if (cached.exists) {
    mem.set(key, cached.data());
    return cached.data().day;
  }

  const json = await fetchJson(`${MYQURAN}/cal/hijr/${ymd}`);
  const text = json?.data?.date?.[1];
  const day = parseInt(String(text || '').split(' ')[0], 10);
  if (!Number.isFinite(day)) throw new Error('Format tanggal Hijriah tidak valid');
  const value = { day, raw: text, fetchedAt: Date.now() };
  mem.set(key, value);
  await ref.set(value).catch(() => {});
  return day;
}
