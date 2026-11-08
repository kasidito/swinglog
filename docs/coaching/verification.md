# Verification — 2026-11-08

Branch: `feat/visual-coaching-redesign`, based on analysis branch commit `4545d6e` (PR #12). No production deploy or merge was performed. CI deploys only `main`; the feature branch triggers checks only.

| Check | Actual result |
|---|---|
| `npm test` | 56 tests passed in six files, including all original 50 and six content/compatibility checks |
| `npm run build` | TypeScript and production build passed; Workbox precaches 48 entries, ~4.27 MiB including media |
| `npm run build:single` | Passed; 26 adjacent WebP files preserved under `dist-single/coaching/` |
| Media verification | 26 sheets × 3 square frames = 78 frame views; 2172×724 each; 3,743,204 bytes total; recorded size and embedded exact prompt verified for every selected asset |
| Browser coaching acceptance | Passed all ten check groups in `browser-results.json` |
| Responsive/inclusion matrix | 360/390/768 px × light/dark × normal/large text × right/left = 24 combinations, across settings, library, lesson, plan, video and history; no horizontal document overflow |
| Instruction behavior | All 20 drills and six foundations loaded; direct step selection; keyboard image opening, 2× zoom, Escape and focus return; readable missing-media fallback |
| Data compatibility | Imported schemaVersion 1 history/shot fixture unchanged; related foundation returns to same step and shot count; active session and last instruction step survived reload |
| Offline | Production PWA reloaded offline and opened images in all six foundations and all 20 drills after initial online cache |
| Analysis regression | All 13 browser groups passed: actual classic MediaPipe worker, 2D pose comparison, synthetic tracking, correction, loss without fabricated landing, cancellation/reset, invalid inputs/codec, cold model failure, warm-cache offline inference, no off-origin media uploads |
| Camera | Synthetic landscape camera retained native 1280×720 recording |
| Source/media screening | Agent visually screened selected sheets and revised evident ball, shaft, grip-gap, line, target and aid-placement errors; this is not expert verification |
| Design review | Fresh Impeccable reviewer inspected phone/tablet/1440 desktop captures. Three required fixes—persisted contract/limitations, authored SVG replacing missing glyphs, current DESIGN.md/sidecar—were scored resolved in a verdict pass. That scoped `ship` verdict covers those three fixes, not technical golf correctness or blanket approval of every surface |
| Human comprehension / professional golf accuracy | **Not performed**, both remain pending; see `human-review.md` |

The context launcher, automated detector and independent FORM seed gate did not pass in this environment; no complete automated Impeccable compliance is claimed. The supplied user brief is the design authority.

## Review captures

All captures show the actual locally built app. History/session examples are synthetic; the camera screenshot uses Chromium's synthetic device. No real-user swing video or public human pose test fixture is committed.

| Screen | Capture |
|---|---|
| Practice, phone / desktop | [390px](screenshots/home-light-390.png), [1440px](screenshots/home-light-1440.png) |
| Foundations | [Library](screenshots/foundations-light-390.png) |
| Drill and ball logger | [Path gate](screenshots/path-gate-light-390.png) |
| Grip, both theme/size examples | [Light 768px](screenshots/grip-light-768.png), [dark/large/left 360px](screenshots/grip-dark-large-left-360.png) |
| Image zoom | [Dark/large/left](screenshots/zoom-dark-large-left-360.png) |
| Plan and summary | [Plan](screenshots/session-light-390.png), [summary](screenshots/summary-light-390.png) |
| History and settings | [History](screenshots/history-light-390.png), [settings](screenshots/settings-light-390.png) |
| Video, camera, analysis | [Video](screenshots/video-light-390.png), [synthetic camera](screenshots/camera-synthetic-390.png), [synthetic tracking](screenshots/analysis-synthetic-390.png) |

Fixed bottom navigation appears at its viewport position in full-page browser captures, even though the document continues below it. The app reserves 116px bottom clearance; automated scrolling and interaction tests confirmed access to controls. This capture behavior was not counted as proof of a navigation obstruction.

## Reproduce

Use the commands in `README.md`, then `python e2e/coaching_screens.py` for the supplemental captures. Tests require a local HTTP server. The optional real-pose regression fixture is a locally prepared public MediaPipe sample used only to exercise inference; it is not a golf accuracy test and must not be presented as one. Physical iOS/Safari devices were not available; browser evidence here is Chromium, including synthetic camera input.
