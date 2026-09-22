# Luxe reverse-engineering handoff

Updated: 2026-09-21 (handoff after version 2.5.16)

## User objective

Rebuild the precompiled Luxe Chrome New Tab extension as Vite + React + TypeScript + Tailwind, without Next.js, while preserving four legacy patches:

1. Task rows must be `<p>` rather than `<label>` (double-click completion bug).
2. Changing language must remove `dbindex_mantras` and `dbindex_quotes` first.
3. `showCompletedTasks` must persist and control completed-task visibility.
4. Lark needs a Disconnect action: `POST http://localhost:3000/api/lark/base/disconnect`, clear `lark_connected`.

## Legacy analysis already completed

- Original application chunk: `next/static/chunks/1bd8a6f1e7c95853.js`.
- Translation/UI text chunk: `next/static/chunks/112e1f47fbd02a1f.js`.
- Legacy app uses a full-screen image background, large clock/greeting/mantra, floating Top Sites at right, circular controls, quote bottom-center, and Tasks controls bottom-right.
- Lark endpoints confirmed from the minified code:
  - `GET /api/lark/base/ping`
  - `GET /api/lark/oauth/connect`
  - `POST /api/lark/base/disconnect`
  - `POST /api/lark/base/records?app_token=...&table_id=...`
- More complete notes are in `REVERSE_ENGINEERING.md`.

## Source state

- Components: `src/components/Clock.tsx`, `TaskList.tsx`, `SettingsModal.tsx`.
- Main visual implementation: `src/App.tsx`.
- Persistence: `src/storage.ts`.
- Build tooling: `package.json`, `vite.config.ts`.
- Static legacy assets were copied to `public/` and `dist/` exists from prior builds.

### Components ported so far

- `Clock.tsx`: compact old-style 24-hour clock with date row.
- `TaskList.tsx`: dark floating task panel. It intentionally uses `<p>` rows rather than `<label>`.
- `NotesPanel.tsx`: floating notes panel with search, local note creation and empty state.
- `SettingsModal.tsx`: settings persistence, language reset, mantras and Lark controls.

## Reversed Notes and Task UI (from source, not screenshots)

Primary source: `next/static/chunks/1bd8a6f1e7c95853.js`.

### Glass primitives

The old CSS definition is in `next/static/chunks/d937582b5e9579c6.css` and has been ported into `src/styles.css`:

- `.luxe-glass-surface`: `border: 1px solid var(--luxe-glass-border)`, background, `backdrop-filter: blur(4px)`.
- `.luxe-glass-surface--panel`: panel background, `blur(20px) saturate(140%)`, `0 24px 72px #0f172a38` shadow.
- `.luxe-glass-surface--dark-panel`: `#07110fe0`, `blur(24px) saturate(140%)`, `0 28px 80px #0000007a` shadow.
- `.luxe-glass-surface--action`: floating background `#07110f8f`, border `#ffffff2e`; hover uses `#07110fb8` / `#ffffff52`.

### Notes component

The old code renders its note-list popup as:

- `fixed right-6 bottom-20 z-40 w-[320px] max-w-[calc(100vw-3rem)]`
- `rounded-2xl border border-white/15 dark:bg-[#0f0f0f00] ... backdrop-saturate-200 backdrop-blur-xl`
- shadow `0 24px 60px -30px rgba(0,0,0,.7)`.
- Header has `My Notes`, count pill, circular plus/close buttons.
- Search uses `mx-3 mt-3 ... rounded-xl border border-white/10 bg-black/10 px-3 py-2`.
- Empty content uses `rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70`.
- Original notes button is at `fixed bottom-6`; when task button exists it is `right-24`, otherwise `right-6`.

### Task component

The actual primary implementation is `function c7(...)` in `1bd8a6f1e7c95853.js`.

- It is invoked inside a wrapper: `fixed bottom-6 right-6 z-20`.
- Therefore it is a floating task popover, **not** a screen-wide modal.
- Compact mode was recovered exactly from `c7`: `h-[172px] w-[526px] max-w-[calc(100vw-32px)] rounded-[10px]`, displaying `today.slice(0, 3)` only.
- Expanded mode was recovered exactly from `c7`: `h-[50vh] w-[50vw] max-h-[calc(100vh-32px)] max-w-[calc(100vw-32px)] rounded-[12px]`. The title and expand icon enter it; its collapse icon returns to compact mode.
- The bottom Tasks icon is a true toggle (`setTasksOpen(value => !value)`), so clicking it a second time closes the popover.
- Compact card source classes include `px-7 py-6`, a radial/linear dark gradient, and header title `tasks.today.title` with a down chevron, more button and expand button.
- Task items are filtered by `settings.showCompletedTasks`; when false, legacy behavior uses `tasks.filter(task => task.status !== 'done')`.
- Old task views: `today`, `upcoming`, `inbox`, `completed`; custom lists are also present but are not yet ported.
- Legacy quick controls include date picker, subtask, focus mode, daily goal, duplicate, delete, clearing completed, manual sort, add tasks, show completed, and `taskPopoverStayOpen`.

## Current UI decisions confirmed by user

- Clock/date compact style should stay.
- Greeting is large.
- Mantra sits below greeting, can be clicked to rotate; do not render a separate change button.
- Current mantra sizing is `clamp(22px, 2.6vw, 42px)` (user preferred this over the previous oversized variant).
- Notes glass treatment is close to target.
- Task panel must stay floating, not cover/fill the page.
- The shared font must remain the original Tailwind system stack (`ui-sans-serif, system-ui, ...`), not an added web font such as Be Vietnam Pro.
- Notes must use the original transparent saturated glass (`backdrop-saturate-200 backdrop-blur-xl`) rather than an opaque dark card.
- `src/components/Icons.tsx` now ports the legacy Lucide SVG paths directly from `1bd8a6f1e7c95853.js`; avoid replacing these with Unicode glyphs.

## Current critical issue: Chrome displaying stale UI

The user repeatedly saw the first reconstructed UI (Luxe logo/header, Settings pill, task sidebar at left) even after Chrome recognized manifest version `2.5.6`. Root cause found: the old Vite configuration built into the repository root and overwrote the Vite HTML source. Future Vite builds therefore re-packaged the old root asset rather than `src/App.tsx`.

Mitigation currently applied:

- Root `manifest.json` now has version **2.5.23**.

## API/offline rewrite foundation (2.5.20)

- `src/config/api.ts` is the sole API origin configuration. It uses localhost in Vite dev and `VITE_API_BASE_URL` for a Vercel `/api` deployment.
- `src/data/indexedDb.ts` owns IndexedDB cache access (`luxe_offline_cache/resources`).
- `src/data/apiClient.ts` exposes `syncWithCache`. It writes IndexedDB/localStorage only after a successful response. Failure returns the existing IndexedDB value, then localStorage, and does not delete any photo/favorite/offline data.
- Settings Lark endpoints now use `apiUrl` / `requestJson`; no API URL is hardcoded in the component. Disconnect removes `lark_connected` and reloads even if the endpoint is offline.
- `chrome_url_overrides.newtab` was changed from `index.html` to `newtab.html`.
- `newtab.html` is a compiled HTML entry pointing to the verified latest root assets:
  - filenames are hashed and updated on every build; read root `newtab.html` rather than hardcoding them.
- Verify that its referenced JS bundle contains expected strings before asking user to reload.

The user must Reload the extension in `chrome://extensions`, confirm version `2.5.7`, then open a fresh New Tab. If it still displays the old UI, investigate Chrome extension resource caching and verify the extension root is exactly `C:\Users\Duong\Documents\GitHub\luxe-base`.

## Important build caveat

`vite.config.ts` now builds from the separate `build.html` source into `dist/`; this prevents source HTML from being overwritten. The resulting `dist/build.html` must be copied to root `newtab.html`, with its generated JS/CSS assets copied to root `assets/`. Copy the *contents* of `dist/assets/`, not the folder itself—copying the folder creates `assets/assets/` and causes a blank New Tab because the HTML cannot find its JS module.

## Visual target supplied by user

Reference screenshots were submitted in this conversation. Target visual characteristics:

- Large 24-hour clock, center at roughly 40–45% viewport height.
- Large English greeting with Vietnamese user name beneath the clock.
- Mantra below greeting.
- Floating brown/translucent Top Sites card at right-center.
- Top-left small outline icon; three circular control buttons at top-right.
- Bottom-left customize icon, bottom-center quote, bottom-right `Tasks` label with two circular buttons.
- Background image is dynamic/user-selected and need not match the screenshot exactly.

## Next recommended actions

1. Add a post-build script that copies `dist/build.html` to root `newtab.html`, copies **contents** of `dist/assets/` to root `assets/`, and copies `manifest.json` to `dist/`. Do not copy the `assets` folder as a folder (it creates `assets/assets` and a blank page).
2. Reverse and port actual icons rather than Unicode placeholders. The legacy build uses Lucide icons; relevant icon usages surround `function c7` and the notes popup in `1bd8a6f1e7c95853.js`.
3. Finish the task views/custom lists/subtasks and actual Top Sites from `chrome.topSites`.
4. Finish editable notes / draggable note windows from `y8` in the primary chunk.
5. Expand remaining original features: weather, calendar, background selection, reminders and focus mode.

## Latest reverse pass (2.5.23)

- The latest bundle is verified in root `newtab.html` and points to `assets/build-BZV8-q1c.js`.
- `TaskList.tsx` was compared directly to `function c7` in `next/static/chunks/1bd8a6f1e7c95853.js`. Its mini shell is exactly `526 × 172px`; notes remains the legacy `320px` shell. The compact task header and rows now use the legacy font calculations, 16px internal left inset, 22px rounded-square status control, more-options icon, and expand/collapse dimensions.
- The user-required replacement of the old task `<label>` wrapper is retained: the outer task row is a `<p>`, and the status control stops double-click bubbling.
- `SettingsModal.tsx` now derives navigation labels, visible options, content editors, task controls, Lark labels/actions, and photo-panel labels from one Vietnamese/English dictionary. Switching locale updates Settings without touching the photo cache.
- The first twelve Luxe wallpaper names have an English title map. `Photos` shows that map only for locale `en`; Vietnamese retains the original title in `backgrounds/backgrounds.json`.

## Notes and task editing pass (2.5.24)

- Vietnamese Settings now uses **“Thần chú”** for the Mantras tab, heading, and add control.
- `function y8` in `next/static/chunks/1bd8a6f1e7c95853.js` was ported into `src/components/NotesPanel.tsx`: opening a note now produces the separate `420×520px` editor with a drag handle, resize support, collapse, blur/color background switch, palette cycle, delete/close actions, and the recovered rich-text toolbar commands.
- Note content is stored as a restricted safe HTML subset in `dbindex_notes`; unsafe tags and all HTML attributes are stripped before persistence. Open-note ids are persisted in `luxe_open_sticky_notes`.
- Task title editing now mirrors `c7`: double-click the title/row to enter its inline input, press Enter or blur to save, or Escape to cancel. The task wrapper remains a `<p>` as required; completion is only the 22px status button.
- Current root bundle for this pass: `assets/build-CSbNfWqf.js`; extension manifest version: **2.5.24**.

## Repository checkpoint

- This folder did not contain Git metadata or a configured remote when the checkpoint was requested.
- A local Git repository was initialized on `main`; the initial, verified snapshot is commit `4406a09` (`feat: rebuild luxe new tab frontend`).
- `.gitignore` excludes dependencies, Vite `dist/`, TypeScript build info, obsolete bundles, and the accidental `assets/assets/` duplicate directory. It keeps the two hashed files used by root `newtab.html`.
- GitHub remote still needs the user's exact repository URL or an explicit choice to create a new public/private repository. The candidate inferred from Git identity, `https://github.com/11h12/luxe-base.git`, was checked read-only and was not found or was inaccessible; it was not added as a remote.
