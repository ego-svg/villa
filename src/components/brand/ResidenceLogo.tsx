import React from 'react';

export interface ResidenceLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'mark-only' | 'inline' | 'stacked';
  showSubtitle?: boolean;
  subtitle?: string;
  className?: string;
}

const SIZE_MAP = {
  xs: { icon: 20, text: 'text-xs', sub: 'text-[8px]', gap: 'gap-2' },
  sm: { icon: 26, text: 'text-sm sm:text-base', sub: 'text-[9px] sm:text-[10px]', gap: 'gap-2.5' },
  md: { icon: 34, text: 'text-base sm:text-lg', sub: 'text-[10px] sm:text-[11px]', gap: 'gap-3' },
  lg: { icon: 46, text: 'text-xl sm:text-2xl', sub: 'text-xs', gap: 'gap-3.5' },
  xl: { icon: 64, text: 'text-2xl sm:text-3xl', sub: 'text-xs sm:text-sm', gap: 'gap-4' },
};

/**
 * ResidenceLogoMark — Pure SVG architectural emblem representing Private Residence
 * Features interlocking monolithic pillars, cantilever arch, and gold coordinates.
 */
export const ResidenceLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="logoTitanium" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#D6D3D1" />
        </linearGradient>
      </defs>

      {/* Outer Obsidian Shield with Gold Accent Border */}
      <rect
        x="1.5"
        y="1.5"
        width="61"
        height="61"
        rx="14"
        fill="#090A0C"
        stroke="url(#logoGold)"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />

      {/* Subtle Diamond Guideline */}
      <path
        d="M32 9L53 32L32 55L11 32Z"
        stroke="#D4AF37"
        strokeOpacity="0.22"
        strokeWidth="1"
        fill="none"
      />

      {/* Monolithic Pillar 1: Vertical Stem (P) */}
      <path
        d="M22 18V46"
        stroke="url(#logoTitanium)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Architectural Arch: Upper Loop (P) */}
      <path
        d="M22 18H33C37.4183 18 41 21.5817 41 26C41 30.4183 37.4183 34 33 34H22"
        stroke="url(#logoTitanium)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cantilever Strut: Diagonal (R) */}
      <path
        d="M30 33L40.5 46"
        stroke="url(#logoGold)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Horizontal Ground Datum Line */}
      <line
        x1="18"
        y1="46"
        x2="46"
        y2="46"
        stroke="#D4AF37"
        strokeOpacity="0.4"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Celestial Gold Accents */}
      <circle cx="32" cy="10" r="1.5" fill="#F59E0B" />
      <circle cx="32" cy="54" r="1.5" fill="#F59E0B" />
    </svg>
  );
};

export const ResidenceLogo: React.FC<ResidenceLogoProps> = ({
  size = 'md',
  variant = 'inline',
  showSubtitle = true,
  subtitle = 'Archival Access Portal · Villa Solitude',
  className = '',
}) => {
  const config = SIZE_MAP[size];

  if (variant === 'mark-only') {
    return <ResidenceLogoMark size={config.icon} className={className} />;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <ResidenceLogoMark size={config.icon} className="mb-2 shadow-[0_0_24px_rgba(212,175,55,0.2)]" />
        <span className={`${config.text} font-serif tracking-[0.25em] text-white font-medium`}>
          PRIVATE RESIDENCE
        </span>
        {showSubtitle && (
          <span className={`${config.sub} text-stone-400 uppercase tracking-widest mt-1`}>
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      <ResidenceLogoMark size={config.icon} className="shadow-[0_0_16px_rgba(212,175,55,0.15)]" />
      <div className="flex flex-col">
        <span className={`${config.text} font-serif tracking-[0.22em] text-white font-medium leading-tight`}>
          PRIVATE RESIDENCE
        </span>
        {showSubtitle && (
          <span className={`${config.sub} text-stone-500 uppercase tracking-widest mt-0.5 leading-tight`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
