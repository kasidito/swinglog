import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { MP_VERSION } from './pose';

let model: Promise<PoseLandmarker> | undefined;
self.addEventListener('message', async (event: MessageEvent<{ id: number; frame: ImageBitmap; wasm: string; model: string }>) => {
  const { id, frame } = event.data;
  try {
    if (!model) model = FilesetResolver.forVisionTasks(event.data.wasm).then(vision =>
      PoseLandmarker.createFromOptions(vision, { baseOptions: { modelAssetPath: event.data.model, delegate: 'CPU' }, runningMode: 'IMAGE', numPoses: 1 }));
    const result = (await model).detect(frame);
    self.postMessage({ id, version: MP_VERSION, landmarks: result.landmarks[0] ?? null });
  } catch (e) { model = undefined; self.postMessage({ id, detail: e instanceof Error ? e.message : String(e), error: 'วิเคราะห์ท่าไม่ได้ ตรวจว่าโหลดโมเดลแล้วและเบราว์เซอร์รองรับ worker หรือใช้เครื่องมือกำหนดจุดด้วยมือ' }); }
  finally { frame.close(); }
});
