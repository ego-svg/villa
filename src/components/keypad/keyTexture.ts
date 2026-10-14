/**
 * Procedural texture generator for luxury 3D keycaps.
 * Zero external image dependencies (avoids 404s and network latency).
 */

import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

export function createKeyTexture(label: string, isHighlighted: boolean, isPressed: boolean): THREE.CanvasTexture {
  const cacheKey = `${label}_${isHighlighted ? 'h' : 'n'}_${isPressed ? 'p' : 'n'}`;
  const existing = textureCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Background gradient: deep obsidian with subtle graphite reflection
    const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
    if (isPressed) {
      bgGrad.addColorStop(0, '#1c1712');
      bgGrad.addColorStop(1, '#0e0c0a');
    } else if (isHighlighted) {
      bgGrad.addColorStop(0, '#222830');
      bgGrad.addColorStop(0.7, '#16191f');
      bgGrad.addColorStop(1, '#0d0f13');
    } else {
      bgGrad.addColorStop(0, '#181b20');
      bgGrad.addColorStop(0.7, '#121417');
      bgGrad.addColorStop(1, '#090a0c');
    }

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Subtle brushed metallic bevel ring
    ctx.lineWidth = isHighlighted ? 6 : 4;
    ctx.strokeStyle = isPressed
      ? 'rgba(212, 175, 55, 0.9)'
      : isHighlighted
      ? 'rgba(200, 168, 107, 0.7)'
      : 'rgba(255, 255, 255, 0.08)';
    ctx.strokeRect(8, 8, size - 16, size - 16);

    // Top-left subtle specular highlight line
    ctx.lineWidth = 2;
    ctx.strokeStyle = isHighlighted ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(12, size - 16);
    ctx.lineTo(12, 12);
    ctx.lineTo(size - 16, 12);
    ctx.stroke();

    // Key text rendering
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isAction = label === 'DEL' || label === 'CLR';
    if (isAction) {
      ctx.font = '700 38px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
      ctx.fillStyle = isHighlighted ? '#fde68a' : '#cbd5e1';
      ctx.shadowColor = isHighlighted ? 'rgba(245, 158, 11, 0.7)' : 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
    } else {
      // High-contrast luxury numerals
      ctx.font = '600 102px "Cormorant Garamond", Georgia, serif';
      ctx.fillStyle = isPressed
        ? '#fef08a'
        : isHighlighted
        ? '#ffffff'
        : '#f8fafc';
      ctx.shadowColor = isHighlighted ? 'rgba(245, 158, 11, 0.8)' : 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 10;
    }

    ctx.fillText(label, size / 2, size / 2 + (isAction ? 2 : 4));
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function clearTextureCache(): void {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}
