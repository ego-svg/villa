# AGENTS.md — Development Workflow & Architectural Rules

## 1. Project Overview & Role
You are developing **PRIVATE RESIDENCE**, a gesture-controlled luxury real estate web experience.
The signature interaction is a floating 3D numeric keypad controlled via webcam hand tracking (MediaPipe Hand Landmarker), allowing users to unlock an exclusive cinematic house presentation with a PIN code.

## 2. Core Workflow Discipline
Follow the strict lifecycle:
`SCOPE → ARCHITECTURE → DECISIONS → TEST PLAN → DEVELOP → AUDIT → VERIFY → TEST`

- **Do Not Skip Verification**: Every phase must be backed by concrete code inspection or compilation check.
- **Fact vs. Assumption**: State explicitly what has been inspected vs. assumed.
- **No Direct Camera Feed Display**: Hand landmarks are tracked silently. The video stream is processed in memory and never rendered to DOM.
- **Privacy First**: Zero video frame uploading or remote storage. All computer vision is executed strictly client-side.

## 3. Technology Stack & Compatibility Rules
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS v4 (`@import "tailwindcss";` in global CSS) with CSS custom variables for luxury architectural palette (obsidian, titanium, warm travertine, brass accents).
- **Typography**: Cormorant Garamond (Serif Display) + Plus Jakarta Sans (Sans Body) + Tabular numerals for security dots / PIN keypad.
- **3D Spatial Keypad**: Three.js / React Three Fiber + `@types/three` + `@mediapipe/tasks-vision`.
- **Motion & Transitions**: Framer Motion (`motion/react` v12) for smooth state transitions, modal overlays, and unlock reveals.
- **Icons**: Lucide React (`lucide-react`).

## 4. Non-Negotiable Interaction Rules
1. **Explicit Permission**: Request camera access ONLY after the user clicks "Activate Camera Access".
2. **Webcam Feed Hidden**: Video element remains off-screen / hidden (`display: none` or offscreen Canvas).
3. **Fingertip Cursor**: Screen-space target mapping tracks the index fingertip (`INDEX_FINGER_TIP` landmark 8).
4. **Pinch Selection**: Pinch gesture computed from Euclidean distance between thumb tip (`THUMB_TIP` landmark 4) and index fingertip (`INDEX_FINGER_TIP` landmark 8).
5. **Pinch State Hysteresis**:
   - `PINCH_THRESHOLD_START`: ~0.04 - 0.05 normalized distance triggers PINCH_DOWN.
   - `PINCH_THRESHOLD_RELEASE`: ~0.08 normalized distance triggers PINCH_UP.
   - Key selection occurs ONCE on PINCH_DOWN event. Re-selection requires a complete PINCH_UP release state.
6. **Deadzone & Spatial Filtering**:
   - Target selection uses screen-space bounding boxes or ray casting against the 3D keypad.
   - Exponential smoothing (EWA filter / damp) on cursor position to eliminate jitter.
   - Minimum selection dwell or confidence threshold to prevent accidental neighbor key triggers.
7. **Security Presentation**:
   - Entered digits are displayed strictly as masked security dots (e.g. `••••`).
   - Client-side PIN verification (default demo PIN: `2026` or configurable in UI). Clearly document client-side verification as simulation.
8. **Accessible Fallback**:
   - Provide full keyboard (Numpad / standard numbers / Backspace / Enter / Esc) and touch/mouse alternatives.
   - Visible camera error states with actionable retry / manual entry buttons.
9. **Resource Lifecycle**:
   - Immediately stop all MediaPipe animation loops and MediaStream video tracks (`track.stop()`) when exiting the entrance screen or unmounting.
10. **Cinematic Unlock**:
    - House video starts playing strictly after the successful verification unlock animation completes.
    - Provide reduced-motion toggle and video error fallbacks.

## 5. Visual Standards (Anti-Slop Discipline)
- Deep architectural tones: Obsidian (`#0B0C0E`), Dark Graphite (`#14161A`), Warm Travertine (`#E6E1DA`), Subtle Brass (`#D4AF37`).
- Zero pill metadata badges; zero mechanical prefixes (`// 01 ARCHITECTURE`); clean editorial titles.
- Restrained 3D: Elegantly floating metallic/matte digits with subtle metallic sheen, bloom, and soft contact grounding.
- 100% viewport presence without side-panel occlusion.
