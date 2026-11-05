// POST /api/push/subscribe
// Menyimpan/memperbarui langganan Web Push + preferensi + jadwal pengguna.
import { getDb } from '../_lib/firebase.js';
import { bodyOf, endpointId, isAllowedPushEndpoint, methodGuard, normalizeProfileId, send } from '../_lib/http.js';
import { normalizePrefs } from '../_lib/events.js';
import { safeTz } from '../_lib/time.js';
import { COLLECTION } from '../_lib/dispatch.js';

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;
  try {
    const b = bodyOf(req);
    const sub = b.subscription || {};
    const endpoint = str(sub.endpoint, 2048);
    const p256dh = str(sub.keys?.p256dh, 200);
    const auth = str(sub.keys?.auth, 100);

    if (!endpoint || !p256dh || !auth) return send(res, 400, { ok: false, error: 'Data langganan tidak lengkap' });
    if (!isAllowedPushEndpoint(endpoint)) return send(res, 400, { ok: false, error: 'Endpoint push tidak dikenali' });

    const userName = str(b.profile?.name, 100);
    if (userName.length < 2) return send(res, 400, { ok: false, error: 'Nama pengguna belum diisi' });

    const schedules = (Array.isArray(b.schedules) ? b.schedules : []).slice(0, 200).map((s) => ({
      id: str(String(s?.id ?? ''), 60),
      title: str(s?.title, 80),
      date: str(s?.date, 10),
      startTime: str(s?.startTime, 5),
      completed: s?.completed === true,
    }));
    const tasks = (Array.isArray(b.tasks) ? b.tasks : []).slice(0, 200).map((t) => ({
      id: str(String(t?.id ?? ''), 60),
      title: str(t?.title, 80),
      deadline: str(t?.deadline, 10),
      deadlineTime: str(t?.deadlineTime, 5),
      status: str(t?.status, 30),
    }));

    const db = getDb();
    const ref = db.collection(COLLECTION).doc(endpointId(endpoint));
    const existing = await ref.get();
    const now = Date.now();

    const doc = {
      endpoint,
      keys: { p256dh, auth },
      enabled: true,
      userName,
      profileId: normalizeProfileId(userName),
      cityId: str(b.profile?.cityId, 10) || '1301',
      cityName: str(b.profile?.cityName, 120),
      tz: safeTz(str(b.profile?.tz, 64)),
      prefs: normalizePrefs(b.prefs),
      schedules,
      tasks,
      platform: ['android', 'ios', 'desktop'].includes(b.device?.platform) ? b.device.platform : 'desktop',
      standalone: b.device?.standalone === true,
      lastSeenAt: now,
      updatedAt: now,
      nextRunAt: now, // dihitung ulang oleh dispatch pada menit berikutnya
    };
    if (!existing.exists) {
      doc.createdAt = now;
      doc.joinedAt = now;
      doc.sent = {};
      doc.sentCount = 0;
    }

    await ref.set(doc, { merge: true });
    return send(res, 200, { ok: true, id: ref.id, isNew: !existing.exists });
  } catch (e) {
    console.error('[subscribe]', e);
    return send(res, 500, { ok: false, error: String(e?.message || e) });
  }
}
