import React, { useEffect, useState } from 'react';
import { BellRing, CheckCircle2, Share, SquarePlus, Vibrate, Volume2, BellOff, X, RefreshCw } from 'lucide-react';
import { storage } from '../lib/storage';
import { vibrateSuccess } from '../lib/audio';
import { enablePush, getPushSupport, isPushActive, sendServerTestPush, PushSupport } from '../lib/push';

export type NotifMode = 'sound_and_vibrate' | 'vibrate_only' | 'silent';
export const OPEN_EVENT = 'wi_open_notification_setup';
const LATER_KEY = 'wi_notif_later_session';

const MODES: { id: NotifMode; title: string; desc: string; icon: React.ReactNode }[] = [
  { id: 'sound_and_vibrate', title: 'Suara + getar', desc: 'Berbunyi dan bergetar saat azan & pengingat.', icon: <Volume2 className="w-4 h-4" /> },
  { id: 'vibrate_only', title: 'Getar saja', desc: 'Bergetar tanpa nada. Bila HP masih berbunyi, ubah HP ke mode getar.', icon: <Vibrate className="w-4 h-4" /> },
  { id: 'silent', title: 'Senyap', desc: 'Hanya muncul di layar, tanpa suara dan getar.', icon: <BellOff className="w-4 h-4" /> },
];

export function currentMode(): NotifMode {
  const rs = storage.getReminderSettings();
  if (rs.silentNotifications) return 'silent';
  return rs.reminderType === 'vibrate_only' ? 'vibrate_only' : 'sound_and_vibrate';
}

export function saveMode(mode: NotifMode) {
  const rs = storage.getReminderSettings();
  storage.setReminderSettings({
    ...rs,
    silentNotifications: mode === 'silent',
    reminderType: mode === 'vibrate_only' ? 'vibrate_only' : 'sound_and_vibrate',
  });
}

/**
 * Pengaturan notifikasi satu pintu. Muncul otomatis setiap aplikasi dibuka selama notifikasi
 * belum aktif (browser tidak mengizinkan aktivasi tanpa ketukan pengguna, jadi pengguna cukup
 * memilih mode lalu mengetuk "Aktifkan"). Bisa dibuka manual lewat event OPEN_EVENT.
 */
export const NotificationSetupModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'choose' | 'testing' | 'verify' | 'help'>('choose');
  const [mode, setMode] = useState<NotifMode>(currentMode());
  const [support, setSupport] = useState<PushSupport>(getPushSupport());
  const [error, setError] = useState('');
  const [active, setActive] = useState(isPushActive());

  const refresh = () => {
    setSupport(getPushSupport());
    setActive(isPushActive());
    setMode(currentMode());
  };

  // Buka otomatis bila notifikasi belum aktif (sekali per sesi bila ditunda)
  useEffect(() => {
    const user = storage.getUser();
    if (!user?.isOnboarded) return;
    const sup = getPushSupport();
    if (sup === 'not-configured' || sup === 'unsupported') return;
    if (isPushActive()) return;
    let later = false;
    try { later = sessionStorage.getItem(LATER_KEY) === '1'; } catch { /* abaikan */ }
    if (later) return;
    const t = setTimeout(() => { refresh(); setStep('choose'); setOpen(true); }, 1200);
    return () => clearTimeout(t);
  }, []);

  // Dibuka manual (mis. tombol di Beranda / Pengaturan)
  useEffect(() => {
    const onOpen = () => { refresh(); setError(''); setStep('choose'); setOpen(true); };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  if (!open) return null;

  const permission: NotificationPermission | 'unsupported' = 'Notification' in window ? Notification.permission : 'unsupported';

  const later = () => {
    try { sessionStorage.setItem(LATER_KEY, '1'); } catch { /* abaikan */ }
    setOpen(false);
  };

  const handleEnable = async () => {
    setError('');
    saveMode(mode); // simpan pilihan suara dulu agar ikut terkirim ke server
    setStep('testing');
    const res = await enablePush();
    refresh();
    if (!res.ok) {
      setError(res.message || 'Gagal mengaktifkan notifikasi.');
      setStep('choose');
      return;
    }
    const test = await sendServerTestPush();
    if (!test.ok) {
      setError(test.message || 'Notifikasi uji gagal dikirim.');
      setStep('help');
      return;
    }
    setStep('verify');
  };

  const confirmOk = () => {
    storage.setNotificationVerified(true);
    vibrateSuccess();
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Aktifkan notifikasi">
      <div className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl border-[1.5px] border-[#121212] shadow-[3px_3px_0px_#121212] max-h-[92vh] overflow-y-auto">
        <div className="flex items-start gap-3 p-4 pb-2">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-400 border-[1.5px] border-black flex items-center justify-center">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#121212] leading-tight">
              {active ? 'Pengaturan notifikasi' : 'Aktifkan notifikasi salat'}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Azan, pengingat salat, jadwal kuliah, dan tenggat tugas tetap sampai walau aplikasi ditutup.
            </p>
          </div>
          <button onClick={later} aria-label="Tutup" className="p-1 text-gray-500 hover:text-black shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 pt-2 space-y-3">
          {step === 'choose' && (
            <>
              {support === 'ios-needs-install' ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1.5">
                  <div className="font-bold">Di iPhone/iPad, pasang aplikasinya dulu</div>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Buka lewat <b>Safari</b>, ketuk <Share className="inline w-3.5 h-3.5 -mt-0.5" /> <b>Bagikan</b>.</li>
                    <li>Pilih <SquarePlus className="inline w-3.5 h-3.5 -mt-0.5" /> <b>Tambah ke Layar Utama</b>.</li>
                    <li>Buka WaktuIbadah dari ikon di layar utama, lalu aktifkan notifikasi (butuh iOS 16.4 ke atas).</li>
                  </ol>
                </div>
              ) : (
                <>
                  <fieldset className="space-y-2">
                    <legend className="text-xs font-bold text-gray-800 mb-1.5">Pilih cara notifikasi berbunyi</legend>
                    {MODES.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border-[1.5px] cursor-pointer transition-colors ${
                          mode === m.id ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300 bg-white'
                        }`}
                      >
                        <input type="radio" name="notif-mode" className="mt-1 accent-emerald-600" checked={mode === m.id} onChange={() => setMode(m.id)} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">{m.icon}{m.title}</span>
                          <span className="block text-[11px] text-gray-600 leading-snug">{m.desc}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>

                  {permission === 'denied' && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950 space-y-1">
                      <div className="font-bold">Izin notifikasi sedang diblokir</div>
                      <p>Buka Pengaturan HP, pilih Aplikasi, lalu WaktuIbadah (atau Chrome), Notifikasi, dan izinkan. Setelah itu ketuk tombol di bawah.</p>
                    </div>
                  )}
                  {error && <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950">{error}</div>}
                </>
              )}

              {support !== 'ios-needs-install' && (
                <button
                  onClick={handleEnable}
                  className="w-full h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold border-[1.5px] border-black shadow-[2px_2px_0px_#121212] active:translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <BellRing className="w-4 h-4" />
                  {active ? 'Simpan & kirim notifikasi uji' : 'Aktifkan notifikasi'}
                </button>
              )}
              <button onClick={later} className="w-full text-xs font-semibold text-gray-500 hover:text-black py-1">
                Nanti saja (akan diingatkan lagi saat aplikasi dibuka)
              </button>
            </>
          )}

          {step === 'testing' && (
            <div className="py-6 text-center space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-700" />
              <p className="text-sm font-bold">Mengaktifkan dan mengirim notifikasi uji...</p>
              <p className="text-xs text-gray-600">Jika browser meminta izin, ketuk Izinkan.</p>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950">
                Notifikasi uji sudah dikirim dari server. Lihat bilah notifikasi HP Anda. Pesannya <b>"Tes Notifikasi WaktuIbadah"</b> seharusnya muncul dalam beberapa detik.
              </div>
              <button onClick={confirmOk} className="w-full h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold border-[1.5px] border-black shadow-[2px_2px_0px_#121212] flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Ya, notifikasi muncul
              </button>
              <button onClick={() => setStep('help')} className="w-full h-10 rounded-xl bg-white text-sm font-bold border-[1.5px] border-black">
                Belum muncul
              </button>
            </div>
          )}

          {step === 'help' && (
            <div className="space-y-2.5 text-xs text-gray-800">
              {error && <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950">{error}</div>}
              <p className="font-bold">Jika notifikasi belum muncul, periksa:</p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>Mode <b>Jangan Ganggu</b> dan mode senyap total pada HP dimatikan.</li>
                <li>Izin notifikasi untuk WaktuIbadah (atau Chrome) aktif di Pengaturan HP.</li>
                <li>Android: Pengaturan, Aplikasi, WaktuIbadah/Chrome, Baterai, pilih <b>Tanpa batasan</b>. Di Xiaomi, Oppo, Vivo, dan Samsung aktifkan juga <b>Mulai otomatis</b>.</li>
                <li>Pastikan internet aktif, lalu coba kirim uji lagi.</li>
              </ol>
              <button onClick={handleEnable} className="w-full h-10 rounded-xl bg-emerald-600 text-white text-sm font-bold border-[1.5px] border-black">
                Kirim notifikasi uji lagi
              </button>
              <button onClick={later} className="w-full text-xs font-semibold text-gray-500 hover:text-black py-1">Tutup</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
