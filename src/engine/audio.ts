/**
 * PRIVATE RESIDENCE — Persistent Audio Engine (Yeat Soundtrack)
 *
 * Requirements:
 * 1. Single persistent HTMLAudioElement instance across the entire application lifecycle.
 * 2. Explicit user gesture initiation (YES click in MusicInvitation).
 * 3. Graceful error handling (promise rejection, audio decode failure).
 * 4. Never auto-restarts after visitor explicitly pauses.
 * 5. Independent of house video playback and scroll timeline.
 */

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface AudioState {
  playbackState: AudioPlaybackState;
  isMuted: boolean;
  volume: number;
  errorMessage: string | null;
  trackTitle: string;
  artist: string;
  src: string;
  hasEverStarted: boolean;
}

export type AudioListener = (state: AudioState) => void;

export class AudioController {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<AudioListener>();
  private state: AudioState;

  constructor(src = '/yeat.mp3', artist = 'Yeat', trackTitle = 'Curated Soundtrack') {
    this.state = {
      playbackState: 'idle',
      isMuted: false,
      volume: 0.85,
      errorMessage: null,
      trackTitle,
      artist,
      src,
      hasEverStarted: false,
    };
  }

  private getOrCreateAudio(): HTMLAudioElement | null {
    if (!this.audio && (typeof Audio !== 'undefined' || typeof window !== 'undefined')) {
      if (typeof Audio !== 'undefined') {
        this.audio = new Audio(this.state.src);
        this.audio.preload = 'metadata';
        this.audio.loop = true;
        this.audio.volume = this.state.volume;
        this.audio.muted = this.state.isMuted;

        this.audio.addEventListener('play', () => {
          this.updateState({ playbackState: 'playing', hasEverStarted: true, errorMessage: null });
        });

        this.audio.addEventListener('pause', () => {
          // Only set paused if not an error and not stopped
          if (this.state.playbackState !== 'error' && this.state.playbackState !== 'idle') {
            this.updateState({ playbackState: 'paused' });
          }
        });

        this.audio.addEventListener('error', () => {
          const err = this.audio?.error;
          let message = 'Audio playback failed';
          if (err) {
            switch (err.code) {
              case err.MEDIA_ERR_SRC_NOT_SUPPORTED:
                message = 'Audio format not supported or file missing';
                break;
              case err.MEDIA_ERR_DECODE:
                message = 'Audio decoding error';
                break;
              case err.MEDIA_ERR_NETWORK:
                message = 'Network error loading audio';
                break;
              default:
                message = 'Could not play audio track';
            }
          }
          this.updateState({ playbackState: 'error', errorMessage: message });
        });
      }
    }
    return this.audio;
  }

  public getState(): AudioState {
    return { ...this.state };
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<AudioState>): void {
    this.state = { ...this.state, ...partial };
    const current = this.getState();
    this.listeners.forEach((l) => l(current));
  }

  /**
   * Starts playback from an explicit user action.
   * Returns a promise resolving to true if playback started, false otherwise.
   */
  public async play(): Promise<boolean> {
    try {
      this.updateState({ playbackState: 'loading', errorMessage: null });
      const audio = this.getOrCreateAudio();
      if (!audio) {
        throw new Error('Audio environment not available');
      }
      await audio.play();
      this.updateState({ playbackState: 'playing', hasEverStarted: true, errorMessage: null });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Playback was blocked or file could not be played';
      this.updateState({
        playbackState: 'error',
        errorMessage: msg,
      });
      return false;
    }
  }

  /**
   * Pauses playback. Visitor's decision is respected; never auto-restarts.
   */
  public pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
    this.updateState({ playbackState: 'paused' });
  }

  /**
   * Toggles play and pause state.
   */
  public async togglePlay(): Promise<boolean> {
    if (this.state.playbackState === 'playing') {
      this.pause();
      return false;
    } else {
      return await this.play();
    }
  }

  /**
   * Toggles mute state while preserving volume level.
   */
  public toggleMute(): boolean {
    const nextMuted = !this.state.isMuted;
    if (this.audio) {
      this.audio.muted = nextMuted;
    }
    this.updateState({ isMuted: nextMuted });
    return nextMuted;
  }

  /**
   * Sets volume level between 0 and 1.
   */
  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = clamped;
    }
    this.updateState({ volume: clamped, isMuted: clamped === 0 });
  }

  /**
   * Stops playback and resets timeline.
   */
  public stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.updateState({ playbackState: 'idle' });
  }
}

// Global shared singleton so playback is never reset when navigating between sections
export const globalAudioController = new AudioController('/yeat.mp3', 'Yeat', 'Curated Soundtrack');
