/**
 * The only place that knows where the optional Next.js API lives.
 *
 * Configure production by setting VITE_API_BASE_URL at build time, for example:
 *   VITE_API_BASE_URL=https://your-project.vercel.app/api
 * No component may embed an API origin or an `/api` prefix.
 */
const LOCAL_API_BASE_URL = 'http://localhost:3000/api'
const DEFAULT_PRODUCTION_API_BASE_URL = 'https://luxe-new-tab.vercel.app/api'

function withoutTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export const apiConfig = Object.freeze({
  baseUrl: withoutTrailingSlash(import.meta.env.VITE_API_BASE_URL
    ?? (import.meta.env.DEV ? LOCAL_API_BASE_URL : DEFAULT_PRODUCTION_API_BASE_URL)),
  timeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 8_000),
})

/** Builds a URL under the configured `/api` base. `path` must start with `/`. */
export function apiUrl(path: string) {
  return `${apiConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}
