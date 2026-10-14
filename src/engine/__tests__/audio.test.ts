import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioController } from '../audio';

describe('AudioController Engine (audio.ts)', () => {
  let controller: AudioController;
  let mockPlay: ReturnType<typeof vi.fn>;
  let mockPause: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPlay = vi.fn().mockResolvedValue(undefined);
    mockPause = vi.fn();

    // Mock global Audio with constructible class
    class MockAudio {
      public play = mockPlay;
      public pause = mockPause;
      public addEventListener = vi.fn((event: string, cb: Function) => {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(cb);
      });
      public removeEventListener = vi.fn();
      public volume = 1;
      public muted = false;
      public currentTime = 0;
      public loop = true;
      public preload = 'metadata';
      public error = null;
      private listeners: Record<string, Function[]> = {};

      constructor(_src?: string) {}
    }

    global.Audio = MockAudio as unknown as typeof Audio;

    controller = new AudioController('/yeat.mp3', 'Yeat', 'Curated Soundtrack');
  });

  it('initializes with expected default state', () => {
    const state = controller.getState();
    expect(state.playbackState).toBe('idle');
    expect(state.isMuted).toBe(false);
    expect(state.volume).toBe(0.85);
    expect(state.artist).toBe('Yeat');
    expect(state.src).toBe('/yeat.mp3');
    expect(state.errorMessage).toBeNull();
    expect(state.hasEverStarted).toBe(false);
  });

  it('notifies subscribers on state changes', () => {
    const subscriber = vi.fn();
    const unsubscribe = controller.subscribe(subscriber);

    expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ playbackState: 'idle' }));

    controller.pause();
    expect(subscriber).toHaveBeenCalledWith(expect.objectContaining({ playbackState: 'paused' }));

    unsubscribe();
  });

  it('plays audio and transitions to playing state on success', async () => {
    const success = await controller.play();
    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(success).toBe(true);
    expect(controller.getState().playbackState).toBe('playing');
    expect(controller.getState().hasEverStarted).toBe(true);
  });

  it('handles playback rejection gracefully without throwing', async () => {
    mockPlay.mockRejectedValueOnce(new Error('NotAllowedError: user gesture required'));

    const success = await controller.play();
    expect(success).toBe(false);
    expect(controller.getState().playbackState).toBe('error');
    expect(controller.getState().errorMessage).toContain('NotAllowedError');
  });

  it('pauses playback when requested and does not auto-restart', async () => {
    await controller.play();
    controller.pause();

    expect(mockPause).toHaveBeenCalledTimes(1);
    expect(controller.getState().playbackState).toBe('paused');
  });

  it('toggles play/pause state correctly', async () => {
    await controller.play();
    expect(controller.getState().playbackState).toBe('playing');

    await controller.togglePlay();
    expect(controller.getState().playbackState).toBe('paused');

    await controller.togglePlay();
    expect(controller.getState().playbackState).toBe('playing');
  });

  it('toggles mute/unmute correctly', () => {
    expect(controller.getState().isMuted).toBe(false);

    const isMutedNow = controller.toggleMute();
    expect(isMutedNow).toBe(true);
    expect(controller.getState().isMuted).toBe(true);

    const isMutedAgain = controller.toggleMute();
    expect(isMutedAgain).toBe(false);
    expect(controller.getState().isMuted).toBe(false);
  });

  it('clamps volume appropriately', () => {
    controller.setVolume(0.5);
    expect(controller.getState().volume).toBe(0.5);

    controller.setVolume(1.5);
    expect(controller.getState().volume).toBe(1.0);

    controller.setVolume(-0.2);
    expect(controller.getState().volume).toBe(0.0);
    expect(controller.getState().isMuted).toBe(true);
  });

  it('resets to idle on stop', async () => {
    await controller.play();
    controller.stop();

    expect(controller.getState().playbackState).toBe('idle');
  });
});
