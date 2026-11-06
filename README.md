# ฝึกกอล์ฟ (Golf Practice PWA) v1.0.0

PWA ฟรีที่จัดเซสชันฝึกกอล์ฟตามเวลาหรือจำนวนถาดลูกและอาการที่เจอ เก็บข้อมูลในเครื่องเท่านั้น

## คำสั่ง
- `npm install`
- `npm run dev` เปิดเครื่องมือพัฒนา
- `npm test` รัน unit test (session engine + เนื้อหาดริล)
- `npm run build` สร้าง PWA ใน `dist/` (มี service worker, ใช้ออฟไลน์ได้)
- `npm run build:single` สร้างไฟล์ HTML เดียวใน `dist-single/` สำหรับพรีวิว

## Deploy (ฟรี)
- Cloudflare Pages: build command `npm run build`, output `dist`
- GitHub Pages: อัปโหลดโฟลเดอร์ `dist`

## โครงสร้าง
- `src/engine.ts` กฎจัดเซสชัน แนะนำอาการ และสถิติ (pure functions)
- `src/store.ts` เก็บข้อมูลใน IndexedDB (idb-keyval) ถ้าเก็บไม่ได้จะทำงานในหน่วยความจำ
- `src/content/*.json` คลังดริลและอาการ
- `src/App.tsx` หน้าจอทั้งหมด
