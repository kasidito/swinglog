"""Built-app integration checks. Run make_analysis_fixtures.py first.
Optional --pose-clip uses a local full-body example to test real inference/offline.
No user videos or model results are uploaded. No model mocking is used.
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://localhost:5175/')
parser.add_argument('--fixtures', default='/tmp/swinglog-analysis-fixtures')
parser.add_argument('--pose-clip')
parser.add_argument('--evidence', default='/tmp/swinglog-analysis-evidence')
args = parser.parse_args()
folder = Path(args.evidence); folder.mkdir(parents=True, exist_ok=True)
checks = []

def passed(name):
    checks.append(name); print('PASS:', name, flush=True)

def select(page, path):
    page.locator('input[type=file]').nth(1).set_input_files(str(path))
    page.locator('.analysis-lab').wait_for()

def seek(page, time):
    page.locator('video').evaluate('(v,t)=>{v.pause();v.currentTime=t}', time)
    page.wait_for_function('(t)=>Math.abs(document.querySelector("video").currentTime-t)<.01 && !document.querySelector("video").seeking', arg=time)
    page.wait_for_timeout(80)

def point(page, x, y):
    page.get_by_role('button', name='กำหนด / แก้จุดลูก').click()
    c = page.locator('.analysis-proof'); c.scroll_into_view_if_needed()
    box = c.bounding_box(); page.mouse.click(box['x'] + box['width'] * x, box['y'] + box['height'] * y)

def finished(page):
    page.wait_for_function('document.querySelector(".analysis-lab").dataset.runState !== "running"', timeout=60000)

def report(page):
    with page.expect_download() as event:
        page.get_by_role('button', name='ส่งออกผลวิเคราะห์ JSON').click()
    return json.loads(Path(event.value.path()).read_text())

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':390, 'height':844}, accept_downloads=True)
    page = context.new_page(); errors = []; outgoing = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('request', lambda r: outgoing.append({'method':r.method, 'url':r.url}) if not r.url.startswith(args.url.rstrip('/')) else None)
    page.goto(args.url)
    page.get_by_role('button', name='วิดีโอ', exact=True).click()
    select(page, Path(args.fixtures) / 'moving.mp4')
    assert page.get_by_role('button', name='เดินหน้าประมาณ 0.033 วินาที').is_visible()
    for width in [360,390,768]:
        page.set_viewport_size({'width':width,'height':844})
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    page.set_viewport_size({'width':390,'height':844})
    page.get_by_role('button', name='กำหนด / แก้จุดลูก').click(); page.keyboard.press('ArrowRight'); page.keyboard.press('Enter')
    assert report(page)['ballTracking']['points'][0]['x'] > .5
    page.get_by_role('button', name='ล้างจุดลูก', exact=True).click()
    passed('keyboard ball placement')
    passed('metadata, honest time-step labels and 360/390/768px overflow')
    page.get_by_role('button', name='ตั้ง Address ตรงนี้').click()
    seek(page, 0.2); page.get_by_role('button', name='ตั้ง Top ตรงนี้').click()
    seek(page, 0.1); page.get_by_role('button', name='ตั้ง Impact ตรงนี้').click()
    assert 'ลำดับต้องเป็น' in page.locator('.analysis-lab [role=status]').inner_text()
    page.get_by_role('button', name='ลบ Top', exact=True).click()
    seek(page, 0); page.get_by_role('button', name='ลบ Address', exact=True).click()
    page.get_by_role('button', name='ตั้ง Impact ตรงนี้').click()
    passed('manual phase order rejects reversed markers and supports correction')
    point(page,160/640,280/360)
    page.get_by_role('button', name='ติดตามลูกต่อจากจุดล่าสุด').click(); finished(page)
    data = report(page); points = data['ballTracking']['points']
    assert len(points) > 60, len(points)
    assert abs(points[-1]['x'] - 427/639) < .025, points[-1]
    assert points[0]['source'] == 'manual' and points[-1]['source'] == 'detected'
    assert 'blob:' not in json.dumps(data)
    passed(f'synthetic ball follows expected endpoint ({len(points)} points), JSON provenance without media bytes')
    seek(page, 1); point(page,250/640,250/360)
    data = report(page)
    assert max(x['time'] for x in data['ballTracking']['points']) <= 1.001
    assert data['ballTracking']['points'][-1]['source'] == 'manual'
    page.get_by_role('button', name='ติดตามลูกต่อจากจุดล่าสุด').click(); finished(page)
    assert len(report(page)['ballTracking']['points']) > 30
    passed('manual correction truncates downstream track and can resume')
    page.locator('.analysis-lab').screenshot(path=str(folder / 'tracking-mobile.png'))
    select(page, Path(args.fixtures) / 'lost.mp4')
    assert page.get_by_role('button', name='ส่งออกผลวิเคราะห์ JSON').is_disabled()
    page.get_by_role('button', name='ตั้ง Impact ตรงนี้').click(); point(page,160/640,280/360)
    page.get_by_role('button', name='ติดตามลูกต่อจากจุดล่าสุด').click(); finished(page)
    data = report(page)
    assert data['ballTracking']['stoppedAt'] is not None
    assert data['run']['state'] == 'partial'
    assert max(x['time'] for x in data['ballTracking']['points']) < 1.1
    passed('loss stops without fabricated landing; replacing clip resets results')
    select(page, Path(args.fixtures) / 'moving.mp4')
    page.get_by_role('button', name='ตั้ง Impact ตรงนี้').click(); point(page,160/640,280/360)
    page.get_by_role('button', name='ติดตามลูกต่อจากจุดล่าสุด').click()
    page.get_by_role('button', name='ยกเลิกการวิเคราะห์').click(); finished(page)
    assert page.locator('.analysis-lab').get_attribute('data-run-state') == 'cancelled'
    assert page.get_by_role('button', name='วิเคราะห์สวิงทั้งช่วง').is_enabled()
    passed('cancellation returns controls with partial evidence')
    page.get_by_label('สิ้นสุด (วินาที)').fill(''); assert page.get_by_role('button', name='วิเคราะห์สวิงทั้งช่วง').is_disabled()
    page.get_by_label('สิ้นสุด (วินาที)').fill('3')
    page.get_by_role('button', name='วิเคราะห์สวิงทั้งช่วง').click()
    page.get_by_role('navigation').get_by_role('button', name='ฝึก',exact=True).click()
    page.wait_for_timeout(500)
    page.get_by_role('button', name='วิดีโอ',exact=True).click()
    assert page.locator('.analysis-lab').count() == 0
    passed('invalid range validation and navigation abort/reset')
    if args.pose_clip:
        select(page, args.pose_clip)
        page.get_by_role('button', name='ตั้ง Address ตรงนี้').click(); seek(page,.5); page.get_by_role('button', name='ตั้ง Impact ตรงนี้').click()
        page.get_by_role('button', name='วิเคราะห์สวิงทั้งช่วง').click(); finished(page)
        data = report(page)
        assert any(x['landmarks'] for x in data['poseSamples']), data['run']
        assert any(x['phase']=='impact' for x in data['comparisons']), data['comparisons']
        page.locator('.analysis-lab').screenshot(path=str(folder / 'pose-mobile.png'))
        passed('real MediaPipe classic worker, visibility gate and address comparison (non-golf public sample)')
        page.wait_for_function('navigator.serviceWorker.controller !== null', timeout=30000)
        await_cache = '''async()=>{const keys=await caches.keys();for(const k of keys){const urls=(await(await caches.open(k)).keys()).map(r=>r.url);if(urls.some(u=>u.includes('pose_landmarker_lite.task'))&&urls.some(u=>u.includes('wasm_internal.wasm')))return true}return false}'''
        assert page.evaluate(await_cache), 'model/WASM cache absent'
        context.set_offline(True); page.reload(); page.get_by_role('button', name='วิดีโอ',exact=True).click(); select(page, args.pose_clip)
        page.get_by_role('button', name='วิเคราะห์สวิงทั้งช่วง').click(); finished(page)
        assert any(x['landmarks'] for x in report(page)['poseSamples'])
        passed('PWA offline reload and fresh pose worker after assets prepared')
        context.set_offline(False)
    # Fresh context: intentionally block runtime downloads; UI must recover.
    fresh=browser.new_context(viewport={'width':390,'height':844}); failed=fresh.new_page()
    failed.on('pageerror',lambda e:errors.append(str(e)))
    failed.route('https://cdn.jsdelivr.net/**',lambda r:r.abort());failed.route('https://storage.googleapis.com/**',lambda r:r.abort())
    failed.goto(args.url);failed.get_by_role('button',name='วิดีโอ',exact=True).click();select(failed,Path(args.fixtures)/'moving.mp4')
    failed.get_by_role('button',name='วิเคราะห์สวิงทั้งช่วง').click();finished(failed)
    assert failed.locator('.analysis-lab').get_attribute('data-run-state')=='unavailable'
    assert failed.get_by_role('button',name='กำหนด / แก้จุดลูก').is_enabled()
    passed('cold model download failure preserves manual tools')
    failed.locator('input[type=file]').nth(1).set_input_files({'name':'broken.mp4','mimeType':'video/mp4','buffer':b'invalid video'})
    failed.get_by_text('เปิดวิดีโอนี้ไม่ได้ ลองไฟล์ MP4 หรือคลิปอื่น').wait_for()
    assert failed.locator('.analysis-lab').count()==0
    passed('invalid video codec/file recovery')
    assert not errors, errors
    assert not [r for r in outgoing if r['method'] not in ['GET','HEAD']], outgoing
    passed('no page exceptions or off-origin upload requests')
    evidence={'browser':browser.version,'url':args.url,'checks':checks,'pose_sample':args.pose_clip is not None,'page_errors':errors,'external_request_methods':sorted(set(r['method'] for r in outgoing)),'limits':['Generated ball scenes are not real golf validation','Public pose sample is not a swing','No physical iPhone or Safari codec testing']}
    (folder/'verification.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    browser.close()
