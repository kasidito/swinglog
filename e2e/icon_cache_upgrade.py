"""Update an old icon precache in-place while retaining actual IndexedDB practice data.

Requires an older production build with the book at apple-touch-icon.png.
This is a browser service-worker test, not a native iOS Add to Home Screen test.
"""
import argparse
import hashlib
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--before-build',required=True)
parser.add_argument('--after-build',default='dist')
parser.add_argument('--evidence',default='/tmp/swinglog-icon-cache-upgrade')
args=parser.parse_args()
old=Path(args.before_build).resolve();new=Path(args.after_build).resolve()
before=hashlib.sha256((old/'apple-touch-icon.png').read_bytes()).hexdigest()
after=hashlib.sha256((new/'apple-touch-icon-flight-s.png').read_bytes()).hexdigest()
assert before!=after,'The before build must contain the old book icon'
release={'path':old}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(release['path']),**kw)
    def log_message(self,*a):pass
    def end_headers(self):self.send_header('Cache-Control','no-cache');super().end_headers()
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://localhost:{server.server_port}/'
out=Path(args.evidence);out.mkdir(parents=True,exist_ok=True)
hash_js="""async src=>{const r=await fetch(src);if(!r.ok)throw Error(r.status);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('')}"""
read_js="""()=>new Promise((resolve,reject)=>{const r=indexedDB.open('keyval-store');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result;const q=db.transaction('keyval').objectStore('keyval').get('golf-practice-v1');q.onerror=()=>reject(q.error);q.onsuccess=()=>{resolve(q.result);db.close()}}})"""
checks=[]
try:
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        c=b.new_context(viewport={'width':390,'height':844});q=c.new_page();errors=[]
        q.on('pageerror',lambda e:errors.append(str(e)))
        q.goto(base);q.get_by_role('button',name='เริ่มเซสชัน',exact=True).wait_for()
        q.wait_for_function('navigator.serviceWorker.controller!==null')
        assert q.evaluate(hash_js,base+'apple-touch-icon.png')==before
        # Model an older page that still contains the legacy Apple link.
        q.locator('link[rel=apple-touch-icon]').evaluate("e=>e.setAttribute('href','./apple-touch-icon.png')")
        q.get_by_role('button',name='เริ่มเซสชัน',exact=True).click();q.locator('.lane .open').first.click()
        q.get_by_role('button',name='ตรง',exact=True).click()
        q.wait_for_function('async()=>{const read='+read_js+';return (await read())?.shots?.length===1}')
        saved=q.evaluate(read_js)
        proof=c.new_page();proof.goto(base+'apple-touch-icon.png')
        proof.screenshot(path=str(out/'legacy-before-390.png'))
        checks.append('old precache serves the book icon and one real test shot is saved')
        release['path']=new
        q.evaluate("window.iconControllerChanged=false;navigator.serviceWorker.addEventListener('controllerchange',()=>window.iconControllerChanged=true)")
        q.evaluate('async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()}')
        try:
            q.wait_for_function("window.iconControllerChanged || document.querySelector('link[rel=apple-touch-icon]')?.href.endsWith('apple-touch-icon-flight-s.png')")
        except Exception:
            print(q.evaluate("async()=>{const r=await navigator.serviceWorker.getRegistration();return {active:r?.active?.state,waiting:r?.waiting?.state,installing:r?.installing?.state,controller:navigator.serviceWorker.controller?.scriptURL,html:document.querySelector('link[rel=apple-touch-icon]')?.href}}"),flush=True)
            raise
        q.reload()
        q.wait_for_function("document.querySelector('link[rel=apple-touch-icon]')?.href.endsWith('apple-touch-icon-flight-s.png')")
        assert q.evaluate(hash_js,base+'apple-touch-icon.png')==after
        assert q.evaluate(read_js)==saved
        proof.reload();proof.wait_for_function('document.querySelector("img")?.complete')
        proof.screenshot(path=str(out/'legacy-after-390.png'))
        checks.append('service-worker update replaces legacy icon bytes and loads fresh Apple metadata without clearing storage')
        checks.append('session and shot IDs/counts/settings survive the update unchanged')
        c.set_offline(True);q.reload()
        assert q.evaluate(hash_js,base+'apple-touch-icon.png')==after
        assert q.evaluate(hash_js,base+'apple-touch-icon-flight-s.png')==after
        assert q.evaluate(read_js)==saved
        checks.append('current and legacy Apple icon bytes plus practice data remain available offline')
        assert not errors,errors
        b.close()
    report={'checks':checks,'errors':errors,'beforeSHA256':before,'afterSHA256':after,'limits':['Chromium cache-upgrade test; native iOS icon cache not accessible']}
    (out/'verification.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))
finally:
    server.shutdown();server.server_close()
