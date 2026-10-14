/**
 * PRIVATE RESIDENCE — Cinematic Music Invitation
 *
 * Appears exclusively after successful password verification.
 * Presents the visitor with a restrained, luxury moment:
 * "A MOMENT BEFORE YOU ENTER"
 * "Wanna listen to Yeat?"
 *
 * [ YES, LET'S PLAY ]
 * [ NO, ENTER SILENTLY ]
 */

import React, { useState } from 'react';
import { useAudioController } from '../../engine/useAudioController';
import { ResidenceLogo } from '../brand/ResidenceLogo';
import { Volume2, VolumeX, AlertCircle, Loader2 } from 'lucide-react';

interface MusicInvitationProps {
  onEnterSite: (withMusic: boolean) => void;
}

export const MusicInvitation: React.FC<MusicInvitationProps> = ({ onEnterSite }) => {
  const { play, errorMessage } = useAudioController();
  const [isLoading, setIsLoading] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleYes = async () => {
    if (hasInteracted || isLoading) return;
    setIsLoading(true);
    setPlayError(null);

    // Call audio element play() directly in response to user click
    const success = await play();
    setIsLoading(false);

    if (success) {
      setHasInteracted(true);
      onEnterSite(true);
    } else {
      // If playback fails (e.g. browser policy or decode issue), don't trap visitor
      setPlayError(errorMessage || 'Audio playback was unavailable in this browser.');
    }
  };

  const handleNo = () => {
    if (hasInteracted) return;
    setHasInteracted(true);
    onEnterSite(false);
  };

  const handleContinueSilently = () => {
    setHasInteracted(true);
    onEnterSite(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090a0c] text-stone-200 select-none px-6 py-8 architectural-vignette animate-fade-in">
      <div className="relative w-full max-w-lg flex flex-col items-center text-center">
        {/* Architectural Emblem */}
        <div className="mb-6">
          <ResidenceLogo variant="stacked" size="md" showSubtitle={false} />
        </div>

        {/* Super-title */}
        <span className="text-[11px] sm:text-xs font-sans tracking-[0.3em] uppercase text-stone-400 mb-3 font-medium">
          A Moment Before You Enter
        </span>

        {/* The Core Question */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light text-white tracking-wide mb-10 leading-tight">
          &ldquo;Wanna listen to Yeat?&rdquo;
        </h1>

        {/* Playback Error Feedback */}
        {playError && (
          <div className="mb-6 w-full max-w-sm flex items-center gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200 text-xs text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <div className="flex-1">
              <span>{playError}</span>
            </div>
          </div>
        )}

        {/* The Two Choices */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-sm">
          {/* YES, LET'S PLAY */}
          <button
            type="button"
            disabled={isLoading || hasInteracted}
            onClick={handleYes}
            style={{ touchAction: 'manipulation' }}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold tracking-wider text-black uppercase bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 hover:from-amber-100 hover:to-amber-200 rounded-xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.25)] active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Yes, Let&apos;s Play</span>
            )}
          </button>

          {/* NO, ENTER SILENTLY */}
          <button
            type="button"
            disabled={isLoading || hasInteracted}
            onClick={handleNo}
            style={{ touchAction: 'manipulation' }}
            className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-medium tracking-wider text-stone-400 hover:text-white uppercase bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-xl transition-colors active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <VolumeX className="w-3.5 h-3.5 text-stone-500" />
            <span>No, Enter Silently</span>
          </button>
        </div>

        {/* Fallback button if error occurred */}
        {playError && (
          <button
            type="button"
            onClick={handleContinueSilently}
            className="mt-6 text-xs text-amber-200 hover:text-white underline cursor-pointer transition-colors"
          >
            Continue to residence without music &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
