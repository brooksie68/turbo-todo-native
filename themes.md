# TurboTodo Native — Theme System & Figma Workflow

> Last updated: 2026-05-28

---

## ⚠ PIXEL-PERFECT STANDARDS — READ THIS BEFORE TOUCHING ANYTHING

This is not a "close enough" codebase. James is a UX/UI Solutions Architect with 25+ years of pixel-precise design. Every measurement in this app is either a specific dp value or has explicit flex/fill behavior defined in Figma. There is no "looks about right." There is no "roughly." There is no "visually similar." If a value doesn't match the Figma spec exactly, it is a bug — full stop.

---

### The Figma Frame IS the Spec

The T1 frame is **360×800px**. That is **mdpi (1x baseline)**. Every pixel in that frame equals exactly **1dp** (density-independent pixel). The Figma file is the sole source of truth for every size, position, color, spacing, margin, and radius in this app.

**Claude must never eyeball a screenshot to determine if a value is correct.** Screenshots are for James's on-device review only. Claude's job is to read exact numeric values from Figma programmatically and implement them exactly in code. If you cannot get the number from Figma directly, you do not have the number.

---

### The Rule of 4s

The Rule of 4s is a **strong guiding principle**, not an absolute law. Every size, margin, padding, gap, and position should be a multiple of 4dp — and in the vast majority of cases, it will be. Deviations must have a clear, logical, explainable reason. "It looked about right" is not a reason.

Valid values: `4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72...`

**Legitimate exceptions — these are not bugs:**
- **Font sizes** can force non-multiple line heights. A 15px font may require a 23px line height to look right. Typography math, not sloppiness.
- **Borders** add 1px and can push a total measurement to 23 or 25. The border is correct; the resulting total is a known artifact.
- **Flex/fill areas** have no fixed value — they expand to fill whatever space remains after fixed elements are placed. The gap between the gear icon and help icon in the header is one example: not measured, not enforced, intentionally variable. It is whatever width fits on a given phone after every fixed element is placed exactly.
- **OS-controlled values** like the Android status bar height (27px on most devices, varies across OS versions) are outside our control.

**If a Figma measurement is not a multiple of 4 and none of the above exceptions apply — flag it to James before writing any code.** Do not implement it. Do not round silently. Do not assume it's intentional. Surface it and wait for Figma to be corrected first.

---

### Android Density System — The Math That Makes Pixel-Perfect Possible

The 360×800 Figma frame is designed in dp. Android scales dp to physical pixels automatically based on screen density. This is the entire reason the system works: **get the dp value right once, and every density is mathematically correct forever.**

| Density bucket | Scale factor | Typical resolution | Notes |
|---|---|---|---|
| mdpi | 1× | 360×800 | Figma design baseline |
| hdpi | 1.5× | 540×960 | |
| xhdpi | 2× | 720×1280 | |
| xxhdpi | 3× | 1080×2400 | James's Samsung Galaxy S21 Ultra |
| xxxhdpi | 4× | 1440×3200 | Not a current target |

**Example — turbo-todo-logo-btn (40dp):**

| Density | Physical pixels |
|---|---|
| mdpi (1×) | 40px |
| hdpi (1.5×) | 60px |
| xhdpi (2×) | 80px |
| xxhdpi (3×) | 120px |

If James pixel-counts the logo on his S21 Ultra (xxhdpi/3×) and gets 114px instead of 120px, the code value is **38dp, not 40dp** — a 2dp bug. The math is exact. There is no ambiguity.

**The guarantee:** if the dp value in code matches the dp value in Figma, the rendering is mathematically correct at every density simultaneously. No visual calibration needed. It is multiplication.

---

### How Claude Audits — The Only Acceptable Process

When any question arises about whether the app matches the Figma design, this is the process. No other process is acceptable.

**Step 1 — Read the Figma value programmatically.**

Use `use_figma` Plugin API to extract values from the live Figma file. For any node, read:
- `x`, `y` (position relative to parent)
- `width`, `height`
- `fills` — read hex color directly from the fill object (see Colors section below)
- `strokes`, `strokeWeight`
- `opacity`
- `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight`
- Spatial relationships: distance from this node's edges to adjacent nodes' edges

Never read these values from a screenshot. Never estimate from visual inspection. The Figma Plugin API returns exact numbers — use them.

**Step 2 — Find the corresponding code value.**

Open the React Native source file. Find the exact StyleSheet value, theme token, or hardcoded constant that controls the property in question. Read the exact number.

**Step 3 — Compare mathematically.**

If they match: done. If they don't match: it is a bug. No interpretation, no judgment call, no "close enough." The number either matches or it doesn't.

**Step 4 — Flag rule-of-4 violations before fixing.**

If the Figma value is not a multiple of 4 and no legitimate exception applies, tell James before writing any code. The fix belongs in Figma first, then in code.

---

### Spatial Relationship Audit — All Six Measurements

For any element, always audit all six spatial measurements:

1. **Width** — must match spec exactly
2. **Height** — must match spec exactly
3. **Left margin** — x from parent's left edge (or nearest structural boundary)
4. **Top margin** — y from parent's top edge (or bottom of nearest element above)
5. **Right margin** — parent width − x − element width
6. **Bottom margin** — distance from element's bottom edge to nearest element below (or parent bottom)

Then verify: are all of these multiples of 4? If any are not, determine whether a legitimate exception applies. If not, flag before implementing.

**Reading spatial relationships in use_figma:**
```js
const logo = t1.findOne(n => n.name === 'turbo-todo-logo-btn');
const scrollArea = t1.findOne(n => n.name === 'scrollAreaBg');
const statusBar = t1.findOne(n => n.name === 'statusBarBg');

return {
  width: logo.width,
  height: logo.height,
  leftMargin: logo.x,
  topFromFrame: logo.y,
  gapAbove: logo.y - (statusBar.y + statusBar.height),
  gapBelow: scrollArea.y - (logo.y + logo.height),
  rightMargin: t1.width - (logo.x + logo.width),
};
```

---

### Colors — Zero Tolerance

Color values are exact. `#025F96` and `#015F95` are **different colors** and one of them is wrong. There is no acceptable delta. There is no "close enough for mobile."

Every color in Figma has a specific hex value. **Read the hex directly off the object in Figma. Do not derive it, estimate it, or convert it from any other format.** Copy it exactly — all six characters — and use it verbatim in the theme file. Do not deviate from it for any reason.

---

### What Claude Must NOT Do

- **Never use a screenshot as the reference for a code value.** Screenshots are for James's on-device review after code is implemented.
- **Never say "it looks right."** Right means the number matches. That is the only definition of right.
- **Never round silently or interpret.** 13dp is not 12dp. Flag it.
- **Never eyeball icon sizes.** `turbo-todo-logo-btn` is 40×40dp. If you can't read it from Figma, you don't know it.
- **Never compare themes visually.** Each theme is only compared against its own Figma page.
- **Never implement a value derived visually from a screenshot.** If the Figma file is the source of truth, read the Figma file.
- **Never skip the audit when making code changes to layout or spacing.** Always verify before and after.

---

### Confirmed Structural Values — Default Theme (audited 2026-05-14)

These values were read directly from the Figma file via Plugin API. They are ground truth.

| Element | Property | dp value | Rule of 4? |
|---|---|---|---|
| T1 frame | width | 360 | ✓ |
| T1 frame | height | 800 | ✓ |
| `statusBarBg` | height | 27 | — (OS-controlled) |
| `turbo-todo-logo-btn` | width | 40 | ✓ |
| `turbo-todo-logo-btn` | height | 40 | ✓ |
| `turbo-todo-logo-btn` | x (left margin) | 8 | ✓ |
| `turbo-todo-logo-btn` | gap above (statusBarBg bottom → logo top) | 12 | ✓ |
| `turbo-todo-logo-btn` | gap below (logo bottom → scrollAreaBg top) | 12 | ✓ |
| Header area | height (statusBarBg bottom → scrollAreaBg top) | 64 | ✓ |
| `turbo-todo-logo-btn` | fill color | #025F96 | — |
| `scrollAreaBg` | x | 8 | ✓ |
| `scrollAreaBg` | y | 91 | — (27 + 64 = 91) |
| `scrollAreaBg` | width | 344 | ✓ (360 − 8 − 8) |

**James's S21 Ultra is xxhdpi (3×).** All dp values above × 3 = physical pixel values on that device. If pixel counts on device don't match, the code has the wrong dp value.

### Full Structural Spec (all non-tokenized values)

These are the spec values for every fixed structural element. Not all have been individually audited from Figma yet — audit and update as work proceeds.

| Element | Attribute | Value | Rule of 4? |
|---|---|---|---|
| Header | height | 64dp | ✓ |
| `turbo-todo-logo-btn` | size | 40dp | ✓ |
| `turbo-todo-logo-btn` | left | 8dp | ✓ |
| `turbo-todo-logo-btn` | top (from header top) | 12dp | ✓ |
| List selector | width | 189dp | — (flex fills remaining space) |
| List selector | height | 34dp | — (typography) |
| List selector | left | 60dp | ✓ |
| List selector | top (from header top) | 15dp | — (centres in 64dp header) |
| List selector | borderRadius | 3dp | — |
| List selector | paddingH | 8dp | ✓ |
| Gear btn | size | 24dp | ✓ |
| Gear btn | left | 262dp | — (flex-placed) |
| Gear btn | top (from header top) | 20dp | ✓ |
| Help btn | size | 24dp | ✓ |
| Help btn | right | 19dp | — (flag for audit) |
| Help btn | top (from header top) | 20dp | ✓ |
| Scroll area | marginH | 8dp | ✓ |
| Scroll area | borderWidth | 1dp | — (border artifact) |
| Scroll area | borderRadius | 2dp | — (flag for audit — should be 4?) |
| Inset shadow | height | 5dp | — (visual only) |
| Inset shadow | opacity | 0.08 | — |
| Row | paddingVertical | 8dp | ✓ |
| Row | paddingRight | 12dp | ✓ |
| Row | gap | 8dp | ✓ |
| Row indent | base + per-depth | 8 + (depth × 20)dp | ✓ |
| Checkbox | size | 20dp | ✓ |
| Checkbox | borderWidth | 1dp | — (border artifact) |
| Checkbox | borderRadius | 1dp | — (flag for audit — should be 4?) |
| Checkmark icon | size | 12dp | ✓ |
| Row add icon | size | 18dp | — (flag for audit) |
| Row options icon | size | 18dp | — (flag for audit) |
| Row pin icon | size | 18dp | — (flag for audit) |
| Row bell icon | size | 14dp | — (flag for audit) |
| Priority icons | size | 16dp | ✓ |
| rowActions gap | gap | 12dp | ✓ |
| Note text | fontSize | 12dp | ✓ |
| Note text | style | italic | — |
| Separator | height | 1dp | — (border artifact) |
| Toolbar | inner height | 46dp | — (flag for audit — should be 48?) |
| Toolbar icons | size | 24dp | ✓ |
| Typography — normal size | d0 / d1 / d2 | 16 / 15 / 14dp | — (typography) |

Items marked "flag for audit" should be verified against Figma before being treated as final.

---

### The Uncanny Valley Problem — Why This Matters

A UI that is "almost right" is worse than obviously broken. It looks like something is wrong but nobody can name it. Users feel it even when they can't articulate it. James calls this "uncanny valley UI" — and it is the enemy of this project. The only defense is mathematical exactness. Close is not a category that exists here.

---

## Overview

Each theme is a TypeScript object satisfying the `Theme` type in `lib/theme.tsx`. Themes live in `lib/themes/` — one file per theme. The provider, hooks, and type live in `lib/theme.tsx` and import from `lib/themes/index.ts`.

**Adding a theme:** create `lib/themes/your-theme.ts`, add one import + one entry to `lib/themes/index.ts`. Done.
**Hiding a theme:** set `enabled: false` in the theme file. It stays loadable but disappears from the picker.
**Removing a theme:** delete the file and remove it from `lib/themes/index.ts`.

The **authoring workflow** is Figma-first: James designs in Figma, Claude reads the values via `use_figma` and generates the Theme object. No manual hex entry.

---

## File Structure

```
lib/
  theme.tsx               ← Theme type, ThemeProvider, useTheme, useThemeContext
  themes/
    index.ts              ← imports all theme files, exports themes record
    default.ts            ← L1 Default (gold/parchment)
    forest-canopy.ts      ← L2 Forest Canopy
    bimini-breeze.ts      ← L3 Bimini Breeze
    muir-light.ts         ← L4 Muir Light (image bg)
    dark-slate.ts         ← D1 Dark Slate
    deep-blue.ts          ← D2 Deep Blue
    biomech.ts            ← D3 Biomech (custom font: IBM Plex Mono)
    cape-cod-sunset.ts    ← D4 Cape Cod Sunset (image bg)
```

---

## Token Reference

Every token is required unless noted as optional. See the `Theme` type in `lib/theme.tsx` for the TypeScript definition.

### Identity & Classification
| Token | Type | What it controls |
|---|---|---|
| `id` | `string` | Unique key — must match the key in `themes/index.ts` |
| `name` | `string` | Display name in the theme picker |
| `enabled` | `boolean` | `true` = visible in picker. `false` = hidden but still loadable |
| `themeClass` | `'light' \| 'dark'` | Picker grouping — light themes listed before dark |
| `themeLabel` | `string` | Sort label: L1, L2, L3, L4 (light) / D1, D2, D3, D4 (dark) |
| `statusBarStyle` | `'dark' \| 'light'` | Android status bar icon color |

### Backgrounds — 3-Layer Model
| Token | Type | What it controls |
|---|---|---|
| `appBgLayer` | `SolidBg \| GradientBg \| ImageBg` | Layer 1: full-screen base. Raw — no overlay. |
| `statusBarBg` | `string \| 'transparent'` | Android status bar fill. `'transparent'` = appBgLayer bleeds behind status bar. |
| `scrollAreaBg` | `SolidBg \| GradientBg` | Layer 3: scroll area rectangle. Any opacity. Sits above appBgLayer. |
| `headerBg` | `string \| null` | Header bar background color. `null` = transparent (appBgLayer shows through). |
| `footerBg` | `string \| null` | Toolbar bar background color. `null` = transparent (appBgLayer shows through). |
| `menuBg` | `string` | Bottom sheet, dropdowns, modals, card backgrounds |

**Layer 2** (between appBgLayer and scrollAreaBg) is reserved for a future optional semi-opaque tint. Not yet implemented.

**AppBgLayer type shapes:**
```ts
SolidBg    = { type: 'solid';    color: string }
GradientBg = { type: 'gradient'; colors: string[]; locations: number[] }
ImageBg    = { type: 'image';    source: number }  // source = require()'d asset
```

**ScrollAreaBg type shapes:** `SolidBg | GradientBg` (no ImageBg — scroll area is always a color/gradient)

### Borders
| Token | Type | What it controls |
|---|---|---|
| `scrollAreaBorder` | `string` | Scroll area border, modal / dropdown outlines |
| `checkboxBorder` | `string` | Checkbox border — both checked and unchecked states |
| `headerBorder` | `string` | 1px line at bottom of header |
| `footerBorder` | `string` | 1px line at top of toolbar |
| `separator` | `string` | Row separator lines |
| `listSelectorBorder` | `string` | List selector bottom underline |

### Text
| Token | Type | What it controls |
|---|---|---|
| `text` | `string` | Primary body text, modal titles, menu items |
| `textNote` | `string` | Notes, badges, secondary info |
| `textDone` | `string` | Struck-through completed item text |
| `textDepth` | `[string, string, string]` | Task label color by depth: [d0, d1, d2] |

### Interactive / Semantic
| Token | Type | What it controls |
|---|---|---|
| `accent` | `string` | Active states, Save buttons, selected list item |
| `danger` | `string` | Destructive actions, invalid drag indicator |
| `iconColor` | `string` | All SVG icons — header (logo, gear, help), toolbar, row (add, kebab, pin, bell) |

### Priority
| Token | Type | What it controls |
|---|---|---|
| `priorityElevated` | `string` | Bolt icon color + elevated task label color |
| `priorityTop` | `string` | Exclamation icon color + top-priority task label color |

### List Selector
| Token | Type | What it controls |
|---|---|---|
| `listSelectorBg` | `string` | List selector pill background |
| `listSelectorText` | `string` | List name text + dropdown arrow |

### Checkbox
| Token | Type | What it controls |
|---|---|---|
| `checkboxBg` | `string` | Unchecked checkbox fill |
| `checkboxDoneBg` | `string` | Checked checkbox fill only (border uses `checkboxBorder`) |
| `checkmarkColor` | `string` | SVG checkmark inside done checkbox |

### Extended / Optional
| Token | Type | What it controls |
|---|---|---|
| `iconGradient` | `[string, string] \| null` | Top→bottom gradient on all icons. Overrides `iconColor` when set. `null` = use `iconColor` solid. |
| `fontFamily` | `string \| null` | Custom font family name. `null` = system default. |

---

## Where Each Token Is Consumed

| Token | File(s) | Notes |
|---|---|---|
| `appBgLayer` | `TodoList.tsx` | ThemeBg — solid, gradient, or image fill behind everything |
| `statusBarBg` | `TodoList.tsx` | StatusBar background color; `'transparent'` = image shows through |
| `scrollAreaBg` | `TodoList.tsx` | Scroll area background rect above appBgLayer |
| `headerBg` | `TodoList.tsx` | Wrapper View behind `TodoListHeader` — color when set, transparent when null |
| `footerBg` | `TodoList.tsx` | Wrapper View behind `TodoListToolbar` — color when set, transparent when null |
| `menuBg` | `ItemOptionsMenu`, `AddChildMenu`, `ToolbarOptionsMenu`, modals | Bottom sheet + dropdown backgrounds |
| `scrollAreaBorder` | Multiple | Scroll area border, modal / dropdown outlines |
| `checkboxBorder` | `TodoItem.tsx` | Checkbox border — both checked and unchecked states |
| `headerBorder` | `TodoListHeader.tsx` | 1px line at bottom of header |
| `footerBorder` | `TodoListToolbar.tsx` | 1px line at top of toolbar |
| `separator` | `TodoItem.tsx` | Row separator |
| `listSelectorBorder` | `TodoListHeader.tsx` | List selector underline |
| `text` | Multiple | Modal and menu body text |
| `textNote` | Multiple | Notes, badges |
| `textDone` | `TodoItem.tsx` | Done item text color |
| `textDepth` | `TodoItem.tsx` | `getLabelColor()` — indexed by depth 0/1/2 |
| `accent` | Multiple | Active states, Save buttons, selected list item |
| `danger` | Multiple | Destructive text, invalid drag indicator |
| `iconColor` | Multiple | All icon components |
| `priorityElevated` | `TodoItem.tsx` | Bolt icon + elevated label |
| `priorityTop` | `TodoItem.tsx` | Exclamation icon + top-priority label |
| `listSelectorBg` | `TodoListHeader.tsx` | Selector background |
| `listSelectorText` | `TodoListHeader.tsx` | Selector text + arrow |
| `checkboxBg` | `TodoItem.tsx` | Unchecked fill |
| `checkboxDoneBg` | `TodoItem.tsx` | Checked fill only |
| `checkmarkColor` | `TodoItem.tsx` | SVG checkmark prop |
| `iconGradient` | `Icons.tsx` | Gradient override on all icons; falls back to `iconColor` when null |
| `fontFamily` | Multiple | Custom font; null = system default |

---

## Theme Status

| ID | File | Label | Class | Notes |
|---|---|---|---|---|
| `default` | `default.ts` | L1 | light | Gold/parchment. Production theme. Flavor: `no-header.footer` (`432:93`) — `headerBg`/`footerBg` null. |
| `forest-canopy` | `forest-canopy.ts` | L2 | light | |
| `bimini-breeze` | `bimini-breeze.ts` | L3 | light | |
| `muir-light` | `muir-light.ts` | L4 | light | ImageBg: `muir-light.png` |
| `dark-slate` | `dark-slate.ts` | D1 | dark | |
| `deep-blue` | `deep-blue.ts` | D2 | dark | |
| `biomech` | `biomech.ts` | D3 | dark | `fontFamily: 'IBMPlexMono'`, `iconGradient` set |
| `cape-cod-sunset` | `cape-cod-sunset.ts` | D4 | dark | ImageBg: `capecod.png`, gradient scrollAreaBg at 85% opacity, `statusBarBg: 'transparent'` |

**Rule:** each theme's values are correct for that theme. Differences between themes are intentional. Only ever compare a theme against its own Figma page.

---

## Figma Theme File

**File:** `todo-app-themes`
**URL:** https://www.figma.com/design/wUMtjlawjc3wFuROGfYuO6/todo-app-themes
**File key:** `wUMtjlawjc3wFuROGfYuO6`

**Pages:**
| Page name | Theme ID | T1 node | Class | Notes |
|---|---|---|---|---|
| L1 - Default | `default` | **`432:93` (no-hf — live source)** / `353:57` (w-hf — classifier only) | light | **Active template — xhdpi (720×1600). `/drop-themes` reads the no-header.footer frame for `default`; the w-header.footer frame exists only to classify the bars-visible layout.** |
| L1 - Default-old | — | `5:2` | light | Legacy mdpi backup — do not edit |
| L2 - Forest Canopy | `forest-canopy` | — | light | |
| L3 - Bimini Breeze | `bimini-breeze` | — | light | |
| L4 - Muir Light | `muir-light` | — | light | |
| D1 - Dark Slate | `dark-slate` | — | dark | |
| D2 - Deep Blue | `deep-blue` | — | dark | |
| D3 - Biomech | `biomech` | — | dark | |
| D4 - Cape Cod Sunset | `cape-cod-sunset` | — | dark | |
| ARCHIVE - DO NOT TOUCH | — | — | — | |

Add new light themes after L4, dark themes after D4. Update `themeLabel` accordingly.

**Reading all pages:** Use `use_figma` with `await figma.setCurrentPageAsync(page)` to iterate pages. Do NOT use `get_design_context` — it only returns the currently active page and is deprecated for this workflow.

---

## Frame Structure (per page, T1–T5)

| Frame | Name | Purpose |
|---|---|---|
| T1 | `[Theme Name]` | **Primary edit frame.** James edits this. Layer names map to token names. |
| T2 | `theme-values` | Info card — token names + color swatches + hex values. Claude writes this. |
| T3 | `menus-modals-and-values` | Info card — menus, modals, priority tokens. Claude writes this. |
| T4 | `icons-and-values` | Icon grid — real icon shapes + token name + hex. Claude writes this. |
| T5 | `ui-attributes` | Structural attributes — sizes, positions, padding. Claude writes this. |

Frame x positions on each page (mdpi, legacy):

| Frame | x | Width |
|---|---|---|
| T1 `[Theme Name]` | 0 | 360 |
| T2 `theme-values` | 600 | 408 |
| T3 `menus-modals-and-values` | 1068 | 400 |
| T4 `icons-and-values` | 1528 | 360 |
| T5 `ui-attributes` | 1948 | 360 |

**xhdpi template page (`L1 - Default`)** — the active authoring template:

| Frame | Name | Node ID | x | Width | Height |
|---|---|---|---|---|---|
| T1 (with header/footer) | `Default-xhdpi-w-header.footer` | `353:57` | 0 | 720 | 1600 |
| T1 (no header/footer) | `Default-xhdpi-no-header.footer` | `432:93` | 836 | 720 | 1600 |
| T2 | `theme-values` | `390:11` | 1940 | 680 | auto |
| T3 | `menus-modals-and-values` | `390:184` | 2720 | 680 | auto |
| T4 | `icons-and-values` | `390:317` | 3500 | 708 | auto |
| T5 | `ui-attributes` | `390:435` | 4308 | 900 | auto |

The xhdpi T1 frame is **720×1600px** (360dp × 2). All values in T1 are physical pixels at xhdpi; divide by 2 to get dp. James designs at xhdpi; Claude reads and converts.

**Two T1 flavors — `w-header.footer` vs `no-header.footer`:**

Each theme page uses exactly one flavor. The two differ in `scrollAreaBg` size and position:

| Flavor | scrollAreaBg y | scrollAreaBg height | bottom edge |
|---|---|---|---|
| w-header.footer | 200 | 1192 | 1392 |
| no-header.footer | 187 | 1221 | 1408 |

Hiding/showing header and footer layers is not enough — the `scrollAreaBg` rect itself changes position and size. `L1 - Default` is the only page with both flavors side by side; all other theme pages have exactly one.

**Default's live flavor is always `no-header.footer` (`432:93`).** That is the frame `/drop-themes` reads for the `default` theme. The `w-header.footer` frame (`353:57`) exists only to classify/preview the bars-visible layout — it is never the source of truth for `default`. (In the app, `headerBg`/`footerBg` are `null` for Default; the `scrollAreaBg` size difference is a Figma-template concern only — the app's scroll area auto-fills, there is no height token.)

**Flavor detection (used by `/drop-themes`):** inside `todo-container`, check for `appBgLayerHeader` — present = `w-header.footer`; absent = `no-header.footer`. The layer does not exist at all in `no-header.footer` themes; there is no visibility to check.

T2–T5 auto-resize to content height. Never move or resize them manually.

---

## T1 Layer Structure

T1 is a **360×800 FRAME** (the only FRAME on the canvas — all inner containers are GROUPs). Layer names are stable — they are how Claude maps Figma fills to token values.

```
[Theme Name]  FRAME  360×800
  statusBarBg          RECT    360×27   fill = statusBarBg token
  todo-container       GROUP   360×752
    appBgLayer         RECT    360×752  fill = appBgLayer token (solid / gradient / image)
    headerBorder       RECT    360×1    fill = headerBorder token  (at top of header)
    turbo-todo-logo-btn  VECTOR  40×40  fill = iconColor token
    listSelectorBg     RECT             fill = listSelectorBg, stroke = listSelectorBorder
    [list name text]   TEXT             sample content — ignored on read-back
    list-gear-btn      VECTOR  24×24    fill = iconColor token
    help-icon          VECTOR  24×24    fill = iconColor token
    scroll-area        GROUP
      scrollAreaBg     RECT    344×h    fill = scrollAreaBg token, stroke = scrollAreaBorder token
      [sample rows]             checkboxBg, checkboxDoneBg, checkmarkColor, separator,
                                textDepth[0/1/2], textDone, priorityElevated, priorityTop,
                                row icons (IconCreateNew + IconOptions at 18px — iconColor)
      [inset shadow]            gradient rect — visual only, not a token
    footerBorder       RECT    360×1    fill = footerBorder token
    todo-bottom-toolbar  GROUP
      toolbar-kebab-icon   VECTOR  24×24  fill = iconColor
      toolbar-add-btn      VECTOR  24×24  fill = iconColor
      toolbar-collapse-btn VECTOR  24×24  fill = iconColor
      toolbar-expand-btn   VECTOR  24×24  fill = iconColor  (hidden by default)
  android_navigation_bar  RECT  360×48  OS-controlled — not a token, do not touch
  theme-meta           GROUP   hidden
      themeClass       TEXT    'light' or 'dark'
      themeLabel       TEXT    'L1', 'L2', etc.
      fontFamily       TEXT    font name or 'null'
      backgroundImage  TEXT    image asset filename or 'null'
  token-map            GROUP   temporary swatch strip for tokens without natural UX homes
      accent, danger, menuBg  (to be replaced with real UI elements)
```

**Design rules:**
- Only the outer `[Theme Name]` is a FRAME. Everything inside is a GROUP.
- `headerBg` / `footerBg`: if the `appBgLayerHeader` / `appBgLayerFooter` layer in T1 is **visible** → read its fill color. If **hidden** → `null` (transparent).
- `listSelectorBorder` is the list selector bottom underline only. Scroll area uses `scrollAreaBorder`.
- `listSelectorBorder` strokeWeight returns `figma.mixed` (bottom-only border) — **read color only** from `strokes[0].color`. Never read `strokeWeight`.
- `textDepth[0]` (`textDepth-d0` layer) doubles as the primary `text` token — same value.
- `textURL` layer → maps to `accent` token.
- Logo fill type detection: if `turbo-todo-logo-btn` fill is `GRADIENT_LINEAR` → extract the two stop colors as `[stop0.color, stop1.color]` for `iconGradient`. If `SOLID` → `iconGradient: null`.
- Priority indicators are shown via text color and icon color on sample rows — not side bars.
- Never edit or resize T2–T5 frames manually.
- All icons in T1 must use the same color — the `iconColor` token value. No exceptions.

---

## Authoring Workflow

### Creating a new theme

1. In Figma, duplicate the `L1 - Default` page
2. Rename the page following the `L#` or `D#` naming scheme
3. In T1, rename the outer frame from `[Default]` to `[New Theme Name]`
4. Edit T1 visually — change fills, strokes, gradient stops
5. Update `themeClass` and `themeLabel` text nodes in the `theme-meta` group
6. Tell Claude: "read T1 on [page name] and generate the theme"

### Claude's read-back process

1. Use `use_figma` to switch to the theme page and read the T1 frame node
2. Extract hex values from named layers by reading `fills[0]` on each named node
3. Read `theme-meta` group text nodes for `themeClass`, `themeLabel`, `fontFamily`, `backgroundImage`
4. Generate a `Theme` object matching the `Theme` type exactly
5. Create `lib/themes/your-theme.ts`
6. Add the import + entry to `lib/themes/index.ts` in the correct L/D position
7. Update T2–T5 info frames on the Figma page via `use_figma`

**Always use `use_figma` for all Figma reads and writes. `get_design_context` is deprecated — it only returns the active page.**

### Diff workflow

- "Take a snapshot" → Claude reads and stores current T1 values
- James edits in Figma
- "Diff and update" → Claude reports what changed and rewrites affected code + info frames

---

## Iterative Edit Workflow (theme tuning)

Used when refining an existing theme — not creating from scratch.

### Iteration loop

1. James edits the T1 frame directly in Figma (on the theme's own page)
2. Claude reads updated values via `use_figma`
3. Claude updates `lib/themes/[theme].ts`
4. Claude outputs the OTA command string — James runs it, kills + relaunches app
5. James reviews on device → repeat until satisfied

### Final commit

1. Claude reads final values from T1
2. Updates T2–T5 info frames in Figma via `use_figma`
3. Commits the updated `.ts` file to git

### Claude must

- **Never run the OTA command.** Always give James the exact `eas update --branch preview --platform android --message "..."` string. Never execute it unless James explicitly grants permission for the session.
- **Never edit T2–T5 during iteration** — only after final values are locked.
- After final commit: verify T2–T5 are updated in Figma before closing out.

---

## Icons

All icons are SVG components in `components/Icons.tsx`. Every call site passes `color={theme.iconColor}`. When `theme.iconGradient` is set, all icons use the gradient instead. The defaults in function signatures are irrelevant in practice.

**Every icon in the app — header, toolbar, and row-level — must be the same color.** The `turbo-todo-logo-btn` fill in T1 is the color reference. All other icon layers in T1 must match it exactly.

| Icon | T1 layer name | Code component | Size (header/toolbar) | Size (row) |
|---|---|---|---|---|
| App logo / theme picker | `turbo-todo-logo-btn` | `IconLogo` | 40px | — |
| Gear / list options | `list-gear-btn` | `IconGear` | 24px | — |
| Help | `help-icon` | `IconHelp` | 24px | — |
| Toolbar kebab | `toolbar-kebab-icon` | `IconOptions` | 24px | — |
| Toolbar add | `toolbar-add-btn` | `IconCreateNew` | 24px | — |
| Toolbar collapse | `toolbar-collapse-btn` | `IconExpandUp` | 24px | — |
| Toolbar expand | `toolbar-expand-btn` | `IconExpandDown` | 24px | — |
| Row add subtask | `IconCreateNew` | `IconCreateNew` | — | 18px |
| Row kebab | `IconOptions` | `IconOptions` | — | 18px |
| Row pin | `IconPin` | `IconPin` | — | 18px |
| Row bell (alarm) | — | `IconBell` | — | 14px |
| Priority elevated | — | `IconPriorityMedium` | — | 16px |
| Priority top | — | `IconPriorityHigh` | — | 16px |
| Checkbox checkmark | — | `IconCheckmark` | — | 12px |

---

## Info Frame Design (T2–T5)

Dark background (`#13151a`), accent colors per frame:

| Frame | Accent | Content |
|---|---|---|
| T2 — `theme-values` | Amber `#f5a623` | All tokens: semantic label + token name + swatch + hex |
| T3 — `menus-modals-and-values` | Coral `#ff6b6b` | Menu, modal, priority tokens |
| T4 — `icons-and-values` | Cyan `#38d9e8` | 2-col icon grid: shape + label + token + hex |
| T5 — `ui-attributes` | Teal `#38e8c8` | Structural attributes: sizes, positions, padding |

Typography: Roboto. 10px semantic labels (white), 8.5px token names (muted), 9px hex values (light blue mono).

### Icon frame GROUP structure (T4)

```
[0] bg          RECTANGLE  162×140, fill #1c1f27, cornerRadius 5
[1] outline     RECTANGLE  162×140, no fill, 1px stroke, cornerRadius 5
[2] description TEXT       semantic label
[3] name        TEXT       code component name (e.g. "IconCreateNew")
[4] swatch      RECTANGLE  color swatch
[5] hex         TEXT       hex value
[6] icon FRAME  FRAME      24×24 (40×40 for logo) — FRONTMOST, no fill/stroke
      └─ SVG artwork inside at (0,0)
```
