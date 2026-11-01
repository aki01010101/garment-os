import React from 'react';

interface GarmentOsLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full';
  className?: string;
  theme?: 'dark' | 'light';
}

export const GarmentOsLogo: React.FC<GarmentOsLogoProps> = ({
  size = 'md',
  variant = 'icon',
  className = '',
  theme = 'light',
}) => {
  const pixelSizes = {
    xs: 22,
    sm: 30,
    md: 38,
    lg: 48,
    xl: 64,
  };

  const px = pixelSizes[size] || 38;

  const IconSvg = (
    <svg
      viewBox="0 0 128 128"
      width={px}
      height={px}
      className={`shrink-0 drop-shadow-xs transition-transform group-hover:scale-105 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gosIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="50%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#4338ca" />
        </linearGradient>

        <linearGradient id="gosIconAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>

        <linearGradient id="gosIconHook" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Rounded Squircle Container */}
      <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#gosIconBg)" />
      <rect
        x="4"
        y="4"
        width="120"
        height="120"
        rx="28"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      {/* Apparel Coat Hanger Hook */}
      <path
        d="M64 24 C57.5 24 53 28.5 53 34.5 C53 40.5 58 42.5 64 46 L64 51"
        fill="none"
        stroke="url(#gosIconHook)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Shoulder Line Silhouette / Hanger Frame */}
      <path
        d="M64 51 L31 66.5 C27.5 68.2 27.5 73.2 31 75 L38.5 78.5 C40.8 79.6 43.5 78.8 45 76.8 L64 54.5 L83 76.8 C84.5 78.8 87.2 79.6 89.5 78.5 L97 75 C100.5 73.2 100.5 68.2 97 66.5 Z"
        fill="#FFFFFF"
      />

      {/* "G" Dynamic Lower Orbit */}
      <path
        d="M43.5 74 C36 82 36 93.5 45 101 C54 108.5 74 108.5 83 101 C89.5 95.5 93 87 93 78 L65 78"
        fill="none"
        stroke="url(#gosIconAccent)"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Tech Operating System Pulse Node */}
      <circle cx="65" cy="78" r="4.5" fill="#38bdf8" />
      <circle cx="65" cy="78" r="2" fill="#ffffff" />
    </svg>
  );

  if (variant === 'icon') {
    return IconSvg;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {IconSvg}
      <div className="flex flex-col text-left">
        <span
          className={`font-black tracking-tight leading-none ${
            size === 'lg' || size === 'xl' ? 'text-xl' : 'text-sm'
          } ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
        >
          Garment <span className="text-indigo-600">OS</span>
        </span>
        <span
          className={`font-semibold tracking-wider uppercase ${
            size === 'lg' || size === 'xl' ? 'text-[11px]' : 'text-[9.5px]'
          } ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}
        >
          Retail POS & CRM
        </span>
      </div>
    </div>
  );
};

