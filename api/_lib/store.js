// Penyimpanan langganan push di Redis.
//  push:sub:<id>        JSON langganan (kunci, preferensi, jadwal, status)
//  push:due             sorted set: member=id, score=nextRunAt (ms)  -> antrean jatuh tempo
//  push:sent:<id>:<key> penanda "sudah dikirim" (SET NX) -> mencegah kirim ganda
//  cache:<nama>         cache jadwal salat

import { redis, pipeline } from './redis.js';

export const FAR_FUTURE = 1e15;
const SUB = (id) => `push:sub:${id}`;
const SENT = (id, key) => `push:sent:${id}:${key}`;

export async function getSub(id) {
  const raw = await redis('GET', SUB(id));
  return raw ? JSON.parse(raw) : null;
}

export async function getSubs(ids) {
  if (!ids.length) return [];
  const raws = await redis('MGET', ...ids.map(SUB));
  return ids.map((id, i) => (raws[i] ? { id, ...JSON.parse(raws[i]) } : null)).filter(Boolean);
}

export async function putSub(id, data) {
  const score = data.enabled === false ? FAR_FUTURE : Number(data.nextRunAt ?? Date.now());
  await pipeline([
    ['SET', SUB(id), JSON.stringify(data)],
    ['ZADD', 'push:due', score, id],
  ]);
}

/** Gabungkan perubahan ke data TERBARU (menghindari menimpa pembaruan dari klien). */
export async function patchSub(id, patch) {
  const cur = await getSub(id);
  if (!cur) return null;
  const next = { ...cur, ...patch };
  await putSub(id, next);
  return next;
}

export async function deleteSub(id) {
  await pipeline([
    ['DEL', SUB(id)],
    ['ZREM', 'push:due', id],
  ]);
}

export async function dueIds(nowMs, limit = 300) {
  return (await redis('ZRANGEBYSCORE', 'push:due', '-inf', nowMs, 'LIMIT', 0, limit)) || [];
}

export async function allIds() {
  return (await redis('ZRANGE', 'push:due', 0, -1)) || [];
}

/** true bila BERHASIL mengklaim (belum pernah dikirim). Atomik. */
export async function claim(id, key) {
  const r = await redis('SET', SENT(id, key), '1', 'NX', 'EX', 172800);
  return r === 'OK';
}

export async function unclaim(id, key) {
  await redis('DEL', SENT(id, key));
}

export async function cacheGet(name) {
  const raw = await redis('GET', `cache:${name}`);
  return raw ? JSON.parse(raw) : null;
}

export async function cacheSet(name, value, ttlSeconds = 172800) {
  await redis('SET', `cache:${name}`, JSON.stringify(value), 'EX', ttlSeconds);
}
