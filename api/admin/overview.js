// GET /api/admin/overview   (header: x-admin-token)
// Ringkasan semua pengguna terdaftar + review + status notifikasi untuk Admin Dashboard.
// PIN dan isi data pribadi TIDAK dikirim ke browser; hanya ringkasan.
import { isAdmin, methodGuard, normalizeProfileId, send } from '../_lib/http.js';
import { listCollection } from '../_lib/firestore-rest.js';
import { allIds, getSubs } from '../_lib/store.js';

const toList = (v) => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []);
const dayDiff = (a, b) => Math.max(0, Math.round((b - a) / 86400000));
const isoOrNull = (ms) => (ms ? new Date(ms).toISOString() : null);

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;
  if (!isAdmin(req)) return send(res, 401, { ok: false, error: 'Token admin salah' });

  try {
    // Profil & review dibaca lewat Firestore REST (aturan Firestore mengizinkan baca);
    // langganan notifikasi dibaca dari Redis.
    const [profileDocs, reviewDocs, subIds] = await Promise.all([
      listCollection('student_profiles'),
      listCollection('website_reviews'),
      allIds(),
    ]);
    const pushSubs = await getSubs(subIds);

    // Review per pengguna
    const reviewsByUser = new Map();
    const reviews = [];
    reviewDocs.forEach((d) => {
      const r = d.data;
      reviews.push(r);
      const k = normalizeProfileId(r.userName);
      if (!reviewsByUser.has(k)) reviewsByUser.set(k, []);
      reviewsByUser.get(k).push(r);
    });

    // Perangkat notifikasi per pengguna
    const pushByUser = new Map();
    const pushPlatforms = { android: 0, ios: 0, desktop: 0 };
    pushSubs.forEach((p) => {
      if (p.enabled === false) return;
      pushPlatforms[p.platform] = (pushPlatforms[p.platform] || 0) + 1;
      if (!pushByUser.has(p.profileId)) pushByUser.set(p.profileId, []);
      pushByUser.get(p.profileId).push(p);
    });

    const now = Date.now();
    const users = [];
    profileDocs.forEach((d) => {
      const p = d.data;
      const prayerLogs = toList(p.prayerLogs);
      const tasks = toList(p.tasks);
      const schedules = toList(p.schedules);
      const quran = toList(p.tilawahLogs);

      let prayersDone = 0;
      let firstLogDate = null;
      for (const log of prayerLogs) {
        prayersDone += Object.values(log?.prayers || {}).filter(Boolean).length;
        if (log?.date && (!firstLogDate || log.date < firstLogDate)) firstLogDate = log.date;
      }

      const updatedMs = Date.parse(p.updatedAt || '') || null;
      const createdMs =
        Number(p.createdAt) ||
        Date.parse(p.createdAt || '') ||
        Date.parse(p.user?.createdAt || '') ||
        (firstLogDate ? Date.parse(firstLogDate) : null) ||
        updatedMs;

      const devices = pushByUser.get(d.id) || [];
      const lastPushSeen = devices.reduce((m, x) => Math.max(m, x.lastSeenAt || 0), 0);
      const lastActiveMs = Math.max(updatedMs || 0, lastPushSeen) || null;

      const rv = reviewsByUser.get(d.id) || [];
      const avg = rv.length ? rv.reduce((s, r) => s + (Number(r.rating) || 0), 0) / rv.length : null;
      const latest = [...rv].sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)))[0];

      users.push({
        id: d.id,
        name: p.name || d.id,
        city: p.user?.location?.city || null,
        hasPin: Boolean(p.pin && String(p.pin).trim().length === 4),
        pin: p.pin ? String(p.pin).trim() : '',
        createdAt: isoOrNull(createdMs),
        lastActiveAt: isoOrNull(lastActiveMs),
        usageDays: createdMs && lastActiveMs ? dayDiff(createdMs, lastActiveMs) : 0,
        daysSinceActive: lastActiveMs ? dayDiff(lastActiveMs, now) : null,
        prayerDaysFilled: prayerLogs.length,
        prayersDone,
        tasksTotal: tasks.length,
        tasksDone: tasks.filter((t) => t?.status === 'Selesai').length,
        schedulesTotal: schedules.length,
        quranLogs: quran.length,
        notification: {
          devices: devices.length,
          platforms: [...new Set(devices.map((x) => x.platform))],
          lastSentAt: isoOrNull(devices.reduce((m, x) => Math.max(m, x.lastSentAt || 0), 0) || null),
          totalSent: devices.reduce((s, x) => s + (x.sentCount || 0), 0),
        },
        review: rv.length
          ? {
              count: rv.length,
              averageRating: Math.round(avg * 10) / 10,
              latestRating: latest?.rating ?? null,
              latestComment: latest?.comment ? String(latest.comment).slice(0, 300) : '',
              latestAt: latest?.submittedAt || null,
            }
          : null,
      });
    });

    users.sort((a, b) => String(b.lastActiveAt || '').localeCompare(String(a.lastActiveAt || '')));

    return send(res, 200, {
      ok: true,
      generatedAt: new Date().toISOString(),
      totals: {
        users: users.length,
        withNotifications: users.filter((u) => u.notification.devices > 0).length,
        notificationDevices: pushSubs.filter((p) => p.enabled !== false).length,
        platforms: pushPlatforms,
        reviews: reviews.length,
      },
      users,
    });
  } catch (e) {
    console.error('[admin/overview]', e);
    return send(res, 500, { ok: false, error: String(e?.message || e) });
  }
}
