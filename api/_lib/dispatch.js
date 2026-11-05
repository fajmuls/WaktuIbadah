// Pengirim notifikasi: dipanggil tiap menit oleh /api/cron/dispatch.
// Hanya memproses langganan yang `nextRunAt`-nya sudah tiba (antrean sorted set di Redis).

import webpush from 'web-push';
import { getDayTimes, getHijriDay } from './prayer.js';
import { buildDayEvents, pickDue, computeNextRunAt, normalizePrefs } from './events.js';
import { addDaysYmd, localParts, safeTz } from './time.js';
import { claim, dueIds, getSub, patchSub, deleteSub, unclaim } from './store.js';

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

async function loadDay(data, ymd, prefs) {
  let day = null;
  try {
    day = await getDayTimes(data.cityId, ymd);
  } catch (e) {
    if (data.lastTimes?.ymd === ymd) day = data.lastTimes.day; // cadangan bila API down
  }
  let tomorrowHijriDay;
  if (prefs.puasa) {
    try {
      tomorrowHijriDay = await getHijriDay(addDaysYmd(ymd, 1));
    } catch {
      /* Senin/Kamis tetap jalan tanpa data Hijriah */
    }
  }
  return { day, tomorrowHijriDay };
}

/** Proses satu langganan. */
export async function processSub(id, nowMs) {
  const out = { sent: 0, failed: 0, removed: false };
  const data = await getSub(id);
  if (!data) {
    await deleteSub(id); // sisa antrean
    return out;
  }
  if (data.enabled === false) {
    await patchSub(id, { nextRunAt: 1e15 });
    return out;
  }

  const tz = safeTz(data.tz);
  const ymd = localParts(nowMs, tz).ymd;
  const prefs = normalizePrefs(data.prefs);
  const { day, tomorrowHijriDay } = await loadDay(data, ymd, prefs);

  if (!day && prefs.prayers) {
    await patchSub(id, { nextRunAt: nowMs + 3 * 60000 }); // jadwal belum bisa diambil: coba lagi
    return out;
  }

  const events = buildDayEvents({ ...data, tz }, ymd, day, { tomorrowHijriDay }).filter(
    (e) => e.atMs >= (data.joinedAt || 0) // jangan kirim yang sudah lewat sebelum berlangganan
  );
  const due = pickDue(events, data.sent, nowMs);

  // Klaim atomik (SET NX) per notifikasi: dua proses cron yang tumpang-tindih tidak mengirim ganda
  const claimed = [];
  for (const e of due) {
    if (await claim(id, e.key)) claimed.push(e);
  }

  const sentNow = Object.fromEntries(Object.entries(data.sent || {}).filter(([k]) => k.startsWith(`${ymd}:`)));
  for (const e of due) sentNow[e.key] = nowMs; // yang sudah diklaim proses lain juga dianggap terkirim
  const release = [];

  for (const e of claimed) {
    const r = await sendOne(data, e.payload);
    if (r.ok) {
      out.sent++;
    } else if (r.gone) {
      await deleteSub(id); // langganan tidak berlaku lagi (izin dicabut / aplikasi dihapus)
      out.removed = true;
      return out;
    } else {
      out.failed++;
      release.push(e.key);
      delete sentNow[e.key];
      await unclaim(id, e.key); // coba lagi menit berikutnya (selama masih dalam toleransi)
      console.warn('[push] gagal kirim', data.userName, e.key, r.error);
    }
  }

  const patch = {
    sent: sentNow,
    nextRunAt: release.length ? nowMs + 60000 : computeNextRunAt(events, sentNow, nowMs, ymd, tz),
    lastDispatchAt: nowMs,
    lastTimes: day ? { ymd, day } : data.lastTimes || null,
  };
  if (out.sent) {
    patch.lastSentAt = nowMs;
    patch.sentCount = (data.sentCount || 0) + out.sent;
  }
  if (release.length) patch.failCount = (data.failCount || 0) + release.length;
  await patchSub(id, patch);
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
        console.error('[push] error proses langganan', items[idx], e);
        results[idx] = { sent: 0, failed: 1, removed: false, error: String(e?.message || e) };
      }
    }
  });
  await Promise.all(runners);
  return results;
}

export async function runDispatch({ nowMs = Date.now(), limit = 300 } = {}) {
  setupWebPush();
  const ids = await dueIds(nowMs, limit);
  const results = await pool(ids, 8, (id) => processSub(id, nowMs));
  return {
    checked: ids.length,
    sent: results.reduce((a, r) => a + (r?.sent || 0), 0),
    failed: results.reduce((a, r) => a + (r?.failed || 0), 0),
    removed: results.filter((r) => r?.removed).length,
  };
}
