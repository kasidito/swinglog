"""Real-browser coaching acceptance checks against a built PWA. Synthetic history only."""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--url', default='http://localhost:5177/')
parser.add_argument('--evidence', default='/tmp/swinglog-coaching-evidence')
parser.add_argument('--skip-offline', action='store_true')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
out=Path(args.evidence); out.mkdir(parents=True,exist_ok=True)
drills=json.loads((root/'src/content/drills.json').read_text())
lessons=json.loads((root/'src/content/coaching.json').read_text())
checks=[]
def passed(message):
    checks.append(message); print('PASS:',message,flush=True)
def no_overflow(page):
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth+1'), page.locator('h1').inner_text()
def photo_ready(page):
    page.wait_for_function('Array.from(document.querySelectorAll(".photo-button img")).every(i=>i.complete && i.naturalWidth>0)')
def shot_count(page):
    return page.locator('.flights').locator('..').locator('.row .muted').inner_text()

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':390,'height':844},accept_downloads=True)
    page=context.new_page(); errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(args.url); page.get_by_role('heading',name='ซ้อมวันนี้').wait_for()
    page.screenshot(path=str(out/'home-light-390.png'),full_page=True)
    # Start an actual plan; read a drill, log a ball, visit a related foundation, return.
    page.get_by_role('button',name='เริ่มเซสชัน',exact=True).click()
    page.locator('.lane .open').first.click()
    page.locator('.step-navigation').get_by_role('button',name='ถัดไป').click()
    saved_action=page.locator('.step-copy h2').inner_text()
    if page.locator('.flights').count(): page.get_by_role('button',name='ตรง',exact=True).click()
    before=shot_count(page) if page.locator('.flights').count() else None
    page.locator('.related-lesson button').first.click()
    page.get_by_role('button',name='กลับไปซ้อมต่อ',exact=True).first.click()
    assert page.locator('.step-copy h2').inner_text()==saved_action
    if before: assert shot_count(page)==before
    passed('drill → foundation → drill retains instruction step and logged ball')
    # Native dialog: keyboard opens, range zooms, Escape closes, focus returns.
    photo_ready(page)
    zoom=page.locator('.photo-button'); zoom.focus(); page.keyboard.press('Enter')
    assert page.locator('dialog').is_visible()
    page.locator('dialog input[type=range]').fill('2')
    assert page.locator('.zoom-scroll > div').get_attribute('style')=='width: 200%;'
    page.keyboard.press('Escape'); assert not page.locator('dialog').is_visible()
    assert zoom.evaluate('(e)=>e===document.activeElement')
    passed('keyboard image zoom, pan container, Escape and focus restoration')
    # Import an old schemaVersion 1 backup containing all old drill IDs and history.
    fixture={'schemaVersion':1,'settings':{'handedness':'right','theme':'light','largeText':False,'hasGreen':True,'hasBunker':True,'lastUnit':'min','lastAmount':15},
      'sessions':[{'id':'legacy-completed','startedAt':'2026-11-01T10:00:00Z','endedAt':'2026-11-01T10:15:00Z','unit':'min','amount':15,'mode':'normal','symptomId':None,'drillIds':['path-gate'],'doneDrillIds':['path-gate'],'freeHit':0,'status':'completed'},
      {'id':'synthetic-active','startedAt':'2026-11-08T10:00:00Z','endedAt':None,'unit':'min','amount':30,'mode':'normal','symptomId':None,'drillIds':[d['id'] for d in drills],'doneDrillIds':[],'freeHit':0,'status':'active'}],
      'shots':[{'id':'legacy-shot','sessionId':'legacy-completed','drillId':'path-gate','flight':'straight','createdAt':'2026-11-01T10:01:00Z'}]}
    page.get_by_role('button',name='ตั้งค่า',exact=True).click()
    page.locator('input[type=file]').set_input_files({'name':'legacy.json','mimeType':'application/json','buffer':json.dumps(fixture).encode()})
    page.get_by_role('button',name='ยืนยันการนำเข้า',exact=True).click()
    page.get_by_role('button',name='ประวัติ',exact=True).click()
    assert page.locator('.hist li').count()==1 and '100%' in page.locator('.hist').inner_text()
    page.screenshot(path=str(out/'history-light-390.png'),full_page=True)
    passed('legacy backup, completed session and existing shot meaning preserved')
    page.get_by_role('button',name='ฝึก',exact=True).click()
    for index,d in enumerate(drills):
        page.locator('.lane .open').nth(index).click(); photo_ready(page)
        assert page.locator('.step-picker button').count() in (3,4,5)
        for step in range(3):
            page.locator('.step-picker button').nth(step).click()
            assert page.locator('.step-picker button').nth(step).get_attribute('aria-pressed')=='true'
            assert page.locator('.self-check p').inner_text()
            no_overflow(page)
        if d['id']=='path-gate': page.screenshot(path=str(out/'path-gate-light-390.png'),full_page=True)
        page.get_by_role('button',name='กลับไปรายการดริล').click()
    passed('all 20 existing drills have loaded images, manual step selection and self-checks')
    page.get_by_role('button',name='ท่าพื้นฐาน',exact=True).click()
    assert page.locator('.lesson-row').count()==6
    page.screenshot(path=str(out/'foundations-light-390.png'),full_page=True)
    for index in range(6):
        page.locator('.lesson-row').nth(index).click(); photo_ready(page)
        for n in range(page.locator('.step-picker button').count()):
            page.locator('.step-picker button').nth(n).click(); photo_ready(page)
        page.get_by_role('button',name='ท่าพื้นฐานทั้งหมด',exact=False).click()
    passed('six foundation lessons and every image step load')
    # Complete cross-product of screen sizes, themes, text sizes and handedness.
    for width in [360,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        for dark in [False,True]:
            for large in [False,True]:
                for left in [False,True]:
                    page.get_by_role('button',name='ตั้งค่า',exact=True).click()
                    page.get_by_role('button',name='มืด (กลางคืน)' if dark else 'สว่าง',exact=True).click()
                    page.get_by_role('button',name='ถนัดซ้าย' if left else 'ถนัดขวา',exact=True).click()
                    page.get_by_role('checkbox',name='ตัวอักษรใหญ่',exact=True).set_checked(large)
                    no_overflow(page)
                    page.get_by_role('button',name='ท่าพื้นฐาน',exact=True).click(); no_overflow(page)
                    page.locator('.lesson-row').first.click(); photo_ready(page); no_overflow(page)
                    assert page.locator('.hand-key').inner_text()==('ข้างนำ = ขวา · ข้างตาม = ซ้าย' if left else 'ข้างนำ = ซ้าย · ข้างตาม = ขวา')
                    # Baseline handedness is normalized independently for every generated sheet.
                    if width==360 and dark and large and left:
                        page.screenshot(path=str(out/'grip-dark-large-left-360.png'),full_page=True)
                        page.locator('.photo-button').click()
                        page.screenshot(path=str(out/'zoom-dark-large-left-360.png'),full_page=True)
                        page.keyboard.press('Escape')
                    if width==768 and not dark and not large and not left:
                        page.screenshot(path=str(out/'grip-light-768.png'),full_page=True)
                    page.get_by_role('button',name='ฝึก',exact=True).click(); no_overflow(page)
                    page.get_by_role('button',name='วิดีโอ',exact=True).click(); no_overflow(page)
                    page.get_by_role('button',name='ประวัติ',exact=True).click(); no_overflow(page)
    passed('24 viewport/theme/text-size/handedness combinations: settings, library, lesson, plan, video, history')
    page.reload(); page.get_by_role('button',name='ทำต่อ',exact=True).click()
    assert page.locator('.lane .open').count()==20
    page.locator('.lane .open').first.click()
    assert page.locator('.step-picker button').nth(2).get_attribute('aria-pressed')=='true'
    page.get_by_role('button',name='กลับไปรายการดริล').click()
    passed('active session and last instruction step survive page reload')
    if not args.skip_offline:
        page.wait_for_function('navigator.serviceWorker.controller !== null')
        page.evaluate('navigator.serviceWorker.ready')
        context.set_offline(True); page.reload()
        page.get_by_role('button',name='ท่าพื้นฐาน',exact=True).click()
        for i in range(6):
            page.locator('.lesson-row').nth(i).click(); photo_ready(page)
            page.get_by_role('button',name='ท่าพื้นฐานทั้งหมด',exact=False).click()
        page.get_by_role('button',name='ฝึก',exact=True).click()
        for i in range(20):
            page.locator('.lane .open').nth(i).click(); photo_ready(page)
            page.get_by_role('button',name='กลับไปรายการดริล').click()
        context.set_offline(False)
        passed('offline reload, all 6 lessons and all 20 drill images from local PWA cache')
    missing=browser.new_context(viewport={'width':360,'height':844},service_workers='block')
    missing.route('**/coaching/*.webp',lambda route:route.abort())
    fallback=missing.new_page(); fallback.goto(args.url)
    fallback.get_by_role('button',name='ท่าพื้นฐาน',exact=True).click()
    fallback.locator('.lesson-row').first.click()
    assert fallback.locator('.photo-button .media-fallback').inner_text().startswith('ภาพยังไม่พร้อม')
    assert fallback.locator('.self-check p').inner_text()
    missing.close(); passed('missing-image fallback retains readable action and self-check')
    assert not errors,errors
    passed('no browser runtime errors')
    (out/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2))
    browser.close()
