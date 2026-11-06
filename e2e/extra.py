import sys, json
from playwright.sync_api import sync_playwright
errors=[]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 390, "height": 844})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto("file://" + sys.argv[1])
    pg.get_by_role("button", name="วิดีโอ").click()
    pg.locator('input[type=file]').nth(1).set_input_files("test.mp4")
    pg.wait_for_function("document.querySelector('video') && document.querySelector('video').readyState >= 1")
    pg.get_by_role("button", name="ตรวจท่าเฟรมนี้").click()
    pg.wait_for_function("[...document.querySelectorAll('p[aria-live]')].some(p => !p.textContent.includes('กำลังวิเคราะห์'))", timeout=60000)
    pose_msg = [t for t in pg.locator('p[aria-live]').all_inner_texts()]
    # import
    open("backup.json","w").write(json.dumps({"schemaVersion":1,"settings":{"handedness":"left"},"sessions":[{"id":"a","startedAt":"2026-11-01T10:00:00Z","endedAt":"2026-11-01T10:30:00Z","unit":"min","amount":30,"mode":"normal","symptomId":"slice","drillIds":["path-gate"],"doneDrillIds":["path-gate"],"freeHit":0,"status":"completed"}],"shots":[]}))
    pg.get_by_role("button", name="ตั้งค่า").click()
    pg.locator('input[type=file][accept*=json]').set_input_files("backup.json")
    pg.get_by_role("button", name="ยืนยันการนำเข้า").click()
    pg.get_by_role("button", name="ประวัติ").click()
    pg.locator(".hist li").first.wait_for()
    pg.get_by_role("button", name="ฝึก").click()
    bunker = "ออกบังเกอร์ไม่ได้" in pg.locator("main").inner_text()
    b.close()
print(json.dumps({"pose_msg": pose_msg, "import_ok": True, "bunker_hidden_by_default": not bunker, "errors": errors}, ensure_ascii=False))
