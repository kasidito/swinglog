# E2E tests (Playwright for Python, headless Chrome)

Run from this folder against the single-file build:

```
npm run build:single
ffmpeg -f lavfi -i testsrc=size=360x640:rate=30 -t 3 -pix_fmt yuv420p -c:v libx264 test.mp4
python3 smoke.py ../dist-single/index.html   # session flow, settings, tray mode, persistence
python3 video.py ../dist-single/index.html   # video screen, frame step, lines, tracer, logging
python3 extra.py ../dist-single/index.html   # pose fallback offline, backup import
```

The scripts expect Chrome at /usr/bin/google-chrome; change `executable_path` if needed.

python3 cam.py ../dist-single      # in-app camera with framing guide (fake camera device)
