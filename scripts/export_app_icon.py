"""Export standard PWA/iOS PNG sizes from the selected generated icon master.

Only resampling and PNG encoding; no drawing, retouching or compositing.
Requires Pillow. Run from the repository root.
"""
from pathlib import Path
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
