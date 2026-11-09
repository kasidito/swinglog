# ผลตรวจกล้องและเดโม

ตรวจ 2026-11-09 ใน Linux Chromium 156.0.8078.79 ใช้ production PWA build, กล้องสังเคราะห์และตัวบันทึก MediaRecorder จริง ไม่ใช้ภาพหน้าจอแทนการตรวจไฟล์ที่อัด

## ผ่านแล้ว

- 66 unit tests (8 files), TypeScript, PWA build และ single-file build
- กล้อง source 1280×720: เลื่อนครอปซ้าย/กลาง/ขวา ตรวจสีพิกเซลในพรีวิวเทียบเฟรมไฟล์ที่ถอดรหัสจริง ได้ output 396×704; ตัวเลือกภาพเต็มยังเป็น 1280×720
- source แนวตั้ง 720×1280 ไม่ผ่าน canvas โดยไม่จำเป็น; เปลี่ยน viewport ระหว่างอัดยังรักษากรอบ ส่วน source dimensions เปลี่ยนจะหยุดและเก็บคลิปเดิม
- ปิดระหว่างอัดไม่ส่งคลิปค้างกลับมา, Escape คืน focus, ไม่รองรับ canvas/MediaRecorder ยังเลือกทางอื่นได้, timer 12 วินาทีหยุดครั้งเดียว (ใช้ test clock หลังอัดเฟรมจริง ไม่ใช่หลักฐาน frame timing)
- เดโม manual playback/scrub, ลูกตรง/โค้ง/หลุด, จุดหลุดไม่ขยายต่อ, ไม่เปลี่ยนเซสชันจริงที่มีบันทึกลูกอยู่ และไม่ส่งค่าสมมติเข้า JSON ของคลิปจริง
- 360/390/768px × สว่าง/มืด × อักษรปกติ/ใหญ่ × ขวา/ซ้าย รวม 24 รูปแบบ ไม่มี horizontal overflow; ไกด์แนวตั้ง/คำแนะนำนอกภาพ; ภาพ desktop 1440px เพิ่มเติม
- PWA offline reload เปิดเดโมและภาพ AI จาก cache ได้; regression วิเคราะห์เดิม 13 กลุ่มและคู่มือ 10 กลุ่มผ่าน ดู raw reports แนบ

## ยังไม่ตรวจ

- Safari/PWA บน **iPhone จริง**: ไม่ได้มีอุปกรณ์เชื่อมต่อในงานนี้ WebKit ของ Playwright ก็ยังไม่ติดตั้ง จึงไม่อ้างว่าผ่าน Safari จากการจำลอง viewport ใน Chromium
- ต้องตรวจ permission, native camera/file chooser, MP4 codec, canvas-to-recorder, การหมุนเครื่องจริง, background interruption, ความร้อน/แบตเตอรี่, พรีวิวเทียบคลิปที่อัด และ offline หลังเพิ่มลง Home Screen บน iPhone
- ความแม่นยำลูก/หัวไม้/Carry/Speed จากกอล์ฟจริงและ launch monitor ยังไม่ตรวจ; การทดสอบ pose regression ใช้ตัวอย่างคนเคลื่อนไหวที่ไม่ใช่กอล์ฟ ไม่แจกจ่ายคลิปนั้นใน repository

## ทำซ้ำ

ต้องมี Node/npm, Python + Playwright + Pillow, ffmpeg และ `/usr/bin/chromium` สคริปต์ไม่ติดตั้งส่วนเสริมหรือดาวน์โหลดวิดีโอกล้อง

```sh
npm test
npm run build
npm run build:single
python e2e/make_analysis_fixtures.py
python e2e/make_camera_fixtures.py
python -m http.server 5181 --directory dist
# ในอีก terminal:
python e2e/camera_demo.py --url http://localhost:5181/
python e2e/analysis_lab.py --url http://localhost:5181/
python e2e/coaching.py --url http://localhost:5181/
```

ใช้ profile ทดสอบใหม่เสมอ การตรวจ pose worker เพิ่มต้องส่ง `--pose-clip` ตามเอกสาร analysis-lab; report แนบระบุว่ารอบนี้เปิดการตรวจนั้นแล้ว ภาพแนบมาจาก production build ใช้แถบสีที่สร้างเองเป็นกล้อง และภาพ AI เดิมเป็นเดโม ไม่มีภาพวิดีโอผู้ใช้

## หลักฐานแนบ

- Raw reports: [กล้อง/เดโม](browser-results.json), [วิเคราะห์เดิม](analysis-regression.json), [คู่มือเดิม](coaching-regression.json)
- [กล้องแนวตั้งบนมือถือ](screenshots/portrait-landscape-source-390.png), [คำแนะนำ/มือซ้าย/อักษรใหญ่](screenshots/camera-dark-large-left-help-360.png), [กล้อง desktop](screenshots/portrait-camera-1440.png), [ภาพเต็ม](screenshots/full-camera-1440.png)
- [เดโมมือถือ](screenshots/demo-straight-light-390.png), [ติดตามหลุด](screenshots/demo-lost-light-390.png), [เดโม desktop](screenshots/demo-straight-light-1440.png), [ค่าคลิปจริงที่ยังวัดไม่ได้](screenshots/real-metrics-unavailable-390.png)
- [ผลตรวจหน้าตาโดย agent](finish-review.md) เป็นการตรวจซอฟต์แวร์ ไม่ใช่การรับรองจากโปรกอล์ฟหรือผู้ใช้จริง
