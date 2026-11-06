# SwingLog v1.0.0

PWA ฟรีที่จัดเซสชันฝึกกอล์ฟตามเวลาหรือจำนวนถาดลูกและอาการที่เจอ เก็บข้อมูลในเครื่องเท่านั้น

## คำสั่ง
- `npm install`
- `npm run dev` เปิดเครื่องมือพัฒนา
- `npm test` รัน unit test (session engine + เนื้อหาดริล)
- `npm run build` สร้าง PWA ใน `dist/` (มี service worker, ใช้ออฟไลน์ได้)
- `npm run build:single` สร้างไฟล์ HTML เดียวใน `dist-single/` สำหรับพรีวิว

## Deploy (ฟรี)
- ทุก push เข้า `main` จะรัน test, build และ deploy ขึ้น GitHub Pages อัตโนมัติ (`.github/workflows/deploy.yml`)
- branch อื่นและ pull request รัน test + build (`.github/workflows/ci.yml`)
- แอป: https://kasidito.github.io/swinglog/

## โครงสร้าง
- `src/engine.ts` กฎจัดเซสชัน แนะนำอาการ และสถิติ (pure functions)
- `src/store.ts` เก็บข้อมูลใน IndexedDB (idb-keyval) ถ้าเก็บไม่ได้จะทำงานในหน่วยความจำ
- `src/content/*.json` คลังดริลและอาการ
- `src/App.tsx` หน้าจอทั้งหมด
