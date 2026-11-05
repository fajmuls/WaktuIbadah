import { createHash, timingSafeEqual } from 'node:crypto';

export function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function methodGuard(req, res, methods) {
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    send(res, 405, { ok: false, error: 'Method tidak diizinkan' });
    return false;
  }
  return true;
}

/** Vercel sudah mem-parse JSON; tapi jaga-jaga bila body berupa string/kosong. */
export function bodyOf(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return b;
}

function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a ?? '')).digest();
  const hb = createHash('sha256').update(String(b ?? '')).digest();
  return timingSafeEqual(ha, hb);
}

export function isAdmin(req) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  return safeEqual(req.headers['x-admin-token'], expected);
}

export function isCron(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = String(req.headers['authorization'] || '');
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return safeEqual(bearer || req.headers['x-cron-secret'] || req.query?.key, expected);
}

/** Hanya terima endpoint dari layanan push resmi browser (mencegah SSRF). */
export function isAllowedPushEndpoint(endpoint) {
  try {
    const u = new URL(endpoint);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    return (
      h === 'fcm.googleapis.com' ||
      h.endsWith('.push.services.mozilla.com') ||
      h.endsWith('.notify.windows.com') ||
      h === 'web.push.apple.com' ||
      h.endsWith('.push.apple.com')
    );
  } catch {
    return false;
  }
}

export function endpointId(endpoint) {
  return createHash('sha256').update(endpoint).digest('hex');
}

/** Sama dengan normalizeProfileId() di src/lib/cloud-sync.ts */
export function normalizeProfileId(name) {
  const clean = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);
  return clean || 'anonymous_user';
}
