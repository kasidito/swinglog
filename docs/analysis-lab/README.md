# SwingLog video analysis lab

Experimental implementation for one phone, local processing and manual correction. No account, paid API or video upload. Existing session storage and backup schema remain unchanged.

## Try it

Run `npm ci` and `npm run dev` (default port 5173), open the app, and select **วิดีโอ** → choose a short clip. For the full offline experience, use `npm run build`, serve `dist/` over localhost or HTTPS, open online first, and run a pose analysis before going offline. `npm run build:single` still emits one HTML file with an inline classic worker, but does not register a service worker.

1. Select Face-on or DTL. The choice is metadata and filming guidance, not an automatic camera-angle detector.
2. Select a window of at most ten seconds. Mark Address, Top, Impact and Finish by seeking the visible video; partial markers are allowed but their order must be increasing.
3. Run **วิเคราะห์สวิงทั้งช่วง**. This samples up to 120 regular images plus marked phases, uses MediaPipe in a worker, and retains only reliable samples. Comparisons need a usable Address and another marked phase. Missing/occluded evidence is omitted, not diagnosed.
4. For ball tracking, first mark Impact, pause where the ball is visible, then select **กำหนด / แก้จุดลูก** and tap the evidence frame. Keyboard users can move the crosshair with arrows (Shift for larger steps), Enter to confirm, Escape to cancel.
5. Run **ติดตามลูกต่อจากจุดล่าสุด**. The seed must be inside the selected window, at/after Impact and before its end. On loss, jump to the failed time, seek until the ball is visible, correct the point and resume. Correcting a point removes downstream observations.
6. Export **ส่งออกผลวิเคราะห์ JSON** before switching clips or leaving the video tab. Video and results are not retained across navigation/reload. The original video remains wherever the user obtained it; in-app recording is still memory-only.

Do not film in a way that puts a phone or person in another golfer's hitting area. Use a stable stand with sufficient body/club space for swing analysis; ball tracking may require a different view with more sky. Native camera recording preserves its original aspect ratio and pixels instead of center cropping through a 9:16 canvas. Requested 60fps is a preference, not a measured guarantee.

## What is implemented

- Local file metadata, finite duration/range validation, unsupported-media messages. Honest ±0.033-second step controls replace the inaccurate ±1-frame claim. FPS is shown as unknown.
- Sequential seek-and-read decoder separate from the visible player, longest image side at most 640 pixels, bounded sample count and cancellation. Seek targets are nudged 1ms inside a time boundary to avoid common container rounding at exact fractions; all exported times remain explicitly approximate **media times**, not proven capture times or exact source-frame PTS. A render turn is allowed before canvas reads. Up to two identical decoded ball images are skipped without inventing observations.
- MediaPipe Pose Lite 0.10.14 in a **classic** worker. This version uses `importScripts` internally, so a module worker fails. Production/single-file builds inline a classic worker; development serves a fixed, locally bundled worker route using the existing Vite build API, without adding packages.
- Visibility must be ≥0.5 for nose, shoulders, hips and ankles. Presence must also be ≥0.5 **if present**: the actual JS SDK can return visibility without presence. Nonfinite/out-of-frame points and a collapsed body span are rejected. This is a conservative engineering gate, not a calibrated probability of correctness.
- Timestamped normalized 2D landmarks; nearest sample within 150ms for overlays/comparisons; head displacement normalized by reference image body height and projected spine angle. No medical judgment, normative head-motion cutoff, 3D hip rotation, clubhead tracking or automatic swing score.
- A bright connected-component/frame-difference tracker around the manually selected ball with constant-velocity search guidance, global-motion rejection, ambiguity rejection, and loss stopping. No trained ball model. All line segments are dashed interpolations between samples, not a complete observed flight or predicted landing. It can still confidently follow a wrong bright object: review every result.
- Human-selected phase markers only. No unvalidated automatic Top/Impact detector is advertised.
- First-install service-worker clients claiming so prepared worker/model assets can be reused after offline reload. The pinned model/WASM URLs are already part of the app's runtime cache rules. First-time model download still requires internet; cache eviction, unsupported worker/WASM, or blocked downloads can make pose analysis unavailable. Manual tools and local ball processing remain usable.

## Export interface

The download is an **analysis-only JSON report**, not a practice-data backup and not accepted by the existing backup importer:

- `schemaVersion: 1`, `kind: swinglog-analysis-experiment`, export date.
- `clip`: filename, MIME type, byte size, original width/height and media duration. No video bytes or blob URLs.
- `view`, `handedness`, `timing`, sampling description, model/algorithm identity and quality gate.
- `phaseMarks` / `phaseSource: manual`, `poseSamples` (time plus landmarks or null), and supported phase comparisons.
- `ballTracking`: timestamped normalized points with `manual`/`detected` source, `stoppedAt` and reason. Detection describes this baseline finding a candidate, not certainty it is a golf ball.
- `selectedRange`: current form selection, not a claim that all retained results were generated under that range. Actual retained samples/points carry their own times.
- `run`: most recent task kind/state, user-readable status and progress. States are idle/running/completed/partial/cancelled/unavailable; export is disabled during a run. Correcting the track marks it idle until rerun. Full result clearing resets all lab state.

Clip filenames may contain personal information; the report is created locally and shared only if the user chooses to send the downloaded file. There is no automatic import, server, telemetry or new IndexedDB table.

## Reproduce checks

```bash
npm test
npm run build
npm run build:single
python3 e2e/make_analysis_fixtures.py
python3 -m http.server 5175 --directory dist
# in another terminal:
python3 e2e/analysis_lab.py
python3 e2e/analysis_camera.py
```

Requires Python Playwright, Chromium (`/usr/bin/chromium`, adjust locally if needed), and ffmpeg for original generated fixtures. No new npm dependencies. To test real inference as well, supply `--pose-clip /path/to/local/full-body-video.mp4`; `--url` and `--evidence` are configurable. The optional fixture should show a person clearly; it need not be a golf swing to check loading/inference/offline wiring. Never label that result golf accuracy.

During development an extra full-body smoke fixture was made from Google's public sample `https://storage.googleapis.com/mediapipe-assets/pose.jpg`, looped into a one-second MP4 using ffmpeg. It was used locally only; the source image, derived video and screenshots containing it are not redistributed in this repository. Evidence for the synthetic moving-ball scene is original generated content.

See `verification.json` for actual results. Full golf clips in daylight/night, small distant balls, moving backgrounds, left-handed swings and physical iPhone Safari/Home Screen remain to be evaluated. Chromium emulation does not establish Safari compatibility, calibrated biomechanics, or real-world tracking accuracy. Do not enable a broad release based on these smoke checks alone.
