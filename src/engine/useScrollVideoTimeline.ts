/**
 * PRIVATE RESIDENCE — useScrollVideoTimeline Hook
 *
 * Synchronizes HTML5 video currentTime with page scroll position.
 * The video remains strictly PAUSED at all times and seeks exclusively on scroll.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  calculateScrollProgress,
  calculateTargetTime,
  shouldPerformSeek,
} from './scrollVideo';

export interface UseScrollVideoTimelineOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLElement | null>;
  reducedMotion?: boolean;
}

export interface ScrollVideoState {
  progress: number;       // 0..1
  currentTime: number;    // seconds
  duration: number;       // seconds
  isLoaded: boolean;
  hasError: boolean;
  errorMessage: string | null;
  hasScrolled: boolean;   // true once user has started scrolling past threshold
}

export function useScrollVideoTimeline({
  videoRef,
  containerRef,
  reducedMotion = false,
}: UseScrollVideoTimelineOptions) {
  const [state, setState] = useState<ScrollVideoState>({
    progress: 0,
    currentTime: 0,
    duration: 0,
    isLoaded: false,
    hasError: false,
    errorMessage: null,
    hasScrolled: false,
  });

  const durationRef = useRef(0);
  const targetTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const isSeekingRef = useRef(false);
  const lastReportedProgressRef = useRef(0);

  // Sync seek to video element in animation frame
  const applySeek = useCallback(() => {
    const video = videoRef.current;
    if (!video || durationRef.current <= 0) return;

    // Ensure video is strictly paused
    if (!video.paused) {
      video.pause();
    }

    const targetTime = targetTimeRef.current;
    if (shouldPerformSeek(video.currentTime, targetTime, isSeekingRef.current, 0.025)) {
      isSeekingRef.current = true;
      try {
        video.currentTime = targetTime;
      } catch {
        isSeekingRef.current = false;
      }
    }
  }, [videoRef]);

  // Main scroll evaluation function
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const rect = container.getBoundingClientRect();
    const containerTop = rect.top + window.scrollY;
    const containerHeight = container.offsetHeight;
    const viewportHeight = window.innerHeight;

    const progress = calculateScrollProgress({
      containerTop,
      containerHeight,
      viewportHeight,
      scrollY: window.scrollY,
    });

    const duration = durationRef.current;
    const target = calculateTargetTime(progress, duration);
    targetTimeRef.current = target;

    // Coalesce React state updates (only update on noticeable increments or boundaries)
    if (Math.abs(progress - lastReportedProgressRef.current) > 0.005 || progress === 0 || progress === 1) {
      lastReportedProgressRef.current = progress;
      setState((prev) => ({
        ...prev,
        progress,
        currentTime: target,
        hasScrolled: prev.hasScrolled || progress > 0.02,
      }));
    }

    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        applySeek();
        rafIdRef.current = null;
      });
    }
  }, [containerRef, videoRef, applySeek]);

  // Manual scrubber (for reduced-motion or accessibility slider)
  const setManualProgress = useCallback((newProgress: number) => {
    const clamped = Math.max(0, Math.min(1, newProgress));
    const duration = durationRef.current;
    const target = calculateTargetTime(clamped, duration);
    targetTimeRef.current = target;

    setState((prev) => ({
      ...prev,
      progress: clamped,
      currentTime: target,
      hasScrolled: true,
    }));

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = target;
    }
  }, [videoRef]);

  // Video element lifecycle & metadata handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Guarantee video is strictly paused
    video.pause();
    video.muted = true;
    video.playsInline = true;

    const handleLoadedMetadata = () => {
      video.pause();
      const dur = video.duration || 0;
      durationRef.current = dur;
      targetTimeRef.current = 0;
      video.currentTime = 0;

      setState((prev) => ({
        ...prev,
        duration: dur,
        isLoaded: true,
        hasError: false,
        errorMessage: null,
      }));

      // Trigger initial scroll calculation once metadata is ready
      handleScroll();
    };

    const handleSeeked = () => {
      isSeekingRef.current = false;
      // If target time changed while seeking was in progress, schedule next seek
      if (videoRef.current && Math.abs(videoRef.current.currentTime - targetTimeRef.current) > 0.04) {
        applySeek();
      }
    };

    const handleError = () => {
      const err = video.error;
      const message = err ? `Video error: code ${err.code}` : 'Failed to load property film.';
      setState((prev) => ({
        ...prev,
        hasError: true,
        errorMessage: message,
      }));
    };

    // If metadata is already loaded
    if (video.readyState >= 1 && video.duration > 0) {
      handleLoadedMetadata();
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('error', handleError);
    };
  }, [videoRef, handleScroll, applySeek]);

  // Scroll and resize listeners
  useEffect(() => {
    if (reducedMotion) return;

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [handleScroll, reducedMotion]);

  return {
    ...state,
    setManualProgress,
  };
}
