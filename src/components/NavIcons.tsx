import React from 'react';

interface IconProps {
  className?: string;
  isActive?: boolean;
}

// 1. Home SVG: Modern House + Minaret Dome Arch
export const NavHomeIcon: React.FC<IconProps> = ({ className = "w-5 h-5", isActive }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15C14.4477 21 14 20.5523 14 20V15C14 13.8954 13.1046 13 12 13C10.8954 13 10 13.8954 10 15V20C10 20.5523 9.55228 21 9 21H4C3.44772 21 3 20.5523 3 20V10.5Z" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.18" : "0"}
    />
  </svg>
);

// 2. Jadwal SVG: Modern Calendar with subtle check
export const NavJadwalIcon: React.FC<IconProps> = ({ className = "w-5 h-5", isActive }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <rect 
      x="3" 
      y="4" 
      width="18" 
      height="17" 
      rx="3" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"}
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.18" : "0"}
    />
    <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M3 9.5H21" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="8" cy="14" r="1.2" fill="currentColor" />
    <circle cx="12" cy="14" r="1.2" fill="currentColor" />
    <circle cx="16" cy="14" r="1.2" fill="currentColor" />
    <circle cx="8" cy="17.5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="17.5" r="1.2" fill="currentColor" />
  </svg>
);

// 3. Ibadah SVG: Mosque Dome with Crescent
export const NavIbadahIcon: React.FC<IconProps> = ({ className = "w-5 h-5", isActive }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      d="M12 2V4M12 4C10 4 7 6.5 7 11V21H17V11C17 6.5 14 4 12 4Z" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.18" : "0"}
    />
    <path d="M10 21V16C10 14.8954 10.8954 14 12 14C13.1046 14 14 14.8954 14 16V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M4 14V21M20 14V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 4. Doa & Zikir SVG: Supplication Hands / Tasbih beads
export const NavDoaIcon: React.FC<IconProps> = ({ className = "w-5 h-5", isActive }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      d="M6 19C4 16 3 13 4 10C5 7 8 8 9 10L10 13M18 19C20 16 21 13 20 10C19 7 16 8 15 10L14 13" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M10 13C10 16.5 11 20 12 21C13 20 14 16.5 14 13" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.18" : "0"}
    />
    <path d="M12 3V6M10.5 4.5H13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="8.5" r="1.5" fill="currentColor" />
  </svg>
);

// 5. Qur'an SVG: Open Book (Mushaf / Rehal)
export const NavQuranIcon: React.FC<IconProps> = ({ className = "w-5 h-5", isActive }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      d="M4 19.5C6 18.5 9 18.5 12 20C15 18.5 18 18.5 20 19.5V5.5C18 4.5 15 4.5 12 6C9 4.5 6 4.5 4 5.5V19.5Z" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.18" : "0"}
    />
    <path d="M12 6V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M7 9.5H9.5M7 13H9.5M14.5 9.5H17M14.5 13H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 6. Menu SVG: 4-square geometric grid (Memphis style)
export const NavMenuIcon: React.FC<IconProps> = ({ className = "w-5 h-5", isActive }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <rect 
      x="4" 
      y="4" 
      width="6.5" 
      height="6.5" 
      rx="2" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.25" : "0"}
    />
    <rect 
      x="13.5" 
      y="4" 
      width="6.5" 
      height="6.5" 
      rx="2" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.25" : "0"}
    />
    <rect 
      x="4" 
      y="13.5" 
      width="6.5" 
      height="6.5" 
      rx="2" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.25" : "0"}
    />
    <rect 
      x="13.5" 
      y="13.5" 
      width="6.5" 
      height="6.5" 
      rx="2" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.25" : "0"}
    />
  </svg>
);

// 7. Hadis SVG: Open Scroll / Prophet's Tradition Quotation
export const NavHadisIcon: React.FC<IconProps> = ({ className = "w-5 h-5", isActive }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      d="M19 4H7.5C6.11929 4 5 5.11929 5 6.5V17.5C5 18.8807 6.11929 20 7.5 20H19V4Z" 
      stroke="currentColor" 
      strokeWidth={isActive ? "2.2" : "1.8"} 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? "0.18" : "0"}
    />
    <path d="M19 16H7.5C6.67157 16 6 16.6716 6 17.5C6 18.3284 6.67157 19 7.5 19H19" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 8H15M9 12H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

