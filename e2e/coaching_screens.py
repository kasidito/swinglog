"""Supplementary review captures; camera stream and session are synthetic."""
import argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://localhost:5177/')
parser.add_argument('--evidence',default='/tmp/swinglog-coaching-final')
args=parser.parse_args()
folder=Path(args.evidence);folder.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-fake-device-for-media-stream'])
    context=browser.new_context(permissions=['camera'],viewport={'width':390,'height':844})
    page=context.new_page();page.goto(args.url)
    def capture(name):
        page.evaluate('document.fonts.ready')
        page.screenshot(path=str(folder/name),full_page=True)
    page.get_by_role('button',name='ตั้งค่า',exact=True).click();capture('settings-light-390.png')
    page.get_by_role('button',name='ฝึก',exact=True).click()
    page.get_by_role('button',name='เริ่มเซสชัน',exact=True).click();capture('session-light-390.png')
    page.get_by_role('button',name='จบก่อน',exact=False).click();capture('summary-light-390.png')
    page.get_by_role('button',name='วิดีโอ',exact=True).click();capture('video-light-390.png')
    page.get_by_role('button',name='เปิดกล้องพร้อมกรอบจัดตำแหน่ง').click()
    page.wait_for_function('document.querySelector(".cam video")?.videoWidth>0')
    page.screenshot(path=str(folder/'camera-synthetic-390.png'))
    page.locator('.cam').get_by_role('button',name='ปิด',exact=True).click()
    page.set_viewport_size({'width':1440,'height':1000})
    page.get_by_role('button',name='ฝึก',exact=True).click()
    page.locator('.coaching-entry img').evaluate('(i)=>i.decode()')
    capture('home-light-1440.png')
    browser.close()
print('PASS: additional settings/session/summary/video/synthetic-camera/desktop captures')
