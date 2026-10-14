/**
 * PRIVATE RESIDENCE — Camera Permission Guide Modal
 *
 * Provides clear, visual, browser-specific instructions to unblock webcam access
 * and an immediate fallback to simulate gesture control.
 */

import React from 'react';
import { Camera, RefreshCw, X, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface CameraPermissionGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onEnableSimulation: () => void;
}

export const CameraPermissionGuide: React.FC<CameraPermissionGuideProps> = ({
  isOpen,
  onClose,
  onRetry,
  onEnableSimulation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#11141a] border border-amber-400/30 rounded-2xl p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-stone-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-semibold text-white tracking-wide">
              Camera Permission Denied
            </h3>
            <p className="text-xs text-stone-400">
              Your browser is currently blocking webcam access for this site.
            </p>
          </div>
        </div>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3 my-5 text-xs text-stone-300 bg-black/40 border border-white/10 p-4 rounded-xl leading-relaxed">
          <div className="font-semibold text-amber-200 uppercase tracking-wider text-[11px] mb-1">
            How to allow camera in your browser:
          </div>

          <div className="flex items-start gap-2.5">
            <span className="font-mono text-amber-300 bg-white/5 border border-white/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">
              1
            </span>
            <div>
              <strong className="text-white">Look at the browser address bar (top of screen):</strong>
              <p className="text-stone-400 mt-0.5">
                Click the <strong>camera</strong> icon, <strong>tune/sliders</strong> icon, or <strong>lock</strong> icon on the left or right of the web address.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="font-mono text-amber-300 bg-white/5 border border-white/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">
              2
            </span>
            <div>
              <strong className="text-white">Change Camera to &quot;Allow&quot;:</strong>
              <p className="text-stone-400 mt-0.5">
                Switch <em>Camera</em> from &quot;Block&quot; to <strong>&quot;Allow&quot;</strong>. (On iPhone/Safari: tap <strong>aA</strong> in URL bar $\to$ <strong>Website Settings</strong> $\to$ <strong>Camera: Allow</strong>).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="font-mono text-amber-300 bg-white/5 border border-white/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px]">
              3
            </span>
            <div>
              <strong className="text-white">Tap &quot;Try Again&quot; below:</strong>
              <p className="text-stone-400 mt-0.5">
                Once permitted, click the retry button below to start hand tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={onRetry}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-black bg-gradient-to-r from-amber-200 to-amber-300 hover:from-amber-100 hover:to-amber-200 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onEnableSimulation();
              onClose();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-stone-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Simulate Gesture (Mouse/Touch)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            Use Direct Keypad
          </button>
        </div>
      </div>
    </div>
  );
};
