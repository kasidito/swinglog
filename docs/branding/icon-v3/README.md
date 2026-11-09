# SwingLog · Flight S app icon

The new icon combines an ivory golf ball with a dimensional gold swing trail that forms an S. It retains the forest-green identity while replacing the previous book/flag symbol in active browser and PWA metadata. There is no lettering in the artwork, so it remains recognizable at home-screen size.

## Assets and installation metadata

- `master.png`: selected generated 1254×1254 opaque source. Preserve its square, full-bleed background; the operating system applies the mask.
- Browser: `public/icon-v3-32.png` (32×32).
- Apple touch icon: `public/apple-touch-icon-v3.png` (180×180).
- Manifest: `public/icon-v3-192.png` and `public/icon-v3-512.png`, both `any maskable`.
- Versioned filenames replace active references in HTML and the PWA manifest, avoiding reuse of the previous icon URL. The app name, start URL, display mode and stored practice data are unchanged.
- Legacy book icon files remain at their old URLs for compatibility; current metadata references only Flight S. The in-app flag wordmark and navigation glyphs remain the existing interface identity.

All new PNGs are opaque. The gold/ivory foreground is inside the centered 40%-radius maskable safe area: observed maximum radius 0.3566 of canvas width using the documented color threshold, supplemented by circular and rounded-square browser previews. These previews are not native device screenshots.

## Reproduce and verify

`python scripts/export_app_icon.py` exports standard sizes with Lanczos resampling and PNG encoding only. No retouching, compositing or redrawing occurs. Requires Pillow, already used by camera browser verification. [media-manifest.json](media-manifest.json) records generation prompts and selected originals; the committed master is the portable reference for future image edits.

Run `npm test`, `npm run build`, `npm run build:single`, serve `dist/` on port 5181, then run `python e2e/app_icon.py`. The script checks HTML icon links, manifest metadata, decoded dimensions, offline retrieval, and previews at 390/1440px.

The design extends the app-icon asset only; existing page colors, typography and UI remain unchanged. DESIGN.md and its tokens are preserved.

Verification on 2026-11-09: 67 unit tests, TypeScript, PWA and single-file builds passed; [five browser acceptance groups](browser-results.json) passed. Inspect the actual rendered [390px preview](preview-390.png) and [1440px preview](preview-1440.png). An initial file:// preview navigation was blocked by managed-browser policy; the final script renders the same document on the allowed HTTP page instead.

Fresh Impeccable [finish review](finish-review.md): `disposition: ship`, no material fixes.

## Existing installed PWAs

Publishing a new manifest does not guarantee that iOS or Android immediately replaces an already installed home-screen icon. App updates and operating-system icon refresh are separate. This work verifies web assets and offline availability; physical-device installation and launcher icon refresh remain untested. Do not tell users that deleting and reinstalling a PWA is required or harmless: device-local practice data may be lost. If reinstalling becomes necessary during troubleshooting, export the practice backup first.
