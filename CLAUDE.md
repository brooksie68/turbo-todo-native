# TurboTodo Native — Claude Context

React Native + Expo conversion of TurboTodo web app. Target: native Android. Same Supabase backend as web app.

**Project dir:** `C:/Users/brook/ai-projects/turbo-todo-native/`
**Dev:** `npx expo start` (use dev build APK, not Expo Go)
**EAS:** `eas build --profile development --platform android`

## Stack
- Expo SDK 54, Expo Router, TypeScript
- Supabase (same project as web app)
- AsyncStorage for local persistence
- expo-image-picker (gallery + camera)
- react-native-draggable-flatlist + reanimated 4.1.1 + gesture-handler (Phase 7)
- expo-linear-gradient (JS installed, needs next build for native)
- `.npmrc` has `legacy-peer-deps=true` (peer dep conflict workaround)

## Phase status
- ✅ Phase 1 — Scaffold (Expo + Router + TypeScript)
- ✅ Phase 2 — Auth (Supabase session, sign-in, password reset)
- ✅ Phase 3 — Core data + tree render
- ✅ Phase 4 — CRUD (add/edit/delete/complete, toolbar, menus)
- ✅ Phase 5 — Images (local via expo-file-system) + Links (Supabase)
- ✅ Phase 6 — Theme system (Default + Bimini Breeze, ThemeContext, all colors abstracted)
- ✅ Phase 7 — Drag-and-drop reorder (live, long-press to drag, parent auto-collapse)
- ✅ Phase 9 — EAS dev build complete, APK installed, using dev build not Expo Go
- ⬜ Phase 8 — Polish (pixel-perfect header/toolbar, performance)

## Key decisions
- Options menus: positioned dropdowns (not bottom sheets) — matches web app exactly
- Theme picker: logo button dropdown (same as web app)
- No drag handles — long-press row body to initiate drag
- Parent auto-collapses on drag start, re-expands on drop
- Images stored locally (expo-file-system), not Supabase Storage
- Links stored in Supabase `task_links` table

## Todo
- [x] Install dev build APK and test drag-and-drop
- [ ] Bimini Breeze gradient bg — expo-linear-gradient installed (JS only, native not in build yet). Next rebuild must include it. Gradient: `['#fdf5e0', '#c8f0e8', '#7dd8cc']` locations `[0, 0.6, 1]`. Currently using `#c8f0e8` solid fallback.
- [ ] Scrolling/DnD performance — native feels choppier than web, needs profiling
- [ ] QA pass: expand/collapse, drag-and-drop, menus, images, links, themes
- [ ] Phase 8: pixel-perfect header/toolbar polish
- [ ] Phase 9: production EAS build (include expo-linear-gradient in build)
