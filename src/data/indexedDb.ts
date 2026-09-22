/** A small, dependency-free IndexedDB cache. It never clears data during reads or failed syncs. */
const DATABASE_NAME = 'luxe_offline_cache'
const DATABASE_VERSION = 1
const STORE_NAME = 'resources'

export type CachedResource<T> = { key: string; value: T; updatedAt: number }

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'key' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Unable to open IndexedDB'))
  })
}

export async function readCached<T>(key: string): Promise<CachedResource<T> | undefined> {
  const database = await openDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key)
      request.onsuccess = () => resolve(request.result as CachedResource<T> | undefined)
      request.onerror = () => reject(request.error ?? new Error(`Unable to read cache: ${key}`))
    })
  } finally {
    database.close()
  }
}

export async function writeCached<T>(key: string, value: T): Promise<CachedResource<T>> {
  const record: CachedResource<T> = { key, value, updatedAt: Date.now() }
  const database = await openDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error ?? new Error(`Unable to write cache: ${key}`))
    })
    return record
  } finally {
    database.close()
  }
}
