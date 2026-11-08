"""Verify native recording geometry with a synthetic landscape camera."""
import argparse
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url',default='http://localhost:5175/');args=parser.parse_args()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-fake-device-for-media-stream'])
 context=b.new_context(permissions=['camera'],viewport={'width':390,'height':844})
 context.add_init_script('''const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=opts=>get({video:{width:{exact:1280},height:{exact:720},frameRate:30},audio:false});''')
 page=context.new_page();page.goto(args.url);page.get_by_role('button',name='วิดีโอ',exact=True).click();page.get_by_role('button',name='เปิดกล้องพร้อมกรอบจัดตำแหน่ง').click();page.wait_for_function('document.querySelector(".cam video")?.videoWidth===1280');page.get_by_role('button',name='เริ่มอัด',exact=True).click();page.wait_for_timeout(1100);page.get_by_role('button',name='หยุดอัด',exact=True).click();page.locator('.lab-disclosure > summary').click();page.locator('.analysis-lab').wait_for();print(page.locator('.analysis-meta').inner_text());assert '1280 × 720' in page.locator('.analysis-meta').inner_text();b.close();print('PASS: fake landscape camera retains native 1280x720 recording')
