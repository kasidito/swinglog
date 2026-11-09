"""Human framing reference: local assets, mirroring, fallbacks and clean recordings.

Uses original synthetic camera bands, not a physical iPhone or golf accuracy test.
Run make_camera_fixtures.py first, then serve the production PWA.
"""
import argparse
import io
import json
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://localhost:5181/')
parser.add_argument('--evidence',default='/tmp/swinglog-human-guide')
parser.add_argument('--skip-offline',action='store_true')
args=parser.parse_args()
out=Path(args.evidence);out.mkdir(parents=True,exist_ok=True)
checks=[]
def passed(s):checks.append(s);print('PASS:',s,flush=True)
def camera(q):
    q.get_by_role('button',name='เปิดกล้องพร้อมกรอบจัดตำแหน่ง').click()
    q.wait_for_function('document.querySelector(".cam video")?.videoWidth>0')
def loaded(q):
    q.wait_for_function('document.querySelector(".cam-human")?.naturalWidth>0 && getComputedStyle(document.querySelector(".cam-human")).visibility==="visible"')
def close(q):q.locator('.cam').get_by_role('button',name='ปิด',exact=True).click()
def no_overflow(q):assert not q.evaluate('document.documentElement.scrollWidth>innerWidth+1')
def proportional(q):
    q.wait_for_function('''()=>{const b=document.querySelector('.camera-guide')?.getBoundingClientRect();return b && Math.abs(b.width/b.height-9/16)<.01}''')
    b=q.locator('.camera-guide').bounding_box();assert abs(b['width']/b['height']-9/16)<.01,b
    for el in ['.cam-human','.cam-human-controls','.cam-shutter']:
        b=q.locator(el).bounding_box();assert b['x']>=-1 and b['x']+b['width']<=q.viewport_size['width']+1,b

with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture=/tmp/swinglog-camera-landscape.y4m'])
    c=b.new_context(permissions=['camera'],viewport={'width':390,'height':844})
    setup="const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=()=>get({video:{width:{exact:1280},height:{exact:720},frameRate:30,resizeMode:'none'},audio:false});"
    c.add_init_script(setup);q=c.new_page();errors=[];q.on('pageerror',lambda e:errors.append(str(e)))
    q.goto(args.url);q.get_by_role('button',name='วิดีโอ',exact=True).click();camera(q);loaded(q)
    assert q.locator('.cam-human').get_attribute('src').endswith('dtl.webp');proportional(q)
    q.screenshot(path=str(out/'dtl-390.png'))
    q.get_by_role('button',name='ด้านหน้า',exact=True).click();loaded(q)
    assert q.locator('.cam-human').get_attribute('src').endswith('faceon.webp')
    q.screenshot(path=str(out/'faceon-390.png'))
    q.get_by_role('slider',name='ความชัดของภาพคน').fill('0.8')
    assert q.locator('.cam-human').evaluate('i=>getComputedStyle(i).opacity')=='0.8'
    ball=q.locator('.g-ball').get_attribute('cx')
    q.get_by_role('button',name='ซ่อนภาพคน',exact=True).click()
    assert q.locator('.cam-human').evaluate('i=>getComputedStyle(i).visibility')=='hidden'
    assert q.get_by_role('slider',name='ความชัดของภาพคน').is_disabled()
    assert q.locator('.g-zone').count()==1
    assert q.locator('.g-ball').get_attribute('cx')==ball
    q.get_by_role('button',name='แสดงภาพคน',exact=True).click();loaded(q)
    passed('distinct rear/face-on human references, opacity and hide/show with line-guide fallback')
    q.get_by_role('button',name='ภาพเต็มจากกล้อง',exact=True).click();proportional(q)
    frame=q.locator('.cam-frame').bounding_box();assert abs(frame['width']/frame['height']-16/9)<.01
    q.set_viewport_size({'width':1440,'height':1000});proportional(q)
    q.screenshot(path=str(out/'native-full-1440.png'))
    q.get_by_role('button',name='แนวตั้ง 9:16',exact=True).click();q.screenshot(path=str(out/'portrait-1440.png'))
    q.set_viewport_size({'width':390,'height':844})
    passed('human and annotation reference remains 9:16 inside full landscape source and portrait output')
    q.get_by_role('button',name='ด้านหลัง',exact=True).click();loaded(q)
    q.get_by_role('slider',name='ความชัดของภาพคน').fill('0.8')
    preview=Image.open(io.BytesIO(q.locator('.cam-frame').screenshot()))
    color=preview.getpixel((int(preview.width*.25),int(preview.height*.65)))[:3]
    assert color[0]>30 or color[2]>30,color # visible illustration over green source
    q.get_by_role('button',name='เริ่มอัด',exact=True).click();q.wait_for_timeout(1000)
    rec=q.locator('.cam-rec').bounding_box();note=q.locator('.cam-model-note').bounding_box()
    assert rec['y']>note['y']+note['height']
    q.screenshot(path=str(out/'recording-390.png'))
    q.get_by_role('button',name='หยุดอัด',exact=True).click();q.locator('.capture-summary').wait_for()
    q.wait_for_function('document.querySelector(".screen video")?.readyState>=2')
    pixel=q.locator('.screen video').evaluate('''v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;const x=c.getContext('2d');x.drawImage(v,0,0);return [...x.getImageData(c.width*.25,c.height*.65,1,1).data].slice(0,3)}''')
    assert pixel[0]<20 and pixel[2]<20 and pixel[1]>100,pixel
    passed('visible human overlay is absent from decoded recording pixels; REC status does not overlap disclosure')
    q.get_by_role('button',name='ประวัติ',exact=True).click();q.get_by_role('button',name='วิดีโอ',exact=True).click()
    for width in [360,390,768]:
        for dark in [False,True]:
            for large in [False,True]:
                for left in [False,True]:
                    q.set_viewport_size({'width':width,'height':844})
                    q.get_by_role('button',name='ตั้งค่า',exact=True).click()
                    q.get_by_role('button',name='มืด (กลางคืน)' if dark else 'สว่าง',exact=True).click()
                    q.get_by_role('button',name='ถนัดซ้าย' if left else 'ถนัดขวา',exact=True).click()
                    q.get_by_role('checkbox',name='ตัวอักษรใหญ่',exact=True).set_checked(large)
                    q.get_by_role('button',name='วิดีโอ',exact=True).click();camera(q)
                    for view,name in [('dtl','ด้านหลัง'),('faceon','ด้านหน้า')]:
                        q.get_by_role('button',name=name,exact=True).click();loaded(q);proportional(q);no_overflow(q)
                        mirror=q.locator('.cam-human').evaluate('i=>getComputedStyle(i).transform')
                        assert ('-1' in mirror) if left else mirror=='none',mirror
                        if view=='dtl':
                            ball=float(q.locator('.g-ball').get_attribute('cx'));assert ball<50 if left else ball>50
                        if width==360 and dark and large and left:q.screenshot(path=str(out/f'{view}-dark-large-left-360.png'))
                    if width==768 and not dark and not large and not left:q.screenshot(path=str(out/'faceon-768.png'))
                    q.get_by_role('button',name='วิธีตั้ง',exact=True).click();no_overflow(q);proportional(q)
                    guide=q.locator('.cam-frame').bounding_box();help_box=q.locator('.cam-instructions').bounding_box()
                    assert help_box['y']+help_box['height']<=guide['y']+1
                    if width==360 and dark and large and left:q.screenshot(path=str(out/'help-dark-large-left-360.png'))
                    close(q)
    passed('both views in 24 size/theme/text/hand combinations; mirrored people/anchors, readable controls and separate help')
    if not args.skip_offline:
        q.wait_for_function('navigator.serviceWorker.controller!==null')
        c.set_offline(True);q.reload();q.get_by_role('button',name='วิดีโอ',exact=True).click();camera(q)
        for name in ['ด้านหลัง','ด้านหน้า']:q.get_by_role('button',name=name,exact=True).click();loaded(q)
        close(q);c.set_offline(False)
        passed('deployed-style PWA offline reload loads both local transparent model assets')
    failure=b.new_context(permissions=['camera'],viewport={'width':390,'height':844},service_workers='block')
    failure.add_init_script(setup);bad=failure.new_page();bad.route('**/camera-guides/*',lambda route:route.abort())
    bad.goto(args.url);bad.get_by_role('button',name='วิดีโอ',exact=True).click();camera(bad)
    bad.get_by_text('ภาพคนโหลดไม่ได้ · ใช้ไกด์เส้นแทน',exact=True).wait_for()
    assert bad.locator('.g-zone').count()==1 and bad.get_by_role('button',name='เริ่มอัด',exact=True).is_enabled()
    bad.screenshot(path=str(out/'missing-image-390.png'));failure.close()
    passed('missing illustration leaves line guide, meaningful status and camera recording available')
    assert not errors,errors
    b.close()
    (out/'verification.json').write_text(json.dumps({'checks':checks,'errors':errors,'limits':['Chromium synthetic camera only; no physical iPhone/Safari','AI illustration screened by agent, not professionally verified']},ensure_ascii=False,indent=2))
