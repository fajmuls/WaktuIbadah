// Pengirim notifikasi: dipanggil tiap menit oleh /api/cron/dispatch.
// Hanya membaca langganan yang `nextRunAt`-nya sudah tiba (hemat kuota Firestore).

import webpush from 'web-push';
import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from './firebase.js';
import { getDayTimes, getHijriDay } from './prayer.js';
import { buildDayEvents, pickDue, computeNextRunAt, normalizePrefs } from './events.js';
import { addDaysYmd, localParts, safeTz } from './time.js';

const COLLECTION = 'push_subscriptions';
const FAR_FUTURE = 8.64e15 - 1;
let vapidReady = false;

export function setupWebPush() {
  if (vapidReady) return;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY belum diatur di Vercel.');
  }
  webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:admin@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidReady = true;
}

export function toPushSubscription(data) {
  return { endpoint: data.endpoint, keys: { p256dh: data.keys?.p256dh, auth: data.keys?.auth } };
}

/** Kirim satu payload. Mengembalikan { ok, gone, error }. */
export async function sendOne(data, payload) {
  try {
    await webpush.sendNotification(toPushSubscription(data), JSON.stringify(payload), {
      TTL: payload.kind === 'prayer' ? 900 : 600,
      urgency: payload.kind === 'prayer' ? 'high' : 'normal',
    });
    return { ok: true };
  } catch (err) {
    const status = err?.statusCode;
    return { ok: false, gone: status === 404 || status === 410, error: `${status || ''} ${err?.body || err?.message || err}`.trim() };
  }
}

async function loadDay(db, data, ymd, prefs) {
  let day = null;
  try {
    day = await getDayTimes(db, data.cityId, ymd);
  } catch (e) {
    if (data.lastTimes?.ymd === ymd) day = data.lastTimes.day; // cadangan bila API down
  }
  let tomorrowHijriDay;
  if (prefs.puasa) {
    try {
      tomorrowHijriDay = await getHijriDay(db, addDaysYmd(ymd, 1));
    } catch {
      /* Senin/Kamis tetap jalan tanpa data Hijriah */
    }
  }
  return { day, tomorrowHijriDay };
}

/** Proses satu dokumen langganan. */
export async function processSub(db, doc, nowMs) {
  const ref = doc.ref;
  const data = doc.data();
  const out = { sent: 0, failed: 0, removed: false };

  if (data.enabled === false) {
    await ref.update({ nextRunAt: FAR_FUTURE });
    return out;
  }

  const tz = safeTz(data.tz);
  const ymd = localParts(nowMs, tz).ymd;
  const prefs = normalizePrefs(data.prefs);
  const { day, tomorrowHijriDay } = await loadDay(db, data, ymd, prefs);

  if (!day && prefs.prayers) {
    // Jadwal salat belum bisa diambil: coba lagi 3 menit lagi
    await ref.update({ nextRunAt: nowMs + 3 * 60000 });
    return out;
  }

  const events = buildDayEvents({ ...data, tz }, ymd, day, { tomorrowHijriDay }).filter(
    (e) => e.atMs >= (data.joinedAt || 0) // jangan kirim yang sudah lewat sebelum berlangganan
  );
  const due = pickDue(events, data.sent, nowMs);

  // Klaim dulu (transaksi) supaya dua proses cron yang tumpang-tindih tidak mengirim ganda
  let claimed = [];
  if (due.length) {
    claimed = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(ref);
      if (!fresh.exists) return [];
      const current = fresh.data().sent || {};
      const todo = due.filter((e) => !current[e.key]);
      if (!todo.length) return [];
      const kept = Object.fromEntries(Object.entries(current).filter(([k]) => k.startsWith(`${ymd}:`)));
      for (const e of todo) kept[e.key] = nowMs;
      tx.update(ref, { sent: kept });
      return todo;
    });
  }

  const sentNow = { ...(data.sent || {}) };
  for (const e of claimed) sentNow[e.key] = nowMs;
  const release = [];

  for (const e of claimed) {
    const r = await sendOne(data, e.payload);
    if (r.ok) {
      out.sent++;
    } else if (r.gone) {
      await ref.delete(); // langganan sudah tidak berlaku (pengguna mencabut izin / uninstall)
      out.removed = true;
      return out;
    } else {
      out.failed++;
      release.push(e.key);
      delete sentNow[e.key];
      console.warn('[push] gagal kirim', data.userName, e.key, r.error);
    }
  }

  const update = {
    nextRunAt: computeNextRunAt(events, sentNow, nowMs, ymd, tz),
    lastDispatchAt: nowMs,
    lastTimes: day ? { ymd, day } : data.lastTimes || null,
  };
  if (out.sent) {
    update.lastSentAt = nowMs;
    update.sentCount = FieldValue.increment(out.sent);
  }
  if (release.length) {
    // lepas klaim supaya dicoba lagi pada menit berikut (selama masih dalam toleransi)
    const patch = {};
    for (const k of release) patch[`sent.${k}`] = FieldValue.delete();
    update.failCount = FieldValue.increment(release.length);
    Object.assign(update, patch);
    update.nextRunAt = nowMs + 60000;
  }
  await ref.update(update);
  return out;
}

async function pool(items, size, worker) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await worker(items[idx]);
      } catch (e) {
        console.error('[push] error proses langganan', items[idx]?.id, e);
        results[idx] = { sent: 0, failed: 1, removed: false, error: String(e?.message || e) };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

export async function runDispatch({ nowMs = Date.now(), limit = 300 } = {}) {
  setupWebPush();
  const db = getDb();
  const snap = await db.collection(COLLECTION).where('nextRunAt', '<=', nowMs).limit(limit).get();
  const results = await pool(snap.docs, 8, (doc) => processSub(db, doc, nowMs));
  return {
    checked: snap.size,
    sent: results.reduce((a, r) => a + (r?.sent || 0), 0),
    failed: results.reduce((a, r) => a + (r?.failed || 0), 0),
    removed: results.filter((r) => r?.removed).length,
  };
}

export { COLLECTION, FAR_FUTURE };
