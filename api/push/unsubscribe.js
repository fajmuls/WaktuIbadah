// POST /api/push/unsubscribe  { endpoint }
import { bodyOf, endpointId, methodGuard, send } from '../_lib/http.js';
import { deleteSub } from '../_lib/store.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;
  try {
    const endpoint = String(bodyOf(req).endpoint || '').slice(0, 2048);
    if (!endpoint) return send(res, 400, { ok: false, error: 'endpoint kosong' });
    await deleteSub(endpointId(endpoint));
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error('[unsubscribe]', e);
    return send(res, 500, { ok: false, error: String(e?.message || e) });
  }
}
