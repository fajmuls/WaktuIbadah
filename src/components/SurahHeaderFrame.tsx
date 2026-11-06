import React from 'react';
import { SurahItem } from '../types';

interface SurahHeaderFrameProps {
  surah: SurahItem;
}

export const SurahHeaderFrame: React.FC<SurahHeaderFrameProps> = ({ surah }) => {
  const isMekah = surah.tempatTurun.toLowerCase().includes('mek') || surah.tempatTurun.toLowerCase().includes('makk');

  return (
    <div className="w-full my-3 px-1 select-none">
      <div className="relative overflow-hidden rounded-2xl border-[1.5px] border-[#D4C4A8] dark:border-slate-700 bg-gradient-to-r from-[#FBF8F1] via-[#F4EDE0] to-[#FBF8F1] dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 p-2.5 sm:p-3 shadow-xs">
        {/* Subtle Islamic arabesque corner flourishes */}
        <div className="absolute top-0 left-0 w-8 h-8 opacity-25 pointer-events-none">
          <svg viewBox="0 0 40 40" className="w-full h-full fill-[#A68856] dark:fill-[#C4A882]">
            <path d="M0,0 L40,0 C20,0 0,20 0,40 Z" />
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-8 h-8 opacity-25 pointer-events-none rotate-90">
          <svg viewBox="0 0 40 40" className="w-full h-full fill-[#A68856] dark:fill-[#C4A882]">
            <path d="M0,0 L40,0 C20,0 0,20 0,40 Z" />
          </svg>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Left: Tempat Turun */}
          <div className="w-20 sm:w-28 text-left shrink-0">
            <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7A5E35] dark:text-[#D4C4A8]">
              {isMekah ? '🕋 Mekah' : '🕌 Madinah'}
            </span>
          </div>

          {/* Center: Ornate Islamic Cartouche with Arabic Surah Name */}
          <div className="relative flex-1 flex items-center justify-center max-w-[220px] sm:max-w-[260px] mx-auto">
            {/* Cartouche background SVG shape */}
            <div className="relative px-5 sm:px-7 py-1.5 rounded-full border border-[#C8B291] dark:border-[#7A5E35] bg-[#FFFDF9] dark:bg-slate-900 shadow-2xs">
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-[#F3F4F6] block text-center leading-none tracking-normal">
                {surah.nama}
              </span>
            </div>
          </div>

          {/* Right: Jumlah Ayat */}
          <div className="w-20 sm:w-28 text-right shrink-0">
            <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7A5E35] dark:text-[#D4C4A8]">
              {surah.jumlahAyat} Ayat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
