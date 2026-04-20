# TurboTodo Native — Claude Context

React Native + Expo conversion of TurboTodo web app. Target: native Android. **Local-first storage (SQLite on device).** Supabase is optional future sync feature only.

**Project dir:** `C:/Users/brook/ai-projects/turbo-todo-native/`
**Dev:** `npx expo start` (use dev build APK, not Expo Go)
**EAS:** `eas build --profile development --platform android`

## Stack
- Expo SDK 54, Expo Router, TypeScript
- expo-sqlite (local SQLite DB — primary data store, no Supabase required)
- AsyncStorage for local persistence (images, preferences)
- expo-image-picker (gallery + camera)
- expo-linear-gradient (gradient bg)
- react-native-draggable-flatlist + reanimated 4.1.1 + gesture-handler
- `.npmrc` has `legacy-peer-deps=true` (peer dep conflict workaround)

## Phase status
- ✅ Phase 1 — Scaffold (Expo + Router + TypeScript)
- ✅ Phase 2 — Auth gate removed; app routes directly to todo list
- ✅ Phase 3 — Core data + tree render
- ✅ Phase 4 — CRUD (add/edit/delete/complete, toolbar, menus)
- ✅ Phase 5 — Images (local via expo-file-system) + Links (SQLite task_links)
- ✅ Phase 6 — Theme system (Default + Bimini Breeze, gradient bg, ThemeContext)
- ✅ Phase 7 — Drag-and-drop reorder (live, long-press to drag, parent auto-collapse)
- ✅ Phase 9 — EAS dev build complete, APK installed, using dev build not Expo Go
- ✅ Local storage migration — SQLite schema, data layer rewrite, Supabase export + import (79 todos, 3 lists live on device)
- ⬜ Phase 8 — Polish (pixel-perfect header/toolbar, performance)

## Key decisions
- **Local-first**: All data in SQLite on device. No Supabase dependency for core use.
- Supabase sync = future paid feature (not built yet)
- Auth removed — single user, no login screen
- Options menus: positioned dropdowns (not bottom sheets) — matches web app exactly
- Theme picker: logo button dropdown (same as web app)
- No drag handles — long-press row body to initiate drag
- Parent auto-collapses on drag start, re-expands on drop
- Images stored locally (expo-file-system + AsyncStorage)
- Links stored in SQLite `task_links` table

## Data migration
- Export script: `scripts/export-supabase.js` — pulls from Supabase, writes `scripts/migration-data.json`
- In-app: toolbar menu → **Import from Supabase** — one-time import, guarded by AsyncStorage flag
- Migration data bundled at: `lib/migration-data.json`
- Migration function: `lib/migration.ts`

## Todo

### Active
- [ ] QA pass: expand/collapse, drag-and-drop, menus, images, links, themes
- [ ] Phase 8: pixel-perfect header/toolbar polish
- [ ] Fix child count indicator: not showing; show number of direct children instead of +
- [ ] Pin item to top (depth 0 only): pin icon after text, blocks drag/drop, "Unpin item" in options menu
- [ ] Production EAS build
- [ ] Supabase sync as optional paid backup feature (long-term)

### Backlog
- [ ] Move item to another list (e.g. daily list)
- [ ] Print export to a thin paper list with checkboxes
- [ ] Close up indenting
- [ ] Archive completed items — stored, downloadable as JSON
- [ ] Animate logo in splash screen
- [ ] Row level add: menu of choices (Subtask, Image, URL); add URL and images to parent items directly
- [ ] Image and URL rows should be able to be checked off with checkboxes
- [ ] App top bar color changes when theme switches
- [ ] Add "send to top or bottom" to options menu
- [ ] Make Add Subtask just a plus icon; simplify bottom toolbar
- [ ] Export to CSV and XLSX
- [ ] Spellchecker (or OS function?)
- [ ] Add OK check to new items as well as Enter
- [ ] Magic meal machine integration
- [ ] Gardening app integration — planting windows
- [ ] List row alert level icons (need SVGs)
- [ ] Investigate keyboard options (à la Google Keep)
- [ ] Categories
- [ ] Alerts
