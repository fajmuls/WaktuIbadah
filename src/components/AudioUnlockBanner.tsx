import React from 'react';
import { Volume2, VolumeX, Bell, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playPrayerAzan, stopAlarmSound, playButtonTapSound } from '../lib/audio';

interface AudioUnlockBannerProps {
  activeAzanAlert: { prayer: string; time: string } | null;
  onDismiss: () => void;
}

export const AudioUnlockBanner: React.FC<AudioUnlockBannerProps> = ({
  activeAzanAlert,
  onDismiss
}) => {
  if (!activeAzanAlert) return null;

  const isSubuh = activeAzanAlert.prayer.toLowerCase().includes('subuh');

  const handlePlayAzan = () => {
    playButtonTapSound();
    playPrayerAzan(isSubuh);
  };

  const handleStopAzan = () => {
    stopAlarmSound();
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-2 sm:top-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto"
      >
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-green-500 border-[2.5px] border-[#121212] rounded-2xl shadow-[4px_4px_0px_#121212] flex items-center justify-between gap-3 text-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center font-black animate-bounce shadow-[2px_2px_0px_#121212] shrink-0">
              <Volume2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="memphis-badge bg-black text-[#6EE7B7] text-[8px] py-0.5 px-1.5">
                  Waktu Salat Tiba
                </span>
                <span className="text-[10px] font-black uppercase text-[#121212]">
                  {activeAzanAlert.time}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-[#121212] mt-0.5">
                Saatnya Salat {activeAzanAlert.prayer}!
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePlayAzan}
              className="memphis-btn bg-white hover:bg-emerald-50 text-black px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider"
              title="Bunyikan Suara Azan"
            >
              Putar Suara
            </button>
            <button
              onClick={handleStopAzan}
              className="p-1.5 bg-black text-white hover:bg-gray-800 rounded-lg border-2 border-black text-xs font-black shadow-[1px_1px_0px_#121212]"
              title="Tutup / Heningkan"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
