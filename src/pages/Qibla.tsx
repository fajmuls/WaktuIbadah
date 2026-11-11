import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, MapPin, Navigation, RefreshCw } from 'lucide-react';
import { storage } from '../lib/storage';
import { getCachedPrayerData } from '../lib/prayer-times';

const KAABA = { lat: 21.422487, lng: 39.826206 };
const DEFAULT_LOC = { lat: -6.2088, lng: 106.8456 }; // Jakarta (cadangan)
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const norm = (d: number) => ((d % 360) + 360) % 360;

/** Sudut kiblat (derajat dari utara sejati, searah jarum jam) + jarak ke Kakbah (km). */
function qiblaFrom(lat: number, lng: number) {
  const p1 = rad(lat), p2 = rad(KAABA.lat), dl = rad(KAABA.lng - lng);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  const bearing = norm(deg(Math.atan2(y, x)));
  const a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return { bearing, km };
}

/**
 * Arah hadap HP terhadap utara dari alpha/beta/gamma (matriks rotasi Z-X'-Y'').
 * HP mendatar -> pakai arah puncak layar; HP ditegakkan -> pakai arah kamera belakang.
 */
function headingFromEuler(alpha: number, beta: number, gamma: number) {
  const a = rad(alpha), b = rad(beta), g = rad(gamma);
  const cA = Math.cos(a), sA = Math.sin(a), cB = Math.cos(b), sB = Math.sin(b), cG = Math.cos(g), sG = Math.sin(g);
  // sumbu-y perangkat (puncak layar) di koordinat dunia: Timur, Utara, Atas
  const yE = -sA * cB, yN = cA * cB, yU = sB;
  if (Math.abs(yU) < 0.75) return norm(deg(Math.atan2(yE, yN)));
  // sumbu-z perangkat (keluar layar); kamera belakang = -z
  const zE = cA * sG + sA * sB * cG;
  const zN = sA * sG - cA * sB * cG;
  return norm(deg(Math.atan2(-zE, -zN)));
}

type Source = 'ios' | 'absolute' | 'relative' | null;

export default function Qibla() {
  const [loc, setLoc] = useState<{ lat: number; lng: number; approx: boolean } | null>(null);
  const [locMsg, setLocMsg] = useState<string | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [source, setSource] = useState<Source>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const smooth = useRef<number | null>(null);
  const unwrapped = useRef(0);
  const [dialRot, setDialRot] = useState(0);
  const wasAligned = useRef(false);
  const cleanup = useRef<(() => void) | null>(null);

  const hasOrientation = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;

  // ---- Lokasi: profil -> GPS -> cache jadwal salat -> Jakarta (perkiraan) ----
  const resolveLocation = useCallback((forceGps = false) => {
    const user = storage.getUser() as any;
    const stored = user?.location;
    if (!forceGps && stored && typeof stored.latitude === 'number') {
      setLoc({ lat: stored.latitude, lng: stored.longitude, approx: false });
      return;
    }
    const cached: any = getCachedPrayerData();
    const fallback = () => {
      if (cached && typeof cached.lat === 'number' && typeof cached.lng === 'number') {
        setLoc({ lat: cached.lat, lng: cached.lng, approx: true });
      } else {
        setLoc({ ...DEFAULT_LOC, approx: true });
      }
      setLocMsg('Lokasi tepat belum tersedia, memakai perkiraan. Ketuk "Perbarui Lokasi" dan izinkan lokasi agar akurat.');
    };
    if (!navigator.geolocation) return fallback();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, approx: false });
        setLocMsg(null);
      },
      fallback,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => { resolveLocation(); }, [resolveLocation]);

  const q = useMemo(() => (loc ? qiblaFrom(loc.lat, loc.lng) : null), [loc]);

  // ---- Sensor kompas ----
  const feed = useCallback((raw: number) => {
    // Rata-rata melingkar agar jarum tidak bergetar & tidak "memutar balik" di 0/360
    const prev = smooth.current;
    let next = raw;
    if (prev !== null) {
      let d = raw - prev;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      next = prev + d * 0.25;
    }
    smooth.current = norm(next);
    const h = smooth.current;
    setHeading(h);
    const last = unwrapped.current;
    let diff = h - norm(last);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    unwrapped.current = last + diff;
    setDialRot(unwrapped.current);
  }, []);

  const stop = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    setMsg(null);
    if (!hasOrientation) {
      setMsg('Perangkat ini tidak punya sensor kompas. Gunakan sudut kiblat di bawah dengan kompas lain.');
      return;
    }
    // iOS 13+: izin harus diminta dari ketukan pengguna
    let denied = false;
    const DOE: any = (window as any).DeviceOrientationEvent;
    if (typeof DOE.requestPermission === 'function') {
      try {
        const res = await DOE.requestPermission();
        if (res !== 'granted') denied = true; // tetap dicoba; pesan hanya jika benar-benar tak ada data
      } catch {
        denied = true;
      }
    }

    let gotAbsolute = false;
    let gotAny = false;
    const screenAngle = () => ((screen.orientation && screen.orientation.angle) || (window as any).orientation || 0) as number;

    const onAbs = (e: any) => {
      if (e.alpha === null || e.alpha === undefined) return;
      gotAbsolute = true; gotAny = true;
      setSource('absolute');
      feed(norm(headingFromEuler(e.alpha, e.beta ?? 0, e.gamma ?? 0) + screenAngle()));
    };
    const onRel = (e: any) => {
      if (typeof e.webkitCompassHeading === 'number') {
        gotAny = true;
        setSource('ios');
        feed(norm(e.webkitCompassHeading + screenAngle()));
        return;
      }
      if (gotAbsolute) return; // abaikan data relatif bila data absolut tersedia
      if (e.alpha === null || e.alpha === undefined) return;
      gotAny = true;
      setSource(e.absolute === true ? 'absolute' : 'relative');
      feed(norm(headingFromEuler(e.alpha, e.beta ?? 0, e.gamma ?? 0) + screenAngle()));
    };

    window.addEventListener('deviceorientationabsolute', onAbs as any, true);
    window.addEventListener('deviceorientation', onRel as any, true);
    cleanup.current = () => {
      window.removeEventListener('deviceorientationabsolute', onAbs as any, true);
      window.removeEventListener('deviceorientation', onRel as any, true);
    };
    setActive(true);
    smooth.current = null;

    setTimeout(() => {
      if (!gotAny) {
        setMsg(
          denied
            ? 'Izin sensor ditolak. Di iPhone: Pengaturan > Safari > Gerak & Orientasi, aktifkan lalu coba lagi.'
            : 'Sensor kompas tidak memberi data. Pastikan HP punya magnetometer, bukan mode hemat daya, dan situs dibuka lewat HTTPS.'
        );
      }
    }, 2500);
  }, [feed, hasOrientation]);

  useEffect(() => () => cleanup.current?.(), []);

  const delta = heading !== null && q ? ((q.bearing - heading + 540) % 360) - 180 : null; // -180..180
  const aligned = delta !== null && Math.abs(delta) <= 5;

  useEffect(() => {
    if (aligned && !wasAligned.current && 'vibrate' in navigator) navigator.vibrate?.(60);
    wasAligned.current = aligned;
  }, [aligned]);

  const turnHint =
    delta === null ? null : aligned ? 'Arah kiblat tepat' : delta > 0 ? `Putar ke kanan ${Math.round(delta)}°` : `Putar ke kiri ${Math.round(-delta)}°`;

  const rot = active && heading !== null ? dialRot : 0;

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-md mx-auto pb-20">
      <div>
        <h1 className="text-2xl font-bold text-text-main dark:text-white">Arah Kiblat</h1>
        <p className="text-text-muted text-sm mt-1">Kompas menuju Kakbah dari lokasi Anda</p>
      </div>

      <div className="bg-surface dark:bg-slate-900 rounded-3xl p-5 border-[1.5px] border-[#121212] dark:border-slate-700 shadow-[3px_3px_0px_#121212] flex flex-col items-center text-center">
        {q ? (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Kiblat {Math.round(q.bearing)}° dari utara
            </span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              ± {Math.round(q.km).toLocaleString('id-ID')} km ke Kakbah
            </span>
          </div>
        ) : (
          <p className="text-sm text-text-muted mb-4 animate-pulse">Menentukan lokasi...</p>
        )}

        {/* Dial */}
        <div className="relative w-72 h-72 max-w-full">
          {/* penunjuk tetap di atas = arah hadap HP */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-[#121212] dark:border-t-white" />
          <div
            className={`absolute inset-0 rounded-full border-[6px] bg-white dark:bg-slate-800 transition-colors duration-300 ${
              aligned ? 'border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,.45)]' : 'border-[#121212] dark:border-slate-600'
            }`}
            style={{ transform: `rotate(${-rot}deg)`, transition: 'transform 120ms linear' }}
          >
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 10}deg)` }}>
                <div className={`mx-auto ${i % 9 === 0 ? 'h-4 w-[3px] bg-[#121212] dark:bg-white' : 'h-2 w-px bg-gray-400'}`} />
              </div>
            ))}
            {[['U', 0, 'text-red-600'], ['T', 90, 'text-gray-500'], ['S', 180, 'text-gray-500'], ['B', 270, 'text-gray-500']].map(([l, a, c]) => (
              <div key={l as string} className="absolute inset-0" style={{ transform: `rotate(${a}deg)` }}>
                <span
                  className={`absolute top-6 left-1/2 -translate-x-1/2 text-sm font-black ${c}`}
                  style={{ transform: `translateX(-50%) rotate(${-(a as number) + rot}deg)` }}
                >
                  {l}
                </span>
              </div>
            ))}
            {q && (
              <div className="absolute inset-0" style={{ transform: `rotate(${q.bearing}deg)` }}>
                <div className="absolute left-1/2 top-12 bottom-1/2 w-1 -translate-x-1/2 rounded-full bg-emerald-500/60" />
                <div
                  className="absolute left-1/2 top-3 w-9 h-9 rounded-lg bg-[#121212] border-2 border-amber-400 flex items-center justify-center shadow-md"
                  style={{ transform: `translateX(-50%) rotate(${-q.bearing + rot}deg)` }}
                  aria-label="Kakbah"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#fbbf24" strokeWidth="2">
                    <path d="M4 8l8-4 8 4v10l-8 3-8-3V8Z" fill="#fbbf24" fillOpacity=".2" />
                    <path d="M4 11l8 3 8-3M12 14v7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!active ? (
              <Compass className="w-14 h-14 text-gray-300 dark:text-slate-600" />
            ) : (
              <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl px-3 py-1.5 border border-black/20">
                <div className="text-2xl font-black tabular-nums leading-none">{heading !== null ? `${Math.round(heading)}°` : '--'}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase">arah HP</div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 min-h-[44px] flex flex-col items-center justify-center gap-1">
          {turnHint && (
            <div className={`font-bold px-4 py-1.5 rounded-xl text-sm ${aligned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
              {turnHint}
            </div>
          )}
          {active && source === 'relative' && (
            <p className="text-[11px] text-amber-700 max-w-xs">
              Sensor HP ini tidak memberi arah utara sejati. Gerakkan HP membentuk angka 8 untuk kalibrasi, lalu cocokkan dengan kompas lain.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {!active ? (
            <button
              onClick={start}
              className="inline-flex items-center gap-2 bg-emerald-500 text-[#121212] font-bold px-5 py-2.5 rounded-xl border-[1.5px] border-[#121212] shadow-[2px_2px_0px_#121212] active:translate-y-px"
            >
              <Navigation className="w-4 h-4" /> Aktifkan Kompas
            </button>
          ) : (
            <button onClick={stop} className="px-4 py-2 rounded-xl text-sm font-bold border-[1.5px] border-[#121212] bg-white dark:bg-slate-800">
              Matikan Kompas
            </button>
          )}
          <button
            onClick={() => resolveLocation(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-[1.5px] border-[#121212] bg-white dark:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" /> Perbarui Lokasi
          </button>
        </div>

        {msg && <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs font-medium w-full">{msg}</div>}
        {locMsg && <div className="mt-3 bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-medium w-full">{locMsg}</div>}

        {!hasOrientation && q && (
          <div className="mt-4 bg-gray-50 dark:bg-slate-800 p-3 rounded-xl text-xs w-full">
            Perangkat ini tanpa sensor kompas. Hadapkan diri ke arah <strong>{Math.round(q.bearing)}°</strong> (searah jarum jam dari utara) memakai kompas lain.
          </div>
        )}

        <p className="text-[11px] text-text-muted mt-5 max-w-xs">
          Pegang HP mendatar, jauhkan dari logam dan magnet. Sudut kiblat dihitung dari lokasi dan arah utara sejati; sensor HP bisa meleset beberapa derajat.
        </p>
      </div>
    </div>
  );
}
