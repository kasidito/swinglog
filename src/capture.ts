export type CaptureMode = 'portrait' | 'native';
export interface Crop { x: number; y: number; width: number; height: number }
export interface CaptureGeometry { sourceWidth: number; sourceHeight: number; width: number; height: number; crop: Crop; needsCanvas: boolean }
export interface CaptureInfo {
  source: 'camera' | 'import'; mode: CaptureMode;
  sourceWidth: number; sourceHeight: number; outputWidth: number; outputHeight: number;
  crop: Crop; reportedFrameRate: number | null;
  recording: 'native-stream' | 'canvas-stream' | 'import';
  requestedRecordingFrameRate: number | null;
  timing: 'encoded-media-approximate';
  stopReason?: 'user' | 'limit' | 'source-changed' | 'background' | 'camera-ended';
}

/** Crop coordinates are in the unmirrored source. Output stays exactly 9:16,
 * even-sized for encoders, and never upscales or stretches source pixels. */
export function captureGeometry(width: number, height: number, mode: CaptureMode, pan = 0.5): CaptureGeometry | null {
  if (![width, height, pan].every(Number.isFinite) || width < 2 || height < 2) return null;
  if (mode === 'native') return { sourceWidth: width, sourceHeight: height, width, height, crop: { x: 0, y: 0, width, height }, needsCanvas: false };
  const ratio = 9 / 16, cropWidth = Math.min(width, height * ratio), cropHeight = cropWidth / ratio;
  const units = Math.floor(Math.min(cropWidth / 9, cropHeight / 16) / 2) * 2;
  if (units < 2) return null;
  const crop = { x: (width - cropWidth) * Math.max(0, Math.min(1, pan)), y: (height - cropHeight) * Math.max(0, Math.min(1, pan)), width: cropWidth, height: cropHeight };
  return { sourceWidth: width, sourceHeight: height, width: units * 9, height: units * 16, crop,
    needsCanvas: Math.abs(cropWidth - width) > 0.01 || Math.abs(cropHeight - height) > 0.01 || units * 9 !== width || units * 16 !== height };
}
export function importedCapture(width: number, height: number): CaptureInfo {
  return { source: 'import', mode: 'native', sourceWidth: width, sourceHeight: height, outputWidth: width, outputHeight: height,
    crop: { x: 0, y: 0, width, height }, reportedFrameRate: null, requestedRecordingFrameRate: null, recording: 'import', timing: 'encoded-media-approximate' };
}
export function cameraInfo(g: CaptureGeometry, mode: CaptureMode, rate?: number): CaptureInfo {
  return { source: 'camera', mode, sourceWidth: g.sourceWidth, sourceHeight: g.sourceHeight, outputWidth: g.width, outputHeight: g.height,
    crop: g.crop, reportedFrameRate: rate && Number.isFinite(rate) && rate > 0 ? rate : null,
    recording: g.needsCanvas ? 'canvas-stream' : 'native-stream', requestedRecordingFrameRate: g.needsCanvas ? 30 : null, timing: 'encoded-media-approximate' };
}
export function pickRecordingMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  return ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find(type => MediaRecorder.isTypeSupported?.(type)) ?? '';
}

/** One canvas supplies the encoded crop, using the same cover/pan geometry as
 * the preview. Never draw guides/labels into the recording. */
export function croppedStream(video: HTMLVideoElement, g: CaptureGeometry, onSourceChange: () => void) {
  const canvas = document.createElement('canvas'); canvas.width = g.width; canvas.height = g.height;
  if (typeof canvas.captureStream !== 'function') throw new Error('เครื่องนี้บันทึกตามกรอบแนวตั้งไม่ได้ เลือกภาพเต็มหรือใช้กล้องเครื่อง');
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('เตรียมภาพแนวตั้งไม่ได้ ใช้กล้องเครื่องหรือนำเข้าคลิปแทน');
  let active = true, frame = 0, raf = 0;
  const v = video as HTMLVideoElement & { requestVideoFrameCallback?: (f: () => void) => number; cancelVideoFrameCallback?: (id: number) => void };
  const draw = () => {
    if (!active) return;
    if (video.videoWidth !== g.sourceWidth || video.videoHeight !== g.sourceHeight) { onSourceChange(); return; }
    ctx.drawImage(video, g.crop.x, g.crop.y, g.crop.width, g.crop.height, 0, 0, g.width, g.height);
    if (v.requestVideoFrameCallback) frame = v.requestVideoFrameCallback(draw); else raf = requestAnimationFrame(draw);
  };
  draw();
  let stream: MediaStream;
  try { stream = canvas.captureStream(30); } catch (e) { active = false; v.cancelVideoFrameCallback?.(frame); cancelAnimationFrame(raf); throw e; }
  if (!stream.getVideoTracks().length) { active = false; v.cancelVideoFrameCallback?.(frame); cancelAnimationFrame(raf); throw new Error('เครื่องนี้ไม่ส่งภาพจากกรอบไปยังตัวบันทึก ใช้ภาพเต็มหรือกล้องเครื่องแทน'); }
  return { stream, close: () => { active = false; v.cancelVideoFrameCallback?.(frame); cancelAnimationFrame(raf); stream.getTracks().forEach(t => t.stop()); } };
}
