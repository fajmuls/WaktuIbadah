// Klien REST minimal untuk Upstash Redis (gratis). Tanpa dependensi.
// Env (salah satu pasang):
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//   KV_REST_API_URL        + KV_REST_API_TOKEN        (nama bawaan integrasi Vercel)

function conf() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error('Redis belum dikonfigurasi: isi UPSTASH_REDIS_REST_URL dan UPSTASH_REDIS_REST_TOKEN (atau KV_REST_API_URL/KV_REST_API_TOKEN) di Vercel.');
  }
  return { url: url.replace(/\/$/, ''), token };
}

async function post(path, body) {
  const { url, token } = conf();
  const res = await fetch(url + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Redis HTTP ${res.status}: ${json?.error || 'gagal'}`);
  return json;
}

/** Jalankan satu perintah, contoh: redis('SET', 'k', 'v', 'NX', 'EX', 60) */
export async function redis(...args) {
  const json = await post('', args.map((a) => (typeof a === 'number' ? String(a) : a)));
  if (json?.error) throw new Error(`Redis: ${json.error}`);
  return json?.result ?? null;
}

/** Jalankan beberapa perintah sekaligus (satu permintaan HTTP). */
export async function pipeline(commands) {
  if (!commands.length) return [];
  const json = await post('/pipeline', commands.map((c) => c.map((a) => (typeof a === 'number' ? String(a) : a))));
  return (json || []).map((r) => {
    if (r?.error) throw new Error(`Redis: ${r.error}`);
    return r?.result ?? null;
  });
}
