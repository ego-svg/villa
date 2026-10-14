# ARCHITECTURE.md — System Architecture & Component Design

## 1. High-Level Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          App Container                                 │
│  State: [experienceState: 'ENTRANCE' | 'KEYPAD_ACTIVE' | 'UNLOCKED']    │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
    ┌───────────────┴───────────────┐        ┌───────┴───────────────────┐
    │     Entrance & Keypad Shell   │        │   Unlocked Experience     │
    │  - Camera Permissions Flow    │        │  - Hero Video Stream      │
    │  - MediaPipe Vision Pipeline  │        │  - Architectural Story    │
    │  - Gesture Mapping Engine     │        │  - Photo Gallery Grid     │
    │  - Three.js 3D Keypad Canvas  │        │  - Property Specs Matrix  │
    │  - Security Dots & Demo PIN   │        │  - Private Tour Inquiry   │
    └───────────────────────────────┘        └───────────────────────────┘
```

## 2. Independent Engine & Module Boundaries

### 2.1 Camera & MediaPipe Lifecycle Manager (`src/engine/camera.ts`)
- Manages `navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })`.
- Initializes `@mediapipe/tasks-vision` (`HandLandmarker`).
- Runs hidden RAF loop feeding frames to `HandLandmarker.detectForVideo()`.
- Exposes clean subscription interface `onHandUpdate(landmarks => void)`.
- Enforces strict teardown method `stopCamera()` that stops all video tracks and cancels RAF loops.

### 2.2 Gesture & Coordinate Processor (`src/engine/gestures.ts`)
- Decoupled from 3D visual renderer and UI elements.
- **Inputs**: Hand landmarks array (21 3D coordinates).
- **Coordinate Transformation**:
  - Mirrored X-axis for intuitive webcam control.
  - Exponential moving average (EMA) smoothing for position $(x, y)$:
    $$P_{\text{smooth}}(t) = \alpha \cdot P_{\text{raw}}(t) + (1 - \alpha) \cdot P_{\text{smooth}}(t - 1)$$
- **Pinch State Machine**:
  - Calculates Euclidean distance between Landmark 4 (`THUMB_TIP`) and Landmark 8 (`INDEX_FINGER_TIP`).
  - Distance $< 0.045 \implies \text{PINCH\_DOWN}$.
  - Distance $> 0.080 \implies \text{PINCH\_UP}$.
  - Triggers `onPinchStart`, `onPinchEnd`, and emits normalized cursor coordinates $(x, y) \in [0, 1]^2$.

### 2.3 Spatial Keypad 3D Engine (`src/components/keypad/Keypad3D.tsx`)
- Three.js / React Three Fiber canvas.
- Renders 12 3D keypad buttons (`0`-`9`, `DEL`, `CLR`).
- Custom extruded geometries with physical metallic/obsidian materials (`MeshPhysicalMaterial`).
- Studio environment lighting (`RoomEnvironment` + `RectAreaLight`).
- **Screen-Space Target Mapping**:
  - Keypad positions mapped to screen-space 2D bounding boxes.
  - Highlight state triggered when cursor coordinates $(x, y)$ lie inside bounding target.
  - Depth displacement animation when a key is pressed.

### 2.4 Security & Passcode Verifier (`src/engine/auth.ts`)
- Handles PIN entry state (`currentPin: string`).
- Masked security dots component.
- Demo verification logic (comparing with default PIN `2026`).
- Triggers success unlock callback or error shake feedback.

### 2.5 Presentation & Film Controller (`src/components/property/`)
- Native HTML5 video player with seamless loop, mute toggle, and custom playback controls.
- Smooth transition orchestrator using Framer Motion (`motion/react`).
- Responsive, editorial presentation layout following the **Frontend Design Constitution**.

## 3. Data & State Flow

```
Webcam Frame
    │
    ▼
[Camera Pipeline] ──(Video Frame)──► [MediaPipe HandLandmarker]
                                                │
                                        (21 Hand Landmarks)
                                                │
                                                ▼
                                    [Gesture Engine]
                                    - EMA Smoothing
                                    - Pinch Hysteresis
                                                │
                                     (Cursor X,Y & Pinch Event)
                                                │
                                                ▼
                                    [Spatial Target Mapper]
                                    - Key Raycast / Bounding Hit
                                                │
                                   ┌────────────┴────────────┐
                                   ▼                         ▼
                            [3D Keypad Mesh]        [Passcode State]
                            (Hover/Press FX)        (Append/Verify)
                                                             │
                                                     (Verified Success)
                                                             │
                                                             ▼
                                                    [Cinematic Unlock]
```

## 4. Key Dependencies & Compatibility Matrix

| Package | Purpose | Compatibility Status |
| :--- | :--- | :--- |
| `react` / `react-dom` (^19.0.1) | App runtime & UI | Confirmed |
| `three` / `@types/three` | 3D Scene & PBR Materials | Native compatible |
| `@mediapipe/tasks-vision` | Hand Landmark tracking | WebAssembly / WebGL |
| `motion` (^12.23.24) | Cinematic UI motion | Native React 19 support |
| `lucide-react` (^0.546.0) | Minimal architectural UI icons | Confirmed |
| `tailwindcss` (^4.3.3) | Styling system | CSS Variable integrated |
