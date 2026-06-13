'use client'

import type { AppData } from './types'
import { emptyAppData, CURRENT_DATA_VERSION } from './types'

/**
 * Persistence layer for Nova Finanzas AI.
 *
 * Strategy: IndexedDB preferred (robust, large capacity, survives PWA
 * install), with an automatic fallback to localStorage when IndexedDB is
 * unavailable (private mode, old browsers, SSR). The public API is async so
 * the rest of the app does not care which backend is used — and so it can be
 * swapped for Supabase later without touching callers.
 */

const DB_NAME = 'nova-finanzas'
const STORE_NAME = 'app'
const DATA_KEY = 'data'
const LS_KEY = 'nova-finanzas:data'

let dbPromise: Promise<IDBDatabase> | null = null

function hasIndexedDB(): boolean {
  try {
    return typeof indexedDB !== 'undefined'
  } catch {
    return false
  }
}

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function idbGet(): Promise<AppData | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(DATA_KEY)
    req.onsuccess = () => resolve((req.result as AppData) ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(data: AppData): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(data, DATA_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function lsGet(): AppData | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as AppData) : null
  } catch {
    return null
  }
}

function lsSet(data: AppData): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch {
    // ignore quota / availability errors
  }
}

/** Migrate older persisted shapes to the current version. */
function migrate(data: AppData | null): AppData {
  if (!data) return emptyAppData()
  if (typeof data.version !== 'number' || data.version < CURRENT_DATA_VERSION) {
    return { ...emptyAppData(), ...data, version: CURRENT_DATA_VERSION }
  }
  return data
}

export const storage = {
  async load(): Promise<AppData> {
    if (typeof window === 'undefined') return emptyAppData()
    try {
      if (hasIndexedDB()) {
        const data = await idbGet()
        // If IndexedDB is empty but localStorage has data, migrate it in.
        if (!data) {
          const legacy = lsGet()
          if (legacy) {
            const migrated = migrate(legacy)
            await idbSet(migrated)
            return migrated
          }
        }
        return migrate(data)
      }
    } catch {
      // fall through to localStorage
    }
    return migrate(lsGet())
  },

  async save(data: AppData): Promise<void> {
    if (typeof window === 'undefined') return
    // Always mirror to localStorage as a safety net.
    lsSet(data)
    try {
      if (hasIndexedDB()) {
        await idbSet(data)
      }
    } catch {
      // localStorage already holds the data
    }
  },

  async clear(): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(LS_KEY)
    } catch {
      // ignore
    }
    try {
      if (hasIndexedDB()) {
        const db = await openDB()
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).delete(DATA_KEY)
      }
    } catch {
      // ignore
    }
  },
}
