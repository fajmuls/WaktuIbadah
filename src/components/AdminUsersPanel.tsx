import React, { useMemo, useState } from 'react';
import { Users, BellRing, Star, RefreshCcw, Search, Smartphone, Clock, KeyRound, Copy, Check } from 'lucide-react';

export interface AdminUserRow {
  id: string;
  name: string;
  city: string | null;
  hasPin: boolean;
  pin?: string;
  createdAt: string | null;
  lastActiveAt: string | null;
  usageDays: number;
  daysSinceActive: number | null;
  prayerDaysFilled: number;
  prayersDone: number;
  tasksTotal: number;
  tasksDone: number;
  schedulesTotal: number;
  quranLogs: number;
  notification: { devices: number; platforms: string[]; lastSentAt: string | null; totalSent: number };
  review: { count: number; averageRating: number; latestRating: number | null; latestComment: string; latestAt: string | null } | null;
}

export interface AdminOverview {
  generatedAt: string;
  totals: { users: number; withNotifications: number; notificationDevices: number; platforms: Record<string, number>; reviews: number };
  users: AdminUserRow[];
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

const lastActiveLabel = (u: AdminUserRow) => {
  if (u.daysSinceActive == null) return '-';
  if (u.daysSinceActive === 0) return 'Hari ini';
  return `${u.daysSinceActive} hari lalu`;
};

interface Props {
  data: AdminOverview | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

export const AdminUsersPanel: React.FC<Props> = ({ data, loading, error, onRefresh }) => {
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.users || []).filter((u) => !q || u.name.toLowerCase().includes(q) || (u.city || '').toLowerCase().includes(q));
  }, [data, query]);

  return (
    <section className="memphis-card bg-white p-4 sm:p-5 space-y-4" aria-label="Pengguna terdaftar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#10B981] border-[1.5px] border-black flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Pengguna Terdaftar</h2>
            <p className="text-[11px] font-bold text-gray-500">
              {data ? `${data.totals.users} pengguna • ${data.totals.withNotifications} dengan notifikasi aktif` : 'Memuat...'}
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="memphis-btn memphis-btn-white px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider gap-1 disabled:opacity-60"
        >
          <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Memuat...' : 'Muat Ulang'}
        </button>
      </div>

      {error && <div className="p-3 bg-[#FF4B91] text-white border-[1.5px] border-black rounded-xl text-xs font-bold">{error}</div>}

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          {[
            ['Pengguna', data.totals.users],
            ['Perangkat notifikasi', data.totals.notificationDevices],
            ['Android / iOS / PC', `${data.totals.platforms.android || 0} / ${data.totals.platforms.ios || 0} / ${data.totals.platforms.desktop || 0}`],
            ['Ulasan', data.totals.reviews],
          ].map(([label, value]) => (
            <div key={String(label)} className="border-[1.5px] border-black rounded-xl p-2 bg-[#FFFDF8]">
              <div className="text-base font-bold">{value}</div>
              <div className="text-[10px] font-bold uppercase text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau kota..."
          className="memphis-input w-full pl-9 pr-3 py-2 text-xs font-bold"
        />
      </div>

      <div className="space-y-2">
        {rows.length === 0 && !loading && (
          <p className="text-xs font-bold text-gray-500 text-center py-4">Belum ada pengguna yang cocok.</p>
        )}
        {rows.map((u) => {
          const open = expanded === u.id;
          return (
            <div key={u.id} className="border-[1.5px] border-black rounded-xl bg-white overflow-hidden">
              <button
                onClick={() => setExpanded(open ? null : u.id)}
                className="w-full text-left p-3 flex flex-wrap items-center gap-x-3 gap-y-1"
                aria-expanded={open}
              >
                <span className="font-bold text-sm truncate max-w-[10rem]">{u.name}</span>
                <span className="text-[10px] font-bold text-gray-500">{u.city || 'Kota belum dipilih'}</span>
                <span className="ml-auto flex items-center gap-2 text-[10px] font-bold uppercase">
                  <span className={`px-1.5 py-0.5 rounded border border-black flex items-center gap-1 ${u.notification.devices ? 'bg-emerald-300' : 'bg-gray-200'}`}>
                    <BellRing className="w-3 h-3" /> {u.notification.devices ? `${u.notification.devices} perangkat` : 'Tanpa notifikasi'}
                  </span>
                  {u.review && (
                    <span className="px-1.5 py-0.5 rounded border border-black bg-[#FFE600] flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" /> {u.review.averageRating}
                    </span>
                  )}
                </span>
              </button>

              {open && (
                <div className="px-3 pb-3 pt-1 border-t-2 border-dashed border-black/30 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-bold">
                  <Info label="Mulai memakai" value={fmtDate(u.createdAt)} />
                  <Info label="Aktif terakhir" value={`${fmtDate(u.lastActiveAt)} (${lastActiveLabel(u)})`} />
                  <Info label="Lama memakai" value={`${u.usageDays} hari`} icon={<Clock className="w-3 h-3" />} />
                  <Info label="Hari ibadah diisi" value={`${u.prayerDaysFilled} hari`} />
                  <Info label="Salat tercatat" value={`${u.prayersDone}`} />
                  <Info label="Tilawah dicatat" value={`${u.quranLogs}`} />
                  <Info label="Tugas selesai" value={`${u.tasksDone}/${u.tasksTotal}`} />
                  <Info label="Jadwal kuliah" value={`${u.schedulesTotal}`} />
                  <Info
                    label="Notifikasi terkirim"
                    value={`${u.notification.totalSent}${u.notification.platforms.length ? ` (${u.notification.platforms.join(', ')})` : ''}`}
                    icon={<Smartphone className="w-3 h-3" />}
                  />
                  {/* PIN Keamanan 4 Digit untuk Pemulihan Akun */}
                  <div className="border-[1.5px] border-black rounded-lg p-2 bg-[#FCD34D] text-[#121212] flex items-center justify-between">
                    <div>
                      <div className="text-[9.5px] font-extrabold uppercase text-gray-800 flex items-center gap-1">
                        <KeyRound className="w-3 h-3" /> PIN Pemulihan
                      </div>
                      <div className="text-sm font-black tracking-widest tabular-nums mt-0.5">
                        {u.pin ? u.pin : (u.hasPin ? 'Ada PIN' : 'Tanpa PIN')}
                      </div>
                    </div>
                    {u.pin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(u.pin!);
                            alert(`PIN akun "${u.name}" (${u.pin}) berhasil disalin.`);
                          }
                        }}
                        className="px-2 py-1 bg-white border border-black rounded text-[10px] font-bold shadow-xs active:translate-y-0.5 flex items-center gap-1"
                        title="Salin PIN Mahasiswa"
                      >
                        <Copy className="w-3 h-3" /> Salin
                      </button>
                    )}
                  </div>
                  <div className="col-span-2 sm:col-span-3 border-[1.5px] border-black rounded-lg p-2 bg-[#FFFDF8]">
                    <div className="text-[10px] uppercase text-gray-500">Ulasan</div>
                    {u.review ? (
                      <div className="space-y-0.5">
                        <div>
                          Rata-rata {u.review.averageRating}/5 dari {u.review.count} ulasan
                          {u.review.latestAt ? ` • terbaru ${fmtDate(u.review.latestAt)}` : ''}
                        </div>
                        {u.review.latestComment && <div className="font-semibold text-gray-700">“{u.review.latestComment}”</div>}
                      </div>
                    ) : (
                      <div className="text-gray-500">Belum memberi ulasan.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

const Info: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="border-[1.5px] border-black rounded-lg p-2 bg-[#FFFDF8]">
    <div className="text-[10px] uppercase text-gray-500 flex items-center gap-1">{icon}{label}</div>
    <div>{value}</div>
  </div>
);
