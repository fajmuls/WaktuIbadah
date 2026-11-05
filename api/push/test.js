// POST /api/push/test  { endpoint }  -> kirim notifikasi uji dari SERVER ke perangkat ini
import { bodyOf, endpointId, methodGuard, send } from '../_lib/http.js';
import { sendOne, setupWebPush } from '../_lib/dispatch.js';
import { normalizePrefs } from '../_lib/events.js';
import { deleteSub, getSub, patchSub } from '../_lib/store.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;
  try {
    setupWebPush();
    const endpoint = String(bodyOf(req).endpoint || '').slice(0, 2048);
    if (!endpoint) return send(res, 400, { ok: false, error: 'endpoint kosong' });

    const id = endpointId(endpoint);
    const data = await getSub(id);
    if (!data) return send(res, 404, { ok: false, error: 'Langganan belum terdaftar. Aktifkan notifikasi dulu.' });

    if (data.lastTestAt && Date.now() - data.lastTestAt < 15000) {
      return send(res, 429, { ok: false, error: 'Tunggu beberapa detik sebelum mengirim uji lagi.' });
    }
    await patchSub(id, { lastTestAt: Date.now() });

    const prefs = normalizePrefs(data.prefs);
    const r = await sendOne(data, {
      kind: 'test',
      title: 'Tes Notifikasi WaktuIbadah',
      body: 'Alhamdulillah! Notifikasi dari server berfungsi, meski aplikasi ditutup.',
      tag: 'test',
      url: '/',
      silent: prefs.silent,
      vibrate: prefs.reminderType === 'sound_only' ? undefined : [400, 200, 400],
    });

    if (r.gone) {
      await deleteSub(id);
      return send(res, 410, { ok: false, error: 'Langganan sudah tidak berlaku. Aktifkan ulang notifikasi.' });
    }
    if (!r.ok) return send(res, 502, { ok: false, error: `Gagal mengirim: ${r.error}` });
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error('[test]', e);
    return send(res, 500, { ok: false, error: String(e?.message || e) });
  }
}
