# Correction after the iPhone Add to Home Screen report

The user's real iPhone screenshot showed the old book icon despite the new icon being published. Do not dismiss that screenshot as a successful update or claim that native installation was already verified.

## Findings and corrections

- Live HTML and manifest referenced Flight S, but legacy `apple-touch-icon.png`, PNG and SVG URLs still served the book. A cached page or native fallback could request those. All compatibility icon URLs now serve the current artwork; a fresh Apple icon filename is explicitly linked for normal and precomposed lookup.
- The old generated service worker contained a SKIP_WAITING message listener but did not activate itself. A browser upgrade test reproduced a new worker stuck in `waiting: installed` with the old page/icon still active.
- With `injectRegister:false`, vite-plugin-pwa 1.0.0 does not automatically set Workbox's `skipWaiting` from `registerType:autoUpdate`. Set `workbox.skipWaiting:true` explicitly alongside `clientsClaim:true`, preserving the existing automatic-update policy.
- The new SVG compatibility file embeds the exact current 512px PNG; every PNG compatibility alias is byte-identical to its current canonical size. The export script reproduces them.

No data migration, storage deletion, origin/start URL change, or new icon artwork is involved. The same IndexedDB key, session IDs and shot records are retained.

## Verification

`e2e/app_icon.py` checks both Apple link forms, manifest metadata, current dimensions, legacy/canonical byte equality, legacy SVG rendering and offline retrieval. It now reads remote manifests through browser fetch; the test API client's direct IPv6 route was unavailable in this environment.

`e2e/icon_cache_upgrade.py --before-build /path/to/old-dist` uses an isolated local origin and a real older production build. It caches the old book, simulates a cached legacy Apple link, records a real test shot through the UI, switches the server to the corrected build, updates the worker, and checks that new metadata/icon bytes load while the entire saved state stays identical. It then reloads offline and checks both icon forms and practice data again. Supply an older build that actually contains the book; the test rejects a fixture already using Flight S.

This verifies a Chromium browser/service-worker upgrade. It does **not** verify iOS's private launcher/icon cache or a physical Add to Home Screen sheet. The user's next iPhone check is still required. Suggested recovery is to cancel the old sheet, reopen the app online in Safari, reload, and open Add to Home Screen again. Do not clear website storage or delete the installed PWA as an unqualified recovery step; that can remove device-local practice data.

Passed on 2026-11-09: 67 unit tests, TypeScript, PWA/single-file builds, [six current/legacy browser groups](compatibility-results.json), and [four cache-upgrade groups](cache-upgrade-results.json). Before the activation fix, the upgrade test timed out with the worker `waiting: installed`; after the explicit setting, the same test passes. Inspect the legacy URL [before](legacy-before-390.png) and [after](legacy-after-390.png). These are browser image documents, not simulated native installation sheets.

Fresh [review after the user's screenshot](compatibility-review.md): `disposition: ship` for the web/PWA correction, with native iPhone confirmation still pending.
