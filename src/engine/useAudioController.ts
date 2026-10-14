/**
 * Hook for consuming the persistent AudioController in React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { globalAudioController, AudioState } from './audio';

export function useAudioController() {
  const [state, setState] = useState<AudioState>(() => globalAudioController.getState());

  useEffect(() => {
    return globalAudioController.subscribe(setState);
  }, []);

  const play = useCallback(() => globalAudioController.play(), []);
  const pause = useCallback(() => globalAudioController.pause(), []);
  const togglePlay = useCallback(() => globalAudioController.togglePlay(), []);
  const toggleMute = useCallback(() => globalAudioController.toggleMute(), []);
  const stop = useCallback(() => globalAudioController.stop(), []);
  const setVolume = useCallback((v: number) => globalAudioController.setVolume(v), []);

  return {
    ...state,
    play,
    pause,
    togglePlay,
    toggleMute,
    stop,
    setVolume,
  };
}
