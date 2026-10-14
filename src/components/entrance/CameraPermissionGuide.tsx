/**
 * PRIVATE RESIDENCE — Camera Permission Guide Modal
 *
 * Provides clear, visual, browser-specific instructions to unblock webcam access,
 * a standalone window option for iframe restriction bypass, and immediate fallback
 * to simulate gesture control.
 */

import React from 'react';
import { Camera, RefreshCw, X, Sparkles, ExternalLink } from 'lucide-react';

interface CameraPermissionGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  onEnableSimulation: () => void;
  errorMessage?: string | null;
}

export const CameraPermissionGuide: React.FC<CameraPermissionGuideProps> = ({
  isOpen,
  onClose,
  onRetry,
  onEnableSimulation,
  errorMessage,
}) => {
  if (!isOpen) return null;

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleOpenStandalone = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0d0f14] border border-amber-400/30 rounded-2xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.9)] text-stone-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-medium text-white tracking-wide">
              Camera Access Blocked
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              {errorMessage || 'Your browser or frame is restricting webcam access.'}
            </p>
          </div>
        </div>

        {/* Step-by-Step Unblock Instructions */}
        <div className="space-y-3 my-5 text-xs text-stone-300 bg-white/[0.02] border border-white/10 p-4 rounded-xl leading-relaxed">
          <div className="font-semibold text-amber-200 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
            <span>How to enable camera in your browser:</span>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">
              1
            </span>
            <div>
              <strong className="text-white">Check the address bar (top of screen):</strong>
              <p className="text-stone-400 mt-0.5">
                Click the <strong>camera</strong> icon, <strong>lock</strong> icon, or <strong>site settings</strong> icon next to the website URL.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">
              2
            </span>
            <div>
              <strong className="text-white">Switch Camera to &quot;Allow&quot;:</strong>
              <p className="text-stone-400 mt-0.5">
                Change <em>Camera</em> permission from &quot;Block&quot; to <strong>&quot;Allow&quot;</strong>. (Mobile/Safari: tap <strong>aA</strong> $\to$ <strong>Website Settings</strong> $\to$ <strong>Camera: Allow</strong>).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="font-mono text-amber-300 bg-amber-400/10 border border-amber-400/20 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold">
              3
            </span>
            <div>
              <strong className="text-white">Click &quot;Try Again&quot;:</strong>
              <p className="text-stone-400 mt-0.5">
                Once unblocked, click retry below to launch silent hand tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-black uppercase tracking-wider bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 hover:from-amber-100 hover:to-amber-200 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Try Again</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onEnableSimulation();
                onClose();
              }}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium text-stone-200 uppercase tracking-wider bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-colors cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulate Hand Control</span>
            </button>
          </div>

          {isInIframe && (
            <button
              type="button"
              onClick={handleOpenStandalone}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-amber-200/90 hover:text-amber-200 bg-amber-400/[0.05] hover:bg-amber-400/10 border border-amber-400/20 rounded-xl transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Dedicated Window (Bypass Preview iFrame)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer text-center underline"
          >
            Or use direct keyboard / touch keypad
          </button>
        </div>
      </div>
    </div>
  );
};
