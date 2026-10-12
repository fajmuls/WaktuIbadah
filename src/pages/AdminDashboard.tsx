import React, { useState, useEffect } from 'react';
import { 
  Lock, KeyRound, ShieldCheck, Link as LinkIcon, ToggleLeft, ToggleRight, 
  Save, ExternalLink, CheckCircle2, AlertCircle, ArrowLeft, Eye, Sparkles, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../lib/storage';
import { AdminReviewConfig } from '../types';
import { vibrateSuccess } from '../lib/audio';

const ADMIN_TOKEN_KEY = 'fajrul22';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('wi_admin_auth') === 'true';
  });
  const [authError, setAuthError] = useState('');

  // Form config state
  const [config, setConfig] = useState<AdminReviewConfig>(() => storage.getAdminReviewConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setConfig(storage.getAdminReviewConfig());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim() === ADMIN_TOKEN_KEY) {
      setIsAuthenticated(true);
      sessionStorage.setItem('wi_admin_auth', 'true');
      setAuthError('');
      vibrateSuccess();
    } else {
      setAuthError('Kode token admin salah! Akses ditolak.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('wi_admin_auth');
    setTokenInput('');
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdminReviewConfig = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    storage.setAdminReviewConfig(updated);
    setConfig(updated);
    setSaveSuccess(true);
    vibrateSuccess();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Aplikasi</span>
        </button>

        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Kunci Admin</span>
          </button>
        )}
      </div>

      {/* TOKEN AUTHENTICATION SCREEN */}
      {!isAuthenticated ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-sm text-center max-w-md mx-auto space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Admin Area Proyek PAI
            </span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              Masukkan Kode Token Admin
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Halaman ini dikhususkan bagi pengembang proyek untuk mengelola link formulir kuesioner review.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Kode Token Rahasia
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Ketik token admin..."
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
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
            >
              Buka Akses Admin Dashboard
            </button>
          </form>
        </div>
      ) : (
        /* AUTHENTICATED ADMIN DASHBOARD */
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full text-emerald-100">
                Akses Terverifikasi • Token fajrul22
              </span>
              <h1 className="text-xl sm:text-2xl font-bold mt-2">
                Dashboard Manajemen Review & GForm
              </h1>
              <p className="text-xs text-emerald-100/90 mt-1 max-w-lg leading-relaxed">
                Kelola penyebaran formulir evaluasi proyek PAI. Pengaturan yang disimpan di sini akan otomatis diterapkan secara real-time ke seluruh pengunjung website.
              </p>
            </div>
          </div>

          {/* Form Configuration Card */}
          <form onSubmit={handleSaveConfig} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan Google Form & Status Review</span>
            </h2>

            {/* Toggle Status Aktif/Nonaktif */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                  Status Banner Review di Website
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {config.isEnabled 
                    ? 'Aktif: Banner dan tombol review Google Form akan muncul di dashboard & menu pengguna.'
                    : 'Nonaktif: Banner review disembunyikan dari semua pengguna.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setConfig({ ...config, isEnabled: !config.isEnabled })}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs transition-all ${
                  config.isEnabled
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {config.isEnabled ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    <span>Aktif</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    <span>Nonaktif</span>
                  </>
                )}
              </button>
            </div>

            {/* Link GForm Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Google Form (GForm URL)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={config.gformUrl}
                  onChange={(e) => setConfig({ ...config, gformUrl: e.target.value })}
                  placeholder="https://forms.gle/... atau https://docs.google.com/forms/..."
                  className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                {config.gformUrl && (
                  <a
                    href={config.gformUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-200 transition-colors flex items-center justify-center shrink-0"
                    title="Uji coba buka link GForm"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Judul Banner */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Judul Formulir / Banner Review
              </label>
              <input
                type="text"
                required
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Misal: Evaluasi Proyek PAI: Penggunaan Aplikasi WaktuIbadah"
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Deskripsi Singkat */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Deskripsi / Instruksi Responden
              </label>
              <textarea
                rows={3}
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Jelaskan tujuan kuesioner kepada responden..."
                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* LIVE PREVIEW OF THE BANNER */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2">
                <Eye className="w-3.5 h-3.5" />
                <span>Pratinjau Tampilan untuk Pengguna:</span>
              </div>

              {config.isEnabled ? (
                <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/60 dark:to-emerald-950/60 rounded-2xl border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
                      Ulasan & Evaluasi Proyek
                    </span>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1">
                      {config.title || 'Judul Kuesioner'}
                    </h4>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2">
                      {config.description || 'Deskripsi kuesioner...'}
                    </p>
                  </div>

                  <a
                    href={config.gformUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 hover:bg-teal-700"
                  >
                    <span>Isi Form</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400">
                  Banner sedang dinonaktifkan (pengguna tidak akan melihat widget review).
                </div>
              )}
            </div>

            {/* Save Status Notification */}
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Pengaturan berhasil disimpan dan langsung aktif untuk semua pengguna!</span>
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terapkan Perubahan ke Semua Pengguna</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
