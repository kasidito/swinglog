"""Mechanical compression and provenance, no retouching/cropping. Requires Pillow.
Selected WebP files are committed; rebuilding the app does not need original PNGs.
"""
import argparse
import json
from pathlib import Path
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('--originals',default='/workspace/generated_images')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
manifest_path=root/'docs/coaching/media-manifest.json'
manifest=json.loads(manifest_path.read_text())
directions=json.loads((root/'src/content/media-directions.json').read_text())
lessons={l['id']:l for l in json.loads((root/'src/content/coaching.json').read_text())}
for asset in manifest:
    source=Path(args.originals)/Path(asset['path']).name
    image=Image.open(source).convert('RGB')
    assert image.width==image.height*3, (asset['id'],image.size)
    exif=Image.Exif()
    exif[270]=json.dumps({'generator':'image_gen','prompt':asset['prompt'],'reference':asset.get('reference'),'original':source.name},ensure_ascii=False)
    destination=root/asset['file']
    image.save(destination,'WEBP',quality=83,method=6,exif=exif)
    asset['dimensions']=list(image.size)
    asset['bytes']=destination.stat().st_size
    assert asset['bytes']<2*1024*1024, 'Over Workbox per-asset cache limit'
    asset['directions']=directions[asset['id']]
    asset['sources']=lessons[asset['id']]['sources']
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f"{len(manifest)} sheets / {sum(a['bytes'] for a in manifest):,} bytes, no cropping or retouching")
