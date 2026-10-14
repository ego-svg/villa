# SCOPE.md — Product Scope & Specifications

## 1. Product Objective
Build a cinematic, gesture-controlled web experience for **PRIVATE RESIDENCE**, an ultra-luxury real estate portfolio. The entrance experience features a floating 3D numeric keypad controlled by real-time webcam hand tracking. Entering the correct demo security passcode reveals a full-screen architectural film and unlocks a scroll-driven property presentation.

## 2. V1 Requirements

### 2.1 Entrance & Camera Permissions
- **Entrance Screen**: Dark architectural welcome screen with title, project introduction, and explicit "Activate Gesture Control" button.
- **Explicit Permission Flow**: No camera request occurs before clicking the activation button.
- **Hidden Video Stream**: Video processing runs in memory via HTML5 `<video>` or offscreen canvas. The raw camera feed is never displayed in the UI.
- **Camera Lifecycle & Cleanup**: Stops all MediaStream video tracks and MediaPipe animation loops when unmounted or when exiting the entrance screen.
- **Error & Fallback Handling**:
  - Detects denied permissions, missing webcams, or model load failures.
  - Displays graceful camera error modal with option to switch to "Keyboard / Touch Input Mode".

### 2.2 Gesture Engine & Spatial Keypad
- **Hand Tracking**: MediaPipe Hand Landmarker tracks hand landmarks in real time.
- **Fingertip Cursor**: Screen-space mapped cursor controlled by index fingertip landmark (Landmark 8).
- **Smooth Cursor Movement**: Exponential moving average (EMA) filter smoothing out hand jitter.
- **Pinch Detection**:
  - Distance threshold between thumb tip (Landmark 4) and index fingertip (Landmark 8).
  - Hysteresis logic (`PINCH_DOWN` < 0.045 normalized, `PINCH_UP` > 0.08 normalized).
  - Prevents continuous repeated triggers while holding a pinch.
- **Spatial 3D Keypad**:
  - Three.js / R3F rendered 3D numeric grid (0–9, Backspace, Clear).
  - Floating 3D extruded digits with brushed metal / dark obsidian PBR materials.
  - Hover highlight effect when cursor targets a key.
  - Active press depression animation when pinch is registered.
  - Deadzone between digits to prevent ambiguous double key triggers.

### 2.3 Demo Password & Verification
- **Input Display**: Security dots (e.g. `••••`) representing entered digits.
- **Demo PIN Verification**: Pre-configured demo PIN (`2026`, with alternative demo PIN `1234` or custom input support).
- **Feedback**:
  - Soft haptic/visual pulse on key selection.
  - Shake / subtle error animation on incorrect PIN entry + Clear button reset.
  - Unlock transition sequence on successful PIN entry.
- **Security Notice**: Explicit documentation noting that client-side PIN verification is for demo/portfolio purposes.

### 2.4 Cinematic Property Presentation
- **Unlock Sequence**: Keypad fades out smoothly as dark architectural curtain parts.
- **Cinematic House Film**: Full-screen HTML5 video plays automatically after unlock transition.
- **Scroll Presentation Sections**:
  1. **Hero & Architecture Overview**: High-level specs (Square footage, Bedrooms, Bathrooms, Location, Architect).
  2. **Architectural Story**: Design philosophy, material palettes (raw concrete, bronze, floor-to-ceiling glass).
  3. **Interiors Gallery**: Interactive image gallery with spatial lightbox.
  4. **Property Details & Floor Plan**: Interactive spec breakdown and room matrix.
  5. **Inquiry & Private Tour Booking**: Editorial contact form for prospective buyers / brokers.

## 3. Exclusions (Out of Scope for V1)
- Backend server authentication (OAuth / JWT / DB verification). Verification remains client-side.
- Remote camera frame streaming or cloud video processing.
- Multi-hand tracking simultaneously (V1 uses primary single hand).
- Complex 3D house walkthrough / WebGL interior engine (V1 uses high-definition cinematic HTML5 video and high-fidelity photography).

## 4. Acceptance Criteria
1. Camera is requested **only** after clicking "Activate Gesture Control".
2. Keypad renders in 3D without showing raw webcam video stream.
3. Index fingertip position moves cursor smoothly without jitter; hover state highlights target digit.
4. Pinching selects target digit exactly once per pinch release cycle.
5. Entering correct PIN (`2026`) triggers unlock animation and launches the cinematic video.
6. Incorrect PIN displays subtle error state without crashing or revealing property content.
7. Manual keyboard/touch input works flawlessly as a fallback mode.
8. Unmounting or leaving entrance stops camera stream immediately (no active green recording light left running).
