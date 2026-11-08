"""Generate tiny, original ball videos. Requires ffmpeg, no Python packages."""
import argparse
import math
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('directory', nargs='?', default='/tmp/swinglog-analysis-fixtures')
args = parser.parse_args()
folder = Path(args.directory); folder.mkdir(parents=True, exist_ok=True)
for name in ['moving', 'lost']:
    proc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '640x360', '-r', '30', '-i', '-', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', str(folder / (name + '.mp4'))], stdin=subprocess.PIPE)
    for frame in range(90):
        pixels = bytearray(bytes([25, 40, 30]) * (640 * 360))
        if name != 'lost' or frame < 30:
            cx, cy = 160 + frame * 3, 280 - frame
            for y in range(cy - 4, cy + 5):
                for x in range(cx - 4, cx + 5):
                    if math.hypot(x - cx, y - cy) <= 4:
                        i = (y * 640 + x) * 3; pixels[i:i+3] = bytes([245, 245, 245])
        proc.stdin.write(pixels)
    proc.stdin.close()
    if proc.wait() != 0: raise RuntimeError('ffmpeg failed')
print(folder)
