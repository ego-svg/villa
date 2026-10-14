/**
 * PRIVATE RESIDENCE — Camera & MediaPipe Vision Lifecycle Engine
 *
 * Requirements:
 * 1. Explicit user trigger ONLY.
 * 2. Silent in-memory video stream processing (never appended to DOM).
 * 3. Zero frame upload/telemetry (100% client-side privacy).
 * 4. Deterministic cleanup: stops all tracks & RAF loops on unmount.
 * 5. Resilient fallback & error reporting.
 */

import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { LandmarkPoint } from './gestures';

export type CameraStatus =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'LOADING_MODEL'
  | 'TRACKING'
  | 'HAND_LOST'
  | 'ERROR'
  | 'STOPPED';

export interface CameraCallbacks {
  onStatusChange?: (status: CameraStatus) => void;
  onLandmarks?: (landmarks: LandmarkPoint[] | null) => void;
  onError?: (errorMessage: string) => void;
}

const WASM_CDN_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_CDN_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export class CameraVisionManager {
  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private handLandmarker: HandLandmarker | null = null;
  private rafId: number | null = null;
  private isRunning = false;
  private lastVideoTime = -1;
  private consecutiveLostFrames = 0;
  private callbacks: CameraCallbacks;
  private status: CameraStatus = 'IDLE';

  constructor(callbacks: CameraCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public getStatus(): CameraStatus {
    return this.status;
  }

  private setStatus(newStatus: CameraStatus): void {
    this.status = newStatus;
    this.callbacks.onStatusChange?.(newStatus);
  }

  /**
   * Initializes the MediaPipe model and requests camera stream.
   * MUST be called from an explicit user action (e.g. click).
   */
  public async start(): Promise<boolean> {
    if (this.isRunning) {
      return true;
    }

    try {
      this.setStatus('REQUESTING_PERMISSION');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser environment. Please use keyboard or touch input.');
      }

      // Acquire media stream with optimized resolution for low latency
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      });

      this.mediaStream = stream;

      // Create silent offscreen video element attached to DOM to prevent browser decoding throttling
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.opacity = '0.001';
      video.style.pointerEvents = 'none';
      video.style.zIndex = '-9999';
      video.setAttribute('aria-hidden', 'true');
      document.body.appendChild(video);
      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        let isDone = false;
        const markReady = () => {
          if (isDone) return;
          isDone = true;
          video.play().then(() => resolve()).catch(() => resolve());
        };

        if (video.readyState >= 1) {
          markReady();
          return;
        }

        video.onloadedmetadata = markReady;
        video.oncanplay = markReady;
        video.onloadeddata = markReady;

        // Fallback safety timeout so video never hangs indefinitely
        setTimeout(markReady, 2500);
      });

      this.videoElement = video;

      // Initialize MediaPipe HandLandmarker model
      this.setStatus('LOADING_MODEL');
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN_PATH);

      try {
        // Attempt GPU delegate first
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_CDN_PATH,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (gpuError) {
        console.warn('MediaPipe GPU initialization failed, falling back to CPU delegate:', gpuError);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_CDN_PATH,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        });
      }

      this.isRunning = true;
      this.setStatus('TRACKING');
      this.startDetectionLoop();
      return true;
    } catch (err: unknown) {
      this.stop();
      let message = 'Unable to access webcam.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          message = 'Camera permission was denied. You can proceed with standard keyboard or touch input.';
        } else if (err.name === 'NotFoundError') {
          message = 'No video camera found on this device.';
        } else {
          message = `Camera error: ${err.message}`;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }
      this.setStatus('ERROR');
      this.callbacks.onError?.(message);
      return false;
    }
  }

  /**
   * Continuous silent landmark detection loop
   */
  private startDetectionLoop(): void {
    if (!this.isRunning) return;

    const detect = () => {
      if (!this.isRunning || !this.videoElement || !this.handLandmarker) {
        return;
      }

      const video = this.videoElement;
      const now = performance.now();
      if (video.readyState >= 2 && now - this.lastVideoTime >= 25) {
        this.lastVideoTime = now;
        try {
          const results: HandLandmarkerResult = this.handLandmarker.detectForVideo(
            video,
            now
          );

          if (results.landmarks && results.landmarks.length > 0 && results.landmarks[0].length >= 21) {
            this.consecutiveLostFrames = 0;
            const rawLandmarks = results.landmarks[0];
            const mappedLandmarks: LandmarkPoint[] = rawLandmarks.map((pt) => ({
              x: pt.x,
              y: pt.y,
              z: pt.z,
            }));
            if (this.status !== 'TRACKING') {
              this.setStatus('TRACKING');
            }
            this.callbacks.onLandmarks?.(mappedLandmarks);
          } else {
            this.consecutiveLostFrames++;
            // Allow 3 grace frames (~80-100ms) before reporting loss to avoid single-frame flickering/glitching
            if (this.consecutiveLostFrames >= 3) {
              if (this.status === 'TRACKING') {
                this.setStatus('HAND_LOST');
              }
              this.callbacks.onLandmarks?.(null);
            }
          }
        } catch {
          // Skip frame gracefully if timestamp or buffer issue
        }
      }

      this.rafId = requestAnimationFrame(detect);
    };

    this.rafId = requestAnimationFrame(detect);
  }

  /**
   * Deterministic teardown of all media tracks, video streams, and RAF loops
   */
  public stop(): void {
    this.isRunning = false;
    this.consecutiveLostFrames = 0;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore track stop error
        }
      });
      this.mediaStream = null;
    }

    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.srcObject = null;
        if (this.videoElement.parentElement) {
          this.videoElement.parentElement.removeChild(this.videoElement);
        }
      } catch {
        // Ignore video reset error
      }
      this.videoElement = null;
    }

    if (this.handLandmarker) {
      try {
        this.handLandmarker.close();
      } catch {
        // Ignore close error
      }
      this.handLandmarker = null;
    }

    this.setStatus('STOPPED');
  }
}
