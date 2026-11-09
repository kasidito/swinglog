"""Portrait preview/encoded pixels and synthetic shot-demo acceptance.
Requires Playwright, Chromium, Pillow, ffmpeg. No real camera or user video.
"""
import argparse
import io
import json
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://localhost:5181/')
parser.add_argument('--evidence',default='/tmp/swinglog-camera-demo-evidence')
parser.add_argument('--skip-offline',action='store_true')
args=parser.parse_args()
out=Path(args.evidence);out.mkdir(parents=True,exist_ok=True)
checks=[]
def passed(s): checks.append(s);print('PASS:',s,flush=True)
def no_overflow(page): assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
def launch(p,kind='landscape',extra=None):
    return p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-fake-device-for-media-stream',f'--use-file-for-fake-video-capture=/tmp/swinglog-camera-{kind}.y4m']+(extra or []))
def context(browser,kind='landscape'):
    c=browser.new_context(permissions=['camera'],viewport={'width':390,'height':844},accept_downloads=True)
    w,h=(1280,720) if kind=='landscape' else (720,1280)
    c.add_init_script(f'''const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=opts=>get({{video:{{width:{{exact:{w}}},height:{{exact:{h}}},frameRate:30,resizeMode:'none'}},audio:false}});''')
    return c
def open_camera(page):
    page.get_by_role('button',name='เปิดกล้องพร้อมกรอบจัดตำแหน่ง').click()
    page.wait_for_function('document.querySelector(".cam video")?.videoWidth>0')
    page.get_by_role('button',name='เริ่มอัด',exact=True).wait_for(state='visible')
def record(page):
    page.get_by_role('button',name='เริ่มอัด',exact=True).click();page.wait_for_timeout(1100)
    page.get_by_role('button',name='หยุดอัด',exact=True).click()
    page.locator('.capture-summary').wait_for()
    page.wait_for_function('document.querySelector(".screen video")?.readyState>=2')
def report(page):
    page.locator('.lab-disclosure > summary').click()
    page.get_by_role('button',name='ตั้ง Impact ตรงนี้').click()
    with page.expect_download() as event: page.get_by_role('button',name='ส่งออกผลวิเคราะห์ JSON').click()
    return json.loads(Path(event.value.path()).read_text())
def decoded_pixel(page):
    return page.locator('.screen video').evaluate('''v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d');x.drawImage(v,0,0);return Array.from(x.getImageData(Math.floor(c.width*.25),Math.floor(c.height*.65),1,1).data).slice(0,3)}''')

with sync_playwright() as p:
    browser=launch(p); c=context(browser);page=c.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(args.url);page.get_by_role('button',name='วิดีโอ',exact=True).click()
    # Three distinct pan positions prove the visible crop, not just aspect ratio.
    for pan,dominant in [('0',0),('0.5',1),('1',2)]:
        open_camera(page)
        page.locator('.cam-pan input').fill(pan)
        box=page.locator('.cam-frame').bounding_box()
        assert abs(box['width']/box['height']-9/16)<.005
        assert page.locator('.cam-instructions').count()==0
        preview=Image.open(io.BytesIO(page.locator('.cam-frame').screenshot()))
        color=preview.getpixel((int(preview.width*.25),int(preview.height*.65)))[:3]
        assert color[dominant]>max(color[i] for i in range(3) if i!=dominant)+50,(pan,color)
        if pan=='0.5':page.screenshot(path=str(out/'portrait-landscape-source-390.png'))
        record(page)
        dims=page.locator('.screen video').evaluate('v=>[v.videoWidth,v.videoHeight]')
        assert dims==[396,704],dims
        pixel=decoded_pixel(page)
        assert pixel[dominant]>max(pixel[i] for i in range(3) if i!=dominant)+50,(pan,pixel)
        assert all(abs(pixel[i]-color[i])<35 for i in range(3)),(pixel,color)
        data=report(page)
        assert data['clip']['captureInfo']['sourceWidth']==1280
        assert data['clip']['captureInfo']['outputWidth']==396
        assert data['clip']['captureInfo']['reportedFrameRate']==30
        assert data['clip']['captureInfo']['timing']=='encoded-media-approximate'
        assert all(m['value'] is None for m in data['metrics']['shot'])
        if pan=='0.5':
            page.locator('.shot-results').screenshot(path=str(out/'real-metrics-unavailable-390.png'))
        page.get_by_role('button',name='วิดีโอ',exact=True).click() # remount video landing through another tab
        page.get_by_role('button',name='ประวัติ',exact=True).click();page.get_by_role('button',name='วิดีโอ',exact=True).click()
    passed('portrait recording matches preview pixels at left/center/right pan; 396×704 from native 1280×720 with provenance')
    open_camera(page);page.get_by_role('button',name='ภาพเต็มจากกล้อง',exact=True).click();record(page)
    assert page.locator('.screen video').evaluate('v=>[v.videoWidth,v.videoHeight]')==[1280,720]
    passed('full-camera option retains native 1280×720 without portrait crop')
    page.get_by_role('button',name='ประวัติ',exact=True).click();page.get_by_role('button',name='วิดีโอ',exact=True).click()
    open_camera(page);page.get_by_role('button',name='เริ่มอัด',exact=True).click();page.wait_for_timeout(700)
    page.set_viewport_size({'width':844,'height':390})
    page.wait_for_timeout(200)
    assert page.get_by_role('button',name='หยุดอัด',exact=True).count()==1
    page.get_by_role('button',name='หยุดอัด',exact=True).click();page.locator('.capture-summary').wait_for()
    assert page.locator('.screen video').evaluate('v=>[v.videoWidth,v.videoHeight]')==[396,704]
    page.set_viewport_size({'width':390,'height':844})
    passed('viewport rotation during capture keeps the selected output geometry')
    page.get_by_role('button',name='ประวัติ',exact=True).click();page.get_by_role('button',name='วิดีโอ',exact=True).click()
    open_camera(page);page.get_by_role('button',name='เริ่มอัด',exact=True).click();page.wait_for_timeout(700)
    page.locator('.cam video').evaluate("v=>v.srcObject.getVideoTracks()[0].applyConstraints({width:{exact:640},height:{exact:480},resizeMode:'crop-and-scale'})")
    page.locator('.capture-summary').wait_for()
    data=report(page);assert data['clip']['captureInfo']['stopReason']=='source-changed'
    assert page.locator('.screen video').evaluate('v=>[v.videoWidth,v.videoHeight]')==[396,704]
    passed('source geometry change stops and preserves only the original mapped crop')
    page.get_by_role('button',name='ประวัติ',exact=True).click();page.get_by_role('button',name='วิดีโอ',exact=True).click()
    open_camera(page);page.get_by_role('button',name='เริ่มอัด',exact=True).click();page.wait_for_timeout(600)
    page.locator('.cam').get_by_role('button',name='ปิด',exact=True).click();page.wait_for_timeout(300)
    assert page.locator('.capture-summary').count()==0 and page.locator('.cam').count()==0
    open_camera(page);page.keyboard.press('Escape');assert page.locator('.cam').count()==0
    assert page.get_by_role('button',name='เปิดกล้องพร้อมกรอบจัดตำแหน่ง').evaluate('b=>b===document.activeElement')
    passed('close while recording discards safely; Escape closes with focus restoration')
    # No canvas encoder: actionable fallback, then recover to native camera recording.
    fallback=context(browser);fallback.add_init_script('HTMLCanvasElement.prototype.captureStream=undefined')
    q=fallback.new_page();q.goto(args.url);q.get_by_role('button',name='วิดีโอ',exact=True).click();open_camera(q)
    q.get_by_role('button',name='เริ่มอัด',exact=True).click()
    assert 'เครื่องนี้' in q.locator('.cam-status').inner_text()
    q.get_by_role('button',name='ภาพเต็มจากกล้อง',exact=True).click();record(q)
    assert q.locator('.screen video').evaluate('v=>v.videoWidth')==1280
    fallback.close();passed('unsupported portrait encoder explains fallback and recovers to full-camera recording')
    unsupported=context(browser);unsupported.add_init_script('window.MediaRecorder=undefined')
    q=unsupported.new_page();q.goto(args.url);q.get_by_role('button',name='วิดีโอ',exact=True).click();open_camera(q)
    q.get_by_role('button',name='เริ่มอัด',exact=True).click();assert 'ตัวบันทึก' in q.locator('.cam-status').inner_text()
    with q.expect_file_chooser() as chooser:q.get_by_role('button',name='นำเข้าคลิป',exact=True).click()
    chooser.value.set_files('/tmp/swinglog-analysis-fixtures/moving.mp4')
    q.locator('.shot-results').wait_for();assert q.locator('.cam').count()==0
    unsupported.close();passed('missing MediaRecorder still permits library import without trapping the camera dialog')
    # Timer limit is advanced after real video frames exist; it is not a frame-accuracy claim.
    limited=context(browser);q=limited.new_page();q.clock.install();q.goto(args.url)
    q.get_by_role('button',name='วิดีโอ',exact=True).click();open_camera(q);q.get_by_role('button',name='เริ่มอัด',exact=True).click();q.wait_for_timeout(650)
    q.clock.fast_forward(13000);q.locator('.capture-summary').wait_for()
    data=report(q);assert data['clip']['captureInfo']['stopReason']=='limit'
    limited.close();passed('12-second recording limit stops once and preserves a partial clip')
    # Demonstration has its own component and cannot write practice history or real result exports.
    page.get_by_role('button',name='ดูตัวอย่างผลตี',exact=False).click()
    assert 'ตัวอย่างสมมติ' in page.locator('.demo-disclosure').inner_text()
    for width in [360,390,768]:
        page.set_viewport_size({'width':width,'height':844});no_overflow(page)
    page.set_viewport_size({'width':390,'height':844})
    assert page.get_by_role('button',name='หยุดตัวอย่าง',exact=True).count()==0
    page.get_by_role('button',name='เล่นตัวอย่าง',exact=True).click()
    page.wait_for_function('document.querySelector(".demo-track")?.getAttribute("points").length>20')
    page.get_by_role('button',name='หยุดตัวอย่าง',exact=True).click()
    page.locator('.demo-scrub input').fill('6')
    assert page.locator('[data-metric=carry] strong').inner_text()=='145'
    assert page.locator('.demo-results [data-source=simulation]').count()==6
    page.screenshot(path=str(out/'demo-straight-light-390.png'),full_page=True)
    page.get_by_role('button',name='ลูกโค้ง',exact=True).click();page.locator('.demo-scrub input').fill('6')
    assert page.locator('[data-metric=carry] strong').inner_text()=='138'
    page.get_by_role('button',name='ติดตามหลุด',exact=True).click();page.locator('.demo-scrub input').fill('3.5')
    points=page.locator('.demo-track').get_attribute('points');page.locator('.demo-scrub input').fill('6')
    assert page.locator('.demo-track').get_attribute('points')==points
    assert all(x=='—' for x in page.locator('.demo-results dd strong').all_inner_texts())
    page.screenshot(path=str(out/'demo-lost-light-390.png'),full_page=True)
    page.get_by_role('button',name='กลับไปถ่ายของฉัน',exact=True).first.click()
    page.locator('input[type=file]').nth(1).set_input_files('/tmp/swinglog-analysis-fixtures/moving.mp4')
    page.locator('.shot-results').wait_for()
    assert all(x=='—' for x in page.locator('.shot-results dd strong').all_inner_texts())
    data=report(page);assert all(m['source']=='unavailable' and m['value'] is None for m in data['metrics']['shot'])
    assert data['clip']['captureInfo']['source']=='import'
    page.get_by_role('button',name='ประวัติ',exact=True).click();assert page.locator('.hist li').count()==0
    passed('manual demo playback, straight/fade/loss, frozen lost endpoint, and no demo metrics/history leaking into real clip')
    isolated=context(browser);q=isolated.new_page();q.goto(args.url)
    q.get_by_role('button',name='เริ่มเซสชัน',exact=True).click();q.locator('.lane .open').first.click()
    q.get_by_role('button',name='ตรง',exact=True).click();q.get_by_role('button',name='กลับไปรายการดริล').click()
    q.get_by_role('button',name='วิดีโอ',exact=True).click();q.get_by_role('button',name='ดูตัวอย่างผลตี',exact=False).click()
    q.locator('.demo-scrub input').fill('6');q.get_by_role('button',name='กลับไปถ่ายของฉัน',exact=True).first.click()
    q.get_by_role('button',name='ฝึก',exact=True).click();q.locator('.lane .open').first.click()
    assert 'บันทึกแล้ว 1' in q.locator('.flights').locator('..').inner_text()
    isolated.close();passed('demo leaves an existing active session and its real shot count unchanged')
    for width in [360,390,768]:
        for dark in [False,True]:
            for large in [False,True]:
                for left in [False,True]:
                    page.set_viewport_size({'width':width,'height':844})
                    page.get_by_role('button',name='ตั้งค่า',exact=True).click()
                    page.get_by_role('button',name='มืด (กลางคืน)' if dark else 'สว่าง',exact=True).click()
                    page.get_by_role('button',name='ถนัดซ้าย' if left else 'ถนัดขวา',exact=True).click()
                    page.get_by_role('checkbox',name='ตัวอักษรใหญ่',exact=True).set_checked(large)
                    page.get_by_role('button',name='วิดีโอ',exact=True).click();page.get_by_role('button',name='ดูตัวอย่างผลตี',exact=False).click()
                    page.get_by_role('button',name='ลูกโค้ง',exact=True).click();page.locator('.demo-scrub input').fill('6');no_overflow(page)
                    ball_x=float(page.locator('.demo-ball').get_attribute('cx'));assert ball_x<300 if left else ball_x>300
                    if width==360 and dark and large and left:page.screenshot(path=str(out/'demo-fade-dark-large-left-360.png'),full_page=True)
                    page.get_by_role('button',name='กลับไปถ่ายของฉัน',exact=True).first.click();open_camera(page);no_overflow(page)
                    frame=page.locator('.cam-frame').bounding_box();assert abs(frame['width']/frame['height']-9/16)<.01
                    page.get_by_role('button',name='วิธีตั้ง',exact=True).click();assert page.locator('.cam-instructions').is_visible()
                    no_overflow(page)
                    if width==360 and dark and large and left:page.screenshot(path=str(out/'camera-dark-large-left-help-360.png'))
                    page.locator('.cam').get_by_role('button',name='ปิด',exact=True).click()
    passed('24 size/theme/text/handedness combinations for demo and portrait camera, including non-overlay help')
    page.get_by_role('button',name='ตั้งค่า',exact=True).click()
    page.get_by_role('button',name='สว่าง',exact=True).click()
    page.get_by_role('button',name='ถนัดขวา',exact=True).click()
    page.get_by_role('checkbox',name='ตัวอักษรใหญ่',exact=True).uncheck()
    page.get_by_role('button',name='วิดีโอ',exact=True).click()
    page.set_viewport_size({'width':390,'height':844});page.evaluate('scrollTo(0,0)')
    page.screenshot(path=str(out/'video-entry-light-390.png'))
    page.get_by_role('button',name='ดูตัวอย่างผลตี',exact=False).click();page.locator('.demo-scrub input').fill('6')
    for width in [768,1440]:
        page.set_viewport_size({'width':width,'height':1000});page.evaluate('scrollTo(0,0)');no_overflow(page)
        page.screenshot(path=str(out/f'demo-straight-light-{width}.png'))
    page.get_by_role('button',name='กลับไปถ่ายของฉัน',exact=True).first.click();open_camera(page)
    page.screenshot(path=str(out/'portrait-camera-1440.png'))
    page.get_by_role('button',name='ภาพเต็มจากกล้อง',exact=True).click()
    page.screenshot(path=str(out/'full-camera-1440.png'))
    page.locator('.cam').get_by_role('button',name='ปิด',exact=True).click()
    if not args.skip_offline:
        page.wait_for_function('navigator.serviceWorker.controller!==null');page.evaluate('navigator.serviceWorker.ready')
        c.set_offline(True);page.reload();page.get_by_role('button',name='วิดีโอ',exact=True).click()
        page.get_by_role('button',name='ดูตัวอย่างผลตี',exact=False).click();page.locator('.demo-scrub input').fill('6')
        page.wait_for_function('document.querySelector(".demo-golfer img")?.naturalWidth>0')
        assert page.locator('[data-metric=carry] strong').inner_text()=='145'
        c.set_offline(False);passed('offline PWA reload loads demo, local AI illustration and scripted results')
    assert not errors,errors
    browser.close()
    portrait=launch(p,'portrait');cp=context(portrait,'portrait');q=cp.new_page();q.goto(args.url)
    q.get_by_role('button',name='วิดีโอ',exact=True).click();open_camera(q)
    assert q.locator('.cam-pan').count()==0;record(q)
    assert q.locator('.screen video').evaluate('v=>[v.videoWidth,v.videoHeight]')==[720,1280]
    assert 'ผ่านกรอบที่เลือก' not in q.locator('.capture-summary').inner_text()
    portrait.close();passed('native portrait input records 720×1280 without canvas crop')
    (out/'verification.json').write_text(json.dumps({'checks':checks,'errors':errors,'physicalIOS':'not available; Chromium synthetic media only'},ensure_ascii=False,indent=2))
