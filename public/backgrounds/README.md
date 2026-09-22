# Backgrounds

The canonical manifest is `packages/shared/data/backgrounds.json`. The web API exposes it at `/api/backgrounds`, so deploying `apps/web` publishes changes to installed extensions without an extension release.

The extension loads the API manifest first and falls back to this local `backgrounds.json` only when offline or when the API is unavailable. The extension build synchronizes this fallback from the canonical manifest. Automatic background rotation refreshes the manifest every hour; the API cache is limited to five minutes.

Keep direct, browser-viewable image URLs in `imageUrl`. The runtime uses `imageUrl` first, then `filename`, then `sourceUrl`.
