/**
 * PRIVATE RESIDENCE — Persistent Architectural Music Controller
 *
 * Remains visible throughout the unlocked website.
 * Operates the single persistent AudioController instance.
 * Features:
 * - Play / Pause toggle with clear text & icon states.
 * - Mute / Unmute toggle.
 * - Subtle animated audio equalizer bars (frozen when paused or with reduced motion).
 * - Compact glassmorphic architectural container positioned to never occlude content.
 */

import React from 'react';
import { useAudioController } from '../../engine/useAudioController';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

export const PersistentMusicBar: React.FC = () => {
  const { playbackState, isMuted, togglePlay, toggleMute, artist } = useAudioController();

  const isPlaying = playbackState === 'playing';

  return (
    <aside
      aria-label="Soundtrack controls"
      className="fixed bottom-5 right-5 z-40 select-none pointer-events-auto"
    >
      <div className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-[#0d0f14]/85 hover:bg-[#0d0f14]/95 backdrop-blur-md border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-stone-200 transition-all duration-200">
        {/* Subtle Animated Audio Bars */}
        <div className="flex items-end gap-[3px] h-3.5 px-1 shrink-0" aria-hidden="true">
          <span
            className={`w-[2.5px] bg-amber-300/80 rounded-full transition-all duration-300 ${
              isPlaying ? 'h-3.5 animate-pulse' : 'h-1.5 opacity-40'
            }`}
          />
          <span
            className={`w-[2.5px] bg-amber-300/80 rounded-full transition-all duration-300 delay-75 ${
              isPlaying ? 'h-2 animate-bounce' : 'h-1.5 opacity-40'
            }`}
            style={{ animationDuration: '0.8s' }}
          />
          <span
            className={`w-[2.5px] bg-amber-300/80 rounded-full transition-all duration-300 delay-150 ${
              isPlaying ? 'h-3 animate-pulse' : 'h-1.5 opacity-40'
            }`}
          />
        </div>

        {/* Track Info & Status */}
        <div className="flex flex-col text-left pr-1">
          <span className="text-[11px] font-medium tracking-wide text-white leading-none">
            {artist}
          </span>
          <span className="text-[9px] font-mono tracking-wider text-stone-400 uppercase mt-0.5 leading-none">
            {isPlaying ? (isMuted ? 'Muted' : 'Soundtrack') : 'Paused'}
          </span>
        </div>

        <div className="h-4 w-px bg-white/10 mx-0.5" />

        {/* Play / Pause Button */}
        <button
          type="button"
          onClick={() => togglePlay()}
          style={{ touchAction: 'manipulation' }}
          className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          title={isPlaying ? 'Pause music' : 'Resume music'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={() => toggleMute()}
          style={{ touchAction: 'manipulation' }}
          className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label={isMuted ? 'Unmute music' : 'Mute music'}
          title={isMuted ? 'Unmute music' : 'Mute music'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-stone-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-amber-300" />
          )}
        </button>
      </div>
    </aside>
  );
};
