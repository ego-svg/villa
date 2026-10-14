/**
 * PRIVATE RESIDENCE — Scroll Video Timeline Engine
 *
 * Pure functions and calculation logic for mapping vertical scroll progress
 * to video timeline seeking without autoplay.
 */

export interface ScrollProgressCalculationParams {
  containerTop: number;
  containerHeight: number;
  viewportHeight: number;
  scrollY: number;
}

/**
 * Calculates normalized scroll progress [0, 1] through a scrollable container.
 * 0 = top of container aligns with top of viewport
 * 1 = bottom of container aligns with bottom of viewport
 */
export function calculateScrollProgress({
  containerTop,
  containerHeight,
  viewportHeight,
  scrollY,
}: ScrollProgressCalculationParams): number {
  const maxScroll = containerHeight - viewportHeight;
  if (maxScroll <= 0) return 0;

  // Offset of scroll relative to container top
  const scrollOffset = scrollY - containerTop;
  const progress = scrollOffset / maxScroll;

  return Math.max(0, Math.min(1, progress));
}

/**
 * Maps normalized scroll progress [0, 1] to target video timestamp in seconds.
 */
export function calculateTargetTime(progress: number, duration: number): number {
  if (!duration || duration <= 0 || isNaN(duration) || !isFinite(duration)) {
    return 0;
  }
  const target = progress * duration;
  return Math.max(0, Math.min(duration, target));
}

/**
 * Determines whether a new seek should be triggered.
 * Avoids redundant seeks when delta is below minimum threshold or when already seeking.
 */
export function shouldPerformSeek(
  currentTime: number,
  targetTime: number,
  isSeeking: boolean,
  thresholdSeconds = 0.03
): boolean {
  if (isSeeking) return false;
  return Math.abs(currentTime - targetTime) >= thresholdSeconds;
}

/**
 * Formats seconds into MM:SS.SS display.
 */
export function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}
