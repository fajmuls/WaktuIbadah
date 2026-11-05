// GET/POST /api/cron/dispatch  -> dipanggil tiap menit oleh penjadwal eksternal
// Header wajib:  Authorization: Bearer <CRON_SECRET>
import { isCron, methodGuard, send } from '../_lib/http.js';
import { runDispatch } from '../_lib/dispatch.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET', 'POST'])) return;
  if (!isCron(req)) return send(res, 401, { ok: false, error: 'Tidak berwenang' });
  try {
    const started = Date.now();
    const stats = await runDispatch();
    return send(res, 200, { ok: true, ...stats, tookMs: Date.now() - started });
  } catch (e) {
    console.error('[cron/dispatch]', e);
    return send(res, 500, { ok: false, error: String(e?.message || e) });
  }
}
