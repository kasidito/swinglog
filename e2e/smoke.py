import sys, json
from playwright.sync_api import sync_playwright
path = sys.argv[1]
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 390, "height": 844})
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" and "fonts.g" not in m.text else None)
    pg.goto("file://" + path)
    pg.get_by_role("heading", name="วันนี้ฝึกอะไรดี").wait_for()
    pg.screenshot(path="/home/claude/e2e/1-home.png", full_page=True)
    pg.get_by_role("button", name="30 นาที").click()
    pg.get_by_role("button", name="สไลซ์").first.click()
    pg.get_by_role("button", name="เริ่มเซสชัน").click()
    pg.get_by_role("table", name="สกอร์การ์ดเซสชัน").wait_for()
    pg.screenshot(path="/home/claude/e2e/2-session.png", full_page=True)
    n = pg.locator(".sc-row .open").count()
    pg.locator(".sc-row .open").nth(1).click()
    pg.get_by_role("heading", level=1).wait_for()
    for f in ["ตรง", "สไลซ์", "สไลซ์", "fade", "ตรง"]:
        pg.get_by_role("group", name="บันทึกวิถีลูก").get_by_role("button", name=f).click()
    pg.screenshot(path="/home/claude/e2e/3-drill.png", full_page=True)
    pg.get_by_role("button", name="เสร็จ", exact=True).click()
    # mark remaining done
    import re
    while pg.get_by_role("button", name=re.compile("^ทำ .*เสร็จแล้ว$")).count():
        pg.get_by_role("button", name=re.compile("^ทำ .*เสร็จแล้ว$")).first.click()
    pg.get_by_role("button", name="จบเซสชัน").click()
    pg.get_by_role("heading", name="ฝึกเสร็จแล้ว").wait_for()
    txt = pg.locator("main").inner_text()
    pg.screenshot(path="/home/claude/e2e/4-summary.png", full_page=True)
    pg.get_by_role("button", name="ประวัติ").click()
    pg.get_by_role("heading", name="ฝึกไปแล้ว 1 ครั้ง").wait_for()
    pg.get_by_role("button", name="ตั้งค่า").click()
    pg.get_by_role("button", name="มืด (กลางคืน)").click()
    pg.get_by_label("ตัวอักษรใหญ่").check()
    pg.get_by_role("button", name="ถนัดซ้าย").click()
    pg.get_by_label("มีกรีนซ้อมพัตต์และชิป").uncheck()
    pg.screenshot(path="/home/claude/e2e/5-settings-dark.png", full_page=True)
    pg.get_by_role("button", name="ฝึก").click()
    home = pg.locator("main").inner_text()
    pg.get_by_role("button", name="ถาดลูก (ในช่องตี)").click()
    pg.get_by_role("button", name="เริ่มเซสชัน").click()
    pg.get_by_role("table", name="สกอร์การ์ดเซสชัน").wait_for()
    ball = pg.locator("main").inner_text()
    pg.screenshot(path="/home/claude/e2e/6-ball-dark.png", full_page=True)
    # reload persists?
    pg.reload(); pg.wait_for_timeout(500)
    persisted = pg.locator("main").inner_text()
    b.close()
print(json.dumps({"drills": n, "summary_has_pct": "%" in txt, "putt_hidden": "พัตต์ระยะสั้น" not in home,
  "free_hit": "ตีอิสระ" in ball, "persist_active": "เซสชันค้าง" in persisted or "เซสชันวันนี้" in persisted, "errors": errors}, ensure_ascii=False))
