# TurboTodo Native — Theme System & Figma Workflow

> Last updated: 2026-04-26

---

## Overview

Themes live in `lib/theme.tsx` as a `Record<string, Theme>` object. Each theme has 25 tokens covering backgrounds, text, borders, icons, menus, priority indicators, and gradient. See the bottom of this file for the full token reference.

The **authoring workflow** is Figma-first: James designs visually in Figma, Claude reads the values and generates the Theme object. No manual hex entry.

---

## Figma Theme File

**File:** `todo-app-themes`
**URL:** https://www.figma.com/design/wUMtjlawjc3wFuROGfYuO6/todo-app-themes
**File key:** `wUMtjlawjc3wFuROGfYuO6`

**Pages:**
- `Page 1` (id: `0:1`) — James's original reference example, do not modify
- `Default Theme` (id: `2:5`) — live template, currently the Default theme

Each new theme gets its own page. Page name = theme display name = code `name` field.

---

## 5-Frame Template Structure (per page)

Every theme page has exactly 5 frames in a row, left to right:

| # | Frame name | Purpose |
|---|---|---|
| 1 | `page-layout` | Engineering spec blueprint — zone labels, pixel dimensions, token names per zone. Static, never changes between themes. |
| 2 | `[Theme Name]` | **T2 — the theme frame.** Live visual mockup of the app with all theme colors applied. James edits this. Layer names match code token names. |
| 3 | `theme-values` | Info card populated by Claude. Semantic descriptions + token names + color swatches + hex values for all tokens. |
| 4 | `menus-modals-and-values` | Info card for menus, dropdowns, modals, priority indicators. |
| 5 | `icons-and-values` | Icon grid — real icon shapes + semantic label + token + hex value per icon. |

**Frame positions (Default Theme page — locked in):**

| Frame | x | Width | Gap to next |
|---|---|---|---|
| page-layout | -640 | 360 | 648px |
| [Default] | 368 | 360 | 200px |
| theme-values | 928 | 408 | 40px |
| menus-modals-and-values | 1448 | 400 | 40px (approx) |
| icons-and-values | 1968 | 360 | — |

Cards 3, 4, 5 auto-resize to content height.

---

## T2 — The Theme Frame (Layer Structure)

T2 is a 360×800 frame. Layers are named to match code token names exactly so Claude can read them back unambiguously.

```
[Default]  (360×800, outer frame, fill = none — bg color on android_status_bar)
  android_status_bar       (rect, 360×27, fill = bg)
  todo-container           (frame, 360×725, fill = none)
    bg-gradient            (rect at bottom of stack, gradient fill = gradientColors/gradientLocations)
    app-header             (frame, 360×64, fill = none)
      headerBorder         (rect, 360×1, at TOP of header — separates from status bar)
      turbo-todo-logo-btn  (real SVG group — iconColor)
      listSelectorBg       (rect, fill = listSelectorBg, bottom border only = listSelectorBorder)
      List Name            (text layer — sample text, ignored in read-back)
      list-gear-btn        (real SVG group — iconColor)
      help-icon            (real SVG vector — iconColor)
    todo-scroll-area       (frame, 344×618, fill = surface, stroke = listSelectorBorder)
      [sample rows — checkboxBg, checkboxDone, separator, textDepth[*], textDone]
      top-inset-shadow     (gradient rect — visual only, not a token)
    todo-bottom-toolbar    (frame, 360×42, fill = none)
      toolbar-kebab-icon   (real SVG group — iconColor)
      toolbar-add-btn      (placeholder ellipse + "+" text — no SVG yet)
      toolbar-collapse-btn (real SVG group — iconColor)
      toolbar-expand-btn   (real SVG group — iconColor, hidden)
  android_navigation_bar   (rect, 360×48, fill = white — OS controlled, not a token)
```

**Design rules for T2:**
- Frames have no fill — backgrounds live on named rect layers inside them
- `bg` token = `android_status_bar` fill color
- `headerBg` is NOT used as a frame fill — the gradient shows through the transparent header frame
- `listSelectorBorder` controls both the list selector bottom border AND the scroll area full border
- Priority is shown via text color on sample rows (`priorityTop`, `priorityElevated`) — not as side bars

---

## The Authoring Workflow

### Creating a new theme

1. In Figma, duplicate the `Default Theme` page
2. Rename the page to the new theme name (e.g. `Cape Cod Shore`)
3. In T2, rename the frame from `[Default]` to `[Cape Cod Shore]`
4. Edit T2 visually — change fills, stroke colors, gradient stops to design the theme
5. When ready, tell Claude: "read T2 and update the cards"

### Claude's read-back process

1. **Snapshot** — Claude calls `use_figma` to read all named layers in T2: fills, strokes, positions
2. **Diff** (optional) — if a prior snapshot exists in context, Claude surfaces only what changed
3. **Update cards** — Claude rewrites cards 3, 4, 5 with the current values from T2
4. **Generate code** — Claude outputs a new Theme object for `lib/theme.tsx`

**Layer names must stay stable.** If you rename a layer between snapshot and diff, Claude sees it as deleted + added (breaks the diff). Only `List Name` text content is expected to change.

### Claude's diff capability

- Take snapshot before you start: "take a snapshot"
- Make your changes in Figma
- Say "diff and update cards" when done
- Claude reports what changed (e.g. `listSelectorBg: #ffe8a9 → #d4eaf5`) and rewrites the cards
- Up to ~20 changes per diff cycle — no limit enforced

---

## Icon Status

Icons in T2 and card 5 are real Affinity Designer SVGs where available, emoji placeholders otherwise.

| Icon | Layer name | Status |
|---|---|---|
| App logo / theme picker | `turbo-todo-logo-btn` | ✅ Real SVG |
| List gear | `list-gear-btn` | ✅ Real SVG |
| Help | `help-icon` | ✅ Real SVG |
| Toolbar kebab / options | `toolbar-kebab-icon` | ✅ Real SVG |
| Toolbar collapse | `toolbar-collapse-btn` | ✅ Real SVG |
| Toolbar expand | `toolbar-expand-btn` | ✅ Real SVG (hidden) |
| Toolbar add new | `toolbar-add-btn` | ⏳ Placeholder (ellipse + "+") |
| Row add subtask | `row-add-subtask` | ⏳ Placeholder (emoji) |
| Row kebab | `row-kebab` | ⏳ Placeholder (emoji) |
| Priority elevated (bolt) | `priorityElevated` | ⏳ Placeholder (emoji) |
| Priority top (!) | `priorityTop` | ⏳ Placeholder (emoji) |

**Immediate todo:** Get remaining 5 SVGs from Affinity Designer and replace placeholders in T2 and card 5.

---

## Cards 3, 4, 5 — Info Card Design

Dark background (`#13151a`), three distinct accent colors:

| Card | Accent | Content |
|---|---|---|
| 3 — theme-values | Amber `#f5a623` | All 25 tokens: "what it controls" + token name + swatch + hex |
| 4 — menus-modals-and-values | Coral `#ff6b6b` | Menu, modal, priority tokens with semantic descriptions |
| 5 — icons-and-values | Cyan `#38d9e8` | 2-col icon grid: real icon shape + semantic label + token + hex |

Typography: Roboto, 10px semantic labels (white), 8.5px token names (muted), 9px hex values (light blue mono).

---

## Existing Themes in Code

| Theme ID | Display name | Character |
|---|---|---|
| `default` | Default | Warm gold/parchment gradient |
| `dark-slate` | Dark Slate | Near-black dark mode |
| `slate` | Slate | Cool gray, light mode |
| `bimini-breeze` | Bimini Breeze | Caribbean teal/sand |

---

## Token Reference (25 tokens)

### App background & gradient
| What it controls | Token |
|---|---|
| Android status bar fill (also outer background) | `bg` |
| 3-stop gradient filling the main list column | `gradientColors` |
| Position of each gradient stop (array of 3, 0–1) | `gradientLocations` |

### Header
| What it controls | Token |
|---|---|
| 1px line at top of header — separates from status bar | `headerBorder` |

### List selector
| What it controls | Token |
|---|---|
| Selector pill/box background | `listSelectorBg` |
| List name text | `listSelectorText` |
| Selector bottom border + scroll area full border | `listSelectorBorder` |

### Icons
| What it controls | Token |
|---|---|
| All header icons (logo, gear, help) and all toolbar + row icons | `iconColor` |

### Scroll area / list surface
| What it controls | Token |
|---|---|
| Main list body background | `surface` |
| Thin divider lines between rows | `separator` |

### Text
| What it controls | Token |
|---|---|
| Depth-0 (root) task label | `textDepth[0]` |
| Depth-1 (subtask) task label | `textDepth[1]` |
| Depth-2 (sub-subtask) task label | `textDepth[2]` |
| Note text, child-count badge, secondary info | `textSub` |
| Completed item text | `textDone` |

### Checkboxes & borders
| What it controls | Token |
|---|---|
| Unchecked checkbox fill | `checkboxBg` |
| Checked checkbox fill | `checkboxDone` |
| Checkbox border, modal and menu outlines | `border` |

### Priority / status (optional ornamentation)
| What it controls | Token |
|---|---|
| Elevated priority — color applied per theme (text, icon, bar, etc.) | `priorityElevated` |
| Top priority — color applied per theme | `priorityTop` |

### Menus & modals
| What it controls | Token |
|---|---|
| Kebab dropdown, AddChild menu, modal panel backgrounds | `menuBg` |
| Menu item and modal body text | `text` |
| Active/selected text, Save button background | `accent` |
| Destructive action text (Delete, Clear) | `danger` |

### TypeScript type
```ts
type Theme = {
  id: string;
  name: string;
  enabled?: boolean;
  bg: string;
  headerBorder: string;
  surface: string;
  menuBg: string;
  listSelectorBg: string;
  listSelectorText: string;
  listSelectorBorder: string;
  checkboxBg: string;
  checkboxDone: string;
  border: string;
  separator: string;
  text: string;
  textSub: string;
  textDone: string;
  textDepth: [string, string, string];
  iconColor: string;
  accent: string;
  danger: string;
  priorityElevated: string;
  priorityTop: string;
  gradientColors: string[] | null;
  gradientLocations: number[] | null;
};
```

---

## Adding a Theme to Code

```ts
// in lib/theme.tsx, add to the themes object:
'theme-id': {
  id: 'theme-id',
  name: 'Theme Display Name',
  enabled: true,
  bg: '#000000',
  // ... all 25 tokens
  gradientColors: ['#000000', '#000000', '#000000'],
  gradientLocations: [0, 0.5, 1],
},
```

Set `enabled: false` to hide from the picker without deleting.
