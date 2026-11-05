import React, { useEffect, useState } from 'react';
import { Download, Share, X, SquarePlus, BellRing } from 'lucide-react';
import { storage } from '../lib/storage';
import { canPromptInstall, promptInstall, shouldRecommendInstall, snoozeInstall, subscribeInstall } from '../lib/install';
import { isIOS, isStandalone } from '../lib/push';
import { playButtonTapSound, vibrateSuccess } from '../lib/audio';

/**
 * Ajakan memasang WaktuIbadah sebagai aplikasi (PWA).
 * - Android/PC (Chrome/Edge): tombol "Pasang Aplikasi" memicu dialog bawaan browser.
 * - iPhone/iPad (Safari): panduan "Bagikan > Tambah ke Layar Utama" (iOS tidak punya dialog otomatis).
 * Wajib di iOS karena Web Push hanya berfungsi untuk aplikasi yang sudah dipasang.
 */
export const InstallPwaBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [canPrompt, setCanPrompt] = useState(canPromptInstall());
  const ios = isIOS();

  useEffect(() => subscribeInstall(() => setCanPrompt(canPromptInstall())), []);

  useEffect(() => {
    const user = storage.getUser();
    if (!user?.isOnboarded || isStandalone() || !shouldRecommendInstall()) return;
    const t = setTimeout(() => setVisible(true), 4500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    playButtonTapSound();
    const result = await promptInstall();
    if (result === 'accepted') {
      vibrateSuccess();
      setVisible(false);
    }
  };

  const handleLater = () => {
    snoozeInstall(3);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Pasang aplikasi WaktuIbadah"
      className="fixed bottom-24 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-40 memphis-card bg-white p-3.5 shadow-[4px_4px_0px_#121212] space-y-2.5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-400 border-2 border-black flex items-center justify-center">
          <BellRing className="w-5 h-5 text-black" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-black uppercase tracking-wide text-[#121212]">Pasang agar azan & pengingat sampai</h3>
          <p className="text-[11px] font-bold text-gray-700 leading-snug mt-0.5">
            Dengan aplikasi terpasang, notifikasi salat muncul tepat waktu walau aplikasi ditutup.
          </p>
        </div>
        <button onClick={handleLater} aria-label="Nanti saja" className="p-1 text-gray-500 hover:text-black shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {canPrompt ? (
        <button
          onClick={handleInstall}
          className="memphis-btn memphis-btn-green w-full py-2.5 text-xs font-black uppercase tracking-wider gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Pasang Aplikasi</span>
        </button>
      ) : ios ? (
        <ol className="text-[11px] font-bold text-gray-800 space-y-1.5 list-decimal pl-4">
          <li>
            Buka lewat <b>Safari</b>, ketuk tombol <Share className="inline w-3.5 h-3.5 -mt-0.5" /> <b>Bagikan</b>.
          </li>
          <li>
            Pilih <SquarePlus className="inline w-3.5 h-3.5 -mt-0.5" /> <b>Tambah ke Layar Utama</b>, lalu <b>Tambah</b>.
          </li>
          <li>Buka WaktuIbadah dari ikon di layar utama, lalu aktifkan notifikasi.</li>
        </ol>
      ) : (
        <p className="text-[11px] font-bold text-gray-800 leading-snug">
          Buka menu browser (titik tiga) lalu pilih <b>Pasang aplikasi</b> atau <b>Tambahkan ke layar utama</b>.
        </p>
      )}

      <button onClick={handleLater} className="w-full text-[10px] font-black uppercase tracking-wider text-gray-500 hover:text-black py-1">
        Nanti saja
      </button>
    </div>
  );
};
