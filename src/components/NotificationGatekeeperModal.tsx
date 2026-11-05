import React, { useState, useEffect } from 'react';
import { 
  Bell, BellRing, Volume2, ShieldCheck, AlertTriangle, 
  CheckCircle2, Smartphone, Laptop, Sparkles, RefreshCw, X, ChevronRight, HelpCircle, Share, SquarePlus
} from 'lucide-react';
import { storage } from '../lib/storage';
import { registerPWA, getPWAStatus, PWAStatus } from '../lib/pwa-service';
import { stopAlarmSound, vibrateSuccess, playButtonTapSound } from '../lib/audio';
import { enablePush, getPushSupport, isPushActive, sendServerTestPush, PushSupport } from '../lib/push';

interface NotificationGatekeeperModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

const SNOOZE_KEY = 'wi_push_prompt_snooze_until';

export function NotificationGatekeeperModal({ forceOpen = false, onClose }: NotificationGatekeeperModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'intro' | 'testing' | 'verify' | 'guide'>('intro');
  const [pwaStatus, setPwaStatus] = useState<PWAStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [support, setSupport] = useState<PushSupport>(getPushSupport());
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
    }
    checkStatus();
    const sup = getPushSupport();
    setSupport(sup);

    // Buka otomatis bila notifikasi push BELUM aktif di perangkat ini (dan belum ditunda).
    // Di iPhone yang belum memasang aplikasi, ajakan dilakukan oleh InstallPwaBanner.
    let snoozed = false;
    try {
      snoozed = Date.now() < Number(localStorage.getItem(SNOOZE_KEY) || 0);
    } catch {
      /* abaikan */
    }
    if (forceOpen || (sup === 'supported' && !isPushActive() && !snoozed)) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const checkStatus = async () => {
    const status = await getPWAStatus();
    setPwaStatus(status);
    if ('Notification' in window) setPermissionState(Notification.permission);
  };

  // Satu sentuhan: minta izin -> berlangganan push -> kirim notifikasi uji DARI SERVER
  const handleEnable = async () => {
    playButtonTapSound();
    setErrorMsg('');
    setIsTesting(true);
    setStep('testing');
    try {
      await registerPWA();
      const res = await enablePush();
      await checkStatus();
      if (!res.ok) {
        setErrorMsg(res.message || 'Gagal mengaktifkan notifikasi.');
        setStep('guide');
        return;
      }
      const test = await sendServerTestPush();
      if (!test.ok) {
        setErrorMsg(test.message || 'Notifikasi uji gagal dikirim.');
        setStep('guide');
        return;
      }
      setStep('verify');
    } catch (err: any) {
      console.error('Aktivasi notifikasi gagal:', err);
      setErrorMsg(err?.message || 'Terjadi kesalahan.');
      setStep('guide');
    } finally {
      setIsTesting(false);
    }
  };

  const handleRequestPermission = handleEnable;
  const handleRunDiagnosticTest = handleEnable;

  const handleConfirmSuccess = () => {
    stopAlarmSound();
    storage.setNotificationVerified(true);
    vibrateSuccess();
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleReportFailed = () => {
    stopAlarmSound();
    setStep('guide');
  };

  // "Lewati" hanya menunda sehari: notifikasi adalah fitur utama, jadi akan diingatkan lagi.
  const handleDismissModal = () => {
    stopAlarmSound();
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + 24 * 3600 * 1000));
    } catch {
      /* abaikan */
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FFFDF8] border-[3px] border-[#121212] rounded-2xl sm:rounded-3xl shadow-[6px_6px_0px_#121212] max-w-md w-full overflow-hidden relative">
        
        {/* Header Banner */}
        <div className="p-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 border-b-[2.5px] border-[#121212] flex items-center justify-between text-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0px_#121212] shrink-0">
              <BellRing className="w-5 h-5 text-emerald-800 animate-bounce" />
            </div>
            <div>
              <span className="memphis-badge bg-black text-[#6EE7B7] text-[8px] px-1.5 py-0.5">
                Pengingat Waktu Salat
              </span>
              <h2 className="text-base font-black uppercase tracking-tight text-[#121212] mt-0.5">
                Izin Notifikasi & Azan
              </h2>
            </div>
          </div>

          {/* Tombol tutup (menunda sehari) */}
          {(

            <button 
              onClick={handleDismissModal}
              className="w-8 h-8 rounded-xl bg-white border-2 border-black flex items-center justify-center hover:bg-gray-100 font-black shadow-[1.5px_1.5px_0px_#121212]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* STEP 1: INTRO & PERMISSION REQUEST */}
          {step === 'intro' && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-700 leading-relaxed">
                Agar pengingat salat 5 waktu muncul tepat waktu di HP / laptop Anda, <strong>bahkan saat aplikasi ditutup</strong>, aktifkan notifikasi di bawah ini. Notifikasi dikirim dari server, jadi tidak bergantung pada aplikasi yang sedang terbuka.
              </p>

              {/* Diagnostic Card */}
              <div className="memphis-card p-3.5 bg-white space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                  <span className="text-gray-700 font-bold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                    Notifikasi Browser / PWA:
                  </span>
                  <span className="font-black text-emerald-700">
                    Satu-Sentuhan
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                  <span className="text-gray-700 font-bold flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-emerald-700" />
                    Status Izin Peramban:
                  </span>
                  <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded border border-black ${
                    permissionState === 'granted' 
                      ? 'bg-emerald-400 text-black' 
                      : permissionState === 'denied'
                        ? 'bg-[#FF4B91] text-white'
                        : 'bg-[#FFE600] text-black'
                  }`}>
                    {permissionState === 'granted' ? 'Telah Diizinkan' : permissionState === 'denied' ? 'Diblokir Browser' : 'Perlu Izin'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-bold flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                    Suara & Getar:
                  </span>
                  <span className="font-black text-black">
                    Bawaan HP + getar
                  </span>
                </div>
              </div>

              {support === 'ios-needs-install' && (
                <div className="p-3 bg-[#FFE600] border-2 border-black rounded-xl text-[11px] font-bold text-black space-y-1">
                  <div className="font-black uppercase">Di iPhone/iPad, pasang dulu aplikasinya</div>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Di Safari, ketuk <Share className="inline w-3.5 h-3.5 -mt-0.5" /> <b>Bagikan</b>.</li>
                    <li>Pilih <SquarePlus className="inline w-3.5 h-3.5 -mt-0.5" /> <b>Tambah ke Layar Utama</b>.</li>
                    <li>Buka WaktuIbadah dari ikon di layar utama, lalu aktifkan notifikasi (butuh iOS 16.4+).</li>
                  </ol>
                </div>
              )}
              {support === 'unsupported' && (
                <div className="p-3 bg-[#FF4B91] text-white border-2 border-black rounded-xl text-[11px] font-bold">
                  Browser ini belum mendukung notifikasi push. Gunakan Chrome/Edge (Android &amp; PC) atau pasang sebagai aplikasi.
                </div>
              )}
              {support === 'not-configured' && (
                <div className="p-3 bg-[#FF4B91] text-white border-2 border-black rounded-xl text-[11px] font-bold">
                  Server notifikasi belum dikonfigurasi oleh pengembang (kunci VAPID kosong).
                </div>
              )}

              {support !== 'supported' ? null : permissionState === 'granted' ? (
                <button
                  onClick={handleRunDiagnosticTest}
                  className="memphis-btn memphis-btn-green w-full py-3 text-xs font-black uppercase tracking-wider gap-2 shadow-[3px_3px_0px_#121212]"
                >
                  <BellRing className="w-4 h-4" />
                  <span>Aktifkan & Uji Notifikasi Sekarang</span>
                </button>
              ) : (
                <button
                  onClick={handleRequestPermission}
                  className="memphis-btn memphis-btn-green w-full py-3.5 text-xs font-black uppercase tracking-wider gap-2 shadow-[3px_3px_0px_#121212]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Aktifkan Notifikasi Salat & Azan</span>
                </button>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] font-bold text-gray-500">
                  *Pilih "Izinkan / Allow" jika muncul pop-up browser
                </p>
                <button
                  onClick={handleDismissModal}
                  className="text-[10px] font-black text-gray-500 hover:text-black underline uppercase"
                >
                  Lewati
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: TESTING PROGRESS */}
          {step === 'testing' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#00F0FF] border-2 border-black shadow-[3px_3px_0px_#121212] flex items-center justify-center animate-bounce">
                <RefreshCw className="w-7 h-7 text-black animate-spin" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase text-[#121212]">
                  Menguji Notifikasi & Suara Azan...
                </h3>
                <p className="text-xs font-bold text-gray-600 mt-1">
                  Mengaktifkan notifikasi lalu meminta server mengirim pesan tes ke perangkat ini.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFICATION CONFIRMATION */}
          {step === 'verify' && (
            <div className="space-y-3.5">
              <div className="memphis-card p-4 bg-[#00F0FF]/20 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-black text-[#6EE7B7] flex items-center justify-center mx-auto font-black shadow-[2px_2px_0px_#121212]">
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
                <h3 className="font-black text-xs sm:text-sm uppercase text-[#121212]">
                  Apakah Notifikasi Tes Muncul?
                </h3>
                <p className="text-xs font-bold text-gray-700 leading-relaxed">
                  Periksa bilah status/panel notifikasi HP atau laptop Anda. Pesan "Tes Notifikasi WaktuIbadah" seharusnya muncul dalam beberapa detik, sekalipun Anda menutup aplikasi.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={handleConfirmSuccess}
                  className="memphis-btn memphis-btn-green w-full py-3 text-xs font-black uppercase tracking-wider gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                  <span>Ya, Berfungsi Sempurna (Lanjutkan)</span>
                </button>

                <button
                  onClick={handleReportFailed}
                  className="memphis-btn memphis-btn-white w-full py-2.5 text-xs font-black uppercase tracking-wider gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tidak Muncul / Panduan Pengaturan HP</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: MOBILE TROUBLESHOOTING GUIDE */}
          {step === 'guide' && (
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              <div className="p-3 bg-[#FF4B91] text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_#121212] space-y-1">
                <div className="flex items-center gap-2 font-black text-xs uppercase">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Solusi Notifikasi Diblokir HP:</span>
                </div>
                <p className="text-[11px] font-bold leading-relaxed">
                  {errorMsg || 'Browser seluler sering menahan notifikasi sampai izin diberikan manual.'}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white border-2 border-black rounded-xl">
                  <div className="font-black text-black flex items-center gap-1.5 mb-1 uppercase">
                    <span className="w-4 h-4 rounded bg-black text-white flex items-center justify-center text-[10px]">1</span>
                    Buka Izin di Address Bar Browser
                  </div>
                  <p className="text-gray-600 font-bold text-[11px] leading-relaxed">
                    Ketuk ikon gembok 🔒 di kiri alamat URL peramban Anda ➔ pilih <strong>Setelan Situs / Izin</strong> ➔ ubah <strong>Notifikasi & Suara</strong> menjadi <strong>Izinkan</strong>.
                  </p>
                </div>

                <div className="p-3 bg-white border-2 border-black rounded-xl">
                  <div className="font-black text-black flex items-center gap-1.5 mb-1 uppercase">
                    <span className="w-4 h-4 rounded bg-black text-white flex items-center justify-center text-[10px]">2</span>
                    Periksa Volume HP & Mode Jangan Ganggu
                  </div>
                  <p className="text-gray-600 font-bold text-[11px] leading-relaxed">
                    Pastikan HP tidak dalam mode Silent/Mute total dan mode Do Not Disturb dinonaktifkan.
                  </p>
                </div>

                <div className="p-3 bg-white border-2 border-black rounded-xl">
                  <div className="font-black text-black flex items-center gap-1.5 mb-1 uppercase">
                    <span className="w-4 h-4 rounded bg-black text-white flex items-center justify-center text-[10px]">3</span>
                    Android: Longgarkan Penghemat Baterai
                  </div>
                  <p className="text-gray-600 font-bold text-[11px] leading-relaxed">
                    Pengaturan ➔ Aplikasi ➔ WaktuIbadah (atau Chrome) ➔ Baterai ➔ pilih <strong>Tanpa batasan</strong>. Di Xiaomi/Oppo/Vivo/Samsung aktifkan juga <strong>Mulai otomatis</strong>. Tanpa ini sebagian HP menunda notifikasi.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleRunDiagnosticTest}
                  className="memphis-btn memphis-btn-green flex-1 py-2.5 text-xs font-black uppercase tracking-wider gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Cek Ulang</span>
                </button>

                <button
                  onClick={handleConfirmSuccess}
                  className="memphis-btn memphis-btn-white py-2.5 px-4 text-xs font-black uppercase tracking-wider"
                >
                  Lewati
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
