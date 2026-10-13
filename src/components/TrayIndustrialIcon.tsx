import React from 'react';

interface TrayIndustrialIconProps {
  className?: string;
  size?: number;
}

export const TrayIndustrialIcon: React.FC<TrayIndustrialIconProps> = ({
  className = 'w-9 h-9',
  size = 200,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="TRIVIUM Professional 3-Head Industrial Tray Icon"
      className={className}
    >
      <defs>
        {/* Soft Drop Shadows */}
        <filter id="headTabShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.45" />
        </filter>
        <filter id="trayPlateShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.25" />
        </filter>
        <filter id="centerHubGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#e11d48" floodOpacity="0.35" />
        </filter>

        {/* Tray Metallic Gradients */}
        <radialGradient id="plateGrad" cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f8fafc" />
          <stop offset="95%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>

        <linearGradient id="bevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        <radialGradient id="centerHubGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="60%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="#be123c" />
        </radialGradient>
      </defs>

      {/* 1. Three Outer Dark Drill Head Tabs (at 90°, 210°, 330°) */}
      {/* Top Head Tab (T1 - 90°) */}
      <g filter="url(#headTabShadow)">
        <circle cx="256" cy="48" r="28" fill="#0c1524" stroke="#1e293b" strokeWidth="2.5" />
        {/* Triangle pointing up with center white dot */}
        <polygon points="256,29 240,60 272,60" fill="#0ea5e9" stroke="#0284c7" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="256" cy="50" r="3" fill="#ffffff" />
      </g>

      {/* Bottom-Left Head Tab (T2 - 210°) */}
      <g filter="url(#headTabShadow)">
        <circle cx="76" cy="360" r="28" fill="#0c1524" stroke="#1e293b" strokeWidth="2.5" />
        {/* Triangle pointing down-left with center white dot */}
        <polygon points="60,369 88,345 88,377" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="78" cy="363" r="3" fill="#ffffff" />
      </g>

      {/* Bottom-Right Head Tab (T3 - 330°) */}
      <g filter="url(#headTabShadow)">
        <circle cx="436" cy="360" r="28" fill="#0c1524" stroke="#1e293b" strokeWidth="2.5" />
        {/* Triangle pointing down-right with center white dot */}
        <polygon points="452,369 424,377 424,345" fill="#10b981" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="434" cy="363" r="3" fill="#ffffff" />
      </g>

      {/* 2. Main Circular Tray Body with Metallic Rim */}
      <circle cx="256" cy="256" r="198" fill="url(#bevelGrad)" filter="url(#trayPlateShadow)" />
      <circle cx="256" cy="256" r="190" fill="url(#plateGrad)" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="256" cy="256" r="186" fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.6" />

      {/* 3. Coordinate Axes & 120° Alignment Guidelines */}
      {/* Crosshairs */}
      <line x1="256" y1="72" x2="256" y2="440" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="72" y1="256" x2="440" y2="256" stroke="#cbd5e1" strokeWidth="2" />
      {/* 120° Diagonal Guidelines */}
      <line x1="256" y1="256" x2="100" y2="346" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="6 6" strokeLinecap="round" opacity="0.75" />
      <line x1="256" y1="256" x2="412" y2="346" stroke="#94a3b8" strokeWidth="1.8" strokeDasharray="6 6" strokeLinecap="round" opacity="0.75" />

      {/* 4. Three Concentric Toolpath Rings */}
      {/* Outer Ring (L1 - Royal Blue) */}
      <circle cx="256" cy="256" r="148" fill="none" stroke="#0284c7" strokeWidth="9" strokeLinecap="round" />
      <circle cx="256" cy="256" r="148" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="8 10" opacity="0.9" />

      {/* Middle Ring (L2 - Teal / Emerald) */}
      <circle cx="256" cy="256" r="110" fill="none" stroke="#0d9488" strokeWidth="9" strokeLinecap="round" />
      <circle cx="256" cy="256" r="110" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="8 9" opacity="0.9" />

      {/* Inner Ring (L3 - Bright Cyan / Sky) */}
      <circle cx="256" cy="256" r="72" fill="none" stroke="#0ea5e9" strokeWidth="8" strokeLinecap="round" />
      <circle cx="256" cy="256" r="72" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeDasharray="6 8" opacity="0.9" />

      {/* 5. Precision Drill Dots along the Outer Rings */}
      {/* Outer Ring 8 Dots */}
      <circle cx="256" cy="108" r="4.5" fill="#0f172a" />
      <circle cx="256" cy="404" r="4.5" fill="#0f172a" />
      <circle cx="108" cy="256" r="4.5" fill="#0f172a" />
      <circle cx="404" cy="256" r="4.5" fill="#0f172a" />
      <circle cx="151" cy="151" r="4.5" fill="#0f172a" />
      <circle cx="361" cy="151" r="4.5" fill="#0f172a" />
      <circle cx="151" cy="361" r="4.5" fill="#0f172a" />
      <circle cx="361" cy="361" r="4.5" fill="#0f172a" />

      {/* 6. Center Machine Spindle Hub (Vibrant Rose Red with Highlight) */}
      <circle cx="256" cy="256" r="29" fill="url(#centerHubGrad)" filter="url(#centerHubGlow)" />
      <circle cx="256" cy="256" r="28" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
      <circle cx="252" cy="252" r="10" fill="#ffffff" opacity="0.35" />
    </svg>
  );
};
