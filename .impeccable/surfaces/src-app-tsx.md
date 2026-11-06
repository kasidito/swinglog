---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/Analyze.tsx","src/styles.css"]
---

# Surface: SwingLog app (all screens)

Scope: the whole PWA shell, home, session, drill, video, history, settings. Mode: Operate (the golfer completes a practice task in a hitting bay).

Audience and task: amateur golfer at a Thai driving range, phone in one hand, club in the other, often at night under floodlights. Picks time or trays and a problem, works through drills, taps where each ball went, reviews swing video.

Constraints: one-handed, readable in glare and darkness, 44 px targets, Thai first, offline, no emoji, approximate data labelled.

Roll: degraded (roll service unreachable, no challengers). Assigned candidate 4 (club scorecard) was presented with the pick card (night range); the user chose the pick.

## Direction contract

THESIS: The app is the floodlit bay you are standing in: distance flags tell you where you are in the session. It refuses the green-card sports app with a mown-turf hero.

OWN-WORLD: Bay-night ground, a green-black, with floodlight-white type. The range's distance-flag colours are the only data palette: red 100, white 150, yellow 200, blue 250, plus turf green for done and straight. Condensed bay-sign numerals for every number; a clean Thai sans for words. Thin turf-line rules, no cards inside cards. A daylight variant swaps the ground to pale concrete and keeps the flags.

STORY: The golfer sees what to do next and how far through the session they are, without reading paragraphs, and leaves knowing which way their balls went.

FIRST VIEWPORT: Home: wordmark top left, the question as the heading, then the amount board: the chosen minutes or trays as a large condensed numeral with the options beside it, then the problem list, and the yellow primary action anchored at the bottom above the tab bar.

FORM: Night driving range, my top-ranked grounded candidate (1 of 7), chosen as IMPECCABLE'S PICK over assigned candidate 4. seed:a809cdcc8abd00d8. Signature move: the session drawn as a range lane, each drill a target flag at its distance (100, 150, 200...) up a vertical lane; finishing a drill lights its flag, and the next drill sits under the floodlight.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
