# TurboTodo Native — Theme Reference

---

## The 25 theme tokens

### App background
| What it colors | Token |
|---|---|
| Outer app background (visible at screen edges, behind the gradient) | `bg` |
| 3-stop gradient that fills the main list column (array of 3 hex values) | `gradientColors` |
| Position of each gradient stop — array of 3 values from 0 to 1 | `gradientLocations` |

### Header bar
| What it colors | Token |
|---|---|
| Header bar background fill | `headerBg` |
| Bottom edge line of the header | `headerBorder` |

### List selector (the dropdown button in the header)
| What it colors | Token |
|---|---|
| Pill/box background | `listSelectorBg` |
| List name text and the ▼ arrow | `listSelectorText` |
| Bottom border line on the selector | `listSelectorBorder` |

### Header + toolbar icons
| What it colors | Token |
|---|---|
| All header icons (logo, gear, help) and all toolbar icons | `iconColor` |

### Scroll area / list surface
| What it colors | Token |
|---|---|
| Main list body background; also modal boxes and dropdown menus | `surface` |
| Thin divider lines between rows | `separator` |

### Todo rows — text
| What it colors | Token |
|---|---|
| Depth-0 (top-level) task label | `textDepth[0]` |
| Depth-1 (subtask) task label | `textDepth[1]` |
| Depth-2 (sub-subtask) task label | `textDepth[2]` |
| Note text, child-count badge, secondary info | `textSub` |
| Any text on a checked/completed item | `textDone` |

### Todo rows — checkboxes and borders
| What it colors | Token |
|---|---|
| Unchecked checkbox fill | `checkboxBg` |
| Checked checkbox fill and the checkmark itself | `checkboxDone` |
| Checkbox border, row borders, modal and menu outlines | `border` |

### Todo rows — priority/status icons
| What it colors | Token |
|---|---|
| Bolt icon (elevated priority) | `priorityElevated` |
| Exclamation icon (top priority) | `priorityTop` |

### Menus and dropdowns
| What it colors | Token |
|---|---|
| Per-item options menu (kebab dropdown) background | `menuBg` |
| Standard menu item text | `text` |
| Active/selected item text; modal titles; Save button background | `accent` |
| Destructive action text (Delete, Delete list, Clear all) | `danger` |

---

## How to define a theme in code

Themes live in `lib/theme.tsx` in the `themes` object. Each theme is a key → Theme object. Add `enabled: false` to hide a theme from the picker without deleting it.

```ts
'my-theme': {
  id: 'my-theme',
  name: 'My Theme',
  enabled: true,
  bg: '#000000',
  headerBg: '#000000',
  headerBorder: '#000000',
  surface: '#000000',
  border: '#000000',
  text: '#000000',
  textSub: '#000000',
  textDone: '#000000',
  textDepth: ['#000000', '#000000', '#000000'],
  accent: '#000000',
  danger: '#000000',
  priorityElevated: '#000000',
  priorityTop: '#000000',
  iconColor: '#000000',
  listSelectorBg: '#000000',
  listSelectorText: '#000000',
  listSelectorBorder: '#000000',
  checkboxBg: '#000000',
  checkboxDone: '#000000',
  separator: '#000000',
  menuBg: '#000000',
  gradientColors: ['#000000', '#000000', '#000000'],
  gradientLocations: [0, 0.5, 1],
},
```

---

## Figma theme template

Frame name = theme name (used directly in code as the theme's `name` field).
Each swatch in the frame is named exactly as the token name above.
`textDepth` has three swatches: `textDepth[0]`, `textDepth[1]`, `textDepth[2]`.
`gradientColors` has three swatches: `gradientColors[0]`, `gradientColors[1]`, `gradientColors[2]`.
`gradientLocations` recorded as a text note: e.g. `0 / 0.5 / 1`.

---

## Existing themes

| Theme ID | Display name | Character |
|---|---|---|
| `default` | Default | Warm gold/parchment gradient |
| `dark-slate` | Dark Slate | Near-black dark mode |
| `slate` | Slate | Cool gray, light mode |
| `bimini-breeze` | Bimini Breeze | Caribbean teal/sand |
