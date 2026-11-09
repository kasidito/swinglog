import { describe, expect, it } from 'vitest';
import { cameraInfo, captureGeometry, importedCapture } from './capture';

describe('preview and encoded capture geometry', () => {
  it('uses an exact even 9:16 output without stretching or upscaling a landscape crop', () => {
    const g = captureGeometry(1280, 720, 'portrait')!;
    expect(g.crop).toEqual({ x: 437.5, y: 0, width: 405, height: 720 });
    expect(g.width / g.height).toBe(9 / 16);
    expect(g.width % 2).toBe(0); expect(g.height % 2).toBe(0);
    expect(g.width / g.crop.width).toBeCloseTo(g.height / g.crop.height);
    expect(g.width).toBeLessThanOrEqual(g.crop.width);
    expect(g.needsCanvas).toBe(true);
  });
  it('maps both pan extremes to the actual source edges and clamps out-of-range input', () => {
    expect(captureGeometry(1280,720,'portrait',-2)!.crop.x).toBe(0);
    const right=captureGeometry(1280,720,'portrait',2)!;
    expect(right.crop.x+right.crop.width).toBe(1280);
    expect(captureGeometry(1080,2400,'portrait',0)!.crop.y).toBe(0);
    const bottom=captureGeometry(1080,2400,'portrait',1)!;
    expect(bottom.crop.y+bottom.crop.height).toBe(2400);
  });
  it('leaves matching portrait sources and full-camera mode unchanged', () => {
    const portrait=captureGeometry(720,1280,'portrait')!;
    expect(portrait.needsCanvas).toBe(false); expect(portrait.width).toBe(720); expect(portrait.height).toBe(1280);
    const full=captureGeometry(1280,720,'native')!;
    expect(full.crop).toEqual({x:0,y:0,width:1280,height:720}); expect(full.needsCanvas).toBe(false);
  });
  it('rejects unreadable source sizes and nonfinite positions', () => {
    expect(captureGeometry(0,720,'portrait')).toBe(null);
    expect(captureGeometry(1280,NaN,'portrait')).toBe(null);
    expect(captureGeometry(1280,720,'portrait',NaN)).toBe(null);
  });
  it('separates reported source FPS from requested canvas FPS and verified timing', () => {
    const info=cameraInfo(captureGeometry(1280,720,'portrait')!,'portrait',60);
    expect(info.reportedFrameRate).toBe(60); expect(info.requestedRecordingFrameRate).toBe(30);
    expect(info.timing).toBe('encoded-media-approximate');
    expect(importedCapture(640,360).reportedFrameRate).toBe(null);
  });
});
