/**
 * PRIVATE RESIDENCE — Entrance & Hand Control Coordinator
 *
 * Coordinates:
 * 1. Camera lifecycle (explicit user trigger, silent processing, cleanup on unmount).
 * 2. MediaPipe landmark stream -> Gesture Processor -> Screen-space target selection.
 * 3. 3D Keypad with React Three Fiber + 2D fallback mode.
 * 4. Masked PIN state machine and verification.
 * 5. Perfectly centered numbers & high-contrast layout with ZERO vertical overlap.
 * 6. Responsive camera handling with instant touch feedback on every key including 0.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraVisionManager, CameraStatus } from '../../engine/camera';
import {
  GestureProcessor,
  ScreenPoint,
  KeyScreenTarget,
  findTargetAtPoint,
  LandmarkPoint,
} from '../../engine/gestures';
import {
  PinState,
  createInitialPinState,
  appendDigit,
  deleteDigit,
  clearPin,
  verifyPin,
  DEFAULT_DEMO_PIN,
  MAX_PIN_LENGTH,
} from '../../engine/auth';
import { soundEffects } from '../../engine/soundEffects';
import { Keypad3D } from '../keypad/Keypad3D';
import { KeypadFallback } from '../keypad/KeypadFallback';
import { PinDisplay } from '../keypad/PinDisplay';
import { HandCursor } from '../cursor/HandCursor';
import { CameraPermissionGuide } from './CameraPermissionGuide';
import { Camera, CameraOff, Keyboard, Shield, Hand, ArrowLeftRight, Loader2, Sparkles, HelpCircle } from 'lucide-react';

interface EntranceControllerProps {
  onUnlockSuccess: () => void;
}

export const EntranceController: React.FC<EntranceControllerProps> = ({ onUnlockSuccess }) => {
  // Application & Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('IDLE');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const [isSimulatingGesture, setIsSimulatingGesture] = useState(false);

  // Gesture tuning states
  const [isMirrored, setIsMirrored] = useState(true);
  const [reachLevel, setReachLevel] = useState<'standard' | 'responsive' | 'wide'>('responsive');

  // Gesture & Targeting states
  const [cursor, setCursor] = useState<ScreenPoint | null>(null);
  const [isPinching, setIsPinching] = useState(false);
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);
  const [targetedKeyId, setTargetedKeyId] = useState<string | null>(null);
  const [pressedKeyId, setPressedKeyId] = useState<string | null>(null);

  // PIN & Verification states
  const [pinState, setPinState] = useState<PinState>(createInitialPinState);
  const [use3DKeypad, setUse3DKeypad] = useState(true);

  // Low-latency refs
  const cameraManagerRef = useRef<CameraVisionManager | null>(null);
  const gestureProcessorRef = useRef<GestureProcessor>(
    new GestureProcessor({
      isMirrored: true,
      reachAmplification: 1.45,
      smoothingFactor: 0.65,
    })
  );
  const screenTargetsRef = useRef<KeyScreenTarget[]>([]);
  const pinStateRef = useRef<PinState>(pinState);
  pinStateRef.current = pinState;
  const targetedKeyIdRef = useRef<string | null>(null);
  const lastPinchTriggerTimeRef = useRef<number>(0);

  // Sync gesture tuning changes
  useEffect(() => {
    const ampMap = {
      standard: 1.25,
      responsive: 1.45,
      wide: 1.75,
    };
    gestureProcessorRef.current.updateConfig({
      isMirrored,
      reachAmplification: ampMap[reachLevel],
      smoothingFactor: reachLevel === 'wide' ? 0.60 : reachLevel === 'responsive' ? 0.52 : 0.46,
      enableAdaptiveSmoothing: true,
    });
  }, [isMirrored, reachLevel]);

  // Handle key selection action (from hand pinch, mouse click, touch, or keyboard)
  const handleKeyAction = useCallback((keyId: string) => {
    const currentState = pinStateRef.current;
    if (currentState.status === 'SUCCESS') return;

    soundEffects.playKeyPressSound();

    // Trigger visual press feedback
    setPressedKeyId(keyId);
    setTimeout(() => setPressedKeyId(null), 200);

    let nextState = currentState;

    if (keyId === 'DEL') {
      nextState = deleteDigit(currentState);
    } else if (keyId === 'CLR') {
      nextState = clearPin(currentState);
    } else if (/^[0-9]$/.test(keyId)) {
      nextState = appendDigit(currentState, keyId);

      // Automatic verification when 4th digit entered
      if (nextState.pin.length === MAX_PIN_LENGTH) {
        const { nextState: verifiedState, isCorrect } = verifyPin(nextState);
        nextState = verifiedState;
        if (isCorrect) {
          soundEffects.playSuccessSound();
          setTimeout(() => {
            onUnlockSuccess();
          }, 1200);
        } else {
          soundEffects.playErrorSound();
          // Reset pin after brief error feedback
          setTimeout(() => {
            setPinState((prev) => (prev.status === 'ERROR' ? clearPin(prev) : prev));
          }, 1600);
        }
      }
    }

    setPinState(nextState);
  }, [onUnlockSuccess]);

  // Handle landmarks emitted from camera manager
  const handleLandmarks = useCallback((landmarks: LandmarkPoint[] | null) => {
    const processor = gestureProcessorRef.current;
    const result = processor.processLandmarks(landmarks);

    setIsPinching(result.isPinching);
    setPinchDistance(result.pinchDistance);
    setCursor(result.cursor);

    if (result.cursor && screenTargetsRef.current.length > 0) {
      const hit = findTargetAtPoint(result.cursor, screenTargetsRef.current, targetedKeyIdRef.current);
      const hitId = hit ? hit.id : null;

      if (hitId && hitId !== targetedKeyIdRef.current) {
        soundEffects.playHoverSound();
      }

      targetedKeyIdRef.current = hitId;
      setTargetedKeyId(hitId);

      // Real edge-triggered pinch selection with debouncing to prevent accidental double-entry
      const now = Date.now();
      if (result.pinchStarted && hitId && now - lastPinchTriggerTimeRef.current > 380) {
        lastPinchTriggerTimeRef.current = now;
        handleKeyAction(hitId);
      }
    } else {
      targetedKeyIdRef.current = null;
      setTargetedKeyId(null);
    }
  }, [handleKeyAction]);

  // Start Camera and hand tracking flow
  const handleStartCamera = async () => {
    setCameraError(null);
    setIsStartingCamera(true);
    setIsSimulatingGesture(false);

    try {
      if (!cameraManagerRef.current) {
        cameraManagerRef.current = new CameraVisionManager({
          onStatusChange: (status) => {
            setCameraStatus(status);
            if (status === 'TRACKING') {
              setIsStartingCamera(false);
              setCameraActive(true);
            }
          },
          onLandmarks: handleLandmarks,
          onError: (err) => {
            setCameraError(err);
            setIsStartingCamera(false);
            setCameraActive(false);
            if (err.includes('denied') || err.includes('permission')) {
              setShowPermissionGuide(true);
            }
          },
        });
      }

      const success = await cameraManagerRef.current.start();
      if (success) {
        setCameraActive(true);
        setShowPermissionGuide(false);
      } else {
        setCameraActive(false);
        setShowPermissionGuide(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize camera';
      setCameraError(msg);
      setCameraActive(false);
      setShowPermissionGuide(true);
    } finally {
      setIsStartingCamera(false);
    }
  };

  // Stop Camera and hand tracking flow
  const handleStopCamera = () => {
    if (cameraManagerRef.current) {
      cameraManagerRef.current.stop();
    }
    gestureProcessorRef.current.reset();
    setCameraActive(false);
    setIsStartingCamera(false);
    setIsSimulatingGesture(false);
    setCursor(null);
    setIsPinching(false);
    setPinchDistance(null);
    setTargetedKeyId(null);
    setCameraStatus('STOPPED');
  };

  // Stop camera on component unmount
  useEffect(() => {
    return () => {
      if (cameraManagerRef.current) {
        cameraManagerRef.current.stop();
        cameraManagerRef.current = null;
      }
    };
  }, []);

  // Gesture Simulation Mode (Mouse / Touch Pointer Reticle)
  useEffect(() => {
    if (!isSimulatingGesture) return;

    const handlePointerMove = (e: PointerEvent) => {
      const normX = e.clientX / window.innerWidth;
      const normY = e.clientY / window.innerHeight;
      const pt: ScreenPoint = { x: normX, y: normY };
      setCursor(pt);

      if (screenTargetsRef.current.length > 0) {
        const hit = findTargetAtPoint(pt, screenTargetsRef.current, targetedKeyIdRef.current);
        targetedKeyIdRef.current = hit ? hit.id : null;
        setTargetedKeyId(targetedKeyIdRef.current);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      setIsPinching(true);
      setPinchDistance(0.03);

      const normX = e.clientX / window.innerWidth;
      const normY = e.clientY / window.innerHeight;
      const hit = findTargetAtPoint({ x: normX, y: normY }, screenTargetsRef.current, targetedKeyIdRef.current);
      if (hit) {
        handleKeyAction(hit.id);
      }
    };

    const handlePointerUp = () => {
      setIsPinching(false);
      setPinchDistance(0.14);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isSimulatingGesture, handleKeyAction]);

  // Physical Keyboard Listener (0-9, Backspace, Escape, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyAction(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeyAction('DEL');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleKeyAction('CLR');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pinStateRef.current.pin.length === MAX_PIN_LENGTH) {
          const { nextState, isCorrect } = verifyPin(pinStateRef.current);
          setPinState(nextState);
          if (isCorrect) {
            setTimeout(onUnlockSuccess, 1200);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyAction, onUnlockSuccess]);

  // Compute pinch progress percentage for live feedback
  const pinchProgress =
    pinchDistance !== null
      ? Math.max(0, Math.min(100, Math.round((1 - (pinchDistance - 0.04) / 0.12) * 100)))
      : 0;

  return (
    <div className="relative w-full h-dvh min-h-dvh max-h-screen overflow-hidden bg-[#090a0c] text-stone-200 flex flex-col items-center justify-between px-3 py-2 sm:px-6 sm:py-3 architectural-vignette select-none">
      {/* Top Architectural Header */}
      <header className="w-full max-w-4xl flex items-center justify-between border-b border-white/10 pb-1.5 z-20 shrink-0">
        <div>
          <span className="text-base sm:text-lg font-serif tracking-[0.2em] text-white">
            PRIVATE RESIDENCE
          </span>
          <div className="text-[9px] sm:text-[10px] text-stone-500 uppercase tracking-widest mt-0.5">
            Archival Access Portal · Villa Solitude
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Demo PIN hint */}
          <div className="flex items-center gap-1.5 text-stone-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline text-[11px]">Demo PIN:</span>
            <span className="font-mono text-amber-200 tracking-wider font-semibold text-xs">
              {DEFAULT_DEMO_PIN}
            </span>
          </div>

          {/* Keypad View Toggle (3D vs 2D Touch) */}
          <button
            type="button"
            onClick={() => setUse3DKeypad((prev) => !prev)}
            style={{ touchAction: 'manipulation' }}
            className="flex items-center gap-1.5 text-stone-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg cursor-pointer text-xs"
            title="Toggle between 3D Spatial Keypad and Flat 2D View"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{use3DKeypad ? '2D View' : '3D View'}</span>
          </button>
        </div>
      </header>

      {/* Main Center Stage: Keypad & Numbers are 100% visible, fully shown, and perfectly centered */}
      <main className="relative flex-1 min-h-0 w-full max-w-md flex flex-col items-center justify-center my-auto py-1 z-20">
        {/* PIN Security Dots */}
        <div className="mb-1 shrink-0">
          <PinDisplay pinState={pinState} />
        </div>

        {/* Compact Center Actions Strip */}
        {!cameraActive && !isSimulatingGesture ? (
          <div className="flex flex-col items-center gap-1 mb-1 shrink-0 w-full px-2 max-w-xs">
            <div className="flex items-center justify-center gap-2 w-full">
              <button
                type="button"
                disabled={isStartingCamera}
                onClick={handleStartCamera}
                style={{ touchAction: 'manipulation' }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 hover:from-amber-100 hover:to-amber-200 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.35)] active:scale-95 cursor-pointer font-sans disabled:opacity-70"
              >
                {isStartingCamera ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-black animate-spin" />
                    <span>Opening camera...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-black" />
                    <span>Activate Hand Control</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSimulatingGesture(true)}
                style={{ touchAction: 'manipulation' }}
                className="px-2.5 py-1.5 text-xs text-amber-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                title="Simulate hand cursor with touch or mouse"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate</span>
              </button>
            </div>

            {/* Error Notification Pill if camera is blocked */}
            {cameraError && (
              <div className="flex items-center justify-between gap-2 w-full text-[10px] text-red-300 bg-red-950/60 border border-red-800/50 px-2.5 py-1 rounded-xl">
                <span className="truncate">Camera blocked by browser</span>
                <button
                  type="button"
                  onClick={() => setShowPermissionGuide(true)}
                  className="underline text-amber-200 font-medium shrink-0 cursor-pointer"
                >
                  How to allow?
                </button>
              </div>
            )}
          </div>
        ) : isSimulatingGesture ? (
          /* Gesture Simulation Active Strip */
          <div className="flex items-center justify-between gap-2 text-xs bg-[#161a22]/95 border border-amber-400/30 px-3 py-1 rounded-xl mb-1 backdrop-blur-md shadow-xl shrink-0 w-full max-w-xs">
            <span className="text-amber-200 flex items-center gap-1 text-[11px] font-medium truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>
                {targetedKeyId ? (
                  <>Targeting <strong className="text-amber-300 font-mono text-xs underline">{targetedKeyId}</strong> — Tap to enter</>
                ) : (
                  'Move pointer over keys & click'
                )}
              </span>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleStartCamera}
                className="px-2 py-0.5 text-[10px] rounded bg-amber-400/20 text-amber-200 border border-amber-400/30 cursor-pointer"
              >
                Camera
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSimulatingGesture(false);
                  setCursor(null);
                }}
                className="px-2 py-0.5 text-[10px] rounded bg-white/10 text-stone-300 cursor-pointer"
              >
                Exit
              </button>
            </div>
          </div>
        ) : (
          /* Real Camera Active Status & Quick Control Strip */
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs bg-[#12151d]/90 border border-white/10 px-2.5 py-1 rounded-xl mb-1 backdrop-blur-md shadow-xl shrink-0 w-full max-w-xs">
            {cameraStatus === 'REQUESTING_PERMISSION' && (
              <span className="text-stone-400 flex items-center gap-1.5 animate-pulse text-[10px]">
                <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                Requesting permission...
              </span>
            )}
            {cameraStatus === 'LOADING_MODEL' && (
              <span className="text-stone-400 flex items-center gap-1.5 animate-pulse text-[10px]">
                <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                Initializing tracking...
              </span>
            )}
            {cameraStatus === 'TRACKING' && (
              <>
                <span className="text-amber-200 flex items-center gap-1 font-medium text-[10px]">
                  <Hand className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
                  {targetedKeyId ? (
                    <span>
                      Targeting <strong className="text-amber-300 font-mono text-xs underline">{targetedKeyId}</strong> — Touch fingers
                    </span>
                  ) : (
                    <span>Aim at number & touch fingers to press</span>
                  )}
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Live Pinch Bar */}
                  <div className="w-7 h-1 bg-stone-800 rounded-full overflow-hidden border border-white/10">
                    <div
                      className={`h-full transition-all duration-75 ${
                        isPinching ? 'bg-amber-300 w-full' : 'bg-stone-400'
                      }`}
                      style={{ width: `${isPinching ? 100 : pinchProgress}%` }}
                    />
                  </div>

                  {/* Mirror Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsMirrored((prev) => !prev)}
                    style={{ touchAction: 'manipulation' }}
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] rounded bg-white/5 border border-white/10 text-stone-300 cursor-pointer"
                    title="Click to invert horizontal tracking direction"
                  >
                    <ArrowLeftRight className="w-2.5 h-2.5 text-amber-300" />
                    <span>{isMirrored ? 'Mirrored' : 'Direct'}</span>
                  </button>

                  {/* Deactivate button */}
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    style={{ touchAction: 'manipulation' }}
                    className="px-1.5 py-0.5 text-[9px] rounded bg-red-950/40 text-red-300 border border-red-800/40 cursor-pointer"
                  >
                    Stop
                  </button>
                </div>
              </>
            )}
            {cameraStatus === 'HAND_LOST' && (
              <div className="flex items-center justify-between w-full text-stone-400 text-[10px]">
                <span>Raise hand in camera view</span>
                <button
                  type="button"
                  onClick={handleStopCamera}
                  style={{ touchAction: 'manipulation' }}
                  className="px-2 py-0.5 text-[9px] rounded bg-white/10 text-stone-300 hover:text-white cursor-pointer"
                >
                  Stop
                </button>
              </div>
            )}
          </div>
        )}

        {/* Spatial Keypad Container: Perfectly centered on screen, 100% visible, key 0 clearly shown & accessible */}
        <div className="relative w-full max-w-[290px] sm:max-w-[330px] h-[270px] sm:h-[310px] flex items-center justify-center shrink-0">
          {use3DKeypad ? (
            <Keypad3D
              targetedKeyId={targetedKeyId}
              pressedKeyId={pressedKeyId}
              onSelectKey={handleKeyAction}
              onRegisterTargets={(targets) => {
                screenTargetsRef.current = targets;
              }}
              disabled={pinState.status === 'SUCCESS'}
            />
          ) : (
            <KeypadFallback
              onSelectKey={handleKeyAction}
              disabled={pinState.status === 'SUCCESS'}
            />
          )}

          {/* Hand Tracking / Simulation Reticle Cursor (Screen-space overlay) */}
          {(cameraActive || isSimulatingGesture) && (
            <HandCursor
              cursor={cursor}
              isPinching={isPinching}
              pinchDistance={pinchDistance}
            />
          )}
        </div>

        <div className="text-[10px] sm:text-[11px] text-stone-500 text-center mt-1 shrink-0">
          Touch or aim at numbers to enter · Keyboard supported (Demo: 2026)
        </div>
      </main>

      {/* Camera Permission Guide Modal */}
      <CameraPermissionGuide
        isOpen={showPermissionGuide}
        onClose={() => setShowPermissionGuide(false)}
        onRetry={() => {
          setShowPermissionGuide(false);
          handleStartCamera();
        }}
        onEnableSimulation={() => {
          setShowPermissionGuide(false);
          setIsSimulatingGesture(true);
        }}
        errorMessage={cameraError}
      />

      {/* Bottom Architectural Footer */}
      <footer className="w-full max-w-2xl flex items-center justify-center text-center pt-1 border-t border-white/10 z-10 shrink-0">
        <div className="text-[10px] text-stone-500">
          Privacy-First Architecture · Hand landmarks processed strictly in-browser memory · No video data stored
        </div>
      </footer>
    </div>
  );
};
