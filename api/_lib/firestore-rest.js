// Membaca koleksi Firestore lewat REST + API key web (publik) milik aplikasi.
// Dipakai HANYA oleh /api/admin/overview untuk membaca student_profiles & website_reviews
// (yang memang sudah terbuka dibaca oleh aturan Firestore saat ini). Tidak butuh service account.

const DEFAULTS = {
  projectId: 'enduring-kiln-f8gvj',
  databaseId: 'ai-studio-waktuibadah-0ce961ff-1426-47ab-83ff-c1e7525281b8',
  apiKey: 'AIzaSyCW5CPsKCD-_7SixCChS-At0iLrylo58YA', // kunci web publik (sama dengan firebase-applet-config.json)
};

function cfg() {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || DEFAULTS.projectId,
    databaseId: process.env.FIRESTORE_DATABASE_ID || DEFAULTS.databaseId,
    apiKey: process.env.FIREBASE_WEB_API_KEY || DEFAULTS.apiKey,
    referer: process.env.SITE_URL || 'https://waktuibadah.vercel.app/',
  };
}

export function decodeValue(v) {
  if (v == null || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('referenceValue' in v) return v.referenceValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return null;
}

export function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = decodeValue(v);
  return out;
}

/** @returns {Promise<Array<{id:string,data:object}>>} */
export async function listCollection(name, maxDocs = 1000) {
  const { projectId, databaseId, apiKey, referer } = cfg();
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${name}`;
  const docs = [];
  let pageToken = '';
  do {
    const url = `${base}?pageSize=200&key=${apiKey}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url, { headers: { Referer: referer } });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(`Firestore REST ${res.status}: ${json?.error?.message || 'gagal membaca ' + name}`);
    }
    for (const d of json.documents || []) {
      docs.push({ id: d.name.split('/').pop(), data: decodeFields(d.fields) });
    }
    pageToken = json.nextPageToken || '';
  } while (pageToken && docs.length < maxDocs);
  return docs;
}
