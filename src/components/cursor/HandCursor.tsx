/**
 * PRIVATE RESIDENCE — Precision Fingertip Hand Cursor
 *
 * Renders an architectural targeting reticle tracked to index fingertip.
 * Features:
 * - Dynamic SVG radial arc progress ring showing pinch proximity.
 * - Precision crosshairs and active selection glow.
 * - Hardware accelerated translate3d mapping.
 */

import React, { useEffect, useRef } from 'react';
import { ScreenPoint } from '../../engine/gestures';

interface HandCursorProps {
  cursor: ScreenPoint | null;
  isTouching?: boolean;
  isPinching?: boolean;
  fingerDistance?: number | null;
  pinchDistance?: number | null;
}

export const HandCursor: React.FC<HandCursorProps> = ({
  cursor,
  isTouching,
  isPinching,
  fingerDistance,
  pinchDistance,
}) => {
  const activeTouch = isTouching ?? isPinching ?? false;
  const activeDistance = fingerDistance ?? pinchDistance ?? null;
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cursorRef.current) return;
    if (!cursor) {
      cursorRef.current.style.opacity = '0';
      return;
    }

    cursorRef.current.style.opacity = '1';
    const x = cursor.x * window.innerWidth;
    const y = cursor.y * window.innerHeight;

    cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, [cursor]);

  if (!cursor) return null;

  // Normalized finger touch proximity: 0 = fully touching, 1 = open hand
  const dist = activeDistance !== null ? Math.min(1, Math.max(0, (activeDistance - 0.05) / 0.10)) : 1;
  const touchProgress = 1 - dist; // 0 = open, 1 = trigger threshold
  const ringScale = 0.70 + dist * 0.50; // Contract as fingers close to touch

  // SVG Circle stroke dash math for radial progress (r = 18, circumference = 2 * PI * 18 = 113)
  const circumference = 113;
  const strokeDashoffset = circumference * (1 - touchProgress);

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-50 -ml-6 -mt-6 transition-opacity duration-150"
      style={{ willChange: 'transform' }}
    >
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* SVG Radial Arc Finger Touch Progress Indicator */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r="18"
            className="stroke-white/15 fill-none"
            strokeWidth="1.5"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            className={`fill-none transition-all duration-75 ${
              activeTouch ? 'stroke-amber-300' : 'stroke-amber-400/80'
            }`}
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Outer Scaling Reticle Ring */}
        <div
          className={`absolute inset-1 rounded-full border transition-all duration-100 ${
            activeTouch
              ? 'border-amber-300 bg-amber-400/25 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
              : 'border-white/40 bg-white/[0.03]'
          }`}
          style={{
            transform: `scale(${ringScale})`,
          }}
        />

        {/* Precision Architectural Crosshair Lines */}
        <div
          className={`absolute w-full h-[1px] transition-colors ${
            activeTouch ? 'bg-amber-300' : 'bg-white/30'
          }`}
        />
        <div
          className={`absolute h-full w-[1px] transition-colors ${
            activeTouch ? 'bg-amber-300' : 'bg-white/30'
          }`}
        />

        {/* Center Focal Target Dot */}
        <div
          className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ${
            activeTouch
              ? 'bg-amber-200 scale-125 shadow-[0_0_12px_#f59e0b]'
              : 'bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.4)]'
          }`}
        />
      </div>
    </div>
  );
};
