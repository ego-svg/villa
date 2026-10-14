/**
 * PRIVATE RESIDENCE — Masked Security PIN Display
 *
 * Renders 4 discreet security dots with state feedback (Active, Error, Success).
 */

import React from 'react';
import { PinState, MAX_PIN_LENGTH } from '../../engine/auth';

interface PinDisplayProps {
  pinState: PinState;
}

export const PinDisplay: React.FC<PinDisplayProps> = ({ pinState }) => {
  const isError = pinState.status === 'ERROR';
  const isSuccess = pinState.status === 'SUCCESS';

  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0">
      <div className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium">
        Residence Access Code
      </div>

      <div
        className={`flex items-center gap-3.5 py-2 px-5 rounded-full bg-black/40 border transition-all duration-300 ${
          isError
            ? 'border-red-500/60 bg-red-950/20 animate-shake'
            : isSuccess
            ? 'border-emerald-500/60 bg-emerald-950/20'
            : 'border-white/10'
        }`}
      >
        {Array.from({ length: MAX_PIN_LENGTH }).map((_, idx) => {
          const isFilled = idx < pinState.pin.length;
          return (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                isSuccess
                  ? 'bg-emerald-400 scale-110 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                  : isError
                  ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]'
                  : isFilled
                  ? 'bg-amber-300 scale-105 shadow-[0_0_8px_rgba(252,211,77,0.4)]'
                  : 'bg-white/10 border border-white/20'
              }`}
            />
          );
        })}
      </div>

      <div className="h-4 text-center">
        {isError && (
          <span className="text-[11px] text-red-400 tracking-wider">
            {pinState.errorMessage || 'Invalid residence code. Try again.'}
          </span>
        )}
        {isSuccess && (
          <span className="text-[11px] text-emerald-400 tracking-wider">
            Access Granted. Unlocking residence...
          </span>
        )}
      </div>
    </div>
  );
};
