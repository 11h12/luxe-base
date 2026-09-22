# Luxe extension — reverse-engineering notes

## Evidence from the legacy export

- `index.html` supplied the Next.js boot shell only. The real application was hydrated from `next/static/chunks/1bd8a6f1e7c95853.js` and uses a full-screen `relative min-h-screen` dashboard with image background, glass surfaces, white foreground text and a settings modal.
- Its UI text bundle is in `next/static/chunks/112e1f47fbd02a1f.js`; it confirms Vietnamese/English, clock, task views, mantras, background selection and integrations.
- The primary dashboard contains an updating clock, a mantra that rotates every 30 minutes, a task popover/list and persisted settings.

## Recovered Lark contract

The local backend is `http://localhost:3000` and the legacy client calls:

- `GET /api/lark/base/ping` with `credentials: 'include'` to test its OAuth session.
- `GET /api/lark/oauth/connect` in an OAuth popup.
- `POST /api/lark/base/disconnect` to revoke the local Lark session.
- a task-sync endpoint under `/api/lark/base/`; the reconstruction safely reads either `records` or `tasks` from its response.

## Preserved legacy patches

1. Task rows are semantic `<p>` elements, never wrapping `<label>` elements; double-click toggles completion.
2. Locale changes remove `dbindex_mantras` and `dbindex_quotes` before saving the new locale, forcing localized seed data.
3. `showCompletedTasks` is a persisted setting and controls the task filtering predicate.
4. A connected Lark integration renders **Disconnect**, posts to the recovered disconnect endpoint, and clears `lark_connected`.

## New source layout

- `src/App.tsx`: dashboard layout and persistence wiring.
- `src/components/Clock.tsx`: live clock widget.
- `src/components/TaskList.tsx`: task list and completed-task toggle.
- `src/components/SettingsModal.tsx`: settings, mantras and Lark integration.
- `src/storage.ts`: typed local persistence and language-aware mantra seeding.

Static extension assets from the export are copied into `public/`. The Vite build emits its
compiled `assets/` and `index.html` into the repository root, which remains the Chrome
unpacked-extension directory.
