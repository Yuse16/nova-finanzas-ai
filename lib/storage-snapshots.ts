'use client'

import type { FinancialSnapshot } from './types'

const DB_NAME = 'nova-finanzas-snapshots'
const STORE_NAME = 'snapshots'
const DATA_KEY = 'all'
const LS_KEY = 'nova-finanzas:snapshots'

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

async function idbGet(): Promise<FinancialSnapshot[] | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(DATA_KEY)
    req.onsuccess = () => resolve((req.result as FinancialSnapshot[]) ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(snapshots: FinancialSnapshot[]): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(snapshots, DATA_KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

function lsGet(): FinancialSnapshot[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as FinancialSnapshot[]) : null
  } catch {
    return null
  }
}

function lsSet(snapshots: FinancialSnapshot[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(snapshots))
  } catch {
    // ignore quota / availability errors
  }
}

export const snapshotStorage = {
  async loadSnapshots(): Promise<FinancialSnapshot[]> {
    if (typeof window === 'undefined') return []
    try {
      if (hasIndexedDB()) {
        const data = await idbGet()
        if (!data) {
          const legacy = lsGet()
          if (legacy) {
            await idbSet(legacy)
            return legacy
          }
        }
        return data ?? []
      }
    } catch {
      // fall through to localStorage
    }
    return lsGet() ?? []
  },

  async saveSnapshot(snapshot: FinancialSnapshot): Promise<void> {
    if (typeof window === 'undefined') return
    const current = await snapshotStorage.loadSnapshots()
    const updated = [snapshot, ...current]
    lsSet(updated)
    try {
      if (hasIndexedDB()) {
        await idbSet(updated)
      }
    } catch {
      // localStorage already holds the data
    }
  },

  async clearSnapshots(): Promise<void> {
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
