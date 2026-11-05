import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let cachedDb = null;

/**
 * Firestore (Admin SDK). Perlu env FIREBASE_SERVICE_ACCOUNT berisi JSON service account
 * (boleh mentah atau base64). Opsional FIRESTORE_DATABASE_ID bila bukan "(default)".
 */
export function getDb() {
  if (cachedDb) return cachedDb;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('Env FIREBASE_SERVICE_ACCOUNT belum diatur di Vercel.');

  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(text);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  const app = getApps()[0] || initializeApp({ credential: cert(serviceAccount) });
  const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
  cachedDb = databaseId === '(default)' ? getFirestore(app) : getFirestore(app, databaseId);
  return cachedDb;
}
