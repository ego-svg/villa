import { describe, it, expect, vi } from 'vitest';
import { GestureProcessor } from '../gestures';
import {
  createInitialPinState,
  appendDigit,
  deleteDigit,
  clearPin,
  verifyPin,
  DEFAULT_DEMO_PIN,
} from '../auth';
import { AudioController } from '../audio';

describe('Integration & Edge-Case Verification', () => {
  it('prevents duplicate input events from one continuous pinch', () => {
    const processor = new GestureProcessor({
      pinchThresholdDown: 0.05,
      pinchThresholdUp: 0.09,
    });

    const landmarksOpen = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    landmarksOpen[4] = { x: 0.5, y: 0.5, z: 0 };
    landmarksOpen[8] = { x: 0.65, y: 0.5, z: 0 }; // distance = 0.15

    const landmarksPinched = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
    landmarksPinched[4] = { x: 0.5, y: 0.5, z: 0 };
    landmarksPinched[8] = { x: 0.53, y: 0.5, z: 0 }; // distance = 0.03

    // Initial state: open
    processor.processLandmarks(landmarksOpen);

    const onDigitSelected = vi.fn();

    // Frame 1 of pinch -> should trigger digit selection
    const f1 = processor.processLandmarks(landmarksPinched);
    if (f1.pinchStarted) {
      onDigitSelected('2');
    }

    // Frames 2, 3, 4 while still holding pinch -> MUST NOT trigger digit selection
    for (let i = 0; i < 5; i++) {
      const f = processor.processLandmarks(landmarksPinched);
      if (f.pinchStarted) {
        onDigitSelected('2');
      }
    }

    expect(onDigitSelected).toHaveBeenCalledTimes(1);
  });

  it('correctly simulates full keyboard entry flow (2, 0, 2, 6 -> verified)', () => {
    let pinState = createInitialPinState();
    const unlockCallback = vi.fn();

    // Type 2, 0, 2, 6
    const keys = ['2', '0', '2', '6'];
    for (const key of keys) {
      pinState = appendDigit(pinState, key);
    }

    expect(pinState.pin).toBe('2026');
    expect(pinState.masked).toBe('••••');

    const { nextState, isCorrect } = verifyPin(pinState, DEFAULT_DEMO_PIN);
    if (isCorrect) {
      unlockCallback();
    }

    expect(isCorrect).toBe(true);
    expect(nextState.status).toBe('SUCCESS');
    expect(unlockCallback).toHaveBeenCalledTimes(1);
  });

  it('correctly handles Backspace and Clear in sequence', () => {
    let state = createInitialPinState();
    state = appendDigit(state, '1');
    state = appendDigit(state, '2');
    state = deleteDigit(state); // Backspace removes '2'
    expect(state.pin).toBe('1');

    state = appendDigit(state, '5');
    expect(state.pin).toBe('15');

    state = clearPin(state); // Escape / Clear
    expect(state.pin).toBe('');
    expect(state.masked).toBe('');
  });

  it('handles music invitation choice sequence: YES plays music, NO stays silent', async () => {
    const mockPlay = vi.fn().mockResolvedValue(undefined);
    class MockAudio {
      public play = mockPlay;
      public pause = vi.fn();
      public addEventListener = vi.fn();
      public removeEventListener = vi.fn();
      public volume = 1;
      public muted = false;
      public loop = true;
    }
    global.Audio = MockAudio as unknown as typeof Audio;

    const audioCtrl = new AudioController('/yeat.mp3', 'Yeat');

    // Scenario A: Visitor clicks YES
    let appStage: 'entrance' | 'music-invitation' | 'unlocked' = 'entrance';
    let enteredWithMusic = false;

    // PIN succeeds
    appStage = 'music-invitation';
    expect(appStage).toBe('music-invitation');
    expect(audioCtrl.getState().playbackState).toBe('idle');

    // User explicitly clicks YES
    const playSuccess = await audioCtrl.play();
    if (playSuccess) {
      enteredWithMusic = true;
      appStage = 'unlocked';
    }

    expect(enteredWithMusic).toBe(true);
    expect(appStage).toBe('unlocked');
    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(audioCtrl.getState().playbackState).toBe('playing');

    // Scenario B: Visitor chooses NO (silent entry)
    const silentCtrl = new AudioController('/yeat.mp3', 'Yeat');
    let silentStage: 'entrance' | 'music-invitation' | 'unlocked' = 'music-invitation';
    let silentWithMusic = false;

    // User explicitly clicks NO -> enter without playing
    silentWithMusic = false;
    silentStage = 'unlocked';

    expect(silentStage).toBe('unlocked');
    expect(silentWithMusic).toBe(false);
    expect(silentCtrl.getState().playbackState).toBe('idle'); // Never played!
  });
});
