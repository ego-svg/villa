import { describe, it, expect } from 'vitest';
import {
  GestureProcessor,
  findTargetAtPoint,
  LandmarkPoint,
  KeyScreenTarget,
} from '../gestures';

function createSyntheticLandmarks(thumbX = 0.35, thumbY = 0.5, indexX = 0.5, indexY = 0.5): LandmarkPoint[] {
  const points: LandmarkPoint[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  points[4] = { x: thumbX, y: thumbY, z: 0 };
  points[8] = { x: indexX, y: indexY, z: 0 };
  return points;
}

describe('Gesture Engine (gestures.ts)', () => {
  it('correctly maps and mirrors index fingertip to screen-space coordinates', () => {
    const processor = new GestureProcessor({ isMirrored: true, smoothingFactor: 1.0, reachAmplification: 1.0 });
    // index fingertip at x=0.2 (webcam left side)
    const landmarks = createSyntheticLandmarks(0.05, 0.4, 0.2, 0.4);
    const result = processor.processLandmarks(landmarks);

    expect(result.hasHand).toBe(true);
    // Mirrored: 1.0 - 0.2 = 0.8
    expect(result.cursor?.x).toBeCloseTo(0.8, 5);
    expect(result.cursor?.y).toBeCloseTo(0.4, 5);
  });

  it('smooths cursor movements using exponential moving average', () => {
    const processor = new GestureProcessor({ isMirrored: false, smoothingFactor: 0.5, reachAmplification: 1.0 });

    // Frame 1: index at x=0.2
    const frame1 = processor.processLandmarks(createSyntheticLandmarks(0.05, 0.2, 0.2, 0.2));
    expect(frame1.cursor?.x).toBeCloseTo(0.2, 5);

    // Frame 2: index jumps to x=0.6
    const frame2 = processor.processLandmarks(createSyntheticLandmarks(0.45, 0.2, 0.6, 0.2));
    // EMA: 0.5 * 0.6 + 0.5 * 0.2 = 0.4
    expect(frame2.cursor?.x).toBeCloseTo(0.4, 5);
  });

  it('detects pinch start edge-trigger when distance <= pinchThresholdDown', () => {
    const processor = new GestureProcessor({
      pinchThresholdDown: 0.05,
      pinchThresholdUp: 0.09,
    });

    // Open hand: distance = 0.12 > 0.05
    const openHand = createSyntheticLandmarks(0.5, 0.5, 0.62, 0.5);
    const r1 = processor.processLandmarks(openHand);
    expect(r1.isPinching).toBe(false);
    expect(r1.pinchStarted).toBe(false);

    // Fingers brought together: distance = 0.03 < 0.05
    const pinchedHand = createSyntheticLandmarks(0.5, 0.5, 0.53, 0.5);
    const r2 = processor.processLandmarks(pinchedHand);
    expect(r2.isPinching).toBe(true);
    expect(r2.pinchStarted).toBe(true); // First frame of pinch triggers PINCH_START
  });

  it('does NOT re-trigger pinchStarted while hold continues (hysteresis & single trigger)', () => {
    const processor = new GestureProcessor({
      pinchThresholdDown: 0.05,
      pinchThresholdUp: 0.09,
    });

    // Frame 1: Pinch start
    processor.processLandmarks(createSyntheticLandmarks(0.5, 0.5, 0.53, 0.5));

    // Frame 2: Still pinched
    const r2 = processor.processLandmarks(createSyntheticLandmarks(0.5, 0.5, 0.52, 0.5));
    expect(r2.isPinching).toBe(true);
    expect(r2.pinchStarted).toBe(false); // No second selection!

    // Frame 3: Still pinched
    const r3 = processor.processLandmarks(createSyntheticLandmarks(0.5, 0.5, 0.51, 0.5));
    expect(r3.isPinching).toBe(true);
    expect(r3.pinchStarted).toBe(false); // No third selection!
  });

  it('requires crossing pinchThresholdUp to release pinch before another selection is accepted', () => {
    const processor = new GestureProcessor({
      pinchThresholdDown: 0.05,
      pinchThresholdUp: 0.09,
    });

    // Pinch start (dist = 0.03)
    processor.processLandmarks(createSyntheticLandmarks(0.5, 0.5, 0.53, 0.5));

    // In-between distance (dist = 0.07, between 0.05 and 0.09)
    // Because hysteresis thresholdUp is 0.09, it should STILL be considered pinched!
    const inBetween = processor.processLandmarks(createSyntheticLandmarks(0.5, 0.5, 0.57, 0.5));
    expect(inBetween.isPinching).toBe(true);
    expect(inBetween.pinchReleased).toBe(false);

    // Full release: distance = 0.11 > 0.09
    const released = processor.processLandmarks(createSyntheticLandmarks(0.5, 0.5, 0.61, 0.5));
    expect(released.isPinching).toBe(false);
    expect(released.pinchReleased).toBe(true);

    // Now a NEW pinch can trigger pinchStarted again!
    const newPinch = processor.processLandmarks(createSyntheticLandmarks(0.5, 0.5, 0.53, 0.5));
    expect(newPinch.isPinching).toBe(true);
    expect(newPinch.pinchStarted).toBe(true);
  });

  it('gracefully handles missing landmarks or hand loss', () => {
    const processor = new GestureProcessor();
    // Pinch started
    processor.processLandmarks(createSyntheticLandmarks(0.5, 0.5, 0.52, 0.5));

    // Hand leaves frame
    const lostFrame = processor.processLandmarks(null);
    expect(lostFrame.hasHand).toBe(false);
    expect(lostFrame.cursor).toBeNull();
    expect(lostFrame.isPinching).toBe(false);
  });

  it('findTargetAtPoint finds correct screen bounding box target', () => {
    const targets: KeyScreenTarget[] = [
      { id: '1', bounds: { left: 0.1, top: 0.1, right: 0.3, bottom: 0.3 } },
      { id: '2', bounds: { left: 0.4, top: 0.1, right: 0.6, bottom: 0.3 } },
      { id: '3', bounds: { left: 0.7, top: 0.1, right: 0.9, bottom: 0.3 } },
    ];

    expect(findTargetAtPoint({ x: 0.2, y: 0.2 }, targets)?.id).toBe('1');
    expect(findTargetAtPoint({ x: 0.5, y: 0.2 }, targets)?.id).toBe('2');
    expect(findTargetAtPoint({ x: 0.85, y: 0.25 }, targets)?.id).toBe('3');
    // Deadzone between targets
    expect(findTargetAtPoint({ x: 0.35, y: 0.2 }, targets)).toBeNull();
  });

  it('stabilizes active target with sticky hysteresis against slight jitter', () => {
    const targets: KeyScreenTarget[] = [
      { id: '1', bounds: { left: 0.1, top: 0.1, right: 0.3, bottom: 0.3 } },
      { id: '2', bounds: { left: 0.4, top: 0.1, right: 0.6, bottom: 0.3 } },
    ];

    // Point slightly outside '1's normal right bound (0.32), but user was targeting '1'
    const stabilized = findTargetAtPoint({ x: 0.32, y: 0.2 }, targets, '1');
    expect(stabilized?.id).toBe('1');

    // Without hysteresis, point 0.32 is deadzone
    expect(findTargetAtPoint({ x: 0.32, y: 0.2 }, targets)).toBeNull();
  });

  it('detects finger touch selection gesture when thumb tip & index tip physically touch', () => {
    const processor = new GestureProcessor({
      touchThresholdDown: 0.065,
      touchThresholdUp: 0.095,
    });

    // Open hand (distance = 0.15 > 0.065)
    const openHand = createSyntheticLandmarks(0.4, 0.5, 0.55, 0.5);
    const r1 = processor.processLandmarks(openHand);
    expect(r1.isTouching).toBe(false);
    expect(r1.touchStarted).toBe(false);

    // Fingers touch together (distance = 0.03 < 0.065)
    const touchingHand = createSyntheticLandmarks(0.5, 0.5, 0.53, 0.5);
    const r2 = processor.processLandmarks(touchingHand);
    expect(r2.isTouching).toBe(true);
    expect(r2.touchStarted).toBe(true); // Edge trigger fired!

    // Holding fingers together in subsequent frame does NOT re-trigger selection
    const r3 = processor.processLandmarks(touchingHand);
    expect(r3.isTouching).toBe(true);
    expect(r3.touchStarted).toBe(false);

    // Fingers separate (distance = 0.12 > 0.095)
    const separatedHand = createSyntheticLandmarks(0.4, 0.5, 0.52, 0.5);
    const r4 = processor.processLandmarks(separatedHand);
    expect(r4.isTouching).toBe(false);
    expect(r4.touchReleased).toBe(true);

    // New touch gesture after separation triggers touchStarted again
    const r5 = processor.processLandmarks(touchingHand);
    expect(r5.isTouching).toBe(true);
    expect(r5.touchStarted).toBe(true);
  });
});
