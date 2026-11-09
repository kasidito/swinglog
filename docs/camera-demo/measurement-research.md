# การวัดช็อตจาก iPhone เครื่องเดียว: สิ่งที่ยังต้องพิสูจน์

ตรวจแหล่งอ้างอิงและโค้ด 2026-11-09 รุ่นนี้แก้กล้องและสาธิตหน้าผลลัพธ์ ไม่เปิดระบบ launch monitor อัตโนมัติ

## ขอบเขตหลักฐานปัจจุบัน

กล้องสวิงเต็มตัวเหมาะกับการเห็นคนและไม้ตลอดวง แต่ลูกกับหัวไม้มีขนาดเล็ก เคลื่อนเร็วและเบลอในช่วงกระทบ แหล่งภาพที่ส่งผ่านเว็บอาจต่างจาก constraints ที่ขอ และ slow-motion ที่นำเข้าอาจมีเวลาเล่นต่างจากเวลาถ่าย การมี encoded timestamp จึงยังไม่ทำให้ได้ m/s

ตัวติดตามใน SwingLog ย่อภาพให้ด้านยาวไม่เกิน 640px หาวัตถุสว่างจากผลต่างภาพ แล้วเชื่อมจุดที่สุ่มไม่เกิน 30 ครั้ง/วินาที สูงสุด 120 จุด ไม่ได้ตรวจหัวไม้ ไม่ได้อ่านสปิน ไม่มีการสอบเทียบระยะจริงหรือ lens/ระนาบ ส่วน MediaPipe เป็นโมเดลข้อต่อคน การทดสอบสีและลูกสังเคราะห์ยืนยันการทำงานของซอฟต์แวร์ ไม่ยืนยันความแม่นยำกอล์ฟ

## แหล่งปฐมภูมิและผลต่อการออกแบบ

| แหล่ง | สิ่งที่ใช้ตัดสินใจ |
|---|---|
| [MDN: aspectRatio](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints/aspectRatio), [constraints](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Constraints) | ต้องตรวจ settings และขนาด video ที่ได้รับจริง; `ideal` เป็นความต้องการ ไม่ใช่การรับประกัน |
| [MDN: canvas.captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream), [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) | crop ต้องถูกส่งเข้าตัวบันทึกจริง ตรวจ API/MIME และมีทางเลือก ไม่ถือ FPS ที่ร้องขอเป็นนาฬิกาถ่ายที่สอบเทียบแล้ว |
| [Golfboy](https://golfboy.jp/en/) | ตัวอย่างผลิตภัณฑ์ native iPhone ที่มี shot monitor และ swing analysis แยกกัน เป็นหลักฐานว่ามีแนวทางผลิตภัณฑ์ประเภทนี้ ไม่ใช่หลักฐานว่าเว็บ SwingLog ทำได้หรือแม่นเท่ากัน |
| [Titleist: Launch Conditions](https://www.titleist.com/learning-lab/performance/golf-shot-launch-conditions) | ข้อมูลเริ่มต้นของลูกประกอบด้วยความเร็ว มุม ทิศ และสปิน; สภาพอากาศมีผลต่อวิถีหลังปล่อย จึงไม่สรุป Carry จาก Club Speed อย่างเดียว |

## งานทดลองถัดไปที่เสนอ

1. **พิสูจน์ capture ก่อน algorithm:** เก็บคลิปสวิงเต็มตัวและคลิปตั้งใกล้ลูกแบบแยกเซสชัน ใช้ iPhone เครื่องเดียวตามข้อจำกัด บันทึกรุ่นเครื่อง/iOS/browser/PWA, source/output dimensions, exposure ที่ทราบ, dropped/duplicate frames และความสัมพันธ์ระหว่างเวลาไฟล์กับเวลาถ่าย ถ้าเวลาไม่น่าเชื่อถือให้ปฏิเสธค่าความเร็ว
2. **สอบเทียบ geometry และการเห็นวัตถุ:** มีระยะอ้างอิงจริงในระนาบการเคลื่อนที่ แก้ perspective/lens ตามหลักฐาน วัดความคลาดเคลื่อนการแตะและ detector; แยก ball/club detector จาก body pose ปฏิเสธเฟรมเบลอ บัง หรือวัตถุหลุด ไม่เพิ่มจุดตกเอง
3. **ตรวจเทียบอุปกรณ์อ้างอิง:** บันทึกช็อตเดียวกันพร้อม launch monitor ที่รายงานได้ แยก train/tune กับ held-out golfer/device/session เก็บทุก attempt รวมที่ระบบปฏิเสธ แบ่งตามไม้ แสง มุม ระยะตั้งกล้อง มือซ้าย/ขวา และการอัดผ่าน Safari/PWA/native import
4. **รายงานก่อนเปิดใช้:** จำนวนช็อตและช่วงค่าที่ครอบคลุม, detection coverage, dropout/rejection rate, bias, MAE, RMSE และ p95 absolute error ต่อ metric พร้อมความไม่แน่นอนของอุปกรณ์อ้างอิง แสดง failure cases แยกจากช็อตที่วัดสำเร็จ
5. **ประตูเปิดฟีเจอร์:** กำหนดเกณฑ์ความคลาดเคลื่อนตามประโยชน์ในการซ้อมก่อนทดสอบ held-out เปิดเฉพาะ metric/สภาพที่ผ่านและมีหลักฐานสอบกลับได้ ช่วงที่ไม่ผ่านคง `unavailable` หากทำ physics model ต้องแสดง input ที่วัดได้ สมมติฐาน และ sensitivity; ห้ามเติมสปิน/มุมเฉลี่ยโดยไม่บอก

ยังไม่มีชุดคลิปกอล์ฟสอบเทียบ ผลเทียบ launch monitor หรือการตรวจ iPhone จริง ไม่มีตัวเลขความแม่นยำที่รับรองได้ และยังไม่เปิด Club Speed/Carry อัตโนมัติ การทำ native app หรือเชื่อมอุปกรณ์ภายนอกไม่ได้อยู่ในงานรุ่นนี้
