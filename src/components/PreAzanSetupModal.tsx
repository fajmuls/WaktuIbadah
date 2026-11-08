import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { ReminderSettings } from '../types';

interface PreAzanSetupModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const MODAL_KEY = 'wi_pre_azan_setup_v210';

export const PreAzanSetupModal: React.FC<PreAzanSetupModalProps> = ({ isOpen: controlledIsOpen, onClose: controlledOnClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(10);
  const [enableAzanAudio, setEnableAzanAudio] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
      return;
    }

    // Check if user has seen or completed this setup for v2.10.0
    const alreadyConfigured = localStorage.getItem(MODAL_KEY);
    if (!alreadyConfigured) {
      // Load existing settings if any
      const settings = storage.getReminderSettings();
      if (settings?.preReminderMinutes !== undefined) {
        setSelectedMinutes(settings.preReminderMinutes);
      }
      const user = storage.getUser();
      if (user?.soundEnabled !== undefined) {
        setEnableAzanAudio(user.soundEnabled);
      }
      setIsOpen(true);
    }
  }, [controlledIsOpen]);

  const handleSave = () => {
    setIsSaving(true);
    try {
      const current = storage.getReminderSettings();
      const updated: ReminderSettings = {
        ...current,
        preReminderMinutes: selectedMinutes,
        reminderType: enableAzanAudio ? 'sound_and_vibrate' : 'vibrate_only',
        silentNotifications: false,
      };
      storage.setReminderSettings(updated);

      // Update user sound preference
      const currentUser = storage.getUser();
      if (currentUser) {
        storage.setUser({
          ...currentUser,
          soundEnabled: enableAzanAudio,
          reminderEnabled: true,
        });
      }

      // Trigger test vibration if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300, 100, 500]);
      }

      localStorage.setItem(MODAL_KEY, 'true');
      setIsOpen(false);
      controlledOnClose?.();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(MODAL_KEY, 'true');
    setIsOpen(false);
    controlledOnClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#1E1E1E] rounded-2xl border-[1.5px] border-[#121212] dark:border-[#333333] shadow-[4px_4px_0px_#121212] dark:shadow-[4px_4px_0px_#000000] p-6 text-[#121212] dark:text-[#EAEAEA] relative overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pre-azan-title"
      >
        {/* Decorative Top Accent Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#059669] dark:text-[#34D399] text-xs font-bold border-[1.2px] border-[#10B981]/30 mb-3">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Pembaruan Fitur v2.10.0
        </div>

        <h3 id="pre-azan-title" className="text-xl font-black tracking-tight mb-2">
          Atur Pengingat Azan Otomatis
        </h3>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-5 leading-relaxed">
          Pilih waktu persiapan sebelum azan berkumandang agar Anda siap berwudhu dan menuju saf pertama tepat waktu.
        </p>

        {/* Option Group: Pre-Reminder Minutes */}
        <div className="space-y-2.5 mb-5">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Jeda Pengingat Sebelum Azan
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 10, label: '10 Menit', sub: 'Rekomendasi' },
              { val: 30, label: '30 Menit', sub: 'Persiapan Santai' },
              { val: 0, label: 'Tepat Waktu', sub: 'Saat Masuk' },
            ].map(opt => {
              const active = selectedMinutes === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSelectedMinutes(opt.val)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border-[1.5px] transition-all text-center ${
                    active
                      ? 'border-[#121212] bg-[#FCD34D] text-[#121212] font-black shadow-[2px_2px_0px_#121212] -translate-y-0.5'
                      : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <span className="text-sm font-bold">{opt.label}</span>
                  <span className={`text-[10px] mt-0.5 ${active ? 'text-black/80 font-semibold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Switches: Automatic Azan Audio & Vibration */}
        <div className="space-y-3 mb-6 bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded-xl border-[1.2px] border-neutral-200 dark:border-neutral-800">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="pr-3">
              <span className="text-xs font-bold block text-neutral-800 dark:text-neutral-200">
                Putar Suara Azan Otomatis
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 block mt-0.5 leading-tight">
                Langsung lantunkan suara azan saat waktu salat tiba tanpa perlu menekan tombol
              </span>
            </div>
            <input
              type="checkbox"
              checked={enableAzanAudio}
              onChange={(e) => setEnableAzanAudio(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-[#121212] text-[#10B981] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#10B981]"
            />
          </label>

          <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-700/60 flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span className="flex items-center gap-1.5 font-medium">
              <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Getaran Ritmis Haptik
            </span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
              Aktif
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 py-2.5 px-3 rounded-xl border-[1.5px] border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs font-bold transition-colors"
          >
            Nanti Saja
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 px-3 rounded-xl border-[1.5px] border-[#121212] bg-[#10B981] hover:bg-[#059669] text-white text-xs font-black shadow-[2px_2px_0px_#121212] transition-transform active:translate-y-0.5 flex items-center justify-center gap-1.5"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default PreAzanSetupModal;
