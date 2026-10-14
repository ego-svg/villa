import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CameraVisionManager } from '../camera';

describe('Camera & Vision Manager (camera.ts)', () => {
  let mockStopTrack: ReturnType<typeof vi.fn>;
  let mockStream: MediaStream;

  beforeEach(() => {
    mockStopTrack = vi.fn();
    mockStream = {
      getTracks: () => [
        { stop: mockStopTrack } as unknown as MediaStreamTrack,
        { stop: mockStopTrack } as unknown as MediaStreamTrack,
      ],
    } as unknown as MediaStream;

    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(123));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts in IDLE status and does NOT request getUserMedia on instantiation', () => {
    const manager = new CameraVisionManager();
    expect(manager.getStatus()).toBe('IDLE');
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
  });

  it('handles permission denied error cleanly and updates status to ERROR', async () => {
    const errorCallback = vi.fn();
    const statusCallback = vi.fn();

    const notAllowedError = new DOMException('Permission denied by user', 'NotAllowedError');
    (navigator.mediaDevices.getUserMedia as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(notAllowedError);

    const manager = new CameraVisionManager({
      onError: errorCallback,
      onStatusChange: statusCallback,
    });

    const success = await manager.start();
    expect(success).toBe(false);
    expect(manager.getStatus()).toBe('ERROR');
    expect(errorCallback).toHaveBeenCalledWith(
      expect.stringContaining('Camera permission was denied')
    );
  });

  it('stops all media tracks and cancels RAF loops when stop() is called', () => {
    const manager = new CameraVisionManager();
    // Simulate active stream
    // @ts-expect-error accessing private property for test verification
    manager.mediaStream = mockStream;
    // @ts-expect-error accessing private property for test verification
    manager.rafId = 456;

    manager.stop();

    expect(mockStopTrack).toHaveBeenCalledTimes(2);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(456);
    expect(manager.getStatus()).toBe('STOPPED');
  });
});
