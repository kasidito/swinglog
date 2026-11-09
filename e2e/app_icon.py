"""Check active browser/iOS/PWA icon assets and offline retrieval, not OS icon refresh."""
import argparse
import json
from pathlib import Path
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--url',default='http://localhost:5181/')
parser.add_argument('--evidence',default='/tmp/swinglog-icon-v3')
args=parser.parse_args();out=Path(args.evidence);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    c=b.new_context(viewport={'width':390,'height':844});q=c.new_page();errors=[]
    q.on('pageerror',lambda e:errors.append(str(e)))
    q.goto(args.url);q.get_by_role('button',name='เริ่มเซสชัน',exact=True).wait_for()
    favicon=q.locator('link[rel=icon]').get_attribute('href')
    apple=q.locator('link[rel=apple-touch-icon]').get_attribute('href')
    assert favicon.endswith('icon-v3-32.png') and apple.endswith('apple-touch-icon-flight-s.png')
    assert q.locator('link[rel=apple-touch-icon-precomposed]').get_attribute('href')==apple
    manifest_url=urljoin(q.url,q.locator('link[rel=manifest]').get_attribute('href'))
    manifest=q.evaluate('async u=>{const r=await fetch(u);if(!r.ok)throw Error(r.status);return r.json()}',manifest_url)
    assert manifest['name']=='SwingLog'
    assert manifest['start_url']=='.' and manifest['display']=='standalone'
    icons=manifest['icons'];assert len(icons)==2
    assert {i['src'] for i in icons}=={'icon-v3-192.png','icon-v3-512.png'}
    assert all(i['purpose']=='any maskable' and i['type']=='image/png' for i in icons)
    sources=[favicon,apple]+[urljoin(manifest_url,i['src']) for i in icons]
    dimensions=q.evaluate('''async sources=>Promise.all(sources.map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve([i.naturalWidth,i.naturalHeight]);i.onerror=reject;i.src=src})))''',sources)
    assert dimensions==[[32,32],[180,180],[192,192],[512,512]],dimensions
    legacy=['apple-touch-icon.png','apple-touch-icon-precomposed.png','apple-touch-icon-v3.png','icon-192.png','icon-512.png','icon.svg']
    sources += [urljoin(args.url,src) for src in legacy]
    equal=q.evaluate('''async base=>{const hash=async name=>{const r=await fetch(new URL(name,base));if(!r.ok)throw Error(name);return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))).join(',')};return Promise.all([['apple-touch-icon.png','apple-touch-icon-flight-s.png'],['apple-touch-icon-precomposed.png','apple-touch-icon-flight-s.png'],['icon-192.png','icon-v3-192.png'],['icon-512.png','icon-v3-512.png']].map(async ([a,b])=>(await hash(a))===(await hash(b))))}''',args.url)
    assert all(equal),equal
    svg=q.evaluate('async u=>(await fetch(u)).text()',urljoin(args.url,'icon.svg'))
    assert 'data:image/png;base64,' in svg and '<path' not in svg
    svg_size=q.evaluate('src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve([i.naturalWidth,i.naturalHeight]);i.onerror=reject;i.src=src})',urljoin(args.url,'icon.svg'))
    assert svg_size==[512,512]
    q.wait_for_function('navigator.serviceWorker.controller!==null')
    c.set_offline(True);q.reload();q.get_by_role('button',name='เริ่มเซสชัน',exact=True).wait_for()
    results=q.evaluate('async sources=>Promise.all(sources.map(async src=>(await fetch(src)).ok))',sources)
    assert all(results),results
    assert not errors,errors
    c.set_offline(False)
    # Actual asset previews, not simulated device test claims.
    preview=(Path(__file__).resolve().parents[1]/'docs/branding/icon-v3/preview.html').read_text()
    q.set_content(preview.replace('../../../public/',args.url))
    q.wait_for_function('[...document.images].every(i=>i.complete&&i.naturalWidth>0)')
    for width in [390,1440]:
        q.set_viewport_size({'width':width,'height':1000})
        assert not q.evaluate('document.documentElement.scrollWidth>innerWidth+1')
        q.screenshot(path=str(out/f'preview-{width}.png'),full_page=True)
    b.close()
    report={'checks':['active favicon and both Apple touch links reference current assets','PWA manifest has new 192/512 PNG icons and unchanged app identity/start URL','all four icon dimensions load correctly','legacy Apple/PNG URLs contain identical current artwork and legacy SVG renders it','production PWA reload and current/legacy icon URLs work offline','390/1440 size and mask previews render without overflow'], 'errors':errors,'limits':['No physical iPhone/Android install or OS icon refresh test']}
    (out/'verification.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report,indent=2))
