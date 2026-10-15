import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Lock, KeyRound, ShieldCheck, Link as LinkIcon, ToggleLeft, ToggleRight, 
  Save, ExternalLink, CheckCircle2, AlertCircle, ArrowLeft, LogOut,
  BarChart3, Printer, Users, Star, Filter, RefreshCcw, Sparkles, MessageSquareQuote,
  Cloud, Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { AdminReviewConfig, WebsiteReview, ReviewSystemMode, StarRatingValue } from '../types';
import { vibrateSuccess } from '../lib/audio';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { 
  subscribeToReviews, fetchAllReviewsFromCloud, 
  fetchAdminConfigFromCloud, saveAdminConfigToCloud 
} from '../lib/cloud-sync';

const ADMIN_TOKEN_SECRET = 'Fajmuls22';

const RATING_CONFIG = [
  { star: 1, label: 'Tidak Membantu', color: '#ef4444' }, // Red
  { star: 2, label: 'Kurang Membantu', color: '#f97316' }, // Orange
  { star: 3, label: 'Cukup Membantu', color: '#eab308' }, // Yellow
  { star: 4, label: 'Membantu', color: '#3b82f6' }, // Blue
  { star: 5, label: 'Sangat Membantu', color: '#10b981' }, // Emerald green
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return storage.isAdminAuthenticated();
  });
  const [authError, setAuthError] = useState('');

  // Form config state
  const [config, setConfig] = useState<AdminReviewConfig>(() => storage.getAdminReviewConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(true);

  // Reviews data state
  const [reviews, setReviews] = useState<WebsiteReview[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

  useEffect(() => {
    // 1. Initial load from local
    setConfig(storage.getAdminReviewConfig());
    const localList = storage.getWebsiteReviews();
    setReviews(localList);

    // 2. Fetch cloud config
    fetchAdminConfigFromCloud().then((cloudCfg) => {
      if (cloudCfg) {
        setConfig(cloudCfg);
        storage.setAdminReviewConfig(cloudCfg);
      }
    }).catch(console.error);

    // 3. Real-time subscription to cloud reviews
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeToReviews((cloudReviews) => {
        setCloudConnected(true);
        if (cloudReviews && cloudReviews.length > 0) {
          // Merge cloud reviews with any local-only seed reviews if needed
          const mergedMap = new Map<string, WebsiteReview>();
          // Put local ones first
          localList.forEach(r => mergedMap.set(r.id, r));
          // Overwrite/add with real cloud ones
          cloudReviews.forEach(r => mergedMap.set(r.id, r));
          const result = Array.from(mergedMap.values());
          result.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setReviews(result);
        } else {
          setReviews(localList);
        }
      });
    } catch (e) {
      console.warn('Real-time reviews subscription fallback to fetch:', e);
      fetchAllReviewsFromCloud().then((cloudList) => {
        if (cloudList.length > 0) {
          setReviews(cloudList);
        }
      }).catch(console.error);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleRefreshCloud = async () => {
    setIsCloudSyncing(true);
    try {
      const cloudList = await fetchAllReviewsFromCloud();
      if (cloudList && cloudList.length > 0) {
        setReviews(cloudList);
        setCloudConnected(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim() === ADMIN_TOKEN_SECRET) {
      setIsAuthenticated(true);
      storage.setAdminAuthenticated(true);
      setAuthError('');
      vibrateSuccess();
    } else {
      setAuthError('Kode token admin tidak sesuai. Akses ditolak.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    storage.setAdminAuthenticated(false);
    setTokenInput('');
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdminReviewConfig = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    storage.setAdminReviewConfig(updated);
    setConfig(updated);
    setSaveSuccess(true);
    vibrateSuccess();
    // Also save to Firestore cloud config
    await saveAdminConfigToCloud(updated).catch(console.error);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Filtered reviews based on user selection
  const filteredReviews = useMemo(() => {
    if (selectedUserFilter === 'all') return reviews;
    return reviews.filter(r => r.userName.toLowerCase().trim() === selectedUserFilter.toLowerCase().trim());
  }, [reviews, selectedUserFilter]);

  // Unique user names for dropdown filter
  const userList = useMemo(() => {
    const names = Array.from(new Set(reviews.map(r => r.userName.trim())));
    return names.sort();
  }, [reviews]);

  // Chart data calculation: distribution of 1 to 5 stars
  const chartData = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredReviews.forEach(r => {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
    });

    return RATING_CONFIG.map(item => ({
      star: `Bintang ${item.star}`,
      label: item.label,
      jumlah: counts[item.star] || 0,
      color: item.color,
      starNum: item.star
    }));
  }, [filteredReviews]);

  // Statistical metrics
  const stats = useMemo(() => {
    const total = filteredReviews.length;
    if (total === 0) return { total: 0, avg: 0, satisfiedPct: 0 };
    const sum = filteredReviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / total).toFixed(1);
    const satisfied = filteredReviews.filter(r => r.rating >= 4).length;
    const satisfiedPct = Math.round((satisfied / total) * 100);
    return { total, avg, satisfiedPct };
  }, [filteredReviews]);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Non-print Top Header */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print Laporan</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
              title="Kunci sesi admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Kunci Admin</span>
            </button>
          </div>
        )}
      </div>

      {/* ==================== LOGIN SCREEN ==================== */}
      {!isAuthenticated ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-10 border border-gray-100 dark:border-gray-700 shadow-sm text-center max-w-md mx-auto space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Panel Verifikasi Admin
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
              Admin Dashboard
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
              Silakan masukkan token admin untuk mengakses grafik evaluasi kuesioner dan pengaturan review proyek.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Token Admin
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Masukkan token rahasia..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99]"
            >
              Masuk ke Admin Dashboard
            </button>
          </form>

          <p className="text-[11px] text-gray-400">
            Sistem mengingat sesi login Anda di perangkat ini secara aman sehingga tidak perlu memasukkan token berulang kali.
          </p>
        </div>
      ) : (
        /* ==================== AUTHENTICATED ADMIN AREA ==================== */
        <div className="space-y-6">
          
          {/* Admin Hero Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-emerald-700/60 print:bg-none print:text-black print:p-2 print:border-b print:border-gray-300">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full text-emerald-100 print:hidden">
                  Akses Terverifikasi
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/30 border border-emerald-400/40 px-2.5 py-0.5 rounded-full text-white flex items-center gap-1 print:hidden">
                  <Cloud className="w-3 h-3 text-emerald-300" />
                  Firestore Database Terhubung ({reviews.length} Ulasan Masuk)
                </span>
                <button
                  type="button"
                  onClick={handleRefreshCloud}
                  disabled={isCloudSyncing}
                  className="text-[10px] font-semibold bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full text-white flex items-center gap-1 transition-colors print:hidden"
                  title="Sinkronkan ulang dari Firestore Cloud"
                >
                  <RefreshCcw className={`w-2.5 h-2.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  <span>{isCloudSyncing ? 'Sinkron...' : 'Muat Ulang Cloud'}</span>
                </button>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold mt-2">
                Laporan & Grafik Evaluasi Website WaktuIbadah
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
                Pantau konversi kepuasan responden mahasiswa atas penggunaan ibadah harian, jadwal kuliah, dan efektivitas aplikasi dalam format grafik siap cetak.
              </p>
            </div>
          </div>

          {/* ==================== SECTION 1: STATS SUMMARY ==================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  Total Responden
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {stats.total} Orang
                </h3>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-500 flex items-center justify-center font-bold text-lg shrink-0">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  Rata-rata Rating
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {stats.avg} / 5.0
                </h3>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                  Indeks Kepuasan
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {stats.satisfiedPct}% Puas
                </h3>
              </div>
            </div>
          </div>

          {/* ==================== SECTION 2: CHART WITH FILTER ==================== */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
            
            {/* Chart Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    Grafik Distribusi Penilaian Bintang (1 - 5 Bintang)
                  </h2>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Distribusi review dari 1 (Tidak Membantu) hingga 5 (Sangat Membantu).
                </p>
              </div>

              {/* USER FILTER DROPDOWN */}
              <div className="flex items-center gap-2 shrink-0 print:hidden">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Responden ({reviews.length})</option>
                  {userList.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* RECHARTS BAR CHART */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis 
                    dataKey="star" 
                    tick={{ fontSize: 11, fontWeight: 600 }}
                    interval={0}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 text-xs space-y-1">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {data.star}: {data.label}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                              {data.jumlah} Responden
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="jumlah" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Legend Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              {RATING_CONFIG.map(item => {
                const count = chartData.find(c => c.starNum === item.star)?.jumlah || 0;
                return (
                  <div 
                    key={item.star} 
                    className="p-2.5 rounded-xl border border-gray-100 dark:border-gray-700/80 bg-gray-50/70 dark:bg-gray-900/60 text-center space-y-0.5"
                  >
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-gray-700 dark:text-gray-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.star}★ {item.label}</span>
                    </div>
                    <span className="text-sm font-extrabold text-gray-900 dark:text-white block">
                      {count} ulasan
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ==================== SECTION 3: REVIEWS TABLE ==================== */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-emerald-600" />
                  <span>Daftar Ulasan Masuk</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Menampilkan {filteredReviews.length} dari {reviews.length} total responden
                </p>
              </div>
            </div>

            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Nama Responden</th>
                    <th className="py-2.5 px-3">Rating</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Komentar & Evaluasi</th>
                    <th className="py-2.5 px-3">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        Belum ada ulasan untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40">
                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {rev.userName}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-extrabold text-amber-500">
                            {'★'.repeat(rev.rating)}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">
                            {'★'.repeat(5 - rev.rating)}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rev.rating >= 4
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : rev.rating === 3
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                          }`}>
                            {rev.ratingLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                          "{rev.comment}"
                        </td>
                        <td className="py-3 px-3 text-gray-400 whitespace-nowrap text-[11px]">
                          {rev.date}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ==================== SECTION 4: DUAL REVIEW SETTINGS (PRINT: HIDDEN) ==================== */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-gray-700 shadow-xs space-y-5 print:hidden">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Pengaturan Evaluasi Responden
              </span>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                Mode Review: Website Review & GForm
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Atur bagaimana review dikumpulkan dari pengguna setelah berhasil sholat 5 waktu dalam sehari.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              
              {/* Toggle Aktif / Nonaktif */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    Sistem Review & Evaluasi
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {config.isEnabled ? 'Review aktif dan akan muncul ke pengguna' : 'Review dinonaktifkan sementara'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, isEnabled: !config.isEnabled })}
                  className="text-emerald-600 dark:text-emerald-400 focus:outline-hidden"
                >
                  {config.isEnabled ? (
                    <ToggleRight className="w-10 h-10 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Mode Selection: Website Review vs GForm */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Pilihan Jalur Review
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, reviewMode: 'website' })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      config.reviewMode === 'website'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold text-xs block">1. Website Review (Utama)</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                      Rating 5 bintang interaktif langsung terhubung ke grafik admin di atas.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, reviewMode: 'gform' })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      config.reviewMode === 'gform'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold text-xs block">2. GForm Review Saja</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                      Mengarahkan pengguna mengisi formulir kuesioner Google Form eksternal.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, reviewMode: 'both' })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      config.reviewMode === 'both'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold text-xs block">3. Dual Review (Keduanya)</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                      Website Review aktif dan banner tautan Google Form tetap ditampilkan.
                    </span>
                  </button>
                </div>
              </div>

              {/* URL Google Form */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Link Google Form (GForm URL)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="url"
                    value={config.gformUrl}
                    onChange={(e) => setConfig({ ...config, gformUrl: e.target.value })}
                    placeholder="https://docs.google.com/forms/d/e/.../viewform"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Judul & Deskripsi Kuesioner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Judul Banner / Modal
                  </label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Deskripsi Singkat
                  </label>
                  <input
                    type="text"
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pengaturan review berhasil disimpan dan langsung disinkronkan ke seluruh aplikasi!</span>
                </div>
              )}

              <button
                type="submit"
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Review</span>
              </button>
            </form>
          </section>

        </div>
      )}

    </div>
  );
}
