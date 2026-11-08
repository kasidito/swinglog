import { seekTarget } from './analysis';
import PoseWorker from './pose.worker?worker&inline';
import { MODEL_URL, WASM_URL, type Landmarks } from './pose';

export function abortError() { return new DOMException('ยกเลิก', 'AbortError'); }
export function ensureActive(signal: AbortSignal) { if (signal.aborted) throw abortError(); }
function waitEvent(video: HTMLVideoElement, name: string, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); video.removeEventListener(name, ready); video.removeEventListener('error', error); signal.removeEventListener('abort', aborted); };
    const ready = () => { cleanup(); resolve(); };
    const error = () => { cleanup(); reject(new Error('อ่านวิดีโอไม่ได้ ลองส่งออกเป็น MP4 หรือเลือกคลิปอื่น')); };
    const aborted = () => { cleanup(); reject(abortError()); };
    const timer = window.setTimeout(error, 10000);
    video.addEventListener(name, ready, { once: true }); video.addEventListener('error', error, { once: true }); signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) aborted();
  });
}
/** Own decoder element: processing never seeks or plays the visible preview.
 * Seeked timestamps are approximate, deliberately not called exact source frames. */
export async function sampleVideo(url: string, times: number[], signal: AbortSignal,
  visit: (frame: HTMLCanvasElement, time: number, index: number) => Promise<void | boolean>, maxWidth = 640) {
  const decoder = document.createElement('video'); decoder.muted = true; decoder.playsInline = true; decoder.preload = 'auto';
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('เบราว์เซอร์นี้อ่านภาพวิดีโอไม่ได้');
  try {
    ensureActive(signal);
    const loaded = waitEvent(decoder, 'loadeddata', signal); decoder.src = url; decoder.load(); await loaded;
    if (!Number.isFinite(decoder.duration) || decoder.duration <= 0) throw new Error('ไม่พบความยาวคลิปที่ใช้วิเคราะห์ได้ ลองเลือกไฟล์อื่น');
    const scale = Math.min(1, maxWidth / Math.max(decoder.videoWidth, decoder.videoHeight));
    canvas.width = Math.max(2, Math.round(decoder.videoWidth * scale)); canvas.height = Math.max(2, Math.round(decoder.videoHeight * scale));
    for (let i = 0; i < times.length; i++) {
      ensureActive(signal);
      const t = seekTarget(times[i], decoder.duration);
      if (Math.abs(decoder.currentTime - t) > 0.0001) {
        const seeked = waitEvent(decoder, 'seeked', signal); decoder.currentTime = t; await seeked;
      }
      // Let the browser publish the sought image before canvas reads. A paused
      // decoder can emit seeked before the render turn has updated its surface.
      await new Promise<void>(resolve => {
        let raf = 0;
        const timer = window.setTimeout(() => { cancelAnimationFrame(raf); resolve(); }, 50);
        raf = requestAnimationFrame(() => { clearTimeout(timer); resolve(); });
      });
      ensureActive(signal); ctx.drawImage(decoder, 0, 0, canvas.width, canvas.height);
      if (await visit(canvas, decoder.currentTime, i) === false) break;
      // Give cancellation and progress rendering a turn, even on fast local files.
      await new Promise(resolve => window.setTimeout(resolve, 0));
    }
  } finally { decoder.pause(); decoder.removeAttribute('src'); decoder.load(); canvas.width = 0; canvas.height = 0; }
}
export function grayscale(canvas: HTMLCanvasElement): Uint8Array {
  const data = canvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, canvas.width, canvas.height).data;
  const gray = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < gray.length; i++) gray[i] = Math.round(data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
  return gray;
}
export function createPoseWorker(signal: AbortSignal) {
  if (typeof Worker === 'undefined' || typeof createImageBitmap === 'undefined') throw new Error('เบราว์เซอร์นี้ไม่รองรับการวิเคราะห์ใน worker ใช้การกำหนดจุดหรือวาดเส้นด้วยมือได้');
  const worker = import.meta.env.DEV
    ? new Worker(`${import.meta.env.BASE_URL}__swinglog_pose_worker.js`)
    : new PoseWorker();
  const stop = () => worker.terminate(); signal.addEventListener('abort', stop, { once: true });
  let nextId = 0;
  let checkedController = false;
  return {
    async detect(canvas: HTMLCanvasElement): Promise<Landmarks | null> {
      ensureActive(signal);
      if (!checkedController && !import.meta.env.DEV && 'serviceWorker' in navigator) {
        checkedController = true;
        const reg = await navigator.serviceWorker.getRegistration().catch(() => undefined);
        if (reg && !navigator.serviceWorker.controller) await new Promise<void>(resolve => {
          const done = () => { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', done); resolve(); };
          const timer = window.setTimeout(done, 3000);
          navigator.serviceWorker.addEventListener('controllerchange', done, { once: true });
        });
      }
      ensureActive(signal); const frame = await createImageBitmap(canvas);
      if (signal.aborted) { frame.close(); throw abortError(); }
      return new Promise((resolve, reject) => {
        const id = ++nextId;
        const cleanup = () => { clearTimeout(timer); worker.removeEventListener('message', message); worker.removeEventListener('error', error); signal.removeEventListener('abort', aborted); };
        const aborted = () => { cleanup(); reject(abortError()); };
        const error = () => { cleanup(); reject(new Error('โหลดตัววิเคราะห์ใน worker ไม่สำเร็จ ตรวจอินเทอร์เน็ตครั้งแรก หรือใช้เครื่องมือด้วยมือ')); };
        const message = (e: MessageEvent) => {
          if (e.data.id !== id) return;
          if (e.data.error && import.meta.env.DEV) console.warn('Pose worker:', e.data.detail);
          cleanup(); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.landmarks);
        };
        const timer = window.setTimeout(error, 45000);
        worker.addEventListener('message', message); worker.addEventListener('error', error, { once: true }); signal.addEventListener('abort', aborted, { once: true });
        worker.postMessage({ id, frame, wasm: WASM_URL, model: MODEL_URL }, [frame]);
      });
    },
    close() { signal.removeEventListener('abort', stop); worker.terminate(); },
  };
}
