import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, KeyRound, ShieldCheck, Link as LinkIcon, 
  Save, ExternalLink, CheckCircle2, AlertCircle, ArrowLeft, LogOut,
  BarChart3, Printer, Users, Star, Filter, RefreshCcw, Sparkles, MessageSquareQuote,
  Cloud, Database, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage, CURRENT_VERSION } from '../lib/storage';
import { AdminReviewConfig, WebsiteReview, APP_PATCH_NOTES } from '../types';
import { vibrateSuccess, playButtonTapSound, playSaveSuccessSound } from '../lib/audio';
import { AdminUsersPanel, AdminOverview } from '../components/AdminUsersPanel';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid
} from 'recharts';
import { 
  subscribeToReviews, fetchAllReviewsFromCloud, 
  fetchAdminConfigFromCloud, saveAdminConfigToCloud,
  fetchAllStudentProfilesDetailed, deleteStudentProfileFromCloud
} from '../lib/cloud-sync';

// Token admin TIDAK lagi ditulis di kode. Diverifikasi server (env ADMIN_TOKEN) lewat /api/admin/overview
// dan hanya disimpan di sessionStorage (hilang saat tab ditutup).
const ADMIN_SESSION_KEY = 'wi_admin_token';
const getAdminToken = () => {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) || '';
  } catch {
    return '';
  }
};

const RATING_CONFIG = [
  { star: 1, label: 'Tidak Membantu', color: '#FF4B91' }, // Memphis Pink
  { star: 2, label: 'Kurang Membantu', color: '#FF6B35' }, // Memphis Orange
  { star: 3, label: 'Cukup Membantu', color: '#FFE600' }, // Memphis Yellow
  { star: 4, label: 'Membantu', color: '#00F0FF' }, // Memphis Cyan
  { star: 5, label: 'Sangat Membantu', color: '#10B981' }, // Memphis Green
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getAdminToken());
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [authError, setAuthError] = useState('');

  // Form config state
  const [config, setConfig] = useState<AdminReviewConfig>(() => storage.getAdminReviewConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(true);
  const [showPatchNotesModal, setShowPatchNotesModal] = useState(false);

  // Reviews data state
  const [reviews, setReviews] = useState<WebsiteReview[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

  useEffect(() => {
    setConfig(storage.getAdminReviewConfig());
    const localList = storage.getWebsiteReviews();
    setReviews(localList);

    fetchAdminConfigFromCloud().then((cloudCfg) => {
      if (cloudCfg) {
        setConfig(cloudCfg);
        storage.setAdminReviewConfig(cloudCfg);
      }
    }).catch(console.error);

    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeToReviews((cloudReviews) => {
        setCloudConnected(true);
        if (cloudReviews && cloudReviews.length > 0) {
          const mergedMap = new Map<string, WebsiteReview>();
          localList.forEach(r => mergedMap.set(r.id, r));
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
    playButtonTapSound();
    setIsCloudSyncing(true);
    try {
      const cloudList = await fetchAllReviewsFromCloud();
      if (cloudList && cloudList.length > 0) {
        setReviews(cloudList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const loadOverview = async (token: string = getAdminToken()): Promise<boolean> => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      // 1. Try serverless endpoint first if token provided
      let serverOverview: AdminOverview | null = null;
      try {
        const res = await fetch('/api/admin/overview', { headers: { 'x-admin-token': token } });
        if (res.status === 401) {
          setOverviewError('Token admin salah atau sesi berakhir.');
          return false;
        }
        const json = await res.json().catch(() => null);
        if (res.ok && json?.ok && Array.isArray(json?.users) && json.users.length > 0) {
          serverOverview = json as AdminOverview;
        }
      } catch (err) {
        console.warn('API overview fetch failed, attempting direct Firestore fetch:', err);
      }

      if (serverOverview) {
        setOverview(serverOverview);
        return true;
      }

      // 2. Direct Firestore fallback (Guarantees 100% of accounts and reviews in Firestore are loaded)
      const cloudReviews = await fetchAllReviewsFromCloud();
      const detailedUsers = await fetchAllStudentProfilesDetailed(cloudReviews);

      const directOverview: AdminOverview = {
        generatedAt: new Date().toISOString(),
        totals: {
          users: detailedUsers.length,
          withNotifications: detailedUsers.length,
          notificationDevices: detailedUsers.length,
          platforms: { android: 0, ios: 0, desktop: detailedUsers.length },
          reviews: cloudReviews.length,
        },
        users: detailedUsers
      };

      setOverview(directOverview);
      return true;
    } catch (err: any) {
      console.error('Failed to load overview:', err);
      setOverviewError(err?.message || 'Gagal memuat ringkasan data dari Firestore.');
      return true;
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleDeleteUser = async (profileId: string, name: string) => {
    try {
      setOverviewLoading(true);
      const success = await deleteStudentProfileFromCloud(profileId);
      if (success) {
        vibrateSuccess();
        playButtonTapSound();
        alert(`Akun "${name}" berhasil dihapus permanen dari database Firestore.`);
        await loadOverview();
      } else {
        alert(`Gagal menghapus akun "${name}". Periksa koneksi Firestore.`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan saat menghapus: ${err?.message || err}`);
    } finally {
      setOverviewLoading(false);
    }
  };

  // Pulihkan sesi admin (bila token masih tersimpan) dan validasi ke server
  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    loadOverview(token).then((valid) => {
      if (!valid) {
        try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* abaikan */ }
        setIsAuthenticated(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) return;
    setAuthError('');
    const valid = await loadOverview(token);
    if (valid) {
      try { sessionStorage.setItem(ADMIN_SESSION_KEY, token); } catch { /* abaikan */ }
      playSaveSuccessSound();
      setIsAuthenticated(true);
      setTokenInput('');
      vibrateSuccess();
    } else {
      setAuthError('Token admin salah! Masukkan token yang valid.');
    }
  };

  const handleLogout = () => {
    playButtonTapSound();
    try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* abaikan */ }
    storage.setAdminAuthenticated(false);
    setIsAuthenticated(false);
    setOverview(null);
    setTokenInput('');
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    storage.setAdminReviewConfig(config);
    playSaveSuccessSound();
    vibrateSuccess();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);

    try {
      await saveAdminConfigToCloud(config);
    } catch (err) {
      console.error('Failed to sync config to cloud:', err);
    }
  };

  const uniqueUserNames = useMemo(() => {
    const names = new Set<string>();
    reviews.forEach(r => names.add(r.userName));
    return Array.from(names);
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (selectedUserFilter === 'all') return reviews;
    return reviews.filter(r => r.userName === selectedUserFilter);
  }, [reviews, selectedUserFilter]);

  const ratingDistribution = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    filteredReviews.forEach(r => {
      if (counts[r.rating] !== undefined) {
        counts[r.rating]++;
      }
    });

    return [
      { star: '1 Bintang', count: counts[1], label: 'Tidak Membantu', fill: '#FF4B91' },
      { star: '2 Bintang', count: counts[2], label: 'Kurang Membantu', fill: '#FF6B35' },
      { star: '3 Bintang', count: counts[3], label: 'Cukup Membantu', fill: '#FFE600' },
      { star: '4 Bintang', count: counts[4], label: 'Membantu', fill: '#00F0FF' },
      { star: '5 Bintang', count: counts[5], label: 'Sangat Membantu', fill: '#10B981' },
    ];
  }, [filteredReviews]);

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
    <div className="max-w-4xl mx-auto space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* Non-print Top Header */}
      <div className="flex items-center justify-between print:hidden flex-wrap gap-2">
        <button
          onClick={() => navigate('/')}
          className="memphis-btn memphis-btn-white px-3 py-1.5 text-xs gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPatchNotesModal(true)}
            className="memphis-btn memphis-btn-yellow px-3 py-1.5 text-xs gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Versi v{CURRENT_VERSION}</span>
          </button>

          {isAuthenticated && (
            <>
              <button
                onClick={handlePrintReport}
                className="memphis-btn memphis-btn-cyan px-3.5 py-1.5 text-xs gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Laporan</span>
              </button>
              <button
                onClick={handleLogout}
                className="memphis-btn bg-[#FF4B91] text-white hover:bg-[#FF4B91]/90 px-3 py-1.5 text-xs gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Kunci</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==================== LOGIN SCREEN ==================== */}
      {!isAuthenticated ? (
        <div className="memphis-card bg-white p-8 sm:p-12 text-center max-w-md mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE600] border-[1.5px] border-[#121212] shadow-[2px_2px_0px_#121212] text-[#121212] flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <span className="memphis-badge bg-black text-[#FFE600] mb-2">
              Panel Verifikasi Admin
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#121212]">
              Admin Dashboard
            </h1>
            <p className="text-xs font-bold text-gray-500 mt-1">
              Masukkan token admin untuk mengakses grafik evaluasi kuesioner dan database responden.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold mb-1.5">
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
                  className="memphis-input w-full pl-10 pr-4 py-2.5 text-xs font-bold"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-[#FF4B91] text-white border-[1.5px] border-[#121212] rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="memphis-btn memphis-btn-primary w-full py-3 text-xs font-bold"
            >
              Buka Admin Dashboard
            </button>
          </form>
        </div>
      ) : (
        /* ==================== AUTHENTICATED ADMIN AREA ==================== */
        <div className="space-y-6">
          
          {/* Admin Hero Banner (Memphis Style) */}
          <div className="p-6 bg-[#FFE600] border-[1.5px] border-[#121212] rounded-2xl shadow-[2px_2px_0px_#121212] space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="memphis-badge bg-black text-[#FFE600]">
                Akses Terverifikasi
              </span>
              <span className="memphis-badge bg-[#00F0FF] text-black">
                <Cloud className="w-3 h-3 mr-1" />
                Firestore Terhubung ({reviews.length} Ulasan)
              </span>
              <button
                type="button"
                onClick={handleRefreshCloud}
                disabled={isCloudSyncing}
                className="memphis-btn memphis-btn-white px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider"
              >
                <RefreshCcw className={`w-3 h-3 mr-1 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span>{isCloudSyncing ? 'Sinkron...' : 'Refresh Cloud'}</span>
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#121212]">
              Laporan Evaluasi Website WaktuIbadah
            </h1>
            <p className="text-xs font-bold text-gray-700 max-w-2xl">
              Pantau ulasan mahasiswa atas penggunaan ibadah harian, jadwal kuliah, dan efektivitas aplikasi dalam format grafik siap cetak.
            </p>
          </div>

          {/* Pengguna terdaftar (data dari server & Firestore, dilindungi token admin) */}
          <AdminUsersPanel
            data={overview}
            loading={overviewLoading}
            error={overviewError}
            onRefresh={() => loadOverview()}
            onDeleteUser={handleDeleteUser}
          />

          {/* Stats Summary (Memphis Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="memphis-card p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#00F0FF] border-[1.5px] border-black flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Total Responden
                </span>
                <span className="text-2xl font-bold text-[#121212]">
                  {stats.total} <span className="text-xs font-bold text-gray-400">Mahasiswa</span>
                </span>
              </div>
            </div>

            <div className="memphis-card p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#FFE600] border-[1.5px] border-black flex items-center justify-center font-bold shrink-0">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Rata-rata Rating
                </span>
                <span className="text-2xl font-bold text-[#121212]">
                  {stats.avg} <span className="text-xs font-bold text-gray-400">/ 5.0</span>
                </span>
              </div>
            </div>

            <div className="memphis-card p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#10B981] text-white border-[1.5px] border-black flex items-center justify-center font-bold shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Tingkat Kepuasan
                </span>
                <span className="text-2xl font-bold text-[#121212]">
                  {stats.satisfiedPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="memphis-card p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 stroke-[2.5]" />
              <span className="text-xs font-bold">Filter Responden:</span>
            </div>
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="memphis-input px-3 py-1.5 text-xs font-bold"
            >
              <option value="all">Semua Mahasiswa ({reviews.length})</option>
              {uniqueUserNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Chart Section (Memphis Card) */}
          <section className="memphis-card p-4 space-y-4">
            <div className="flex items-center gap-2 border-b-[1.5px] border-black pb-3">
              <BarChart3 className="w-5 h-5 stroke-[2.5]" />
              <h2 className="font-bold text-sm tracking-tight">Distribusi Rating Skala 1 - 5 Bintang</h2>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="star" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '2px solid #121212', 
                      borderRadius: '8px', 
                      boxShadow: '3px 3px 0px #121212',
                      fontWeight: 'bold' 
                    }} 
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {ratingDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#121212" strokeWidth={2} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Reviews List */}
          <section className="memphis-card p-4 space-y-4">
            <div className="flex items-center justify-between border-b-[1.5px] border-black pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 stroke-[2.5]" />
                <h2 className="font-bold text-sm tracking-tight">
                  Daftar Feedback & Review Responden ({filteredReviews.length})
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {filteredReviews.length === 0 ? (
                <p className="text-xs font-bold text-gray-500 py-6 text-center">Belum ada review yang masuk.</p>
              ) : (
                filteredReviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 bg-[#FFFDF8] border-[1.5px] border-black rounded-xl shadow-[2px_2px_0px_#121212] space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-xs">{rev.userName}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={`w-3.5 h-3.5 ${star <= rev.rating ? 'fill-[#FFE600] text-black stroke-[2]' : 'text-gray-300'}`} 
                          />
                        ))}
                        <span className="text-[10px] font-bold uppercase ml-1.5 bg-black text-white px-1.5 py-0.5 rounded">
                          {rev.ratingLabel}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 italic">"{rev.comment}"</p>
                    <span className="text-[10px] font-bold text-gray-400 block">
                      {new Date(rev.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Admin Review Config Form */}
          <section className="memphis-card p-4 space-y-4">
            <div className="flex items-center gap-2 border-b-[1.5px] border-black pb-3">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              <h2 className="font-bold text-sm tracking-tight">Konfigurasi Form Evaluasi Proyek PAI</h2>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1">
                  Tautan Google Form (Opsional)
                </label>
                <input
                  type="url"
                  value={config.gformUrl}
                  onChange={(e) => setConfig({ ...config, gformUrl: e.target.value })}
                  placeholder="https://docs.google.com/forms/d/..."
                  className="memphis-input w-full px-3.5 py-2.5 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Judul Banner Review
                  </label>
                  <input
                    type="text"
                    value={config.title}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    className="memphis-input w-full px-3.5 py-2.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">
                    Deskripsi Singkat
                  </label>
                  <input
                    type="text"
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    className="memphis-input w-full px-3.5 py-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-[#10B981] text-white border-[1.5px] border-black rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Pengaturan evaluasi berhasil disimpan ke Firestore!</span>
                </div>
              )}

              <button
                type="submit"
                className="memphis-btn memphis-btn-primary py-2.5 px-5 text-xs font-bold gap-2"
              >
                <Save className="w-4 h-4" />
                Simpan Konfigurasi
              </button>
            </form>
          </section>

        </div>
      )}

      {/* Patch Notes Modal */}
      {showPatchNotesModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="memphis-card bg-white w-full max-w-lg p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-[1.5px] border-black pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FFE600] border-[1.5px] border-black rounded-xl flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">
                    Catatan Rilis v{APP_PATCH_NOTES[0].version}
                  </h3>
                  <p className="text-xs font-bold text-gray-500">{APP_PATCH_NOTES[0].releaseDate}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPatchNotesModal(false)}
                className="w-8 h-8 rounded-lg border-[1.5px] border-black flex items-center justify-center font-bold hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-black">
                Sorotan Pembaruan:
              </h4>
              <ul className="space-y-1.5 text-xs font-semibold text-gray-700 pl-2">
                {APP_PATCH_NOTES[0].highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-[#FFE600]/30 border-[1.5px] border-black rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-black">
                Saran Pembaruan & Temuan Berguna Berikutnya:
              </h4>
              <ul className="space-y-1 text-xs font-semibold text-gray-800 pl-2">
                {APP_PATCH_NOTES[0].recommendations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-black font-bold">★</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowPatchNotesModal(false)}
              className="memphis-btn memphis-btn-primary w-full py-2.5 text-xs font-bold"
            >
              Tutup Catatan
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
