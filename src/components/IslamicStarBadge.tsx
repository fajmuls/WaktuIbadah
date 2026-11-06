import React from 'react';

interface IslamicStarBadgeProps {
  number: number | string;
  className?: string;
  active?: boolean;
}

export const IslamicStarBadge: React.FC<IslamicStarBadgeProps> = ({
  number,
  className = 'w-9 h-9',
  active = false
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg 
        viewBox="0 0 40 40" 
        className="w-full h-full drop-shadow-xs" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Authentic 8-Pointed Rub el Hizb Polygon */}
        <polygon 
          points="20,1.5 25.36,7.07 33.08,6.92 32.93,14.64 38.5,20 32.93,25.36 33.08,33.08 25.36,32.93 20,38.5 14.64,32.93 6.92,33.08 7.07,25.36 1.5,20 7.07,14.64 6.92,6.92 14.64,7.07"
          className={
            active 
              ? "fill-emerald-600 stroke-emerald-700" 
              : "fill-[#FCFAF5] dark:fill-slate-800 stroke-[#C4A882] dark:stroke-[#9E825E]"
          }
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Inner subtle concentric ornament circle */}
        <circle 
          cx="20" 
          cy="20" 
          r="12.5" 
          className={active ? "stroke-emerald-300/60" : "stroke-[#DFCFBA] dark:stroke-slate-700"} 
          strokeWidth="0.8" 
          strokeDasharray="1.5 1.5" 
        />
      </svg>
      <span 
        className={`absolute font-bold text-[11px] tabular-nums select-none ${
          active 
            ? 'text-white' 
            : 'text-[#8C6D3B] dark:text-[#E8DCC8]'
        }`}
      >
        {number}
      </span>
    </div>
  );
};
