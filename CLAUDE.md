# TurboTodo Native — Claude Context

**Always use numbered lists** when displaying the Todo section, asking questions, or offering any list of options to James. Keeps replies token-efficient.

React Native + Expo conversion of TurboTodo web app. Target: native Android. **Local-first storage (SQLite on device).** Supabase is optional future sync feature only.

**Project dir:** `C:/Users/brook/ai-projects/turbo-todo-native/`
**JS-only changes:** `eas update --branch preview --platform android --message "..."` — no build needed, OTA to device
**New native package:** `eas build --profile preview --platform android` — required when adding native packages or changing app.json plugins

## Current state (as of 2026-05-13)

**Git HEAD:** `c800240` — "feat(themes): add Cape Cod Sunset theme (gradient WIP)" — uncommitted session changes pending
**Active branch:** `main`
**Base APK:** build 10 (versionCode 10), built from `6de6e5e`, still installed on device

**Device state:** 8 themes on device, OTA current. Cape Cod Sunset FIXED — image bleeds full screen + through status bar, scroll area shows amber→blue gradient at 85% opacity. Muir Light also fixed (same image-backed pattern).

### What was done this session (2026-05-13)
- **Full background layer architecture refactor** — new 3-layer model: `appBgLayer` / `statusBarBg` / `scrollAreaBg`
- **Theme type refactored** (`lib/theme.tsx`) — discriminated union types for appBgLayer (solid/gradient/image) and scrollAreaBg (solid/gradient); removed `bg`, `surface`, `gradientColors`, `gradientLocations`, `backgroundImage`; added `themeClass`, `themeLabel`
- **All 8 theme files migrated** to new token structure with L/D classification labels
- **ThemeBg component rewritten** — switches on `appBgLayer.type`; image type = raw ImageBackground, no overlay
- **ScrollAreaBgView component added** — handles solid or gradient scroll area background
- **Status bar fixed** — `ThemeBg` moved outside `SafeAreaView`; `statusBarBg: 'transparent'` enables full image bleed behind status bar
- **`surface` token removed** — all UI modals/dropdowns/cards migrated to `menuBg`
- **Theme picker reordered** — L themes first (L1→L4), D themes after (D1→D4); `index.ts` updated
- **Cape Cod Sunset fixed** — `appBgLayer: image`, `scrollAreaBg: gradient` (`#172735d9`→`#744325d9`), `statusBarBg: transparent`
- **Muir Light fixed** — same image-backed pattern; erroneous full-screen gradient overlay dropped
- **Figma updated** — pages renamed/reordered to L1-L4/D1-D4 scheme; layer names updated (`bg-gradient`→`appBgLayer`, `android_status_bar`→`statusBarBg`, `todo-scroll-area`→`scrollAreaBg`); CLASSIFICATION section added to all 8 T2 frames
- **2 OTA pushes** — update groups `b69123c6` (main refactor) + `0174367b` (status bar fix)

### What was done last session (2026-05-12)
- **Cape Cod Sunset theme added** — new `lib/themes/cape-cod-sunset.ts`, `assets/backgrounds/capecod.png` bundled
- **`/drop-themes` copied to global commands** — now works from worktrees

### Lessons learned (locked in)
- `2ce078c` committed 7 features in one batch without on-device testing → cascading crashes
- **Rule going forward: one feature at a time, implement → test on device → commit**
- OTA fingerprint is computed from `node_modules` content — leftover packages after rollback cause mismatch
- `npm ci` before APK build ensures clean fingerprint
- `eas update` without `--platform android` also builds + uploads iOS bundles unnecessarily — always use `--platform android`

## Stack
- Expo SDK 54, Expo Router, TypeScript
- expo-sqlite (local SQLite DB — primary data store)
- AsyncStorage for local persistence (images, preferences)
- expo-image-picker (gallery + camera)
- expo-file-system (image storage + backup I/O)
- expo-document-picker (backup restore — file picker)
- expo-sharing (backup export — share sheet)
- expo-linear-gradient (gradient bg)
- react-native-draggable-flatlist + reanimated 4.1.1 + gesture-handler
- react-native-zip-archive@7.0.2 (backup zip — pinned to 7.0.2, 7.1.0 has Gradle bug)

## Production build
- APK sideloaded on James's Android device
- OTA updates via expo-updates, channel: preview
- runtimeVersion policy: appVersion (currently "1.0.0")
- Current APK: build 10 (versionCode 10), built from `6de6e5e`
- **Workflow: edit code → `eas update --branch preview --platform android --message "..."` → kill + relaunch app. No Metro server needed.**

## App icon
- Adaptive icon: `assets/adaptive-icon-fg.png` (1024x1024, logo centered in safe zone, transparent bg) + `assets/adaptive-icon-bg.png` (1024x1024, gold gradient)
- Fallback: `assets/icon.png` (1024x1024, composed flat icon)
- Source files: `C:/Users/brook/ai-projects/turbo-todo/images/native-icons/`

## Features (shipped and stable)
- 3+ lists, todos fully loaded from original Supabase migration
- Add/edit/delete tasks at all depths (3 levels max)
- Complete/uncomplete with optimistic updates
- Drag-and-drop reorder (long-press, siblings only, parent auto-collapse); checked items cannot be dragged
- Collapse/expand individual items and all at once
- Status: elevated (bolt icon), top-priority (exclamation icon)
- Notes on any item; inline delete X right-aligned under kebab; note strikethrough when item checked
- Images on depth-0 and depth-1 items (local file system, up to 5); AddChildMenu has "Image" (gallery, multi-select) and "Take photo" (camera, single shot)
- Links on depth-0 and depth-1 items (SQLite task_links table)
- Export for AI (share sheet, markdown outline)
- 7 themes: Default, Dark Slate, Deep Blue, Bimini Breeze, Forest Canopy, Muir Light, Biomech — theme picker via logo button dropdown
- Child count badge on collapsed parents ("- N")
- Pin to top: depth-0 only, floats above incomplete list, blocks drag
- Row UI: IconCreateNew (add subtask) + IconOptions (kebab)
- **Gear menu (header):** New list / Rename / Delete list with confirm; Rename + Delete hidden for Daily List
- **Help modal:** Full scrollable help, all 17 sections documented, themed. Each section has a UI illustration built from real theme tokens + existing Icon components (HelpIllustrations.tsx). Section headers: 15pt / 800 weight / uppercase. App Info section at bottom with share button.
- **Backup system:** zip archive containing JSON (all lists/todos/links) + image files organized by todo ID. Export via share sheet, restore via file picker. One zip = complete backup.
- **Daily List:** On/Off toggle in toolbar options. Daily list sorted to front of list picker. Items sent from any list land at top of Daily List as depth-0 singletons. At midnight (checked before first render), items with a source list restore to their origin list as depth-0 orphans above completed items; natively-added daily items are deleted. Daily List hides Subtask in AddChildMenu; gear menu shows only New List.
- **Alarms:** daily repeating notifications via expo-notifications; "Set alarm" in depth-0/1 kebab menus; bell icon on row; auto-cancel on complete/delete
- **Text size:** 5 steps (small/normal/large/xlarge/xxlarge), toolbar options +/− control, persisted to AsyncStorage
- **Clear completed per group:** "Clear completed" in depth-0 kebab (conditional on having completed children); recursively removes all completed descendants
- **Computed position labels:** FlatItem carries `positionLabel` string — internal, not displayed; foundation for future features
- **Sound effects:** expo-av, 10 sounds mapped to actions, on/off toggle in toolbar options

## Theme system

### Files
- `lib/themes/*.ts` — one file per theme (add theme = create file + one line in index)
- `lib/themes/index.ts` — theme registry
- `lib/theme.tsx` — `Theme` type, `ThemeProvider`, `useTheme`, `useThemeContext`
- `themes.md` — deep reference: full token table, Figma layer map, authoring workflow

### Rules
- Adding a theme: create `lib/themes/your-theme.ts` → import + register in `index.ts`
- Hiding a theme: set `enabled: false` in the theme file
- Each theme's values are canon for that theme — never compare across themes
- Read `themes.md` before any Figma theme work

### Iterative edit workflow (theme tuning — full steps in `themes.md`)
1. James edits the `[Theme] - Edit` Section in Figma (sandbox T1 — never the main T1)
2. Claude reads Edit T2 → updates `lib/themes/[theme].ts` → outputs OTA command for James to run
3. Repeat until happy
4. Final: Claude overwrites main T2 in Figma with final values, deletes Edit section, commits `.ts` file
- **"App icons" = ALL icons**: header (logo, gear, help), toolbar (kebab, add, collapse, expand), AND row-level (IconPin, IconCreateNew, IconOptions)**
- **Never edit main T1 or info frames during iteration**
- **Never run the OTA command — always give James the string to run himself** (unless James explicitly grants permission for the session)

### Figma
- **Theme authoring file:** `wUMtjlawjc3wFuROGfYuO6` — https://www.figma.com/design/wUMtjlawjc3wFuROGfYuO6/todo-app-themes
- Pages: **L1 - Default** · L2 - Forest Canopy · L3 - Bimini Breeze · L4 - Muir Light · **D1 - Dark Slate** · D2 - Deep Blue · D3 - Biomech · D4 - Cape Cod Sunset · ARCHIVE - DO NOT TOUCH
- L1 - Default T1 frame node: `5:2`
- Each theme page has 5 frames: `[Theme Name]` (T1) | `theme-values` (T2) | `menus-modals-and-values` (T3) | `icons-and-values` (T4) | `ui-attributes` (T5)
- T2 layer names: `appBgLayer` (full-screen base) · `statusBarBg` · `scrollAreaBg` (scroll area) · `themeClass` + `themeLabel` in CLASSIFICATION section at bottom
- Use `get_design_context` (REST) to read across pages; `use_figma` (Plugin API) for writes — must call on current page

### Theme classification
- `themeClass: 'light' | 'dark'` — picker grouping; all light themes listed before dark
- `themeLabel: string` — sort label: L1, L2, L3, L4 (light) / D1, D2, D3, D4 (dark)
- Current: **L1** Default · **L2** Forest Canopy · **L3** Bimini Breeze · **L4** Muir Light · **D1** Dark Slate · **D2** Deep Blue · **D3** Biomech · **D4** Cape Cod Sunset
- Add new light themes at bottom of L group, dark at bottom of D group

### Background layers (3-layer model)
| Layer | Token | Type | Notes |
|---|---|---|---|
| 1 — full-screen base | `appBgLayer` | `SolidBg \| GradientBg \| ImageBg` | Raw — no overlay. Image type = `{ type: 'image', source: require(...) }` |
| 2 — mid tint | *(reserved)* | — | Not implemented. Future optional semi-opaque tint above appBgLayer |
| 3 — scroll area | `scrollAreaBg` | `SolidBg \| GradientBg` | Any opacity. Sits on top of appBgLayer |
| — | `statusBarBg` | `string \| 'transparent'` | `'transparent'` = image bleeds behind status bar |

### 26 tokens (what each controls)
| Token | Controls |
|---|---|
| `appBgLayer` | Full-screen base — solid, gradient, or photo |
| `statusBarBg` | Android status bar fill; `'transparent'` = image bleeds through |
| `scrollAreaBg` | Todo scroll area background — solid or gradient, any opacity |
| `headerBg` | Header bar bg — reserved, not yet in code |
| `headerBorder` | 1px line at top of header |
| `footerBorder` | 1px line at bottom of toolbar |
| `menuBg` | Bottom sheet, dropdowns, modals, card backgrounds |
| `border` | Scroll area border, checkbox border, modal outlines |
| `separator` | Row separator lines |
| `listSelectorBg` | List selector pill background |
| `listSelectorText` | List name text + arrow |
| `listSelectorBorder` | List selector bottom underline |
| `text` | Primary body text, modal titles, menu items |
| `textSub` | Notes, badges, secondary info |
| `textDone` | Struck-through completed item text |
| `textDepth` | `[d0, d1, d2]` task label color by depth |
| `accent` | Active states, Save buttons, selected list item |
| `danger` | Destructive actions, invalid drag indicator |
| `iconColor` | All SVG icons — header, toolbar, row |
| `priorityElevated` | Bolt icon + elevated task label |
| `priorityTop` | Exclamation icon + top-priority task label |
| `checkboxBg` | Unchecked checkbox fill |
| `checkboxDone` | Checked checkbox fill + border |
| `checkmarkColor` | SVG checkmark inside done checkbox |
| `statusBarStyle` | `'dark'` or `'light'` for Android status bar icons |

### Structural attributes (not tokenized — same across all themes)
| Element | Attribute | Value |
|---|---|---|
| Header | height | 64px |
| Logo btn | size / left / top | 40px / 8 / 12 |
| List selector | width / height / left / top / borderRadius / paddingH | 189 / 34 / 60 / 15 / 3 / 8 |
| Gear btn | size / left / top | 24px / 262 / 20 |
| Help btn | size / right / top | 24px / 19 / 20 |
| Scroll area | marginH / borderWidth / borderRadius | 8 / 1 / 2 |
| Inset shadow | height / opacity | 5px / 0.08 |
| Row | paddingVertical / paddingRight / gap | 8 / 12 / 8 |
| Row indent | base + per-depth | 8 + (depth × 20) |
| Checkbox | size / borderWidth / borderRadius | 20 / 1 / 1 |
| Checkmark icon | size | 12px |
| Row add icon | size | 18px |
| Row options icon | size | 18px |
| Row pin icon | size | 18px |
| Row bell icon | size | 14px |
| Priority icons | size | 16px |
| rowActions gap | gap | 12px |
| Note text | fontSize / style | 12px / italic |
| Separator | height | 1px |
| Toolbar | inner height | 46px |
| Toolbar icons | size | 24px |
| Typography (normal) | d0 / d1 / d2 | 16 / 15 / 14px |

## Toolbar options menu (bottom sheet)
1. Back up | Restore (split row, top)
2. Sort by: Status | Date | Alpha
3. Daily List: On | Off (active option bold)
4. Sounds: On | Off
5. Text size: − / + controls
6. Clear all completed (recursive — removes completed at all depths)
7. Clear entire list (with confirm)

## Figma
- **Design file:** https://www.figma.com/design/1j3iOtMrXTHjyuWXLekcEh/Turbo-Todo (file key: `1j3iOtMrXTHjyuWXLekcEh`, 360×800 template node: `91:25`)
- **Theme authoring file:** https://www.figma.com/design/wUMtjlawjc3wFuROGfYuO6/todo-app-themes (file key: `wUMtjlawjc3wFuROGfYuO6`)
- Claude can read AND write both files via the Figma MCP (`use_figma` Plugin API, `get_design_context` for reading)
- **Full theme workflow documented in `themes.md`** — read that file before doing any theme work
- Never use expiring Figma MCP asset URLs in code — they expire in 7 days

## Key files
- `lib/db.ts` — SQLite init, schema, WAL mode, migrations
- `lib/types.ts` — List, Todo types (includes daily_source_* fields)
- `lib/theme.tsx` — Theme type, ThemeProvider, useTheme, useThemeContext
- `lib/themes/index.ts` — theme registry
- `lib/themes/*.ts` — individual theme files
- `lib/backup.ts` — exportBackup, importBackup
- `lib/imageStore.ts` — AsyncStorage image helpers
- `lib/linkStore.ts` — SQLite link helpers
- `lib/dailyList.ts` — getDailySettings, saveDailySettings, restoreAllDailyItems, runMidnightCheck, getDailyDateString
- `lib/alarms.ts` — scheduleAlarm, cancelAlarm, requestNotificationPermission
- `hooks/useTodoData.ts` — all data logic, CRUD, list management (createList/renameList/deleteList)
- `hooks/useOverlayState.ts` — menu/modal state
- `components/TodoList.tsx` — main shell
- `components/TodoListHeader.tsx` — header bar, list picker, gear menu, theme picker
- `components/TodoListToolbar.tsx` — bottom toolbar
- `components/TodoItem.tsx` — row renderer
- `components/ToolbarOptionsMenu.tsx` — bottom sheet options
- `components/ItemOptionsMenu.tsx` — per-item dropdown
- `components/HelpModal.tsx` — full-screen help overlay; App Info section at bottom
- `components/Icons.tsx` — all SVG icons (includes IconShare, IconCheckmark)

## Data model (SQLite)
- `lists`: id, name, sort_order, inserted_at
- `todos`: id, list_id, parent_id, task, note, is_complete, status, sort_order, inserted_at, pinned, alarm_time, notification_id, daily_source_list_id, daily_source_parent_id, daily_source_sort_order
- `task_links`: id, todo_id, url, name, sort_order
- Images: expo-file-system at `task-images/{todoId}/{filename}` + AsyncStorage metadata keys `turbotodo-images-{todoId}`
- Daily settings: AsyncStorage key `turbotodo-daily` → `{ enabled: boolean; listId: number | null; date: string }`

## Important notes
- react-native-zip-archive must stay at 7.0.2 — 7.1.0 has a Java switch/double type mismatch compile error
- SQLite returns booleans as 0/1 integers — cast with `!!` on fetch
- No drag handles — long-press row body initiates drag
- Pinned items float to top of incomplete list, cannot be dragged
- Checked items cannot be dragged (onLongPress returns undefined if is_complete)
- Daily list midnight check runs in `_layout.tsx` before first render — `useState(false)` for `ready`, returns null until resolved
- DB migrations are idempotent try/catch ALTER TABLE calls — safe to re-run
- `removeCompletedRecursive` is a module-level pure helper in useTodoData.ts — used by both clearCompleted and clearCompletedInGroup
- **OTA channel is `preview` not `production`** — always use `eas update --branch preview --platform android`
- **One feature at a time rule:** implement → test on device → commit. No batch commits on untested features.
- `Constants.nativeBuildVersion` currently falls back to `'10'` in HelpModal — will return real value once next APK is built with versionCode set

## Todo

### Next up (one at a time, test each before committing)
1. **Git commit + push** — session changes uncommitted; stage all modified files in `lib/` and `components/`
2. **Add missing T1 named layers for Cape Cod Sunset** — `menuBg`, `text`, `textSub`, `accent` still inferred; need proper swatches in Figma T1 (note: `surface` token is gone — remove any `surface` swatch layer if present)
3. Run /drop-themes on all pages to sync T2–T5 info frames with actual token values under new naming scheme
4. Bimini Breeze T1: sample row content (checkboxes, text colors) still shows Default template colors — update
5. Background images: James is generating via GPT — add new ones to `assets/backgrounds/` and wire up as themes

### Theme system improvements identified
- [ ] Add swatch layers for invisible tokens to T2 template: `text`, `textSub`, `accent`, `danger`, `priorityElevated`, `priorityTop`, `menuBg`, `footerBorder` — currently unreadable from Figma
- [ ] Add `iconGradient: string[] | null` token — app falls back to `iconColor` solid if null
- [ ] Split `checkboxDone` into `checkboxDoneBg` + `checkboxDoneBorder` — currently one token controls both

### Backlog

#### Bugs
- [ ] Bug: Logo briefly shows with no background on app load — looks unprofessional
- [ ] Bug: Row-level Add menu near bottom of screen gets clipped before flip point triggers
- [ ] Bug: Note/URL close X should use `theme.iconColor` not `theme.accent` — same as URL close X

#### Features
- [ ] Print export / Tear Sheet — needs proper Android PDF fix (use `width: 612` only, no height; wrap entire dynamic import in try/catch)
- [ ] Auto-collapse completed subtasks after 10 — show collapse arrow + count ("11 more") instead of hiding
- [ ] Progress bar and/or percentage completion
- [ ] Reverse logo teeth direction
- [ ] Density toggle in toolbar options — tighter/looser padding and margins
- [ ] Tappable phone numbers on tasks
- [ ] Full calendar items (not just timed alarms)
- [ ] Teach Claude to read JSON backup files → foundation for desktop app
- [ ] Android widget
- [ ] Archive completed items — stored, downloadable as JSON; long-term: trends chart
- [ ] Calendar view for archived/completed items — days where the user checked off regular tasks show a ✓; days where Daily List tasks were completed show a ★; tap any day to review or export those items
- [ ] Android emulator autonomous debug workflow
- [ ] Animate logo in splash screen
- [ ] Export to CSV and XLSX
- [ ] Finish Figma theme builder template
- [ ] Clean up current themes and make new ones
- [ ] Magic meal machine integration
- [ ] Gardening app integration (planting windows, works with this app)
- [ ] Categories
- [ ] Verify OTA message field appears in App Info (manifest metadata path may not be correct)

#### Paid / Monetization (long-term)
- [ ] Paid tiers: extra depth levels, online backups, long archive time
- [ ] Paid feature: shared lists
- [ ] Supabase sync as optional paid backup feature

### App Name Shortlist
TaskBlast, TaskBlaster, TaskSaw, TaskTree, Stacked, Momentum, StackFlow, TaskMaster, Getterdunn, Giterdone, Buzzsaw, Mobile Mind, Don't Forget!
