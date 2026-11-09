"""Export standard PWA/iOS PNG sizes from the selected generated icon master.

Only resampling and PNG encoding; no drawing, retouching or compositing.
Requires Pillow. Run from the repository root.
"""
from pathlib import Path
import base64
import shutil
from PIL import Image

root=Path(__file__).resolve().parent.parent
source=root/'docs/branding/icon-v3/master.png'
with Image.open(source) as master:
    if master.width!=master.height:
        raise ValueError('App icon master must be square')
    if 'A' in master.getbands() and master.getchannel('A').getextrema()!=(255,255):
        raise ValueError('App icon must have an opaque full-bleed background')
    image=master.convert('RGB')
    for name,size in [('icon-v3-32.png',32),('icon-v3-192.png',192),('icon-v3-512.png',512),('apple-touch-icon-v3.png',180)]:
        target=root/'public'/name
        image.resize((size,size),Image.Resampling.LANCZOS).save(target,optimize=True)
        print(target.relative_to(root),target.stat().st_size)
    # Old cached HTML and native icon lookup must resolve to the current artwork.
    for current,legacy in [('icon-v3-192.png','icon-192.png'),('icon-v3-512.png','icon-512.png'),('apple-touch-icon-v3.png','apple-touch-icon.png'),('apple-touch-icon-v3.png','apple-touch-icon-precomposed.png'),('apple-touch-icon-v3.png','apple-touch-icon-flight-s.png')]:
        shutil.copyfile(root/'public'/current,root/'public'/legacy)
    # Retain the legacy SVG URL without redrawing or approximating the artwork.
    png=base64.b64encode((root/'public/icon-v3-512.png').read_bytes()).decode('ascii')
    (root/'public/icon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><image width="512" height="512" href="data:image/png;base64,'+png+'"/></svg>\n')
