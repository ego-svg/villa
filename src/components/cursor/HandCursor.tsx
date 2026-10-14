/**
 * PRIVATE RESIDENCE — Precision Fingertip Hand Cursor
 *
 * Renders an architectural targeting reticle tracked to index fingertip (Landmark 8).
 * Provides visual feedback on pinch proximity and active selection state.
 */

import React, { useEffect, useRef } from 'react';
import { ScreenPoint } from '../../engine/gestures';

interface HandCursorProps {
  cursor: ScreenPoint | null;
  isPinching: boolean;
  pinchDistance: number | null;
  containerRect?: DOMRect | null;
}

export const HandCursor: React.FC<HandCursorProps> = ({
  cursor,
  isPinching,
  pinchDistance,
}) => {
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

  // Visual pinch proximity: ring shrinks as fingers approach
  // Typical distance range: ~0.15 (open) down to 0.04 (pinched)
  const normDist = pinchDistance !== null ? Math.min(1, Math.max(0, (pinchDistance - 0.04) / 0.12)) : 1;
  const ringScale = 0.65 + normDist * 0.55; // 0.65 when pinched, 1.2 when wide open

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-50 -ml-5 -mt-5 transition-opacity duration-150"
      style={{ willChange: 'transform' }}
    >
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Outer Proximity Ring */}
        <div
          className={`absolute inset-0 rounded-full border transition-colors duration-150 ${
            isPinching
              ? 'border-amber-300 bg-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'border-white/50 bg-white/5'
          }`}
          style={{
            transform: `scale(${ringScale})`,
            transition: 'transform 75ms cubic-bezier(0.16, 1, 0.3, 1), border-color 150ms',
          }}
        />

        {/* Precision Crosshair Lines */}
        <div
          className={`absolute w-full h-[1px] ${
            isPinching ? 'bg-amber-300' : 'bg-white/40'
          }`}
        />
        <div
          className={`absolute h-full w-[1px] ${
            isPinching ? 'bg-amber-300' : 'bg-white/40'
          }`}
        />

        {/* Center Fingertip Focal Dot */}
        <div
          className={`w-2 h-2 rounded-full transition-transform duration-100 ${
            isPinching ? 'bg-amber-300 scale-125' : 'bg-white'
          }`}
        />
      </div>
    </div>
  );
};
