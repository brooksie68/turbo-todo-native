# TurboTodo Native — Theme System & Figma Workflow

> Last updated: 2026-05-07

---

## Overview

Each theme is a TypeScript object that satisfies the `Theme` type defined in `lib/theme.tsx`. Themes live in individual files under `lib/themes/` — one file per theme. The provider, hooks, and type live in `lib/theme.tsx` and import from `lib/themes/index.ts`.

**Adding a theme:** create `lib/themes/your-theme.ts`, add one import + one entry to `lib/themes/index.ts`. Done.  
**Hiding a theme:** set `enabled: false` in the theme file. It stays loadable but disappears from the picker.  
**Removing a theme:** delete the file and remove it from `lib/themes/index.ts`.

The **authoring workflow** is Figma-first: James designs in Figma, Claude reads the values and generates the Theme object. No manual hex entry.

---

## File Structure

```
lib/
  theme.tsx               ← Theme type, ThemeProvider, useTheme, useThemeContext
  themes/
    index.ts              ← imports all theme files, exports themes record
    default.ts            ← Default (gold/parchment) — current production theme
    default-2.ts          ← Default 2 (pixel-corrected) — candidate to replace default
    dark-slate.ts         ← Dark Slate (near-black dark mode)
    slate.ts              ← Slate (cool gray, light)
    bimini-breeze.ts      ← Bimini Breeze (Caribbean teal/sand)
```

Adding a new theme file and registering it in `index.ts` is the only code change required.

---

## Token Reference (27 tokens)

Every token is required. No nullables. See the `Theme` type in `lib/theme.tsx` for the TypeScript definition.

### Identity
| Token | Type | What it controls |
|---|---|---|
| `id` | `string` | Unique key — must match the key in `themes/index.ts` |
| `name` | `string` | Display name in the theme picker |
| `enabled` | `boolean` | `true` = visible in picker. `false` = hidden but still loadable |
| `statusBarStyle` | `'dark' \| 'light'` | Android status bar icon color |

### Backgrounds
| Token | Type | What it controls |
|---|---|---|
| `bg` | `string` | App background fallback when gradient is absent; also `android_status_bar` fill in Figma |
| `headerBg` | `string` | Header bar background — **placeholder, not yet consumed in code** — reserved for future themes that use a solid header |
| `surface` | `string` | Scroll area, modal panels, card backgrounds |
| `menuBg` | `string` | Bottom sheet, kebab dropdowns, AddChild menu backgrounds |
| `gradientColors` | `string[]` | ThemeBg gradient stops — min 2, typically 3 |
| `gradientLocations` | `number[]` | Stop positions 0–1, must match `gradientColors` length |

### Borders
| Token | Type | What it controls |
|---|---|---|
| `border` | `string` | Scroll area full border, checkbox border, modal outlines, inputs |
| `headerBorder` | `string` | 1px line at top of header |
| `footerBorder` | `string` | 1px line at bottom of toolbar |
| `separator` | `string` | Thin divider lines between rows |
| `listSelectorBorder` | `string` | List selector bottom underline |

### Text
| Token | Type | What it controls |
|---|---|---|
| `text` | `string` | Primary body text — modal titles, menu items, form labels |
| `textSub` | `string` | Notes, child-count badges, secondary info |
| `textDone` | `string` | Struck-through completed item text |
| `textDepth` | `[string, string, string]` | Task label color by depth: `[d0, d1, d2]` |

### Interactive / Semantic
| Token | Type | What it controls |
|---|---|---|
| `accent` | `string` | Active states, selected list item, modal title color, Save button |
| `danger` | `string` | Destructive action text (Delete, Clear), invalid drag-drop indicator |
| `iconColor` | `string` | All SVG icons — header (logo, gear, help), toolbar, and row (add, kebab) |

### Priority
| Token | Type | What it controls |
|---|---|---|
| `priorityElevated` | `string` | Elevated status — bolt icon color + task label color |
| `priorityTop` | `string` | Top priority — exclamation icon color + task label color |

### List Selector
| Token | Type | What it controls |
|---|---|---|
| `listSelectorBg` | `string` | List selector pill/box background |
| `listSelectorText` | `string` | List name text + dropdown arrow |

### Checkbox
| Token | Type | What it controls |
|---|---|---|
| `checkboxBg` | `string` | Unchecked checkbox fill |
| `checkboxDone` | `string` | Checked checkbox fill + border color |
| `checkmarkColor` | `string` | SVG checkmark color inside done checkbox |

---

## Where Each Token Is Consumed

| Token | File | Notes |
|---|---|---|
| `bg` | `TodoList.tsx` | ThemeBg fallback when no gradient |
| `headerBg` | — | Reserved, not yet used |
| `surface` | Multiple | Modals, dropdowns, scroll area |
| `menuBg` | `ItemOptionsMenu`, `AddChildMenu`, `ToolbarOptionsMenu` | Bottom sheet bg |
| `gradientColors` | `TodoList.tsx` | ThemeBg LinearGradient |
| `gradientLocations` | `TodoList.tsx` | ThemeBg stop positions |
| `border` | Multiple | Inputs, checkboxes, scroll area |
| `headerBorder` | `TodoListHeader.tsx` | 1px top border on header View |
| `footerBorder` | `TodoListToolbar.tsx` | 1px bottom border on toolbar View |
| `separator` | `TodoItem.tsx` | Row separator line |
| `listSelectorBorder` | `TodoListHeader.tsx` | Bottom border on list selector |
| `text` | Multiple | Modal and menu body text |
| `textSub` | Multiple | Notes, badges |
| `textDone` | `TodoItem.tsx` | Done text color |
| `textDepth` | `TodoItem.tsx` | `getLabelColor()` — indexed by depth |
| `accent` | Multiple | Active states, Save buttons |
| `danger` | Multiple | Destructive text, invalid drag indicator |
| `iconColor` | Multiple | All icon components |
| `priorityElevated` | `TodoItem.tsx` | Bolt icon / elevated label |
| `priorityTop` | `TodoItem.tsx` | Exclamation icon / top-priority label |
| `listSelectorBg` | `TodoListHeader.tsx` | Selector background |
| `listSelectorText` | `TodoListHeader.tsx` | Selector text + arrow |
| `checkboxBg` | `TodoItem.tsx` | Unchecked fill |
| `checkboxDone` | `TodoItem.tsx` | Checked fill + border |
| `checkmarkColor` | `TodoItem.tsx` | SVG checkmark prop |

---

## Theme Status

| ID | Name | Status | Notes |
|---|---|---|---|
| `default` | Default | Production | Pixel-corrected. `headerBorder: #d4b24d`, `checkmarkColor: #eae2ca` |
| `dark-slate` | Dark Slate | Enabled | Values are canon for this theme — do not compare against Default |
| `deep-blue` | Deep Blue | Enabled | Same |
| `bimini-breeze` | Bimini Breeze | Enabled | Same |
| `forest-canopy` | Forest Canopy | Enabled | Same |
| `muir-light` | Muir Light | Enabled | backgroundImage: muir-light.png |
| `biomech` | Biomech | Enabled | iconGradient, fontFamily: IBMPlexMono |
| `cape-cod-sunset` | Cape Cod Sunset | Enabled | NEW — ⚠ surface/menuBg/text/textSub/accent inferred; T1 missing named layers for those tokens |

**Rule:** each theme's values are correct for that theme. Differences between themes are intentional. Only compare a theme against its own Figma page.

---

## Figma Theme File

**File:** `todo-app-themes`  
**URL:** https://www.figma.com/design/wUMtjlawjc3wFuROGfYuO6/todo-app-themes  
**File key:** `wUMtjlawjc3wFuROGfYuO6`

**Pages:**
| # | Page name | Page ID | Theme ID |
|---|---|---|---|
| 00 | Default | `2:5` | `default` |
| 01 | Dark Slate | `122:2` | `dark-slate` |
| 02 | Deep Blue | `170:2` | `deep-blue` |
| 03 | Forest Canopy | `199:2` | `forest-canopy` |
| 04 | Muir Light | `199:698` | `muir-light` |
| 05 | Biomech | `199:1394` | `biomech` |
| 06 | Bimini Breeze | `223:2` | `bimini-breeze` |
| 07 | Cape Sunset | `287:33` | `cape-cod-sunset` |
| — | ARCHIVE - DO NOT TOUCH | `0:1` | — |

Each new theme gets its own page. Page name = theme display name = code `name` field.

---

## Frame Structure (per page, T1–T5)

| Frame | Name | Purpose |
|---|---|---|
| T1 | `[Theme Name]` | **Primary edit frame.** James edits this. Layer names match token names. |
| T2 | `theme-values` | Info card — token names + color swatches + hex values. Claude writes this. |
| T3 | `menus-modals-and-values` | Info card — menus, modals, priority tokens. Claude writes this. |
| T4 | `icons-and-values` | Icon grid — real icon shapes + token + hex. Claude writes this. |
| T5 | `ui-attributes` | Structural UI attributes — sizes, positions, padding. Claude writes this. |

Frame positions (Default Theme page):

| Frame | x | Width |
|---|---|---|
| T1 `[Theme Name]` | 0 | 360 |
| T2 `theme-values` | 600 | 408 |
| T3 `menus-modals-and-values` | 1068 | 400 |
| T4 `icons-and-values` | 1528 | 360 |
| T5 `ui-attributes` | 1948 | 360 |

T2–T5 auto-resize to content height. Never move or resize them manually.

---

## T1 Layer Structure

T1 is a 360×800 frame. Layer names must stay stable — they're how Claude maps Figma values to tokens.

```
[Default]  (360×800, fill = none)
  android_status_bar       (360×27, fill = bg)
  todo-container           (360×725, fill = none)
    bg-gradient            (full-size rect, gradient fill = gradientColors / gradientLocations)
    headerBorder           (360×1, at top — fill = headerBorder)
    turbo-todo-logo-btn    (SVG, iconColor)
    listSelectorBg         (rect, fill = listSelectorBg, bottom border = listSelectorBorder)
    List Name              (text — sample content, ignored in read-back)
    list-gear-btn          (SVG, iconColor)
    help-icon              (SVG, iconColor)
    todo-scroll-area       (344×618, fill = surface, stroke = border)
      [sample rows — checkboxBg, checkboxDone, checkmarkColor, separator, textDepth[*], textDone]
      row icons            (IconCreateNew + IconOptions at 18px — iconColor)
      top-inset-shadow     (gradient rect, visual only — not a token)
    footerBorder           (360×1, fill = footerBorder)
    todo-bottom-toolbar    (360×42, fill = none)
      toolbar-kebab-icon   (SVG → IconOptions, 24px, iconColor)
      toolbar-add-btn      (SVG → IconCreateNew, 24px, iconColor)
      toolbar-collapse-btn (SVG → IconExpandUp, 24px, iconColor)
      toolbar-expand-btn   (SVG → IconExpandDown, 24px, iconColor — hidden)
  android_navigation_bar   (360×48, fill = white — OS controlled, not a token)
```

**Design rules:**
- Frames have no fill. Backgrounds live on named rect layers inside them.
- `headerBg` is reserved — the header frame is transparent and shows the gradient through it.
- `listSelectorBorder` = list selector bottom border only (scroll area uses `border`).
- Priority is shown via text color on sample rows, not side bars.
- Do not resize or move objects in T2 unless explicitly told to.

---

## Authoring Workflow

### Creating a new theme

1. In Figma, duplicate the `Default Theme` page
2. Rename the page to the new theme name (e.g. `Cape Cod Shore`)
3. In T1, rename the outer frame from `[Default]` to `[Cape Cod Shore]`
4. Edit T1 visually — change fills, strokes, gradient stops
5. When ready, tell Claude: "read T1 on the Cape Cod Shore page and generate the theme"

### Claude's read-back process

1. Call `get_design_context` on the T1 node (REST API — works across pages)
2. Extract hex values from named layers
3. Generate a `Theme` object matching the `Theme` type exactly
4. Create `lib/themes/your-theme.ts` with the object
5. Add the import + entry to `lib/themes/index.ts`
6. Update cards 3, 4, 5 on the Figma page via `use_figma`

### Diff workflow

- "Take a snapshot" → Claude reads and stores current T1 values
- James edits in Figma
- "Diff and update cards" → Claude reports what changed and rewrites cards

---

## Iterative Edit Workflow (theme tuning)

Used when refining an existing theme — not creating from scratch. The Edit section is a sandbox; the main T2 and info cards are not touched until the final commit.

### Setup (done once per theme)

On the theme's Figma page, James creates a **Section** named `[Theme Name] - Edit` (e.g. `Dark Slate - Edit`). Inside it lives a duplicate of the T1 frame. This is where all iterative edits happen.

Dark Slate edit section: node `170:2` on page `122:2`.

### Iteration loop

1. James edits the T1 frame inside the Edit section in Figma
2. Claude reads values: `get_design_context` on the Edit T1 node
3. Claude updates `lib/themes/[theme].ts` with new token values
4. Claude outputs the OTA command — James runs it, kills + relaunches app
5. James reviews on device → repeat from step 1 until satisfied

### Final commit (when happy)

1. Claude reads final values from the Edit T1
2. Overwrites the main `[Theme Name]` T1 frame in Figma with the final fills/strokes (use `use_figma`)
3. Deletes the Edit section from the Figma page (use `use_figma`)
4. Commits the updated theme `.ts` file to git

### Claude must

- **Never edit the main T1 or info frames during iteration** — all reads are from the Edit T1
- Always give James the exact `eas update` command string to run; never execute it
- After final commit: verify the Edit section is gone from the Figma page before closing out

---

## Icons

All icons are SVG components in `components/Icons.tsx`. Every call site passes `color={theme.iconColor}` — the defaults in the function signatures are irrelevant in practice.

| Icon | T2 layer | Code component | Size in rows | Size in toolbar/header |
|---|---|---|---|---|
| App logo / theme picker | `turbo-todo-logo-btn` | `IconLogo` | — | 40px |
| List gear | `list-gear-btn` | `IconGear` | — | 24px |
| Help | `help-icon` | `IconHelp` | — | 24px |
| Row add subtask | `IconCreateNew` | `IconCreateNew` | 18px | — |
| Row kebab | `IconOptions` | `IconOptions` | 18px | — |
| Toolbar options | `toolbar-kebab-icon` | `IconOptions` | — | 24px |
| Toolbar add | `toolbar-add-btn` | `IconCreateNew` | — | 24px |
| Toolbar collapse | `toolbar-collapse-btn` | `IconExpandUp` | — | 24px |
| Toolbar expand | `toolbar-expand-btn` | `IconExpandDown` | — | 24px |
| Priority elevated | — | `IconPriorityMedium` | 16px | — |
| Priority top | — | `IconPriorityHigh` | 16px | — |
| Checkbox done | — | `IconCheckmark` | 12px | — |
| Pin | — | `IconPin` | 18px | — |
| Bell (alarm) | — | `IconBell` | 14px | — |

### Adding a new icon

1. James exports SVG from Affinity → pastes into Figma
2. Claude resizes to 24×24 (or 42×42 for logo), wraps in a named FRAME, slots into the card GROUP at frontmost
3. Claude also places it in T2 at the correct layer position
4. Claude adds the `IconXxx` function to `components/Icons.tsx` using the SVG path data

---

## Info Frame Design (T2–T5)

Dark background (`#13151a`), accent colors per frame:

| Frame | Accent | Content |
|---|---|---|
| T2 — theme-values | Amber `#f5a623` | All tokens: semantic label + token name + swatch + hex |
| T3 — menus-modals-and-values | Coral `#ff6b6b` | Menu, modal, priority tokens |
| T4 — icons-and-values | Cyan `#38d9e8` | 2-col icon grid: shape + label + token + hex |
| T5 — ui-attributes | Teal `#38e8c8` | Structural attributes: sizes, positions, padding |

Typography: Roboto. 10px semantic labels (white), 8.5px token names (muted), 9px hex values (light blue mono).

### Icon frame GROUP structure (T4)

```
[0] bg          RECTANGLE  162×140, fill #1c1f27, cornerRadius 5
[1] outline     RECTANGLE  162×140, no fill, 1px stroke, cornerRadius 5
[2] description TEXT       semantic label
[3] name        TEXT       code component name (e.g. "IconCreateNew")
[4] swatch      RECTANGLE  color swatch
[5] hex         TEXT       hex value
[6] icon FRAME  FRAME      24×24 (42×42 for logo) — FRONTMOST, no fill/stroke
      └─ SVG artwork inside at (0,0)
```
