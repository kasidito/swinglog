# ผลตรวจภาพคนช่วยจัดเฟรม

2026-11-09 — production build, Chromium บน Linux, กล้องแถบสีสังเคราะห์ ไม่มี iPhone จริง

- 67 unit tests (9 files), TypeScript และทั้ง PWA/single-file builds ผ่าน
- Human-guide acceptance ผ่าน 6 กลุ่ม: ภาพสองมุม/ความชัด/ซ่อน, สัดส่วน portrait ใน native landscape, ถอดรหัสวิดีโอจริงไม่พบภาพคน, ทั้งสองมุมใน 24 ชุดขนาด/ธีม/ตัวอักษร/มือ, offline reload, ภาพหายแล้วยังอัดได้
- Camera/demo regression เดิมผ่าน 13 กลุ่ม รวมการเลื่อนครอปเทียบสีพรีวิวกับไฟล์ อัดแนวตั้ง/ภาพเต็ม เปลี่ยนขนาด source/viewport ยกเลิก อัดครบเวลา fallback และเดโมไม่ปนผลจริง
- ขนาดหลัก 360/390/768px มีภาพ desktop 1440px เพิ่มเติม ปุ่ม ความชัด และ crop อยู่คนละแถวกับพรีวิว ส่วนคำแนะนำเปิดแล้วไม่ทับภาพ
- ทดสอบ pixel ขณะ **เปิด** ภาพคน: พรีวิวเห็นสีคนซ้อนกล้อง แต่ไฟล์ที่ถอดรหัสยังมีเพียงสีจากกล้อง ณ จุดเดียวกัน ภาพไม่ถูกนำเข้า canvas encoder หรือโมเดลวิเคราะห์
- แก้ race ในสคริปต์ที่อ่านขนาดทันทีหลังเปิด help โดยรอ ResizeObserver จัดเฟรมเสร็จก่อนวัด จุดกำกับคงตำแหน่งเดียวกันเมื่อโหลด/ซ่อนภาพ ป้าย REC อยู่ใต้ภาพคน ไม่ทับป้าย AI

Raw reports: [human-guide](browser-results.json), [camera/demo regression](camera-regression.json)

ภาพหลัก: [ด้านหลัง](screenshots/dtl-390.png), [ด้านหน้า](screenshots/faceon-390.png), [มือซ้าย/อักษรใหญ่](screenshots/dtl-dark-large-left-360.png), [เปิดคำแนะนำ](screenshots/help-dark-large-left-360.png), [ภาพเต็ม desktop](screenshots/native-full-1440.png), [ระหว่างอัด](screenshots/recording-390.png), [ภาพหาย](screenshots/missing-image-390.png)

**ยังไม่ตรวจ:** Safari/PWA บน iPhone จริง, การเทียบท่ากับผู้ตีจริง, การตรวจความถูกต้องโดยโปรกอล์ฟ และความเข้าใจของผู้เริ่มเล่นจริง ผลอัตโนมัติและการดูภาพโดย agent ไม่แทนการตรวจเหล่านี้ ภาพตัวอย่างไม่ได้ปรับสัดส่วนตามส่วนสูงของผู้ใช้ และไม่ได้เป็นการวัดท่าทาง

รูปแบบ สี ตัวอักษร และระบบดีไซน์เดิมคงไว้ งานนี้เป็นการเพิ่มตัวช่วยในกล้อง ไม่มีการเปลี่ยน DESIGN.md หรือ tokens

ตรวจหน้าตาโดย fresh Impeccable reviewer ได้ผล [`disposition: ship`](finish-review.md) ไม่มี material fixes การตรวจนี้เป็นการตรวจโดย agent ตามขอบเขตข้างต้น
