# DECISIONS.md — Architecture & Technical Decision Record (ADR)

## ADR 01: MediaPipe Hand Landmarker via `@mediapipe/tasks-vision`
- **Status**: Locked
- **Context**: Need real-time, client-side 3D hand tracking without sending camera frames to any remote server or exposing raw webcam feeds in UI.
- **Decision**: Use `@mediapipe/tasks-vision` loaded asynchronously via CDN / local Wasm asset worker.
- **Rationale**: Provides 21 3D hand landmarks at 30–60 FPS completely in-browser with low memory footprint and high spatial accuracy for index fingertip and thumb tip landmarks.

## ADR 02: Screen-Space Target Mapping for 3D Keypad Selection
- **Status**: Locked
- **Context**: Selecting 3D spatial objects in WebGL using hand tracking can suffer from z-depth ambiguity.
- **Decision**: Map hand cursor coordinates in 2D viewport screen space ($[0,1] \times [0,1]$), projecting 3D keypad button positions to screen-space 2D bounding targets for hit detection.
- **Rationale**: Guarantees rock-solid, predictable target selection regardless of camera perspective or distance from screen.

## ADR 03: Dual-Threshold Hysteresis for Pinch Gesture Recognition
- **Status**: Locked
- **Context**: Continuous tracking can cause accidental rapid key re-triggers or "double presses" while holding a pinch gesture.
- **Decision**: Enforce hysteresis:
  - `PINCH_DOWN`: Thumb-Index Euclidean distance $< 0.045$.
  - `PINCH_UP`: Thumb-Index Euclidean distance $> 0.080$.
  - Registration occurs strictly on transition to `PINCH_DOWN`. Further inputs require a full `PINCH_UP` release state.
- **Rationale**: Eliminates false double-clicks and ensures deliberate key entry.

## ADR 04: Zero-Camera-Display Privacy & Silent Stream Processing
- **Status**: Locked
- **Context**: Luxury architectural real estate users expect privacy and an uncluttered visual aesthetic. Showing a raw webcam feed distracts from the architectural ambiance.
- **Decision**: Process camera frames silently in an off-screen HTML5 `<video>` element. Render only an elegant, minimal glowing fingertip cursor over the 3D keypad canvas.
- **Rationale**: Upholds luxury presentation standards while maintaining privacy.

## ADR 05: Client-Side Passcode Verification Simulation
- **Status**: Locked
- **Context**: The app is a portfolio showcase and luxury property presentation.
- **Decision**: Verify entered PIN client-side against default PIN `2026`. Display explicit documentation noting client-side verification.
- **Rationale**: Allows instant, standalone demo unlock without requiring remote database infrastructure.

## ADR 06: Hybrid Three.js WebGL + HTML5 Video Rendering Strategy
- **Status**: Locked
- **Context**: Need 3D spatial keypad for security entrance and seamless transition into full-screen house film.
- **Decision**: Render 3D Keypad in canvas overlay during ENTRANCE state. Upon verification, trigger CSS/Framer Motion curtain fade and start native HTML5 video player.
- **Rationale**: Combines 3D interactive fidelity with optimal 4K video playback performance and hardware video decoding.

## ADR 07: Fallback Input Modalities (Keyboard & Touch/Mouse)
- **Status**: Locked
- **Context**: Users without webcams, in low-light environments, or with camera permission restrictions must still be able to access the property.
- **Decision**: Provide direct physical keyboard listening (Numpad, numbers, Backspace) and touch/click targets on the 3D keypad.
- **Rationale**: Ensures WCAG AA accessibility compliance and universal user access.
