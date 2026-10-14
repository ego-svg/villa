# TEST-PLAN.md — Comprehensive Verification & Testing Strategy

## 1. Overview
This test plan defines the testing framework, test cases, and quality standards for **PRIVATE RESIDENCE**. Testing spans unit tests, component tests, gesture simulation tests, camera lifecycle checks, and real-camera performance benchmarks.

## 2. Test Architecture & Frameworks

- **Unit Testing**: Vitest (`vitest`) for pure mathematical and state machine logic.
- **Component & Integration Testing**: Vitest integration test suites (`integration.test.ts`).
- **Gesture Simulation**: Mock hand landmark matrices representing Pinch Open, Pinch Down, Moving Cursor, and Release sequences.
- **Execution Status**: 5 test suites / 36 automated tests passing (`npm test`).

## 3. Unit Test Suites (`/src/engine/__tests__/`)

### 3.1 Gesture Math & Hysteresis (`gestures.test.ts`)
1. **Euclidean Distance Calculation**: Verify 3D distance calculation between Landmark 4 and Landmark 8.
2. **Exponential Moving Average (EMA)**: Verify smoothing calculation prevents sudden coordinate jumps while maintaining low latency ($\le 30\text{ms}$).
3. **Pinch State Machine**:
   - `PINCH_DOWN` triggers when distance drops below $0.065$.
   - Holding distance does NOT re-trigger `PINCH_DOWN`.
   - `PINCH_UP` resets state when distance exceeds $0.095$.
   - Rapid oscillations around boundary do not flutter due to hysteresis gap.

### 3.2 Passcode State Machine (`auth.test.ts`)
1. **Digit Appending**: Appending digit adds to state until 4 digits max.
2. **Masking**: Output string generates matching dots count.
3. **Backspace & Clear**: Removing digits or clearing resets state correctly.
4. **Verification**:
   - PIN `2026` returns `STATUS_SUCCESS`.
   - Invalid PIN `9999` returns `STATUS_ERROR` and triggers error shake state.

### 3.3 Camera Lifecycle (`camera.test.ts`)
1. **Permission Flow**: Verify `getUserMedia` is called only upon calling `startCamera()`.
2. **Cleanup & Unmount**: Verify `stopCamera()` loops through all active tracks, calls `track.stop()`, and cancels active `requestAnimationFrame`.

### 3.4 Scroll Video Timeline Engine (`scrollVideo.test.ts`)
1. **Scroll Progress Normalization**: Maps vertical scroll position relative to container into $[0, 1]$.
2. **Target Timestamp Calculation**: Maps progress to video duration with edge-case clamping and safety checks.
3. **Seek Coalescing**: Prevents redundant seek calls when seeking is in-flight or delta $< 0.03$s.
4. **Time Code Formatting**: Formats seconds into architectural `MM:SS.S` readout.

## 4. Component & Integration Test Cases

| Component | Target Behavior | Verification Method |
| :--- | :--- | :--- |
| `EntranceScreen` | Displays activation prompt, does NOT request camera on load. | DOM Render test |
| `Keypad3D` | Key highlight on cursor hit; active press animation on pinch. | Simulated gesture coordinate test |
| `PasscodeDots` | Renders 4 dot slots; fills dot when digit entered. | React Testing Library |
| `KeyboardFallback` | Typing '2026' on physical keyboard submits PIN code. | Keyboard event trigger test |
| `PropertyFilm` | Starts playing HTML5 video strictly after unlock state. | Integration state transition test |

## 5. Real-Camera & Hardware Benchmarks

- **Target Frame Rate**: $\ge 30\text{ FPS}$ gesture tracking loop on standard integrated WebCam (1080p / 720p).
- **Latency Budget**: Hand landmark detection + EMA smoothing + target hit test $\le 40\text{ ms}$ total frame-to-cursor update time.
- **Memory Consumption**: Zero memory leaks during 10-minute continuous camera session. All WebGL textures and MediaPipe instances disposed on unmount.
- **Lighting Conditions**: Tested under low ambient light, direct backlit conditions, and varied skin tones.

## 6. Accessibility & Motion Guidelines Compliance
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` by disabling dramatic 3D key float animations and using clean fade unlocks.
- **Keyboard Navigation**: Full tab navigation and numpad entry supported for all interactive controls.
- **Focus Rings**: High-contrast visible focus rings on all interactive buttons.
