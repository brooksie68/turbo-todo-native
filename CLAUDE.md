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

## Features (all shipped as of 2026-04-22)
- 3 lists, todos fully loaded from original Supabase migration
- Add/edit/delete tasks at all depths (3 levels max)
- Complete/uncomplete with optimistic updates
- Drag-and-drop reorder (long-press, siblings only, parent auto-collapse)
- Collapse/expand individual items and all at once
- Status: elevated (bolt icon), top-priority (exclamation icon)
- Notes on any item
- Images on depth-1 items (local file system, up to 5)
- Links on depth-1 items (SQLite task_links table)
- Export for AI (share sheet, markdown outline)
- 2 themes: Default (gold gradient), Bimini Breeze (teal gradient)
- Theme picker via logo button dropdown
- Child count badge on collapsed parents ("- N")
- Pin to top: depth-0 only, floats above incomplete list, blocks drag
- Row UI: + button (add subtask) + kebab (options), 14px gap
- **Gear menu (header):** New list / Rename / Delete list with confirm
- **Help modal:** Full scrollable help, all features documented, themed
- **Backup system:** zip archive containing JSON (all lists/todos/links) + image files organized by todo ID. Export via share sheet, restore via file picker. One zip = complete backup.
  - Export: toolbar options → Back up → share sheet → save zip to Google Drive
  - Restore: toolbar options → Restore → confirm → file picker → pick zip → full restore
  - lib/backup.ts: `exportBackup()` and `importBackup()`
  - react-native-zip-archive@7.0.2 for zip/unzip, expo-sharing for share sheet, expo-document-picker for file picker

## Toolbar options menu (bottom sheet)
1. Back up | Restore (split row, top)
2. Sort by: Status | Date | Alpha
3. Clear all completed
4. Clear entire list (with confirm)

## Key files
- `lib/db.ts` — SQLite init, schema, WAL mode
- `lib/types.ts` — List, Todo types
- `lib/theme.tsx` — ThemeContext, themes, ThemeBg
- `lib/backup.ts` — exportBackup, importBackup
- `lib/imageStore.ts` — AsyncStorage image helpers
- `lib/linkStore.ts` — SQLite link helpers
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
- `todos`: id, list_id, parent_id, task, note, is_complete, status, sort_order, inserted_at, pinned
- `task_links`: id, todo_id, url, name, sort_order
- Images: expo-file-system at `task-images/{todoId}/{filename}` + AsyncStorage metadata keys `turbotodo-images-{todoId}`

## Important notes
- react-native-zip-archive must stay at 7.0.2 — 7.1.0 has a Java switch/double type mismatch compile error
- SQLite returns booleans as 0/1 integers — cast with `!!` on fetch
- No drag handles — long-press row body initiates drag
- Pinned items float to top of incomplete list, cannot be dragged

## Todo

### Active
- [ ] QA pass: expand/collapse, drag-and-drop, menus, images, links, themes, pin, gear menu, help
- [ ] Phase 8: pixel-perfect header/toolbar polish

### Backlog
- [ ] Move item to another list
- [ ] Print export to thin paper list with checkboxes
- [ ] Close up indenting
- [ ] Archive completed items — stored, downloadable as JSON
- [ ] Animate logo in splash screen
- [ ] Row level add: menu of choices (Subtask, Image, URL)
- [ ] Image and URL rows checked off with checkboxes
- [ ] App top bar color changes when theme switches
- [ ] Add "send to top or bottom" to options menu
- [ ] Simplify bottom toolbar
- [ ] Export to CSV and XLSX
- [ ] Spellchecker
- [ ] Magic meal machine integration
- [ ] Gardening app integration
- [ ] List row alert level icons
- [ ] Categories
- [ ] Alerts
- [ ] Supabase sync as optional paid backup feature (long-term)
