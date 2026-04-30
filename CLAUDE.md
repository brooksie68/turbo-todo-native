# TurboTodo Native — Claude Context

React Native + Expo conversion of TurboTodo web app. Target: native Android. **Local-first storage (SQLite on device).** Supabase is optional future sync feature only.

**Project dir:** `C:/Users/brook/ai-projects/turbo-todo-native/`
**JS-only changes:** `eas update --channel production --message "..."` — no build needed, OTA to device
**New native package:** `eas build --profile production --platform android` — required when adding native packages or changing app.json plugins

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
- OTA updates via expo-updates, channel: production
- runtimeVersion policy: appVersion (currently "1.0.0")
- **Workflow: edit code → `eas update` → kill + relaunch app. No Metro server needed.**

## App icon
- Adaptive icon: `assets/adaptive-icon-fg.png` (1024x1024, logo centered in safe zone, transparent bg) + `assets/adaptive-icon-bg.png` (1024x1024, gold gradient)
- Fallback: `assets/icon.png` (1024x1024, composed flat icon)
- Source files: `C:/Users/brook/ai-projects/turbo-todo/images/native-icons/`

## Features (all shipped as of 2026-04-25)
- 3+ lists, todos fully loaded from original Supabase migration
- Add/edit/delete tasks at all depths (3 levels max)
- Complete/uncomplete with optimistic updates
- Drag-and-drop reorder (long-press, siblings only, parent auto-collapse); checked items cannot be dragged
- Collapse/expand individual items and all at once
- Status: elevated (bolt icon), top-priority (exclamation icon)
- Notes on any item; inline delete X right-aligned under kebab; note strikethrough when item checked
- Images on depth-0 and depth-1 items (local file system, up to 5)
- Links on depth-0 and depth-1 items (SQLite task_links table)
- Export for AI (share sheet, markdown outline)
- 2 themes: Default (gold gradient), Bimini Breeze (teal gradient)
- Theme picker via logo button dropdown
- Child count badge on collapsed parents ("- N")
- Pin to top: depth-0 only, floats above incomplete list, blocks drag
- Row UI: + button (add subtask) + kebab (options)
- **Gear menu (header):** New list / Rename / Delete list with confirm; Rename + Delete hidden for Daily List
- **Help modal:** Full scrollable help, all features documented, themed
- **Backup system:** zip archive containing JSON (all lists/todos/links) + image files organized by todo ID. Export via share sheet, restore via file picker. One zip = complete backup.
  - Export: toolbar options → Back up → share sheet → save zip to Google Drive
  - Restore: toolbar options → Restore → confirm → file picker → pick zip → full restore
  - lib/backup.ts: `exportBackup()` and `importBackup()`
  - react-native-zip-archive@7.0.2 for zip/unzip, expo-sharing for share sheet, expo-document-picker for file picker
- **Daily List:** On/Off toggle in toolbar options. Daily list sorted to front of list picker. Items sent from any list land at top of Daily List as depth-0 singletons. At midnight (checked before first render), items with a source list restore to their origin list as depth-0 orphans above completed items; natively-added daily items are deleted. Daily List hides Subtask in AddChildMenu; gear menu shows only New List.
- **Alarms:** daily repeating notifications via expo-notifications; "Set alarm" in depth-0/1 kebab menus; bell icon on row; auto-cancel on complete/delete
- **Text size:** 5 steps (small/normal/large/xlarge/xxlarge), toolbar options +/− control, persisted to AsyncStorage
- **Clear completed per group:** "Clear completed" in depth-0 kebab (conditional on having completed children); recursively removes all completed descendants
- **Computed position labels:** FlatItem carries `positionLabel` string ("1", "2.3", "1.1.2") — internal, not displayed; foundation for future features

## Toolbar options menu (bottom sheet)
1. Back up | Restore (split row, top)
2. Sort by: Status | Date | Alpha
3. Daily List: On | Off (active option bold)
4. Clear all completed (recursive — removes completed at all depths)
5. Clear entire list (with confirm)

## Figma
- **Design file:** https://www.figma.com/design/1j3iOtMrXTHjyuWXLekcEh/Turbo-Todo (file key: `1j3iOtMrXTHjyuWXLekcEh`, 360×800 template node: `91:25`)
- **Theme authoring file:** https://www.figma.com/design/wUMtjlawjc3wFuROGfYuO6/todo-app-themes (file key: `wUMtjlawjc3wFuROGfYuO6`)
- Claude can read AND write both files via the Figma MCP (`use_figma` Plugin API, `get_design_context` for reading)
- **Full theme workflow documented in `themes.md`** — read that file before doing any theme work
- Never use expiring Figma MCP asset URLs in code — they expire in 7 days

## Key files
- `lib/db.ts` — SQLite init, schema, WAL mode, migrations
- `lib/types.ts` — List, Todo types (includes daily_source_* fields)
- `lib/theme.tsx` — ThemeContext, themes, ThemeBg
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
- `components/HelpModal.tsx` — full-screen help overlay
- `components/Icons.tsx` — all SVG icons

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

## Todo

### Active
- [x] **Default theme code sync** — `bg: '#ffbe30'`, `listSelectorBorder: '#025f96'` applied to `lib/theme.tsx` (2026-04-29)

### Icon system (2026-04-29, updated paths 2026-04-29)
All icons sourced from `_ref/app-icons/`. Figma T2 and `icons-and-values` frame both reflect current SVGs. `Icons.tsx` component map:
- `IconLogo` — turbo-todo-logo-btn (42×42, untouched)
- `IconGear` — list-gear-btn (updated path 2026-04-29)
- `IconHelp` — help-icon-btn (updated path 2026-04-29)
- `IconOptions` — kebab-options-btn (consolidated: toolbar + row kebab)
- `IconCreateNew` — create-new-btn (consolidated: toolbar FAB + row add child)
- `IconExpandDown` — toolbar-expand-btn (collapsed state)
- `IconExpandUp` — toolbar-collapse-btn (expanded state)
- `IconPriorityMedium` — priorityElevated / bolt (no stroke; was `IconBolt`)
- `IconPriorityHigh` — priorityTop (no stroke)
- `IconClose`, `IconBell`, `IconPin` — unchanged

**Icon sizes:** header = 24px, toolbar = 24px, row = 18px (create + options)

**T2 (Default Theme page):** row icons (IconCreateNew + IconOptions) visible on all rows; IconPin on pinned example row; all toolbar/header icons are current SVGs. SVG checkmarks replace old text ✓ in checkboxDone boxes.

### Bugs
- [ ] Cancel/save buttons need padding on regular subtask
- [ ] Add URL: label field and add button covered by keyboard
- [ ] URL not indented correctly when child of a depth-0 item
- [ ] Sounds not in new app

### Backlog
- [ ] Image attach: open camera immediately and attach photo taken
- [ ] Progress bar and/or percentage completion
- [ ] Auto-collapse completed subtasks after 10
- [ ] On checked items: lighten checkboxes, darken text slightly
- [ ] Reverse logo teeth direction
- [ ] Have Claude generate graphics for help items
- [ ] Teach Claude to read JSON backup files
- [ ] Android widget
- [ ] Archive completed items — stored, downloadable as JSON; long-term: trends chart
- [ ] Android emulator autonomous debug workflow
- [ ] Print export to thin paper list with checkboxes
- [ ] Animate logo in splash screen
- [ ] Export to CSV and XLSX
- [ ] Magic meal machine integration
- [ ] Gardening app integration (planting windows, works with this app)
- [ ] Categories
- [ ] Supabase sync as optional paid backup feature (long-term)

### App Name Shortlist
TaskBlast, TaskBlaster, TaskSaw, TaskTree, Stacked, Momentum, StackFlow, TaskMaster, Getterdunn, Giterdone, Buzzsaw, Mobile Mind, Don't Forget!
