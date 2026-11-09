"""Original three-band camera sources for preview/recording pixel comparisons.

Requires ffmpeg. Writes temporary fixtures only; no downloaded media.
"""
import subprocess
from pathlib import Path

for kind, width, height in [('landscape', 1280, 720), ('portrait', 720, 1280)]:
    third = width // 3
    bands = ','.join([
        f'drawbox=x=0:y=0:w={third}:h=ih:color=red:t=fill',
        f'drawbox=x={third}:y=0:w={third + 1}:h=ih:color=green:t=fill',
        f'drawbox=x={third * 2}:y=0:w=iw-{third * 2}:h=ih:color=blue:t=fill',
    ])
    path = Path(f'/tmp/swinglog-camera-{kind}.y4m')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi',
                    '-i', f'color=c=black:s={width}x{height}:r=30',
                    '-vf', bands, '-t', '2', '-pix_fmt', 'yuv420p', str(path)], check=True)
    print(path)
