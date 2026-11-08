---
name: SwingLog
description: A Thai-first illustrated coach handbook for short golf practice sessions.
colors:
  action: "#205B3E"
  on-action: "#FFFFFF"
  ground: "#F7F7F0"
  panel: "#FFFFFF"
  panel-2: "#EDF2E9"
  rule: "#D8DFD3"
  rule-strong: "#A3B29F"
  ink: "#18382B"
  ink-2: "#52604F"
  ink-3: "#626D60"
  accent-ink: "#245D40"
  turf: "#21613F"
  notice-bg: "#E9F0E2"
  notice-ink: "#29432E"
  flag-red: "#B84439"
  flag-white: "#FFFFFF"
  flag-yellow: "#AA781B"
  flag-blue: "#326694"
  dark-action: "#BEDBB1"
  dark-on-action: "#183425"
  dark-ground: "#121D17"
  dark-panel: "#1B2A21"
  dark-panel-2: "#25382A"
  dark-rule: "#394C3D"
  dark-rule-strong: "#617660"
  dark-ink: "#F2F3E9"
  dark-ink-2: "#C2CDBB"
  dark-ink-3: "#A3B59F"
  dark-turf: "#A6D2A2"
  dark-notice-bg: "#293B27"
  dark-notice-ink: "#D8E8CE"
  dark-flag-red: "#F19B86"
  dark-flag-white: "#F2F3E9"
  dark-flag-yellow: "#E0C28A"
  dark-flag-blue: "#9BC4E6"
  photo-ground: "#ECEDE4"
  photo-label: "#FFFEF8"
  dialog-backdrop: "#0E1C17C9"
typography:
  headline:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  instruction:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.65
  title:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  amount:
    fontFamily: "Anuphan, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.04em"
rounded:
  control: "12px"
  surface: "18px"
  small: "8px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  panel: "20px"
  page: "24px"
  section: "26px"
  wide: "40px"
  navigation-clearance: "116px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "56px"
    width: "100%"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "{spacing.panel}"
  input-number:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.small}"
    padding: "8px"
  amount-selected:
    backgroundColor: "{colors.action}"
    textColor: "{colors.on-action}"
    rounded: "{rounded.control}"
    padding: "6px 4px"
    height: "84px"
  navigation-active:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "60px"
  self-check:
    backgroundColor: "{colors.panel-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px 18px"
---
# Design System: SwingLog

## Overview

**Creative North Star: "The Coach Handbook"**

SwingLog is a calm, practical handbook opened beside a hitting bay. Cream paper, forest controls and generous margins let a realistic fictional human demonstration lead the golfer into one short Thai action and an observable self-check. The screen supports reading and doing at the golfer’s pace.

The story runs from practice plan to session, illustrated steps, shot logging and history. The opening setup photograph and time selector establish that purpose. Light is the default for new users; saved light, dark or device preferences remain respected. This document replaces the former “Floodlit bay” direction and records the current code, rather than a pixel composition.

**Key Characteristics:**

- Image first; one action and one observable self-check per step.
- Cream and forest in daylight; deep green and pastel action in dark mode.
- One Anuphan voice for Thai, Latin and numerals.
- Manual steps, image zoom and a persistent four-tab shell.

## Colors

Cream paper and muted forest give the app a patient teaching voice. The frontmatter owns exact values; unprefixed tokens map to the light CSS custom properties, while `dark-*` tokens are their theme counterparts. Dark `accent-ink` shares `dark-action`.

### Primary

- **Forest action** (`action`): selected amounts, next actions, current step and start button, paired with `on-action`.
- **Pastel leaf action** (`dark-action`): the same roles at night, paired with `dark-on-action`.
- **Turf** (`turf`, `dark-turf`): completed practice and straight-shot feedback. Action and success roles remain distinct.

### Neutral

- **Cream paper / deep green** (`ground`, `dark-ground`): page canvas and fixed navigation.
- **Paper / forest surfaces** (`panel`, `panel-2` and dark counterparts): bordered groups, active navigation and self-check panels.
- **Forest ink** (`ink`, `ink-2`, `ink-3` and dark counterparts): primary, supporting and quiet text.
- **Fine rules** (`rule`, `rule-strong` and dark counterparts): dividers, outlines and form boundaries.
- **Photo paper** (`photo-ground`, `photo-label`): the neutral loading stage and legible labels over images, including in dark mode.
- **Notice** tokens: restrained status panels. Flag red, white, yellow and blue remain semantic visual data colors; they do not restore the old yellow-led identity.

## Typography

**Display, Body and Numerals:** Anuphan, with system-ui and sans-serif fallbacks. Thai and Latin weights 400, 500, 600 and 700 are self-hosted through Fontsource; remote fonts and the former condensed imports are absent.

The type is open and readable, with room for Thai marks and full sentences. Headings express the task; supporting copy stays short and direct.

### Hierarchy

- **Headline:** 32px / 1.4, 700, −0.025em; page task headings.
- **Instruction:** 22px / 1.65, 600; the current action beside its numbered marker.
- **Title:** 17px / 1.35, 600; section labels.
- **Body:** 16px / 1.5, 400; instructional copy. Introductory text uses 1.65 and self-check paragraphs use 1.75 line height.
- **Label:** 14px / 1.5; metadata, fields, captions and secondary instructions.
- **Amount:** 30px / 1.2, 700, −0.04em; time or tray selection. Statistics retain tabular figures and may use 44px.

Large text sets body to 19px, supporting text to 16px, section headings to 20px and page headings to 34px; instruction headings become 24px. The regular headline remains 32px because the handbook override follows the earlier base scale.

**The One Voice Rule.** Use self-hosted Anuphan for interface text and numerals. Numeric measures may use tabular figures, without a second display family.

## Layout

A single reading column is centered at a maximum width of 720px. The phone screen uses 24px side margins, 28px top padding and 26px section gaps. At 640px and above it uses 40px side margins, 36px top padding and 32px section gaps. At 375px and below, side margins reduce to 18px.

Main content reserves 116px bottom clearance. The fixed tab bar shares the 720px container width and adds the device safe-area inset. Tabs are hidden on the drill screen. Settings lives behind the 44px header gear. The start action participates in normal document flow.

The first home composition combines the setup photo entry and time/tray board. The entry uses a 43% image column, changing to 38% on wider screens. Lesson rows use a photograph and a flexible text column with horizontal dividers. Instruction images remain square and cap at 520px in the wider layout. Controls wrap instead of truncating Thai text.

## Elevation & Depth

The system is flat and layered by paper tone, fine borders and spacing. Cards, the start action and fixed navigation carry no ambient drop shadow or blur. The expanded-image dialog uses a dark scrim; the photo’s zoom label uses the small local shadow `0 1px 8px #18382B18` to remain legible over the photograph. This local image treatment is not a card elevation scale.

**The Paper Surface Rule.** Use tonal surfaces and fine rules for grouping. Resting cards and the start action have no floating shadow.

Button press feedback scales to 0.98 over 0.1s; background state changes use 0.15s. Reduced motion disables transitions and animations. Focus is a visible 2px action-colored outline with a 2px offset.

## Shapes

Surfaces and image frames use 18px corners; controls, thumbnails and self-checks use 12px; smaller photo labels and numeric inputs use 8px. Chips and unit switches are pills. Step markers, step selectors and the settings gear are circles. Outlines are normally 1px; borders and tonal fills make grouping clear without decorative edge accents.

## Components

### Buttons

Direct Thai verbs, generous target areas and a quiet secondary hierarchy. Standard controls use 12px corners, 10px 16px padding and a 44px minimum target. The full-width primary button is at least 56px high, action-filled with on-action text and a 700 weight. Secondary buttons are transparent with a strong rule; ghost actions use underlined supporting ink. Disabled controls use panel-2 and quiet ink. Hover inherits the resting appearance; keyboard focus and press feedback carry the explicit interaction treatments.

### Chips and amount controls

Outlined pills use ink text and 0 16px padding; selection reverses to ink fill and paper text. Amount controls are at least 84px high with 12px corners, Anuphan numerals and a separate unit line; selection switches to action fill and on-action text. Use `aria-pressed` to expose selection.

### Cards / Containers

White or forest panels use 18px corners, a fine rule and 20px internal padding. Sessions, symptom choices and history prefer connected rows within one group. Active session rows use panel-2; the older decorative flag illustration is hidden. Self-check panels use 12px corners and 16px 18px padding.

### Inputs / Fields

Numeric analysis fields use panel fill, strong rules, 8px corners, 8px padding and at least 44px height. Checkboxes and zoom ranges use the current action color. Inputs inherit Anuphan and the shared keyboard focus treatment.

### Navigation

Four fixed tabs read **ฝึก / ท่าพื้นฐาน / วิดีโอ / ประวัติ**, with inline SVG icons above their labels. Each has a minimum 60px height and 12px corners; the active page uses panel-2, primary ink and semibold text. Normal labels are 13px, narrow-phone labels 12px and large-text labels 16px. The header gear opens settings. Tab buttons expose `aria-current="page"` and are hidden during a drill.

### Illustrated instruction viewer

**The Image–Action–Check Rule.** Present the demonstration, one short Thai action, then an observable self-check in that order. Diagrams remain supplementary.

Display step count and handedness before a realistic photographic illustration. Three-frame local image strips are cropped to the chosen step, never autoplayed. Source handedness is recorded per asset and normalized before mirroring for the golfer; HTML target labels and Thai copy remain outside the mirrored layer. Put target direction and ball-position context beside the image.

Previous/next controls and numbered 44px step buttons allow manual navigation; local progress survives tab changes and reloads. Tapping the image opens a native dialog with a 1–3× zoom range, scrollable image and explicit close action; closing restores focus to the opener. Loading and image failure show readable status copy while action and self-check text remain available.

Illustrations depict a fictional AI-generated demonstrator. Keep the disclosure near the material and source links below it. A golf professional’s review and comprehension checks with three real beginners are pending. Images are not angle or stance-distance measurement standards.

## Do's and Don'ts

### Do:

- Do pair every instructional step with a visible demonstration, short Thai action and observable self-check.
- Do keep Thai copy and target labels outside the mirrored image wrapper; normalize source handedness per asset before adapting it to the golfer.
- Do keep interactive targets at least 44px and reserve 116px beneath main content for fixed navigation.
- Do retain saved theme and instruction progress, support large text and reduced motion, and allow image zoom.
- Do label AI illustrations as fictional and keep professional review and tests with three real beginners explicitly pending.

### Don’t:

- Don’t autoplay instructional steps or make a diagram the primary human demonstration.
- Don’t reintroduce the condensed numeral face, floodlight glow or yellow primary action from the superseded design.
- Don’t use emoji, gradient text or decorative nested card grids; use inline SVG and rule-separated rows.
- Don’t present AI illustrations, simulated personas or automated screening as professional approval, real-user validation or measured ball-flight evidence.
