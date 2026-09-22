import { apiConfig, apiUrl } from '../config/api'
import { readCached, writeCached } from './indexedDb'

export class ApiRequestError extends Error {
  constructor(message: string, readonly cause?: unknown) { super(message); this.name = 'ApiRequestError' }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), apiConfig.timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal, credentials: init.credentials ?? 'include' })
  } catch (error) {
    throw new ApiRequestError('API is unavailable', error)
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchWithTimeout(apiUrl(path), init)
  if (!response.ok) throw new ApiRequestError(`API request failed (${response.status})`)
  try { return await response.json() as T } catch (error) { throw new ApiRequestError('API returned invalid JSON', error) }
}

export type SyncResult<T> = { data: T; source: 'network' | 'indexeddb' | 'fallback'; error?: unknown }
type SyncOptions<T> = { cacheKey: string; localStorageKey?: string; fallback: T; fetcher(): Promise<T> }

/**
 * Network success is the only condition that overwrites a cache. Any failure returns the
 * existing IndexedDB value, then localStorage, then the supplied fallback — never an empty
 * replacement that could erase an offline user's state.
 */
export async function syncWithCache<T>({ cacheKey, localStorageKey, fallback, fetcher }: SyncOptions<T>): Promise<SyncResult<T>> {
  try {
    const data = await fetcher()
    await writeCached(cacheKey, data)
    if (localStorageKey) localStorage.setItem(localStorageKey, JSON.stringify(data))
    return { data, source: 'network' }
  } catch (error) {
    try {
      const cached = await readCached<T>(cacheKey)
      if (cached) return { data: cached.value, source: 'indexeddb', error }
    } catch {
      // IndexedDB itself may be unavailable (private mode/quota); localStorage remains safe.
    }
    if (localStorageKey) {
      try {
        const raw = localStorage.getItem(localStorageKey)
        if (raw !== null) return { data: JSON.parse(raw) as T, source: 'indexeddb', error }
      } catch {
        // Corrupt data is ignored; it is never deleted here.
      }
    }
    return { data: fallback, source: 'fallback', error }
  }
}
