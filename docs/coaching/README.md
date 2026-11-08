# SwingLog · Illustrated coaching redesign

This is a draft, stacked on PR #12 (`feat/video-analysis-lab`). It does not deploy or merge either branch.

## Implemented behavior

- Cream/forest green handbook, dark theme, self-hosted Anuphan, matching book/flag app icon. New users default to light; saved theme choices remain.
- Four tabs: practice, foundations, video, history; settings in the header. Plan summary precedes starting, active sessions have an explicit resume action.
- Six foundations and all 20 legacy drill IDs, three manually selected photo steps each. Text, numbers and target direction are separate HTML, with self-checks, alt text, image zoom and a native keyboard-accessible modal. Grip alternatives are explained in text without prescribing one for everyone.
- Related foundations return to the same drill step and shot log. Optional `coachingProgress` extends schemaVersion 1, included in backup export/import. Existing session/shot identifiers and the `golf-practice-v1` IndexedDB key are unchanged.
- Video slow playback, line drawing and manual tracing remain available. PR #12's analysis worker, evidence frames, corrections, tracking, cancellation and JSON export remain inside a separate experiment disclosure.
- Local WebP sheets are precached with app assets. Each sheet contains three equal square frames; CSS reveals a frame without retouching the generated photograph. Missing media has an explicit readable fallback.

## Sources and limits

The six new foundations were checked against the following named instruction sources; the Thai teaching text is newly written, not copied. Source advice is a starting point, not a universal joint angle or stance measurement.

| Source | Used for | Access during this work |
|---|---|---|
| [Amy Taylor, PGA · club setup](https://www.pgaplay.co.uk/learn/understanding-correct-ball-position-and-set-up-for-different-clubs/) | Wedge, middle iron and driver ball/stance starting points | Article read |
| [Joanna Coe · four fundamentals, Titleist](https://www.titleist.co.uk/videos/instruction/four-golf-fundamentals) | Finger-based grip, hip hinge, alignment, simple swing sequence | Article description and chapters read; video not professionally audited |
| [Kellie Stenzel · grip fundamentals](https://golf.com/instruction/10-golf-grip-fundamentals-improve-your-game/) | Lead/trail hands, overlap, interlock, ten-finger, comfortable grip | Article read |
| [PGA · hit the ball where you want](https://www.pga.com/story/hit-the-golf-ball-where-you-want) | Requested alignment/grip reference | Search result confirmed; direct page returned 403, not claimed fully reviewed |
| [Kevin Britt, PGA · training](https://carolinas.pga.com/news/elite-level-training-kevin-britt-pga/) | Putting gate concept | Named-coach text discovered/read in indexed source |

Old drills retain their relevant original source links, with anonymous `pages.dev` links removed and named fundamentals linked where relevant. A source link is **not** a statement that its author reviewed this app or that an AI pose reproduces their exact teaching. Several legacy drills and equipment layouts still need expert validation; original sources are not all independently validated. In particular, Titleist's Layne Savoie bunker-line page concerns low-point feedback for finesse shots; that is not proof of the separate sand-first escape technique in this app.

Safety clarifications keep the original IDs and goals: path-gate and anti-slice aids lie flat with clearance; bunker entry tees are reference points outside the strike path. Distances such as practice stations are drill setup examples, not inferred body measurements. Drill versions increment only for those three instruction clarifications.

## Media provenance and review

`media-manifest.json` records selected output, exact prompt, references, dimensions, bytes, sources and screening notes. `generation-requests.json` records initial generation briefs. Edits use image generation; PNG→WebP conversion is mechanical compression with no painting, anatomy repair or compositing. Original generated outputs remain in the execution workspace; selected compressed assets are committed under `public/coaching/`.

The manifest's original UUID paths describe generation-session artifacts, not build dependencies. For future image edits after cloning, use the corresponding committed WebP as the reference; the app and both builds need only those committed assets. The optional compression script accepts an `--originals` folder when original PNGs are available.

The instructor is fictional. Images are AI-generated illustrations and are labelled in the UI. Agent visual screening checks visible digits, hand/handle contact, shaft continuity, shoes, ball/equipment placement and action continuity. It is **not professional biomechanical validation**. Source handedness and target direction are recorded independently of the generation prompt, since the generated viewpoint can differ; only raster photos mirror, never Thai text.

No professional golf review has occurred. No beginner comprehension test with three real people has occurred. No human participant results are invented. The draft must retain those open checks. Do not describe these pictures as certified, anatomically measured or reliable diagnostic evidence.

## Verification

Run `npm test`, `npm run build`, `npm run build:single`, then serve `dist` on port 5177. Browser tooling requires Python Playwright and Chromium (`/usr/bin/chromium`); analysis fixture creation also requires ffmpeg. These are development tools, not app runtime dependencies.

```sh
python -m http.server 5177 --directory dist
python e2e/coaching.py
python e2e/make_analysis_fixtures.py
python e2e/analysis_lab.py --url http://localhost:5177/
python e2e/analysis_camera.py --url http://localhost:5177/
```

Production PWA offline availability requires one completed online installation/cache. Pose inference still needs its model/WASM on first use and can work offline only after those assets have been cached. `build:single` preserves the analysis worker; instructional media remains in its adjacent `coaching/` folder, so distribute that folder with `dist-single/index.html`.

See `verification.md` for actual results and screenshots, and `human-review.md` for the unfinished human checks.
