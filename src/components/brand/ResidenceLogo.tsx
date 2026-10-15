/**
 * PRIVATE RESIDENCE — Editorial Brand Monogram & Wordmark
 */

import React from 'react';

export interface ResidenceLogoProps {
  variant?: 'stacked' | 'horizontal' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const ResidenceLogo: React.FC<ResidenceLogoProps> = ({
  variant = 'stacked',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs tracking-[0.2em]',
    md: 'text-sm sm:text-base tracking-[0.25em]',
    lg: 'text-lg sm:text-xl tracking-[0.3em]',
  };

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        <span className={`font-serif font-light text-white uppercase ${sizeClasses[size]}`}>
          Private Residence
        </span>
        {showSubtitle && (
          <span className="text-[9px] font-mono tracking-[0.2em] uppercase text-amber-300/80 border-l border-white/20 pl-3">
            Villa Solitude
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <span className={`font-serif font-light text-white uppercase ${sizeClasses[size]}`}>
        Private Residence
      </span>
      {showSubtitle && (
        <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-amber-300/80 mt-0.5">
          Villa Solitude
        </span>
      )}
    </div>
  );
};
