# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Amateur golfers at a driving range (confirmed 2026-11-06). They play occasionally, practise 10-30 minutes or 1-2 trays (40 balls a tray) at a time, stand in a hitting bay holding a club, and use one phone, one-handed, in bright daylight or under range floodlights at night. Most have no coach and cannot name their own fault precisely.

## Product Purpose

SwingLog tells a golfer what to practise right now and helps them see their own swing. It builds a short session from the time or balls they have and the problem they see (slice, hook, thin/fat, putting, chipping, bunker), walks them through each drill, records where each ball went with one tap, and reviews swing video frame by frame with lines, a ball-flight tracer and pose estimation. Success: the golfer opens it in the bay and starts a session in under 30 seconds, and over weeks sees more straight shots.

## Positioning

A free practice planner for the range bay, not a scorecard or GPS app. It suggests what to work on from the ball flights the golfer logged, counts sessions in trays as Thai ranges sell them, and never claims measured launch data.

## Operating Context

- Thai driving ranges selling balls by the tray; many open until about 22:00; some have a practice green or bunker, many do not.
- Phone propped on a bag or tripod 2.5-3.5 m away for filming; otherwise held in one hand between shots.
- Sessions are short; the app is reopened at the next range visit, often a week or more later.

## Capabilities and Constraints

- Session planner (minutes or trays, symptom, facility filter, pre-round mode), 20 drills with manually selected photographic illustration steps, self-checks, sources and secondary station diagrams, one-tap ball-flight log, history with straight %, settings (left-handed, dark, large text), JSON backup and import.
- Six foundations: grip, feet/alignment, posture, ball position, club-specific setup and swing sequence. Related lessons return to the same drill step. Illustrations use a fictional AI-generated demonstrator; they are not professional certification or biomechanical measurements.
- Video: default 9:16 in-app camera with pre-record crop/pan and matching encoded output, full-camera option, native camera or library fallback, 0.25-1x and frame stepping, angle lines, 3-tap tracer with shape hint, MediaPipe pose (head movement, spine tilt vs address).
- Manual shot demo: straight, curve and tracking loss; explicitly synthetic geometry/results with existing AI illustrations, offline and isolated from practice history. Real shot metrics remain unavailable with reasons; capture provenance does not establish verified frame timing.
- PR #12's separate analysis lab retains selected-clip phase marking, local pose worker, evidence frames, baseline ball tracking, correction, cancellation and JSON results. It cannot measure 3D flight, ball speed, spin or carry from this camera.
- Offline PWA on GitHub Pages; all data on the device (IndexedDB); videos never uploaded or stored.
- Everything free: no ads, no paid services, no accounts.
- Thai first.
- Not measured: ball speed, spin, carry. Ball flight comes from the golfer's tap or tracer and is labelled approximate.

## Brand Commitments

- Name: SwingLog.
- Voice: short, direct Thai, like a slightly better friend at the range; buttons are verbs; golf terms Thai golfers actually say (สไลซ์, ตีบาง, ตีหนา).
- No emoji anywhere.

## Evidence on Hand

- Drill content: `src/content/drills.json` (20 original IDs, 2+ source links each; not all legacy references independently verified).
- `src/content/coaching.json`: six foundations and 20 three-step drill sequences. Local generated media, exact prompts and screening notes are inventoried in `docs/coaching/`.
- Professional golf review and comprehension tests with three real beginners have not occurred. Automated tests and agent screening must not be presented as either.
- Personas in project docs are AI-simulated, not real users. No testimonials, user counts or results exist; none may be invented.

## Product Principles

1. The bay comes first: one hand, glare or darkness, a club in the other hand.
2. Tell the golfer what to do next; never make them plan.
3. Honest about measurement: approximate means labelled approximate.
4. Free and private: nothing leaves the phone.

## Accessibility & Inclusion

Readable in direct sun and at night; light defaults for new users, existing theme preferences retained; large-text option; tap targets at least 44 px. Source handedness is normalized per illustration, then adapted for left/right golfers without mirroring Thai text. Steps do not autoplay, images can be zoomed, and instruction progress is saved locally.
