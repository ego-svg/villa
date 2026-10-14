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
  touchThresholdDown: number; // Distance threshold when thumb tip & index tip physically touch (e.g. 0.070)
  touchThresholdUp: number;   // Distance threshold required when fingers separate before next selection (e.g. 0.100)
  pinchThresholdDown?: number; // Alias for touchThresholdDown
  pinchThresholdUp?: number;   // Alias for touchThresholdUp
  smoothingFactor: number;    // EMA alpha factor (0 < alpha <= 1)
  isMirrored: boolean;        // Mirror x-coordinate for intuitive selfie webcam control
  reachAmplification: number; // Scales hand movements from camera center to comfortably reach full screen
  enableAdaptiveSmoothing?: boolean; // Dynamically scale alpha for zero-jitter hover
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  touchThresholdDown: 0.070,
  touchThresholdUp: 0.100,
  pinchThresholdDown: 0.070,
  pinchThresholdUp: 0.100,
  smoothingFactor: 0.50,
  isMirrored: true,
  reachAmplification: 1.30,
  enableAdaptiveSmoothing: false,
};

// MediaPipe standard landmark indices
export const LANDMARK_THUMB_TIP = 4;
export const LANDMARK_INDEX_FINGER_TIP = 8;
export const LANDMARK_WRIST = 0;

export interface GestureFrameResult {
  hasHand: boolean;
  cursor: ScreenPoint | null;
  rawCursor: ScreenPoint | null;
  fingerDistance: number | null;
  pinchDistance: number | null; // Alias for fingerDistance
  isTouching: boolean;          // True while thumb tip and index fingertip are touching in air
  touchStarted: boolean;        // Edge trigger: true ONLY on the frame two fingers touch
  touchReleased: boolean;       // Edge trigger: true ONLY on the frame two fingers separate
  isPinching: boolean;          // Alias for isTouching
  pinchStarted: boolean;        // Alias for touchStarted
  pinchReleased: boolean;       // Alias for touchReleased
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
      const wasTouching = this.isPinchingState;
      this.reset();
      return {
        hasHand: false,
        cursor: null,
        rawCursor: null,
        fingerDistance: null,
        pinchDistance: null,
        isTouching: false,
        touchStarted: false,
        touchReleased: wasTouching,
        isPinching: false,
        pinchStarted: false,
        pinchReleased: wasTouching,
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
        fingerDistance: null,
        pinchDistance: null,
        isTouching: false,
        touchStarted: false,
        touchReleased: false,
        isPinching: false,
        pinchStarted: false,
        pinchReleased: false,
      };
    }

    // Calculate Euclidean distance in 3D landmark space between thumb tip and index tip
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dz = (thumbTip.z ?? 0) - (indexTip.z ?? 0);
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // As fingers close together (< 0.12), blend index tip toward thumb tip midpoint
    // so finger movement during the touch press action does not drag cursor off target number
    let targetX = indexTip.x;
    let targetY = indexTip.y;

    if (distance < 0.12) {
      const blend = Math.min(1.0, Math.max(0.0, (0.12 - distance) / 0.08)) * 0.5;
      targetX = indexTip.x * (1 - blend) + thumbTip.x * blend;
      targetY = indexTip.y * (1 - blend) + thumbTip.y * blend;
    }

    // Map into normalized space and apply mirror if configured
    const baseRawX = this.config.isMirrored ? 1.0 - targetX : targetX;
    const baseRawY = targetY;

    // Apply reach amplification centered around (0.5, 0.5)
    // This allows natural, comfortable hand gestures to easily cover the full keypad
    const amp = this.config.reachAmplification;
    const amplifiedX = 0.5 + (baseRawX - 0.5) * amp;
    const amplifiedY = 0.5 + (baseRawY - 0.5) * amp;

    const clampedX = Math.max(0, Math.min(1, amplifiedX));
    const clampedY = Math.max(0, Math.min(1, amplifiedY));

    // Adaptive smoothing for rock-solid stability during hover / slow targeting
    if (!this.smoothCursor) {
      this.smoothCursor = { x: clampedX, y: clampedY };
    } else {
      // Calculate cursor movement velocity
      const moveDx = clampedX - this.smoothCursor.x;
      const moveDy = clampedY - this.smoothCursor.y;
      const speed = Math.sqrt(moveDx * moveDx + moveDy * moveDy);

      // Scale alpha adaptively if enabled: high speed -> responsive, low speed -> ultra-smooth
      let alpha = this.config.smoothingFactor;
      if (this.config.enableAdaptiveSmoothing && speed < 0.04) {
        const hoverRatio = speed / 0.04;
        alpha = Math.max(0.20, Math.min(this.config.smoothingFactor, 0.22 + (this.config.smoothingFactor - 0.22) * hoverRatio));
      }

      // If currently in an active finger touch, damp cursor position to lock cursor during key press!
      if (this.isPinchingState) {
        alpha = 0.05;
      }

      this.smoothCursor = {
        x: alpha * clampedX + (1 - alpha) * this.smoothCursor.x,
        y: alpha * clampedY + (1 - alpha) * this.smoothCursor.y,
      };
    }

    let touchStarted = false;
    let touchReleased = false;

    const thresholdDown = this.config.touchThresholdDown ?? this.config.pinchThresholdDown ?? 0.070;
    const thresholdUp = this.config.touchThresholdUp ?? this.config.pinchThresholdUp ?? 0.100;

    // Dual-threshold hysteresis state machine for finger touching gesture
    if (!this.isPinchingState) {
      if (distance <= thresholdDown) {
        this.isPinchingState = true;
        touchStarted = true;
      }
    } else {
      if (distance >= thresholdUp) {
        this.isPinchingState = false;
        touchReleased = true;
      }
    }

    return {
      hasHand: true,
      cursor: { ...this.smoothCursor },
      rawCursor: { x: clampedX, y: clampedY },
      fingerDistance: distance,
      pinchDistance: distance,
      isTouching: this.isPinchingState,
      touchStarted,
      touchReleased,
      isPinching: this.isPinchingState,
      pinchStarted: touchStarted,
      pinchReleased: touchReleased,
    };
  }

  public getIsPinching(): boolean {
    return this.isPinchingState;
  }

  public getIsTouching(): boolean {
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
