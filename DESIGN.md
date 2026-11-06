# SwingLog design: "Floodlit bay"

The app looks like a driving range at night: dark ground, floodlight-white text, and the range's distance-flag colours carrying the data. A daylight variant (pale concrete) exists for daytime ranges.

## Tokens (src/styles.css)
| Role | Night (default) | Daylight |
|---|---|---|
| Ground / panel / panel-2 | #0B1210 / #121B18 / #18231F | #ECEFEA / #FFFFFF / #F5F7F3 |
| Rule / rule-strong | #24332D / #34463E | #CDD5CE / #A9B5AC |
| Ink / ink-2 / ink-3 | #F2F5F0 / #A9B8B0 / #7C8C84 | #0B1210 / #4A5650 / #66726B |
| Action (fill, dark text) | #F5C451 | #F2B705 |
| Accent ink (text) | #F5C451 | #855F00 |
| Flags red / white / yellow / blue | #EF5350 / #F2F5F0 / #F5C451 / #5B9BFF | #D63A37 / #FFFFFF / #E0A800 / #2F6FE0 |
| Turf (done, straight) | #45C47E | #1E8A50 |

- The night theme is the default for new users. The settings can switch to daylight or follow the device.
- Yellow is the action colour, used as a fill. In daylight, yellow text uses `--accent-ink`, because #E0A800 on a light background fails contrast.

## Type
- Anuphan for all UI and Thai text (weights 400 to 700). Barlow Condensed (600/700) for numbers, like the distance signs at a range.
- Both are self-hosted through Fontsource and precached by the service worker. The app no longer loads Google Fonts.

## Signature elements
- **Range lane** (session screen): each drill is a flag at 100/150/200/250, using the flag colours in order. A finished drill's flag turns turf green. The next drill sits under a soft floodlight glow and gets the yellow "เสร็จ" ("Done") button.
- **Amount board** (home screen): large condensed numbers, like the sign at a hitting bay.
- **Dispersion fan** (summary screen): seen from the tee, five lanes fan out and each one's length shows its share of shots. Straight is turf green.
- **App icon**: a yellow flag on a white pole under a floodlight glow, a white ball on a turf horizon, all on the night ground. Files: public/icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png.

## Rules
- No emoji. Icons are inline SVG.
- No gradient text, no big-number stat-tile templates, no cards inside cards, no left-border accents.
- Lists are rows separated by rules inside one panel, not grids of cards.
- Text selection, scrollbars and focus rings use the theme colours. The focus ring is a 2px action-yellow outline.
- Tap targets are at least 44px. The home start button is sticky above the tab bar so it stays within thumb reach.
- Reduced motion turns off all transitions.
