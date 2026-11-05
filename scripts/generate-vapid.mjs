// Membuat sepasang kunci VAPID (P-256) tanpa dependensi tambahan.
// Jalankan:  node scripts/generate-vapid.mjs
import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const priv = privateKey.export({ format: 'jwk' });
const pub = publicKey.export({ format: 'jwk' });

const b64u = (b) => Buffer.from(b).toString('base64url');
const x = Buffer.from(pub.x, 'base64url');
const y = Buffer.from(pub.y, 'base64url');
const publicKeyB64 = b64u(Buffer.concat([Buffer.from([0x04]), x, y]));
const privateKeyB64 = priv.d;

console.log('\nTempel ke Vercel > Settings > Environment Variables (dan .env.local):\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${publicKeyB64}`);
console.log(`VAPID_PUBLIC_KEY=${publicKeyB64}`);
console.log(`VAPID_PRIVATE_KEY=${privateKeyB64}`);
console.log('VAPID_SUBJECT=mailto:emailanda@contoh.com\n');
console.log('PENTING: VAPID_PRIVATE_KEY bersifat rahasia. Jangan commit ke Git.\n');
