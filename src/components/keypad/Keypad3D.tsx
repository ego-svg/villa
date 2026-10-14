/**
 * PRIVATE RESIDENCE — 3D Spatial Numeric Keypad (React Three Fiber)
 *
 * Implements:
 * 1. React Three Fiber 3D rendering with tactile brushed obsidian/titanium PBR materials.
 * 2. Aspect-aware ResponsiveCamera guaranteeing all 12 keys (including 0, CLR, DEL)
 *    are 100% visible, centered, and have generous breathing room on any screen size.
 * 3. Pixel-perfect direct touch targets computed directly from 3D camera projection,
 *    guaranteeing 100% reliable instant response on key '0' and all digits.
 * 4. Dual-mode input: Three.js raycasting + screen-space bounding boxes for hand tracking & touch.
 */

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { KeyScreenTarget } from '../../engine/gestures';
import { createKeyTexture } from './keyTexture';

export interface KeypadKeyDef {
  id: string;
  label: string;
  col: number; // 0, 1, 2
  row: number; // 0, 1, 2, 3
  posX: number;
  posY: number;
}

export const KEYPAD_KEYS: KeypadKeyDef[] = [
  { id: '1', label: '1', col: 0, row: 0, posX: -1.45, posY: 2.10 },
  { id: '2', label: '2', col: 1, row: 0, posX: 0, posY: 2.10 },
  { id: '3', label: '3', col: 2, row: 0, posX: 1.45, posY: 2.10 },
  { id: '4', label: '4', col: 0, row: 1, posX: -1.45, posY: 0.70 },
  { id: '5', label: '5', col: 1, row: 1, posX: 0, posY: 0.70 },
  { id: '6', label: '6', col: 2, row: 1, posX: 1.45, posY: 0.70 },
  { id: '7', label: '7', col: 0, row: 2, posX: -1.45, posY: -0.70 },
  { id: '8', label: '8', col: 1, row: 2, posX: 0, posY: -0.70 },
  { id: '9', label: '9', col: 2, row: 2, posX: 1.45, posY: -0.70 },
  { id: 'CLR', label: 'CLR', col: 0, row: 3, posX: -1.45, posY: -2.10 },
  { id: '0', label: '0', col: 1, row: 3, posX: 0, posY: -2.10 },
  { id: 'DEL', label: 'DEL', col: 2, row: 3, posX: 1.45, posY: -2.10 },
];

interface KeyMeshProps {
  keyDef: KeypadKeyDef;
  isTargeted: boolean;
  isPressed: boolean;
  onSelect: (keyId: string) => void;
  onHoverChange: (keyId: string, hovered: boolean) => void;
}

const KeyMesh: React.FC<KeyMeshProps> = ({
  keyDef,
  isTargeted,
  isPressed,
  onSelect,
  onHoverChange,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentZ = useRef(0);

  const texture = useMemo(() => {
    return createKeyTexture(keyDef.label, isTargeted, isPressed);
  }, [keyDef.label, isTargeted, isPressed]);

  // Materials: face has procedural texture, sides have brushed obsidian metallic finish
  const materials = useMemo(() => {
    const sideMat = new THREE.MeshStandardMaterial({
      color: isPressed ? '#4a3b1a' : isTargeted ? '#262c36' : '#12151a',
      roughness: 0.35,
      metalness: 0.7,
    });
    const faceMat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.25,
      metalness: 0.5,
    });
    // Multi-material order for BoxGeometry: [right, left, top, bottom, front, back]
    return [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat];
  }, [texture, isTargeted, isPressed]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Tactile depth displacement: hover slightly forward, press depressed
    const targetZ = isPressed ? -0.18 : isTargeted ? 0.14 : 0;
    currentZ.current = THREE.MathUtils.damp(currentZ.current, targetZ, 24, delta);
    meshRef.current.position.z = currentZ.current;
  });

  return (
    <mesh
      ref={meshRef}
      position={[keyDef.posX, keyDef.posY, 0]}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation();
        onHoverChange(keyDef.id, true);
      }}
      onPointerOut={() => {
        onHoverChange(keyDef.id, false);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(keyDef.id);
      }}
    >
      <boxGeometry args={[1.2, 1.2, 0.3]} />
      {materials.map((mat, i) => (
        <primitive key={i} object={mat} attach={`material-${i}`} />
      ))}
    </mesh>
  );
};

interface TargetCalculatorProps {
  onTargetsCalculated: (targets: KeyScreenTarget[]) => void;
}

const TargetCalculator: React.FC<TargetCalculatorProps> = ({ onTargetsCalculated }) => {
  const { camera, gl } = useThree();

  useEffect(() => {
    const calculateTargets = () => {
      const domEl = gl.domElement;
      if (!domEl) return;
      const rect = domEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const windowW = window.innerWidth;
      const windowH = window.innerHeight;

      const targets: KeyScreenTarget[] = KEYPAD_KEYS.map((k) => {
        // Project center position
        const centerVec = new THREE.Vector3(k.posX, k.posY, 0);
        centerVec.project(camera);

        // Convert NDC (-1..1) to Canvas pixel coordinates
        const canvasPixelX = ((centerVec.x + 1) / 2) * rect.width;
        const canvasPixelY = ((1 - centerVec.y) / 2) * rect.height;

        // Convert to Window pixel coordinates
        const windowPixelX = rect.left + canvasPixelX;
        const windowPixelY = rect.top + canvasPixelY;

        // Project key corner to calculate projected key dimensions
        const cornerVec = new THREE.Vector3(k.posX + 0.6, k.posY + 0.6, 0);
        cornerVec.project(camera);
        const cornerCanvasPixelX = ((cornerVec.x + 1) / 2) * rect.width;
        const cornerCanvasPixelY = ((1 - cornerVec.y) / 2) * rect.height;

        const halfWidthPixels = Math.abs(cornerCanvasPixelX - canvasPixelX);
        const halfHeightPixels = Math.abs(cornerCanvasPixelY - canvasPixelY);

        // Generous touch tolerance: extra large hit-box for Key '0' so it is effortless to touch
        const isZero = k.id === '0';
        const multW = isZero ? 1.55 : 1.30;
        const multH = isZero ? 1.55 : 1.30;
        const toleranceW = halfWidthPixels * multW;
        const toleranceH = halfHeightPixels * multH;

        // Convert to normalized Window coordinates (0..1) for hand cursor
        const left = Math.max(0, (windowPixelX - toleranceW) / windowW);
        const right = Math.min(1, (windowPixelX + toleranceW) / windowW);
        const top = Math.max(0, (windowPixelY - toleranceH) / windowH);
        const bottom = Math.min(1, (windowPixelY + toleranceH) / windowH);

        // Exact Canvas pixel bounds for absolute touch buttons
        const btnLeft = Math.max(0, canvasPixelX - toleranceW);
        const btnTop = Math.max(0, canvasPixelY - toleranceH);
        const btnWidth = toleranceW * 2;
        const btnHeight = toleranceH * 2;

        return {
          id: k.id,
          bounds: { left, top, right, bottom },
          canvasRect: {
            left: btnLeft,
            top: btnTop,
            width: btnWidth,
            height: btnHeight,
          },
        };
      });

      onTargetsCalculated(targets);
    };

    calculateTargets();
    window.addEventListener('resize', calculateTargets);
    window.addEventListener('scroll', calculateTargets);

    const timer = setTimeout(calculateTargets, 200);

    return () => {
      window.removeEventListener('resize', calculateTargets);
      window.removeEventListener('scroll', calculateTargets);
      clearTimeout(timer);
    };
  }, [camera, gl, onTargetsCalculated]);

  return null;
};

const ResponsiveCamera: React.FC = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    // Keypad bounding box: width 4.1, height 5.4.
    // Backplate: width 4.8, height 6.2.
    // We guarantee that all keys (including 0, CLR, DEL) are 100% visible and centered
    // with at least 20% margin above and below.
    const fovRad = (36 * Math.PI) / 180;
    const requiredH = 6.6;
    const requiredW = 5.0;
    const distForHeight = (requiredH / 2) / Math.tan(fovRad / 2);
    const distForWidth = (requiredW / 2) / (Math.tan(fovRad / 2) * aspect);
    const targetZ = Math.max(distForHeight, distForWidth) * 1.15;

    camera.position.z = Math.max(13.0, targetZ);
    camera.position.y = 0;
    camera.position.x = 0;
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
};

interface KeypadSceneProps {
  targetedKeyId: string | null;
  pressedKeyId: string | null;
  onSelectKey: (keyId: string) => void;
  onHoverKey: (keyId: string, hovered: boolean) => void;
  onRegisterTargets: (targets: KeyScreenTarget[]) => void;
}

const KeypadScene: React.FC<KeypadSceneProps> = ({
  targetedKeyId,
  pressedKeyId,
  onSelectKey,
  onHoverKey,
  onRegisterTargets,
}) => {
  return (
    <>
      <ambientLight intensity={0.65} color="#1e2430" />
      <directionalLight
        position={[4, 6, 8]}
        intensity={1.5}
        color="#fffaf0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-4, -3, 5]} intensity={0.7} color="#c8a86b" />

      {/* Subtle backplate / contact frame: perfectly framed with generous border */}
      <mesh position={[0, 0, -0.22]} receiveShadow>
        <planeGeometry args={[4.8, 6.2]} />
        <meshStandardMaterial color="#0c0e12" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Keypad Buttons */}
      <group position={[0, 0, 0]}>
        {KEYPAD_KEYS.map((k) => (
          <KeyMesh
            key={k.id}
            keyDef={k}
            isTargeted={targetedKeyId === k.id}
            isPressed={pressedKeyId === k.id}
            onSelect={onSelectKey}
            onHoverChange={onHoverKey}
          />
        ))}
      </group>

      <TargetCalculator onTargetsCalculated={onRegisterTargets} />
      <ResponsiveCamera />
    </>
  );
};

export interface Keypad3DProps {
  targetedKeyId: string | null;
  pressedKeyId: string | null;
  onSelectKey: (keyId: string) => void;
  onRegisterTargets: (targets: KeyScreenTarget[]) => void;
  disabled?: boolean;
}

export const Keypad3D: React.FC<Keypad3DProps> = ({
  targetedKeyId,
  pressedKeyId,
  onSelectKey,
  onRegisterTargets,
  disabled = false,
}) => {
  const [hoveredKeyId, setHoveredKeyId] = useState<string | null>(null);
  const [calculatedTargets, setCalculatedTargets] = useState<KeyScreenTarget[]>([]);
  const activeTargetId = targetedKeyId || hoveredKeyId;

  const handleTargetsCalculated = useCallback(
    (targets: KeyScreenTarget[]) => {
      setCalculatedTargets(targets);
      onRegisterTargets(targets);
    },
    [onRegisterTargets]
  );

  return (
    <div className="relative w-full h-full select-none flex items-center justify-center">
      {/* 3D WebGL Canvas with native raycasting */}
      <Canvas
        camera={{ position: [0, 0, 13.0], fov: 36 }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        style={{ touchAction: 'none' }}
        className="w-full h-full cursor-pointer"
      >
        <KeypadScene
          targetedKeyId={disabled ? null : activeTargetId}
          pressedKeyId={disabled ? null : pressedKeyId}
          onSelectKey={(id) => {
            if (!disabled) {
              onSelectKey(id);
            }
          }}
          onHoverKey={(id, hovered) => {
            if (!disabled) {
              setHoveredKeyId(hovered ? id : null);
            }
          }}
          onRegisterTargets={handleTargetsCalculated}
        />
      </Canvas>

      {/* Direct Pixel-Aligned Touch Buttons:
          Guarantees 100% reliable instant touch/click on mobile and desktop.
          Each button's pixel coordinates are derived directly from the 3D projected keys. */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {calculatedTargets.map((t) => {
          if (!t.canvasRect) return null;
          const isZero = t.id === '0';
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              style={{
                position: 'absolute',
                left: `${t.canvasRect.left}px`,
                top: `${t.canvasRect.top}px`,
                width: `${t.canvasRect.width}px`,
                height: `${t.canvasRect.height}px`,
                touchAction: 'manipulation',
                pointerEvents: 'auto',
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled) onSelectKey(t.id);
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!disabled) onSelectKey(t.id);
              }}
              onPointerEnter={() => {
                if (!disabled) setHoveredKeyId(t.id);
              }}
              onPointerLeave={() => {
                if (!disabled) setHoveredKeyId(null);
              }}
              className={`rounded-2xl cursor-pointer bg-transparent active:bg-amber-400/20 transition-colors focus:outline-none ${
                isZero ? 'hover:bg-amber-400/10' : ''
              }`}
              aria-label={`Key ${t.id}`}
            />
          );
        })}
      </div>
    </div>
  );
};
