import { describe, it, expect } from 'vitest';
import {
  calculateScrollProgress,
  calculateTargetTime,
  shouldPerformSeek,
  formatVideoTime,
} from '../scrollVideo';

describe('Scroll Video Timeline Engine (scrollVideo.ts)', () => {
  describe('calculateScrollProgress', () => {
    it('returns 0 when scroll is at or before container top', () => {
      const progress = calculateScrollProgress({
        containerTop: 100,
        containerHeight: 3000,
        viewportHeight: 1000,
        scrollY: 50,
      });
      expect(progress).toBe(0);
    });

    it('returns 0.5 when halfway through container scroll distance', () => {
      // containerHeight = 3000, viewportHeight = 1000 -> maxScroll = 2000
      // scrollOffset = 1100 - 100 = 1000 -> 1000 / 2000 = 0.5
      const progress = calculateScrollProgress({
        containerTop: 100,
        containerHeight: 3000,
        viewportHeight: 1000,
        scrollY: 1100,
      });
      expect(progress).toBeCloseTo(0.5, 4);
    });

    it('returns 1.0 when reached the end of container scroll distance', () => {
      // scrollOffset = 2100 - 100 = 2000 -> 2000 / 2000 = 1.0
      const progress = calculateScrollProgress({
        containerTop: 100,
        containerHeight: 3000,
        viewportHeight: 1000,
        scrollY: 2100,
      });
      expect(progress).toBe(1.0);
    });

    it('clamps values beyond container bounds to 1.0', () => {
      const progress = calculateScrollProgress({
        containerTop: 0,
        containerHeight: 2000,
        viewportHeight: 1000,
        scrollY: 3500,
      });
      expect(progress).toBe(1.0);
    });

    it('handles zero or negative maxScroll safely', () => {
      const progress = calculateScrollProgress({
        containerTop: 0,
        containerHeight: 500,
        viewportHeight: 1000,
        scrollY: 200,
      });
      expect(progress).toBe(0);
    });
  });

  describe('calculateTargetTime', () => {
    it('maps 0 progress to 0.0 seconds', () => {
      expect(calculateTargetTime(0, 12.5)).toBe(0);
    });

    it('maps 0.5 progress to half duration', () => {
      expect(calculateTargetTime(0.5, 10.0)).toBe(5.0);
    });

    it('maps 1.0 progress to full duration', () => {
      expect(calculateTargetTime(1.0, 8.4)).toBe(8.4);
    });

    it('handles invalid or zero duration gracefully without crashing', () => {
      expect(calculateTargetTime(0.5, 0)).toBe(0);
      expect(calculateTargetTime(0.5, NaN)).toBe(0);
      expect(calculateTargetTime(0.5, -5)).toBe(0);
    });
  });

  describe('shouldPerformSeek', () => {
    it('returns false if video is currently seeking', () => {
      expect(shouldPerformSeek(2.0, 5.0, true)).toBe(false);
    });

    it('returns false if delta is below threshold', () => {
      expect(shouldPerformSeek(2.0, 2.01, false, 0.03)).toBe(false);
    });

    it('returns true if delta exceeds threshold and not seeking', () => {
      expect(shouldPerformSeek(2.0, 2.15, false, 0.03)).toBe(true);
    });
  });

  describe('formatVideoTime', () => {
    it('formats 0s as 00:00.0', () => {
      expect(formatVideoTime(0)).toBe('00:00.0');
    });

    it('formats seconds with fraction correctly', () => {
      expect(formatVideoTime(65.4)).toBe('01:05.4');
    });
  });
});
