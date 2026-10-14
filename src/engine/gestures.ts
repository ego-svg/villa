/**
 * PRIVATE RESIDENCE — Hand Gesture & Coordinate Engine
 *
 * Handles landmark processing, coordinate smoothing, screen-space mapping,
 * and dual-threshold pinch state transitions.
 * Fully independent of visual rendering and camera stream acquisition.
 */

export interface LandmarkPoint {
  x: number;
  y: number;
  z: number;
}

export interface ScreenPoint {
  x: number; // Normalized 0..1 (0 = left, 1 = right)
  y: number; // Normalized 0..1 (0 = top, 1 = bottom)
}

export interface GestureConfig {
  pinchThresholdDown: number; // Distance threshold to trigger PINCH_DOWN (e.g. 0.065)
  pinchThresholdUp: number;   // Distance threshold to trigger PINCH_UP (e.g. 0.095)
  smoothingFactor: number;    // EMA alpha factor (0 < alpha <= 1, e.g. 0.60 for snappy responsiveness)
  isMirrored: boolean;        // Mirror x-coordinate for intuitive selfie webcam control
  reachAmplification: number; // Scales hand movements from camera center to comfortably reach full screen
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  pinchThresholdDown: 0.070,
  pinchThresholdUp: 0.100,
  smoothingFactor: 0.50,
  isMirrored: true,
  reachAmplification: 1.30,
};

// MediaPipe standard landmark indices
export const LANDMARK_THUMB_TIP = 4;
export const LANDMARK_INDEX_FINGER_TIP = 8;
export const LANDMARK_WRIST = 0;

export interface GestureFrameResult {
  hasHand: boolean;
  cursor: ScreenPoint | null;
  rawCursor: ScreenPoint | null;
  pinchDistance: number | null;
  isPinching: boolean;
  pinchStarted: boolean; // Edge trigger: true ONLY on the frame pinch is initiated
  pinchReleased: boolean; // Edge trigger: true ONLY on the frame pinch is released
}

export class GestureProcessor {
  private config: GestureConfig;
  private smoothCursor: ScreenPoint | null = null;
  private isPinchingState = false;

  constructor(config: Partial<GestureConfig> = {}) {
    this.config = { ...DEFAULT_GESTURE_CONFIG, ...config };
  }

  public updateConfig(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): GestureConfig {
    return { ...this.config };
  }

  public reset(): void {
    this.smoothCursor = null;
    this.isPinchingState = false;
  }

  /**
   * Processes a single hand landmarks frame (21 landmarks)
   */
  public processLandmarks(landmarks: LandmarkPoint[] | null | undefined): GestureFrameResult {
    if (!landmarks || landmarks.length < 21) {
      const wasPinching = this.isPinchingState;
      this.reset();
      return {
        hasHand: false,
        cursor: null,
        rawCursor: null,
        pinchDistance: null,
        isPinching: false,
        pinchStarted: false,
        pinchReleased: wasPinching,
      };
    }

    const thumbTip = landmarks[LANDMARK_THUMB_TIP];
    const indexTip = landmarks[LANDMARK_INDEX_FINGER_TIP];

    if (!thumbTip || !indexTip) {
      this.reset();
      return {
        hasHand: false,
        cursor: null,
        rawCursor: null,
        pinchDistance: null,
        isPinching: false,
        pinchStarted: false,
        pinchReleased: false,
      };
    }

    // Map index tip into normalized space
    const baseRawX = this.config.isMirrored ? 1.0 - indexTip.x : indexTip.x;
    const baseRawY = indexTip.y;

    // Apply reach amplification centered around (0.5, 0.5)
    // This allows natural, comfortable hand gestures to easily cover the screen
    const amp = this.config.reachAmplification;
    const amplifiedX = 0.5 + (baseRawX - 0.5) * amp;
    const amplifiedY = 0.5 + (baseRawY - 0.5) * amp;

    const clampedX = Math.max(0, Math.min(1, amplifiedX));
    const clampedY = Math.max(0, Math.min(1, amplifiedY));

    // Exponential moving average (EMA) smoothing for responsive yet stable tracking
    if (!this.smoothCursor) {
      this.smoothCursor = { x: clampedX, y: clampedY };
    } else {
      const alpha = this.config.smoothingFactor;
      this.smoothCursor = {
        x: alpha * clampedX + (1 - alpha) * this.smoothCursor.x,
        y: alpha * clampedY + (1 - alpha) * this.smoothCursor.y,
      };
    }

    // Calculate Euclidean distance in 3D landmark space between thumb tip and index tip
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dz = (thumbTip.z ?? 0) - (indexTip.z ?? 0);
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    let pinchStarted = false;
    let pinchReleased = false;

    // Dual-threshold hysteresis state machine
    if (!this.isPinchingState) {
      if (distance <= this.config.pinchThresholdDown) {
        this.isPinchingState = true;
        pinchStarted = true;
      }
    } else {
      if (distance >= this.config.pinchThresholdUp) {
        this.isPinchingState = false;
        pinchReleased = true;
      }
    }

    return {
      hasHand: true,
      cursor: { ...this.smoothCursor },
      rawCursor: { x: clampedX, y: clampedY },
      pinchDistance: distance,
      isPinching: this.isPinchingState,
      pinchStarted,
      pinchReleased,
    };
  }

  public getIsPinching(): boolean {
    return this.isPinchingState;
  }
}

/**
 * Screen-space 2D bounding box for keypad keys
 */
export interface KeyScreenTarget {
  id: string; // e.g. "1", "2", "DEL", "CLR"
  bounds: {
    left: number;   // normalized 0..1 relative to window
    top: number;    // normalized 0..1 relative to window
    right: number;
    bottom: number;
  };
  canvasRect?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

/**
 * Hit test helper: checks which key target contains point (x, y).
 * Supports sticky target hysteresis to prevent glitching/jitter across key boundaries.
 */
export function findTargetAtPoint(
  point: ScreenPoint,
  targets: KeyScreenTarget[],
  currentTargetId?: string | null
): KeyScreenTarget | null {
  // If a key is currently targeted, give it a 20% expanded boundary buffer
  // so slight hand tremor in the air does not glitch between neighbor keys
  if (currentTargetId) {
    const current = targets.find((t) => t.id === currentTargetId);
    if (current) {
      const w = current.bounds.right - current.bounds.left;
      const h = current.bounds.bottom - current.bounds.top;
      const padW = w * 0.20;
      const padH = h * 0.20;
      if (
        point.x >= current.bounds.left - padW &&
        point.x <= current.bounds.right + padW &&
        point.y >= current.bounds.top - padH &&
        point.y <= current.bounds.bottom + padH
      ) {
        return current;
      }
    }
  }

  for (const target of targets) {
    if (
      point.x >= target.bounds.left &&
      point.x <= target.bounds.right &&
      point.y >= target.bounds.top &&
      point.y <= target.bounds.bottom
    ) {
      return target;
    }
  }
  return null;
}
