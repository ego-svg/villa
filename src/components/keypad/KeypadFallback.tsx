/**
 * PRIVATE RESIDENCE — Accessible 2D Fallback Keypad
 *
 * Provides a clean HTML/CSS fallback if WebGL fails or if user prefers standard touch/mouse.
 */

import React from 'react';
import { KEYPAD_KEYS } from './Keypad3D';

interface KeypadFallbackProps {
  onSelectKey: (keyId: string) => void;
  disabled?: boolean;
}

export const KeypadFallback: React.FC<KeypadFallbackProps> = ({ onSelectKey, disabled = false }) => {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-4 bg-[#0d0f14] border border-white/10 rounded-2xl w-full max-w-xs mx-auto shadow-2xl select-none">
      {KEYPAD_KEYS.map((key) => {
        const isAction = key.id === 'CLR' || key.id === 'DEL';
        return (
          <button
            key={key.id}
            type="button"
            disabled={disabled}
            onPointerDown={(e) => {
              e.preventDefault();
              if (!disabled) onSelectKey(key.id);
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!disabled) onSelectKey(key.id);
            }}
            style={{ touchAction: 'manipulation' }}
            className={`h-14 sm:h-16 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 border cursor-pointer ${
              isAction
                ? 'bg-[#161a22] border-white/15 text-stone-300 hover:text-white hover:border-white/30 text-xs font-bold tracking-widest'
                : 'bg-[#191d26] border-white/15 text-white hover:text-amber-200 hover:border-amber-400/50 text-3xl font-serif font-medium shadow-sm'
            } disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50`}
          >
            {key.label}
          </button>
        );
      })}
    </div>
  );
};
